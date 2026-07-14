/* =========================================================================
   src/shared/ui.jsx — generic directorate UI library.
   -------------------------------------------------------------------------
   This is the canonical home of the shared UI components that every
   directorate workspace (G-02..G-06) consumes:
     - Department workspace shell (DeptWorkspace · KpiCarousel · BusinessPlaza)
     - Multi-agent flow canvas (DirectorateFlow)
     - Workbench (UcBench) with the floating Q&A portal
     - Smart Query chat (OrchChat) with HITL approval + HiAgent live bridge
     - Atoms: Money · Hi (rich text) · OrchNext · F6_AG · BQ_POS
     - Client helpers: askHiAgent / mdToJsx (HiAgent OpenAPI demo)
   Originally lived inline in src/App.jsx + was duplicated into src/G04/.
   The G-04 folder now re-exports from here, and the rest of App.jsx does
   the same.  No directorate code outside src/shared/ should need to touch
   src/App.jsx.
   ========================================================================= */
import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useStore, Money } from "./store.jsx";
// Rich UC review panels (key cost driver layout) for the G-04 Financial
// Entitlements Department. Uc15Drivers / Uc16Subsidy stay inline in App.jsx
// (they read G-02 store slices) and are NOT imported here.
import { Uc01DataQuality, Uc08Entitlements, Uc09Closing } from "./ucTools.jsx";

const SHOW_UC = (() => { try { return new URLSearchParams(window.location.search).get("uc") === "true"; } catch (e) { return false; } })();  // mirror App.jsx: hide UC-xx codes unless ?uc=true
const PLAZA_G06 = null;          // fallback only — departments pass their own plaza
const RC_FLOW = [];              // fallback only — cfgs always define `flow`

