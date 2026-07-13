/* =========================================================================
   src/shared/ucTools.jsx — UC review-panel components for departments.

   Contains the rich "key cost driver" / "approval-review" style workbench
   panels that plug into a UcBench via `cfg.tool === "uc01" | "uc08" | "uc09"`.
   Uc15Drivers and Uc16Subsidy (G-02) stay inline in src/App.jsx because
   they read G-02 store slices (g02 / setG02). All other directorates (G-04
   today, G-05/G-06 tomorrow) can reuse these panels without forking App.jsx.

   Every panel follows the same three-column pattern (review · lineage ·
   recommendation) and supports a "Run review" button plus decision buttons
   (approve / modify / return / escalate) to mirror the BR-01..BR-04
   controls in the Planning Department's UC-15.
   ========================================================================= */
import React, { useState } from "react";
import { useStore } from "./store.jsx";

/* ---- shared layout primitives --------------------------------------------- */
function FormChips({ chips, values, onChange }) {
  return (<div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
    {chips.map((c, i) => (
      <label className="wb-schip" key={i}>
        <span className="k">{c.label.zh || c.label.en}</span>
        <select className="wb-ssel" value={values[c.key]} onChange={e => onChange(c.key, +e.target.value)}>
          {c.options.map((o, j) => <option value={j} key={j}>{o.zh || o.en}</option>)}
        </select>
      </label>
    ))}
  </div>);
}

function KpiRow({ kpis }) {
  return (<div className="wb-kk-row">{kpis.map((k, i) => (
    <div className="wb-kk" key={i}><span>{k.label.zh || k.label.en}</span><b style={{ color: k.color || "#3c4653" }}>{k.value}</b></div>
  ))}</div>);
}

function ReviewTable({ table, openRow, onRowClick }) {
  if (!table) return null;
  return (<table className="wb-table" style={{ marginTop: 6 }}>
    <thead><tr>{table.headers.map((h, i) => <th key={i}>{h.zh || h.en}</th>)}</tr></thead>
    <tbody>
      {table.rows.map((r, i) => (
        <tr key={i} onClick={() => onRowClick(i)} style={{ cursor: "pointer" }}>
          {r.map((cell, ci) => <td key={ci} style={ci > 0 ? { fontWeight: 700, color: table.rowColor ? table.rowColor(i) : "#3c4653" } : {}}>{cell}</td>)}
        </tr>
      ))}
    </tbody>
  </table>);
}

function Banner({ warnings }) {
  if (!warnings || !warnings.length) return null;
  return warnings.map((w, i) => (
    <div key={i} style={{ padding: "7px 10px", borderRadius: 8, background: w.tone === "red" ? "#fdecea" : "#fff8e1", color: w.tone === "red" ? "#b42318" : "#8a6d00", fontSize: 12.5, marginBottom: 6 }}>
      ⚠ {w.msg.zh || w.msg.en}
    </div>
  ));
}

function DecisionBar({ disabled, onDecide, justifyNeeded, justification, setJustification }) {
  return (<div>
    {justifyNeeded && <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 12, color: "#b42318", marginBottom: 4 }}>⚠ {justifyNeeded.zh || justifyNeeded.en}</div>
      <textarea value={justification} onChange={e => setJustification(e.target.value)} placeholder={justifyNeeded.placeholder || "输入例外理由…"} style={{ width: "100%", minHeight: 40, fontFamily: "inherit", fontSize: 12, borderRadius: 8, border: "1px solid var(--line)", padding: 6 }} />
    </div>}
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      <button className="btn sm" disabled={disabled} onClick={() => onDecide("approve")}>✓ 批准</button>
      <button className="btn ghost sm" onClick={() => onDecide("modify")}>✎ 修改</button>
      <button className="btn ghost sm" onClick={() => onDecide("return")}>✕ 退回</button>
      <button className="btn ghost sm" onClick={() => onDecide("escalate")}>⇧ 升级</button>
    </div>
  </div>);
}

/* =========================================================================
   UC-01 · Data-Quality Review (G-04 Financial Entitlements)
   ========================================================================= */
