import { NoteData } from "./types";

const KEY_PREFIX = "note:";

export class NoteStorage {
  constructor(private kv: KVNamespace) {}

  async save(accessKey: string, data: NoteData, ttlSeconds: number): Promise<void> {
    const key = `${KEY_PREFIX}${accessKey}`;
    const value = JSON.stringify(data);
    await this.kv.put(key, value, { expirationTtl: ttlSeconds });
  }

  async retrieve(accessKey: string): Promise<NoteData | null> {
    const key = `${KEY_PREFIX}${accessKey}`;
    const raw = await this.kv.get(key);
    if (!raw) return null;
    await this.kv.delete(key);
    return JSON.parse(raw) as NoteData;
  }
}