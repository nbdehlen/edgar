export class ResourceCache<T> {
  private readonly entries = new Map<string, { value: T; expiresAt: number }>();
  private readonly pending = new Map<string, Promise<T>>();

  constructor(private readonly ttlMs: number) {}

  async get(key: string, load: () => Promise<T>): Promise<T> {
    const entry = this.entries.get(key);
    if (entry && entry.expiresAt > Date.now()) {
      return entry.value;
    }
    // Remove expired data before refreshing so failures cannot return stale values.
    this.entries.delete(key);
    const pending = this.pending.get(key);
    if (pending) return pending;

    // Defer the loader until its promise is registered for concurrent callers to share.
    const request = Promise.resolve()
      .then(load)
      .then((value) => {
        this.entries.set(key, { value, expiresAt: Date.now() + this.ttlMs });
        return value;
      })
      .finally(() => this.pending.delete(key));
    this.pending.set(key, request);
    return request;
  }
}
