# G-04 · 财务事务总局 (General Administration of Affairs Finance)

Self-contained copy of everything under the **财务事务总局 (G-04)** menu, split
into the two sub-departments. `src/App.jsx` remains the **live source of truth**
that the app actually renders; this folder is a mirrored copy so each
department's page content can be read, maintained, and handed off independently
(intentional duplication).

## Layout

```
src/G04/
├─ shared.jsx              # Generic UI + helpers + a local store shim (verbatim
│                          #   mirror of App.jsx infra used by the G-04 pages)
├─ plazaG04.js             # PLAZA_G04 — Business Plaza model (shared by both)
├─ flowG04.jsx             # MF_G04 + FlowG04 — directorate-level combined flow
│
├─ entitlements/           # 财务权益部 (Financial Entitlements · entwork · UC-08)
│  ├─ flow.jsx             #   MF_G04_ENT + FLOW_ENT + <FlowG04Ent/>
│  ├─ workspace.jsx        #   WS_CFG_ENT + <EntitlementsWorkspace/>
│  ├─ bench.jsx            #   BENCH_UC08 (UC-08 analysis workbench config)
│  └─ index.js
│
├─ audit/                  # 审计部 (Audit · audwork · UC-03)
│  ├─ flow.jsx             #   MF_G04_AUD + FLOW_AUD + <FlowG04Aud/>
│  ├─ workspace.jsx        #   WS_CFG_AUDIT + <AuditWorkspace/>
│  ├─ bench.jsx            #   BENCH_UC03 (UC-03 analysis workbench config)
│  └─ index.js
│
└─ index.js                # barrel — `import { EntitlementsWorkspace } from "./G04"`
```

## What maps to which route (in `src/App.jsx`)

| Route         | Component (here)            | File                       |
|---------------|-----------------------------|----------------------------|
| `entwork`     | `EntitlementsWorkspace`     | entitlements/workspace.jsx |
| `audwork`     | `AuditWorkspace`            | audit/workspace.jsx        |
| `g04entflow`  | `FlowG04Ent`                | entitlements/flow.jsx      |
| `g04audflow`  | `FlowG04Aud`                | audit/flow.jsx             |
| `g04flow`     | `FlowG04`                   | flowG04.jsx                |
| `bench08`     | `<UcBench cfg={BENCH_UC08}/>` | entitlements/bench.jsx   |
| `bench03`     | `<UcBench cfg={BENCH_UC03}/>` | audit/bench.jsx          |

## Running standalone

The copied components call `useStore()`, `Money`, `DirectorateFlow`, etc. All of
that is provided **inside this folder** (`shared.jsx`), including a minimal
`G04StoreProvider` store shim so a page renders in isolation without the full
app. To preview one department on its own:

```jsx
import { createRoot } from "react-dom/client";
import { G04StoreProvider } from "./G04/shared.jsx";
import { EntitlementsWorkspace } from "./G04/entitlements";

createRoot(document.getElementById("root")).render(
  <G04StoreProvider initial={{ lang: "zh", route: "entwork" }}>
    <EntitlementsWorkspace />
  </G04StoreProvider>
);
```

The shim returns sensible defaults (default language, no-op setters, a stub
`tr`/`t`). Cross-page navigation (`setRoute`) is no-op in isolation; wiring it
to the real app's store gives full behavior.

## Notes / caveats

- **Verbatim copies.** The component/data blocks were extracted line-for-line
  from `src/App.jsx`. If you fix a bug here, mirror it in `App.jsx` (or vice
  versa) — they are not linked.
- `UcBench` references a few UC-specific tool components (`Uc04Forecaster`, …).
  Those are only mounted when `cfg.tool` is set; the G-04 benches (UC-03/08)
  set none, so they are stubbed to `() => null` in `shared.jsx`.
- `SHOW_UC` is hard-coded to `true` here (show UC-xx codes). `App.jsx` derives
  it from the environment.
- HiAgent live query (`askHiAgent` in `shared.jsx`) is copied as-is; the API key
  is client-side / demo-only, same as in `App.jsx`.
