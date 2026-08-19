# Contract: `src/store/event-store.ts` (modified)

```text
createEventStore(): PostgresEventStore
```

- Reads `process.env.DATABASE_URL`; throws synchronously with a clear message if unset (fail
  fast, before any connection attempt).
- Returns the store from `getPostgreSQLEventStore(connectionString)` — callers use it exactly as
  they used `InMemoryEventStore` before (same `EventStore` interface).

```text
migrateEventStoreSchema(store: PostgresEventStore): Promise<void>
```

- Calls `store.schema.migrate()`. Rethrows on failure with the underlying error preserved — the
  caller (`src/http/server.ts`) is responsible for logging and exiting (spec.md FR-008).

# Contract: `src/store/application-index.ts` (new, replaces `application-registry.ts`)

```text
createApplicationIndex(store: PostgresEventStore): ApplicationIndex

type ApplicationIndex = {
  register: (applicationId: string) => Promise<void>;
  list: () => Promise<string[]>;
};
```

- `register`: inserts one row into the `applications` table (data-model.md). Called once, from
  `submit-application/route.ts`, immediately after the `SubmitApplication` event is successfully
  appended.
- `list`: returns every known `applicationId`, across the table's full history — including
  applications created in a previous run of the process (spec.md FR-005), which is exactly what
  the old in-memory registry could never do.

This is a straight signature match with the old `ApplicationRegistry` type
(`register`/`list`) — call sites in `active-pipeline/route.ts` and `ghosting/route.ts` change only
by the property rename (`applicationRegistry` → `applicationIndex`) and by `list()` now being
async (it was synchronous over an in-memory `Set` before; it's an `await`ed SQL query now).
