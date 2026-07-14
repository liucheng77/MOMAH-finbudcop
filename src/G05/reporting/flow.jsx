/* 财务报告部 (Financial Reporting Department · frepwork · UC-10) — flow data +
   wrapper. Verbatim from src/App.jsx. */
import React from "react";
import { DirectorateFlow } from "../shared.jsx";

const MF_G05_REP = {
  back: "frepwork", cw: 1400, ch: 560,
  title: { en: "Financial Reporting Department — Multi-Agent Flow (G-05)", ar: "إدارة التقارير المالية — تدفّق متعدد الوكلاء (ج-05)", zh: "财务报告部 — 多智能体流程(G-05)" },
  subtitle: { en: "UC-10-centric · upstream UC-09/UC-11/UC-12/UC-14 + unified data → reports & narrative → parallel deviation & smart query → executive/exception outputs", ar: "متمحور حول UC-10 · المدخلات العليا ← التقارير والسرد ← الانحراف والاستعلام المتوازي ← المخرجات", zh: "以 UC-10 为核心 · 上游 UC-09/11/12/14 + 统一数据 → 报告与叙述 → 并行偏差与智能查询 → 执行/例外输出" },
  src: { x: 14, y: 96, w: 204, h: 372, list: [
    { en: "Financial Close Results (UC-09)", ar: "نتائج الإقفال (UC-09)", zh: "财务关账结果(UC-09)" },
    { en: "Compliance Reports (UC-11)", ar: "تقارير الامتثال (UC-11)", zh: "合规报告(UC-11)" },
    { en: "Cost Reports (UC-12)", ar: "تقارير التكاليف (UC-12)", zh: "成本报告(UC-12)" },
    { en: "Asset Reports (UC-14)", ar: "تقارير الأصول (UC-14)", zh: "资产报告(UC-14)" },
    { en: "Unified Data (UC-01)", ar: "بيانات موحّدة (UC-01)", zh: "统一数据(UC-01)" },
  ] },
  nodes: {
    uc10: { code: "UC-10", x: 450, y: 158, w: 310, h: 280, title: { en: "Financial & Administrative Reports + Narrative Commentary", ar: "التقارير المالية والإدارية والتعليق السردي", zh: "财务与行政报告 + 叙述评述" }, ags: ["repgen", "narr", "dataq"] },
    uc02: { code: "UC-02", x: 900, y: 110, w: 280, h: 178, title: { en: "Deviation Alerts (parallel)", ar: "تنبيهات الانحراف (متوازٍ)", zh: "偏差告警(并行)" }, ags: ["anom", "insight", "orch"] },
    uc03: { code: "UC-03", x: 900, y: 360, w: 280, h: 178, title: { en: "Smart Query & Audit (parallel)", ar: "الاستعلام والتدقيق (متوازٍ)", zh: "智能查询与审计(并行)" }, ags: ["dataq", "orch", "insight"] },
  },
  del: { x: 1360, y: 96, w: 320, h: 396,
    head: { en: "Outputs", ar: "المخرجات", zh: "输出" },
    items: [
      { t: { en: "Periodic Financial Reports", ar: "تقارير مالية دورية", zh: "周期财务报告" }, d: { en: "scheduled & ad-hoc", ar: "مجدولة وعند الطلب", zh: "定期与即席" } },
      { t: { en: "Executive Reports", ar: "تقارير تنفيذية", zh: "执行报告" }, d: { en: "leadership summaries", ar: "ملخصات للقيادة", zh: "领导摘要" } },
      { t: { en: "Exception Reports", ar: "تقارير الاستثناءات", zh: "例外报告" }, d: { en: "deviation highlights", ar: "أبرز الانحرافات", zh: "偏差要点" } },
      { t: { en: "Narrative Commentary", ar: "تعليق سردي", zh: "叙述评述" }, d: { en: "AI-generated analysis", ar: "تحليل بالذكاء الاصطناعي", zh: "AI 生成分析" } },
      { t: { en: "Performance Summaries", ar: "ملخصات الأداء", zh: "绩效摘要" }, d: { en: "KPI & metric dashboards", ar: "لوحات المؤشرات", zh: "KPI 与指标仪表盘" } },
    ],
    foot: { en: "Downstream consumers · Senior Leadership · External Stakeholders · Audit Bodies.", ar: "المستهلكون اللاحقون · القيادة · الجهات الخارجية · جهات التدقيق.", zh: "下游消费方 · 高层领导 · 外部相关方 · 审计机构。" },
  },
  edges: [
    { from: "src", fa: "R", to: "uc10", ta: "L", c: "g", t: { en: "Report templates, approved upstream data, KPIs, deviations", ar: "قوالب وبيانات معتمدة ومؤشرات وانحرافات", zh: "报告模板、批准的上游数据、KPI、偏差" } },
    { from: "uc10", fa: "R", to: "uc02", ta: "L", c: "b", t: { en: "Deviation alerts", ar: "تنبيهات الانحراف", zh: "偏差告警" } },
    { from: "uc10", fa: "R", to: "uc03", ta: "L", c: "b", t: { en: "Reports for query / audit", ar: "تقارير للاستعلام / التدقيق", zh: "报告 → 查询/审计" } },
    { from: "uc10", fa: "R", to: "del", ta: "L", c: "o", t: { en: "Periodic & executive reports", ar: "تقارير دورية وتنفيذية", zh: "周期与执行报告" } },
  ],
};
const FLOW_REP = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-09", label: { en: "Closing & reconciliation", ar: "الإقفال والمطابقة", zh: "关账与对账" }, cls: "in" },
  { code: "UC-11", label: { en: "Compliance & memos", ar: "الامتثال والمذكرات", zh: "合规与备忘" }, cls: "in" },
  { code: "UC-12 / UC-14", label: { en: "Costs & assets", ar: "التكاليف والأصول", zh: "成本与资产" }, cls: "in" },
  { code: "UC-10", label: { en: "Reports & narrative", ar: "التقارير والسرد", zh: "报告与叙述" }, cls: "focus", star: true },
  { code: "UC-02 / UC-03", label: { en: "Alerts & smart query", ar: "التنبيهات والاستعلام", zh: "告警与智能查询" }, cls: "down" },
];
function FlowG05Rep() { return <DirectorateFlow flow={MF_G05_REP} />; }
export { MF_G05_REP, FLOW_REP, FlowG05Rep };
