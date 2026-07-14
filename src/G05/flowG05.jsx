/* G-05 directorate-level combined flow (all four sub-departments). Verbatim
   data from src/App.jsx + a thin wrapper. */
import React from "react";
import { DirectorateFlow } from "./shared.jsx";
const MF_G05 = {
  back: "frepwork", cw: 1760, ch: 840,
  title: { en: "G-05 Financial Reports Directorate — Use-case storyline & agent I/O flow", ar: "مديرية التقارير المالية ج-05 — قصة الحالات وتدفّق الوكلاء", zh: "G-05 财务报告总局 — 用例故事线与代理输入/输出流程" },
  subtitle: { en: "Shared directorate flow (Reporting + Compliance + Cost + Accounting depts) · sources → costs / closure / compliance → reporting → human gate → financial reports & memos", ar: "تدفّق مشترك (التقارير + الامتثال + التكاليف + المحاسبة) · المصادر ← التكاليف/الإقفال/الامتثال ← التقارير ← البوابة ← التقارير والمذكرات", zh: "总局共享流程(报告+合规+成本+会计部)· 数据源 → 成本/关账/合规 → 报告 → 人工关卡 → 财务报告与备忘" },
  src: { x: 10, y: 80, w: 184, h: 320, list: ["SAP / Asas", "Etimad", "Esnad", { en: "Invoices", ar: "الفواتير", zh: "发票" }, { en: "Completion certs", ar: "شهادات الإنجاز", zh: "完工证明" }, { en: "Policies / standards", ar: "السياسات/المعايير", zh: "政策/准则" }, { en: "Bank statements", ar: "كشوف بنكية", zh: "银行对账单" }, "Excel / PDF"] },
  nodes: {
    uc01: { code: "UC-01", x: 260, y: 300, w: 220, h: 150, title: { en: "Financial Data Standardization and Data Quality", ar: "توحيد البيانات وجودتها", zh: "财务数据统一与质量" }, ags: ["orch", "dataq", "insight"] },
    uc08: { code: "UC-08", x: 260, y: 540, w: 220, h: 130, title: { en: "Contracts, Claims & Disbursements", ar: "العقود والمطالبات والصرف", zh: "合同、索赔与拨付" }, ags: ["dataq", "anom", "repgen"] },
    uc12: { code: "UC-12", x: 575, y: 110, w: 230, h: 160, title: { en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" }, ags: ["dataq", "repgen", "anom"] },
    uc09: { code: "UC-09", x: 575, y: 330, w: 230, h: 160, title: { en: "Closure, Reconciliation & Adjustments", ar: "الإقفال والمطابقة والتسويات", zh: "关账、对账与调整" }, ags: ["dataq", "anom", "comp"] },
    uc11: { code: "UC-11", x: 575, y: 570, w: 230, h: 160, title: { en: "Compliance, Policies & Accounting Memos", ar: "الامتثال والسياسات والمذكرات", zh: "合规、政策与会计备忘" }, ags: ["comp", "repgen", "dataq"] },
    uc14: { code: "UC-14", x: 905, y: 120, w: 220, h: 150, title: { en: "Assets — Capitalization (cost basis)", ar: "الأصول — الرسملة (أساس التكلفة)", zh: "资产 — 资本化(成本基础)" }, ags: ["dataq", "market", "comp"] },
    uc10: { code: "UC-10", x: 920, y: 380, w: 236, h: 170, title: { en: "Reports & Dashboards (Periodic / Executive)", ar: "التقارير ولوحات المعلومات", zh: "报告与仪表盘(周期/执行)" }, ags: ["repgen", "narr", "dataq"] },
    uc03: { code: "UC-03", x: 905, y: 610, w: 220, h: 140, title: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق", zh: "智能查询、审计日志与权限" }, ags: ["dataq", "orch", "insight"] },
  },
  gate: { x: 1290, y: 390, w: 220, h: 180, sub: { en: "Validate & approve · reports · memos & entries · authorize export", ar: "تحقّق واعتمد · التقارير · المذكرات والقيود · التصدير", zh: "验证并批准 · 报告 · 备忘与分录 · 授权导出" } },
  del: { x: 1560, y: 400, w: 190, h: 160, sub: { en: "Approved financial reports, memos & dashboards", ar: "تقارير ومذكرات ولوحات معتمدة", zh: "已批准的财务报告、备忘与仪表盘" } },
  edges: [
    { from: "src", fa: "R", to: "uc01", ta: "L", c: "g", t: { en: "Ledgers, invoices, policies", ar: "الدفاتر والفواتير والسياسات", zh: "总账/发票/政策" } },
    { from: "uc01", fa: "R", to: "uc12", ta: "L", c: "b", t: { en: "Unified cost & order data", ar: "بيانات التكاليف والأوامر", zh: "统一成本与派工数据" } },
    { from: "uc01", fa: "R", to: "uc09", ta: "L", c: "b", t: { en: "Consolidated, validated data", ar: "بيانات موحّدة ومعتمدة", zh: "统一校验数据" } },
    { from: "uc08", fa: "R", to: "uc09", ta: "L", c: "b", t: { en: "Claims & disbursement outputs", ar: "مخرجات المطالبات والصرف", zh: "索赔与拨付输出" } },
    { from: "uc12", fa: "R", to: "uc14", ta: "L", c: "b", t: { en: "Assignment-order costs", ar: "تكاليف أوامر الإسناد", zh: "派工单成本" } },
    { from: "uc09", fa: "B", to: "uc11", ta: "T", c: "b", t: { en: "Differences & proposed adjustments", ar: "الفروق والتسويات المقترحة", zh: "差异与建议调整" } },
    { from: "uc12", fa: "R", to: "uc10", ta: "L", c: "b", t: { en: "Costs, unit cost & fund balances", ar: "التكاليف وأرصدة الصناديق", zh: "成本/单元成本/资金余额" } },
    { from: "uc09", fa: "R", to: "uc10", ta: "L", c: "b", t: { en: "Closing entries & balances", ar: "قيود الإقفال والأرصدة", zh: "关账分录与余额" } },
    { from: "uc11", fa: "R", to: "uc10", ta: "L", c: "b", t: { en: "Compliance findings & memos", ar: "نتائج الامتثال والمذكرات", zh: "合规结论与备忘" } },
    { from: "uc14", fa: "B", to: "uc10", ta: "T", c: "b", t: { en: "Asset cost basis", ar: "أساس تكلفة الأصول", zh: "资产成本基础" } },
    { from: "uc10", fa: "R", to: "gate", ta: "L", c: "b", t: { en: "Draft reports & narrative", ar: "مسودات التقارير والسرد", zh: "报告草稿与叙述" } },
    { from: "uc03", fa: "R", to: "gate", ta: "L", c: "b", t: { en: "Audit trail & exports", ar: "سجل التدقيق والتصدير", zh: "审计轨迹与导出" } },
    { from: "gate", fa: "R", to: "del", ta: "L", c: "o", t: { en: "Approved reports & memos", ar: "تقارير ومذكرات معتمدة", zh: "已批准报告与备忘" } },
  ],
};
function FlowG05() { return <DirectorateFlow flow={MF_G05} />; }
export { MF_G05, FlowG05 };
