/* G-04 directorate-level combined flow (both sub-departments). Verbatim data
   from src/App.jsx + a thin wrapper. */
import React from "react";
import { DirectorateFlow } from "./shared.jsx";
const MF_G04 = {
  back: "entwork", cw: 2080, ch: 760,
  title: { en: "General Administration of Affairs Finance — Multi-Agent Flow (G-04)", ar: "الإدارة العامة لشؤون المالية — تدفّق متعدد الوكلاء (ج-04)", zh: "财务事务总局 — 多智能体流程(G-04)" },
  subtitle: { en: "Two sub-departments (Financial Entitlements + Audit) · data unification → entitlements → anomaly → closing → reports → smart query → governance gate → approved outputs", ar: "إدارتان (الاستحقاقات + التدقيق) · التوحيد ← الاستحقاقات ← الشذوذ ← الإقفال ← التقارير ← الاستعلام ← البوابة ← المخرجات", zh: "两个子部门(财务权益 + 审计)· 数据统一 → 权益 → 异常 → 关账 → 报告 → 智能查询 → 治理关卡 → 已批准输出" },
  src: { x: 14, y: 104, w: 190, h: 340, list: [
    { en: "SAP/Asas · Etimad", ar: "ساب/أساس · اعتماد", zh: "SAP/Asas · Etimad" },
    { en: "GRP · Hyperion/MTFP", ar: "GRP · هايبريون", zh: "GRP · Hyperion/MTFP" },
    { en: "BI · Tahseel", ar: "BI · تحصيل", zh: "BI · Tahseel" },
    { en: "Makeen/Balady · Efaa", ar: "مكين/بلدي · إيفاء", zh: "Makeen/Balady · Efaa" },
    { en: "Sanad · Esnad", ar: "سند · إسناد", zh: "Sanad · Esnad" },
    { en: "Excel / PDF files", ar: "ملفات إكسل / PDF", zh: "Excel / PDF 文件" },
  ] },
  nodes: {
    uc01: { code: "UC-01", x: 248, y: 120, w: 236, h: 204, title: { en: "Financial Data Standardization and Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据统一与质量" }, ags: ["orch", "dataq", "insight"] },
    uc08: { code: "UC-08", x: 516, y: 120, w: 236, h: 204, title: { en: "Contracts, Claims, Disbursements, and Entitlements", ar: "العقود والمطالبات والصرف والاستحقاقات", zh: "合同、索赔、拨付与权益" }, ags: ["anom", "orch", "comp"] },
    uc02: { code: "UC-02", x: 784, y: 120, w: 236, h: 204, title: { en: "Detecting Deviations, Alerts, and Exceptions", ar: "كشف الشذوذ والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" }, ags: ["anom", "insight", "orch"] },
    uc09: { code: "UC-09", x: 1052, y: 120, w: 236, h: 204, title: { en: "Financial Closing, Reconciliation and Settlements", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与结算" }, ags: ["repgen", "comp", "anom"] },
    uc10: { code: "UC-10", x: 1320, y: 120, w: 236, h: 204, title: { en: "Periodic Financial Reports & Disclosures", ar: "التقارير المالية الدورية والإفصاحات", zh: "周期财务报告与披露" }, ags: ["repgen", "narr", "dataq"] },
    uc03: { code: "UC-03", x: 1588, y: 120, w: 236, h: 204, title: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" }, ags: ["dataq", "orch", "insight"] },
  },
  gate: { x: 1186, y: 500, w: 332, h: 204, sub: { en: "Governance gate · Human Review (mandatory) — finance officer validates entitlements, settlements, reconciliations & disclosures before final approval.", ar: "بوابة حوكمة · مراجعة بشرية إلزامية — يتحقق المسؤول المالي من الاستحقاقات والتسويات والإفصاحات قبل الاعتماد.", zh: "治理关卡 · 强制人工复核 —— 财务官在最终批准前核验权益、结算、对账与披露。" } },
  del: { x: 430, y: 484, w: 308, h: 220,
    head: { en: "Approved Disbursement / Closing Reports", ar: "الصرف / تقارير الإقفال المعتمدة", zh: "已批准拨付 / 关账报告" },
    items: [
      { t: { en: "Net entitlements", ar: "صافي الاستحقاقات", zh: "净权益" }, d: { en: "verified amounts due", ar: "مبالغ مستحقة متحققة", zh: "已核验应付额" } },
      { t: { en: "Final account", ar: "الحساب الختامي", zh: "决算账户" }, d: { en: "closed-period balances", ar: "أرصدة الفترة المقفلة", zh: "关账期余额" } },
      { t: { en: "Monthly tables", ar: "الجداول الشهرية", zh: "月度报表" }, d: { en: "period summaries", ar: "ملخصات الفترة", zh: "期间汇总" } },
      { t: { en: "Disclosures", ar: "الإفصاحات", zh: "披露" }, d: { en: "compliance notes", ar: "ملاحظات الامتثال", zh: "合规说明" } },
    ],
    foot: { en: "Released after the governance gate signs off.", ar: "تُصدر بعد اعتماد بوابة الحوكمة.", zh: "经治理关卡签核后发布。" },
  },
  edges: [
    { from: "src", fa: "R", to: "uc01", ta: "L", c: "g", t: { en: "Raw multi-system data", ar: "بيانات خام متعددة الأنظمة", zh: "原始多系统数据" } },
    { from: "uc01", fa: "R", to: "uc08", ta: "L", c: "b", t: { en: "Unified contracts / claims / disbursement", ar: "عقود / مطالبات / صرف موحّدة", zh: "统一的合同/索赔/拨付" } },
    { from: "uc08", fa: "R", to: "uc02", ta: "L", c: "b", t: { en: "Matching gaps & diffs", ar: "فجوات وفروق المطابقة", zh: "匹配缺口与差异" } },
    { from: "uc02", fa: "R", to: "uc09", ta: "L", c: "b", t: { en: "Anomalies / exceptions", ar: "الانحرافات / الاستثناءات", zh: "异常 / 例外" } },
    { from: "uc09", fa: "R", to: "uc10", ta: "L", c: "b", t: { en: "Reconciliation diffs & settlements", ar: "فروق المطابقة والتسويات", zh: "对账差异与结算" } },
    { from: "uc10", fa: "R", to: "uc03", ta: "L", c: "b", t: { en: "Reports & figures for query/audit", ar: "التقارير والأرقام للاستعلام/التدقيق", zh: "报告与数据 → 查询/审计" } },
    { from: "uc03", fa: "B", to: "gate", ta: "T", c: "b", t: { en: "Answers · audit trail · permissioned export", ar: "الإجابات · سجل التدقيق · تصدير مصرّح", zh: "答案 · 审计轨迹 · 授权导出" } },
    { from: "gate", fa: "L", to: "del", ta: "R", c: "o", t: { en: "Approved disbursement / closing reports", ar: "الصرف / تقارير الإقفال المعتمدة", zh: "已批准拨付 / 关账报告" } },
  ],
};
function FlowG04() { return <DirectorateFlow flow={MF_G04} />; }
export { MF_G04, FlowG04 };
