/** Optional runtime dependency — declared so tsc does not require `redis` installed. */
declare module 'redis' {
  export function createClient(opts: { url: string }): {
    on(event: string, cb: (err: Error) => void): void;
    connect(): Promise<void>;
    get(key: string): Promise<string | null>;
    set(key: string, value: string, opts?: { EX?: number }): Promise<unknown>;
    del(key: string): Promise<unknown>;
    incr(key: string): Promise<number>;
    expire(key: string, sec: number): Promise<unknown>;
    ping(): Promise<string>;
  };
}
