/* 财务权益部 — UC-10 报告中心 (G-04 专属页面).
   从 src/App.jsx 完整复制 ReportHub(及依赖的 RP_REPORTS / RP_STEPS),
   改为 G-04 财务权益部语境:
   - back 改为 "entwork"(返回权益部门广场)
   - 顶部 wb-chain 改为 G-04 统一链路(UC-01 → UC-08 → UC-09 → UC-10)
   - 头部标识/贡献流/指标等改为 G-04 部门视角(权益、索赔、对账、报告)
   - 复制 SmartQueryFab 简单版(嵌入式而非 portal,免去依赖)
   src/App.jsx 中 ReportHub 保持不变,两者完全独立。 */
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useStore } from "../../shared/store.jsx";

const SHOW_UC = (() => { try { return new URLSearchParams(window.location.search).get("uc") === "true"; } catch (e) { return false; } })();  // mirror App.jsx: hide UC-xx codes unless ?uc=true

/* ---- RP_REPORTS (G-04 视角) ---- */
const RP_REPORTS = [
  { id: "q", name: { en: "G-04 · Claims & Disbursements — Quarterly", ar: "ج-04 · المطالبات والصرف — ربعي", zh: "G-04 · 索赔与拨付 — 季度" }, sub: { en: "Entitlements department report", ar: "تقرير إدارة الاستحقاقات", zh: "权益部门报告" }, type: { en: "Periodic · Dept", ar: "دوري · إدارة", zh: "周期 · 部门" }, period: "Q2 2026", srcs: ["01", "08", "09"], status: "review", upd: "1h", title: { en: "G-04 · Claims & Disbursements — Quarterly (FY 2026 · Q2)", ar: "ج-04 · المطالبات والصرف — ربعي (2026 · ر2)", zh: "G-04 · 索赔与拨付 — 季度(FY 2026 · Q2)" } },
  { id: "ent", name: { en: "Entitlements Execution Report", ar: "تقرير تنفيذ الاستحقاقات", zh: "权益执行报告" }, sub: { en: "Plan vs actual, transfer requests, liquidity", ar: "الخطة مقابل الفعلي وطلبات المناقلة والسيولة", zh: "计划 vs 实际、转移申请、流动性" }, type: { en: "Periodic · Dept", ar: "دوري · إدارة", zh: "周期 · 部门" }, period: "Q2 2026", srcs: ["01", "08"], status: "review", upd: "2h", title: { en: "Entitlements Execution Report (FY 2026 · Q2)", ar: "تقرير تنفيذ الاستحقاقات (2026 · ر2)", zh: "权益执行报告(FY 2026 · Q2)" } },
  { id: "close", name: { en: "Closing & Reconciliation Report", ar: "تقرير الإقفال والمطابقة", zh: "关账与对账报告" }, sub: { en: "Pre-close checklist, reconciliation, settlements", ar: "قائمة ما قبل الإقفال والمطابقة والتسويات", zh: "关账前清单、对账、结算" }, type: { en: "Periodic · Dept", ar: "دوري · إدارة", zh: "周期 · 部门" }, period: "Q2 2026", srcs: ["09", "01"], status: "draft", upd: "3h", title: { en: "Closing & Reconciliation Report (FY 2026 · Q2)", ar: "تقرير الإقفال والمطابقة (2026 · ر2)", zh: "关账与对账报告(FY 2026 · Q2)" } },
  { id: "trans", name: { en: "Transfer & Enhancement Request Pack", ar: "حزمة طلبات المناقلة والتعزيز", zh: "转移与增强申请汇编" }, sub: { en: "Arabic draft requests to budget execution", ar: "طلبات مسودات عربية لتنفيذ الميزانية", zh: "向预算执行提交的阿语申请草稿" }, type: { en: "Compilation", ar: "تجميع", zh: "汇编" }, period: "Q2 2026", srcs: ["08", "17"], status: "draft", upd: "1d", title: { en: "Transfer & Enhancement Request Pack (Q2)", ar: "حزمة طلبات المناقلة والتعزيز (ر2)", zh: "转移与增强申请汇编(Q2)" } },
  { id: "exec", name: { en: "Executive Summary — Entitlements", ar: "ملخص تنفيذي — الاستحقاقات", zh: "执行摘要 — 权益" }, sub: { en: "One-page liquidity & deviation summary", ar: "صفحة واحدة: السيولة والانحرافات", zh: "一页流动性与偏差摘要" }, type: { en: "Executive", ar: "تنفيذي", zh: "执行" }, period: "Jun 2026", srcs: ["01", "08", "09", "02"], status: "issued", upd: "Jun 28", title: { en: "Executive Summary — Entitlements (Jun 2026)", ar: "ملخص تنفيذي — الاستحقاقات (يونيو 2026)", zh: "执行摘要 — 权益(2026 年 6 月)" } },
  { id: "adhoc", name: { en: "Ad-hoc · \"Overdue by Amanah\"", ar: "حسب الطلب · «التأخر حسب الأمانة»", zh: "即席 · 「按阿玛纳逾期」" }, sub: { en: "Natural-language query report", ar: "تقرير استعلام بلغة طبيعية", zh: "自然语言查询报告" }, type: { en: "Ad-hoc · NL", ar: "حسب الطلب · لغة طبيعية", zh: "即席 · 自然语言" }, period: "Q2 2026", srcs: ["01", "08"], status: "draft", upd: "10m", title: { en: "Ad-hoc · \"Overdue by Amanah\"", ar: "حسب الطلب · «التأخر حسب الأمانة»", zh: "即席 · 「按阿玛纳逾期」" } },
];
const RP_STEPS = { draft: 0, review: 1, appr: 2, issued: 3 };

