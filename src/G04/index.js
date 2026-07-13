/* =========================================================================
   G-04 · 财务事务总局 (General Administration of Affairs Finance) — barrel.
   -------------------------------------------------------------------------
   Re-exports every G-04 page so consumers can `import { ... } from "./G04"`.
   This folder is a self-contained COPY of the G-04 content that lives inline
   in src/App.jsx.  App.jsx remains the live source of truth; these files exist
   so the two sub-departments can be maintained / handed off independently.
   ========================================================================= */
export { PLAZA_G04 } from "./plazaG04.js";
export { MF_G04, FlowG04 } from "./flowG04.jsx";

export {
  MF_G04_ENT, FLOW_ENT, FlowG04Ent,
  WS_CFG_ENT, EntitlementsWorkspace,
  BENCH_UC08,
} from "./entitlements/index.js";

export {
  MF_G04_AUD, FLOW_AUD, FlowG04Aud,
  WS_CFG_AUDIT, AuditWorkspace,
  BENCH_UC03,
} from "./audit/index.js";