/* ---- helpers ---- */
function sanitizeUc(s) {
  if (typeof s !== "string") return s;
  return s
    .replace(/\s*[\(（](?:UC|G|ج)-[0-9０-９/\-、,\s]*[\)）]/g, "")
    .replace(/(?:UC|G|ج)-[0-9/\-]+\s*[·:：]\s*/g, "")
    .replace(/\s*·\s*(?:UC|G|ج)-[0-9/\-]+/g, "")
    .replace(/\s*(?:UC|G|ج)-[0-9/\-]+/g, "")
    .replace(/\(\s*\)|（\s*）/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
function ucl(code, name) { return SHOW_UC ? code + " · " + name : name; }

/* ---- Agents metadata ---- */
const F6_AG = {
  orch: { en: "Orchestrator Agent", ar: "وكيل المنسّق", zh: "编排器代理" },
  dataq: { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询代理" },
  insight: { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "主动洞察代理" },
  revan: { en: "Revenue Analysis Agent", ar: "وكيل تحليل الإيرادات", zh: "收入分析代理" },
  repgen: { en: "Financial Reports Generation Agent", ar: "وكيل توليد التقارير المالية", zh: "财务报告生成代理" },
  narr: { en: "Financial Narrative Commentary Agent", ar: "وكيل السرد المالي", zh: "财务叙述评论代理" },
  anom: { en: "Anomaly Detection Agent", ar: "وكيل كشف الشذوذ", zh: "异常检测代理" },
  market: { en: "Market Trends Detection Agent", ar: "وكيل اتجاهات السوق", zh: "市场趋势检测代理" },
  comp: { en: "Compliance / Rules Agent", ar: "وكيل الامتثال/القواعد", zh: "合规/规则代理" },
  fcast: { en: "Financial Forecasting Agent", ar: "وكيل التنبؤ المالي", zh: "财务预测代理" },
  roll: { en: "Rolling Forecasting Agent", ar: "وكيل التنبؤ المتجدد", zh: "滚动预测代理" },
  scen: { en: "Scenario Simulation Agent", ar: "وكيل محاكاة السيناريوهات", zh: "情景模拟代理" },
  budopt: { en: "Budget Optimization Agent", ar: "وكيل تحسين الميزانية", zh: "预算优化代理" },
};
const BQ_POS = { up: { en: "UPSTREAM", ar: "منبع", zh: "上游" }, para: { en: "PARALLEL", ar: "متوازٍ", zh: "并行" }, down: { en: "DOWNSTREAM", ar: "المصب", zh: "下游" }, here: { en: "THIS", ar: "هذه", zh: "本环节" } };

function Hi({ t }) {
  if (!t) return t;
  const out = []; const re = /(\*\*[^*]+\*\*|~~[^~]+~~)/g; let last = 0, m, k = 0;
  while ((m = re.exec(t)) !== null) {
    if (m.index > last) out.push(t.slice(last, m.index));
    const seg = m[0];
    if (seg.slice(0, 2) === "**") out.push(<b className="hi-b" key={k++}>{seg.slice(2, -2)}</b>);
    else out.push(<mark className="hi-m" key={k++}>{seg.slice(2, -2)}</mark>);
    last = m.index + seg.length;
  }
  if (last < t.length) out.push(t.slice(last));
  return <React.Fragment>{out}</React.Fragment>;
}

function OrchNext({ items }) {
  const { tr } = useStore();
  return (<div className="orch-next">
    <div className="onh">⚐ {tr({ en: "Next actions · owners", ar: "الإجراءات التالية · المسؤولون", zh: "下一步动作 · 负责人" })}</div>
    {items.map((a, i) => (<div className="ona" key={i}>
      <span className="ona-i">{i + 1}</span>
      <div className="ona-m"><div className="ona-t">{tr(a.act)}</div><div className="ona-o">👤 {a.owner} · {tr(a.role)}</div></div>
      <a className="ona-tel" href={"tel:" + a.phone.replace(/[^+\d]/g, "")} onClick={e => e.stopPropagation()}>📞 {a.phone}</a>
    </div>))}
  </div>);
}

/* ---- HiAgent client + markdown renderer (verbatim, used by OrchChat) ---- */
const HIAGENT = { base: "https://hiagent.deyunai.com/api/proxy/api/v1", apikey: "d96grfd4shh2kc4flugg", user: "momah-demo" };
let _hiConv = null;
async function askHiAgent(query) {
  const H = { "Content-Type": "application/json", "Apikey": HIAGENT.apikey };
  if (!_hiConv) {
    const r = await fetch(HIAGENT.base + "/create_conversation", { method: "POST", headers: H, body: JSON.stringify({ UserID: HIAGENT.user, Inputs: {} }) });
    if (!r.ok) throw new Error("create_conversation HTTP " + r.status);
    const j = await r.json().catch(() => ({}));
    _hiConv = (j.Conversation && j.Conversation.AppConversationID) || j.AppConversationID || j.conversation_id || j.ConversationID;
    if (!_hiConv) throw new Error("no conversation id · " + JSON.stringify(j).slice(0, 140));
  }
  const r2 = await fetch(HIAGENT.base + "/chat_query", { method: "POST", headers: H, body: JSON.stringify({ AppConversationID: _hiConv, Query: query, ResponseMode: "blocking", UserID: HIAGENT.user }) });
  if (!r2.ok) throw new Error("chat_query HTTP " + r2.status);
  const txt = await r2.text();
  try { const j = JSON.parse(txt); return j.answer || j.Answer || (j.data && j.data.answer) || j.output || j.Output || JSON.stringify(j).slice(0, 500); }
  catch (e) {
    const ans = [...txt.matchAll(/"answer"\s*:\s*"((?:[^"\\]|\\.)*)"/g)].map(m => m[1]);
    if (ans.length) return ans.join("").replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\t/g, " ");
    return txt.slice(0, 800);
  }
}
function mdToJsx(text) {
  const lines = String(text == null ? "" : text).split(/\r?\n/);
  const out = []; let head = null, rows = [], k = 0;
  const isNum = (v) => /^[+-]?[\d,]+(\.\d+)?%?$/.test(String(v).trim());
  const flush = () => {
    if (head) out.push(<div key={"t" + k++} className="hi-tblwrap"><table className="hi-table"><thead><tr>{head.map((h, i) => <th key={i} className={isNum(h) ? "num" : ""}>{h}</th>)}</tr></thead><tbody>{rows.map((r, ri) => <tr key={ri}>{head.map((_, ci) => <td key={ci} className={isNum(r[ci]) ? "num" : ""}>{r[ci] != null ? r[ci] : ""}</td>)}</tr>)}</tbody></table></div>);
    head = null; rows = [];
  };
  const isSep = (l) => { const s = l.replace(/[|:\-\s]/g, ""); return s === "" && l.includes("-"); };
  const cellsOf = (l) => l.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map(c => c.trim());
  for (let raw of lines) {
    let line = raw;
    const hm = line.match(/^\s*(#{1,6})\s+([^|]*?)\s*(\|.*)$/);
    if (hm) { flush(); out.push(<div key={"h" + k++} className="hi-h">{hm[2]}</div>); line = hm[3]; }
    if (line.indexOf("|") >= 0) {
      if (isSep(line)) continue;
      const cs = cellsOf(line);
      if (!head) head = cs; else rows.push(cs);
    } else {
      flush();
      const t = line.trim(); if (!t) continue;
      const h = t.match(/^(#{1,6})\s+(.*)/);
      out.push(h ? <div key={"h" + k++} className="hi-h">{h[2]}</div> : <div key={"p" + k++} className="hi-p">{t}</div>);
    }
  }
  flush();
  return out.length ? out : String(text);
}

/* ---- UcBench tool stubs: only rendered when cfg.tool matches; G04 benches
   (UC-03 / UC-08) set no `tool`, so these never mount. Stubbed for safety.
   Rich UC review panels (key cost driver pattern) live in ./ucTools.jsx and
   are imported at the top of this file; the G-04 benches set
   `cfg.tool = "uc01"/"uc08"/"uc09" to mount the matching panel. ---- */
const Uc04Forecaster = () => null;
const Uc07Planner = () => null;
const Uc05Scenario = () => null;
const Uc17Tower = () => null;
const Uc15Drivers = () => null;
const Uc16Subsidy = () => null;

/* =========================================================================
   Components
   ========================================================================= */
function DirectorateFlow({ flow }) {
  const { tr, setRoute, backRoute, setBackRoute } = useStore();
  const colh = (code, name) => (SHOW_UC && code ? code + " · " : "") + name;
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const _bx = [flow.src, flow.gate, flow.del].concat(Object.keys(flow.nodes).map(k => flow.nodes[k])).filter(Boolean);
  const CW = Math.max.apply(null, _bx.map(b => b.x + b.w)) + 28;
  const CH = Math.max.apply(null, _bx.map(b => b.y + b.h)) + 22;
  useEffect(() => {
    const calc = () => { const w = wrapRef.current ? wrapRef.current.clientWidth : CW; setScale(Math.min(1.12, w / CW)); };
    calc(); window.addEventListener("resize", calc); return () => window.removeEventListener("resize", calc);
  }, [CW]);
  const aR = n => ({ x: n.x + n.w, y: n.y + n.h / 2 });
  const aL = n => ({ x: n.x, y: n.y + n.h / 2 });
  const aT = n => ({ x: n.x + n.w / 2, y: n.y });
  const aB = n => ({ x: n.x + n.w / 2, y: n.y + n.h });
  const AN = { R: aR, L: aL, T: aT, B: aB };
  const o = (p, q) => { const mx = (p.x + q.x) / 2; return "M" + p.x + "," + p.y + " L" + mx + "," + p.y + " L" + mx + "," + q.y + " L" + q.x + "," + q.y; };
  const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
  const plen = (d) => { const pts = d.replace(/[ML]/g, "").trim().split(/\s+/).map(p => p.split(",").map(Number)); let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
  const flyDur = (d) => Math.min(9, Math.max(1.8, plen(d) / 170));
  const N = (id) => id === "src" ? flow.src : id === "gate" ? flow.gate : id === "del" ? flow.del : flow.nodes[id];
  const E = flow.edges.map(e => {
    const p = AN[e.fa](N(e.from)), q = AN[e.ta](N(e.to));
    const d = e.d || o(p, q);
    const lp = e.lp || mid(p, q);
    return { d, c: e.c, lp, t: e.t };
  });
  const stroke = c => c === "g" ? "#9aa7b5" : c === "o" ? "#d98324" : "#2563eb";
  const marker = c => c === "g" ? "url(#mfag)" : c === "o" ? "url(#mfao)" : "url(#mfab)";
  const ucBox = (n) => (<div className="node mf-down green f6uc" style={{ left: n.x, top: n.y, width: n.w, minHeight: n.h }} key={n.code}>
    <div className="t"><span className="od" />{colh(n.code, tr(n.title))}</div>
    {n.desc && <div className="mf-ndesc">{tr(n.desc)}</div>}
    <div className="mf-sublist">{n.ags.map((k, i) => (<div className="mf-subitem" key={i}><span className="sd" />{tr(F6_AG[k])}</div>))}</div>
  </div>);
  const back = () => { if (backRoute) { const b = backRoute; setBackRoute(null); setRoute(b); } else setRoute(flow.back); };
  return (<div className="fade mf">
    <div className="card pad mf-frame">
      <h1 style={{ fontSize: 21 }}><button className="pg-back" onClick={back}>‹</button>{tr(flow.title)}</h1>
      <div className="sub muted" style={{ marginTop: 3 }}>{tr(flow.subtitle)}</div>
      <div className="f6-legend"><span className="f6lg f6lg-main">{tr({ en: "Main flow", ar: "التدفّق الرئيسي", zh: "主流程" })}</span>{flow.gate && <span className="f6lg f6lg-gate">{tr({ en: "Mandatory human gate", ar: "بوابة بشرية إلزامية", zh: "强制人工关卡" })}</span>}<span className="f6lg f6lg-chip">{tr({ en: "Agent chip", ar: "شريحة وكيل", zh: "代理芯片" })}</span><span className="f6lg f6lg-src">{tr({ en: "Sources / deliverables", ar: "المصادر/المخرجات", zh: "数据源 / 成果" })}</span></div>
      <div className="mf-canvas-wrap" ref={wrapRef} style={{ height: Math.ceil(CH * scale) }}><div style={{ width: Math.ceil(CW * scale), height: Math.ceil(CH * scale), margin: "0 auto", position: "relative" }}><div className="mf-canvas" style={{ width: CW, height: CH, transform: "scale(" + scale + ")", transformOrigin: "top left", position: "absolute", top: 0, left: 0 }}>
        <svg className="mf-svg" width={CW} height={CH} viewBox={"0 0 " + CW + " " + CH} fill="none">
          <defs>
            <marker id="mfag" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#9aa7b5" strokeWidth="1.6" /></marker>
            <marker id="mfab" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#2563eb" strokeWidth="1.8" /></marker>
            <marker id="mfao" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#d98324" strokeWidth="1.8" /></marker>
          </defs>
          {E.map((e, i) => (<path key={i} d={e.d} stroke={stroke(e.c)} strokeWidth={e.c === "g" ? 1.7 : 2} fill="none" markerEnd={marker(e.c)} />))}
          {E.map((e, i) => (<circle key={"fly" + i} r="3.4" fill={stroke(e.c)}><animateMotion dur={flyDur(e.d) + "s"} begin={(i * 0.13) + "s"} repeatCount="indefinite" path={e.d} /></circle>))}
        </svg>
        <div className="node mf-down gray" style={{ left: flow.src.x, top: flow.src.y, width: flow.src.w, minHeight: flow.src.h }}>
          <div className="t">{tr({ en: "Data Sources", ar: "مصادر البيانات", zh: "数据源" })}</div>
          <div className="f6-srclist">{flow.src.list.map((s, i) => (<div key={i}>{typeof s === "string" ? s : tr(s)}</div>))}</div>
        </div>
        {Object.keys(flow.nodes).map(k => ucBox(flow.nodes[k]))}
        {flow.gate && (flow.gate.items ? (
        <div className="mf-gate" style={{ left: flow.gate.x, top: flow.gate.y, width: flow.gate.w, minHeight: flow.gate.h }}>
          <div className="mf-gate-h">{tr(flow.gate.head)}</div>
          <div className="mf-gate-b">
            <p className="mf-gate-intro">{tr(flow.gate.intro)}</p>
            <div className="mf-gate-lab">{tr(flow.gate.ckLabel || { en: "Review checkpoints:", ar: "نقاط المراجعة:", zh: "复核检查点:" })}</div>
            <ul className="mf-gate-ul">{flow.gate.items.map((it, k) => (<li key={k}>{tr(it)}</li>))}</ul>
            {flow.gate.foot && <div className="mf-gate-foot">{tr(flow.gate.foot)}</div>}
          </div>
        </div>
        ) : (
        <div className="node mf-down gold" style={{ left: flow.gate.x, top: flow.gate.y, width: flow.gate.w, minHeight: flow.gate.h }}>
          <div className="t">⚖ {tr({ en: "Human Review · Mandatory Gate", ar: "مراجعة بشرية · بوابة إلزامية", zh: "人工审核 · 强制门" })}</div>
          <div className="s">{tr(flow.gate.sub)}</div>
        </div>
        ))}
        {flow.del && (flow.del.items ? (
        <div className="mf-deliv" style={{ left: flow.del.x, top: flow.del.y, width: flow.del.w, minHeight: flow.del.h }}>
          <div className="mf-deliv-h">{tr(flow.del.head || { en: "Outputs / Deliverables", ar: "المخرجات", zh: "输出 / 可交付成果" })}</div>
          {flow.del.items.map((it, k) => (<div className="mf-deliv-c" key={k}><b>{tr(it.t)}</b><span>{tr(it.d)}</span></div>))}
          {flow.del.foot && <div className="mf-deliv-f">{tr(flow.del.foot)}</div>}
        </div>
        ) : (
        <div className="node mf-down gray" style={{ left: flow.del.x, top: flow.del.y, width: flow.del.w, minHeight: flow.del.h }}>
          <div className="t">📦 {tr({ en: "Deliverables", ar: "المخرجات", zh: "可交付成果" })}</div>
          <div className="s">{tr(flow.del.sub)}</div>
        </div>
        ))}
        {E.map((e, i) => (<div className="node mf-edgelab" style={{ left: e.lp.x - 54, top: e.lp.y, width: 108, textAlign: "center", transform: "translateY(-50%)" }} key={"l" + i}>{tr(e.t)}</div>))}
      </div></div></div>
    </div>
  </div>);
}

function KpiCarousel({ slides, tone }) {
  const { tr, setAlertsOpen } = useStore();
  const [idx, setIdx] = useState(0);
  const [openAct, setOpenAct] = useState(false);
  const actCard = slides.flat().find(c => c.act);
  useEffect(() => { const id = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000); return () => clearInterval(id); }, [slides.length]);
  const card = (c, i) => c.aging
    ? (<div className="ws-kpi2 km kmrisk" key={i}><div className="lab">{tr(c.lab)}</div>
        <div className="km-aging">{c.aging.map((b, j) => (<div className="ab" key={j}><div className="abar"><i style={{ width: b[1] + "%" }} /></div><div className="at">{b[0]}</div><div className="av">{b[2]}</div></div>))}</div></div>)
    : c.act
    ? (<div className={"ws-kpi2 km kmact" + (openAct ? " on" : "")} key={i} onClick={() => setOpenAct(o => !o)} title={tr({ en: "View escalation details", ar: "عرض تفاصيل التصعيد", zh: "查看升级详情" })}>
        <div className="lab">{tr(c.lab)} <span className="km-open">{openAct ? "▾" : "▸"}</span></div>
        <div className="km-actrow"><b className="kmbig">{c.esc}</b><span className="kmesc">{tr({ en: "escalations", ar: "تصعيدات", zh: "项升级" })}</span></div>
        <div className="kmsub">{tr({ en: "of " + c.total + " actions · by impact", ar: "من " + c.total + " إجراءً · حسب الأثر", zh: "共 " + c.total + " 项行动 · 按影响排序" })}</div>
      </div>)
    : (<div className="ws-kpi2 km" key={i}><div className="lab">{tr(c.lab)}</div><div className="v"><Money v={c.v} /> <span className={"d" + (c.up ? " up" : "")}>{typeof c.d === "string" ? c.d : tr(c.d)}</span></div></div>);
  return (<div className={"kpi-carousel " + (tone || "green")}>
    <div className="kpi-viewport">
      <div className="kpi-track" style={{ transform: `translateY(-${idx * 118}px)` }}>
        {slides.map((cards, si) => (<div className="kpi-slide" key={si}><div className="ws-kpirow km4">{cards.map(card)}</div></div>))}
      </div>
    </div>
    <div className="kpi-dots">{slides.map((_, i) => (<button key={i} className={"kpi-dot" + (i === idx ? " on" : "")} onClick={() => setIdx(i)} aria-label={"slide " + (i + 1)} />))}</div>
    {openAct && actCard && <div className="km-pop">
      <div className="km-poph"><b>{tr({ en: "5 escalations · prioritized by impact", ar: "5 تصعيدات · حسب الأثر", zh: "5 项升级 · 按影响排序" })}</b><button className="km-popx" onClick={(e) => { e.stopPropagation(); setOpenAct(false); }}>✕</button></div>
      {actCard.items.map((it, j) => (<div className="km-popr" key={j} onClick={() => { setOpenAct(false); setAlertsOpen(true); }}><span className="r">{j + 1}</span><div className="m"><div className="t">{tr(it.t)}</div><div className="s">{tr(it.s)}</div></div><span className="v">{it.v}</span></div>))}
      <div className="km-popf" onClick={() => { setOpenAct(false); setAlertsOpen(true); }}>{tr({ en: "Open Alerts & Exceptions Center →", ar: "فتح مركز التنبيهات →", zh: "打开告警与异常中心 →" })}</div>
    </div>}
  </div>);
}

function BusinessPlaza({ model, defaultSel }) {
  const M = model || PLAZA_G06;
  const { tr, setRoute, setPerfJump, setDeptSub, setBackRoute, setAlertsOpen, route } = useStore();
  const plazaWrapRef = useRef(null);
  const [plazaBox, setPlazaBox] = useState({ w: 0, h: 0 });
  const [plazaSel, setPlazaSel] = useState(null);
  const [plazaModal, setPlazaModal] = useState(false);
  useEffect(() => {
    const el = plazaWrapRef.current; if (!el || typeof ResizeObserver === "undefined") return;
    const calc = () => setPlazaBox({ w: el.clientWidth, h: el.clientHeight });
    calc(); const ro = new ResizeObserver(calc); ro.observe(el); return () => ro.disconnect();
  }, []);
  const PZ = { W: 720, H: 400, NW: 130, NH: 88, colX: [8, 152, 296, 440, 584] };
  const pzById = {}; M.nodes.forEach(n => { pzById[n.id] = n; });
  const laneCls = (n) => M.lanes ? ((M.lanes.find(l => l.key === n.lane) || {}).cls || "rev") : n.lane;
  const ovH = M.lanes ? (30 + M.lanes.length * 132 + 18) : PZ.H;
  const fullH = M.lanes ? (42 + M.lanes.length * 152 + 18) : 536;
  const pzOpen = (n) => {
    if (!n.open) return;
    if (n.open === "alerts") { setBackRoute(route); setRoute("alerts"); return; }
    if (n.open === "perf") { setPerfJump({ tab: "dash" }); setBackRoute(route); setRoute("perf"); return; }
    if (n.open === "report") { setPerfJump({ tab: "params" }); setBackRoute(route); setRoute("rcreports"); return; }
    if (["plnbudget","plncost","plnhousing","plnforecast","plnscenario","g02query"].includes(n.open)) { setBackRoute(route); setDeptSub("plan"); setRoute(n.open); return; }
    const MM = { rcbench: ["revcol", "rcbench"], asbench: ["assets", "asbench"], csfunds: ["cost", "csfunds"], compmemo: ["comp", "compmemo"], reports: ["frep", "reports"], bench01: ["acct", "bench01"], bench03: ["audit", "bench03"], bench04: ["fpa", "bench04"], bench05: ["plan", "bench05"], bench07: ["plan", "bench07"], bench08: ["entitle", "bench08"], bench09: ["acct", "bench09"], bench15: ["plan", "bench15"], bench16: ["plan", "bench16"], bench17: ["budexec", "bench17"], g04bench01: ["entitle", "g04bench01"], g04bench02: ["audit", "g04bench02"], g04bench09: ["entitle", "g04bench09"], g04bench10: ["audit", "g04bench10"], g04reports: ["entitle", "g04reports"], g05bench09: ["acct", "g05bench09"] }[n.open];
    if (MM) { setBackRoute(route); setRoute(MM[1]); }
  };
  const ovScale = (plazaBox.w || 480) / PZ.W;
  const dScale = Math.min(1.12, ((typeof window !== "undefined" ? Math.min(840, window.innerWidth * 0.94) : 800) - 44) / PZ.W);
  const renderPlaza = (full, scale, sel) => {
    const mid = full ? "pzarF" : "pzar";
    if (M.lanes) {
      const LN = M.lanes, idx = {}; LN.forEach((l, i) => idx[l.key] = i);
      const stride = full ? 152 : 132;
      const pad = full ? 42 : 30;
      const Hn = full ? fullH : ovH;
      const ntop = (id) => pad + idx[pzById[id].lane] * stride + 26;
      const nbot = (id) => ntop(id) + PZ.NH;
      const ncx = (id) => PZ.colX[pzById[id].col] + PZ.NW / 2;
      const ncross = (e, i) => {
        const ai = idx[pzById[e.from].lane], bi = idx[pzById[e.to].lane];
        const sx = ncx(e.from), sy = ai <= bi ? nbot(e.from) : ntop(e.from);
        const tx = ncx(e.to), ty = ai <= bi ? ntop(e.to) : nbot(e.to);
        const my = (sy + ty) / 2 + ((i % 3) - 1) * 9;
        return { d: `M${sx},${sy} L${sx},${my} L${tx},${my} L${tx},${ty}`, lx: Math.min(sx, tx) + Math.abs(tx - sx) / 2, ly: my };
      };
      return (<div className="pz-canvas" style={{ width: PZ.W, height: Hn, transform: "scale(" + scale + ")" }}>
        <svg className="pz-links" width={PZ.W} height={Hn} viewBox={"0 0 " + PZ.W + " " + Hn} fill="none">
          <defs><marker id={mid} viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="7" refY="5" orient="auto-start-reverse"><path d="M2,1 L8,5 L2,9" fill="none" stroke="context-stroke" strokeWidth="1.6" strokeLinecap="round" /></marker></defs>
          {LN.map((l, i) => <rect key={"b" + i} x="2" y={pad + i * stride} width="716" height={stride - 14} rx="13" fill={i % 2 ? "#f7f3fc" : "#f3f6fd"} />)}
          {LN.map((l, i) => <text key={"t" + i} x="14" y={pad + i * stride + 18} className={"pz-lane " + l.cls}>{tr(l.label)}</text>)}
          {M.cross.map((e, i) => { if (!(full || (sel && (e.from === sel || e.to === sel)))) return null; const q = ncross(e, i); return <path key={"c" + i} d={q.d} stroke="#e0524a" strokeWidth="1.6" strokeDasharray="5 4" fill="none" markerEnd={`url(#${mid})`} />; })}
        </svg>
        {M.nodes.map(n => (
          <div key={n.id} className={"pz-node " + laneCls(n) + (sel === n.id ? " on" : "") + (n.open ? " linked" : " ctx")} style={{ left: PZ.colX[n.col], top: ntop(n.id), width: PZ.NW, height: PZ.NH }} onClick={full ? undefined : (ev) => { ev.stopPropagation(); setPlazaSel(n.id); }}>
            <div className="pz-code">{n.star ? <span className="pz-star">★</span> : null}{SHOW_UC ? n.code : null}{n.open ? null : <span className="pz-ctxtag">{tr({ en: "context", ar: "سياق", zh: "上下文" })}</span>}</div>
            <div className="pz-ttl">{tr(n.title)}</div>
            <div className="pz-ag">{full ? n.agents.join(" · ") : n.agents.length + " agents"}</div>
            {!full && n.open && <button className="pz-go" title={tr({ en: "Open page (one-click)", ar: "فتح الصفحة", zh: "一键打开页面" })} onClick={(ev) => { ev.stopPropagation(); pzOpen(n); }}>↗</button>}
          </div>))}
        {full && M.cross.map((e, i) => { const q = ncross(e, i); return <div key={"l" + i} className="pz-elab" style={{ left: q.lx - 100, top: q.ly - 15 }}>{tr(e.label)}</div>; })}
      </div>);
    }
    const astTop = full ? 424 : 280;
    const H = full ? 536 : PZ.H;
    const top = (id) => pzById[id].lane === "rev" ? 62 : astTop;
    const bot = (id) => top(id) + PZ.NH;
    const cy = (id) => top(id) + PZ.NH / 2;
    const cx = (id) => PZ.colX[pzById[id].col] + PZ.NW / 2;
    const cross = (e, i) => {
      const sx = cx(e.from), sy = pzById[e.from].lane === "rev" ? bot(e.from) : top(e.from);
      const tx = cx(e.to), ty = pzById[e.to].lane === "rev" ? bot(e.to) : top(e.to);
      const my = full ? (158 + i * 44) : (215 + (i - 2.5) * 12);
      return { d: `M${sx},${sy} L${sx},${my} L${tx},${my} L${tx},${ty}`, lx: Math.min(sx, tx) + Math.abs(tx - sx) / 2, ly: my };
    };
    return (<div className="pz-canvas" style={{ width: PZ.W, height: H, transform: "scale(" + scale + ")" }}>
      <svg className="pz-links" width={PZ.W} height={H} viewBox={"0 0 " + PZ.W + " " + H} fill="none">
        <defs><marker id={mid} viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="7" refY="5" orient="auto-start-reverse"><path d="M2,1 L8,5 L2,9" fill="none" stroke="context-stroke" strokeWidth="1.6" strokeLinecap="round" /></marker></defs>
        <rect x="2" y="34" width="716" height="140" rx="14" fill="#f3f6fd" />
        <rect x="2" y={astTop - 30} width="716" height="132" rx="14" fill="#f7f3fc" />
        <text x="14" y="51" className="pz-lane rev">{tr(M.top)}</text>
        <text x="14" y={astTop - 12} className="pz-lane ast">{tr(M.bot)}</text>
        {M.intra.map(([a, b], i) => { const y = cy(a); const x1 = PZ.colX[pzById[a].col] + PZ.NW, x2 = PZ.colX[pzById[b].col]; const c = pzById[a].lane === "rev" ? "#1f3a8a" : "#5b3a9e"; return <path key={i} d={`M${x1},${y} L${x2 - 3},${y}`} stroke={c} strokeWidth="2" fill="none" markerEnd={`url(#${mid})`} opacity={0.85} />; })}
        {M.cross.map((e, i) => { if (!(full || (sel && (e.from === sel || e.to === sel)))) return null; const p = cross(e, i); return <path key={"c" + i} d={p.d} stroke="#e0524a" strokeWidth="1.7" strokeDasharray="5 4" fill="none" markerEnd={`url(#${mid})`} />; })}
      </svg>
      {M.nodes.map(n => { return (
        <div key={n.id} className={"pz-node " + n.lane + (sel === n.id ? " on" : "") + (n.open ? " linked" : " ctx")} style={{ left: PZ.colX[n.col], top: top(n.id), width: PZ.NW, height: PZ.NH }} onClick={full ? undefined : (ev) => { ev.stopPropagation(); setPlazaSel(n.id); }}>
          <div className="pz-code">{n.star ? <span className="pz-star">★</span> : null}{SHOW_UC ? n.code : null}{n.open ? null : <span className="pz-ctxtag">{tr({ en: "context", ar: "سياق", zh: "上下文" })}</span>}</div>
          <div className="pz-ttl">{tr(n.title)}</div>
          <div className="pz-ag">{full ? n.agents.join(" · ") : n.agents.length + " agents"}</div>
          {!full && n.open && <button className="pz-go" title={tr({ en: "Open page (one-click)", ar: "فتح الصفحة", zh: "一键打开页面" })} onClick={(ev) => { ev.stopPropagation(); pzOpen(n); }}>↗</button>}
        </div>); })}
      {full && M.cross.map((e, i) => { const p = cross(e, i); return <div key={"l" + i} className="pz-elab" style={{ left: p.lx - 100, top: p.ly - 15 }}>{tr(e.label)}</div>; })}
    </div>);
  };
  return (<React.Fragment>
    <div className="ws-plaza">
      <div className="plaza-head">
        <div><h2 style={{ fontSize: 16 }}>{tr({ en: "Business Plaza", ar: "ساحة الأعمال", zh: "业务广场" })}</h2><div className="sub muted">{tr({ en: "Click a UC for its I/O · ↗ opens its page in one click · others are context-only", ar: "انقر حالة لعرض المدخلات/المخرجات · ↗ يفتح صفحتها بنقرة · البقية للسياق", zh: "点击 UC 查看其 I/O · ↗ 一键打开其页面 · 其余仅为上下文" })}</div></div>
        <div className="pz-tools"><button className="btn sm pz-expand" onClick={() => setPlazaModal(true)}>{tr({ en: "Expand", ar: "توسيع", zh: "展开" })} ↗</button></div>
      </div>
      <div className="ws-flowwrap pz-wrap" ref={plazaWrapRef} style={{ height: Math.ceil(ovH * ovScale) }}>
        {renderPlaza(false, ovScale, plazaSel)}
      </div>
      {(() => { const cur = plazaSel || defaultSel; const n = pzById[cur]; if (!n) return null; const ios = M.cross.filter(e => e.from === cur || e.to === cur).map(e => ({ out: e.from === cur, code: pzById[e.from === cur ? e.to : e.from].code, label: e.label }));
        return (<div className="pz-detail">
          <div className="pz-dhead">{SHOW_UC ? <span className={"pz-dcode " + laneCls(n)}>{n.star ? "★ " : ""}{n.code}</span> : (n.star ? <span className="pz-dstar">★</span> : null)}<b>{tr(n.title)}</b>{n.open ? <button className="btn sm pz-openb" onClick={() => pzOpen(n)}>{tr({ en: "Open page", ar: "فتح الصفحة", zh: "一键打开页面" })} ↗</button> : <span className="pz-ctxonly">{tr({ en: "Context only · no dedicated page", ar: "للسياق فقط · لا صفحة مخصّصة", zh: "仅上下文 · 无独立页面" })}</span>}</div>
          <div className="pz-drow">
            <div className="pz-dcol"><div className="pz-dlab">{tr({ en: "Agents", ar: "الوكلاء", zh: "智能体" })}</div><div>{n.agents.map((a, i) => <span className="pz-chip" key={i}>{a}</span>)}</div></div>
            <div className="pz-dcol"><div className="pz-dlab">{tr({ en: "Cross-department I/O", ar: "التبادل بين الإدارات", zh: "跨部门 I/O" })}</div>{ios.length ? ios.map((x, i) => <p className="pz-io" key={i}>{x.out ? "→ " : "← "}{SHOW_UC ? x.code + ": " : ""}{tr(x.label)}</p>) : <p className="pz-io muted">{tr({ en: "No cross-department links", ar: "لا روابط بين الإدارات", zh: "无跨部门连接" })}</p>}</div>
          </div>
        </div>); })()}
    </div>
    {plazaModal && createPortal(<div className="al-overlay" onClick={() => setPlazaModal(false)}>
      <div className="pz-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="pz-mhead"><b>{tr(M.title)}</b><button className="pz-x" onClick={() => setPlazaModal(false)}>✕</button></div>
        <div className="pz-mscroll"><div className="pz-mcanvas" style={{ width: PZ.W * dScale, height: fullH * dScale }}>{renderPlaza(true, dScale, null)}</div></div>
        <div className="pz-legend">{(M.lanes ? M.lanes : [{label:M.top,cls:"rev"},{label:M.bot,cls:"ast"}]).map((l, i) => <span key={i}><i className={"ln " + (l.cls||"rev")} />{tr(l.label)}</span>)}<span><i className="ln cross" />{tr({ en: "Cross-department I/O", ar: "التبادل بين الإدارات", zh: "跨部门 I/O" })}</span><span>★ {tr({ en: "convergence / focus", ar: "تقارب / تركيز", zh: "汇聚 / 焦点" })}</span><span className="pz-lgo">↗ {tr({ en: "opens its page", ar: "يفتح صفحتها", zh: "一键打开页面" })}</span></div>
      </div>
    </div>, document.body)}
  </React.Fragment>);
}

function WsFlowCard({ to }) {
  const { tr, setRoute, route, setBackRoute } = useStore();
  return (<div className="ws-flowcard" onClick={() => { setBackRoute(route); setRoute(to || "rcdata"); }} title={tr({ en: "Open Multi-Agent Flow", ar: "فتح تدفّق الوكلاء", zh: "打开多智能体流程" })}>
    <div className="ws-flowcard-h"><span>{tr({ en: "Multi-Agent Flow", ar: "تدفّق متعدد الوكلاء", zh: "多智能体流程" })}</span><span className="ws-flowcard-hr"><span className="at-tip at-tip-r" onClick={(e) => e.stopPropagation()} aria-label={tr({ en: "G-06 Revenue & Assets Directorate — Multi-Agent Flow", ar: "مديرية الإيرادات والأصول ج-06 — تدفّق الوكلاء", zh: "G-06 收入与资产总局 — 多智能体流程" })} tabIndex={0}>i<span className="at-tip-pop">{tr({ en: "G-06 Revenue & Assets Directorate — Multi-Agent Flow", ar: "مديرية الإيرادات والأصول ج-06 — تدفّق الوكلاء", zh: "G-06 收入与资产总局 — 多智能体流程" })}</span></span><span className="open">↗</span></span></div>
    <svg className="ws-flowthumb" viewBox="0 0 300 44" fill="none" preserveAspectRatio="xMidYMid meet">
      <rect x="4" y="5" width="20" height="7" rx="2" fill="#eef2f7" /><rect x="4" y="14" width="20" height="7" rx="2" fill="#eef2f7" /><rect x="4" y="23" width="20" height="7" rx="2" fill="#eef2f7" /><rect x="4" y="32" width="20" height="7" rx="2" fill="#eef2f7" />
      <rect x="40" y="12" width="28" height="20" rx="4" fill="#fff" stroke="#2563eb" strokeWidth="1.4" />
      <rect x="86" y="5" width="40" height="9" rx="2.5" fill="#2563eb" /><rect x="86" y="18" width="40" height="9" rx="2.5" fill="#f1f4f8" stroke="#dfe5ec" strokeWidth="0.8" /><rect x="86" y="31" width="40" height="9" rx="2.5" fill="#f1f4f8" stroke="#dfe5ec" strokeWidth="0.8" />
      <rect x="138" y="16" width="20" height="12" rx="3.5" fill="#eef4ff" stroke="#cdddfb" strokeWidth="0.8" />
      <rect x="172" y="9" width="50" height="26" rx="5" fill="#2563eb" /><circle cx="197" cy="22" r="4" fill="#fff" />
      <rect x="236" y="11" width="40" height="9" rx="2.5" fill="#e9f7ef" stroke="#bfe6cf" strokeWidth="0.8" /><rect x="236" y="24" width="40" height="9" rx="2.5" fill="#fdf4d9" stroke="#f0dca6" strokeWidth="0.8" />
      <g stroke="#c2cbd6" strokeWidth="1"><path d="M24 22 H40" /><path d="M68 22 H86" /><path d="M126 22 H138" /><path d="M158 22 H172" /><path d="M222 22 H236" /></g>
    </svg>
  </div>);
}

function OrchChat({ cfg }) {
  const { tr, pushLog, lang } = useStore();
  const [phase, setPhase] = useState("idle");
  const [prompt, setPrompt] = useState(tr(cfg.defaultPrompt));
  const [sent, setSent] = useState(null);
  const [tl, setTl] = useState(["queued", "queued", "queued", "queued"]);
  const [thk, setThk] = useState(["queued", "queued", "queued", "queued"]);
  const [stage, setStage] = useState("idle");
  const [showDiff, setShowDiff] = useState(false);
  const isLive = !!cfg.live;
  const [live, setLive] = useState([]);
  const [liveBusy, setLiveBusy] = useState(false);
  const timersRef = useRef([]);
  const bodyRef = useRef(null);
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  const runLive = async () => {
    const q = prompt.trim(); if (!q || liveBusy) return;
    setLive(m => [...m, { role: "u", text: q }]); setPrompt(""); setSent(q); setLiveBusy(true);
    pushLog(cfg.startLog);
    try { const ans = await askHiAgent(q); setLive(m => [...m, { role: "a", text: ans }]); }
    catch (e) { setLive(m => [...m, { role: "err", text: (e && e.message) || String(e) }]); }
    setLiveBusy(false);
  };
  useEffect(() => { if (phase === "idle" && !isLive) setPrompt(tr(cfg.defaultPrompt)); }, [lang]);
  useEffect(() => () => clearTimers(), []);
  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTop = el.scrollHeight; }, [tl, thk, phase, sent, showDiff]);
  const THINK_STEPS = [
    { en: "Interpreting intent", ar: "تفسير القصد", zh: "解析意图" },
    { en: "Checking permission scope", ar: "التحقق من نطاق الصلاحيات", zh: "检查权限范围" },
    { en: "Selecting agents", ar: "اختيار الوكلاء", zh: "选择智能体" },
    { en: "Planning subtasks", ar: "تخطيط المهام الفرعية", zh: "规划子任务" },
  ];
  const PH = {
    idle: { t: { en: "ready", ar: "جاهز", zh: "就绪" }, c: "var(--muted)" },
    running: { t: { en: "running", ar: "يعمل", zh: "运行中" }, c: "var(--info)" },
    review: { t: { en: "awaiting review", ar: "بانتظار المراجعة", zh: "待审批" }, c: "var(--amber)" },
    approved: { t: { en: "completed", ar: "اكتمل", zh: "已完成" }, c: "var(--green-dark)" },
    returned: { t: { en: "returned", ar: "أُعيد", zh: "已退回" }, c: "var(--danger)" },
  };
  const runOrch = () => {
    if (phase === "running" || !prompt.trim()) return;
    clearTimers(); setShowDiff(false); setSent(prompt.trim()); setPhase("running"); setStage("think");
    setThk(["think", "queued", "queued", "queued"]);
    setTl(["queued", "queued", "queued", "queued"]);
    pushLog(cfg.startLog);
    [[450, ["done", "think", "queued", "queued"]], [900, ["done", "done", "think", "queued"]], [1350, ["done", "done", "done", "think"]], [1750, ["done", "done", "done", "done"]]]
      .forEach(p => timersRef.current.push(setTimeout(() => setThk(p[1]), p[0])));
    timersRef.current.push(setTimeout(() => { setStage("timeline"); setTl(["think", "queued", "queued", "queued"]); }, 1800));
    [[2500, ["done", "think", "queued", "queued"]], [3300, ["done", "done", "think", "queued"]], [4200, ["done", "done", "done", "think"]]]
      .forEach(p => timersRef.current.push(setTimeout(() => setTl(p[1]), p[0])));
    timersRef.current.push(setTimeout(() => { setPhase("review"); pushLog(cfg.reviewLog); }, 4900));
  };
  const approve = () => {
    if (phase === "approved") return; clearTimers(); setPhase("approved"); setStage("result"); setTl(["done", "done", "done", "done"]);
    pushLog(cfg.approveLog);
  };
  const returnFix = () => {
    clearTimers(); setShowDiff(false); setPhase("returned"); setStage("result"); setTl(["done", "done", "done", "queued"]);
    pushLog(cfg.returnLog);
  };
  return (<div className="orch-cell"><div className="orch orch-chat">
    <div className="orch-h"><span className="orch-title">✦ {tr({ en: "Smart Query · Decision Agent", ar: "الاستعلام الذكي · وكيل القرار", zh: "智能查询 · 决策智能体" })}</span>{(isLive ? liveBusy : phase === "running") && <span className="pulse" style={{ marginInlineStart: 6 }} />}{isLive ? <span className="orch-live">● {tr({ en: "live · HiAgent", ar: "مباشر · HiAgent", zh: "实时 · HiAgent" })}</span> : <span className="orch-demo">{tr({ en: "demo data", ar: "بيانات تجريبية", zh: "演示数据" })}</span>}</div>
    {!isLive && <div className="ctx-chips" style={{ marginBottom: 4 }}>{cfg.chips.map((c, i) => <span className="chip gray" key={i}>{c}</span>)}</div>}
    <div className="orch-body" ref={bodyRef}>
      {(isLive ? live.length === 0 : !sent) && <div className="orch-empty">
        <div>{tr(isLive ? { en: "Ask the department agent — answered live by HiAgent.", ar: "اسأل الوكيل — إجابة مباشرة من HiAgent.", zh: "向部门智能体提问——由 HiAgent 实时作答。" } : { en: "Type a request below — the orchestrator runs the agent timeline, then returns a human-in-the-loop review.", ar: "اكتب طلباً بالأسفل — يشغّل المنسّق الخط الزمني للوكلاء ثم يعيد مراجعة بشرية.", zh: "在下方输入请求——编排器会运行智能体时间线,随后返回人工审批。" })}</div>
        <div className="orch-sugs">{cfg.prompts.map((p, i) => (<button className="orch-sug" key={i} onClick={() => setPrompt(isLive ? tr(p.t) : tr(p.t) + " · " + tr(p.s))}>↗ {tr(p.t)}</button>))}</div>
      </div>}
      {!isLive && sent && <div className="chat-msg user"><div className="bubble">{sent}</div></div>}
      {isLive && live.map((m, i) => <div key={i} className={"chat-msg " + (m.role === "u" ? "user" : "bot")}><div className={"bubble" + (m.role === "err" ? " hi-err" : m.role === "a" ? " hi-ans" : "")}>{m.role === "err" ? "⚠ HiAgent · " + m.text : m.role === "a" ? mdToJsx(m.text) : m.text}</div></div>)}
      {isLive && liveBusy && <div className="chat-msg bot"><div className="bubble"><span className="wb-typing"><i /><i /><i /></span></div></div>}
      {stage === "think" && <div className="msg bot think-msg">
        <div className="av">✦</div>
        <div className="bubble"><div className="think">{THINK_STEPS.map((s, i) => { const st = thk[i]; const stt = st === "done" ? "ok" : st === "think" ? "act" : "";
          return (<div className={"tl " + stt} key={i}><span className="ti">{st === "done" ? "✓" : st === "think" ? "◐" : "○"}</span><span>{tr(s)}</span></div>); })}</div></div>
      </div>}
      {stage === "timeline" && <div className="chat-msg bot">
        <div className="ws-sec-h">{tr({ en: "Agent timeline", ar: "خط زمن الوكلاء", zh: "智能体时间线" })}</div>
        <div className="tl">{cfg.tlMeta.map((e, i) => { const st = tl[i]; const cur = st === "think";
          return (<div className={"ev" + (cur ? " cur" : "")} key={i}>
            <span className={"dotc " + (st === "done" ? "done" : st === "think" ? "think" : "")}>{st === "done" ? "✓" : st === "think" ? "◐" : ""}</span>
            <div className="et">{ucl(e.code, tr(e.t))} {st === "queued" ? <span className="chip gray">{tr({ en: "queued", ar: "في الانتظار", zh: "排队" })}</span> : st === "think" ? <span className="chip info">{tr({ en: "thinking…", ar: "يفكّر…", zh: "思考中…" })}</span> : <span className="chip">{tr({ en: "done", ar: "تم", zh: "完成" })}</span>}</div>
            <div className="es">{tr(e.s)}</div>
          </div>); })}</div>
      </div>}
      {(phase === "review" || phase === "approved" || phase === "returned") && <div className="chat-msg bot">
        {(phase === "review" || phase === "approved") && <div className="hitl">
          <div className="hh">⚑ {tr({ en: "HUMAN-IN-THE-LOOP REVIEW", ar: "مراجعة بشرية إلزامية", zh: "人工审批" })}</div>
          <div className="hb">{tr(cfg.reviewBody)}</div>
          {phase === "approved" ? (
            <span className="chip">✓ {tr(cfg.approvedChip)}</span>
          ) : (
            <React.Fragment>
              <div className="hitl-btns">
                <button className="btn" onClick={approve}>✓ {tr(cfg.approveLabel)}</button>
                <button className="btn danger sm" onClick={returnFix}>↺ {tr({ en: "Return for fix", ar: "إعادة للتصحيح", zh: "退回修正" })}</button>
                <button className="btn ghost sm" onClick={() => setShowDiff(v => !v)}>⌥ {tr({ en: "View diff", ar: "عرض الفرق", zh: "查看差异" })}</button>
              </div>
              {showDiff && (
                <div className="diffbox">
                  {cfg.diff.map((d, i) => (
                    <div className={"dl " + d.k} key={i}>
                      {d.k === "rem" ? "- " : "+ "}{tr(d.t)}
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          )}
        </div>}
        {phase === "returned" && <div className="hitl ret">
          <div className="hh">↺ {tr({ en: "RETURNED FOR FIX", ar: "أُعيد للتصحيح", zh: "已退回修正" })}</div>
          <div className="hb">{tr(cfg.returnBody)}</div>
        </div>}
        {(phase === "review" || phase === "approved") && <OrchNext items={cfg.nextActions} />}
      </div>}
    </div>
    <div className="orch-bar">
      <textarea className="orch-cin" rows={1} value={prompt} disabled={isLive ? liveBusy : phase === "running"} onChange={e => setPrompt(e.target.value)} placeholder={tr(cfg.defaultPrompt)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); isLive ? runLive() : runOrch(); } }} />
      <button className="orch-send" disabled={(isLive ? liveBusy : phase === "running") || !prompt.trim()} onClick={isLive ? runLive : runOrch}>{(isLive ? liveBusy : phase === "running") ? "…" : "SEND"}</button>
    </div>
  </div></div>);
}

/* ---- Proactive Insights Agent card (G-04 entitlements department)
   Surfaces a single approval-worthy anomaly flagged by the Proactive Insights
   Agent, plus three action buttons: 批准复核预估 / 驳回 / 请求补充信息.
   Mirrors the bp-actions section used in the Planning Department's project
   review (App.jsx · group02/pc) but is presented as a separate agent
   card on the workspace page. cfg shape:
     {
       agent: { en, ar, zh },
       approvalObject: { en, ar, zh },
       dataPoint:       { en, ar, zh },
       actualRevenue:   string,         // pre-formatted money/value
       deltaAllocation: string,         // pre-formatted signed money
       reviewGate:      { tone, label },// tone: "ready" | "cond" | "hold"
       blocked:         boolean,
       blockedMsg:      { en, ar, zh },
       canApprove:      boolean,
     } ---- */
function PiaCard({ cfg }) {
  const { tr, pushLog } = useStore();
  const [status, setStatus] = useState(null);
  const decide = (k) => {
    if (k === "approve" && !cfg.canApprove) return;
    setStatus(k);
    const logKey = k === "approve" ? "approve" : k === "reject" ? "reject" : "info";
    const msgs = {
      approve: { en: "Reviewed estimate approved · routed to budget commitment (audit-logged).", ar: "اعتُمد التقدير المُراجَع.", zh: "复核预估已批准 · 转入预算承诺(已写审计)。" },
      reject:  { en: "Returned to source with reasons.",                                       ar: "أُعيد للمصدر مع المبررات.",      zh: "附理由退回源系统。" },
      info:    { en: "Requested more info from the source department.",                          ar: "طُلبت معلومات إضافية.",         zh: "已请求源部门补充信息。" },
    };
    pushLog({ en: tr(cfg.agent) + " · " + msgs[logKey].en, ar: msgs[logKey].ar, zh: tr(cfg.agent) + " · " + msgs[logKey].zh });
  };
  const gateClass = cfg.reviewGate && cfg.reviewGate.tone === "ready" ? "gate-ok" : cfg.reviewGate && cfg.reviewGate.tone === "cond" ? "gate-cond" : "gate-hold";
  const rowCell = (lab, val, valClass) => (<div className="pc-appr-cell"><span>{tr(lab)}</span><b className={valClass || ""}>{val}</b></div>);
  return (<div className="ws-pia orch-cell"><div className="orch pia">
    <div className="orch-h"><span className="orch-title">✦ {tr(cfg.agent)}</span><span className="orch-demo">{tr({ en: "approval operations", ar: "عمليات الاعتماد", zh: "审批操作" })}</span></div>
    <div className="uf-sec bp-actions pia-actions"><div className="uf-h">{tr({ en: "Decision", ar: "القرار", zh: "审批操作" })}</div>
      {status
        ? <div className="bp-next"><div className="bp-next-h">{status === "approve" ? "✓ " + tr({ en: "Approved", ar: "معتمد", zh: "已批准" }) : status === "reject" ? "✕ " + tr({ en: "Rejected", ar: "مرفوض", zh: "已驳回" }) : "✎ " + tr({ en: "Info requested", ar: "طُلبت معلومات", zh: "已请求补充信息" })}</div>
            <div className="bp-next-b">{tr(status === "approve" ? { en: "Reviewed estimate approved · routed downstream (audit-logged).", ar: "اعتُمد التقدير المُراجَع.", zh: "复核预估已批准 · 已下发下游(已写审计)。" } : status === "reject" ? { en: "Returned to the source with reasons.", ar: "أُعيد للمصدر.", zh: "附理由退回源系统。" } : { en: "Additional evidence requested from the source.", ar: "طُلبت أدلة.", zh: "已向源部门索取补充佐证。" })}</div>
            <button className="dw-btn" onClick={() => setStatus(null)}>↺ {tr({ en: "Reopen", ar: "إعادة فتح", zh: "重新评审" })}</button></div>
        : <React.Fragment>
            <div className="pc-appr-sum"><div className="pc-appr-l">{tr({ en: "Approval object · data anomaly", ar: "موضوع الاعتماد · شذوذ البيانات", zh: "审批对象 · 数据异常" })}</div>
              <div className="pc-appr-row">
                {rowCell({ en: "Approval object", ar: "موضوع الاعتماد", zh: "审批对象" }, tr(cfg.approvalObject), "pc-appr-nm")}
                {rowCell({ en: "Data point", ar: "نقطة البيانات", zh: "数据点" }, tr(cfg.dataPoint))}
                {rowCell({ en: "Actual revenue", ar: "الإيراد الفعلي", zh: "实际收益" }, cfg.actualRevenue)}
                {rowCell({ en: "Δ vs allocation", ar: "الفرق مقابل التخصيص", zh: "对比分配额差额" }, cfg.deltaAllocation)}
                {rowCell({ en: "Review gate", ar: "بوابة المراجعة", zh: "评审门" }, tr(cfg.reviewGate.label), gateClass)}
              </div></div>
            {cfg.blocked && <div className="bp-defwarn">⚠ {tr(cfg.blockedMsg)}</div>}
            <div className="bp-act-btns">
              <button className="dw-btn primary" disabled={!cfg.canApprove} onClick={() => decide("approve")}>{tr({ en: "Approve reviewed estimate", ar: "اعتماد التقدير المُراجَع", zh: "批准复核预估" })}</button>
              <button className="dw-btn danger" onClick={() => decide("reject")}>{tr({ en: "Reject", ar: "رفض", zh: "驳回" })}</button>
              <button className="dw-btn" onClick={() => decide("info")}>{tr({ en: "Request more info", ar: "طلب معلومات", zh: "请求补充信息" })}</button>
            </div></React.Fragment>}
    </div>
  </div></div>);
}

function WsConsoleCard({ to, label, sub }) {
  const { tr, setRoute, route, setBackRoute, setDeptSub } = useStore();
  return (<div className="ws-console-card" onClick={() => { setBackRoute(route); setDeptSub("budexec"); setRoute(to); }}>
    <div className="ws-cc-ic">⌗</div>
    <div className="ws-cc-t"><div className="ws-cc-h">{tr(label)}</div><div className="ws-cc-s">{tr(sub)}</div></div>
    <span className="ws-cc-go">{tr({ en: "Open", ar: "فتح", zh: "打开" })} ↗</span>
  </div>);
}

function DeptWorkspace({ cfg }) {
  const { tr } = useStore();
  const [qaOpen, setQaOpen] = useState(false);
  const [ask, setAsk] = useState("");
  const [qa, setQa] = useState([]);
  const [thinking, setThinking] = useState(false);
  const sqAsk = (q) => {
    q = (q || "").trim(); if (!q || thinking) return;
    setQa(p => [...p, { role: "u", text: q }]); setAsk(""); setThinking(true);
    const a = tr({ en: "Routed to the department orchestrator — open the Multi-Agent Flow to see the traceable answer with cited sources.", ar: "حُوِّل إلى منسّق الإدارة — افتح تدفّق الوكلاء لرؤية الإجابة القابلة للتتبع بمصادرها.", zh: "已转交部门编排器——打开「多智能体流程」查看带引用来源的可追溯答复。" });
    setTimeout(() => { setQa(p => [...p, { role: "a", text: a }]); setThinking(false); }, 850);
  };
  return (<div className="fade"><div className="card pad ws-frame">
    <div className="ws-head">
      <div className="ws-htext"><h1 style={{ fontSize: 22 }}>{tr(cfg.title)}</h1>
        <div className="sub muted">{tr(cfg.mandate)}{SHOW_UC ? " · " + cfg.uc : ""}</div></div>
      <div className="ws-story-r">
        <div className="ws-story-h">{tr({ en: "G-06 storyline · downstream evolution", ar: "مسار ج-06 · التطور اللاحق", zh: "G-06 故事线 · 下游演进" })}</div>
        <div className="flowstrip mini">{(cfg.flow || RC_FLOW).map((f, i) => (<React.Fragment key={i}>{i > 0 && <span className="farr">➜</span>}
          <div className={"fb " + f.cls}>{f.star ? "★ " : ""}{(SHOW_UC && !cfg.flowHideUc) ? f.code : tr(f.label)}</div></React.Fragment>))}</div>
      </div>
    </div>
    <KpiCarousel tone={cfg.kpiTone} slides={cfg.kpiSlides} />
    <div className="ws-grid2">
      <div className="ws-left"><BusinessPlaza model={cfg.plazaModel} defaultSel={cfg.plazaSel} /></div>
      <div className="ws-right">
        <OrchChat cfg={cfg.orch} />
        {cfg.pia && <PiaCard cfg={cfg.pia} />}
        {cfg.console && <WsConsoleCard to={cfg.console} label={cfg.consoleLabel} sub={cfg.consoleSub} />}
        <WsFlowCard to={cfg.flowRoute} />
      </div>
    </div>
    {/* floating Q&A — portaled to body */}
    {typeof document !== "undefined" && createPortal(<React.Fragment><button className="wb-qfab" onClick={() => setQaOpen(o => !o)} aria-label="AI Narratives & Q&A" title={tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}>🤖</button>
    {qaOpen && <div className="wb-qpanel qa">
      <div className="wb-qph"><span className={"wb-dot " + (cfg.kpiTone || "violet")} /> <b>{tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}</b><button className="wb-qx" onClick={() => setQaOpen(false)}>✕</button></div>
      <div className="wb-pb wb-qbody">
        {qa.length === 0 && !thinking && <div className="wb-narrwrap"><div className="wb-ntag">{tr({ en: "ASK THE DEPARTMENT", ar: "اسأل الإدارة", zh: "向本部门提问" })}</div><div className="wb-narr">{cfg.sqScope ? <p>{tr(cfg.sqScope)}</p> : null}</div></div>}
        {(qa.length > 0 || thinking) && <div className="wb-qa">
          {qa.map((m, i) => (<div className={"wb-qm " + m.role} key={i}><div className="bb"><Money v={m.text} /></div></div>))}
          {thinking && <div className="wb-qm a"><div className="bb think"><span className="wb-typing"><i /><i /><i /></span></div></div>}
        </div>}
        <div className="wb-askh">{tr({ en: "Suggested questions", ar: "أسئلة مقترحة", zh: "建议问题" })}</div>
        {(cfg.sqPrompts || []).map((q, i) => (<div className="wb-sq" key={i} onClick={() => sqAsk(tr(q))}>{tr(q)} <span className="ar">→</span></div>))}
        <div className="wb-ask"><input value={ask} onChange={e => setAsk(e.target.value)} placeholder={tr({ en: "Type your question…", ar: "اكتب سؤالك…", zh: "输入你的问题…" })} onKeyDown={e => e.key === "Enter" && sqAsk(ask)} /><button className="btn sm" onClick={() => sqAsk(ask)}>{tr({ en: "Send", ar: "إرسال", zh: "发送" })}</button></div>
      </div>
    </div>}</React.Fragment>, document.body)}
  </div></div>);
}

function UcBench({ cfg }) {
  const { tr, setRoute, pushLog, setDeptSub, setBackRoute, backRoute } = useStore();
  const [ask, setAsk] = useState("");
  const [feed, setFeed] = useState(cfg.logs);
  const logRef = useRef(null);
  const [qa, setQa] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [showSugs, setShowSugs] = useState(false);
  const qaRef = useRef(null);
  const [qaOpen, setQaOpen] = useState(false);
  const [fsel, setFsel] = useState(cfg.scope.map(() => 0));
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n++; const base = cfg.logs[n % cfg.logs.length];
      const tm = "10:" + String((6 + n) % 60).padStart(2, "0");
      setFeed(f => [...f.slice(-7), { ...base, tm }]);
    }, 2300);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [feed]);
  useEffect(() => { const el = qaRef.current; if (el) el.scrollTop = el.scrollHeight; }, [qa, thinking]);
  const askQ = (idx, raw) => {
    const q = idx >= 0 ? tr(cfg.qs[idx]) : (raw || "").trim();
    if (!q || thinking) return;
    const a = idx >= 0 ? tr(cfg.answers[idx]) : tr(cfg.genAns);
    pushLog({ en: "Q&A → " + tr(cfg.agent) + ": " + q, ar: "سؤال → " + tr(cfg.agent) + ": " + q, zh: "提问 → " + tr(cfg.agent) + ":" + q });
    setShowSugs(false); setQaOpen(true);
    setQa(p => [...p, { role: "u", text: q }]); setAsk(""); setThinking(true);
    setTimeout(() => { setQa(p => [...p, { role: "a", text: a }]); setThinking(false); }, 850);
  };
  const badge = (s) => s === "running" ? <span className="wb-badge run">{tr({ en: "running", ar: "يعمل", zh: "运行中" })}</span>
    : <span className="wb-badge act">{tr({ en: "active", ar: "نشط", zh: "活动" })}</span>;
  const back = () => { if (backRoute) { const b = backRoute; setBackRoute(null); setRoute(b); } else { if (cfg.dept) setDeptSub(cfg.dept); setRoute(cfg.back); } };
  const cycleScope = (i, nv) => {
    const ns = fsel.map((v, j) => j === i ? nv : v); setFsel(ns);
    pushLog({ en: "Scope changed — " + cfg.scope[i].opts[nv], ar: "تغيّر النطاق — " + cfg.scope[i].opts[nv], zh: "作用域已更改 — " + cfg.scope[i].opts[nv] });
  };
  const goCta = (c) => { setBackRoute(cfg.route); setRoute(c.to); };
  return (<div className="fade wb">
    <div className="card pad wb-frame">
    <div className="card pad wb-head">
      <div><div className="wb-title"><button className="pg-back" onClick={back}>‹</button>
      <span className={"wb-dot " + (cfg.tone || "violet")} /> {tr(cfg.deptName)}{cfg.benchLabel ? " · " + tr(cfg.benchLabel) : " · " + tr({ en: "Analysis Workbench", ar: "منصة التحليل", zh: "分析工作台" })}</div>
        <div className="wb-subt">{ucl(cfg.uc, tr(cfg.subt))}</div></div>
      <div className="wb-chain"><span className="wb-clab">{tr(cfg.chainLab)}</span>{cfg.chain.map((c, i) => (<React.Fragment key={i}>{i > 0 && <span className="wb-carr">→</span>}<span className={"wb-cpill" + (c.here ? " here" : "") + (c.route && !c.here ? " link" : "")} onClick={c.route && !c.here ? () => { setBackRoute(cfg.route); setRoute(c.route); } : undefined}><span className="wb-cpos">{tr(BQ_POS[c.pos])}</span>{SHOW_UC ? c.code + " · " : ""}{tr(c.name)}</span></React.Fragment>))}</div>
    </div>
    <div className="wb-actbar">
      <div className="wb-ab-top">
        <div className="wb-ab-spark">✦</div>
        <div className="wb-ab-tt">
          <div><span className="wb-ab-lab">{tr({ en: "AI INSIGHT & NEXT ACTIONS", ar: "رؤى الذكاء الاصطناعي والإجراءات", zh: "AI 洞察与后续行动" })}</span><span className="wb-ab-meta">{SHOW_UC ? cfg.uc + " · " : ""}run {cfg.run} · {tr(cfg.agent)} · {tr({ en: "scope", ar: "النطاق", zh: "作用域" })}: {cfg.scope.map((f, i) => f.opts[fsel[i]]).join(" · ")}</span></div>
          <div className="wb-ab-insight"><Hi t={tr(cfg.summary)} /></div>
        </div>
      </div>
      <div className="wb-ab-rows">
        <div className="wb-ab-col">
          <div className="wb-ab-h">⚐ {tr({ en: "RECOMMENDED · prompts", ar: "موصى به · مقترحات", zh: "建议 · 提示(点击应用)" })}</div>
          <div className="wb-sugs">{cfg.recs.map((n, i) => (<button className="wb-sug" key={i} onClick={() => { pushLog({ en: "Applied recommendation — " + tr(n.t), ar: "تطبيق توصية — " + tr(n.t), zh: "已应用建议 — " + tr(n.t) }); setQaOpen(true); setShowSugs(false); setQa(p => [...p, { role: "u", text: tr(n.t) }]); setThinking(true); setTimeout(() => { setQa(p => [...p, { role: "a", text: tr(n.d) + " · " + tr({ en: "Applied — routed to the orchestrator for execution (human-in-the-loop).", ar: "طُبقت — أُحيلت للمنسّق للتنفيذ (إنسان ضمن الحلقة).", zh: "已应用——已转交编排器执行(人在回路)。" }) }]); setThinking(false); }, 650); }}><span className="pr">{i + 1}</span><span className="wb-sug-tx"><b>{tr(n.t)}</b><i>{tr(n.d)}</i></span></button>))}</div>
        </div>
        <div className="wb-ab-col r">
          <div className="wb-ab-h">➜ {tr({ en: "HAND OFF DOWNSTREAM · actions", ar: "تسليم لاحق · إجراءات", zh: "下游交接 · 动作" })}</div>
          <div className="wb-ctas">{cfg.ctas.map((c, i) => (<button className={"wb-cta " + (i === 0 ? "p" : "s")} key={i} onClick={() => goCta(c)}>{SHOW_UC && c.uc && <span className="uc">{c.uc}</span>}{tr(c.label)}<span className="ar">→</span></button>))}</div>
        </div>
      </div>
    </div>
    <div className="wb-sech shead">
      <div><h2>{tr(cfg.resultsH)}</h2><div className="muted">{ucl(cfg.uc, tr(cfg.resultsSub))}</div></div>
      <div className="wb-scope"><span className="wb-sl">{tr({ en: "SCOPE", ar: "النطاق", zh: "作用域" })}</span>
        {cfg.scope.map((f, i) => (<label className="wb-schip" key={i}><span className="k">{tr(f.k)}</span><select className="wb-ssel" value={fsel[i]} onChange={e => cycleScope(i, +e.target.value)}>{f.opts.map((o, oi) => <option value={oi} key={oi}>{o}</option>)}</select></label>))}
        <span className="wb-auto">● {tr({ en: "auto-applied", ar: "تطبيق تلقائي", zh: "自动应用" })}</span>
      </div>
    </div>
    <div className="wb-ogrid">{cfg.outputs.map((o, i) => (<div className="wb-ocard" key={i}><div className="oc-h">{tr(o.l)}{o.tag && <span className="oc-tag">{tr(o.tag)}</span>}</div><div className="oc-b"><div className="oc-v"><Money v={o.v} /></div><div className="oc-s">{tr(o.s)}</div></div>{o.rows && <div className="oc-rows">{o.rows.map((r, j) => (<div className="oc-row" key={j}><span className="k">{tr(r.k)}</span>{typeof r.pct === "number" && <span className="ocbar"><i style={{ width: r.pct + "%" }} /></span>}<span className="ov">{r.v}</span></div>))}</div>}</div>))}</div>
    {cfg.tool === "uc04" && <Uc04Forecaster />}
    {cfg.tool === "uc07" && <Uc07Planner />}
    {cfg.tool === "uc05" && <Uc05Scenario />}
    {cfg.tool === "uc17" && <Uc17Tower />}
    {cfg.tool === "uc15" && <Uc15Drivers />}
    {cfg.tool === "uc16" && <Uc16Subsidy />}
    {cfg.tool === "uc01" && <Uc01DataQuality />}
    {cfg.tool === "uc08" && <Uc08Entitlements />}
    {cfg.tool === "uc09" && <Uc09Closing />}
    <div className="wb-sech"><h2>{tr({ en: "Multi-Agent Workspace", ar: "مساحة عمل متعددة الوكلاء", zh: "多智能体工作区" })}</h2><div className="muted">{tr({ en: "Orchestrated agent roles & live action timeline", ar: "أدوار وكلاء منسّقة وخط زمني حي", zh: "编排的智能体角色与实时操作时间线" })}</div></div>
    <div className="wb-cols3 wb-work">
      <div className="wb-panel"><div className="wb-ph"><span className={"wb-dot " + (cfg.tone || "violet")} /> <b>{tr({ en: "Data Inputs · sources", ar: "مدخلات البيانات · المصادر", zh: "数据输入 · 源系统" })}</b><span className="wb-pm">{cfg.sources.length} {tr({ en: "systems", ar: "أنظمة", zh: "个系统" })}</span><button className="wb-impbtn" onClick={() => { pushLog({ en: "Manual Excel / CSV import — flagged as temporary source (BR-04)", ar: "استيراد Excel / CSV يدوي — مصدر مؤقت (BR-04)", zh: "手动导入 Excel / CSV — 标记为临时来源(BR-04)" }); setFeed(f => [...f.slice(-6), { tm: "10:07", h: { en: "Import", ar: "استيراد", zh: "导入" }, d: { en: "Excel/CSV received — flagged as temporary source (BR-04)", ar: "استُلم الملف — مصدر مؤقت (BR-04)", zh: "已接收 Excel/CSV——标记为临时来源(BR-04)" }, dot: "amber" }]); }}>⬆ {tr({ en: "Import Excel/CSV", ar: "استيراد Excel/CSV", zh: "导入 Excel/CSV" })}</button></div>
        <div className="wb-pb"><div className="wb-srclist">{cfg.sources.map((s, i) => (<div className="wb-src" key={i}><span className={"sd" + (s.s === "loading" ? " load" : "")} /><span className="sn">{typeof s.n === "string" ? s.n : tr(s.n)}</span><span className="ss">{tr(s.s === "loading" ? { en: "loading", ar: "تحميل", zh: "载入" } : { en: "synced", ar: "متزامن", zh: "已同步" })}</span></div>))}</div></div></div>
      <div className="wb-panel"><div className="wb-ph"><span className={"wb-dot " + (cfg.tone || "violet")} /> <b>{tr({ en: "Orchestrator · Task Board", ar: "المنسّق · لوحة المهام", zh: "编排器 · 任务板" })}</b><span className="wb-orchpill"><span className="gear">⚙</span>{tr({ en: "Auto-orchestration", ar: "تنسيق تلقائي", zh: "自动编排" })} · {cfg.roles.length} {tr({ en: "agents", ar: "وكلاء", zh: "个智能体" })}</span></div>
        <div className="wb-pb">{cfg.roles.map((r, i) => (<div className={"wb-role " + (r.cls || "")} key={i}>
          <div className="rl"><div className="rt">{tr(r.name)}</div><div className="rs">{tr(r.sub)}</div></div>{badge(r.status)}
        </div>))}</div></div>
      <div className="wb-panel"><div className="wb-ph"><span className={"wb-dot " + (cfg.tone || "violet")} /> <b>{tr({ en: "Agent Timeline · Logs", ar: "خط زمن الوكلاء · السجلات", zh: "智能体时间线 · 日志" })}</b><span className="wb-pm">{tr({ en: "last 5 min", ar: "آخر 5 د", zh: "最近 5 分钟" })}</span></div>
        <div className="wb-pb"><div className="wb-tl" ref={logRef}>{feed.map((e, i) => (<div className={"wb-ev" + (i === feed.length - 1 ? " live" : "")} key={i}><span className={"wb-dot2 " + e.dot} /><div className="wb-eh"><b>{e.tm}</b> · {e.code ? ucl(e.code, tr(e.h)) : tr(e.h)}</div><div className="wb-ed">{tr(e.d)}</div></div>))}</div></div></div>
    </div>
    {/* floating Q&A — portaled to body to escape animated containing blocks */}
    {typeof document !== "undefined" && createPortal(<React.Fragment><button className="wb-qfab" onClick={() => setQaOpen(o => !o)} aria-label="AI Narratives & Q&A" title={tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}>🤖</button>
    {qaOpen && <div className="wb-qpanel qa">
      <div className="wb-qph"><span className={"wb-dot " + (cfg.tone || "violet")} /> <b>{tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}</b><button className="wb-qx" onClick={() => setQaOpen(false)}>✕</button></div>
        <div className="wb-pb wb-qbody">
          {qa.length === 0 && !thinking && <div className="wb-narrwrap"><div className="wb-ntag">{ucl(cfg.uc, tr({ en: "NARRATIVE", ar: "السرد", zh: "叙述" }))}</div>
          <div className="wb-narr">
            {cfg.narr.p.map((p, i) => <p key={i}>{tr(p)}</p>)}
            <div className="wb-rp">{tr({ en: "Recommended priorities:", ar: "الأولويات الموصى بها:", zh: "建议优先事项:" })}</div>
            <ul>{cfg.narr.recs.map((r, i) => <li key={i}>{tr(r)}</li>)}</ul>
            <div className="wb-src">{ucl(cfg.uc, tr(cfg.narr.src))}</div>
          </div></div>}
          {(qa.length > 0 || thinking) && <div className="wb-qa" ref={qaRef}>
            {qa.map((m, i) => (<div className={"wb-qm " + m.role} key={i}><div className="bb"><Money v={m.text} /></div></div>))}
            {thinking && <div className="wb-qm a"><div className="bb think"><span className="wb-typing"><i /><i /><i /></span></div></div>}
          </div>}
          <div className={"wb-sqh" + (qa.length > 0 ? " tog" : "")} onClick={() => { if (qa.length > 0) setShowSugs(v => !v); }}>{tr({ en: "SUGGESTED QUESTIONS", ar: "أسئلة مقترحة", zh: "建议问题" })}{qa.length > 0 && <span className="sqtg">{showSugs ? "▾" : "▸"}</span>}</div>
          {(qa.length === 0 || showSugs) && cfg.qs.map((q, i) => (<div className="wb-sq" key={i} onClick={() => askQ(i)}>{tr(q)} <span className="ar">→</span></div>))}
          <div className="wb-askh">{tr({ en: "Ask the agent…", ar: "اسأل الوكيل…", zh: "向智能体提问…" })}</div>
          <div className="wb-ask"><input value={ask} onChange={e => setAsk(e.target.value)} placeholder={tr({ en: "Type your question…", ar: "اكتب سؤالك…", zh: "输入你的问题…" })} onKeyDown={e => e.key === "Enter" && askQ(-1, ask)} /><button className="btn sm" onClick={() => askQ(-1, ask)}>{tr({ en: "Send", ar: "إرسال", zh: "发送" })}</button></div>
        </div>
    </div>}</React.Fragment>, document.body)}
    </div>
  </div>);
}

export {
  SHOW_UC, sanitizeUc, ucl, F6_AG, BQ_POS, Hi, OrchNext,
  askHiAgent, mdToJsx,
  DirectorateFlow, KpiCarousel, BusinessPlaza, WsFlowCard, OrchChat, WsConsoleCard, DeptWorkspace, UcBench, PiaCard,
  Uc04Forecaster, Uc07Planner, Uc05Scenario, Uc17Tower, Uc15Drivers, Uc16Subsidy,
  Uc01DataQuality, Uc08Entitlements, Uc09Closing,
};
