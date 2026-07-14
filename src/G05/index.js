/* =========================================================================
   G-05 · 财务报告总局 (General Directorate of Financial Reporting) — barrel.
   -------------------------------------------------------------------------
   Re-exports every G-05 page so consumers can `import { ... } from "./G05"`.
   This folder is a self-contained extraction of the G-05 content that used
   to live inline in src/App.jsx — App.jsx now imports from here (mirrors the
   ./G04 split).
   ========================================================================= */
export { PLAZA_G05 } from "./plazaG05.js";
export { MF_G05, FlowG05 } from "./flowG05.jsx";

export {
  MF_G05_REP, FLOW_REP, FlowG05Rep,
  WS_CFG_REPORTING, ReportingWorkspace,
} from "./reporting/index.js";

export {
  MF_G05_COMP, FLOW_COMP, FlowG05Comp,
  WS_CFG_COMPLIANCE, ComplianceWorkspace,
} from "./compliance/index.js";

export {
  MF_G05_COST, FLOW_COST, FlowG05Cost,
  WS_CFG_COST, CostWorkspace,
} from "./cost/index.js";

export {
  MF_G05_ACCT, FLOW_ACCT, FlowG05Acct,
  WS_CFG_ACCT, AccountingWorkspace,
  BENCH_UC09_G05,
} from "./accounting/index.js";