function Uc01DataQuality() {
  const { tr, pushLog } = useStore();
  const [src, setSrc] = useState(0);
  const [dom, setDom] = useState(0);
  const [scope, setScope] = useState(0);
  const [rule, setRule] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [openRow, setOpenRow] = useState(-1);
  const [just, setJust] = useState("");
  const SRCS = [
    { zh: "SAP/Asas(主数据+消费)", en: "SAP/Asas (Master + consumption)" },
    { zh: "Etimad / Etimad Plus(付款)", en: "Etimad / Etimad Plus (payments)" },
    { zh: "Esnad(合同)", en: "Esnad (contracts)" },
    { zh: "Tahseel(收入)", en: "Tahseel (revenue)" },
  ];
  const DOMS = [
    { zh: "供应商主数据", en: "Vendor / supplier master" },
    { zh: "索赔包", en: "Claim packages" },
    { zh: "合同与COC", en: "Contracts & COC" },
    { zh: "付款单", en: "Payment orders" },
  ];
  const SCOPES = [
    { zh: "完整性", en: "Completeness" },
    { zh: "准确性", en: "Accuracy" },
    { zh: "新鲜度", en: "Freshness" },
    { zh: "全部(DQ 评分)", en: "All (DQ score)" },
  ];
  const RULES = [
    { zh: "当前版本(智能匹配)", en: "Current version (smart match)" },
    { zh: "仅上次核准版(参考数据不足)", en: "Last approved (refs insufficient)" },
    { zh: "参考缺失", en: "Reference missing" },
  ];
  const SCORES = [[96, 94, 93, 95], [88, 92, 78, 86], [91, 89, 96, 92], [82, 80, 74, 79]];
  const DQ = SCORES[src][scope === 3 ? 3 : scope];
  const ruleMiss = rule === 2;
  const STALE = src === 3 || (src === 0 && scope === 2);
  const LOW = DQ < 90;
  const ITEMS = ruleMiss ? [] : [
    { n: "供应商 IBAN / CR / COC", d: (DQ - 90) * 2.4, why: "完整性偏低——3 个源缺少必填字段" },
    { n: "Etimad 已结 vs SAP 过账", d: (DQ - 90) * 1.8, why: "匹配 98% · SAR 25M 差异未结" },
    { n: "血缘标签覆盖", d: (DQ - 90) * 1.2, why: "100% 下游数字带源追溯" },
  ];
  const run = () => {
    if (ruleMiss) return;
    setPhase("done"); setOpenRow(-1); setJust("");
    pushLog("UC-01 质量审查 — " + SRCS[src].zh + " · " + DOMS[dom].zh);
  };
  const decide = (k) => {
    if (k === "approve" && LOW && !just.trim()) return;
    pushLog(k === "approve" ? "UC-01 映射已批准——已发布到 UC-08" : k === "modify" ? "UC-01 退回源系统修改" : k === "return" ? "UC-01 退回申请方" : "UC-01 已升级至数据管理员");
  };
  const warnings = [];
  if (ruleMiss) warnings.push({ tone: "red", msg: "参考规则缺失——已阻止质量审查" });
  if (STALE) warnings.push({ tone: "amber", msg: "新鲜度低于 90% SLA(Tahseel 78% · Hyperion 74%)——已标记待刷新" });
  if (LOW && !ruleMiss) warnings.push({ tone: "amber", msg: "DQ 低于 90——批准需理由(BR-03)" });
  return (<div className="wb-panel" style={{ marginTop: 10 }}>
    <div className="wb-ph"><span className="wb-dot violet" /> <b>UC-01 · 数据质量审查 — 权益源系统映射</b><span className="wb-pm">BR-03 · BR-04 · 血缘可追溯 · 发布到 UC-08</span></div>
    <div className="wb-pb">
      <FormChips
        chips={[
          { key: "src",   label: "源系统",     options: SRCS },
          { key: "dom",   label: "数据域",     options: DOMS },
          { key: "scope", label: "质量范围",   options: SCOPES },
          { key: "rule",  label: "参考规则",   options: RULES },
        ]}
        values={{ src, dom, scope, rule }}
        onChange={(k, v) => { (k === "src" && setSrc(v), k === "dom" && setDom(v), k === "scope" && setScope(v), k === "rule" && setRule(v)); setPhase("idle"); }}
      />
      <button className="btn sm" onClick={run} disabled={ruleMiss}>▶ 运行质量审查</button>
      <Banner warnings={warnings} />
      {phase === "done" && !ruleMiss && <div className="wb-cols3" style={{ marginTop: 4 }}>
        <div className="wb-panel"><div className="wb-ph plain"><b>质量评分与字段级缺口(BR-02)</b><span className="wb-pm">点行钻取</span></div>
          <div className="wb-pb">
            <KpiRow kpis={[
              { label: "DQ 评分(加权)", value: DQ + "%", color: LOW ? "#b42318" : "#1B8354" },
              { label: "完整性",   value: SCORES[src][0] + "%" },
              { label: "准确性",   value: SCORES[src][1] + "%" },
              { label: "新鲜度",   value: SCORES[src][2] + "%", color: STALE ? "#8a6d00" : "#1B8354" },
            ]} />
            <ReviewTable
              table={{
                headers: [{ zh: "字段组" }, "Δ%"],
                rows: ITEMS.map((x, i) => [x.n + (openRow === i ? " ▾" : " ▸"), (x.d > 0 ? "+" : "") + x.d.toFixed(1) + "%"]),
                rowColor: (i) => (ITEMS[i].d > 0 ? "#b42318" : "#1B8354"),
              }}
              openRow={openRow}
              onRowClick={(i) => setOpenRow(openRow === i ? -1 : i)}
            />
          </div>
        </div>
        <div className="wb-panel"><div className="wb-ph plain"><b>血缘与跨系统影响</b><span className="wb-pm">UC-08</span></div>
          <div className="wb-pb">
            <div className="wb-kk"><span>源系统覆盖</span><b>{SRCS.length} / 4</b></div>
            <div className="wb-kk"><span>下游 UC 链接</span><b>UC-08 · UC-09</b></div>
            <div className="wb-kk"><span>血缘追踪标记</span><b>100% 已打标</b></div>
            <div className="wb-kk"><span>异常回退路径</span><b>UC-02 告警</b></div>
          </div>
        </div>
        <div className="wb-panel"><div className="wb-ph plain"><b>建议与授权处置(BR-01)</b></div>
          <div className="wb-pb">
            <DecisionBar
              disabled={LOW && !just.trim()}
              onDecide={decide}
              justifyNeeded={LOW && { zh: "高偏差需理由(批准前必填)", placeholder: "输入例外理由…" }}
              justification={just}
              setJustification={setJust}
            />
          </div>
        </div>
      </div>}
    </div>
  </div>);
}

