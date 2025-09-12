type Entry<V> = { value: V; expires: number };
export class LRU<K, V> {
  private max: number;
  private ttl: number;
  private map = new Map<K, Entry<V>>();
  constructor(max=100, ttlMs=5 * 60 * 1000){ this.max=max; this.ttl=ttlMs; }
  get(key: K): V | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (Date.now() > e.expires) { this.map.delete(key); return undefined; }
    this.map.delete(key); this.map.set(key, e); // bump
    return e.value;
    }
  set(key: K, value: V){
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expires: Date.now() + this.ttl });
    if (this.map.size > this.max){
      const first = this.map.keys().next().value;
      this.map.delete(first);
    }
  }
}
export const cache = new LRU<string, any>(128, 10 * 60 * 1000); // 10 min