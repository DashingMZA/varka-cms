import { randomBytes } from 'node:crypto';
import type { Job, JobHandler, Queue } from './types';

export function createMemoryQueue(): Queue {
  const jobs: Job[] = [];
  const handlers = new Map<string, JobHandler>();

  return {
    async enqueue(name, payload, opts) {
      const job: Job = {
        id: randomBytes(8).toString('hex'),
        name,
        payload,
        attempts: 0,
        createdAt: Date.now(),
        runAt: Date.now() + (opts?.delaySec ?? 0) * 1000,
      };
      jobs.push(job);
      return job as Job<typeof payload>;
    },
    process(name, handler) {
      handlers.set(name, handler as JobHandler);
    },
    async tick() {
      const now = Date.now();
      let processed = 0;
      const due = jobs.filter((j) => j.runAt <= now);
      for (const job of due) {
        const idx = jobs.indexOf(job);
        if (idx >= 0) jobs.splice(idx, 1);
        const handler = handlers.get(job.name);
        if (!handler) continue;
        job.attempts += 1;
        try {
          await handler(job);
          processed += 1;
        } catch (e) {
          if (job.attempts < 3) {
            job.runAt = Date.now() + job.attempts * 5000;
            jobs.push(job);
          } else {
            console.error('[varka/queue] job failed permanently', job.name, job.id, e);
          }
        }
      }
      return processed;
    },
  };
}
