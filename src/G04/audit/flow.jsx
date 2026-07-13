/* 审计部 (Audit Department · audwork · UC-03) — flow data + wrapper.
   Verbatim from src/App.jsx. */
import React from "react";
import { DirectorateFlow } from "../shared.jsx";

const MF_G04_AUD = {
  back: "audwork", cw: 950, ch: 640,
  title: { en: "Audit Department — Multi-Agent Flow (G-04)", ar: "إدارة التدقيق — تدفّق متعدد الوكلاء (ج-04)", zh: "审计部 — 多智能体流程(G-04)" },
  subtitle: { en: "Oversight on financial close & deviation detection · data inputs → close & reconciliation → deviation alerting → downstream reports & audit log", ar: "رقابة على الإقفال وكشف الانحرافات · المدخلات ← الإقفال والمطابقة ← التنبيه ← التقارير وسجل التدقيق", zh: "对财务关账与偏差检测的监督 · 数据输入 → 关账与对账 → 偏差告警 → 下游报告与审计日志" },
  src: { x: 14, y: 96, w: 200, h: 384, list: [
    { en: "Etimad / Etimad Plus — claim packages (contracts, invoices, COC, approval path)", ar: "اعتماد / اعتماد بلس — حزم المطالبات (عقود، فواتير، شهادات إنجاز، مسار الاعتماد)", zh: "Etimad/Etimad Plus — 索赔包(合同、发票、COC、审批路径)" },
    { en: "SAP / Asas — execution facts (budget · commitments · payments · balance)", ar: "ساب / أساس — حقائق التنفيذ (ميزانية، التزامات، مدفوعات، أرصدة)", zh: "SAP/Asas — 预算执行事实(预算/承诺/付款/余额)" },
    { en: "Etimad Excel exports — payment-status reports for leadership", ar: "تقارير إكسل من اعتماد — حالة الدفع للقيادة", zh: "Etimad 导出 Excel — 支付状态领导报表" },
    { en: "Court rulings · tax files · IBAN / CR / ID evidence (PDF scans)", ar: "أحكام قضائية · ملفات ضريبية · آيبان / سجل / هوية (مسح ضوئي)", zh: "法院判决 · 税务文件 · IBAN/CR/ID 证据(PDF 扫描件)" },
  ] },
  nodes: {
    uc09: { code: "UC-09", x: 460, y: 110, w: 300, h: 204, title: { en: "Financial Close, Reconciliation & Adjustments", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与调整" }, ags: ["repgen", "comp", "anom"] },
    uc02: { code: "UC-02", x: 460, y: 392, w: 300, h: 204, title: { en: "Detection of Deviations, Alerts & Exceptions", ar: "كشف الانحرافات والتنبيهات والاستثناءات", zh: "偏差检测、告警与例外" }, ags: ["anom", "insight", "orch"] },
    uc10: { code: "UC-10", x: 1120, y: 110, w: 320, h: 204, title: { en: "Financial Reports — consolidated statements & disclosures", ar: "التقارير المالية — قوائم موحّدة وإفصاحات", zh: "财务报告 — 合并报表与披露" }, ags: ["repgen", "narr", "dataq"] },
    uc03: { code: "UC-03", x: 1120, y: 392, w: 320, h: 204, title: { en: "Smart Query & Audit Log — intelligent querying & full audit trail", ar: "الاستعلام الذكي وسجل التدقيق — استعلام ذكي وسجل تدقيق كامل", zh: "智能查询与审计日志 — 智能查询与完整审计轨迹" }, ags: ["dataq", "orch", "insight"] },
  },
  edges: [
    { from: "src", fa: "R", to: "uc09", ta: "L", c: "g", t: { en: "Financial transactions, contracts, claims, payment data", ar: "معاملات مالية وعقود ومطالبات وبيانات الدفع", zh: "财务交易、合同、索赔、付款数据" } },
    { from: "uc09", fa: "B", to: "uc02", ta: "T", c: "b", t: { en: "reconciliation results", ar: "نتائج المطابقة", zh: "对账结果" } },
    { from: "uc09", fa: "R", to: "uc10", ta: "L", c: "b", t: { en: "Reconciliation reports & compliance verification", ar: "تقارير المطابقة والتحقق من الامتثال", zh: "对账报告与合规核验" } },
    { from: "uc02", fa: "R", to: "uc03", ta: "L", c: "b", t: { en: "Deviation alerts, exception lists & corrective actions", ar: "تنبيهات الانحراف وقوائم الاستثناءات والإجراءات", zh: "偏差告警、例外清单与纠正措施" } },
    { from: "uc10", fa: "B", to: "uc03", ta: "T", c: "b", t: { en: "audit log", ar: "سجل التدقيق", zh: "审计日志" } },
  ],
};
const FLOW_AUD = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-08", label: { en: "Claims & entitlements", ar: "المطالبات والاستحقاقات", zh: "索赔与权益" }, cls: "in" },
  { code: "UC-02", label: { en: "Anomaly detection & alerts", ar: "كشف الانحرافات والتنبيهات", zh: "异常检测与告警" }, cls: "in" },
  { code: "UC-09", label: { en: "Closing & reconciliation", ar: "الإقفال والمطابقة", zh: "关账与对账" }, cls: "in" },
  { code: "UC-10", label: { en: "Periodic reports", ar: "تقارير دورية", zh: "周期报告" }, cls: "in" },
  { code: "UC-03", label: { en: "Smart query & audit", ar: "الاستعلام والتدقيق", zh: "智能查询与审计" }, cls: "focus", star: true },
];
function FlowG04Aud() { return <DirectorateFlow flow={MF_G04_AUD} />; }
export { MF_G04_AUD, FLOW_AUD, FlowG04Aud };
