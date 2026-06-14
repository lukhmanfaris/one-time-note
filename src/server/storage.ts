import { NoteData } from "./types";

const KEY_PREFIX = "note:";

export class NoteStorage {
  constructor(private kv: KVNamespace) {}

  async save(lookupId: string, data: NoteData, ttlSeconds: number): Promise<void> {
    const key = `${KEY_PREFIX}${lookupId}`;
    const value = JSON.stringify(data);
    await this.kv.put(key, value, { expirationTtl: ttlSeconds });
  }

  async retrieve(lookupId: string): Promise<NoteData | null> {
    const key = `${KEY_PREFIX}${lookupId}`;
    const raw = await this.kv.get(key);
    if (!raw) return null;
    await this.kv.delete(key);
    return JSON.parse(raw) as NoteData;
  }

  async exists(lookupId: string): Promise<boolean> {
    const key = `${KEY_PREFIX}${lookupId}`;
    const raw = await this.kv.get(key);
    return raw !== null;
  }

  async delete(lookupId: string): Promise<void> {
    const key = `${KEY_PREFIX}${lookupId}`;
    await this.kv.delete(key);
  }
}