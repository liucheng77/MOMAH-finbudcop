/* 财务权益部 — UC-01 财务数据统一与数据质量 (G-04 专属工作台).
   完整复制自 src/App.jsx 中的 BENCH_UC01(原 G-01 共用),改为 G-04 部门语境:
   - route 改为 "g04bench01",back 改为 "entwork"(返回权益部门广场)
   - deptName 改为 G-04 部门名
   - chain/chainLab/chainHideUc 改为 G-04 统一链路
   - 复制 summary/recs/ctas/scope/outputs/sources/roles/logs/narr/qs/answers/genAns
     等所有业务数据,与原版保持一致(G-04 工作台只换链路与归属)。
   G-01 共用版(BENCH_UC01)保留在 src/App.jsx 不动,两者完全独立。 */
import { g04ChainHere } from "../g04Chain.js";

const BENCH_UC01 = {
  route: "g04bench01", back: "entwork", dept: "entitle", tone: "violet", uc: "UC-01", run: "#0101", tool: "uc01", chainHideUc: true,
  deptName: { en: "Financial Entitlements Department", ar: "إدارة الاستحقاقات المالية", zh: "财务权益部" },
  benchLabel: { en: "Financial Data Standardization and Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" },
  subt: { en: "Financial Data Standardization and Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据统一与数据质量" },
  chainLab: { en: "G-04 CHAIN", ar: "سلسلة ج-04", zh: "G-04 链路" },
  chain: g04ChainHere("UC-01"),
  agent: { en: "Data Querying agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" },
  summary: { en: "13 source systems consolidated into one traceable data layer — quality **96%** (completeness 96 · accuracy 94 · freshness 93). ~~214 duplicates merged~~, **38 exceptions** open (5 critical). Every figure downstream carries lineage back to its source.", ar: "وُحّد 13 نظاماً مصدرياً في طبقة بيانات واحدة قابلة للتتبع — الجودة **96%** (اكتمال 96 · دقة 94 · حداثة 93). ~~دُمج 214 تكراراً~~، **38 استثناءً** مفتوحاً (5 حرجة). كل رقم لاحق يحمل تتبعاً لمصدره.", zh: "13 个源系统整合为统一、可追溯的数据层——质量 **96%**(完整性 96 · 准确性 94 · 新鲜度 93)。~~已合并 214 条重复~~,**38 项例外**未结(5 项严重)。下游每个数字均可血缘回溯至源系统。" },
  recs: [
    { t: { en: "Clear 5 critical exceptions", ar: "معالجة 5 استثناءات حرجة", zh: "处理 5 项严重例外" }, d: { en: "duplicate vendor invoice · TB account 2310 anomaly · 3 source gaps", ar: "فاتورة مورد مكررة · شذوذ حساب 2310 · 3 فجوات مصادر", zh: "重复供应商发票 · 科目 2310 异常 · 3 处源缺口" } },
    { t: { en: "Refresh two stale feeds", ar: "تحديث تغذيتين قديمتين", zh: "刷新 2 条陈旧数据源" }, d: { en: "Tahseel 78% · Hyperion 74% freshness — below the 90% SLA", ar: "تحصيل 78% · هايبريون 74% — دون اتفاقية 90%", zh: "Tahseel 78%、Hyperion 74% 新鲜度低于 90% SLA" } },
    { t: { en: "Approve 96 mapping corrections", ar: "اعتماد 96 تصحيح مطابقة", zh: "批准 96 项映射更正" }, d: { en: "class & key corrections proposed by the agent, pending review", ar: "تصحيحات فئات ومفاتيح مقترحة بانتظار المراجعة", zh: "智能体建议的分类与主键更正,待人工复核" } },
  ],
  ctas: [
    { uc: "UC-02", label: { en: "Detecting Deviations, Alerts, and Exceptions", ar: "كشف الانحرافات والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" }, to: "alerts" },
    { uc: "UC-03", label: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" }, to: "bench03", dept: "audit" },
  ],
  scope: [
    { k: { en: "Period", ar: "الفترة", zh: "期间" }, opts: ["FY 2026 · Q2", "FY 2026 · Q1", "FY 2025 · Q4"] },
    { k: { en: "Domain", ar: "المجال", zh: "域" }, opts: ["All domains", "Budget", "Revenue", "Assets"] },
    { k: { en: "Source", ar: "المصدر", zh: "源" }, opts: ["All 13 systems", "SAP/Asas", "Etimad", "Esnad"] },
  ],
  resultsH: { en: "Data Quality & Lineage Results", ar: "نتائج جودة البيانات والتتبع", zh: "数据质量与血缘结果" },
  resultsSub: { en: "数据质量与血缘结果 outputs · produced by agents", ar: "مخرجات 数据质量与血缘结果 · أُنتجت بواسطة الوكلاء", zh: "数据质量与血缘结果 输出 · 由智能体生成" },
  outputs: [
    { l: { en: "Data Quality Dashboard", ar: "لوحة جودة البيانات", zh: "数据质量仪表盘" }, v: "96%", s: { en: "weighted score across 13 systems", ar: "درجة مرجحة عبر 13 نظاماً", zh: "13 个系统的加权评分" }, tag: { en: "DQ 96%", ar: "الجودة 96%", zh: "质量 96%" }, rows: [
      { k: { en: "Completeness", ar: "الاكتمال", zh: "完整性" }, v: "96%", pct: 96 },
      { k: { en: "Accuracy", ar: "الدقة", zh: "准确性" }, v: "94%", pct: 94 },
      { k: { en: "Freshness", ar: "الحداثة", zh: "新鲜度" }, v: "93%", pct: 93 },
    ] },
    { l: { en: "Exception List", ar: "قائمة الاستثناءات", zh: "例外清单" }, v: "38", s: { en: "open items · 5 critical", ar: "بنود مفتوحة · 5 حرجة", zh: "未结 · 5 项严重" }, rows: [
      { k: { en: "Critical", ar: "حرجة", zh: "严重" }, v: "5" },
      { k: { en: "Source gaps", ar: "فجوات مصادر", zh: "源缺口" }, v: "12" },
      { k: { en: "Mapping issues", ar: "مشاكل مطابقة", zh: "映射问题" }, v: "21" },
    ] },
    { l: { en: "Duplicates Merged", ar: "تكرارات مدموجة", zh: "已合并重复" }, v: "214", s: { en: "auto-matched customer & vendor keys", ar: "مطابقة آلية لمفاتيح العملاء والموردين", zh: "自动匹配客户/供应商主键" }, rows: [
      { k: { en: "Vendors", ar: "موردون", zh: "供应商" }, v: "121" },
      { k: { en: "Customers", ar: "عملاء", zh: "客户" }, v: "68" },
      { k: { en: "Contracts", ar: "عقود", zh: "合同" }, v: "25" },
    ] },
    { l: { en: "Lineage & Audit", ar: "التتبع والتدقيق", zh: "血缘与审计" }, v: "100%", s: { en: "figure → source traceable", ar: "الرقم ← المصدر قابل للتتبع", zh: "数字 → 源系统可追溯" }, rows: [
      { k: { en: "Systems mapped", ar: "أنظمة مطابقة", zh: "已映射系统" }, v: "13" },
      { k: { en: "Fields mapped", ar: "حقول مطابقة", zh: "已映射字段" }, v: "1,308" },
      { k: { en: "Audit log entries (24h)", ar: "سجل التدقيق (24س)", zh: "审计日志(24h)" }, v: "38" },
    ] },
  ],
  sources: [{ n: "SAP / Asas", s: "synced" }, { n: "Etimad", s: "synced" }, { n: "GRP", s: "synced" }, { n: "Tahseel", s: "loading" }, { n: "Esnad", s: "synced" }, { n: "BI · Balady", s: "synced" }, { n: "Hyperion", s: "loading" }, { n: "Excel / PDF", s: "synced" }],
  roles: [
    { name: { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "主动洞察智能体" }, sub: { en: "Flags stale feeds, gaps & duplicate clusters", ar: "يرصد التغذيات القديمة والفجوات والتكرارات", zh: "标记陈旧数据源、缺口与重复簇" }, status: "running", cls: "r-violet" },
    { name: { en: "Orchestrator Agent", ar: "وكيل المنسّق", zh: "编排器智能体" }, sub: { en: "Sequences ingestion, matching & quality checks across sources", ar: "ينسّق الاستيعاب والمطابقة وفحوص الجودة", zh: "编排跨源采集、匹配与质量检查" }, status: "active", cls: "r-blue" },
    { name: { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }, sub: { en: "Builds the unified, lineage-tagged data layer", ar: "يبني الطبقة الموحّدة الموسومة بالتتبع", zh: "构建带血缘标签的统一数据层" }, status: "active", cls: "r-blue" },
  ],
  logs: [
    { tm: "10:02", code: "UC-01", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "Ingested 13 systems · 412k records normalized", ar: "استيعاب 13 نظاماً · توحيد 412 ألف سجل", zh: "采集 13 个系统 · 规范化 41.2 万条记录" }, dot: "blue" },
    { tm: "10:03", h: { en: "Key Matching", ar: "مطابقة المفاتيح", zh: "主键匹配" }, d: { en: "Merged 214 duplicate vendor / customer keys", ar: "دمج 214 مفتاحاً مكرراً", zh: "合并 214 条重复供应商/客户主键" }, dot: "blue" },
    { tm: "10:04", h: { en: "Quality Scoring", ar: "تقييم الجودة", zh: "质量评分" }, d: { en: "Completeness 96 · accuracy 94 · freshness 93", ar: "اكتمال 96 · دقة 94 · حداثة 93", zh: "完整性 96 · 准确性 94 · 新鲜度 93" }, dot: "blue" },
    { tm: "10:05", h: { en: "Exceptions", ar: "الاستثناءات", zh: "例外" }, d: { en: "38 open · 5 critical flagged to UC-02", ar: "38 مفتوحاً · 5 حرجة إلى UC-02", zh: "38 未结 · 5 严重已转 UC-02" }, dot: "amber" },
    { tm: "10:06", h: { en: "Orchestrator", ar: "المنسّق", zh: "编排器" }, d: { en: "Lineage index rebuilt · awaiting follow-up", ar: "أُعيد بناء فهرس التتبع · بانتظار المتابعة", zh: "血缘索引已重建 · 等待追问" }, dot: "gray" },
  ],
  narr: {
    p: [
      { en: "The unified layer now covers 13 systems at 96% quality; 214 duplicate keys were merged this period and every downstream figure is lineage-traceable.", ar: "تغطي الطبقة الموحّدة 13 نظاماً بجودة 96%؛ دُمج 214 مفتاحاً مكرراً هذه الفترة وكل رقم لاحق قابل للتتبع.", zh: "统一数据层现覆盖 13 个系统,质量 96%;本期合并 214 条重复主键,下游所有数字均可血缘追溯。" },
      { en: "Two feeds run below the 90% freshness SLA (Tahseel 78%, Hyperion 74%); 38 exceptions remain open, of which 5 are critical and already routed to alerts.", ar: "تغذيتان دون اتفاقية الحداثة 90% (تحصيل 78%، هايبريون 74%)؛ و38 استثناءً مفتوحاً منها 5 حرجة حُوّلت للتنبيهات.", zh: "两条数据源低于 90% 新鲜度 SLA(Tahseel 78%、Hyperion 74%);38 项例外未结,其中 5 项严重且已转告警。" },
    ],
    recs: [
      { en: "Clear the 5 critical exceptions before period close", ar: "معالجة الاستثناءات الحرجة الخمس قبل الإقفال", zh: "关账前处理 5 项严重例外" },
      { en: "Escalate the two stale feeds to source-system owners", ar: "تصعيد التغذيتين القديمتين لمالكي الأنظمة", zh: "将 2 条陈旧数据源升级至源系统负责人" },
      { en: "Approve the 96 proposed mapping corrections", ar: "اعتماد 96 تصحيح مطابقة مقترحاً", zh: "批准 96 项建议映射更正" },
    ],
    src: { en: "Source: unified data layer · Data Querying Agent", ar: "المصدر: الطبقة الموحّدة · وكيل الاستعلام", zh: "来源:统一数据层 · 数据查询智能体" },
  },
  qs: [
    { en: "Which feeds have the lowest freshness?", ar: "ما التغذيات الأقل حداثة؟", zh: "哪些数据源新鲜度最低?" },
    { en: "What are today's critical exceptions?", ar: "ما الاستثناءات الحرجة اليوم؟", zh: "今天有哪些严重例外?" },
    { en: "Trace SAR 11.12B actual spend to its sources", ar: "تتبّع الإنفاق الفعلي 11.12 مليار لمصادره", zh: "追溯 SAR 11.12B 实际支出的数据来源" },
  ],
  answers: [
    { en: "Tahseel (78%, weekly SLA) and Hyperion (74%, quarterly) run below the 90% freshness target; Etimad Plus is in migration. All other 10 feeds are ≥ 90%.", ar: "تحصيل (78%) وهايبريون (74%) دون هدف 90%؛ واعتماد بلس في مرحلة انتقال. بقية التغذيات العشر ≥ 90%.", zh: "Tahseel(78%,周更 SLA)与 Hyperion(74%,季更)低于 90% 目标;Etimad Plus 处于迁移期。其余 10 条数据源均 ≥90%。" },
    { en: "5 critical: a suspected duplicate invoice (vendor 700412), an abnormal TB entry (account 2310), and 3 source gaps in municipal asset registers — all routed to UC-02 with owners assigned.", ar: "5 حرجة: فاتورة مكررة مشتبهة (مورد 700412)، وقيد شاذ (حساب 2310)، و3 فجوات في سجلات أصول بلدية — حُوّلت لـ UC-02 مع تعيين مسؤولين.", zh: "5 项严重:疑似重复发票(供应商 700412)、试算平衡异常分录(科目 2310)、市政资产台账 3 处源缺口——均已转 UC-02 并指派负责人。" },
    { en: "SAR 11.12B actual spend = SAP/Asas consumption detail (10.61B) + Etimad-settled payments not yet posted (0.51B); reconciliation matched at 98% with 2 open differences (SAR 25M).", ar: "الإنفاق 11.12 مليار = تفاصيل استهلاك ساب (10.61) + مدفوعات اعتماد غير مرحّلة (0.51)؛ تطابق 98% مع فرقين مفتوحين (25 مليوناً).", zh: "SAR 11.12B 实际支出 = SAP/Asas 消费明细(10.61B)+ Etimad 已结未过账付款(0.51B);对账匹配 98%,2 项差异未结(SAR 25M)。" },
  ],
  genAns: { en: "From the unified layer: 13 systems · quality 96% · 38 open exceptions (5 critical) · full lineage available for every downstream figure.", ar: "من الطبقة الموحّدة: 13 نظاماً · جودة 96% · 38 استثناءً (5 حرجة) · تتبع كامل لكل رقم.", zh: "依据统一数据层:13 个系统 · 质量 96% · 38 项例外未结(5 严重)· 下游每个数字均有完整血缘。" },
};

export { BENCH_UC01 };
