/* G-04 故事线常量(财务权益部 Financial Entitlements Department).
   严格按广场卡片顺序:UC-01 → UC-08 → UC-09 → UC-10,共 4 个节点。
   由财务权益部广场(PLAZA_G04)上的 4 个 UC 卡片(UC-01/08/09/10)点入的
   详情页统一引用,只切换当前节点(here)。 */
const G04_CHAIN = [
  { code: "UC-01", pos: "up",   route: "g04bench01", name: { en: "Financial Data Standardization and Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" } },
  { code: "UC-08", pos: "para", route: "bench08",    name: { en: "Contracts, Claims, Disbursements, and Entitlements", ar: "العقود والمطالبات والصرف والاستحقاقات", zh: "合同、索赔、拨付与权益" } },
  { code: "UC-09", pos: "down", route: "g04bench09", name: { en: "Financial Closing, Reconciliation and Settlements", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与结算" } },
  { code: "UC-10", pos: "down", route: "g04reports", name: { en: "Generating Financial and Administrative Reports and Narrative Commentaries", ar: "توليد التقارير والتعليق السردي", zh: "报告生成与叙述评述" } },
];

/* Helper: return a copy of G04_CHAIN with the given UC code as the current
   node (`here: true`).  Used by the G-04 benches (UC-01 / UC-08 / UC-09)
   so the storyline stays unified across all 4 detail pages — only the
   highlighted node changes. */
function g04ChainHere(uc) {
  return G04_CHAIN.map(n => ({ ...n, here: n.code === uc }));
}

export { G04_CHAIN, g04ChainHere };
