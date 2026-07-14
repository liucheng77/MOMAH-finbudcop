/* =========================================================================
   src/shared/index.js — barrel for the shared layer.
   -------------------------------------------------------------------------
   Any directorate (G-02..G-06) — including src/G04 — can import its UI
   primitives and host hooks from a single, App.jsx-agnostic location.
   `useStore` and `Money` are re-exported from src/App for convenience, but
   the goal of this folder is to be the canonical place for code that
   every directorate needs (so App.jsx can be slimmed down over time).
   ========================================================================= */
export {
  SHOW_UC, sanitizeUc, ucl, F6_AG, BQ_POS, Hi, OrchNext,
  askHiAgent, mdToJsx,
  DirectorateFlow, KpiCarousel, BusinessPlaza, WsFlowCard, OrchChat, WsConsoleCard, DeptWorkspace, UcBench, PiaCard,
  Uc04Forecaster, Uc07Planner, Uc05Scenario, Uc17Tower, Uc15Drivers, Uc16Subsidy,
  Uc01DataQuality, Uc08Entitlements, Uc09Closing,
} from "./ui.jsx";
export { useStore, Money } from "./store.jsx";
