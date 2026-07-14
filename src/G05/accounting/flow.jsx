/* 会计部 (Accounting Department · acctwork · UC-09) — flow data + wrapper.
   Verbatim from src/App.jsx. */
import React from "react";
import { DirectorateFlow } from "../shared.jsx";

const MF_G05_ACCT = {
  back: "acctwork", cw: 1280, ch: 540,
  title: { en: "Accounting Department — Multi-Agent Flow (G-05)", ar: "إدارة المحاسبة — تدفّق متعدد الوكلاء (ج-05)", zh: "会计部 — 多智能体流程(G-05)" },
  subtitle: { en: "UC-09-centric · financial transactions & balances → financial close, reconciliation & adjustments → close outputs · upstream UC-01/UC-08, downstream UC-11/UC-10 · cycle: trial balance → reconciliation → adjustments → close → reports", ar: "متمحور حول UC-09 · المعاملات والأرصدة ← الإقفال والمطابقة والتسويات ← المخرجات", zh: "以 UC-09 为核心 · 财务交易与余额 → 财务关账/对账/调整 → 关账输出 · 上游 UC-01/UC-08、下游 UC-11/UC-10 · 周期:试算 → 对账 → 调整 → 关账 → 报告" },
  src: { x: 14, y: 90, w: 204, h: 400, list: [
    { en: "SAP", ar: "ساب", zh: "SAP" }, { en: "GRP", ar: "GRP", zh: "GRP" }, { en: "Hyperion", ar: "هايبريون", zh: "Hyperion" },
    { en: "Chart of Accounts", ar: "دليل الحسابات", zh: "会计科目表" }, { en: "Journal Entries", ar: "قيود اليومية", zh: "日记账分录" }, { en: "Trial Balances", ar: "موازين المراجعة", zh: "试算平衡表" },
    { en: "Bank Statements", ar: "كشوف بنكية", zh: "银行对账单" }, { en: "Contracts", ar: "العقود", zh: "合同" },
  ] },
  nodes: {
    uc09: { code: "UC-09", x: 460, y: 150, w: 320, h: 290, title: { en: "Financial Close, Reconciliation & Adjustments", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与调整" }, ags: ["repgen", "comp", "anom"] },
  },
  del: { x: 1040, y: 96, w: 320, h: 406,
    head: { en: "Outputs", ar: "المخرجات", zh: "输出" },
    items: [
      { t: { en: "Reconciliation Reports", ar: "تقارير المطابقة", zh: "对账报告" }, d: { en: "reconciled balances", ar: "أرصدة مطابقة", zh: "对账后余额" } },
      { t: { en: "Adjustment Entries", ar: "قيود التسوية", zh: "调整分录" }, d: { en: "corrective entries", ar: "قيود تصحيحية", zh: "更正分录" } },
      { t: { en: "Trial Balance", ar: "ميزان المراجعة", zh: "试算平衡表" }, d: { en: "balanced ledger", ar: "دفتر متوازن", zh: "平衡账簿" } },
      { t: { en: "Financial Close Reports", ar: "تقارير الإقفال", zh: "关账报告" }, d: { en: "period close", ar: "إقفال الفترة", zh: "期末关账" } },
      { t: { en: "Compliance Verification", ar: "التحقق من الامتثال", zh: "合规核验" }, d: { en: "standards check", ar: "فحص المعايير", zh: "准则检查" } },
    ],
    foot: { en: "Upstream UC-01 / UC-08 · downstream UC-11 / UC-10.", ar: "أعلى UC-01 / UC-08 · أسفل UC-11 / UC-10.", zh: "上游 UC-01 / UC-08 · 下游 UC-11 / UC-10。" },
  },
  edges: [
    { from: "src", fa: "R", to: "uc09", ta: "L", c: "g", t: { en: "Financial transactions, trial balances, bank statements, contracts, policies", ar: "المعاملات وموازين المراجعة والكشوف والعقود والسياسات", zh: "财务交易、试算平衡、银行对账单、合同、政策" } },
    { from: "uc09", fa: "R", to: "del", ta: "L", c: "o", t: { en: "Reconciliation reports, adjustments, trial balance, close reports", ar: "تقارير المطابقة والتسويات وميزان المراجعة وتقارير الإقفال", zh: "对账报告、调整、试算平衡、关账报告" } },
  ],
};
const FLOW_ACCT = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-09", label: { en: "Closing & reconciliation", ar: "الإقفال والمطابقة", zh: "关账与对账" }, cls: "focus", star: true },
  { code: "UC-11", label: { en: "Compliance & memos", ar: "الامتثال والمذكرات", zh: "合规与备忘" }, cls: "down" },
  { code: "UC-12 / UC-14", label: { en: "Costs & assets", ar: "التكاليف والأصول", zh: "成本与资产" }, cls: "down" },
  { code: "UC-10", label: { en: "Reports & narrative", ar: "التقارير والسرد", zh: "报告与叙述" }, cls: "down" },
  { code: "UC-02 / UC-03", label: { en: "Alerts & smart query", ar: "التنبيهات والاستعلام", zh: "告警与智能查询" }, cls: "down" },
];
function FlowG05Acct() { return <DirectorateFlow flow={MF_G05_ACCT} />; }
export { MF_G05_ACCT, FLOW_ACCT, FlowG05Acct };
