/* 审计部 — UC-10 报告与仪表盘 (G-04 审计部专属工作台).
   对齐财务权益部做法:统一 G-04 审计链路 (g04AuditChainHere)、审计部语境、
   chainHideUc 隐藏链路 UC 前缀。body 沿用 UcBench 标准完整面板。 */
import { g04AuditChainHere } from "../g04AuditChain.js";

const BENCH_UC10_AUD = {
  route: "g04bench10", back: "audwork", dept: "audit", tone: "violet", uc: "UC-10", run: "#1510", chainHideUc: true,
  deptName: { en: "Audit Department", ar: "إدارة التدقيق", zh: "审计部" },
  benchLabel: { en: "Generating Financial and Administrative Reports and Narrative Commentaries", ar: "التقارير المالية والإدارية والتعليق السردي", zh: "报告与仪表盘" },
  subt: { en: "Generating Financial and Administrative Reports and Narrative Commentaries", ar: "التقارير المالية والإدارية والتعليق السردي", zh: "报告与仪表盘" },
  chainLab: { en: "G-04 CHAIN", ar: "سلسلة ج-04", zh: "G-04 链路" },
  chain: g04AuditChainHere("UC-10"),
  agent: { en: "Financial Reports Gen. agent", ar: "وكيل توليد التقارير المالية", zh: "财务报告生成智能体" },
  summary: { en: "Consolidated audit reporting & dashboards for leadership — **paid / approved-unpaid / no-liquidity** payment status surfaced directly from Etimad, plus a weekly plan-vs-actual view by Vision portfolio. **4 board packs** auto-assembled this period with Arabic narrative commentaries; every figure is lineage-traceable and exception-linked back to UC-02.", ar: "تقارير ولوحات تدقيق موحّدة للقيادة — حالة الدفع **مدفوع / معتمد غير مدفوع / بلا سيولة** من اعتماد مباشرةً، مع رؤية أسبوعية للخطة مقابل الفعلي حسب محافظ الرؤية. **4 حزم مجلس** جُمّعت آلياً هذا الأسبوع بتعليقات عربية سردية؛ وكل رقم قابل للتتبع ومربوط بالاستثناءات في UC-02.", zh: "面向领导的合并审计报告与仪表盘——直接从 Etimad 提取**已付 / 已批未付 / 无流动性**支付状态,并按 Vision 组合呈现周度计划vs实际。本期自动汇编**4 份董事会材料**,附阿语叙述评述;每个数字均可血缘追溯,并与 UC-02 的异常相互关联。" },
  recs: [
    { t: { en: "Publish the weekly leadership pack", ar: "نشر حزمة القيادة الأسبوعية", zh: "发布本周领导汇报包" }, d: { en: "paid / approved-unpaid / no-liquidity + top exceptions", ar: "مدفوع / معتمد غير مدفوع / بلا سيولة + أبرز الاستثناءات", zh: "已付/已批未付/无流动性 + 主要异常" } },
    { t: { en: "Refresh the plan-vs-actual dashboard", ar: "تحديث لوحة الخطة مقابل الفعلي", zh: "刷新计划vs实际仪表盘" }, d: { en: "by Vision portfolio · variance 18% annotated", ar: "حسب محافظ الرؤية · انحراف 18% موضّح", zh: "按 Vision 组合 · 标注 18% 偏差" } },
    { t: { en: "Sign off 3 queued narrative exports", ar: "اعتماد 3 تصديرات سردية", zh: "签核 3 份叙述评述导出" }, d: { en: "Arabic commentary packs awaiting approval", ar: "حزم تعليق عربية بانتظار الاعتماد", zh: "阿语评述包待批" } },
  ],
  ctas: [
    { uc: "UC-02", label: { en: "Detecting Deviations, Alerts, and Exceptions", ar: "كشف الانحرافات والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" }, to: "g04bench02", dept: "audit" },
    { uc: "UC-03", label: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" }, to: "bench03", dept: "audit" },
  ],
  scope: [
    { k: { en: "Report", ar: "التقرير", zh: "报表" }, opts: ["Leadership pack", "Plan vs Actual", "Payment status", "Exception digest"] },
    { k: { en: "Portfolio", ar: "المحفظة", zh: "组合" }, opts: ["All Vision portfolios", "Housing", "Municipal"] },
    { k: { en: "Period", ar: "الفترة", zh: "期间" }, opts: ["This week", "This month", "FY 2026 · Q2"] },
  ],
  resultsH: { en: "Reports & Dashboard Results", ar: "نتائج التقارير واللوحات", zh: "报告与仪表盘结果" },
  resultsSub: { en: "报告与仪表盘 outputs · produced by agents", ar: "مخرجات 报告与仪表盘 · أُنتجت بواسطة الوكلاء", zh: "报告与仪表盘 输出 · 由智能体生成" },
  outputs: [
    { l: { en: "Payment Status (Etimad)", ar: "حالة الدفع (اعتماد)", zh: "支付状态(Etimad)" }, v: "92", s: { en: "claims this period", ar: "مطالبات هذه الفترة", zh: "本期索赔笔数" }, rows: [
      { k: { en: "Paid", ar: "مدفوع", zh: "已付" }, v: "61", pct: 66 },
      { k: { en: "Approved · unpaid", ar: "معتمد · غير مدفوع", zh: "已批未付" }, v: "22", pct: 24 },
      { k: { en: "No liquidity", ar: "بلا سيولة", zh: "无流动性" }, v: "9", pct: 10 },
    ] },
    { l: { en: "Plan vs Actual Variance", ar: "انحراف الخطة عن الفعلي", zh: "计划vs实际偏差" }, v: "18%", s: { en: "by Vision portfolio", ar: "حسب محافظ الرؤية", zh: "按 Vision 组合" }, tag: { en: "top: housing", ar: "الأعلى: إسكان", zh: "最高:住房" }, rows: [
      { k: { en: "Housing", ar: "إسكان", zh: "住房" }, v: "24%", pct: 24 },
      { k: { en: "Municipal", ar: "بلدي", zh: "市政" }, v: "15%", pct: 15 },
      { k: { en: "Other", ar: "أخرى", zh: "其他" }, v: "11%", pct: 11 },
    ] },
    { l: { en: "Board Packs Assembled", ar: "حزم مجلس", zh: "董事会材料" }, v: "4", s: { en: "auto-generated · Arabic narrative", ar: "آلي · سرد عربي", zh: "自动生成 · 阿语叙述" }, rows: [
      { k: { en: "Signed off", ar: "معتمدة", zh: "已签发" }, v: "1" },
      { k: { en: "Pending approval", ar: "بانتظار الاعتماد", zh: "待批" }, v: "3" },
    ] },
    { l: { en: "Exception Linkage", ar: "ربط الاستثناءات", zh: "异常关联" }, v: "100%", s: { en: "figures → UC-02 exception traceable", ar: "الرقم ← استثناء UC-02 قابل للتتبع", zh: "数字 → UC-02 异常可追溯" }, rows: [
      { k: { en: "Linked to UC-02", ar: "مربوط بـ UC-02", zh: "关联 UC-02" }, v: "12" },
      { k: { en: "Cited in narrative", ar: "مُستشهد به", zh: "评述引用" }, v: "9" },
    ] },
  ],
  sources: [{ n: "Unified layer (UC-01)", s: "synced" }, { n: "Etimad payment status", s: "synced" }, { n: "SAP / Asas execution", s: "synced" }, { n: "Exceptions (UC-02)", s: "synced" }, { n: "Reconciliation (UC-09)", s: "synced" }, { n: "Vision-portfolio PPT", s: "synced" }],
  roles: [
    { name: { en: "Financial Reports Gen. Agent", ar: "وكيل توليد التقارير المالية", zh: "财务报告生成智能体" }, sub: { en: "Assembles board packs & dashboards with lineage", ar: "يجمع حزم المجالس واللوحات مع التتبع", zh: "汇编董事会材料与仪表盘(带血缘)" }, status: "running", cls: "r-violet" },
    { name: { en: "Narrative Commentary Agent", ar: "وكيل التعليق السردي", zh: "叙述评述智能体" }, sub: { en: "Drafts Arabic commentary explaining variances", ar: "يصوغ تعليقاً عربياً يشرح الانحرافات", zh: "起草阿语评述,解释偏差" }, status: "active", cls: "r-blue" },
    { name: { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }, sub: { en: "Feeds cited, lineage-tagged figures into reports", ar: "يغذّي التقارير بأرقام موثقة", zh: "为报告提供带引用与血缘的数字" }, status: "active", cls: "r-blue" },
  ],
  logs: [
    { tm: "10:02", code: "UC-10", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "Pulled Etimad payment status · 92 claims", ar: "حالة دفع اعتماد · 92 مطالبة", zh: "拉取 Etimad 支付状态 · 92 笔" }, dot: "blue" },
    { tm: "10:03", h: { en: "Dashboard", ar: "لوحة", zh: "仪表盘" }, d: { en: "Plan-vs-actual refreshed · variance 18% (housing 24%)", ar: "تحديث الخطة مقابل الفعلي · انحراف 18%", zh: "刷新计划vs实际 · 偏差 18%(住房 24%)" }, dot: "blue" },
    { tm: "10:04", h: { en: "Narrative", ar: "سرد", zh: "叙述" }, d: { en: "Arabic commentary drafted · 9 exceptions cited", ar: "تعليق عربي · استشهاد 9 استثناءات", zh: "阿语评述已起草 · 引用 9 项异常" }, dot: "blue" },
    { tm: "10:05", h: { en: "Board Pack", ar: "حزمة مجلس", zh: "董事会材料" }, d: { en: "4 packs assembled · 3 pending sign-off", ar: "4 حزم · 3 بانتظار الاعتماد", zh: "汇编 4 份 · 3 份待签" }, dot: "amber" },
    { tm: "10:06", h: { en: "Orchestrator", ar: "المنسّق", zh: "编排器" }, d: { en: "Linked every figure → UC-02 exception", ar: "ربط كل رقم باستثناء UC-02", zh: "每个数字均已关联 UC-02 异常" }, dot: "gray" },
  ],
  narr: {
    p: [
      { en: "This period's leadership pack consolidates Etimad payment status (92 claims: 61 paid · 22 approved-unpaid · 9 no-liquidity) alongside a Vision-portfolio plan-vs-actual view at 18% variance.", ar: "تجمع حزمة القيادة حالة دفع اعتماد (92 مطالبة: 61 مدفوعة · 22 معتمدة غير مدفوعة · 9 بلا سيولة) مع رؤية الخطة مقابل الفعلي بانحراف 18%.", zh: "本期领导汇报包合并了 Etimad 支付状态(92 笔:已付 61 · 已批未付 22 · 无流动性 9)与按 Vision 组合的计划vs实际视图(偏差 18%)。" },
      { en: "Four board packs were auto-assembled with Arabic narrative commentaries; every reported figure is lineage-traceable and linked back to its UC-02 exception, so leadership can drill from any number to the underlying anomaly.", ar: "جُمّعت 4 حزم مجلس بتعليقات عربية؛ وكل رقم قابل للتتبع ومربوط باستثناء UC-02، فيستطيع القائد التنقيب من أي رقم إلى الشذوذ الأصلي.", zh: "4 份董事会材料自动汇编并附阿语叙述评述;每个上报数字均可血缘追溯并关联至对应的 UC-02 异常,领导可从任一数字下钻到底层异常。" },
    ],
    recs: [
      { en: "Publish the weekly leadership pack", ar: "نشر حزمة القيادة الأسبوعية", zh: "发布本周领导汇报包" },
      { en: "Sign off the 3 queued narrative exports", ar: "اعتماد 3 تصديرات سردية", zh: "签核 3 份待批叙述导出" },
      { en: "Annotate the 24% housing variance for the board", ar: "توضيح انحراف الإسكان 24% للمجلس", zh: "为董事会标注 24% 住房偏差" },
    ],
    src: { en: "Source: Etimad + unified layer · Financial Reports Gen. agent", ar: "المصدر: اعتماد والطبقة الموحّدة · وكيل التقارير", zh: "来源:Etimad + 统一数据层 · 报告生成智能体" },
  },
  qs: [
    { en: "What is the paid / approved-unpaid / no-liquidity split?", ar: "ما توزيع المدفوع / المعتمد غير المدفوع / بلا سيولة؟", zh: "已付/已批未付/无流动性各多少?" },
    { en: "Which portfolio has the largest plan-vs-actual variance?", ar: "ما المحفظة الأعلى انحرافاً؟", zh: "哪个组合的计划vs实际偏差最大?" },
    { en: "Trace a board-pack figure to its UC-02 exception", ar: "تتبّع رقم الحزمة لاستثنائه في UC-02", zh: "把董事会材料里的某数字追溯至 UC-02 异常" },
  ],
  answers: [
    { en: "Of 92 claims this period: 61 paid (66%), 22 approved-unpaid (24%), and 9 with no liquidity (10%) — the 9 no-liquidity claims map to 2 budget lines already flagged for transfer in UC-08. Confidence 96%.", ar: "من 92 مطالبة: 61 مدفوعة (66%)، 22 معتمدة غير مدفوعة (24%)، و9 بلا سيولة (10%) — وتعيين الـ9 لبندين طُلب لهما مناقلة في UC-08. الثقة 96%.", zh: "本期 92 笔中:已付 61(66%)、已批未付 22(24%)、无流动性 9(10%)——9 笔无流动性对应 UC-08 已申请转移的 2 条预算行。置信度 96%。" },
    { en: "Housing-infrastructure shows the largest variance at 24% (vs 15% municipal, 11% other); Amanat templates under-planned Q3 housing spend, driving most of the gap. Confidence 94%.", ar: "بنية الإسكان الأعلى بانحراف 24% (بلدي 15%، أخرى 11%)؛ قوالب الأمانات قللت تقدير الإسكان في الربع الثالث. الثقة 94%.", zh: "住房基础设施偏差最大,达 24%(市政 15%、其他 11%);阿玛纳模版低估了 Q3 住房支出,贡献了大部分缺口。置信度 94%。" },
    { en: "Every board-pack figure carries a lineage link to its source record and — where it reflects an anomaly — to the matching UC-02 exception (e.g. the SAR 25M settlement gap → 2 open differences). Confidence 95%.", ar: "كل رقم يحمل رابط تتبع لمصدره وللاستثناء المطابق في UC-02 عند وجود شذوذ (مثل فجوة 25 مليوناً → فرقان). الثقة 95%.", zh: "每个董事会材料数字都带血缘链至源记录,若涉及异常则关联对应 UC-02 异常(如 SAR 25M 结算缺口 → 2 项未结差异)。置信度 95%。" },
  ],
  genAns: { en: "From UC-10: 92 claims (61 paid · 22 approved-unpaid · 9 no-liquidity) · 18% plan-vs-actual variance · 4 board packs with Arabic narrative, all lineage-linked to UC-02.", ar: "من UC-10: 92 مطالبة (61 مدفوعة · 22 معتمدة · 9 بلا سيولة) · انحراف 18% · 4 حزم مجلس بسرديات عربية مربوط بـ UC-02.", zh: "依据 UC-10:92 笔索赔(已付 61 · 已批未付 22 · 无流动性 9)· 计划vs实际偏差 18% · 4 份董事会材料(阿语叙述)均血缘关联 UC-02。" },
};

export { BENCH_UC10_AUD };
