/* PLAZA_G04 — G-04 Business Plaza model.
   Self-contained: inlines the PZN / PZ_OPEN / pzNode() data that used to
   live in src/App.jsx so this module is decoupled from the host App. */

// Per-UC plaza-node metadata (subset of PZN in App.jsx — only the nodes G-04
// actually renders on its plaza: UC-01, UC-08, UC-09, UC-10, UC-02, UC-03).
const PZN_G04 = {
  uc01: { code: "UC-01", title: { en: "Financial Data Standardization and Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" }, agents: ["Orchestrator", "Data Querying", "Proactive Insights"] },
  uc02: { code: "UC-02", title: { en: "Anomaly Detection, Alerts & Exceptions", ar: "كشف الشذوذ والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" }, agents: ["Anomaly Detection", "Proactive Insights", "Orchestrator"] },
  uc03: { code: "UC-03", title: { en: "Intelligent Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" }, agents: ["Data Querying", "Orchestrator", "Proactive Insights"] },
  uc08: { code: "UC-08", title: { en: "Contracts, Claims, Disbursements, and Entitlements", ar: "العقود والمطالبات والصرف والاستحقاقات", zh: "合同、索赔、拨付与权益" }, agents: ["Anomaly Detection", "Orchestrator", "Compliance/Rules"] },
  uc09: { code: "UC-09", title: { en: "Financial Closing, Reconciliation and Settlements", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与结算" }, agents: ["Financial Reports Gen.", "Compliance/Rules", "Anomaly Detection"] },
  uc10: { code: "UC-10", title: { en: "Generating Financial and Administrative Reports and Narrative Commentaries", ar: "التقارير ولوحات المعلومات", zh: "报告与仪表盘" }, agents: ["Financial Reports Gen.", "Narrative Commentary", "Data Querying"] },
  uc10a: { code: "UC-10", title: { en: "Generating Financial and Administrative Reports and Narrative Commentaries", ar: "التقارير ولوحات المعلومات", zh: "报告与仪表盘" }, agents: ["Financial Reports Gen.", "Narrative Commentary", "Data Querying"] },
};
const PZ_OPEN_G04 = { uc01: "g04bench01", uc02: "g04bench02", uc03: "bench03", uc08: "bench08", uc09: "g04bench09", uc10: "g04reports", uc10a: "g04bench10" };
const pzNode = (id, lane, col, extra) => Object.assign(
  { id, lane, col, open: PZ_OPEN_G04[id] },
  PZN_G04[id] || {},
  extra || {}
);

const PLAZA_G04 = {
  top: { en: "FINANCIAL ENTITLEMENTS DEPARTMENT", ar: "إدارة الاستحقاقات المالية", zh: "财务权益部" },
  bot: { en: "AUDIT DEPARTMENT", ar: "إدارة التدقيق", zh: "审计部" },
  title: { en: "G-04 second-level departments — Entitlements × Audit", ar: "إدارات ج-04 — الاستحقاقات × التدقيق", zh: "G-04 二级部门 — 权益 × 审计" },
  nodes: [
    pzNode("uc01", "rev", 0),
    pzNode("uc08", "rev", 1),
    pzNode("uc09", "rev", 2),
    pzNode("uc10", "rev", 3),
    pzNode("uc02", "ast", 1),
    pzNode("uc10a", "ast", 2),
    pzNode("uc03", "ast", 3),
  ],
  intra: [],
  cross: [
    { from: "uc08", to: "uc02", label: { en: "Matching gaps & differences for monitoring", ar: "فجوات المطابقة والفروق للمراقبة", zh: "匹配缺口与差异 → 监控" } },
    { from: "uc09", to: "uc02", label: { en: "Reconciliation diffs & settlement exceptions", ar: "فروق المطابقة واستثناءات التسوية", zh: "对账差异与结算例外 → 监控" } },
    { from: "uc02", to: "uc08", label: { en: "Alerts, exception lists, suggested actions", ar: "تنبيهات وقوائم استثناءات وإجراءات مقترحة", zh: "告警、例外清单、建议措施 → 权益" } },
    { from: "uc03", to: "uc10", label: { en: "Cross-department queries & audit log / permissions", ar: "استعلامات بين الإدارات وسجل التدقيق / الصلاحيات", zh: "跨部门查询与审计日志 / 权限 → 报告" } },
  ],
};

export { PLAZA_G04 };
