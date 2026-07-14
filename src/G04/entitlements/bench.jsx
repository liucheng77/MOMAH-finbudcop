/* 财务权益部 — UC-08 analysis workbench config (UcBench). Verbatim from src/App.jsx.
   tool: "uc08" mounts the Uc08Entitlements review panel (key cost driver
   layout) below the standard bench header, matching the UC-15 / UC-01
   pattern used elsewhere in the project. */
import { g04ChainHere } from "../g04Chain.js";

const BENCH_UC08 = {
  route: "bench08", back: "entwork", dept: "entitle", tone: "violet", uc: "UC-08", run: "#8033", tool: "uc08", chainHideUc: true,
  deptName: { en: "Financial Entitlements Department", ar: "إدارة الاستحقاقات المالية", zh: "财务权益部" },
  benchLabel: { en: "Contracts, Claims, Disbursements, and Entitlements", ar: "العقود والمطالبات والصرف والاستحقاقات", zh: "合同、索赔、拨付与权益" },
  subt: { en: "Contracts, Claims, Disbursements, and Entitlements", ar: "العقود والمطالبات والصرف والاستحقاقات", zh: "合同、索赔、拨付与权益" },
  chainLab: { en: "G-04 CHAIN", ar: "سلسلة ج-04", zh: "G-04 链路" },
  chain: g04ChainHere("UC-08"),
  agent: { en: "Entitlements agent", ar: "وكيل الاستحقاقات", zh: "权益智能体" },
  summary: { en: "Know-before-it-arrives: annual payment plans aligned with Etimad actuals (**1,240 rows auto-mapped**, plan-vs-actual variance **18%**). Forecast for weeks 28–35: **SAR 412M expected claims (96)**; **2 budget lines short SAR 57M** vs SAP availability — an Arabic transfer / enhancement request to Budget Execution is drafted and awaiting review. Batch of ~~16 verified claims (SAR 268M)~~ ready.", ar: "المعرفة قبل الوصول: خطط الدفع السنوية مطابقة مع فعليات اعتماد (**1,240 صفاً آلياً**، انحراف **18%**). توقع الأسابيع 28–35: **412 مليوناً مطالبات متوقعة (96)**؛ **بندان بعجز 57 مليوناً** مقابل توافر ساب — وصيغ طلب مناقلة/تعزيز بالعربية بانتظار المراجعة. ودفعة ~~16 مطالبة متحققة (268 مليوناً)~~ جاهزة.", zh: "「索赔到来前先知道」:年度付款计划已与 Etimad 实际对齐(**自动映射 1,240 行**,计划 vs 实际偏差 **18%**)。第 28–35 周预测:**预期索赔 SAR 412M(96 笔)**;**2 条预算行对 SAP 可用资金短缺 SAR 57M**——发往预算执行部的阿语转移/增强申请已起草待审。~~16 笔已核验索赔(SAR 268M)~~ 批次就绪。" },
  recs: [
    { t: { en: "Send the transfer request", ar: "إرسال طلب المناقلة", zh: "发送转移申请" }, d: { en: "2 lines · SAR 57M · triggers the liquidity signal to UC-17", ar: "بندان · 57 مليوناً · يطلق إشارة السيولة لـ UC-17", zh: "2 行 · SAR 57M · 触发至 UC-17 的流动性信号" } },
    { t: { en: "Authorize the verified batch", ar: "اعتماد الدفعة المتحققة", zh: "批准已核验批次" }, d: { en: "16 claims · SAR 268M · 2 held for evidence", ar: "16 مطالبة · 268 مليوناً · اثنتان محتجزتان", zh: "16 笔 · SAR 268M · 2 笔缺证暂缓" } },
    { t: { en: "Fix 3 low-quality plan templates", ar: "تصحيح 3 قوالب منخفضة الجودة", zh: "修正 3 份低质量计划模版" }, d: { en: "Amanat templates driving most of the 18% variance", ar: "قوالب أمانات تسبب معظم انحراف 18%", zh: "18% 偏差主要来自这 3 份阿玛纳模版" } },
  ],
  ctas: [
    { uc: "UC-17", label: { en: "Automated Budget Execution Monitoring & Operational Reconciliation", ar: "المراقبة الآلية لتنفيذ الميزانية والتسوية التشغيلية", zh: "预算执行监控与运营对账自动化" }, to: "bench17", dept: "budexec" },
    { uc: "UC-09", label: { en: "Financial Closing, Reconciliation and Settlements", ar: "الإقفال المالي والمطابقة والتسويات", zh: "财务关账、对账与结算" }, to: "bench09", dept: "acct" },
  ],
  scope: [
    { k: { en: "Window", ar: "النافذة", zh: "窗口" }, opts: ["Weeks 28–35", "This month", "FY 2026"] },
    { k: { en: "Portfolio", ar: "المحفظة", zh: "组合" }, opts: ["All Vision portfolios", "Housing", "Municipal"] },
    { k: { en: "Status", ar: "الحالة", zh: "状态" }, opts: ["All claims", "Verified", "Held (evidence)"] },
  ],
  resultsH: { en: "Claims & Liquidity Results", ar: "نتائج المطالبات والسيولة", zh: "索赔与流动性结果" },
  resultsSub: { en: "合同、索赔、拨付与权益 outputs · produced by agents", ar: "مخرجات 合同、索赔、拨付与权益 · أُنتجت بواسطة الوكلاء", zh: "合同、索赔、拨付与权益 输出 · 由智能体生成" },
  outputs: [
    { l: { en: "Plan ↔ Actual Alignment", ar: "مطابقة الخطة والفعلي", zh: "计划 ↔ 实际对齐" }, v: "1,240", s: { en: "rows auto-mapped · variance 18%", ar: "صفوف آلية · انحراف 18%", zh: "行自动映射 · 偏差 18%" }, rows: [
      { k: { en: "Matched projects & lines", ar: "مشاريع وبنود مطابقة", zh: "已匹配项目与预算行" }, v: "94%", pct: 94 },
      { k: { en: "Template quality issues", ar: "مشاكل جودة القوالب", zh: "模版质量问题" }, v: "3" },
      { k: { en: "Manual review rows", ar: "صفوف للمراجعة اليدوية", zh: "待人工复核行" }, v: "74" },
    ] },
    { l: { en: "Claims Forecast (wk 28–35)", ar: "توقع المطالبات (28–35)", zh: "索赔预测(第28–35周)" }, v: "SAR 412M", s: { en: "96 expected claims by week & line", ar: "96 مطالبة متوقعة حسب الأسبوع والبند", zh: "96 笔,按周与预算行分布" }, tag: { en: "peak wk 29", ar: "الذروة أسبوع 29", zh: "高峰第29周" }, rows: [
      { k: { en: "Weeks 28–29", ar: "أسبوعا 28–29", zh: "第28–29周" }, v: "SAR 173M", pct: 42 },
      { k: { en: "Weeks 30–31", ar: "أسبوعا 30–31", zh: "第30–31周" }, v: "SAR 141M", pct: 34 },
      { k: { en: "Weeks 32–35", ar: "أسابيع 32–35", zh: "第32–35周" }, v: "SAR 98M", pct: 24 },
    ] },
    { l: { en: "Liquidity Gap & Request", ar: "فجوة السيولة والطلب", zh: "流动性缺口与申请" }, v: "SAR 57M", s: { en: "2 lines short vs SAP · Arabic draft ready", ar: "بندان بعجز · مسودة عربية جاهزة", zh: "2 行短缺 · 阿语草稿就绪" }, rows: [
      { k: { en: "Line B-3402 (wk 28–31)", ar: "البند B-3402", zh: "预算行 B-3402(第28–31周)" }, v: "SAR 43M" },
      { k: { en: "Line B-2884 (wk 30)", ar: "البند B-2884", zh: "预算行 B-2884(第30周)" }, v: "SAR 14M" },
      { k: { en: "Human review", ar: "مراجعة بشرية", zh: "人工审批" }, v: "pending" },
    ] },
  ],
  sources: [{ n: "Annual payment-plan Excel (Amanat/agencies)", s: "synced" }, { n: "Etimad / Etimad Plus exports", s: "loading" }, { n: "SAP / Asas availability", s: "synced" }, { n: "Contracts & payment orders", s: "synced" }, { n: "Vision-portfolio weekly PPT", s: "synced" }, { n: "Unified layer (UC-01)", s: "synced" }],
  roles: [
    { name: { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "主动洞察智能体" }, sub: { en: "Monitors plan-vs-actual gaps & flags missing evidence", ar: "يرصد فجوات الخطة والفعلي والأدلة الناقصة", zh: "监控计划实际差异与缺证索赔" }, status: "running", cls: "r-violet" },
    { name: { en: "Anomaly Detection Agent", ar: "وكيل كشف الشذوذ", zh: "异常检测智能体" }, sub: { en: "Flags plan-vs-actual gaps & missing evidence", ar: "يرصد فجوات الخطة والفعلي والأدلة الناقصة", zh: "标记计划实际差异与缺证索赔" }, status: "active", cls: "r-blue" },
    { name: { en: "Compliance / Rules Agent", ar: "وكيل الامتثال / القواعد", zh: "合规/规则智能体" }, sub: { en: "Verifies entitlements & drafts the Arabic request", ar: "يتحقق من الاستحقاقات ويصوغ الطلب بالعربية", zh: "核验权益并起草阿语申请" }, status: "active", cls: "r-blue" },
  ],
  logs: [
    { tm: "10:02", code: "UC-01", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "Plan Excel + Etimad export aligned · 1,240 rows", ar: "مطابقة الخطة وتصدير اعتماد · 1,240 صفاً", zh: "计划 Excel + Etimad 导出对齐 · 1,240 行" }, dot: "blue" },
    { tm: "10:03", code: "UC-08", h: { en: "Variance", ar: "الانحراف", zh: "偏差" }, d: { en: "Plan-vs-actual 18% · top gaps by project & line", ar: "انحراف 18% · أكبر الفجوات حسب المشروع", zh: "计划 vs 实际 18% · 按项目/预算行排缺口" }, dot: "blue" },
    { tm: "10:04", h: { en: "Forecast", ar: "التوقع", zh: "预测" }, d: { en: "SAR 412M expected (wk 28–35) · 96 claims", ar: "412 مليوناً متوقعة · 96 مطالبة", zh: "预期 SAR 412M(第28–35周)· 96 笔" }, dot: "blue" },
    { tm: "10:05", h: { en: "Liquidity Check", ar: "فحص السيولة", zh: "流动性核查" }, d: { en: "2 lines short SAR 57M vs SAP · Arabic draft ready", ar: "بندان بعجز 57 مليوناً · مسودة عربية جاهزة", zh: "2 行短缺 SAR 57M · 阿语草稿就绪" }, dot: "amber" },
    { tm: "10:06", h: { en: "Orchestrator", ar: "المنسّق", zh: "编排器" }, d: { en: "Transfer request awaits Entitlements review", ar: "طلب المناقلة بانتظار مراجعة الاستحقاقات", zh: "转移申请等待权益部审阅" }, dot: "gray" },
  ],
  narr: {
    p: [
      { en: "The department has shifted from claim-triggered processing to forward liquidity management: plans and Etimad actuals are auto-aligned, and the next 8 weeks of claims (SAR 412M) are visible line by line.", ar: "انتقلت الإدارة من المعالجة عند ورود المطالبة إلى إدارة سيولة استباقية: تُطابق الخطط مع فعليات اعتماد آلياً، ومطالبات الأسابيع الثمانية القادمة (412 مليوناً) مرئية بنداً بنداً.", zh: "部门已从「索赔来了才处理」转向前瞻流动性管理:计划与 Etimad 实际自动对齐,未来 8 周索赔(SAR 412M)按预算行逐条可见。" },
      { en: "Two lines run short SAR 57M against SAP availability in weeks 28–31; the Arabic transfer / enhancement request is drafted with full data citations and waits for human review before the signal fires to Budget Execution.", ar: "بندان بعجز 57 مليوناً مقابل توافر ساب في الأسابيع 28–31؛ وصيغ الطلب بالعربية مع الاستشهادات وينتظر المراجعة البشرية قبل إطلاق الإشارة لتنفيذ الميزانية.", zh: "第 28–31 周有 2 条行对 SAP 可用资金短缺 SAR 57M;阿语转移/增强申请已带数据引用起草完毕,人工审阅后才向预算执行部触发信号。" },
    ],
    recs: [
      { en: "Review & send the SAR 57M transfer request", ar: "مراجعة وإرسال طلب 57 مليوناً", zh: "审阅并发送 SAR 57M 转移申请" },
      { en: "Authorize the 16-claim batch (SAR 268M)", ar: "اعتماد دفعة الـ16 مطالبة", zh: "批准 16 笔批次(SAR 268M)" },
      { en: "Coach the 3 weak plan-template owners", ar: "توجيه أصحاب القوالب الثلاثة الضعيفة", zh: "辅导 3 份弱模版的填报方" },
    ],
    src: { en: "Source: payment plans + Etimad + SAP · Forecasting Agent", ar: "المصدر: خطط الدفع واعتماد وساب · وكيل التنبؤ", zh: "来源:付款计划 + Etimad + SAP · 预测智能体" },
  },
  qs: [
    { en: "Expected claims vs available funds, next 4–8 weeks?", ar: "المطالبات المتوقعة مقابل الأموال المتاحة؟", zh: "未来 4–8 周预期索赔 vs 可用资金?" },
    { en: "Where is plan-vs-actual variance largest?", ar: "أين أكبر انحراف بين الخطة والفعلي؟", zh: "计划与实际偏差最大在哪里?" },
    { en: "What does the Arabic transfer request say?", ar: "ماذا يتضمن طلب المناقلة بالعربية؟", zh: "阿语转移申请的内容是什么?" },
  ],
  answers: [
    { en: "SAR 412M expected across 96 claims (peak week 29); SAP availability covers all but 2 lines — B-3402 short 43M (wk 28–31) and B-2884 short 14M (wk 30). Total gap SAR 57M.", ar: "412 مليوناً عبر 96 مطالبة (الذروة أسبوع 29)؛ يغطي توافر ساب كل البنود عدا اثنين — B-3402 بعجز 43 وB-2884 بعجز 14. الإجمالي 57 مليوناً.", zh: "预期 SAR 412M、96 笔(高峰第 29 周);SAP 可用资金可覆盖除 2 条外的全部——B-3402 短缺 43M(第28–31周)、B-2884 短缺 14M(第30周),合计 SAR 57M。" },
    { en: "18% overall; the top 3 gaps sit in housing-infrastructure projects where Amanat templates under-planned Q3 — 74 rows are queued for manual confirmation.", ar: "18% إجمالاً؛ أكبر ثلاث فجوات في مشاريع بنية الإسكان حيث قللت قوالب الأمانات تقدير الربع الثالث — و74 صفاً بانتظار التأكيد اليدوي.", zh: "总体 18%;前三大缺口在住房基础设施项目——相关阿玛纳模版低估了 Q3,74 行待人工确认。" },
    { en: "It cites the 2 lines, weekly claim schedule, SAP availability snapshots and requested amounts (43M + 14M), proposes source lines from the idle list, and requests action before week 28 — pending your approval to send.", ar: "يذكر البندين وجدول المطالبات ولقطات توافر ساب والمبالغ (43+14)، ويقترح بنوداً مصدرية من قائمة الخمول، ويطلب الإجراء قبل الأسبوع 28 — بانتظار موافقتك للإرسال.", zh: "申请引用 2 条预算行、按周索赔计划、SAP 可用性快照与申请金额(43M+14M),从闲置清单提出来源行,并请求在第 28 周前办理——待你批准后发送。" },
  ],
  genAns: { en: "From 合同、索赔、拨付与权益: plans aligned (1,240 rows · 18% variance) · SAR 412M claims forecast · 2 lines short 57M · Arabic request drafted, human review pending.", ar: "من 合同、索赔、拨付与权益: مطابقة الخطط (1,240 صفاً · 18%) · توقع 412 مليوناً · بندان بعجز 57 · طلب عربي بانتظار المراجعة.", zh: "依据 合同、索赔、拨付与权益:计划已对齐(1,240 行 · 偏差 18%)· 索赔预测 SAR 412M · 2 行短缺 57M · 阿语申请已起草待人工审阅。" },
};

/* ---- Bench cfg · UC-09 Financial Closing, Reconciliation and Settlements (G-04/G-05) ---- */

export { BENCH_UC08 };
