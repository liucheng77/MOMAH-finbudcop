/* 审计部 — UC-03 analysis workbench config (UcBench). Verbatim from src/App.jsx. */
const BENCH_UC03 = {
  route: "bench03", back: "audwork", dept: "audit", tone: "violet", uc: "UC-03", run: "#1503",
  deptName: { en: "Shared Foundation (G-01)", ar: "الأساس المشترك (ج-01)", zh: "共享基础层(G-01)" },
  subt: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" },
  chainLab: { en: "G-01 CHAIN", ar: "سلسلة ج-01", zh: "G-01 链路" },
  chain: [
    { code: "UC-01", pos: "up", name: { en: "Data Unification & Quality", ar: "توحيد البيانات وجودتها", zh: "数据统一与质量" } },
    { code: "UC-02", pos: "up", name: { en: "Detecting Deviations, Alerts, and Exceptions", ar: "كشف الانحرافات والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" } },
    { code: "UC-03", pos: "here", here: true, name: { en: "Smart Query, Audit Log, and Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" } },
    { code: "UC-10", pos: "down", name: { en: "Reports & Dashboards", ar: "التقارير ولوحات المعلومات", zh: "报告与仪表盘" } },
    { code: "EXPORT", pos: "down", name: { en: "Permissioned exports", ar: "تصدير مصرّح", zh: "授权导出" } },
  ],
  agent: { en: "Smart-Query agent", ar: "وكيل الاستعلام الذكي", zh: "智能查询智能体" },
  summary: { en: "Natural-language answers over the unified layer — **28,140 events indexed**, average answer confidence **92%**, every answer carries sources & lineage. ~~38 audit-log entries in 24h~~; all queries and exports are permission-scoped and fully traceable.", ar: "إجابات بلغة طبيعية فوق الطبقة الموحّدة — **28,140 حدثاً مفهرساً**، متوسط الثقة **92%**، كل إجابة تحمل المصادر والتتبع. ~~38 إدخال سجل في 24 ساعة~~؛ وكل الاستعلامات والتصدير محكومة بالصلاحيات.", zh: "在统一数据层上的自然语言问答——**已索引 28,140 个事件**,回答平均置信度 **92%**,每个答案附来源与血缘。~~24 小时 38 条审计日志~~;所有查询与导出均受权限约束、全程可审计。" },
  recs: [
    { t: { en: "Reconstruct an approval chain", ar: "إعادة بناء سلسلة اعتماد", zh: "重建一条审批链" }, d: { en: "e.g. AO-2207 idle surplus — 3 approvers, timestamps & basis", ar: "مثل فائض AO-2207 — 3 معتمدين مع الطوابع والأساس", zh: "如 AO-2207 闲置结余——3 名审批人、时间戳与依据" } },
    { t: { en: "Review 9 exports awaiting sign-off", ar: "مراجعة 9 عمليات تصدير بانتظار التوقيع", zh: "复核 9 笔待签核导出" }, d: { en: "permissioned Excel/PDF exports queued for approval", ar: "تصدير مصرّح بانتظار الاعتماد", zh: "授权 Excel/PDF 导出排队待批" } },
    { t: { en: "Tighten 2 over-broad scopes", ar: "تضييق نطاقين واسعين", zh: "收紧 2 个过宽权限范围" }, d: { en: "role scopes exceeding department read-only policy", ar: "نطاقات أدوار تتجاوز سياسة القراءة", zh: "角色范围超出部门只读策略" } },
  ],
  ctas: [
    { uc: "UC-10", label: { en: "Generating Financial and Administrative Reports and Narrative Commentaries", ar: "التقارير ولوحات المعلومات", zh: "报告与仪表盘" }, to: "reports", dept: "frep" },
    { uc: "UC-02", label: { en: "Detecting Deviations, Alerts, and Exceptions", ar: "كشف الانحرافات والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" }, to: "alerts" },
  ],
  scope: [
    { k: { en: "Scope", ar: "النطاق", zh: "范围" }, opts: ["Cross-department", "G-02 only", "G-03 only", "G-04 only"] },
    { k: { en: "Period", ar: "الفترة", zh: "期间" }, opts: ["Last 24h", "Last 7d", "This quarter"] },
    { k: { en: "Mode", ar: "الوضع", zh: "模式" }, opts: ["Read-only", "Export (approval)"] },
  ],
  resultsH: { en: "Query, Audit & Permission Results", ar: "نتائج الاستعلام والتدقيق والصلاحيات", zh: "查询、审计与权限结果" },
  resultsSub: { en: "UC-03 outputs · produced by agents", ar: "مخرجات UC-03 · أُنتجت بواسطة الوكلاء", zh: "UC-03 输出 · 由智能体生成" },
  outputs: [
    { l: { en: "Answer Confidence", ar: "ثقة الإجابات", zh: "回答置信度" }, v: "92%", s: { en: "avg across queries · sources cited", ar: "متوسط الاستعلامات · مع المصادر", zh: "查询均值 · 附来源" }, tag: { en: "with lineage", ar: "مع التتبع", zh: "带血缘" }, rows: [
      { k: { en: "≥ 90% confidence", ar: "≥ 90% ثقة", zh: "置信度 ≥90%" }, v: "78%", pct: 78 },
      { k: { en: "70–90%", ar: "70–90%", zh: "70–90%" }, v: "18%", pct: 18 },
      { k: { en: "Escalated to human", ar: "مصعّد للبشر", zh: "升级人工" }, v: "4%", pct: 4 },
    ] },
    { l: { en: "Audit Log (24h)", ar: "سجل التدقيق (24س)", zh: "审计日志(24h)" }, v: "38", s: { en: "queries, exports & approvals", ar: "استعلامات وتصدير واعتمادات", zh: "查询、导出与审批" }, rows: [
      { k: { en: "Queries", ar: "استعلامات", zh: "查询" }, v: "22" },
      { k: { en: "Exports", ar: "تصدير", zh: "导出" }, v: "9" },
      { k: { en: "Approvals", ar: "اعتمادات", zh: "审批" }, v: "7" },
    ] },
    { l: { en: "Events Indexed", ar: "أحداث مفهرسة", zh: "已索引事件" }, v: "28,140", s: { en: "cross-department, permission-scoped", ar: "عبر الإدارات ومحكومة بالصلاحيات", zh: "跨部门 · 按权限隔离" }, rows: [
      { k: { en: "Budget & execution", ar: "الميزانية والتنفيذ", zh: "预算与执行" }, v: "12,940" },
      { k: { en: "Claims & payments", ar: "المطالبات والمدفوعات", zh: "索赔与付款" }, v: "9,320" },
      { k: { en: "Assets & revenue", ar: "الأصول والإيرادات", zh: "资产与收入" }, v: "5,880" },
    ] },
    { l: { en: "Permissioned Exports", ar: "تصدير مصرّح", zh: "授权导出" }, v: "9", s: { en: "queued · human sign-off required", ar: "بالانتظار · يلزم توقيع بشري", zh: "排队中 · 需人工签核" }, rows: [
      { k: { en: "Excel", ar: "إكسل", zh: "Excel" }, v: "6" },
      { k: { en: "PDF", ar: "PDF", zh: "PDF" }, v: "3" },
      { k: { en: "Denied (out of scope)", ar: "مرفوض (خارج النطاق)", zh: "拒绝(越权)" }, v: "2" },
    ] },
  ],
  sources: [{ n: "Unified layer (UC-01)", s: "synced" }, { n: "SAP / Asas", s: "synced" }, { n: "Etimad", s: "synced" }, { n: "Alerts (UC-02)", s: "synced" }, { n: "Role & permission registry", s: "synced" }, { n: "Audit log store", s: "synced" }],
  roles: [
    { name: { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }, sub: { en: "Answers NL questions with sources, confidence & lineage", ar: "يجيب بالمصادر والثقة والتتبع", zh: "自然语言问答,附来源、置信度与血缘" }, status: "running", cls: "r-violet" },
    { name: { en: "Orchestrator Agent", ar: "وكيل المنسّق", zh: "编排器智能体" }, sub: { en: "Enforces permission scopes & routes escalations", ar: "يفرض نطاقات الصلاحيات ويوجّه التصعيد", zh: "执行权限范围并路由升级" }, status: "active", cls: "r-blue" },
    { name: { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "前瞻洞察智能体" }, sub: { en: "Suggests follow-up questions & flags unusual access", ar: "يقترح أسئلة متابعة ويرصد وصولاً غير معتاد", zh: "建议追问并标记异常访问" }, status: "active", cls: "r-blue" },
  ],
  logs: [
    { tm: "10:02", code: "UC-03", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "Indexed 28,140 events across departments", ar: "فهرسة 28,140 حدثاً", zh: "跨部门索引 28,140 个事件" }, dot: "blue" },
    { tm: "10:03", h: { en: "Smart Query", ar: "الاستعلام الذكي", zh: "智能查询" }, d: { en: "AO-2207 approval chain reconstructed · 3 approvers", ar: "إعادة بناء سلسلة AO-2207 · 3 معتمدين", zh: "重建 AO-2207 审批链 · 3 名审批人" }, dot: "blue" },
    { tm: "10:04", h: { en: "Permissions", ar: "الصلاحيات", zh: "权限" }, d: { en: "2 export requests denied — outside role scope", ar: "رفض طلبي تصدير خارج النطاق", zh: "拒绝 2 笔越权导出请求" }, dot: "amber" },
    { tm: "10:05", h: { en: "Audit Log", ar: "سجل التدقيق", zh: "审计日志" }, d: { en: "38 entries in 24h · fully traceable", ar: "38 إدخالاً في 24 ساعة", zh: "24h 内 38 条 · 全程可溯" }, dot: "blue" },
    { tm: "10:06", h: { en: "Orchestrator", ar: "المنسّق", zh: "编排器" }, d: { en: "Awaiting user follow-up question", ar: "بانتظار سؤال متابعة", zh: "等待用户追问" }, dot: "gray" },
  ],
  narr: {
    p: [
      { en: "Smart Query answered 22 questions in the last 24h at 92% average confidence, each with cited sources and lineage back to the unified layer.", ar: "أجاب الاستعلام الذكي عن 22 سؤالاً خلال 24 ساعة بثقة 92%، مع مصادر وتتبع للطبقة الموحّدة.", zh: "过去 24 小时智能查询回答 22 个问题,平均置信度 92%,每个答案均引用来源并血缘回溯至统一数据层。" },
      { en: "Permission enforcement blocked 2 out-of-scope export attempts; 9 permissioned exports await human sign-off, keeping every data release inside the governance gate.", ar: "منع إنفاذ الصلاحيات محاولتي تصدير خارج النطاق؛ و9 عمليات تصدير بانتظار توقيع بشري، فكل إخراج للبيانات يمر بالبوابة.", zh: "权限管控拦截 2 次越权导出;9 笔授权导出等待人工签核——所有数据外发都经过治理关卡。" },
    ],
    recs: [
      { en: "Sign off the 9 queued exports", ar: "توقيع عمليات التصدير التسع", zh: "签核 9 笔排队导出" },
      { en: "Tighten the 2 over-broad role scopes", ar: "تضييق النطاقين الواسعين", zh: "收紧 2 个过宽角色范围" },
      { en: "Review unusual-access flags weekly", ar: "مراجعة إشارات الوصول غير المعتاد أسبوعياً", zh: "每周复查异常访问标记" },
    ],
    src: { en: "Source: unified data layer · Smart-Query agent", ar: "المصدر: الطبقة الموحّدة · وكيل الاستعلام", zh: "来源:统一数据层 · 智能查询智能体" },
  },
  qs: [
    { en: "Who approved the AO-2207 idle surplus?", ar: "من اعتمد فائض AO-2207 الخامل؟", zh: "谁批准了 AO-2207 闲置结余?" },
    { en: "Show all SAP ↔ Etimad differences this quarter", ar: "أظهر كل فروق ساب↔اعتماد هذا الربع", zh: "显示本季度全部 SAP↔Etimad 差异" },
    { en: "What is the basis of this answer (lineage)?", ar: "ما أساس هذه الإجابة (التتبع)؟", zh: "这个答案的依据(血缘)是什么?" },
  ],
  answers: [
    { en: "AO-2207 was approved by 3 officers (Cost Mgmt lead → Finance controller → Directorate sign-off) between 14–18 May; the full chain with timestamps and basis documents is in the audit log. Confidence 95%.", ar: "اعتمد AO-2207 ثلاثة مسؤولين (قائد التكاليف ← المراقب المالي ← توقيع المديرية) بين 14–18 مايو؛ السلسلة الكاملة في سجل التدقيق. الثقة 95%.", zh: "AO-2207 由 3 名审批人先后批准(成本管理负责人 → 财务总监 → 总局签核,5 月 14–18 日);完整链条含时间戳与依据文件在审计日志中。置信度 95%。" },
    { en: "2 open differences this quarter, net SAR 25M: Esnad assignment (+15M) and Tahseel revenue (+10M); both have proposed adjusting entries in UC-09 pending approval. Confidence 93%.", ar: "فرقان مفتوحان هذا الربع بصافي 25 مليوناً: إسناد (+15) وتحصيل (+10)؛ ولكليهما قيود تسوية مقترحة في UC-09. الثقة 93%.", zh: "本季度 2 项未结差异,净 SAR 25M:Esnad 派工(+15M)与 Tahseel 收入(+10M);两者均已在 UC-09 提出调整分录待批。置信度 93%。" },
    { en: "Every answer cites its sources (e.g. SAP/Asas consumption detail + Etimad settlements), the freshness of each feed, and a lineage link from figure to source record — exportable with approval.", ar: "كل إجابة تذكر مصادرها وحداثة كل تغذية ورابط تتبع من الرقم إلى السجل المصدري — قابلة للتصدير بعد الاعتماد.", zh: "每个答案都注明来源(如 SAP/Asas 消费明细 + Etimad 结算)、各数据源新鲜度,以及从数字到源记录的血缘链——审批后可导出。" },
  ],
  genAns: { en: "From UC-03: 28,140 events indexed · 92% avg confidence · 38 audit entries in 24h · all queries permission-scoped with full lineage.", ar: "من UC-03: 28,140 حدثاً · ثقة 92% · 38 إدخال سجل · كل الاستعلامات محكومة بالصلاحيات مع تتبع كامل.", zh: "依据 UC-03:已索引 28,140 事件 · 平均置信度 92% · 24h 审计日志 38 条 · 所有查询受权限约束并带完整血缘。" },
};

/* ---- Bench cfg · UC-07 Budget Planning, Allocation of Ceilings, and Fiscal Space (G-02) ---- */

export { BENCH_UC03 };