/* ---- Simple Smart Query (embedded, not portal) for G-04 reports ---- */
function G04ReportQuery({ scope, prompts }) {
  const { tr, pushLog } = useStore();
  const [open, setOpen] = useState(false);
  const [ask, setAsk] = useState("");
  const [qa, setQa] = useState([]);
  const [thinking, setThinking] = useState(false);
  const SQ_GEN = { en: "Based on the unified G-04 layer: 1,240 plan rows aligned (18% variance), SAR 412M expected claims, 2 budget lines short SAR 57M.", ar: "من طبقة ج-04 الموحّدة: 1,240 صفاً مطابقاً (انحراف 18%)، 412 مليوناً مطالبات متوقعة، بندان بعجز 57 مليوناً.", zh: "依据 G-04 统一数据层:1,240 行计划已对齐(偏差 18%),预期索赔 SAR 412M,2 行短缺 SAR 57M。" };
  const send = (q) => {
    const v = (q || ask).trim(); if (!v || thinking) return;
    pushLog({ en: "Smart query → " + v, ar: "استعلام ذكي → " + v, zh: "智能查询 → " + v });
    setQa(p => [...p, { role: "u", text: v }]); setAsk(""); setThinking(true);
    setTimeout(() => { setQa(p => [...p, { role: "a", text: tr(SQ_GEN) }]); setThinking(false); }, 800);
  };
  return (<div className="g04-rp-qf">
    <button className="wb-qfab" onClick={() => setOpen(o => !o)} title={tr({ en: "Smart query", ar: "استعلام ذكي", zh: "智能查询" })}>🤖</button>
    {open && <div className="wb-qpanel qa">
      <div className="wb-qph"><span className="wb-dot violet" /> <b>{tr({ en: "Smart query", ar: "استعلام ذكي", zh: "智能查询" })}</b>{SHOW_UC && <span style={{ fontSize: 9, fontWeight: 800, color: "#6d28d9", background: "#f5effe", borderRadius: 6, padding: "1px 6px", marginInlineStart: 6 }}>UC-03</span>}<button className="wb-qx" onClick={() => setOpen(false)}>✕</button></div>
      <div className="wb-pb wb-qbody">
        {scope && <div className="wb-src" style={{ marginBottom: 8 }}>{tr(scope)}</div>}
        <div className="wb-qa sq-conv">
          {qa.length === 0 && !thinking && <div className="sq-empty">{tr({ en: "Ask the entitlements agent anything within this scope — or tap a suggested question below.", ar: "اسأل وكيل الاستحقاقات ضمن هذا النطاق — أو اختر سؤالاً مقترحاً أدناه.", zh: "在此作用域内向权益智能体提问——或点击下方的建议问题。" })}</div>}
          {qa.map((m, i) => (<div className={"wb-qm " + m.role} key={i}><div className="bb">{m.text}</div></div>))}
          {thinking && <div className="wb-qm a"><div className="bb think"><span className="wb-typing"><i /><i /><i /></span></div></div>}
        </div>
        <div className="wb-sqh">{tr({ en: "SUGGESTED QUESTIONS", ar: "أسئلة مقترحة", zh: "建议问题" })}</div>
        {(prompts || []).map((q, i) => (<div className="wb-sq" key={i} onClick={() => send(tr(q))}>{tr(q)} <span className="ar">→</span></div>))}
        <div className="wb-askh">{tr({ en: "Ask the entitlements agent…", ar: "اسأل وكيل الاستحقاقات…", zh: "向权益智能体提问…" })}</div>
        <div className="wb-ask"><input value={ask} onChange={e => setAsk(e.target.value)} placeholder={tr({ en: "Type your question…", ar: "اكتب سؤالك…", zh: "输入你的问题…" })} onKeyDown={e => e.key === "Enter" && send()} /><button className="btn sm" onClick={() => send()}>{tr({ en: "Send", ar: "إرسال", zh: "发送" })}</button></div>
      </div>
    </div>}
  </div>);
}

