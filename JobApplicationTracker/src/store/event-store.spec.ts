import { afterEach, describe, expect, it, vi } from "vitest";
import { createEventStore, migrateEventStoreSchema } from "./event-store.js";

describe("createEventStore", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws clearly when DATABASE_URL is unset", () => {
    vi.stubEnv("DATABASE_URL", "");
    expect(() => createEventStore()).toThrow(/DATABASE_URL/);
  });

  it("returns a usable store when DATABASE_URL is set (from the shared testcontainer)", () => {
    expect(() => createEventStore()).not.toThrow();
  });
});

describe("migrateEventStoreSchema", () => {
  it("succeeds against the shared (already-migrated) schema", async () => {
    const store = createEventStore();
    await migrateEventStoreSchema(store);
    await store.close();
  });
});
