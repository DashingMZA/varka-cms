export type Job<T = unknown> = {
  id: string;
  name: string;
  payload: T;
  attempts: number;
  createdAt: number;
  runAt: number;
};

export type JobHandler<T = unknown> = (job: Job<T>) => Promise<void>;

export type Queue = {
  enqueue<T>(name: string, payload: T, opts?: { delaySec?: number }): Promise<Job<T>>;
  process(name: string, handler: JobHandler): void;
  /** Drain due jobs once (memory) or tick */
  tick(): Promise<number>;
};
