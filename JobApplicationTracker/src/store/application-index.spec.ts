import { beforeEach, describe, expect, it } from "vitest";
import { createEventStore } from "./event-store.js";
import { createApplicationIndex } from "./application-index.js";
import { resetDatabaseForTests } from "./testing.js";

describe("application index", () => {
  const store = createEventStore();

  beforeEach(resetDatabaseForTests);

  it("register() then list() round-trips the applicationId", async () => {
    const index = createApplicationIndex(store);

    await index.register("app-1");
    await index.register("app-2");
    const ids = await index.list();

    expect(ids.sort()).toEqual(["app-1", "app-2"]);
    await index.close();
  });

  it("a second, independent index instance sees data registered by the first (the restart proxy)", async () => {
    const firstIndex = createApplicationIndex(store);
    await firstIndex.register("app-3");

    const secondIndex = createApplicationIndex(store);
    const ids = await secondIndex.list();

    expect(ids).toEqual(["app-3"]);
    await firstIndex.close();
    await secondIndex.close();
  });
});
