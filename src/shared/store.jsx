/* =========================================================================
   src/shared/store.jsx — minimal store primitives.

   Lifted out of src/App.jsx so the shared UI library (and any other
   directorate) can `import { useStore, Money } from "../shared"` without
   creating a circular import back into App.jsx.

   The actual <StoreProvider> still lives in App.jsx (it owns the i18n
   tables, ALERTS seed, URL_LANG, and the G-02 closed-loop state) — this
   file just defines the React Context + hook + Money atom.
   ========================================================================= */
import React, { createContext, useContext } from "react";

export const Store = createContext(null);
export function useStore() { return useContext(Store); }

/* Money — currency atom. Renders the value as plain text; App.jsx swaps in
   the styled <Money/> wrapper at render time when it wants the SVG riyal
   glyph. The shared copy is the minimal no-op so it can be used inside
   <UcBench>, <DeptWorkspace>, <KpiCarousel>, etc. without circular deps. */
export function Money({ v }) { return <React.Fragment>{v}</React.Fragment>; }
