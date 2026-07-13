/* 审计部 — UC-02 异常检测、告警与例外 (G-04 审计部专属工作台).
   对齐财务权益部做法:统一 G-04 审计链路 (g04AuditChainHere)、审计部语境、
   chainHideUc 隐藏链路 UC 前缀。body 沿用 UcBench 标准完整面板。 */
import { g04AuditChainHere } from "../g04AuditChain.js";

const BENCH_UC02_AUD = {
  route: "g04bench02", back: "audwork", dept: "audit", tone: "violet", uc: "UC-02", run: "#1502", chainHideUc: true,
  deptName: { en: "Audit Department", ar: "إدارة التدقيق", zh: "审计部" },
  benchLabel: { en: "Anomaly Detection, Alerts & Exceptions", ar: "كشف الشذوذ والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" },
  subt: { en: "Anomaly Detection, Alerts & Exceptions", ar: "كشف الشذوذ والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" },
  chainLab: { en: "G-04 CHAIN", ar: "سلسلة ج-04", zh: "G-04 链路" },
  chain: g04AuditChainHere("UC-02"),
  agent: { en: "Anomaly Detection agent", ar: "وكيل كشف الشذوذ", zh: "异常检测智能体" },
  summary: { en: "Continuous deviation scanning over the unified layer & reconciliation results — **12 open exceptions** (~~+3 this week~~), of which **2 critical / 4 high**. Top clusters: duplicate vendor invoices, TB account anomalies, and SAP↔Etimad settlement gaps. Each exception carries risk score, owner and suggested corrective action; criticals auto-route to the audit queue.", ar: "مسح انحرافات مستمر فوق الطبقة الموحّدة ونتائج المطابقة — **12 استثناءً مفتوحاً** (~~+3 هذا الأسبوع~~)، منها **2 حرجة / 4 مرتفعة**. أبرز التجمعات: فواتير مورد مكررة، شذوذ حسابات، وفروق تسوية ساب↔اعتماد. كل استثناء يحمل درجة خطر ومسؤولاً وإجراءً مقترحاً؛ والحرجات تُوجَّه آلياً لقائمة التدقيق.", zh: "在统一数据层与对账结果上持续扫描偏差——**12 项未结异常**(~~本周 +3~~),其中**严重 2 / 高 4**。主要簇:重复供应商发票、试算平衡科目异常、SAP↔Etimad 结算差异。每项异常带风险评分、负责人与建议纠正措施;严重项自动路由至审计队列。" },
  recs: [
    { t: { en: "Clear the 2 critical exceptions", ar: "معالجة الاستثناءين الحرجين", zh: "处理 2 项严重异常" }, d: { en: "duplicate invoice INV-55021 · TB account 2310 anomaly", ar: "فاتورة مكررة INV-55021 · شذوذ حساب 2310", zh: "重复发票 INV-55021 · 科目 2310 异常" } },
    { t: { en: "Triage 4 high-risk settlement gaps", ar: "فرز 4 فروق تسوية مرتفعة", zh: "分诊 4 项高风险结算差异" }, d: { en: "SAP↔Etimad net SAR 25M across 2 lines", ar: "صافي ساب↔اعتماد 25 مليوناً في بندين", zh: "SAP↔Etimad 净差 SAR 25M(2 行)" } },
    { t: { en: "Refresh the duplicate-vendor rule", ar: "تحديث قاعدة المورد المكرر", zh: "刷新重复供应商规则" }, d: { en: "new cluster of 19 vendor-master mismatches", ar: "تجمّع جديد لـ 19 تباين بيانات مورد", zh: "新增 19 条供应商主数据不一致簇" } },
  ],
  ctas: [
    { uc: "UC-03", label: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" }, to: "bench03", dept: "audit" },
    { uc: "UC-10", label: { en: "Generating Financial and Administrative Reports and Narrative Commentaries", ar: "التقارير ولوحات المعلومات", zh: "报告与仪表盘" }, to: "g04bench10", dept: "audit" },
  ],
  scope: [
    { k: { en: "Risk", ar: "الخطر", zh: "风险" }, opts: ["All levels", "Critical", "High", "Medium"] },
    { k: { en: "Period", ar: "الفترة", zh: "期间" }, opts: ["This week", "This month", "FY 2026 · Q2"] },
    { k: { en: "Source", ar: "المصدر", zh: "来源" }, opts: ["All sources", "SAP / Asas", "Etimad", "Reconciliation (UC-09)"] },
  ],
  resultsH: { en: "Anomaly & Exception Results", ar: "نتائج الشذوذ والاستثناءات", zh: "异常与例外结果" },
  resultsSub: { en: "异常检测、告警与例外 outputs · produced by agents", ar: "مخرجات 异常检测、告警与例外 · أُنتجت بواسطة الوكلاء", zh: "异常检测、告警与例外 输出 · 由智能体生成" },
  outputs: [
    { l: { en: "Open Exceptions", ar: "استثناءات مفتوحة", zh: "未结异常" }, v: "12", s: { en: "+3 this week · risk-tiered", ar: "+3 هذا الأسبوع · حسب الخطر", zh: "本周 +3 · 按风险分层" }, tag: { en: "2 critical", ar: "2 حرجة", zh: "严重 2" }, rows: [
      { k: { en: "Critical", ar: "حرجة", zh: "严重" }, v: "2" },
      { k: { en: "High", ar: "مرتفعة", zh: "高" }, v: "4" },
      { k: { en: "Medium", ar: "متوسطة", zh: "中" }, v: "6" },
    ] },
    { l: { en: "Top Deviation Clusters", ar: "تجمعات الانحراف", zh: "主要偏差簇" }, v: "3", s: { en: "recurring root causes", ar: "أسباب جذرية متكررة", zh: "反复出现的根因" }, rows: [
      { k: { en: "Duplicate vendor invoices", ar: "فواتير مورد مكررة", zh: "重复供应商发票" }, v: "5" },
      { k: { en: "TB account anomalies", ar: "شذوذ حسابات", zh: "试算平衡科目异常" }, v: "4" },
      { k: { en: "SAP↔Etimad gaps", ar: "فروق ساب↔اعتماد", zh: "SAP↔Etimad 差异" }, v: "3" },
    ] },
    { l: { en: "Avg Closure Time", ar: "متوسط زمن الإغلاق", zh: "平均结案时长" }, v: "8 d", s: { en: "−1 QoQ · target < 5", ar: "−1 ربعياً · الهدف < 5", zh: "环比 −1 · 目标 <5" }, rows: [
      { k: { en: "Critical (SLA 2d)", ar: "حرجة (2 يوم)", zh: "严重(SLA 2天)" }, v: "1.8 d" },
      { k: { en: "High (SLA 5d)", ar: "مرتفعة (5 أيام)", zh: "高(SLA 5天)" }, v: "6 d" },
      { k: { en: "Overdue (> 5d)", ar: "متأخرة (> 5)", zh: "超期(>5天)" }, v: "3" },
    ] },
    { l: { en: "Routed to Audit Queue", ar: "مُوجَّه لقائمة التدقيق", zh: "已路由至审计队列" }, v: "2", s: { en: "criticals auto-escalated", ar: "الحرجات مُصعّدة آلياً", zh: "严重项自动升级" }, rows: [
      { k: { en: "CLM-7731 · evidence gap", ar: "CLM-7731 · نقص أدلة", zh: "CLM-7731 · 缺证据" }, v: "1" },
      { k: { en: "INV-55021 · duplicate", ar: "INV-55021 · مكررة", zh: "INV-55021 · 重复" }, v: "1" },
    ] },
  ],
  sources: [{ n: "Unified layer (UC-01)", s: "synced" }, { n: "SAP / Asas", s: "synced" }, { n: "Etimad", s: "synced" }, { n: "Reconciliation (UC-09)", s: "synced" }, { n: "Contracts & claims (UC-08)", s: "synced" }, { n: "Rule & threshold registry", s: "synced" }],
  roles: [
    { name: { en: "Anomaly Detection Agent", ar: "وكيل كشف الشذوذ", zh: "异常检测智能体" }, sub: { en: "Scans for deviations & risk-scores every exception", ar: "يمسح الانحرافات ويقيّم الخطر", zh: "扫描偏差并为每项异常评分" }, status: "running", cls: "r-violet" },
    { name: { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "主动洞察智能体" }, sub: { en: "Surfaces recurring root causes & trend shifts", ar: "يكشف الأسباب الجذرية المتكررة", zh: "揭示反复根因与趋势变化" }, status: "active", cls: "r-blue" },
    { name: { en: "Orchestrator Agent", ar: "وكيل المنسّق", zh: "编排器智能体" }, sub: { en: "Routes criticals to the audit queue with owners", ar: "يوجّه الحرجة لقائمة التدقيق", zh: "将严重项路由至审计队列并指派" }, status: "active", cls: "r-blue" },
  ],
  logs: [
    { tm: "10:02", code: "UC-02", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "Scanned unified layer · 412k records", ar: "مسح الطبقة الموحّدة · 412 ألف سجل", zh: "扫描统一层 · 41.2 万条" }, dot: "blue" },
    { tm: "10:03", h: { en: "Deviation", ar: "انحراف", zh: "偏差" }, d: { en: "INV-55021 duplicate flagged · vendor 700412", ar: "تكرار INV-55021 · مورد 700412", zh: "标记重复 INV-55021 · 供应商 700412" }, dot: "blue" },
    { tm: "10:04", h: { en: "Risk Tier", ar: "درجة الخطر", zh: "风险分层" }, d: { en: "2 critical · 4 high · auto-owner assigned", ar: "2 حرجة · 4 مرتفعة · تعيين آلي", zh: "严重 2 · 高 4 · 已自动指派" }, dot: "amber" },
    { tm: "10:05", h: { en: "Escalation", ar: "تصعيد", zh: "升级" }, d: { en: "Criticals routed to audit queue (UC-03)", ar: "الحرجة لقائمة التدقيق (UC-03)", zh: "严重项路由至审计队列(UC-03)" }, dot: "blue" },
    { tm: "10:06", h: { en: "Orchestrator", ar: "المنسّق", zh: "编排器" }, d: { en: "Awaiting reviewer triage on 4 high-risk gaps", ar: "بانتظار فرز 4 فروق مرتفعة", zh: "等待审核人分诊 4 项高风险差异" }, dot: "gray" },
  ],
  narr: {
    p: [
      { en: "Anomaly detection swept the unified layer and reconciliation results this period, surfacing 12 open exceptions (+3 week-on-week) — 2 critical and 4 high-risk.", ar: "مسح كشف الشذوذ الطبقة الموحّدة ونتائج المطابقة هذا الأسبوع، فكشف 12 استثناءً مفتوحاً (+3 أسبوعياً) — حرجان و4 مرتفعة.", zh: "本期异常检测扫描了统一数据层与对账结果,共暴露 12 项未结异常(周环比 +3)——严重 2、高风险 4。" },
      { en: "Both criticals were auto-routed to the audit queue with owners; the largest cluster is a recurring duplicate-vendor-invoice pattern (19 master-data mismatches) that needs a rule refresh.", ar: "حُوّلت الحرجة آلياً لقائمة التدقيق مع مسؤولين؛ وأكبر تجمّع نمط فواتير مورد مكررة (19 تباين بيانات) يحتاج تحديث قاعدة.", zh: "两项严重异常已自动路由至审计队列并指派负责人;最大簇是反复出现的重复供应商发票模式(19 条主数据不一致),需刷新检测规则。" },
    ],
    recs: [
      { en: "Clear the 2 critical exceptions before close", ar: "معالجة الاستثناءين الحرجين قبل الإغلاق", zh: "关账前处理 2 项严重异常" },
      { en: "Triage the 4 high-risk settlement gaps", ar: "فرز 4 فروق التسوية المرتفعة", zh: "分诊 4 项高风险结算差异" },
      { en: "Refresh the duplicate-vendor detection rule", ar: "تحديث قاعدة كشف المورد المكرر", zh: "刷新重复供应商检测规则" },
    ],
    src: { en: "Source: unified layer + reconciliation · Anomaly Detection agent", ar: "المصدر: الطبقة الموحّدة والمطابقة · وكيل كشف الشذوذ", zh: "来源:统一数据层 + 对账 · 异常检测智能体" },
  },
  qs: [
    { en: "What are today's critical exceptions?", ar: "ما الاستثناءات الحرجة اليوم؟", zh: "今天有哪些严重异常?" },
    { en: "Which deviation clusters recur most?", ar: "ما أكثر تجمعات الانحراف تكراراً؟", zh: "哪些偏差簇反复出现最多?" },
    { en: "Show all SAP↔Etimad gaps this quarter", ar: "أظهر فروق ساب↔اعتماد هذا الربع", zh: "显示本季度全部 SAP↔Etimad 差异" },
  ],
  answers: [
    { en: "2 critical: a suspected duplicate invoice (INV-55021, vendor 700412) and an abnormal TB entry (account 2310) — both routed to the audit queue with owners assigned. Confidence 95%.", ar: "حرجان: فاتورة مكررة مشتبهة (INV-55021، مورد 700412) وقيد شاذ (حساب 2310) — كلاهما في قائمة التدقيق. الثقة 95%.", zh: "2 项严重:疑似重复发票(INV-55021,供应商 700412)与试算平衡异常分录(科目 2310)——均已进入审计队列并指派负责人。置信度 95%。" },
    { en: "Three recurring clusters: duplicate vendor invoices (5), TB account anomalies (4) and SAP↔Etimad settlement gaps (3) — together ~92% of open exceptions; the duplicate pattern traces to 19 stale vendor-master records.", ar: "ثلاثة تجمعات: فواتير مورد مكررة (5) وشذوذ حسابات (4) وفروق تسوية (3) — نحو 92% من الاستثناءات؛ والنمط المكرر يعود لـ 19 سجل مورد.", zh: "3 个反复簇:重复供应商发票(5)、试算平衡科目异常(4)、SAP↔Etimad 结算差异(3)——合计约占未结异常 92%;重复模式可追溯至 19 条陈旧供应商主数据。" },
    { en: "2 open differences this quarter, net SAR 25M: Esnad assignment (+15M) and Tahseel revenue (+10M); both have proposed adjusting entries in UC-09 pending approval. Confidence 93%.", ar: "فرقان مفتوحان بصافي 25 مليوناً: إسناد (+15) وتحصيل (+10)؛ ولكليهما قيود تسوية مقترحة في UC-09. الثقة 93%.", zh: "本季度 2 项未结差异,净 SAR 25M:Esnad 派工(+15M)与 Tahseel 收入(+10M);两者均已在 UC-09 提出调整分录待批。置信度 93%。" },
  ],
  genAns: { en: "From UC-02: 12 open exceptions (2 critical · 4 high) · 3 recurring clusters · criticals auto-routed to the audit queue.", ar: "من UC-02: 12 استثناءً (2 حرجة · 4 مرتفعة) · 3 تجمعات متكررة · الحرجة مُوجَّهة آلياً.", zh: "依据 UC-02:未结异常 12(严重 2 · 高 4)· 反复簇 3 · 严重项已自动路由至审计队列。" },
};

export { BENCH_UC02_AUD };
