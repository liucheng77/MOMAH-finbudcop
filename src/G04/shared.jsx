/* =========================================================================
   G-04 shared infrastructure — 财务事务总局 (General Administration of Affairs
   Finance) shared layer.
   -------------------------------------------------------------------------
   Thin re-export barrel.  All UI primitives (DirectorateFlow, DeptWorkspace,
   UcBench, etc.) and helpers (F6_AG, BQ_POS, Hi, OrchNext, askHiAgent,
   mdToJsx, …) live in `src/shared/ui.jsx`.  The store hook (useStore) and
   the Money atom live in `src/shared/store.jsx` — both are imported by
   the host App.jsx and by G-04, so there is no App.jsx round-trip.
   ========================================================================= */
export {
  SHOW_UC, sanitizeUc, ucl, F6_AG, BQ_POS, Hi, OrchNext,
  askHiAgent, mdToJsx,
  DirectorateFlow, KpiCarousel, BusinessPlaza, WsFlowCard, OrchChat, WsConsoleCard, DeptWorkspace, UcBench,
  Uc04Forecaster, Uc07Planner, Uc05Scenario, Uc17Tower, Uc15Drivers, Uc16Subsidy,
} from "../shared/ui.jsx";
export { useStore, Money } from "../shared/store.jsx";
