/* =========================================================================
   Shell · Sidebar — left-side department accordion.
   Reads DEPARTMENTS / isUnlocked from ./departments.js; reads from the host
   Store via useStore.  The Data Access entry is hard-coded (single item,
   not part of the 5-directorate tree).
   ========================================================================= */
import React, { useState } from "react";
import { useStore } from "../shared/store.jsx";
import { DEPARTMENTS, isUnlocked } from "./departments.js";

export function Sidebar() {
  const { t, tr, route, setRoute, deptSub, setDeptSub, setBackRoute } = useStore();
  const [openG, setOpenG] = useState("g02");
  return (<div className="sidebar">
    <div className="sidebar-sub">{t("appName")}</div>
    <div className="dept">
      <div className={"dept-head da-head" + (route === "dataaccess" ? " open" : "")} onClick={() => { setBackRoute(null); setRoute("dataaccess"); }}>
        <span style={{ flex: 1 }}>⛓ {tr({ en: "Data Access", ar: "الوصول إلى البيانات", zh: "数据访问层" })}</span>
      </div>
    </div>
    {DEPARTMENTS.map(g => {
      const open = openG === g.key;
      return (<div className="dept" key={g.key}>
        <div className={"dept-head" + (open ? " open" : "")} onClick={() => setOpenG(open ? "" : g.key)}>
          <span style={{ flex: 1 }}>{tr(g.name)}</span><span className="chev">{open ? "▾" : "▸"}</span>
        </div>
        {open && <div className="dept-subs">{g.subs.map(s => {
          const on = isUnlocked(s.id);
          return <div key={s.id} className={"dept-sub" + (deptSub === s.id ? " active" : "") + (on ? "" : " locked")} onClick={on ? () => { setBackRoute(null); setDeptSub(s.id); setRoute(s.route); } : undefined}>{tr(s.name)}{on ? null : <span className="lockic">🔒</span>}</div>;
        })}</div>}
      </div>);
    })}
  </div>);
}
