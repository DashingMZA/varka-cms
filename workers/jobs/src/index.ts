import { createMemoryQueue, JobNames } from '@varka/queue';

/**
 * Background worker entry.
 * Phase 7: memory queue tick loop. Swap to Redis/BullMQ when REDIS_URL set.
 */
const queue = createMemoryQueue();

queue.process(JobNames.sendEmail, async (job) => {
  const p = job.payload as { to: string; subject: string };
  console.log(`[worker] sendEmail → ${p.to}: ${p.subject}`);
});

queue.process(JobNames.revalidatePath, async (job) => {
  console.log('[worker] revalidate', job.payload);
});

console.log('[worker] VARKA jobs worker started (memory queue)');

setInterval(() => {
  void queue.tick().then((n) => {
    if (n > 0) console.log(`[worker] processed ${n} job(s)`);
  });
}, 2000);