/* =========================================================================
   UC-08 · Contracts / Claims / Disbursements / Entitlements (G-04 core)
   ========================================================================= */
function Uc08Entitlements() {
  const { pushLog } = useStore();
  const [plan, setPlan] = useState(0);
  const [actual, setActual] = useState(0);
  const [rule, setRule] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [openRow, setOpenRow] = useState(-1);
  const [just, setJust] = useState("");
  const PLANS = [
    { zh: "FY2026 计划付款",     v: 412 },
    { zh: "FY2026 滚动预测",     v: 380 },
    { zh: "FY2025 实际",         v: 354 },
    { zh: "(无计划)",            v: 0 },
  ];
  const ACTUALS = [
    { zh: "Etimad 实际付款",     v: 268 },
    { zh: "SAP 实际入账",         v: 272 },
    { zh: "Etimad Plus 新口径",   v: 295 },
    { zh: "(无实际)",            v: 0 },
  ];
  const RULES = [
    { zh: "当前计划+智能匹配" },
    { zh: "仅上次核准计划" },
    { zh: "计划缺失" },
  ];
  const planMiss = plan === 3;
  const actualMiss = actual === 3;
  const ruleMiss = rule === 2;
  const PLAN = PLANS[plan].v;
  const ACT = ACTUALS[actual].v;
  const DELTA = PLAN && ACT ? ACT - PLAN : 0;
  const ratio = PLAN ? (ACT / PLAN) * 100 : 0;
  const lowMatch = ratio < 80;
  const ITEMS = (planMiss || actualMiss || ruleMiss) ? [] : [
    { n: "东四环路 — 二期",      d: (ACT - PLAN) * 0.6, why: "计划与实际差距最大" },
    { n: "北环外延 — A3",         d: (ACT - PLAN) * 0.3, why: "施工延误,资金未动" },
    { n: "Al-Mashael 公园",      d: (ACT - PLAN) * 0.1, why: "与计划基本一致" },
  ];
  const run = () => {
    if (planMiss || actualMiss || ruleMiss) return;
    setPhase("done"); setOpenRow(-1); setJust("");
    pushLog("UC-08 索赔与权益审查 — " + PLANS[plan].zh + " vs " + ACTUALS[actual].zh);
  };
  const decide = (k) => {
    if (k === "approve" && lowMatch && !just.trim()) return;
    pushLog(k === "approve" ? "UC-08 已批准(在空间与管控内)" : k === "modify" ? "UC-08 退回修改" : k === "return" ? "UC-08 退回申请方" : "UC-08 已升级至授权人");
  };
  const warnings = [];
  if (planMiss)  warnings.push({ tone: "red",   msg: "计划缺失——已阻止审查" });
  if (actualMiss) warnings.push({ tone: "red",   msg: "实际数据缺失——已阻止审查" });
  if (ruleMiss)   warnings.push({ tone: "red",   msg: "规则缺失——已阻止审查" });
  if (lowMatch && !planMiss && !actualMiss && !ruleMiss) warnings.push({ tone: "amber", msg: "匹配率 < 80%——批准需理由" });
  return (<div className="wb-panel" style={{ marginTop: 10 }}>
    <div className="wb-ph"><span className="wb-dot violet" /> <b>UC-08 · 索赔与权益审查 — 计划 vs 实际</b><span className="wb-pm">BR-01 · BR-03 · 18% 偏差</span></div>
    <div className="wb-pb">
      <FormChips
        chips={[
          { key: "plan",   label: "付款计划",   options: PLANS },
          { key: "actual", label: "实际付款",   options: ACTUALS },
          { key: "rule",   label: "匹配规则",   options: RULES },
        ]}
        values={{ plan, actual, rule }}
        onChange={(k, v) => { (k === "plan" && setPlan(v), k === "actual" && setActual(v), k === "rule" && setRule(v)); setPhase("idle"); }}
      />
      <button className="btn sm" onClick={run} disabled={planMiss || actualMiss || ruleMiss}>▶ 估算并审查</button>
      <Banner warnings={warnings} />
      {phase === "done" && <div className="wb-cols3" style={{ marginTop: 4 }}>
        <div className="wb-panel"><div className="wb-ph plain"><b>计划 vs 实际与偏差(BR-02)</b><span className="wb-pm">点行钻取</span></div>
          <div className="wb-pb">
            <KpiRow kpis={[
              { label: "计划(Σ)",     value: "SAR " + PLAN + "M",          color: "#1B8354" },
              { label: "实际(Σ)",     value: "SAR " + ACT + "M",           color: "#1B8354" },
              { label: "差额",        value: (DELTA >= 0 ? "+" : "") + "SAR " + DELTA + "M", color: DELTA < 0 ? "#b42318" : "#1B8354" },
              { label: "匹配率",      value: ratio.toFixed(0) + "%",        color: lowMatch ? "#b42318" : "#1B8354" },
            ]} />
            <ReviewTable
              table={{
                headers: [{ zh: "项目" }, "Δ SAR M"],
                rows: ITEMS.map((x, i) => [x.n + (openRow === i ? " ▾" : " ▸"), (x.d >= 0 ? "+" : "") + x.d.toFixed(1)]),
                rowColor: (i) => (ITEMS[i].d < 0 ? "#b42318" : "#1B8354"),
              }}
              openRow={openRow}
              onRowClick={(i) => setOpenRow(openRow === i ? -1 : i)}
            />
          </div>
        </div>
        <div className="wb-panel"><div className="wb-ph plain"><b>流动性影响(4–8 周)</b><span className="wb-pm">UC-09</span></div>
          <div className="wb-pb">
            <div className="wb-kk"><span>预期索赔(Σ)</span><b>SAR 412M</b></div>
            <div className="wb-kk"><span>资金缺口(Σ)</span><b style={{ color: "#b42318" }}>SAR 57M</b></div>
            <div className="wb-kk"><span>转移办理时长</span><b>9 d (目标 &lt; 5)</b></div>
            <div className="wb-kk"><span>下游 UC 链接</span><b>UC-02 · UC-09</b></div>
          </div>
        </div>
        <div className="wb-panel"><div className="wb-ph plain"><b>建议与授权处置(BR-01)</b></div>
          <div className="wb-pb">
            <DecisionBar
              disabled={lowMatch && !just.trim()}
              onDecide={decide}
              justifyNeeded={lowMatch && { zh: "匹配率低需理由(批准前必填)", placeholder: "输入例外理由…" }}
              justification={just}
              setJustification={setJust}
            />
          </div>
        </div>
      </div>}
    </div>
  </div>);
}

