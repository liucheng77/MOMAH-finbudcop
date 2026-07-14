/* 成本管理部 (Cost Management Department · costwork · UC-12) — flow data +
   wrapper. Verbatim from src/App.jsx. */
import React from "react";
import { DirectorateFlow } from "../shared.jsx";

const MF_G05_COST = {
  back: "costwork", cw: 1280, ch: 560,
  title: { en: "Cost Management Department — Multi-Agent Flow (G-05)", ar: "إدارة التكاليف — تدفّق متعدد الوكلاء (ج-05)", zh: "成本管理部 — 多智能体流程(G-05)" },
  subtitle: { en: "UC-12-centric · cost & fund data → costs, assignment orders & funds → reports, surpluses & alerts · upstream UC-11, parallel UC-14, downstream UC-10", ar: "متمحور حول UC-12 · بيانات التكاليف والصناديق ← التكاليف وأوامر الإسناد والصناديق ← التقارير والفوائض والتنبيهات", zh: "以 UC-12 为核心 · 成本与资金数据 → 成本/派工单/资金 → 报告、结余与告警 · 上游 UC-11、并行 UC-14、下游 UC-10" },
  src: { x: 14, y: 90, w: 204, h: 424, list: [
    { en: "SAP", ar: "ساب", zh: "SAP" }, { en: "Etimad", ar: "اعتماد", zh: "Etimad" }, { en: "Esnad", ar: "إسناد", zh: "Esnad" },
    { en: "Invoices", ar: "الفواتير", zh: "发票" }, { en: "Completion Certificates", ar: "شهادات الإنجاز", zh: "完工证明" }, { en: "Liquidity Requests", ar: "طلبات السيولة", zh: "流动性申请" },
    { en: "Payment Orders", ar: "أوامر الدفع", zh: "付款单" }, { en: "Bank Statements", ar: "كشوف بنكية", zh: "银行对账单" }, { en: "Dev. Fund Data", ar: "بيانات صناديق التطوير", zh: "开发基金数据" },
  ] },
  nodes: {
    uc12: { code: "UC-12", x: 460, y: 150, w: 320, h: 300, title: { en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" }, ags: ["dataq", "repgen", "anom"] },
  },
  del: { x: 1040, y: 96, w: 320, h: 424,
    head: { en: "Outputs", ar: "المخرجات", zh: "输出" },
    items: [
      { t: { en: "Assignment Order Reports", ar: "تقارير أوامر الإسناد", zh: "派工单报告" }, d: { en: "per order", ar: "لكل أمر", zh: "按单" } },
      { t: { en: "Cost per Unit / Land", ar: "تكلفة الوحدة / الأرض", zh: "单元/地块成本" }, d: { en: "unit costing", ar: "احتساب الوحدة", zh: "单元成本核算" } },
      { t: { en: "Financial Consideration", ar: "المقابل المالي", zh: "财务对价" }, d: { en: "compensation values", ar: "قيم التعويض", zh: "补偿金额" } },
      { t: { en: "Surpluses & Fund Reports", ar: "الفوائض وتقارير الصناديق", zh: "结余与基金报告" }, d: { en: "fund balances", ar: "أرصدة الصناديق", zh: "基金余额" } },
      { t: { en: "Matching Results & Alerts", ar: "نتائج المطابقة والتنبيهات", zh: "匹配结果与告警" }, d: { en: "reconciliation & anomalies", ar: "مطابقة وشذوذ", zh: "对账与异常" } },
    ],
    foot: { en: "Surplus tracking rule — surplus must be tracked from original order to beneficiary project.", ar: "قاعدة تتبّع الفائض — يجب تتبّع الفائض من الأمر الأصلي إلى المشروع المستفيد.", zh: "结余追踪规则 —— 结余须从原始派工单追踪至受益项目。" },
  },
  edges: [
    { from: "src", fa: "R", to: "uc12", ta: "L", c: "g", t: { en: "Assignment orders, invoices, liquidity reqs, completion certs, fund agreements", ar: "أوامر الإسناد والفواتير وطلبات السيولة والشهادات واتفاقيات الصناديق", zh: "派工单、发票、流动性申请、完工证明、基金协议" } },
    { from: "uc12", fa: "R", to: "del", ta: "L", c: "o", t: { en: "Assignment-order reports, unit cost, surpluses, fund reports", ar: "تقارير الأوامر وتكلفة الوحدة والفوائض وتقارير الصناديق", zh: "派工单报告、单元成本、结余、基金报告" } },
  ],
};
const FLOW_COST = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-09", label: { en: "Closing & reconciliation", ar: "الإقفال والمطابقة", zh: "关账与对账" }, cls: "in" },
  { code: "UC-11", label: { en: "Compliance & memos", ar: "الامتثال والمذكرات", zh: "合规与备忘" }, cls: "in" },
  { code: "UC-12 / UC-14", label: { en: "Costs & assets", ar: "التكاليف والأصول", zh: "成本与资产" }, cls: "focus", star: true },
  { code: "UC-10", label: { en: "Reports & narrative", ar: "التقارير والسرد", zh: "报告与叙述" }, cls: "down" },
  { code: "UC-02 / UC-03", label: { en: "Alerts & smart query", ar: "التنبيهات والاستعلام", zh: "告警与智能查询" }, cls: "down" },
];
function FlowG05Cost() { return <DirectorateFlow flow={MF_G05_COST} />; }
export { MF_G05_COST, FLOW_COST, FlowG05Cost };
