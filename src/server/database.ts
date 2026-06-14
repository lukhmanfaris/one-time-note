import { NoteMetadata } from "./types";

export class NoteDatabase {
  constructor(private db: D1Database) {}

  async createNote(params: {
    id: string;
    userId: string | null;
    lookupId: string;
    ttlSeconds: number;
    expiresAt: string;
  }): Promise<NoteMetadata> {
    await this.db
      .prepare(
        "INSERT INTO notes (id, user_id, lookup_id, ttl_seconds, status, expires_at) VALUES (?, ?, ?, ?, 'active', ?)"
      )
      .bind(params.id, params.userId, params.lookupId, params.ttlSeconds, params.expiresAt)
      .run();

    return {
      id: params.id,
      user_id: params.userId,
      lookup_id: params.lookupId,
      ttl_seconds: params.ttlSeconds,
      created_at: new Date().toISOString(),
      status: "active",
      expires_at: params.expiresAt,
      read_at: null,
    };
  }

  async getNoteByKey(lookupId: string): Promise<NoteMetadata | null> {
    const result = await this.db
      .prepare("SELECT id, user_id, lookup_id, ttl_seconds, created_at, status, expires_at, read_at FROM notes WHERE lookup_id = ? AND status = 'active'")
      .bind(lookupId)
      .first<NoteMetadata>();
    return result ?? null;
  }

  async claimNote(lookupId: string): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.db
      .prepare("UPDATE notes SET status = 'claimed', read_at = ? WHERE lookup_id = ? AND status = 'active'")
      .bind(now, lookupId)
      .run();
    return result.meta.changes > 0;
  }

  async deleteExpiredNotes(): Promise<number> {
    const result = await this.db
      .prepare("DELETE FROM notes WHERE expires_at <= datetime('now') OR read_at IS NOT NULL")
      .run();
    return result.meta.changes;
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