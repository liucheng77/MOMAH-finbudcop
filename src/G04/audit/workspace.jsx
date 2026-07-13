/* 审计部 — department workspace page (DeptWorkspace config + wrapper).
   Verbatim WS_CFG_AUDIT from src/App.jsx. */
import React from "react";
import { DeptWorkspace } from "../shared.jsx";
import { PLAZA_G04 } from "../plazaG04.js";
import { FLOW_AUD } from "./flow";

const WS_CFG_AUDIT = {
  uc: "UC-03 (+UC-02)", kpiTone: "violet", flow: FLOW_AUD, plazaModel: PLAZA_G04, plazaSel: "uc03", flowRoute: "g04audflow",
  flowHideUc: true,
  title: { en: "Audit Department", ar: "إدارة التدقيق", zh: "审计部" },
  mandate: { en: "Mandate: last financial control point before payment — review supplier / company / employee / court-ruling / utility claim packages and accept, return or defer (UC-03/UC-02). Surface key evidence inside 100+-page packages, standardize checklists, and reflect budget-execution & liquidity status to leadership.", ar: "المهمة: نقطة الضبط المالي الأخيرة قبل الدفع — مراجعة حِزم مطالبات الموردين / الشركات / الموظفين / الأحكام القضائية / المرافق وقبولها أو إعادتها أو تأجيلها (UC-03/UC-02). إبراز الأدلة الرئيسية داخل حزم تتجاوز 100 صفحة، وتوحيد قوائم الفحص، وعكس حالة التنفيذ والسيولة للقيادة.", zh: "职责:付款前最后财务控制点——审核供应商/公司/员工/法院判决/水电等索赔包,决定受理、退回或延后(UC-03/UC-02)。在 100+ 页附件中快速定位关键证据、标准化审核清单,并向领导反映预算执行与流动性状态。" },
  sqScope: { en: "Scope: Audit · cross-department read-only", ar: "النطاق: التدقيق · للقراءة عبر الإدارات", zh: "范围:审计 · 跨部门只读" },
  sqPrompts: [{ en: "What is missing from claim package CLM-7731?", ar: "ما الناقص في حزمة المطالبة CLM-7731؟", zh: "索赔包 CLM-7731 缺什么材料?" }, { en: "Draft the Arabic return note with page references", ar: "صُغ إشعار الإعادة بالعربية مع مراجع الصفحات", zh: "起草含页码引用的阿语退回说明" }, { en: "Budget & liquidity status for this claim's line?", ar: "حالة الميزانية والسيولة لبند هذه المطالبة؟", zh: "该索赔对应预算行的执行与流动性状态?" }],
  kpiSlides: [
    [
      { lab: { en: "Open Exceptions", ar: "استثناءات مفتوحة", zh: "未结异常" }, v: "12", d: { en: "+3 this week (UC-02)", ar: "+3 هذا الأسبوع (UC-02)", zh: "本周 +3(UC-02)" } },
      { lab: { en: "Critical / High", ar: "حرج / مرتفع", zh: "严重 / 高" }, v: "2 / 4", d: { en: "by risk level", ar: "حسب مستوى الخطر", zh: "按风险等级" } },
      { lab: { en: "Avg Closure Time", ar: "متوسط زمن الإغلاق", zh: "平均结案时长" }, v: "8 d", d: { en: "−1 QoQ", ar: "−1 ربعياً", zh: "环比 −1" }, up: true },
      { lab: { en: "Overdue Packages", ar: "حزم متأخرة", zh: "超期未审索赔包" }, v: "3", d: { en: "in queue > 5 days", ar: "بالانتظار > 5 أيام", zh: "排队 > 5 天" } },
    ],
    [
      { lab: { en: "Audit Log Entries", ar: "إدخالات سجل التدقيق", zh: "审计日志条目" }, v: "38", d: { en: "last 24h (UC-03)", ar: "آخر 24 س (UC-03)", zh: "近 24h(UC-03)" } },
      { lab: { en: "Answer Confidence", ar: "ثقة الإجابة", zh: "回答置信度" }, v: "92%", d: { en: "avg on queries (UC-03)", ar: "متوسط الاستعلامات", zh: "查询均值(UC-03)" }, up: true },
      { lab: { en: "Data Quality (completion)", ar: "جودة البيانات (الاكتمال)", zh: "数据质量(完整度)" }, v: "96%", d: { en: "required fields complete (UC-01)", ar: "اكتمال الحقول (UC-01)", zh: "必填字段完整(UC-01)" } },
      { lab: { en: "Cross-dept Feeds", ar: "تغذية بين الإدارات", zh: "跨部门馈入" }, v: "6", d: { en: "live sources", ar: "مصادر حية", zh: "实时来源" } },
    ],
    [
      { lab: { en: "Claim Packages in Queue", ar: "حزم مطالبات بالانتظار", zh: "待审索赔包" }, aging: [["Contract", 100, "18"], ["Non-ctr", 50, "9"], ["Court/Util", 40, "7"]] },
      { lab: { en: "Avg Package Size", ar: "متوسط حجم الحزمة", zh: "平均附件规模" }, v: "112 pp", d: { en: "key pages auto-extracted", ar: "استخراج آلي للصفحات الرئيسية", zh: "关键页自动抽取" } },
      { lab: { en: "Missing-Document Rate", ar: "نسبة النواقص", zh: "缺件率" }, v: "38%", d: { en: "IBAN · CR · COC · tax top gaps", ar: "أبرز النواقص: آيبان، سجل، إنجاز، ضريبة", zh: "IBAN/CR/COC/税务为主要缺项" } },
      { lab: { en: "Payment Status (Etimad)", ar: "حالة الدفع (اعتماد)", zh: "支付状态(Etimad)" }, aging: [["Paid", 70, "61"], ["Appr.", 40, "22"], ["No liq.", 20, "9"]] },
    ],
  ],
  orch: {
    live: true,
    uc: "UC-03", run: "#1503", agent: { en: "Audit & Claims-Review agent", ar: "وكيل التدقيق ومراجعة المطالبات", zh: "审计与索赔审核智能体" },
    chips: ["scope: claims intake", "stage: pre-payment", "policy: checklist v3"],
    defaultPrompt: { en: "How many claims are in the Financial Balance Program and what is their total value by responsible department?", ar: "ما عدد مطالبات برنامج التوازن المالي وإجمالي قيمتها حسب الإدارة المسؤولة؟", zh: "财政平衡计划共有多少笔索赔?按责任部门统计其总金额是多少?" },
    startLog: { en: "Orchestrator started — unpacking claim package CLM-7731 & extracting evidence", ar: "بدأ المنسّق — تفكيك حزمة CLM-7731 واستخراج الأدلة", zh: "编排器已启动——拆解索赔包 CLM-7731 并抽取证据" },
    reviewLog: { en: "Draft ready — return note (3 missing documents) awaits reviewer sign-off", ar: "المسودة جاهزة — إشعار الإعادة (3 نواقص) بانتظار توقيع المراجع", zh: "草稿就绪——退回说明(3 项缺件)等待审核人签核" },
    approveLog: { en: "Reviewer approved; Arabic return note issued to the claimant", ar: "اعتمد المراجع؛ صدر إشعار الإعادة بالعربية لمقدّم المطالبة", zh: "审核人已批准;阿语退回说明已下发申请方" },
    returnLog: { en: "Note returned to the Claims-Review agent for rework", ar: "أُعيد الإشعار لوكيل مراجعة المطالبات", zh: "说明已退回索赔审核智能体重新处理" },
    prompts: [{ t: { en: "What is the total planned spending of the 2026 Housing Program?", ar: "ما إجمالي الإنفاق المخطط لبرنامج الإسكان لعام 2026؟", zh: "2026年住房计划支出计划总额是多少?" }, s: { en: "", ar: "", zh: "" } }, { t: { en: "Which 10 project codes have the highest planned 2026 spending in the Housing Program?", ar: "ما رموز المشاريع العشرة الأعلى في الإنفاق المخطط لعام 2026 ضمن برنامج الإسكان؟", zh: "住房计划中,2026年计划支出最高的10个项目代码是什么?" }, s: { en: "", ar: "", zh: "" } }, { t: { en: "Which housing project portfolio has the highest 2026 spending plan?", ar: "أي محفظة مشاريع إسكان لديها أعلى خطة إنفاق لعام 2026؟", zh: "哪个住房项目组合的2026年支出计划最高?" }, s: { en: "", ar: "", zh: "" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "load package + SAP line status", ar: "تحميل الحزمة وحالة البند في ساب", zh: "载入索赔包 + SAP 预算行状态" }, s: { en: "126 pages · B-2209: committed 8.4M · liquidity OK", ar: "126 صفحة · B-2209: التزام 8.4 · سيولة متاحة", zh: "126 页 · B-2209:承诺 8.4M · 流动性充足" } },
      { code: "UC-08", t: { en: "classify & extract key pages", ar: "تصنيف واستخراج الصفحات الرئيسية", zh: "分类并抽取关键页" }, s: { en: "COC p.12 · invoice p.31 · court ruling p.77", ar: "إنجاز ص12 · فاتورة ص31 · حكم ص77", zh: "COC 第12页 · 发票第31页 · 判决第77页" } },
      { code: "UC-02", t: { en: "run missing-document checklist", ar: "تشغيل قائمة النواقص", zh: "运行缺件清单核验" }, s: { en: "3 gaps: IBAN cert · CR copy · tax clearance", ar: "3 نواقص: شهادة آيبان، نسخة سجل، براءة ضريبية", zh: "3 项缺件:IBAN 证明、CR 副本、清税证明" } },
      { code: "UC-03", t: { en: "draft Arabic return note", ar: "صياغة إشعار الإعادة بالعربية", zh: "起草阿语退回说明" }, s: { en: "page refs cited · waits for human approval", ar: "مع مراجع الصفحات · بانتظار الاعتماد", zh: "引用页码 · 等待人工审批" } },
    ],
    reviewBody: { en: "The Arabic return note for CLM-7731 cites 3 missing documents (IBAN certificate, CR copy, tax clearance) with page references — reviewer sign-off required before it is issued.", ar: "يستشهد إشعار الإعادة لـ CLM-7731 بثلاثة نواقص (شهادة آيبان، نسخة السجل، البراءة الضريبية) مع مراجع الصفحات — يلزم توقيع المراجع قبل الإصدار.", zh: "CLM-7731 的阿语退回说明引用 3 项缺件(IBAN 证明、CR 副本、清税证明)及页码——需审核人签核后下发。" },
    approveLabel: { en: "Issue return note", ar: "إصدار إشعار الإعادة", zh: "下发退回说明" },
    approvedChip: { en: "Issued · claim returned for completion", ar: "صدر · أُعيدت المطالبة للاستكمال", zh: "已下发 · 索赔退回补件" },
    diff: [
      { k: "rem", t: { en: "CLM-7731 · manual page-by-page review (hours)", ar: "CLM-7731 · مراجعة يدوية صفحة صفحة (ساعات)", zh: "CLM-7731 · 人工逐页翻找(数小时)" } },
      { k: "add", t: { en: "CLM-7731 · key pages extracted + checklist run (minutes)", ar: "CLM-7731 · استخراج الصفحات وتشغيل القائمة (دقائق)", zh: "CLM-7731 · 关键页抽取+清单核验(分钟级)" } },
      { k: "rem", t: { en: "return reason · free text, uneven quality", ar: "سبب الإعادة · نص حر متفاوت الجودة", zh: "退回原因 · 自由文本,质量不一" } },
      { k: "add", t: { en: "return note · standardized Arabic, page refs cited", ar: "إشعار الإعادة · عربي موحّد مع مراجع الصفحات", zh: "退回说明 · 标准化阿语,引用页码" } },
    ],
    returnBody: { en: "Note sent back to the Claims-Review agent. Edit the prompt and run again.", ar: "أُعيد الإشعار لوكيل مراجعة المطالبات. عدّل الطلب وأعد التشغيل.", zh: "说明已退回索赔审核智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Issue Arabic return note (CLM-7731 · 3 gaps)", ar: "إصدار إشعار الإعادة (CLM-7731 · 3 نواقص)", zh: "下发阿语退回说明(CLM-7731 · 3 缺件)" }, owner: "Mansour Al-Harbi", role: { en: "Audit Lead", ar: "قائد التدقيق", zh: "审计负责人" }, phone: "+966 55 330 1907" },
      { act: { en: "Escalate court-ruling original to Legal Affairs", ar: "متابعة أصل الحكم القضائي مع الشؤون القانونية", zh: "向法务催办法院判决原文" }, owner: "Reem Al-Subaie", role: { en: "Compliance Reviewer", ar: "مراجعة الامتثال", zh: "合规复核" }, phone: "+966 50 442 8853" },
      { act: { en: "Brief leadership: paid / approved-unpaid / no-liquidity", ar: "إطلاع القيادة: مدفوع / معتمد غير مدفوع / بلا سيولة", zh: "向领导汇报:已付/已批未付/无流动性" }, owner: "Yousef Al-Nasser", role: { en: "Audit Analyst", ar: "محلل تدقيق", zh: "审计分析师" }, phone: "+966 53 667 2210" },
    ],
  },
  /* Proactive Insights Agent 卡片已按需求移除(不再在审计部主页渲染)。 */
};
function AuditWorkspace() { return <DeptWorkspace cfg={WS_CFG_AUDIT} />; }
export { WS_CFG_AUDIT, AuditWorkspace };
