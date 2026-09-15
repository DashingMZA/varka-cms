/** Ambient module so optional `redis` dependency typechecks without install. */
declare module 'redis' {
  export function createClient(options: { url: string }): {
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
