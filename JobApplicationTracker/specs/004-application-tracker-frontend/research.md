# Phase 0 Research: Application Tracker Frontend

Two decisions were resolved directly with the user before planning (recorded here per the
research task format); the rest follow from them.

## Decision: Vanilla JavaScript, no framework, no browser build step

- **Decision**: Plain JavaScript ES modules, loaded directly by the browser via `<script
  type="module">` — no React/Vue/etc., no TypeScript-for-the-browser (which would require a
  transpile step), no bundler.
- **Rationale**: User-confirmed. This project's purpose is Emmett/event-sourcing practice
  (`docs/BRIEF.md`); the frontend exists to make the tracker usable, not to be a second practice
  surface. Modern evergreen browsers support ES modules natively, so "no build step" is achievable
  without sacrificing module structure.
- **Alternatives considered**: React (user declined — pulls in a framework + bundler for a project
  whose stated purpose is elsewhere); TypeScript compiled to browser JS via `tsc` (rejected — adds
  a second build target/step for marginal benefit in a small, single-contributor UI).

## Decision: Static serving via the existing Fastify server, `@fastify/static`

- **Decision**: `src/http/app.ts` registers `@fastify/static` pointing at a new `public/`
  directory; the frontend is served from the same origin and port as feature 003's API
  (`http://localhost:5000`).
- **Rationale**: User-confirmed. One server, one port, no CORS configuration needed — the simplest
  serving model for a single-user local tool.
- **Alternatives considered**: A separate dev server (e.g. Vite dev server) proxying to the API
  (user declined — more moving parts than this project needs).

## Decision: Hash-based client-side routing, no router library

- **Decision**: A minimal `router.js` listens for `hashchange` and swaps which view element is
  visible inside `index.html`, based on `#/`, `#/new`, and `#/applications/:id`.
- **Rationale**: Consistent with the vanilla-JS decision — a router library would be exactly the
  kind of dependency just ruled out. Three views is small enough that hand-rolling this is
  straightforward and avoids a full page reload between them (spec.md SC-004: "continuous flow").
- **Alternatives considered**: Separate HTML pages with full navigation/reloads (rejected — works,
  but loses the continuous-flow feel SC-004 asks for, and would duplicate `<head>`/shared markup
  across files); a router library (rejected — unnecessary dependency for three views).

## Decision: Test pure logic with Vitest; verify DOM/fetch wiring manually

- **Decision**: `format.js` (currency/stage-label/idle-time formatting) and `api-client.js`'s
  request-payload-building logic get Vitest unit tests, written first (constitution Principle II).
  `vitest.config.ts`'s `include` glob is extended to also match `public/js/**/*.spec.js`. DOM
  event wiring and the views' rendering logic are verified manually via quickstart.md's browser
  walkthrough — not unit tested.
- **Rationale**: This feature has no command handlers in the Emmett/decider sense for Principle
  II's given-when-then form to apply to directly; the closest fit is testing this feature's own
  pure logic the same way. Introducing a headless-browser testing tool (Playwright, jsdom-based
  component testing, etc.) to cover DOM wiring would be new test infrastructure disproportionate
  to a three-view vanilla-JS UI, and orthogonal to this project's actual practice goal
  (constitution Principle IV, YAGNI).
- **Alternatives considered**: Playwright/Cypress end-to-end tests (rejected — real value, but a
  significant new dependency/skill surface for a personal-tool frontend); jsdom + Testing Library
  for component-level tests (rejected — there are no components in a vanilla, framework-free UI to
  test that way; would mean restructuring views around a testing library's assumptions).

## Decision: Add `GET /applications/:applicationId` to the backend (a gap, not a frontend choice)

- **Decision**: Add one new backend endpoint, as a new `src/read-models/application-detail/` slice
  (`project.ts` aggregating a single stream to its full `Application` state, `route.ts` exposing
  it), returning the application's full state — open or closed.
- **Rationale**: Discovered during Phase 1 design (see `data-model.md`): feature 003's only query
  endpoint is the active-pipeline *list*, which excludes closed applications by design (feature
  001 FR-014) — it cannot serve this feature's detail view, and spec.md explicitly requires the
  detail view to keep showing an application after it closes (Edge Cases: "closed applications
  shown view-only"). This is a genuine backend gap surfaced by frontend requirements, not a
  frontend-side workaround — so it's fixed at the source (a new slice) rather than papered over
  (e.g. by having the frontend remember state client-side, which would violate spec.md SC-003:
  the UI must always reflect the backend's actual state).
- **Alternatives considered**: Have the frontend cache the last-known state of an application
  client-side once it goes missing from the active list (rejected — directly violates SC-003, and
  reintroduces the "is this actually still true on the backend" problem feature 003 was built to
  avoid); extend `GET /applications/active` to optionally include closed applications (rejected —
  would change feature 001/003's already-shipped, already-tested contract for a need that's
  specific to this one view).

## Decision: No CSS framework — plain CSS

- **Decision**: One `style.css`, hand-written, no Tailwind/Bootstrap/etc.
- **Rationale**: Consistent with "vanilla" throughout; spec.md Assumptions explicitly defer visual
  design to implementation, and a CSS framework is unnecessary weight for three simple views.
- **Alternatives considered**: A CSS framework (rejected — unneeded dependency, no stated design
  requirement to justify it).
