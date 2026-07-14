/* =========================================================================
   Shell · departments — left-menu organizational tree (General Directorates
   → sub-departments).  UNLOCKED_SUBS is the canonical set of departments
   reachable from the sidebar; Sidebar calls isUnlocked() instead of
   hard-coding the long id-list.
   ========================================================================= */

export const DEPARTMENTS = [
  { key: "g02", name: { en: "General Directorate of Planning and Financial Performance", ar: "الإدارة العامة للتخطيط والأداء المالي", zh: "规划与财务绩效总局" }, subs: [
    { id: "plan",  route: "plnwork",  name: { en: "Planning Department",                       ar: "إدارة التخطيط",                    zh: "规划部" } },
    { id: "fpa",   route: "fpawork",  name: { en: "Financial Performance Analysis Department", ar: "إدارة تحليل الأداء المالي",         zh: "财务绩效分析部" } },
  ] },
  { key: "g03", name: { en: "General Budget Department", ar: "الإدارة العامة للميزانية", zh: "预算总局" }, subs: [
    { id: "budexec", route: "buwork", name: { en: "Budget Execution Department", ar: "إدارة تنفيذ الميزانية", zh: "预算执行部" } },
  ] },
  { key: "g04", name: { en: "General Administration of Affairs Finance", ar: "الإدارة العامة للشؤون المالية", zh: "财务事务总局" }, subs: [
    { id: "entitle", route: "entwork", name: { en: "Financial Entitlements Department", ar: "إدارة الاستحقاقات المالية", zh: "财务权益部" } },
    { id: "audit",   route: "audwork", name: { en: "Audit Department",                  ar: "إدارة التدقيق",              zh: "审计部" } },
  ] },
  { key: "g05", name: { en: "General Directorate of Financial Reporting", ar: "الإدارة العامة للتقارير المالية", zh: "财务报告总局" }, subs: [
    { id: "frep", route: "frepwork", name: { en: "Financial Reporting Department", ar: "إدارة التقارير المالية", zh: "财务报告部" } },
    { id: "comp", route: "compwork", name: { en: "Compliance Department",          ar: "إدارة الامتثال",          zh: "合规部" } },
    { id: "cost", route: "costwork", name: { en: "Cost Management Department",     ar: "إدارة التكاليف",          zh: "成本管理部" } },
    { id: "acct", route: "acctwork", name: { en: "Accounting Department",          ar: "إدارة المحاسبة",          zh: "会计部" } },
  ] },
  { key: "g06", name: { en: "General Directorate of Revenues and Assets", ar: "الإدارة العامة للإيرادات والأصول", zh: "收入与资产总局" }, subs: [
    { id: "revcol", route: "rcwork", name: { en: "Revenue Collection Department", ar: "إدارة التحصيل", zh: "收入征收部" } },
    { id: "assets", route: "aswork", name: { en: "Assets Department",              ar: "إدارة الأصول",   zh: "资产部" } },
  ] },
];

/* ---- sub-departments with a live page (others show 🔒) ---- */
const UNLOCKED_SUBS = new Set([
  "fpa", "revcol", "budexec", "assets", "audit", "frep",
  "comp", "cost",   "plan",    "entitle", "acct",
]);

export const isUnlocked = (subId) => UNLOCKED_SUBS.has(subId);
