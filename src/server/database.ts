import { NoteMetadata } from "./types";

export class NoteDatabase {
  constructor(private db: D1Database) {}

  async createNote(params: {
    id: string;
    userId: string | null;
    accessKey: string;
    ttlSeconds: number;
  }): Promise<NoteMetadata> {
    await this.db
      .prepare(
        "INSERT INTO notes (id, user_id, access_key, ttl_seconds, status) VALUES (?, ?, ?, ?, 'active')"
      )
      .bind(params.id, params.userId, params.accessKey, params.ttlSeconds)
      .run();

    return {
      id: params.id,
      user_id: params.userId,
      access_key: params.accessKey,
      ttl_seconds: params.ttlSeconds,
      created_at: new Date().toISOString(),
      status: "active",
    };
  }

  async getNoteByKey(accessKey: string): Promise<NoteMetadata | null> {
    const result = await this.db
      .prepare("SELECT * FROM notes WHERE access_key = ? AND status = 'active'")
      .bind(accessKey)
      .first<NoteMetadata>();
    return result ?? null;
  }

  async claimNote(accessKey: string): Promise<boolean> {
    const result = await this.db
      .prepare("UPDATE notes SET status = 'claimed' WHERE access_key = ? AND status = 'active'")
      .bind(accessKey)
      .run();
    return result.meta.changes > 0;
  }

  async countActiveNotesByUser(userId: string): Promise<number> {
    const result = await this.db
      .prepare("SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND status = 'active'")
      .bind(userId)
      .first<{ count: number }>();
    return result?.count ?? 0;
  }
}

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  tier: string;
  created_at: string;
  updated_at: string;
}

export class UserDatabase {
  constructor(private db: D1Database) {}

  async findUserByEmail(email: string): Promise<UserRow | null> {
    return this.db
      .prepare("SELECT * FROM users WHERE email = ?")
      .bind(email)
      .first<UserRow>() ?? null;
  }

  async findUserById(id: string): Promise<UserRow | null> {
    return this.db
      .prepare("SELECT * FROM users WHERE id = ?")
      .bind(id)
      .first<UserRow>() ?? null;
  }

  async createUser(params: {
    id: string;
    email: string;
    passwordHash: string;
    tier?: string;
  }): Promise<UserRow> {
    const tier = params.tier || "free";
    await this.db
      .prepare("INSERT INTO users (id, email, password_hash, tier) VALUES (?, ?, ?, ?)")
      .bind(params.id, params.email, params.passwordHash, tier)
      .run();

    return {
      id: params.id,
      email: params.email,
      password_hash: params.passwordHash,
      tier,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await this.db
      .prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
      .bind(passwordHash, userId)
      .run();
  }

  async countActiveNotes(userId: string): Promise<number> {
    const result = await this.db
      .prepare("SELECT COUNT(*) as count FROM notes WHERE user_id = ? AND status = 'active'")
      .bind(userId)
      .first<{ count: number }>();
    return result?.count ?? 0;
  }
}