/* =========================================================================
   UC-09 · Financial Close, Reconciliation & Adjustments (G-04)
   ========================================================================= */
function Uc09Closing() {
  const { pushLog } = useStore();
  const [period, setPeriod] = useState(0);
  const [scope, setScope] = useState(0);
  const [adj, setAdj] = useState(0);
  const [phase, setPhase] = useState("idle");
  const [openRow, setOpenRow] = useState(-1);
  const PERIODS = [
    { zh: "2026 Q2 关账" },
    { zh: "2026 Q3 关账" },
    { zh: "2026 月度" },
  ];
  const SCOPES = [
    { zh: "全部范围" },
    { zh: "仅权益索赔" },
    { zh: "仅关账调整" },
  ];
  const ADJS = [
    { zh: "智能对账" },
    { zh: "规则对账" },
    { zh: "人工对账" },
  ];
  const REVDIFFS = [
    { l: "Etimad 已结",    v: 268, exp: 270 },
    { l: "SAP 入账",       v: 272, exp: 270 },
    { l: "Etimad Plus 新", v: 295, exp: 270 },
  ];
  const TOTAL = REVDIFFS.reduce((a, b) => a + b.v, 0);
  const EXP   = REVDIFFS.reduce((a, b) => a + b.exp, 0);
  const DELTA = TOTAL - EXP;
  const ratio = EXP ? (TOTAL / EXP) * 100 : 0;
  const lowMatch = ratio < 99;
  const ITEMS = [
    { n: "Etimad vs SAP 时间差", d: (TOTAL - EXP) * 0.4, why: "关账日 +1 入账" },
    { n: "Currency rounding",   d: (TOTAL - EXP) * 0.3, why: "汇率尾差" },
    { n: "Manual adjustments",  d: (TOTAL - EXP) * 0.3, why: "2 条调整分录" },
  ];
  const run = () => { setPhase("done"); setOpenRow(-1); pushLog("UC-09 关账与对账 — " + PERIODS[period].zh); };
  const decide = (k) => {
    pushLog(k === "approve" ? "UC-09 关账已批准——发布到 UC-10" : k === "modify" ? "UC-09 退回修改" : k === "return" ? "UC-09 退回申请方" : "UC-09 已升级至授权人");
  };
  return (<div className="wb-panel" style={{ marginTop: 10 }}>
    <div className="wb-ph"><span className="wb-dot violet" /> <b>UC-09 · 关账与对账审查</b><span className="wb-pm">BR-02 · BR-04 · 审计可追溯</span></div>
    <div className="wb-pb">
      <FormChips
        chips={[
          { key: "period", label: "关账周期",   options: PERIODS },
          { key: "scope",  label: "对账范围",   options: SCOPES },
          { key: "adj",    label: "调整方式",   options: ADJS },
        ]}
        values={{ period, scope, adj }}
        onChange={(k, v) => { (k === "period" && setPeriod(v), k === "scope" && setScope(v), k === "adj" && setAdj(v)); setPhase("idle"); }}
      />
      <button className="btn sm" onClick={run}>▶ 运行关账</button>
      <Banner warnings={lowMatch ? [{ tone: "amber", msg: "对账差异 &gt; 1% — 批准需理由" }] : []} />
      {phase === "done" && <div className="wb-cols3" style={{ marginTop: 4 }}>
        <div className="wb-panel"><div className="wb-ph plain"><b>对账结果与差异(BR-02)</b><span className="wb-pm">点行钻取</span></div>
          <div className="wb-pb">
            <KpiRow kpis={[
              { label: "对账总额(Σ)",  value: "SAR " + TOTAL + "M",       color: "#1B8354" },
              { label: "预期(Σ)",      value: "SAR " + EXP + "M",         color: "#3c4653" },
              { label: "差额",          value: (DELTA >= 0 ? "+" : "") + "SAR " + DELTA + "M", color: "#b42318" },
              { label: "匹配率",        value: ratio.toFixed(2) + "%",     color: lowMatch ? "#b42318" : "#1B8354" },
            ]} />
            <ReviewTable
              table={{
                headers: [{ zh: "差异来源" }, "Δ SAR M"],
                rows: ITEMS.map((x, i) => [x.n + (openRow === i ? " ▾" : " ▸"), (x.d >= 0 ? "+" : "") + x.d.toFixed(1)]),
                rowColor: () => "#b42318",
              }}
              openRow={openRow}
              onRowClick={(i) => setOpenRow(openRow === i ? -1 : i)}
            />
          </div>
        </div>
        <div className="wb-panel"><div className="wb-ph plain"><b>调整分录 & 审计链路</b><span className="wb-pm">UC-10</span></div>
          <div className="wb-pb">
            <div className="wb-kk"><span>调整分录数</span><b>2 条</b></div>
            <div className="wb-kk"><span>借贷平衡</span><b>✓ 已校验</b></div>
            <div className="wb-kk"><span>下游链接</span><b>UC-10 · UC-03</b></div>
            <div className="wb-kk"><span>审计追踪</span><b>已写日志</b></div>
          </div>
        </div>
        <div className="wb-panel"><div className="wb-ph plain"><b>建议与授权处置(BR-01)</b></div>
          <div className="wb-pb">
            <DecisionBar
              disabled={lowMatch}
              onDecide={decide}
              justifyNeeded={lowMatch && { zh: "对账差异 > 1% 需理由", placeholder: "输入例外理由…" }}
              justification=""
              setJustification={() => {}}
            />
          </div>
        </div>
      </div>}
    </div>
  </div>);
}

export { Uc01DataQuality, Uc08Entitlements, Uc09Closing };
