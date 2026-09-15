import type { Queue } from './types';
import { createMemoryQueue } from './memory-queue';

let singleton: Queue | null = null;

/** Process-local queue singleton (memory). Cross-process needs Redis/BullMQ later. */
export function getQueue(): Queue {
  if (!singleton) singleton = createMemoryQueue();
  return singleton;
}

/** Tests only */
export function setQueueForTests(q: Queue | null): void {
  singleton = q;
}
