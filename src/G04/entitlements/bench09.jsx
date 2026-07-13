/* 财务权益部 — UC-09 财务关账、对账与结算 (G-04 专属工作台).
   完整复制自 src/App.jsx 中的 BENCH_UC09(原 G-05 共用),改为 G-04 部门语境:
   - route 改为 "g04bench09",back 改为 "entwork"(返回权益部门广场)
   - deptName 改为 G-04 部门名
   - chain/chainLab/chainHideUc 改为 G-04 统一链路
   - 复制 summary/recs/ctas/scope/outputs/sources/roles/logs/narr/qs/answers/genAns
     等所有业务数据,与原版保持一致(G-04 工作台只换链路与归属)。
   G-05 共用版(BENCH_UC09)保留在 src/App.jsx 不动,两者完全独立。 */
import { g04ChainHere } from "../g04Chain.js";

const BENCH_UC09 = {
  route: "g04bench09", back: "entwork", dept: "entitle", tone: "violet", uc: "UC-09", run: "#9027", tool: "uc09", chainHideUc: true,
  deptName: { en: "Financial Entitlements Department", ar: "إدارة الاستحقاقات المالية", zh: "财务权益部" },
  benchLabel: { en: "Financial Closing, Reconciliation and Settlements", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与结算" },
  subt: { en: "Financial Closing, Reconciliation and Settlements", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与结算" },
  chainLab: { en: "G-04 CHAIN", ar: "سلسلة ج-04", zh: "G-04 链路" },
  chain: g04ChainHere("UC-09"),
  agent: { en: "Accounting agent", ar: "وكيل المحاسبة", zh: "会计智能体" },
  summary: { en: "Q2 close is **82% complete** (9 of 11 checklist items) with **1 day** to the deadline. Reconciliation runs at **98%** — SAP ↔ Etimad net difference ~~SAR 25M~~ across 2 items (Esnad assignment +15M · Tahseel revenue +10M); **2 adjusting entries** are drafted, IPSAS-validated (UC-11) and awaiting approval.", ar: "إقفال الربع الثاني **مكتمل 82%** (9 من 11 بنداً) ويتبقى **يوم واحد**. المطابقة **98%** — فرق ساب ↔ اعتماد الصافي ~~25 مليوناً~~ في بندين (إسناد +15 · تحصيل +10)؛ وصيغ **قيدا تسوية** متوافقان مع IPSAS بانتظار الاعتماد.", zh: "Q2 关账**完成 82%**(清单 11 项中的 9 项),距截止 **1 天**。对账率 **98%**——SAP↔Etimad 净差异 ~~SAR 25M~~ 共 2 项(Esnad 派工 +15M · Tahseel 收入 +10M);**2 项调整分录**已起草并通过 IPSAS 校验(UC-11),等待审批。" },
  recs: [
    { t: { en: "Post the 2 adjusting entries", ar: "ترحيل قيدي التسوية", zh: "过账 2 项调整分录" }, d: { en: "clears the SAR 25M gap · memo & legal basis attached", ar: "يغلق فرق 25 مليوناً · مع المذكرة والأساس", zh: "清除 SAR 25M 差异 · 已附备忘与法律依据" } },
    { t: { en: "Close the last 2 checklist items", ar: "إغلاق آخر بندين", zh: "关闭最后 2 项清单" }, d: { en: "bank confirmation + accruals cutoff review", ar: "تأكيد بنكي + مراجعة الاستحقاقات", zh: "银行询证 + 应计截止复核" } },
    { t: { en: "Pre-stage UC-10 statements", ar: "تجهيز قوائم UC-10 مسبقاً", zh: "预生成 UC-10 报表" }, d: { en: "monthly tables & final account render on approval", ar: "الجداول والحساب الختامي عند الاعتماد", zh: "月度表与决算账户在批准后即出" } },
  ],
  ctas: [
    { uc: "UC-11", label: { en: "Compliance, Policies & Accounting Memos", ar: "الامتثال والسياسات والمذكرات المحاسبية", zh: "合规、政策与会计备忘录" }, to: "compmemo", dept: "comp" },
    { uc: "UC-10", label: { en: "Generating Financial and Administrative Reports and Narrative Commentaries", ar: "التقارير ولوحات المعلومات", zh: "报告与仪表盘" }, to: "g04reports", dept: "entitle" },
  ],
  scope: [
    { k: { en: "Period", ar: "الفترة", zh: "期间" }, opts: ["FY 2026 · Q2", "FY 2026 · Q1", "FY 2025 · Q4"] },
    { k: { en: "Pair", ar: "الزوج", zh: "对账对" }, opts: ["SAP ↔ Etimad", "SAP ↔ Esnad", "SAP ↔ Tahseel", "Banks"] },
    { k: { en: "Materiality", ar: "الأهمية", zh: "重要性" }, opts: ["All items", "> SAR 5M", "Within tolerance"] },
  ],
  resultsH: { en: "Closing & Reconciliation Results", ar: "نتائج الإقفال والمطابقة", zh: "关账与对账结果" },
  resultsSub: { en: "财务关账、对账与结算 outputs · produced by agents", ar: "مخرجات 财务关账、对账与结算 · أُنتجت بواسطة الوكلاء", zh: "财务关账、对账与结算 输出 · 由智能体生成" },
  outputs: [
    { l: { en: "Pre-Close Checklist", ar: "قائمة ما قبل الإقفال", zh: "关账前清单" }, v: "82%", s: { en: "9 of 11 items complete · 1 day left", ar: "9 من 11 · يتبقى يوم", zh: "11 项完成 9 项 · 剩 1 天" }, tag: { en: "on track", ar: "على المسار", zh: "进度正常" }, rows: [
      { k: { en: "Subledgers closed", ar: "الدفاتر الفرعية", zh: "明细账关闭" }, v: "✓" },
      { k: { en: "Bank confirmation", ar: "تأكيد بنكي", zh: "银行询证" }, v: "pending" },
      { k: { en: "Accruals cutoff", ar: "قطع الاستحقاقات", zh: "应计截止" }, v: "pending" },
    ] },
    { l: { en: "Reconciliation", ar: "المطابقة", zh: "对账" }, v: "98%", s: { en: "SAP ↔ Etimad matched · 2 diffs open", ar: "ساب ↔ اعتماد · فرقان", zh: "SAP↔Etimad 匹配 · 2 项差异" }, rows: [
      { k: { en: "Esnad assignment", ar: "إسناد", zh: "Esnad 派工" }, v: "+SAR 15M", pct: 60 },
      { k: { en: "Tahseel revenue", ar: "إيراد تحصيل", zh: "Tahseel 收入" }, v: "+SAR 10M", pct: 40 },
      { k: { en: "Bank fees (auto)", ar: "رسوم بنكية (تلقائي)", zh: "银行费(自动)" }, v: "SAR 0.4M" },
    ] },
    { l: { en: "Proposed Settlements", ar: "التسويات المقترحة", zh: "建议结算/分录" }, v: "2", s: { en: "entries drafted · IPSAS-validated", ar: "قيود مصاغة · متوافقة IPSAS", zh: "分录已起草 · IPSAS 已校验" }, rows: [
      { k: { en: "Adjusting entries", ar: "قيود تسوية", zh: "调整分录" }, v: "2" },
      { k: { en: "Accounting memo (UC-11)", ar: "مذكرة محاسبية", zh: "会计备忘(UC-11)" }, v: "1" },
      { k: { en: "Human approval", ar: "اعتماد بشري", zh: "人工审批" }, v: "pending" },
    ] },
  ],
  sources: [{ n: "SAP / Asas ledgers", s: "synced" }, { n: "Etimad settlements", s: "synced" }, { n: "Esnad assignments", s: "synced" }, { n: "Tahseel revenue", s: "loading" }, { n: "Bank statements", s: "synced" }, { n: "Accounting rules (IPSAS)", s: "synced" }],
  roles: [
    { name: { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "主动洞察智能体" }, sub: { en: "Flags reconciliation gaps & settlement exceptions", ar: "يرصد فروق المطابقة واستثناءات التسوية", zh: "标记对账差异与结算例外" }, status: "running", cls: "r-violet" },
    { name: { en: "Financial Reports Generation Agent", ar: "وكيل توليد التقارير", zh: "财务报告生成智能体" }, sub: { en: "Runs the close checklist & drafts settlements", ar: "يشغّل قائمة الإقفال ويصوغ التسويات", zh: "执行关账清单并起草结算" }, status: "active", cls: "r-blue" },
    { name: { en: "Compliance / Rules Agent", ar: "وكيل الامتثال / القواعد", zh: "合规/规则智能体" }, sub: { en: "Validates entries against IPSAS & local policy", ar: "يتحقق من القيود وفق IPSAS والسياسات", zh: "按 IPSAS 与本地政策校验分录" }, status: "active", cls: "r-blue" },
  ],
  logs: [
    { tm: "10:02", code: "UC-01", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "SAP & Etimad balances loaded · Q2 cutoff applied", ar: "تحميل أرصدة ساب واعتماد · قطع الربع الثاني", zh: "载入 SAP 与 Etimad 余额 · 应用 Q2 截止" }, dot: "blue" },
    { tm: "10:03", code: "UC-09", h: { en: "Reconciliation", ar: "المطابقة", zh: "对账" }, d: { en: "98% matched · Esnad +15M · Tahseel +10M open", ar: "98% مطابق · إسناد +15 · تحصيل +10", zh: "匹配 98% · Esnad +15M · Tahseel +10M 未结" }, dot: "amber" },
    { tm: "10:04", code: "UC-11", h: { en: "Policy Check", ar: "فحص السياسات", zh: "政策校验" }, d: { en: "2 entries IPSAS-compliant · memo attached", ar: "قيدان متوافقان · مذكرة مرفقة", zh: "2 分录符合 IPSAS · 已附备忘" }, dot: "blue" },
    { tm: "10:05", h: { en: "Checklist", ar: "القائمة", zh: "清单" }, d: { en: "9/11 complete · bank confirmation pending", ar: "9/11 مكتمل · التأكيد البنكي معلّق", zh: "完成 9/11 · 银行询证待办" }, dot: "blue" },
    { tm: "10:06", h: { en: "Orchestrator", ar: "المنسّق", zh: "编排器" }, d: { en: "Entries await accounting approval", ar: "القيود بانتظار اعتماد المحاسبة", zh: "分录等待会计审批" }, dot: "gray" },
  ],
  narr: {
    p: [
      { en: "The Q2 close is on track: 9 of 11 checklist items are done with one day to deadline; only the bank confirmation and accruals cutoff remain.", ar: "إقفال الربع الثاني على المسار: أُنجز 9 من 11 بنداً ويتبقى يوم؛ ولم يبقَ سوى التأكيد البنكي وقطع الاستحقاقات.", zh: "Q2 关账进度正常:11 项清单已完成 9 项,距截止 1 天;仅剩银行询证与应计截止两项。" },
      { en: "Reconciliation matched 98% automatically. The SAR 25M net difference is fully explained (Esnad assignment +15M, Tahseel revenue +10M) and the two IPSAS-validated adjusting entries clear it once approved.", ar: "طابقت التسوية 98% آلياً. وفرق 25 مليوناً مفسَّر بالكامل (إسناد +15، تحصيل +10) ويغلقه قيدا التسوية المتوافقان فور الاعتماد.", zh: "对账自动匹配 98%。SAR 25M 净差异已完全解释(Esnad 派工 +15M、Tahseel 收入 +10M),两项经 IPSAS 校验的调整分录批准后即可清除。" },
    ],
    recs: [
      { en: "Approve & post the 2 adjusting entries", ar: "اعتماد وترحيل قيدي التسوية", zh: "批准并过账 2 项调整分录" },
      { en: "Chase the bank confirmation today", ar: "متابعة التأكيد البنكي اليوم", zh: "今日催办银行询证" },
      { en: "Trigger UC-10 statements on close", ar: "تفعيل قوائم UC-10 عند الإقفال", zh: "关账后即触发 UC-10 报表" },
    ],
    src: { en: "Source: SAP + Etimad + banks · Reports Generation Agent", ar: "المصدر: ساب واعتماد والبنوك · وكيل التقارير", zh: "来源:SAP + Etimad + 银行 · 报告生成智能体" },
  },
  qs: [
    { en: "What blocks the period close?", ar: "ما الذي يعيق الإقفال؟", zh: "什么阻碍期末关账?" },
    { en: "Explain the SAR 25M difference", ar: "فسّر فرق 25 مليوناً", zh: "解释 SAR 25M 差异" },
    { en: "Are the entries IPSAS-compliant?", ar: "هل القيود متوافقة مع IPSAS؟", zh: "分录符合 IPSAS 吗?" },
  ],
  answers: [
    { en: "Two items: the bank confirmation (requested, due today) and the accruals cutoff review (2 contracts pending completion certificates). Everything else, including subledgers, is closed.", ar: "بندان: التأكيد البنكي (مطلوب اليوم) ومراجعة قطع الاستحقاقات (عقدان بانتظار شهادات الإنجاز). كل ما عدا ذلك مقفل.", zh: "两项:银行询证(已发函,今日到期)与应计截止复核(2 份合同待完工证明)。其余包括明细账均已关闭。" },
    { en: "Esnad assignment costs posted in SAP but not yet in Etimad (+15M, timing) and Tahseel revenue recognized on collection vs billing (+10M, method). Both have drafted entries; bank fees (0.4M) auto-cleared within tolerance.", ar: "تكاليف إسناد مرحّلة في ساب دون اعتماد (+15، توقيت) وإيراد تحصيل معترف به عند التحصيل مقابل الفوترة (+10، طريقة). لكليهما قيود مصاغة؛ والرسوم البنكية سُوّيت تلقائياً.", zh: "Esnad 派工成本已入 SAP 未入 Etimad(+15M,时点差)、Tahseel 收入按收款 vs 开票口径确认(+10M,方法差)。两者均已起草分录;银行费(0.4M)在容差内自动清理。" },
    { en: "Yes — both validated by the Compliance/Rules agent against IPSAS and local policy, with the accounting memo and legal basis attached; UC-11 sign-off is on record.", ar: "نعم — تحقق منهما وكيل الامتثال وفق IPSAS والسياسات المحلية مع المذكرة والأساس القانوني؛ وتوقيع UC-11 مسجّل.", zh: "是——两项均由合规/规则智能体按 IPSAS 与本地政策校验,附会计备忘与法律依据;UC-11 签核已留档。" },
  ],
  genAns: { en: "From 财务关账、对账与结算: close 82% (9/11) · recon 98% · net diff SAR 25M explained · 2 IPSAS-validated entries pending approval · 1 day to close.", ar: "من 财务关账、对账与结算: الإقفال 82% · المطابقة 98% · فرق 25 مليوناً مفسَّر · قيدان بانتظار الاعتماد · يوم واحد للإقفال.", zh: "依据 财务关账、对账与结算:关账 82%(9/11)· 对账 98% · 净差 SAR 25M 已解释 · 2 项 IPSAS 校验分录待批 · 距关账 1 天。" },
};

export { BENCH_UC09 };
