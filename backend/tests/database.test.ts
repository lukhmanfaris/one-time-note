import { describe, it, expect } from "vitest";
import { NoteDatabase, UserDatabase } from "../src/database";

describe("NoteDatabase", () => {
  it("NoteDatabase has expected methods", () => {
    const db = new NoteDatabase({} as D1Database);
    expect(typeof db.createNote).toBe("function");
    expect(typeof db.getNoteByKey).toBe("function");
    expect(typeof db.claimNote).toBe("function");
    expect(typeof db.countActiveNotesByUser).toBe("function");
  });
});

describe("UserDatabase class exists", () => {
  it("exports UserDatabase", () => {
    expect(UserDatabase).toBeDefined();
    expect(typeof UserDatabase).toBe("function");
  });
});