/* PLAZA_G04 — G-04 Business Plaza model (verbatim from src/App.jsx). */
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
