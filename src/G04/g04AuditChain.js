/* G-04 审计部统一故事线常量 (Audit Department).
   严格按审计部广场(PLAZA_G04 · ast 车道)卡片顺序:UC-02 → UC-10 → UC-03,
   共 3 个节点。由审计部广场上的 3 个 UC 卡片点入的详情页统一引用,
   只切换当前节点(here)——与财务权益部的 g04Chain.js 做法完全一致。 */

const G04_AUDIT_CHAIN = [
  { code: "UC-02", pos: "up",   route: "g04bench02", name: { en: "Anomaly Detection, Alerts & Exceptions", ar: "كشف الشذوذ والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" } },
  { code: "UC-10", pos: "para", route: "g04bench10", name: { en: "Generating Financial & Administrative Reports", ar: "التقارير المالية والإدارية ولوحات المعلومات", zh: "报告与仪表盘" } },
  { code: "UC-03", pos: "down", route: "bench03",    name: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" } },
];

/* Helper: return a copy of G04_AUDIT_CHAIN with the given UC code as the
   current node (`here: true`).  Used by the G-04 audit benches (UC-02 /
   UC-03 / UC-10) so the storyline stays unified across all 3 detail pages —
   only the highlighted node changes. 镜像 g04Chain.js 的 g04ChainHere。 */
function g04AuditChainHere(uc) {
  return G04_AUDIT_CHAIN.map(n => ({ ...n, here: n.code === uc }));
}

export { G04_AUDIT_CHAIN, g04AuditChainHere };
