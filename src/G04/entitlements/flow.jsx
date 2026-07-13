/* 财务权益部 (Financial Entitlements Department · entwork · UC-08) — flow data +
   wrapper. Verbatim from src/App.jsx. */
import React from "react";
import { DirectorateFlow } from "../shared.jsx";

const MF_G04_ENT = {
  back: "entwork", cw: 1220, ch: 600,
  title: { en: "Financial Entitlements Department — Multi-Agent Flow (G-04)", ar: "إدارة الاستحقاقات المالية — تدفّق متعدد الوكلاء (ج-04)", zh: "财务权益部 — 多智能体流程(G-04)" },
  subtitle: { en: "UC-08-centric · data inputs → entitlements processing → deviation & financial close → downstream reports & smart query", ar: "متمحور حول UC-08 · المدخلات ← معالجة الاستحقاقات ← الانحرافات والإقفال ← التقارير والاستعلام", zh: "以 UC-08 为核心 · 数据输入 → 权益处理 → 偏差检测与财务关账 → 下游报告与智能查询" },
  src: { x: 14, y: 92, w: 200, h: 384, list: [
    { en: "Annual payment-plan Excel templates (agencies · Amanat · project owners)", ar: "قوالب إكسل لخطط الدفع السنوية (الجهات والأمانات وملاك المشاريع)", zh: "年度付款计划 Excel 模版(机构 · 阿玛纳 · 项目业主)" },
    { en: "Etimad / Etimad Plus — actual payment exports", ar: "اعتماد / اعتماد بلس — تصدير المدفوعات الفعلية", zh: "Etimad / Etimad Plus — 实际付款导出" },
    { en: "SAP / Asas — budget & funds availability", ar: "ساب / أساس — الميزانية وتوافر الأموال", zh: "SAP/Asas — 预算与资金可用性" },
    { en: "Vision-portfolio weekly PPT reports", ar: "تقارير أسبوعية (بوربوينت) لمحافظ الرؤية", zh: "Vision 项目组合周报 PPT" },
    { en: "Contracts · claims · payment orders", ar: "العقود والمطالبات وأوامر الدفع", zh: "合同 · 索赔 · 付款单" },
  ] },
  nodes: {
    uc08: { code: "UC-08", x: 450, y: 182, w: 300, h: 232, title: { en: "Contracts, Claims, Disbursements, and Entitlements", ar: "العقود والمطالبات والصرف والاستحقاقات", zh: "合同、索赔、拨付与权益" }, ags: ["anom", "orch", "comp"] },
    uc02: { code: "UC-02", x: 920, y: 96, w: 280, h: 184, title: { en: "Deviation Detection", ar: "كشف الانحرافات", zh: "偏差检测" }, ags: ["anom", "insight", "orch"] },
    uc09: { code: "UC-09", x: 920, y: 372, w: 280, h: 184, title: { en: "Financial Close & Reconciliation", ar: "الإقفال المالي والمطابقة", zh: "财务关账与对账" }, ags: ["repgen", "comp", "anom"] },
    uc10: { code: "UC-10", x: 1380, y: 96, w: 300, h: 184, title: { en: "Financial Reports — consolidated reporting & dashboards", ar: "التقارير المالية — تقارير ولوحات موحّدة", zh: "财务报告 — 综合报告与仪表盘" }, ags: ["repgen", "narr", "dataq"] },
    uc03: { code: "UC-03", x: 1380, y: 372, w: 300, h: 184, title: { en: "Smart Query — natural-language queries on financial data", ar: "الاستعلام الذكي — استعلامات بلغة طبيعية", zh: "智能查询 — 财务数据的自然语言查询" }, ags: ["dataq", "orch", "insight"] },
  },
  edges: [
    { from: "src", fa: "R", to: "uc08", ta: "L", c: "g", t: { en: "Contracts, claims, invoices, payment orders, beneficiary data", ar: "عقود ومطالبات وفواتير وأوامر دفع وبيانات المستفيدين", zh: "合同、索赔、发票、付款单、受益人数据" } },
    { from: "uc08", fa: "R", to: "uc02", ta: "L", c: "b", t: { en: "Validated claims & compliance flags", ar: "مطالبات متحققة وأعلام امتثال", zh: "已核验索赔与合规标记" } },
    { from: "uc08", fa: "R", to: "uc09", ta: "L", c: "b", t: { en: "Disbursement reports & entitlement verification", ar: "تقارير الصرف والتحقق من الاستحقاق", zh: "拨付报告与权益核验" } },
    { from: "uc02", fa: "R", to: "uc10", ta: "L", c: "b", t: { en: "Deviation outputs (downstream)", ar: "مخرجات الانحراف (لاحقة)", zh: "偏差输出(下游)" } },
    { from: "uc09", fa: "R", to: "uc03", ta: "L", c: "b", t: { en: "Reconciled figures for query (downstream)", ar: "أرقام مسوّاة للاستعلام (لاحقة)", zh: "对账数据供查询(下游)" } },
  ],
};
const FLOW_ENT = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-08", label: { en: "Claims & entitlements", ar: "المطالبات والاستحقاقات", zh: "索赔与权益" }, cls: "focus", star: true },
  { code: "UC-02", label: { en: "Anomaly detection & alerts", ar: "كشف الانحرافات والتنبيهات", zh: "异常检测与告警" }, cls: "down" },
  { code: "UC-09", label: { en: "Closing & reconciliation", ar: "الإقفال والمطابقة", zh: "关账与对账" }, cls: "down" },
  { code: "UC-10", label: { en: "Periodic reports", ar: "تقارير دورية", zh: "周期报告" }, cls: "down" },
  { code: "UC-03", label: { en: "Smart query & audit", ar: "الاستعلام والتدقيق", zh: "智能查询与审计" }, cls: "down" },
];
function FlowG04Ent() { return <DirectorateFlow flow={MF_G04_ENT} />; }
export { MF_G04_ENT, FLOW_ENT, FlowG04Ent };