/* ---- G-04 故事线 (与 g04Chain.js 保持一致,UC-10 是 here) ---- */
const G04_CHAIN_HEADER = [
  { code: "UC-01", route: "g04bench01", pos: { en: "UPSTREAM", ar: "منبع", zh: "上游" }, name: { en: "Financial Data Standardization and Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" } },
  { code: "UC-08", route: "bench08", pos: { en: "UPSTREAM", ar: "منبع", zh: "上游" }, name: { en: "Contracts, Claims, Disbursements, and Entitlements", ar: "العقود والمطالبات والصرف والاستحقاقات", zh: "合同、索赔、拨付与权益" } },
  { code: "UC-09", route: "g04bench09", pos: { en: "UPSTREAM", ar: "منبع", zh: "上游" }, name: { en: "Financial Closing, Reconciliation and Settlements", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与结算" } },
  { code: "UC-10", route: "g04reports", pos: { en: "CONVERGE ★", ar: "تقارب ★", zh: "汇聚 ★" }, name: { en: "Reporting & dashboards", ar: "التقارير ولوحات المعلومات", zh: "报告与仪表盘" }, here: true },
];

function ReportsEnt() {
  const { tr, setRoute, backRoute, setBackRoute, pushLog } = useStore();
  const [reports, setReports] = useState(RP_REPORTS);
  const [open, setOpen] = useState(null);
  const [nw, setNw] = useState(false);
  const [nmode, setNmode] = useState("tmpl");
  const [ntmpl, setNtmpl] = useState("q");
  const [nnl, setNnl] = useState("");
  const [flt, setFlt] = useState([0, 0, 0, 0]);
  const [exp, setExp] = useState({});
  const mark = (k, log, keep) => { pushLog(log); setExp(e => ({ ...e, [k]: true })); if (!keep) setTimeout(() => setExp(e => ({ ...e, [k]: false })), 1800); };
  const RP_FLT = [
    { k: { en: "Type", ar: "النوع", zh: "类型" }, opts: [{ en: "All", ar: "الكل", zh: "全部" }, { en: "Periodic", ar: "دوري", zh: "周期" }, { en: "Ad-hoc", ar: "حسب الطلب", zh: "即席" }] },
    { k: { en: "Period", ar: "الفترة", zh: "期间" }, opts: ["FY 2026 · Q2", "FY 2026 · Q1", "FY 2025 · Q4"] },
    { k: { en: "Department", ar: "الإدارة", zh: "部门" }, opts: [{ en: "All", ar: "الكل", zh: "全部" }, "G-02", "G-03", "G-04", "G-05", "G-06"] },
    { k: { en: "Status", ar: "الحالة", zh: "状态" }, opts: [{ en: "All", ar: "الكل", zh: "全部" }, { en: "Draft", ar: "مسودة", zh: "草稿" }, { en: "Under Review", ar: "قيد المراجعة", zh: "审核中" }, { en: "Approved", ar: "معتمد", zh: "已批准" }, { en: "Issued", ar: "صادر", zh: "已发布" }] },
  ];
  const r = reports.find(x => x.id === open);
  const TEMPLATES = [
    { key: "q", name: { en: "G-04 Quarterly · Claims & Disbursements", ar: "ج-04 ربعي · المطالبات والصرف", zh: "G-04 季度 · 索赔与拨付" }, srcs: ["01", "08", "09"] },
    { key: "ent", name: { en: "Entitlements Execution", ar: "تنفيذ الاستحقاقات", zh: "权益执行" }, srcs: ["01", "08"] },
    { key: "close", name: { en: "Closing & Reconciliation", ar: "الإقفال والمطابقة", zh: "关账与对账" }, srcs: ["09", "01"] },
    { key: "trans", name: { en: "Transfer & Enhancement Pack", ar: "حزمة المناقلة والتعزيز", zh: "转移与增强汇编" }, srcs: ["08", "17"] },
    { key: "exec", name: { en: "Executive Summary", ar: "ملخص تنفيذي", zh: "执行摘要" }, srcs: ["01", "08", "09", "02"] },
  ];
  const genReport = () => {
    const id = "n" + Date.now();
    let rep;
    if (nmode === "nl") { const q = nnl.trim() || tr({ en: "Ad-hoc query", ar: "استعلام", zh: "即席查询" }); rep = { id, name: "Ad-hoc · " + q, sub: { en: "Natural-language query report", ar: "تقرير استعلام بلغة طبيعية", zh: "自然语言查询报告" }, type: { en: "Ad-hoc · NL", ar: "حسب الطلب", zh: "即席 · 自然语言" }, period: "Q2 2026", srcs: ["01", "08"], status: "draft", upd: tr({ en: "now", ar: "الآن", zh: "刚刚" }), title: "Ad-hoc · " + q }; }
    else { const t = TEMPLATES.find(x => x.key === ntmpl); rep = { id, name: t.name, sub: { en: "Generated from template", ar: "مولّد من قالب", zh: "由模板生成" }, type: { en: "Periodic", ar: "دوري", zh: "周期" }, period: "Q2 2026", srcs: t.srcs, status: "draft", upd: tr({ en: "now", ar: "الآن", zh: "刚刚" }), title: tr(t.name) + " (FY 2026 · Q2)" }; }
    setReports([rep, ...reports]); setNw(false); setNnl(""); setOpen(id);
  };
  const ucCls = (c) => "uc" + c;
  const stLabel = (s) => ({ draft: { en: "Draft", ar: "مسودة", zh: "草稿" }, review: { en: "Under Review", ar: "قيد المراجعة", zh: "审核中" }, appr: { en: "Approved", ar: "معتمد", zh: "已批准" }, issued: { en: "Issued", ar: "صادر", zh: "已发布" } }[s]);
  const STEPL = [{ en: "Draft", ar: "مسودة", zh: "草稿" }, { en: "Under Review", ar: "قيد المراجعة", zh: "审核中" }, { en: "Approved", ar: "معتمد", zh: "已批准" }, { en: "Issued", ar: "صادر", zh: "已发布" }];
  const backTarget = backRoute || "entwork";
  const goBack = () => { setBackRoute(null); setRoute(backTarget); };
  return (<div className="fade ws-page">
    <div className="rp-libhd">
      <div className="rp-libL">
        <div className="rp-libtitle">{backRoute && <button className="rp-backbtn" title={tr({ en: "Back", ar: "رجوع", zh: "返回" })} onClick={goBack}>‹</button>}<div><div className="dw-eyebrow g" style={{ marginBottom: 2 }}>{tr({ en: "Department Workspace · convergence", ar: "مساحة عمل الإدارة · تجميعي", zh: "部门工作区 · 汇聚" })}</div><h1 className="rp-h1">{tr({ en: "Report Library", ar: "مكتبة التقارير", zh: "报告库" })}{SHOW_UC ? " · UC-10" : ""}</h1></div></div>
        <div className="sub muted" style={{ fontSize: 12.5, marginTop: 3 }}>{tr({ en: "Mandate: generate financial/administrative reports & narrative commentary (UC-10). Workspace — convergence type: report library + contributions inbox from claims, closing, and entitlements processing.", ar: "المهمة: إنشاء التقارير والتعليق السردي (UC-10). مساحة العمل — نوع تجميعي: مكتبة + صندوق مساهمات من المطالبات والإقفال والاستحقاقات.", zh: "职责:生成财务/行政报告与叙述评述(UC-10)。Workspace — 汇聚型:报告库 + 来自索赔/关账/权益处理的贡献 inbox。" })}</div>
      </div>
      <G04ReportQuery scope={{ en: "Scope: G-04 Reporting · all sources", ar: "النطاق: تقارير ج-04 · كل المصادر", zh: "范围:G-04 报告 · 全部来源" }} prompts={[{ en: "Which claims reports are pending approval?", ar: "ما تقارير المطالبات بانتظار الاعتماد؟", zh: "哪些索赔报告待审批?" }, { en: "Show plan-vs-actual variance for Q2", ar: "إظهار انحراف الخطة مقابل الفعلي للربع الثاني", zh: "显示 Q2 计划与实际偏差" }, { en: "Explain the SAR 57M liquidity gap", ar: "اشرح فجوة السيولة 57 مليوناً", zh: "解释 SAR 57M 流动性缺口" }]} />
      <div className="wb-chain rp-headchain"><span className="wb-clab">{tr({ en: "G-04 CHAIN", ar: "سلسلة ج-04", zh: "G-04 链路" })}</span>
        {G04_CHAIN_HEADER.map((n, i) => (<span className="wb-cseg" key={i}>{i > 0 && <span className="wb-carr">→</span>}<span className={"wb-cpill" + (n.here ? " here" : "") + (n.route && !n.here ? " link" : "")} onClick={n.route && !n.here ? () => { setBackRoute("g04reports"); setRoute(n.route); } : undefined}>{n.pos && <span className="wb-cpos">{tr(n.pos)}</span>}{SHOW_UC ? n.code + " · " : ""}{tr(n.name)}</span></span>))}
      </div>
    </div>
    <div className="rp-contrib">
      <div className="ch">{tr({ en: "Recent contributions · pushed from upstream UCs into reports", ar: "مساهمات حديثة · مدفوعة من الحالات الأعلى إلى التقارير", zh: "最近贡献 · 由上游 UC 推入报告" })}</div>
      <div className="row"><span className="rp-uc uc08">UC-08</span><span className="arr">→</span> {tr({ en: "attached", ar: "أرفق", zh: "附入" })} <b>{tr({ en: "claims batch (16 verified)", ar: "دفعة مطالبات (16 متحققة)", zh: "索赔批次(16 笔已核验)" })}</b> {tr({ en: "to", ar: "إلى", zh: "→" })} <span className="tgt">{tr({ en: "G-04 Quarterly", ar: "G-04 الربعي", zh: "G-04 季度报" })}</span><span className="age">1h</span></div>
      <div className="row"><span className="rp-uc uc09">UC-09</span><span className="arr">→</span> {tr({ en: "sent", ar: "أرسل", zh: "推送" })} <b>{tr({ en: "reconciliation results (98%)", ar: "نتائج المطابقة (98%)", zh: "对账结果(98%)" })}</b> {tr({ en: "to", ar: "إلى", zh: "→" })} <span className="tgt">{tr({ en: "Closing & Reconciliation Report", ar: "تقرير الإقفال والمطابقة", zh: "关账与对账报告" })}</span><span className="age">3h</span></div>
      <div className="row"><span className="rp-uc uc08">UC-08</span><span className="arr">→</span> {tr({ en: "fed", ar: "غذّى", zh: "喂入" })} <b>{tr({ en: "plan vs actual (1,240 rows · 18% variance)", ar: "الخطة مقابل الفعلي (1,240 صفاً · 18%)", zh: "计划 vs 实际(1,240 行 · 偏差 18%)" })}</b> {tr({ en: "to", ar: "إلى", zh: "→" })} <span className="tgt">{tr({ en: "Entitlements Execution Report", ar: "تقرير تنفيذ الاستحقاقات", zh: "权益执行报告" })}</span><span className="age">{tr({ en: "today", ar: "اليوم", zh: "今天" })}</span></div>
      <div className="row"><span className="rp-uc uc02">UC-02</span><span className="arr">→</span> {tr({ en: "flagged", ar: "رصد", zh: "标记" })} <b>{tr({ en: "1 critical liquidity gap", ar: "فجوة سيولة حرجة", zh: "1 项严重流动性缺口" })}</b> {tr({ en: "into", ar: "في", zh: "→" })} <span className="tgt">{tr({ en: "Executive Summary", ar: "الملخص التنفيذي", zh: "执行摘要" })}</span><span className="age">{tr({ en: "today", ar: "اليوم", zh: "今天" })}</span></div>
    </div>
    <div className="rp-filters">
      {RP_FLT.map((f, i) => (<div className="rp-fchip" key={i}><div className="k">{tr(f.k)}</div><select className="wb-ssel" value={flt[i]} onChange={e => setFlt(v => v.map((x, j) => j === i ? +e.target.value : x))}>{f.opts.map((o, oi) => <option value={oi} key={oi}>{typeof o === "string" ? o : tr(o)}</option>)}</select></div>))}
      <button className="rp-newbtn" style={{ marginInlineStart: "auto" }} onClick={() => setNw(true)}>+ {tr({ en: "New report", ar: "تقرير جديد", zh: "新建报告" })}</button>
    </div>
    <div className="rp-libtbl">
      <div className="rp-libhead"><div>{tr({ en: "Report", ar: "التقرير", zh: "报告" })}</div><div>{tr({ en: "Type", ar: "النوع", zh: "类型" })}</div><div>{tr({ en: "Period", ar: "الفترة", zh: "期间" })}</div><div>{tr({ en: "Assembled from", ar: "مُجمّع من", zh: "汇聚来源" })}</div><div>{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</div><div>{tr({ en: "Updated", ar: "محدّث", zh: "更新" })}</div></div>
      {reports.map(x => (<div className="rp-librow" key={x.id} onClick={() => setOpen(x.id)}>
        <div className="rp-rn">{tr(x.name)}<div className="sub">{tr(x.sub)}</div></div>
        <div>{tr(x.type)}</div><div>{x.period}</div>
        <div className="rp-srcs">{x.srcs.map((c, i) => <span className={"rp-uc " + ucCls(c)} key={i}>{c}</span>)}</div>
        <div><span className={"rp-st " + x.status}>{tr(stLabel(x.status))}</span></div>
        <div className="rp-upd">{x.upd}</div>
      </div>))}
    </div>

    {r && createPortal(<div className="rp-ov open" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
      <div className="rp-dw">
        <div className="rp-dwhead"><span className="rp-dwt">📄 {tr({ en: "Report Composer", ar: "منشئ التقارير", zh: "报告编排" })}</span><button className="rp-dwx" onClick={() => setOpen(null)}>✕ {tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button></div>
        <div className="rp-ctop">
          <div className="rp-ctl">
            <div className="rp-eyebrow">{tr({ en: "Report · view only", ar: "تقرير · للعرض فقط", zh: "报告 · 仅查看" })}{SHOW_UC ? " · UC-10" : ""}</div>
            <h2>{tr(r.title)}</h2>
            <div className="rp-asm"><span className="rp-asmlab">{tr({ en: "Assembled from", ar: "مُجمّع من", zh: "汇聚来源" })}</span>{r.srcs.map((c, i) => <span className={"rp-uc " + ucCls(c)} key={i}>UC-{c}</span>)}</div>
          </div>
          <div className="rp-ctr">
            <div className="rp-status">{STEPL.map((l, i) => { const cur = RP_STEPS[r.status]; const cls = i < cur ? "done" : (i === cur ? "cur" : ""); return (<React.Fragment key={i}>{i > 0 && <span className="arr">›</span>}<span className={"s " + cls}><span className="dot" />{tr(l)}</span></React.Fragment>); })}</div>
            <div className="rp-toolbtns"><button className="rp-ebtn" onClick={() => mark("w", { en: "Exporting report to Word…", ar: "تصدير إلى وورد…", zh: "正在导出 Word…" })}>{exp.w ? "✓ Word" : "⬇ Word"}</button><button className="rp-ebtn" onClick={() => mark("x", { en: "Exporting report to Excel…", ar: "تصدير إلى إكسل…", zh: "正在导出 Excel…" })}>{exp.x ? "✓ Excel" : "⬇ Excel"}</button><button className="rp-ebtn" onClick={() => mark("p", { en: "Exporting report to PDF…", ar: "تصدير إلى PDF…", zh: "正在导出 PDF…" })}>{exp.p ? "✓ PDF" : "⬇ PDF"}</button><button className="rp-send2" disabled={!!exp.s} onClick={() => mark("s", { en: "Report sent for approval", ar: "أُرسل التقرير للاعتماد", zh: "报告已送审" }, true)}>{exp.s ? tr({ en: "Sent ✓", ar: "أُرسل ✓", zh: "已送审 ✓" }) : tr({ en: "Send for approval", ar: "إرسال للاعتماد", zh: "送审" }) + " →"}</button></div>
          </div>
        </div>
        <div className="rp-gate">✓ <b>{tr({ en: "Source data approved", ar: "بيانات المصدر معتمدة", zh: "来源数据已核准" })}</b> — {tr({ en: "official report can be issued (BR-01). Every figure traces to an approved dataset.", ar: "يمكن إصدار التقرير الرسمي (BR-01). كل رقم قابل للتتبع.", zh: "可签发正式报告(BR-01);每个数字均可追溯至已核准数据集。" })}</div>
        <div className="rp-doc">
          <div className="rp-dochd"><div className="rp-doctitle">{tr(r.title)}</div>
            <div className="rp-docmeta"><span>{tr({ en: "Copy No.", ar: "نسخة رقم", zh: "副本号" })} <b>ENT-2026-Q2-118</b></span><span>{tr({ en: "Owner: Financial Entitlements Dept", ar: "المالك: إدارة الاستحقاقات", zh: "归属:财务权益部" })}</span><span>{tr({ en: "Issue date: pending", ar: "تاريخ الإصدار: معلّق", zh: "发布日期:待定" })}</span><span>{tr({ en: "Sources", ar: "المصادر", zh: "来源" })}: {r.srcs.length} UCs</span></div></div>
          <div className="rp-docb">
            <p className="rp-secl">{tr({ en: "Key figures & indicators · auto-filled from approved data", ar: "أرقام ومؤشرات · معبّأة تلقائياً", zh: "关键指标 · 自动取自已核准数据" })}</p>
            <table className="rp-tbl"><thead><tr><th>{tr({ en: "INDICATOR", ar: "المؤشر", zh: "指标" })}</th><th className="c">{tr({ en: "VALUE", ar: "القيمة", zh: "数值" })}</th><th>{tr({ en: "SOURCE", ar: "المصدر", zh: "来源" })}</th></tr></thead>
              <tbody>
                <tr><td>{tr({ en: "Plan rows aligned", ar: "صفوف الخطة المطابقة", zh: "计划行对齐" })}</td><td className="num">1,240</td><td><span className="rp-uc uc08">{tr({ en: "Entitlements", ar: "الاستحقاقات", zh: "权益部" })}</span></td></tr>
                <tr><td>{tr({ en: "Plan-vs-actual variance", ar: "انحراف الخطة مقابل الفعلي", zh: "计划 vs 实际偏差" })}</td><td className="num">18%</td><td><span className="rp-uc uc08">{tr({ en: "Entitlements", ar: "الاستحقاقات", zh: "权益部" })}</span></td></tr>
                <tr><td>{tr({ en: "Expected claims (wk 28–35)", ar: "المطالبات المتوقعة (28–35)", zh: "预期索赔(第28–35周)" })}</td><td className="num">SAR 412M</td><td><span className="rp-uc uc08">{tr({ en: "Entitlements", ar: "الاستحقاقات", zh: "权益部" })}</span></td></tr>
                <tr><td>{tr({ en: "Reconciliation rate", ar: "معدل المطابقة", zh: "对账率" })}</td><td className="num">98%</td><td><span className="rp-uc uc09">{tr({ en: "Closing", ar: "الإقفال", zh: "关账" })}</span></td></tr>
                <tr><td>{tr({ en: "Liquidity gap vs SAP", ar: "فجوة السيولة مقابل ساب", zh: "对 SAP 流动性缺口" })}</td><td className="num">SAR 57M</td><td><span className="rp-uc uc08">{tr({ en: "Entitlements", ar: "الاستحقاقات", zh: "权益部" })}</span></td></tr>
                <tr><td>{tr({ en: "Approved claims batch", ar: "دفعة المطالبات المعتمدة", zh: "已批准索赔批次" })}</td><td className="num">16 / SAR 268M</td><td><span className="rp-uc uc08">{tr({ en: "Entitlements", ar: "الاستحقاقات", zh: "权益部" })}</span></td></tr>
              </tbody></table>
            <p className="rp-secl">{tr({ en: "Trend · plan-vs-actual variance by quarter", ar: "الاتجاه · انحراف الخطة مقابل الفعلي ربعياً", zh: "趋势 · 各季度计划与实际偏差" })}</p>
            <div className="rp-chart"><div className="rp-bar" style={{ height: "55%" }}><span>14%</span><small>Q3-25</small></div><div className="rp-bar" style={{ height: "62%" }}><span>16%</span><small>Q4-25</small></div><div className="rp-bar" style={{ height: "66%" }}><span>17%</span><small>Q1-26</small></div><div className="rp-bar" style={{ height: "70%" }}><span>18%</span><small>Q2-26</small></div></div>
            <p className="rp-secl">{tr({ en: "Narrative commentary · auto-generated", ar: "تعليق سردي · مولّد تلقائياً", zh: "叙述评述 · 自动生成" })}</p>
            <div className="rp-narr"><span className="tag">AI</span>{tr({ en: "Plan-vs-actual variance held at 18% this quarter. ", ar: "حُبس انحراف الخطة مقابل الفعلي عند 18% هذا الربع. ", zh: "本季度计划与实际偏差维持在 18%。" })}<span className="dev">{tr({ en: "Liquidity:", ar: "السيولة:", zh: "流动性:" })}</span>{tr({ en: " SAR 412M of expected claims in weeks 28–35 (96 claims, peak week 29) — SAP covers all but 2 lines, B-3402 short SAR 43M and B-2884 short SAR 14M. ", ar: " 412 مليوناً مطالبات متوقعة (96 مطالبة، الذروة أسبوع 29) — يغطي ساب كل البنود عدا اثنين، B-3402 بعجز 43 وB-2884 بعجز 14. ", zh: " 第 28–35 周预期索赔 SAR 412M(96 笔,高峰第 29 周)——SAP 可覆盖除 2 行外的全部,B-3402 短缺 SAR 43M,B-2884 短缺 SAR 14M。" })}<span className="dev">{tr({ en: "Reconciliation:", ar: "المطابقة:", zh: "对账:" })}</span>{tr({ en: " 98% matched with SAR 25M net diff fully explained (Esnad +15M, Tahseel +10M). ", ar: " 98% مطابق وفرق 25 مليوناً مفسَّر بالكامل (إسناد +15، تحصيل +10). ", zh: "对账匹配 98%,SAR 25M 净差异已完全解释(Esnad +15M,Tahseel +10M)。" })}<span className="dev">{tr({ en: "Open item:", ar: "بند مفتوح:", zh: "未结项:" })}</span>{tr({ en: " Arabic transfer / enhancement request (SAR 57M) awaits review before signal fires to Budget Execution.", ar: " طلب المناقلة/التعزيز بالعربية (57 مليوناً) بانتظار المراجعة قبل الإشارة لتنفيذ الميزانية.", zh: " 阿语转移/增强申请(SAR 57M)等待审阅后向预算执行部触发信号。" })}</div>
            <div className="rp-narrnote">{tr({ en: "Commentary explains deviations, not just numbers (BR-02) · human review required before release.", ar: "التعليق يفسّر الانحرافات لا الأرقام فقط (BR-02) · يلزم مراجعة بشرية.", zh: "评述解释偏差而非仅罗列数字(BR-02)· 签发前需人工复核。" })}</div>
            <p className="rp-secl">{tr({ en: "Data sources · lineage", ar: "مصادر البيانات · التتبع", zh: "数据来源 · 追溯" })}</p>
            <div className="rp-lin"><span className="ln">{tr({ en: "Plan rows, claims forecast, liquidity gap", ar: "صفوف الخطة وتوقع المطالبات وفجوة السيولة", zh: "计划行、索赔预测、流动性缺口" })}</span><span className="src">← {tr({ en: "Entitlements (UC-08)", ar: "الاستحقاقات (UC-08)", zh: "权益部 (UC-08)" })} →</span></div>
            <div className="rp-lin"><span className="ln">{tr({ en: "Reconciliation results, settlements", ar: "نتائج المطابقة والتسويات", zh: "对账结果、结算" })}</span><span className="src">← {tr({ en: "Closing (UC-09)", ar: "الإقفال (UC-09)", zh: "关账 (UC-09)" })} →</span></div>
            <div className="rp-lin"><span className="ln">{tr({ en: "Data quality & lineage", ar: "جودة البيانات والتتبع", zh: "数据质量与血缘" })}</span><span className="src">← {tr({ en: "Unified layer (UC-01)", ar: "الطبقة الموحّدة (UC-01)", zh: "统一数据层 (UC-01)" })} →</span></div>
            <div className="rp-lin"><span className="ln">{tr({ en: "Critical alerts", ar: "التنبيهات الحرجة", zh: "严重告警" })}</span><span className="src">← {tr({ en: "Anomaly (UC-02)", ar: "الانحراف (UC-02)", zh: "异常 (UC-02)" })} →</span></div>
          </div>
        </div>
        <div className="rp-lock">🔒 {tr({ en: "Approved version saved immutably; edits create a new version (BR-04). Each copy carries number, owner, date & sources (BR-03).", ar: "النسخة المعتمدة تُحفظ دون تعديل؛ التعديل يُنشئ نسخة جديدة (BR-04). وكل نسخة تحمل رقماً ومالكاً وتاريخاً ومصادر (BR-03).", zh: "已批准版本不可变保存;修改生成新版本(BR-04)。每份副本含编号、归属、日期与来源(BR-03)。" })}</div>
      </div>
    </div>, document.body)}
    {nw && createPortal(<div className="rp-nov" onClick={(e) => { if (e.target === e.currentTarget) setNw(false); }}>
      <div className="rp-ncard">
        <div className="rp-nhd">{tr({ en: "New report", ar: "تقرير جديد", zh: "新建报告" })}<button className="x" onClick={() => setNw(false)}>✕</button></div>
        <div className="rp-nbody">
          <div className="rp-nlab">{tr({ en: "How do you want to start?", ar: "كيف تريد البدء؟", zh: "从哪种方式开始?" })}</div>
          <div className="rp-nmodes">
            <div className={"rp-nmode" + (nmode === "tmpl" ? " on" : "")} onClick={() => setNmode("tmpl")}>📋 {tr({ en: "From a template", ar: "من قالب", zh: "用模板" })}<div className="sub">{tr({ en: "Pick an approved template", ar: "اختر قالباً معتمداً", zh: "选择已批准模板" })}</div></div>
            <div className={"rp-nmode" + (nmode === "nl" ? " on" : "")} onClick={() => setNmode("nl")}>💬 {tr({ en: "Ask in natural language", ar: "بلغة طبيعية", zh: "自然语言" })}<div className="sub">{tr({ en: "Describe the report you need", ar: "صف التقرير المطلوب", zh: "描述你要的报告" })}</div></div>
          </div>
          {nmode === "tmpl"
            ? <div className="rp-nfield"><div className="rp-nfl">{tr({ en: "Template", ar: "القالب", zh: "模板" })}</div><select value={ntmpl} onChange={e => setNtmpl(e.target.value)}>{TEMPLATES.map(t => <option key={t.key} value={t.key}>{tr(t.name)}</option>)}</select></div>
            : <div className="rp-nfield"><div className="rp-nfl">{tr({ en: "Request", ar: "الطلب", zh: "请求" })}</div><input value={nnl} onChange={e => setNnl(e.target.value)} placeholder={tr({ en: "e.g. Overdue by Amanah this quarter", ar: "مثال: التأخر حسب الأمانة هذا الربع", zh: "例:本季度按阿玛纳逾期" })} /></div>}
          <div className="rp-nrow2">
            <div className="rp-nfield"><div className="rp-nfl">{tr({ en: "Period", ar: "الفترة", zh: "期间" })}</div><div className="rp-nval">FY 2026 · Q2 ▾</div></div>
            <div className="rp-nfield"><div className="rp-nfl">{tr({ en: "Scope", ar: "النطاق", zh: "范围" })}</div><div className="rp-nval">{tr({ en: "6 Amanat", ar: "6 أمانات", zh: "6 个阿玛纳" })} ▾</div></div>
          </div>
        </div>
        <div className="rp-nfoot"><button className="rp-ncancel" onClick={() => setNw(false)}>{tr({ en: "Cancel", ar: "إلغاء", zh: "取消" })}</button><button className="rp-ngen" onClick={genReport}>✦ {tr({ en: "Generate report", ar: "إنشاء التقرير", zh: "生成报告" })}</button></div>
      </div>
    </div>, document.body)}
  </div>);
}

export { ReportsEnt };
