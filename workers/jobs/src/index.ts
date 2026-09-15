import { createMemoryQueue, JobNames } from '@varka/queue';

/**
 * Background worker entry.
 * Phase 7: memory queue tick loop.
 * Note: memory queue is process-local — admin process enqueue will not reach this
 * process until a shared Redis/BullMQ backend is wired.
 */
const queue = createMemoryQueue();

queue.process(JobNames.sendEmail, async (job) => {
  const p = job.payload as { to: string; subject: string; text?: string };
  console.log(`[worker] sendEmail → ${p.to}: ${p.subject}`);
});

queue.process(JobNames.revalidatePath, async (job) => {
  const p = job.payload as { path?: string; tag?: string };
  console.log('[worker] revalidate', p.path ?? p.tag ?? job.payload);
});

queue.process(JobNames.generateSitemap, async () => {
  console.log('[worker] generateSitemap (noop — Astro builds sitemap on request)');
});

queue.process(JobNames.processUpload, async (job) => {
  console.log('[worker] processUpload', job.payload);
});

console.log('[worker] VARKA jobs worker started (memory queue)');
console.log('[worker] handlers:', Object.values(JobNames).join(', '));

setInterval(() => {
  void queue.tick().then((n) => {
    if (n > 0) console.log(`[worker] processed ${n} job(s); depth=${queue.size()}`);
  });
}, 2000);
