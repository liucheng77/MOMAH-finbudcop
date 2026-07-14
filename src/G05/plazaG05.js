/* PLAZA_G05 — G-05 Business Plaza model.
   Self-contained: inlines the PZN / PZ_OPEN / pzNode() data that used to
   live in src/App.jsx so this module is decoupled from the host App.

   G-05 shares ONE plaza across its four sub-departments (Accounting ·
   Compliance · Cost Management · Financial Reporting).  Each department's
   workspace highlights a different plazaSel node. */

// Per-UC plaza-node metadata (subset of PZN in App.jsx — only the nodes G-05
// actually renders on its plaza: uc01, uc02, uc03, uc09, uc10, uc11, uc12, uc14).
const PZN_G05 = {
  uc01: { code: "UC-01", title: { en: "Financial Data Standardization and Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" }, agents: ["Orchestrator", "Data Querying", "Proactive Insights"] },
  uc02: { code: "UC-02", title: { en: "Anomaly Detection, Alerts & Exceptions", ar: "كشف الشذوذ والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" }, agents: ["Anomaly Detection", "Proactive Insights", "Orchestrator"] },
  uc03: { code: "UC-03", title: { en: "Intelligent Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" }, agents: ["Data Querying", "Orchestrator", "Proactive Insights"] },
  uc09: { code: "UC-09", title: { en: "Financial Closing, Reconciliation and Settlements", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与结算" }, agents: ["Financial Reports Gen.", "Compliance/Rules", "Anomaly Detection"] },
  uc10: { code: "UC-10", title: { en: "Generating Financial and Administrative Reports and Narrative Commentaries", ar: "التقارير ولوحات المعلومات", zh: "报告与仪表盘" }, agents: ["Financial Reports Gen.", "Narrative Commentary", "Data Querying"] },
  uc11: { code: "UC-11", title: { en: "Compliance, Policies & Accounting Memos", ar: "الامتثال والسياسات والمذكرات المحاسبية", zh: "合规、政策与会计备忘" }, agents: ["Compliance/Rules", "Financial Reports Gen.", "Data Querying"] },
  uc12: { code: "UC-12", title: { en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" }, agents: ["Data Querying", "Financial Reports Gen.", "Anomaly Detection"] },
  uc14: { code: "UC-14", title: { en: "Assets: Classification & Capitalization", ar: "الأصول: التصنيف والرسملة", zh: "资产:分类与资本化" }, agents: ["Data Querying", "Market Trends", "Compliance/Rules"] },
};
// uc09 opens the rich Accounting UC-09 workbench (g05bench09 · a copy of the
// Financial Entitlements UC-09 page), not the shared bench09.
const PZ_OPEN_G05 = { uc01: "bench01", uc02: "alerts", uc03: "bench03", uc09: "g05bench09", uc10: "reports", uc11: "compmemo", uc12: "csfunds", uc14: "asbench" };
const pzNode = (id, lane, col, extra) => Object.assign(
  { id, lane, col, open: PZ_OPEN_G05[id] },
  PZN_G05[id] || {},
  extra || {}
);

const PLAZA_G05 = {
  lanes: [
    { key: "acct", label: { en: "ACCOUNTING DEPARTMENT", ar: "إدارة المحاسبة", zh: "会计部" }, cls: "rev" },
    { key: "comp", label: { en: "COMPLIANCE DEPARTMENT", ar: "إدارة الامتثال", zh: "合规部" }, cls: "ast" },
    { key: "cost", label: { en: "COST MANAGEMENT DEPARTMENT", ar: "إدارة التكاليف", zh: "成本管理部" }, cls: "c3" },
    { key: "rep", label: { en: "FINANCIAL REPORTING DEPARTMENT", ar: "إدارة التقارير المالية", zh: "财务报告部" }, cls: "c4" },
  ],
  title: { en: "G-05 second-level departments — Financial Reports directorate", ar: "إدارات ج-05 — التقارير المالية", zh: "G-05 二级部门 — 财务报告总局" },
  nodes: [
    pzNode("uc09", "acct", 2),
    pzNode("uc11", "comp", 1),
    pzNode("uc02", "comp", 4),
    pzNode("uc12", "cost", 1),
    pzNode("uc14", "cost", 2),
    pzNode("uc01", "rep", 0),
    pzNode("uc10", "rep", 3),
    pzNode("uc03", "rep", 4),
  ],
  intra: [],
  cross: [
    { from: "uc09", to: "uc11", label: { en: "Reconciliation diffs & settlements", ar: "فروق المطابقة والتسويات", zh: "对账差异与结算" } },
    { from: "uc11", to: "uc12", label: { en: "Compliant treatment & policy refs", ar: "المعالجة المتوافقة ومراجع السياسات", zh: "合规处理与政策依据" } },
    { from: "uc11", to: "uc14", label: { en: "Compliant treatment & policy refs", ar: "المعالجة المتوافقة ومراجع السياسات", zh: "合规处理与政策依据" } },
    { from: "uc12", to: "uc10", label: { en: "Cost / fund data", ar: "بيانات التكاليف / الصناديق", zh: "成本 / 资金数据" } },
    { from: "uc14", to: "uc10", label: { en: "Asset cost & capitalization", ar: "تكلفة الأصول والرسملة", zh: "资产成本与资本化" } },
    { from: "uc10", to: "uc02", label: { en: "Reports for monitoring", ar: "تقارير للمراقبة", zh: "报告 → 监控" } },
    { from: "uc10", to: "uc03", label: { en: "Reports for query / audit", ar: "تقارير للاستعلام / التدقيق", zh: "报告 → 查询 / 审计" } },
  ],
};

export { PLAZA_G05 };
