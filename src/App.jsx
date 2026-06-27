import React, { useState, useMemo, useEffect, useRef, createContext, useContext } from "react";
import * as RC from "recharts";

/* =========================================================================
   Financial & Budgeting Copilot (AI_SS_02) — interactive demo.
   MoMAH · Agency for Financial Affairs and Budget.
   One multi-agent platform with connected agentic journeys + the UC-06
   Financial Performance Analysis report builder (4 steps).
   Trilingual: Arabic (RTL) · English · 中文 (?ln=zh / ?ln=en / ?ln=ar).
   Every AI output is a DRAFT — nothing is a financial decision until approved.
   All figures are synthetic demo data (BRD V0.1).
   ========================================================================= */
const BUILD_TIME = (typeof BUILD_STAMP !== "undefined" && BUILD_STAMP) ? BUILD_STAMP : "@@BUILD@@";
const LANGS = ["ar", "en", "zh"];
const URL_LANG = (() => { try { const p = new URLSearchParams(window.location.search).get("ln"); return LANGS.indexOf(p) >= 0 ? p : null; } catch (e) { return null; } })();
// ?uc=true reveals UC-xx / G-x annotations in the UI; hidden by default for client demos.
const SHOW_UC = (() => { try { return new URLSearchParams(window.location.search).get("uc") === "true"; } catch (e) { return false; } })();
function sanitizeUc(s) {
  if (typeof s !== "string") return s;
  return s
    .replace(/\s*[\(（](?:UC|G|ج)-[0-9０-９/\-、,\s]*[\)）]/g, "")
    .replace(/(?:UC|G|ج)-[0-9/\-]+\s*[·:：]\s*/g, "")
    .replace(/\s*·\s*(?:UC|G|ج)-[0-9/\-]+/g, "")
    .replace(/\s*(?:UC|G|ج)-[0-9/\-]+/g, "")
    .replace(/\(\s*\)|（\s*）/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
const GCODE = { planning: "G-02", budget: "G-03", claims: "G-04", reporting: "G-05", revassets: "G-06" };
const SCOPE = { en: "Ministry · FY2026", ar: "الوزارة · 2026", zh: "部级 · 2026" };

/* ---- Agents (engines) & data sources ---- */
// 13 agents from the BRD's "Agent roles and decision-making scopes" (1 Orchestrator + 12 specialized).
const ENGINES = [
  { key: "orch", icon: "✦", lvl: "L1" },
  { key: "forecast", icon: "📈", lvl: "L2" },
  { key: "rolling", icon: "🔄", lvl: "L2" },
  { key: "scenario", icon: "⚖", lvl: "L2" },
  { key: "optimize", icon: "🎯", lvl: "L2" },
  { key: "anomaly", icon: "◉", lvl: "L2" },
  { key: "trends", icon: "🌐", lvl: "L3" },
  { key: "insights", icon: "💡", lvl: "L3" },
  { key: "narrative", icon: "✍", lvl: "L3" },
  { key: "query", icon: "🔎", lvl: "L3" },
  { key: "reports", icon: "📄", lvl: "L3" },
  { key: "revenue", icon: "💰", lvl: "L2" },
  { key: "compliance", icon: "🛡", lvl: "L3" },
];
// 13 integration systems from the BRD's integrations table.
const SOURCES11 = [
  { key: "sap", status: "ok", sla: "daily", fresh: 99 }, { key: "grp", status: "ok", sla: "daily", fresh: 96 },
  { key: "etimad", status: "ok", sla: "daily", fresh: 97 }, { key: "etimadp", status: "amber", sla: "—", fresh: 60 },
  { key: "esnad", status: "ok", sla: "daily", fresh: 95 }, { key: "tahseel", status: "amber", sla: "weekly", fresh: 78 },
  { key: "makeen", status: "ok", sla: "weekly", fresh: 92 }, { key: "efaa", status: "ok", sla: "weekly", fresh: 90 },
  { key: "sanad", status: "ok", sla: "weekly", fresh: 91 }, { key: "bi", status: "ok", sla: "daily", fresh: 93 },
  { key: "balady", status: "ok", sla: "daily", fresh: 94 }, { key: "whiteland", status: "ok", sla: "monthly", fresh: 88 },
  { key: "hyperion", status: "amber", sla: "quarterly", fresh: 74 },
];

/* ---- hub charts ---- */
const UTIL_BY_AMANA = [
  { k: "RUH", v: 78 }, { k: "JED", v: 91 }, { k: "MAK", v: 63 },
  { k: "EAS", v: 69 }, { k: "MED", v: 54 }, { k: "ASR", v: 47 },
];

/* ---- alerts / deviations ---- */
const ALERTS = [
  { id: "DV-2041", sev: "red", src: "SAP · UC-02", scn: "q_overrun",
    t: { en: "Jeddah Amana · operating budget at 91% — projected overrun", ar: "أمانة جدة · تنفيذ تشغيلي 91٪ — تجاوز متوقع", zh: "吉达阿玛纳 · 运营预算执行 91%——预计超支" },
    rc: { en: "Execution outpaced the payment plan; projected SAR 96M overrun by year-end.", ar: "تجاوز التنفيذ خطة الدفع؛ تجاوز متوقع 96 مليون ريال بنهاية العام.", zh: "执行进度超过付款计划；预计年底超支 9,600 万里亚尔。" } },
  { id: "DV-2044", sev: "red", src: "Etimad · UC-02", scn: "q_duplicate",
    t: { en: "Suspected duplicate invoice · vendor 700412", ar: "اشتباه فاتورة مكررة · المورّد 700412", zh: "疑似重复发票 · 供应商 700412" },
    rc: { en: "Two claims of SAR 1.84M filed 6 days apart against contract CT-5520.", ar: "مطالبتان بقيمة 1.84 مليون ريال بفارق 6 أيام على العقد CT-5520.", zh: "针对合同 CT-5520，6 天内提交两笔各 184 万里亚尔的索赔。" } },
  { id: "DV-2050", sev: "amber", src: "Tahseel · UC-13", scn: "q_collection",
    t: { en: "Collection gap widened · Asir Amana", ar: "اتساع فجوة التحصيل · أمانة عسير", zh: "征收缺口扩大 · 阿西尔阿玛纳" },
    rc: { en: "Billing-vs-collection variance reached 14% (> 10% threshold).", ar: "بلغ الفرق بين الفوترة والتحصيل 14٪ (يتجاوز حد 10٪).", zh: "开票与征收差异达 14%(超过 10% 阈值)。" } },
  { id: "DV-2053", sev: "amber", src: "SAP · UC-09", scn: null,
    t: { en: "Abnormal trial-balance entry · account 2310", ar: "رصيد غير اعتيادي في ميزان المراجعة · الحساب 2310", zh: "试算平衡异常分录 · 科目 2310" },
    rc: { en: "Accrued-liabilities balance deviates from the 6-month pattern.", ar: "رصيد الالتزامات المستحقة ينحرف عن نمط 6 أشهر.", zh: "应计负债余额偏离过去 6 个月的模式。" } },
  { id: "DV-2057", sev: "info", src: "Esnad · UC-08", scn: null,
    t: { en: "Dormant contract · CT-8841 (92 days no activity)", ar: "عقد خامل · CT-8841 (92 يوماً دون حركة)", zh: "休眠合同 · CT-8841(92 天无活动)" },
    rc: { en: "No disbursement activity for 92 days — candidate for release.", ar: "لا حركة صرف منذ 92 يوماً — مرشح للإفراج عن المخصص.", zh: "92 天无支付活动——可考虑释放预算。" } },
];

/* ---- Assistant scenarios (scripted) ---- */
const SCN = {
  q_fiscal: { type: "single", engines: ["orch", "consol", "forecast"],
    steps: [["orch", "think_intent"], ["query", "think_route"], ["forecast", "think_run"], ["orch", "think_compose"]],
    a: { en: "Riyadh Region Amana has SAR 1.21B of available fiscal space: an approved ceiling of SAR 1.60B less SAR 0.31B commitments and SAR 0.08B reservations. Utilization is 78%.",
         ar: "يبلغ الحيز المالي المتاح لأمانة منطقة الرياض 1.21 مليار ريال: سقف معتمد 1.60 مليار ريال مخصوماً منه 0.31 مليار التزامات و0.08 مليار حجوزات. ونسبة التنفيذ 78٪.",
         zh: "利雅得地区阿玛纳的可用财政空间为 12.1 亿里亚尔:核定上限 16.0 亿里亚尔,扣除 3.1 亿承诺与 0.8 亿预留。执行率 78%。" },
    conf: 90, srcs: ["src_sap", "src_etimad", "src_gl"], viz: "util", report: "rep_fiscal" },
  q_overrun: { type: "cross", engines: ["orch", "deviation", "forecast"],
    steps: [["orch", "think_intent"], ["anomaly", "think_run"], ["forecast", "think_run"], ["orch", "think_compose"]],
    a: { en: "Jeddah Governorate Amana is the main risk: 91% operating-budget utilization with a projected SAR 96M overrun by year-end. A reallocation of SAR 120M from Asir under-execution is recommended — open the Budget Execution journey to review and approve it.",
         ar: "أمانة محافظة جدة هي الخطر الأبرز: 91٪ تنفيذ تشغيلي مع تجاوز متوقع 96 مليون ريال بنهاية العام. ويُوصى بإعادة توزيع 120 مليون ريال من نقص تنفيذ عسير — افتح مسار تنفيذ الميزانية للمراجعة والاعتماد.",
         zh: "吉达省阿玛纳是主要风险:运营预算执行率 91%,预计年底超支 9,600 万里亚尔。建议从阿西尔的执行不足中调拨 1.2 亿里亚尔——请打开「预算执行」流程进行复核与审批。" },
    conf: 87, srcs: ["src_sap", "src_etimad"], viz: "util", report: "rep_overrun", red: true,
    actions: [{ lk: "act_open_budget", to: "budget" }] },
  q_duplicate: { type: "cross", engines: ["orch", "deviation", "comply"],
    steps: [["orch", "think_intent"], ["anomaly", "think_run"], ["compliance", "think_run"], ["orch", "think_compose"]],
    a: { en: "One suspected duplicate this month: vendor 700412 filed INV-55021 and INV-55088 (each SAR 1.84M) 6 days apart against contract CT-5520. The Audit Agent recommends blocking INV-55021. This is a draft pending your approval — open the Claims & Disbursement journey to act.",
         ar: "تكرار واحد مشتبه به هذا الشهر: قدّم المورّد 700412 الفاتورتين INV-55021 وINV-55088 (كل منهما 1.84 مليون ريال) بفارق 6 أيام على العقد CT-5520. ويوصي وكيل التدقيق بحجب INV-55021. وهذه مسودة بانتظار اعتمادك — افتح مسار المطالبات والصرف.",
         zh: "本月有一笔疑似重复:供应商 700412 针对合同 CT-5520,6 天内提交了 INV-55021 与 INV-55088(各 184 万里亚尔)。审计智能体建议拦截 INV-55021。此为待您审批的草稿——请打开「索赔与支付」流程处理。" },
    conf: 94, srcs: ["src_etimad", "src_esnad"], report: "rep_dup", red: true,
    actions: [{ lk: "act_open_claims", to: "claims" }] },
  q_collection: { type: "single", engines: ["orch", "consol", "deviation"],
    steps: [["orch", "think_intent"], ["revenue", "think_route"], ["anomaly", "think_run"], ["orch", "think_compose"]],
    a: { en: "The overall collection rate is 88.6%, up 1.4 points month-on-month. The widest gap is Asir Amana, where billing-vs-collection variance reached 14% and raised an early-warning alert.",
         ar: "بلغت نسبة التحصيل الإجمالية 88.6٪، بارتفاع 1.4 نقطة شهرياً. وأكبر فجوة في أمانة عسير حيث بلغ الفرق بين الفوترة والتحصيل 14٪ وأطلق تنبيهاً مبكراً.",
         zh: "整体征收率为 88.6%,环比上升 1.4 个百分点。最大缺口在阿西尔阿玛纳,开票与征收差异达 14%,已触发预警。" },
    conf: 89, srcs: ["src_tahseel", "src_makeen"], report: "rep_collect" },
  q_vague: { type: "escalate", engines: ["orch"],
    steps: [["orch", "think_intent"], ["orch", "think_perm"]],
    a: { en: "I can't answer that. The request falls outside your permission scope and the platform is read-only for sensitive vendor and beneficiary records. I can instead provide aggregated, source-backed financial analytics.",
         ar: "لا أستطيع الإجابة على ذلك. يقع الطلب خارج نطاق صلاحياتك، والمنصة للقراءة فقط فيما يخص بيانات الموردين والمستفيدين الحساسة. ويمكنني بدلاً من ذلك تقديم تحليلات مالية مجمّعة ومدعومة بالمصادر.",
         zh: "我无法回答该请求。它超出了您的权限范围,且平台对敏感的供应商与受益人记录仅为只读。我可以改为提供聚合的、有数据来源支撑的财务分析。" },
    conf: null, srcs: [] },
};
const PRESETS = ["q_fiscal", "q_overrun", "q_duplicate", "q_collection", "q_vague"];

/* ---- Storyline G-03 (budget execution) ---- */
const STORY_BUDGET = {
  key: "budget",
  nodes: [
    { k: "consol", uc: "UC-01", kind: "data", icon: "⛁",
      title: { en: "Consolidate source data", ar: "تجميع بيانات المصدر", zh: "汇聚源数据" },
      actor: { en: "System / Orchestrator", ar: "النظام / المنسّق", zh: "系统 / 编排器" },
      desc: { en: "Pull approved ceilings, commitments and payment plans from SAP, Etimad and GRP; standardize and validate.", ar: "سحب السقوف والالتزامات وخطط الدفع المعتمدة من ساب واعتماد وGRP؛ ثم التوحيد والتحقق.", zh: "从 SAP、Etimad 和 GRP 拉取核定上限、承诺与付款计划;标准化并校验。" },
      out: { en: "Standardized, validated budget dataset — 6 Amanas, FY2026.", ar: "مجموعة بيانات ميزانية موحّدة ومتحقق منها — 6 أمانات، 2026.", zh: "标准化、已校验的预算数据集——6 个阿玛纳,2026 财年。" },
      metric: { en: "6 Amanas", ar: "6 أمانات", zh: "6 个阿玛纳" } },
    { k: "deviation", uc: "UC-02", kind: "agent", icon: "◉",
      title: { en: "Deviation & execution scan", ar: "فحص الانحرافات والتنفيذ", zh: "偏差与执行扫描" },
      actor: { en: "Deviation Agent", ar: "وكيل الانحرافات", zh: "偏差智能体" },
      desc: { en: "Compare actual execution against ceilings and payment plans across departments.", ar: "مقارنة التنفيذ الفعلي بالسقوف وخطط الدفع عبر الإدارات.", zh: "将各部门的实际执行与上限和付款计划进行比对。" },
      table: { cols: { en: ["Amana", "Utilization", "Status"], ar: ["الأمانة", "نسبة التنفيذ", "الحالة"], zh: ["阿玛纳", "执行率", "状态"] },
        rows: [{ a: "Jeddah", v: "91%", f: "red" }, { a: "Riyadh", v: "78%", f: "amber" }, { a: "Asir", v: "47%", f: "info" }] },
      out: { en: "1 high-risk overrun (Jeddah), 1 under-execution (Asir).", ar: "تجاوز عالي الخطورة (جدة)، ونقص تنفيذ (عسير).", zh: "1 项高风险超支(吉达),1 项执行不足(阿西尔)。" },
      metric: { en: "1 RED", ar: "إنذار أحمر", zh: "1 个红色" } },
    { k: "fiscal", uc: "UC-07", kind: "fiscal", icon: "∑",
      title: { en: "Recompute fiscal space", ar: "إعادة حساب الحيز المالي", zh: "重新计算财政空间" },
      actor: { en: "Budget Planning Agent", ar: "وكيل تخطيط الميزانية", zh: "预算规划智能体" },
      desc: { en: "Fiscal space = approved ceiling − commitments − payment plan − reservations.", ar: "الحيز المالي = السقف المعتمد − الالتزامات − خطة الدفع − الحجوزات.", zh: "财政空间 = 核定上限 − 承诺 − 付款计划 − 预留。" },
      fiscal: { ceiling: 6.40, commit: 0.98, plan: 0.42, reserve: 0.18, space: 4.82 },
      out: { en: "Available fiscal space recalculated to SAR 4.82B.", ar: "إعادة حساب الحيز المالي المتاح إلى 4.82 مليار ريال.", zh: "可用财政空间重新计算为 48.2 亿里亚尔。" },
      metric: { en: "SAR 4.82B", ar: "4.82 مليار", zh: "48.2 亿" } },
    { k: "realloc", uc: "UC-08", kind: "review", icon: "✦",
      title: { en: "AI reallocation recommendation", ar: "توصية إعادة التوزيع", zh: "AI 调拨建议" },
      actor: { en: "Reallocation Agent → Human reviewer", ar: "وكيل إعادة التوزيع ← المراجع البشري", zh: "调拨智能体 → 人工复核" },
      desc: { en: "Within approved ceilings, the agent proposes a transfer to cover the Jeddah overrun from under-executed budgets.", ar: "ضمن السقوف المعتمدة، يقترح الوكيل مناقلة لتغطية تجاوز جدة من ميزانيات منخفضة التنفيذ.", zh: "在核定上限内,智能体建议从执行不足的预算中调拨以弥补吉达的超支。" },
      review: {
        headline: { en: "Reallocate SAR 120M from Asir under-execution to Jeddah operating budget.", ar: "إعادة توزيع 120 مليون ريال من نقص تنفيذ عسير إلى الميزانية التشغيلية لجدة.", zh: "从阿西尔执行不足中调拨 1.2 亿里亚尔至吉达运营预算。" },
        conf: 82,
        why: { en: "Asir is at 47% utilization with SAR 210M unspent and no committed pipeline this quarter, while Jeddah is projected to overrun by SAR 96M. The transfer stays within the regional operating ceiling and approved transfer rule BT-07.", ar: "عسير عند 47٪ تنفيذ مع 210 مليون ريال غير مصروفة ودون التزامات هذا الربع، بينما يُتوقع تجاوز جدة بمقدار 96 مليون ريال. وتبقى المناقلة ضمن السقف التشغيلي للمنطقة وقاعدة المناقلة المعتمدة BT-07.", zh: "阿西尔执行率 47%,本季度有 2.1 亿里亚尔未支出且无承诺管线,而吉达预计超支 9,600 万里亚尔。该调拨仍在地区运营上限及核定调拨规则 BT-07 之内。" },
        srcs: ["SAP · GL 5100", "Etimad", "Rule BT-07"],
        approveLog: { en: "Approved reallocation SAR 120M Asir → Jeddah (UC-08)", ar: "اعتماد إعادة توزيع 120 مليون ريال من عسير إلى جدة (UC-08)", zh: "已批准调拨 1.2 亿里亚尔 阿西尔 → 吉达(UC-08)" } },
      out: { en: "Transfer recorded; Jeddah projected overrun cleared.", ar: "تسجيل المناقلة؛ معالجة تجاوز جدة المتوقع.", zh: "已记录调拨;吉达的预计超支已化解。" },
      metric: { en: "needs approval", ar: "يلزم اعتماد", zh: "需审批" } },
    { k: "report", uc: "UC-10", kind: "report", icon: "📄",
      title: { en: "Budget execution report", ar: "تقرير تنفيذ الميزانية", zh: "预算执行报告" },
      actor: { en: "Reporting Agent → Human approval", ar: "وكيل التقارير ← اعتماد بشري", zh: "报告智能体 → 人工审批" },
      desc: { en: "Generate a narrative report with the deviation, the recalculated fiscal space and the approved reallocation.", ar: "إنشاء تقرير سردي يتضمن الانحراف والحيز المالي المعاد حسابه والمناقلة المعتمدة.", zh: "生成包含偏差、重算财政空间与已批准调拨的叙述性报告。" },
      report: {
        title: { en: "Q2 Budget Execution — Jeddah / Asir", ar: "تنفيذ ميزانية الربع الثاني — جدة / عسير", zh: "二季度预算执行——吉达 / 阿西尔" },
        narrative: { en: "Q2 budget execution stands at 71.4% overall. Jeddah Amana reached 91% utilization, triggering a projected SAR 96M overrun; an approved transfer of SAR 120M from Asir under-execution restored balance within the regional ceiling. Available fiscal space stands at SAR 4.82B. All figures are traceable to SAP and Etimad source records.", ar: "بلغ تنفيذ ميزانية الربع الثاني 71.4٪ إجمالاً. وصلت أمانة جدة إلى 91٪، ما تسبب بتجاوز متوقع 96 مليون ريال؛ وأعادت مناقلة معتمدة بقيمة 120 مليون ريال من نقص تنفيذ عسير التوازن ضمن سقف المنطقة. ويبلغ الحيز المالي المتاح 4.82 مليار ريال. وجميع الأرقام قابلة للتتبع إلى سجلات ساب واعتماد.", zh: "二季度预算整体执行率为 71.4%。吉达阿玛纳达到 91%,引发预计 9,600 万里亚尔超支;一笔从阿西尔执行不足中调拨的 1.2 亿里亚尔(已批准)在地区上限内恢复了平衡。可用财政空间为 48.2 亿里亚尔。所有数字均可追溯至 SAP 与 Etimad 源记录。" },
        rows: [
          { l: { en: "Overall utilization", ar: "نسبة التنفيذ الإجمالية", zh: "整体执行率" }, v: "71.4%" },
          { l: { en: "Reallocation approved", ar: "المناقلة المعتمدة", zh: "已批准调拨" }, v: "SAR 120M" },
          { l: { en: "Fiscal space", ar: "الحيز المالي", zh: "财政空间" }, v: "SAR 4.82B" }] },
      out: { en: "Report ready for the General Budget Department.", ar: "التقرير جاهز للإدارة العامة للميزانية.", zh: "报告已就绪,提交给预算总局。" },
      metric: { en: "PDF ready", ar: "جاهز PDF", zh: "PDF 就绪" } },
  ],
};

/* ---- Storyline G-04 (claims & disbursement) ---- */
const STORY_CLAIMS = {
  key: "claims",
  nodes: [
    { k: "consol", uc: "UC-01", kind: "data", icon: "⛁",
      title: { en: "Ingest claim & contract", ar: "استلام المطالبة والعقد", zh: "接收索赔与合同" },
      actor: { en: "System / Orchestrator", ar: "النظام / المنسّق", zh: "系统 / 编排器" },
      desc: { en: "Claim CL-77310 received via Etimad, linked to contract CT-5520 and its disbursement plan.", ar: "استلام المطالبة CL-77310 عبر اعتماد، مرتبطة بالعقد CT-5520 وخطة صرفه.", zh: "通过 Etimad 接收索赔 CL-77310,关联合同 CT-5520 及其支付计划。" },
      out: { en: "Claim SAR 1.84M linked to contract CT-5520 (ceiling SAR 9.0M).", ar: "ربط مطالبة بقيمة 1.84 مليون ريال بالعقد CT-5520 (سقف 9.0 مليون ريال).", zh: "184 万里亚尔索赔关联至合同 CT-5520(上限 900 万里亚尔)。" },
      metric: { en: "CL-77310", ar: "CL-77310", zh: "CL-77310" } },
    { k: "deviation", uc: "UC-02", kind: "agent", icon: "◉",
      title: { en: "Audit & duplicate detection", ar: "التدقيق وكشف التكرار", zh: "审计与重复检测" },
      actor: { en: "Audit Agent", ar: "وكيل التدقيق", zh: "审计智能体" },
      desc: { en: "Run completeness checks and scan for duplicate invoices and contract overruns.", ar: "تشغيل فحوص الاكتمال والبحث عن الفواتير المكررة وتجاوزات العقد.", zh: "运行完整性检查,扫描重复发票与合同超支。" },
      table: { cols: { en: ["Check", "Result"], ar: ["الفحص", "النتيجة"], zh: ["检查", "结果"] },
        rows: [{ a: { en: "Completeness", ar: "الاكتمال", zh: "完整性" }, v: { en: "Pass", ar: "مجتاز", zh: "通过" }, f: "info" },
               { a: { en: "Duplicate invoice", ar: "فاتورة مكررة", zh: "重复发票" }, v: { en: "Match found", ar: "تطابق", zh: "发现匹配" }, f: "red" },
               { a: { en: "Contract ceiling", ar: "سقف العقد", zh: "合同上限" }, v: { en: "Within limit", ar: "ضمن الحد", zh: "在限额内" }, f: "info" }] },
      out: { en: "Potential duplicate of invoice INV-55021 (SAR 1.84M) detected.", ar: "اكتشاف تكرار محتمل للفاتورة INV-55021 (1.84 مليون ريال).", zh: "检测到发票 INV-55021(184 万里亚尔)可能重复。" },
      metric: { en: "1 duplicate", ar: "تكرار واحد", zh: "1 笔重复" } },
    { k: "comply", uc: "UC-11", kind: "fiscal", icon: "🛡",
      title: { en: "Compliance verification (IPSAS)", ar: "التحقق من الامتثال (IPSAS)", zh: "合规校验(IPSAS)" },
      actor: { en: "Compliance Agent", ar: "وكيل الامتثال", zh: "合规智能体" },
      desc: { en: "Verify accrual treatment and supporting documents against IPSAS and ministry policy.", ar: "التحقق من المعالجة على أساس الاستحقاق والمستندات الداعمة وفق IPSAS وسياسات الوزارة.", zh: "依据 IPSAS 与部委政策核验权责发生制处理与支持文件。" },
      fiscal: { ceiling: 9.00, commit: 6.20, plan: 1.84, reserve: 0, space: 0.96 },
      out: { en: "Compliant — 1 note: attach completion certificate before payment.", ar: "مطابق — ملاحظة واحدة: إرفاق شهادة الإنجاز قبل الصرف.", zh: "合规——1 条提示:付款前需附竣工证书。" },
      metric: { en: "Compliant", ar: "مطابق", zh: "合规" } },
    { k: "disb", uc: "UC-08", kind: "review", icon: "✦",
      title: { en: "AI disbursement recommendation", ar: "توصية الصرف", zh: "AI 支付建议" },
      actor: { en: "Disbursement Agent → Human reviewer", ar: "وكيل الصرف ← المراجع البشري", zh: "支付智能体 → 人工复核" },
      desc: { en: "Given the duplicate match, the agent recommends holding the duplicate and approving a single net payment.", ar: "نظراً للتطابق، يوصي الوكيل بإيقاف المكررة واعتماد دفعة صافية واحدة.", zh: "鉴于重复匹配,智能体建议拦截重复项并核准单笔净额付款。" },
      review: {
        headline: { en: "Reject duplicate INV-55021; issue one payment order of SAR 1.84M against CT-5520.", ar: "رفض الفاتورة المكررة INV-55021؛ وإصدار أمر صرف واحد بقيمة 1.84 مليون ريال على CT-5520.", zh: "拒绝重复发票 INV-55021;针对 CT-5520 开具一笔 184 万里亚尔的付款单。" },
        conf: 94,
        why: { en: "INV-55021 and INV-55088 share the same vendor, amount and line items, filed 6 days apart; only one matches a delivered milestone. Paying both would overrun the contract by SAR 1.84M.", ar: "تتشارك INV-55021 وINV-55088 المورّد ذاته والمبلغ والبنود، وقُدّمتا بفارق 6 أيام؛ وواحدة فقط تطابق مرحلة منجزة. ودفع كليهما يتجاوز العقد بمقدار 1.84 مليون ريال.", zh: "INV-55021 与 INV-55088 供应商、金额、明细相同,相隔 6 天提交;仅一笔匹配已交付里程碑。两笔均付将使合同超支 184 万里亚尔。" },
        srcs: ["Etimad invoices", "CT-5520", "Esnad milestones"],
        approveLog: { en: "Approved payment order SAR 1.84M; duplicate INV-55021 rejected (UC-08)", ar: "اعتماد أمر صرف 1.84 مليون ريال؛ ورفض المكررة INV-55021 (UC-08)", zh: "已核准付款单 184 万里亚尔;已拒绝重复项 INV-55021(UC-08)" } },
      out: { en: "Payment order approved; duplicate blocked; SAP entry proposed.", ar: "اعتماد أمر الصرف؛ حجب المكررة؛ واقتراح قيد ساب.", zh: "已核准付款单;已拦截重复项;已建议 SAP 分录。" },
      metric: { en: "needs approval", ar: "يلزم اعتماد", zh: "需审批" } },
    { k: "report", uc: "UC-10", kind: "report", icon: "📄",
      title: { en: "Disbursement summary", ar: "ملخص الصرف", zh: "支付摘要" },
      actor: { en: "Reporting Agent → Human approval", ar: "وكيل التقارير ← اعتماد بشري", zh: "报告智能体 → 人工审批" },
      desc: { en: "Summarize the audit, the blocked duplicate and the approved payment, with full audit trail.", ar: "تلخيص التدقيق والمكررة المحجوبة والدفعة المعتمدة، مع سجل تدقيق كامل.", zh: "总结审计、被拦截的重复项与已核准付款,并附完整审计轨迹。" },
      report: {
        title: { en: "Disbursement Summary — CL-77310", ar: "ملخص الصرف — CL-77310", zh: "支付摘要——CL-77310" },
        narrative: { en: "Claim CL-77310 for SAR 1.84M against contract CT-5520 was audited; a duplicate invoice (INV-55021) was detected and blocked, preventing a SAR 1.84M contract overrun. A single net payment order of SAR 1.84M was approved by the authorized officer and a corresponding SAP entry proposed. The full chain — invoice, milestone, approval — is preserved in the audit trail.", ar: "تم تدقيق المطالبة CL-77310 بقيمة 1.84 مليون ريال على العقد CT-5520؛ واكتُشفت فاتورة مكررة (INV-55021) وحُجبت، ما منع تجاوزاً للعقد بقيمة 1.84 مليون ريال. واعتمد المسؤول المخوّل أمر صرف صافٍ واحد بقيمة 1.84 مليون ريال مع اقتراح قيد ساب مقابل. وسلسلة الإثبات الكاملة — الفاتورة والمرحلة والاعتماد — محفوظة في سجل التدقيق.", zh: "针对合同 CT-5520 的 184 万里亚尔索赔 CL-77310 已完成审计;检测并拦截了一张重复发票(INV-55021),避免了 184 万里亚尔的合同超支。授权官员核准了单笔 184 万里亚尔净额付款单,并建议了相应的 SAP 分录。完整链条——发票、里程碑、审批——均保存在审计轨迹中。" },
        rows: [
          { l: { en: "Claim", ar: "المطالبة", zh: "索赔" }, v: "CL-77310" },
          { l: { en: "Duplicate blocked", ar: "المكررة المحجوبة", zh: "拦截的重复项" }, v: "INV-55021" },
          { l: { en: "Payment approved", ar: "الدفعة المعتمدة", zh: "已核准付款" }, v: "SAR 1.84M" }] },
      out: { en: "Summary ready for the Audit Department.", ar: "الملخص جاهز لإدارة التدقيق.", zh: "摘要已就绪,提交给审计部门。" },
      metric: { en: "PDF ready", ar: "جاهز PDF", zh: "PDF 就绪" } },
  ],
};

const LINEAGE = [
  { en: "Report: Fiscal space SAR 4.82B", ar: "التقرير: الحيز المالي 4.82 مليار", zh: "报告:财政空间 48.2 亿", node: "report" },
  { en: "Analysis: ceiling − commitments − plan − reserve", ar: "التحليل: السقف − الالتزامات − الخطة − الحجز", zh: "分析:上限 − 承诺 − 计划 − 预留", node: "analysis" },
  { en: "Standardized: GL 5100 consolidated", ar: "موحّد: تجميع الحساب 5100", zh: "标准化:科目 5100 汇总", node: "fact" },
  { en: "Source: SAP/Asas · Etimad", ar: "المصدر: ساب/أساس · اعتماد", zh: "来源:SAP/Asas · Etimad", node: "data" },
];

/* =========================================================================
   UC-06 — Financial Performance Analysis data
   ========================================================================= */
const UC_KPIS = [
  { key: "kp_orig", value: "16,532", unit: "M", tag: "flat", sub: "kp_orig_s" },
  { key: "kp_rev", value: "3,420", unit: "M", tag: "flat", sub: "kp_rev_s" },
  { key: "kp_cur", value: "17,370", unit: "M", tag: "up", sub: "kp_cur_s" },
  { key: "kp_act", value: "11,117", unit: "M", tag: "down", sub: "kp_act_s" },
  { key: "kp_rem", value: "6,253", unit: "M", tag: "flat", sub: "kp_rem_s" },
  { key: "kp_rate", value: "64.0", unit: "%", tag: "down", sub: "kp_rate_s" },
  { key: "kp_chg", value: "838", unit: "M", tag: "flat", sub: "kp_chg_s" },
];
const UC_MAP = [
  { id: "nb", x: 168, y: 46, rate: 71, name: { en: "Northern Borders", ar: "الحدود الشمالية", zh: "北部边境" } },
  { id: "jouf", x: 188, y: 60, rate: 80, name: { en: "Al Jouf", ar: "الجوف", zh: "焦夫" } },
  { id: "tabuk", x: 120, y: 88, rate: 66, name: { en: "Tabuk", ar: "تبوك", zh: "塔布克" } },
  { id: "hail", x: 215, y: 100, rate: 73, name: { en: "Hail", ar: "حائل", zh: "哈伊勒" } },
  { id: "qassim", x: 250, y: 122, rate: 77, name: { en: "Qassim", ar: "القصيم", zh: "卡西姆" } },
  { id: "east", x: 300, y: 152, rate: 62, name: { en: "Eastern Province", ar: "الشرقية", zh: "东部省" } },
  { id: "mad", x: 155, y: 140, rate: 54, name: { en: "Madinah", ar: "المدينة", zh: "麦地那" } },
  { id: "ruh", x: 272, y: 158, rate: 78, name: { en: "Riyadh", ar: "الرياض", zh: "利雅得" } },
  { id: "mak", x: 138, y: 188, rate: 63, name: { en: "Makkah", ar: "مكة", zh: "麦加" } },
  { id: "baha", x: 168, y: 206, rate: 41, name: { en: "Al Baha", ar: "الباحة", zh: "巴哈" } },
  { id: "asir", x: 190, y: 226, rate: 88, name: { en: "Asir", ar: "عسير", zh: "阿西尔" } },
  { id: "najran", x: 240, y: 238, rate: 69, name: { en: "Najran", ar: "نجران", zh: "纳季兰" } },
  { id: "jazan", x: 182, y: 256, rate: 58, name: { en: "Jazan", ar: "جازان", zh: "吉赞" } },
];
const UC_SPEND = [
  { m: "Jan", budget: 3127, actual: 1890 }, { m: "Feb", budget: 3821, actual: 2446 },
  { m: "Mar", budget: 4516, actual: 3002 }, { m: "Apr", budget: 5906, actual: 3780 },
];
const UC_SERVICES = [
  { name: { en: "Developmental Housing", ar: "الإسكان التنموي", zh: "发展性住房" }, pct: 96.8, actual: 4047, budget: 4181 },
  { name: { en: "Real Estate Development", ar: "التطوير العقاري", zh: "房地产开发" }, pct: 95.3, actual: 3749, budget: 3934 },
  { name: { en: "Parks", ar: "الحدائق", zh: "公园" }, pct: 97.6, actual: 2480, budget: 2539 },
  { name: { en: "Roads", ar: "الطرق", zh: "道路" }, pct: 95.3, actual: 2349, budget: 2465 },
  { name: { en: "Financial Support", ar: "الدعم المالي", zh: "财政支持" }, pct: 95.1, actual: 2104, budget: 2212 },
];
const UC_VISION = [
  { name: "Housing Program 2.0", port: { en: "Housing & Urban", ar: "الإسكان والحضري", zh: "住房与城市" }, b: 4531, a: 4525, r: 7, rate: "99.9%" },
  { name: "Supported Housing Financial Sc.", port: { en: "Housing Support", ar: "دعم الإسكان", zh: "住房支持" }, b: 4470, a: 4470, r: 0, rate: "100.0%" },
  { name: "Flood Risk Mitigation - Phase 1", port: { en: "Water & Drainage", ar: "المياه والصرف", zh: "水与排水" }, b: 2943, a: 2901, r: 41, rate: "98.6%" },
  { name: "Urban Roads Development - Ph.2", port: { en: "Roads & Mobility", ar: "الطرق والتنقل", zh: "道路与交通" }, b: 1919, a: 1893, r: 26, rate: "98.6%" },
  { name: "Land Expropriation", port: { en: "Land & Assets", ar: "الأراضي والأصول", zh: "土地与资产" }, b: 1806, a: 1524, r: 282, rate: "84.4%" },
  { name: "Riyadh Road Rehabilitation", port: { en: "Roads & Mobility", ar: "الطرق والتنقل", zh: "道路与交通" }, b: 1701, a: 1672, r: 30, rate: "98.3%" },
];
const REVENUE_SOURCES = [
  { key: "wl", name: { en: "White Lands Fees", ar: "رسوم الأراضي البيضاء", zh: "白地费" }, net: 2323, collected: 1580, weight: 32.6, color: "#1B8354" },
  { key: "tb", name: { en: "Tobacco Revenue", ar: "إيرادات التبغ", zh: "烟草收入" }, net: 1045, collected: 857, weight: 14.9, color: "#2563eb" },
  { key: "ac", name: { en: "Accommodation Revenue", ar: "إيرادات الإيواء", zh: "住宿收入" }, net: 1588, collected: 1175, weight: 21.0, color: "#F8C630" },
  { key: "pf", name: { en: "Penalties & Fines", ar: "الغرامات والمخالفات", zh: "罚款与罚金" }, net: 1412, collected: 1076, weight: 18.4, color: "#6d5ae6" },
  { key: "om", name: { en: "Other Municipal Revenues", ar: "إيرادات بلدية أخرى", zh: "其他市政收入" }, net: 927, collected: 661, weight: 13.0, color: "#e32700" },
];
const AR_LEGEND = [{ k: "rp_unpaid", v: "1260 M", c: "#e32700" }, { k: "rp_exec", v: "790 M", c: "#e29700" }, { k: "rp_done", v: "540 M", c: "#1B8354" }];
const AR_BUCKETS = ["buck_current", "1M", "2M", "3M", "4M", "5M", "6M+"];
const AR_MATRIX = [
  { m: "Nov 2025", v: [0.0, 0.2, 0.5, 1.0, 2.4, 5.2, 10.4] }, { m: "Dec 2025", v: [0.0, 0.3, 0.8, 1.5, 3.6, 5.6, 7.6] },
  { m: "Jan 2026", v: [0.2, 0.7, 1.6, 2.9, 4.9, 5.1, 4.9] }, { m: "Feb 2026", v: [0.5, 1.4, 2.9, 4.1, 4.9, 3.6, 2.1] },
  { m: "Mar 2026", v: [1.8, 3.2, 4.3, 4.0, 3.2, 1.5, 0.8] }, { m: "Apr 2026", v: [5.0, 4.5, 3.6, 2.5, 1.7, 0.6, 0.4] },
];
const REGIONAL_ACHIEVE = [
  { name: { en: "Riyadh Amana", ar: "أمانة الرياض", zh: "利雅得阿玛纳" }, pct: 79.4, target: 82.0 },
  { name: { en: "Eastern Province Amana", ar: "أمانة المنطقة الشرقية", zh: "东部省阿玛纳" }, pct: 90.2, target: 86.0 },
  { name: { en: "Al Madinah Amana", ar: "أمانة المدينة المنورة", zh: "麦地那阿玛纳" }, pct: 63.5, target: 75.0 },
  { name: { en: "Makkah Amana", ar: "أمانة مكة المكرمة", zh: "麦加阿玛纳" }, pct: 81.2, target: 80.0 },
  { name: { en: "Asir Amana", ar: "أمانة عسير", zh: "阿西尔阿玛纳" }, pct: 88.0, target: 84.0 },
];
function arHeat(v) { if (v <= 0.3) return ["#f7faf8", "#5c6b63"]; if (v <= 1) return ["#fef7e0", "#6b5210"]; if (v <= 2) return ["#fdeab8", "#6b5210"]; if (v <= 3) return ["#fcd987", "#6b4e10"]; if (v <= 4) return ["#f7b65d", "#5a3a08"]; if (v <= 5) return ["#ef8f4a", "#fff"]; if (v <= 6) return ["#e3683f", "#fff"]; if (v <= 8) return ["#d24a36", "#fff"]; return ["#b42318", "#fff"]; }
/* =========================================================================
   G-06 — Revenues & Assets storyline (function-labeled; no UC codes shown)
   ========================================================================= */
const REV_TOTALS = (function () { var b = 0, c = 0; REVENUE_SOURCES.forEach(function (s) { b += s.net; c += s.collected; }); return { billed: b, collected: c, rate: +(c / b * 100).toFixed(1), excl: 212 }; })();
const REV_DEVIATIONS = [
  { a: { en: "Asir Amana · collection gap", ar: "أمانة عسير · فجوة تحصيل", zh: "阿西尔阿玛纳 · 征收缺口" }, v: "14%", f: "red" },
  { a: { en: "Penalties feed delay", ar: "تأخر تغذية الغرامات", zh: "罚款数据延迟" }, v: "> SLA", f: "amber" },
  { a: { en: "Other revenues", ar: "إيرادات أخرى", zh: "其他收入" }, v: "on plan", f: "info" },
];
const ASSET_REGISTER = [
  { cls: { en: "Land", ar: "الأراضي", zh: "土地" }, value: 6200, cap: 0, life: "—", ret: "—", status: "active" },
  { cls: { en: "Buildings", ar: "المباني", zh: "建筑" }, value: 3450, cap: 620, life: 40, ret: "4.2%", status: "active" },
  { cls: { en: "Roads infrastructure", ar: "البنية التحتية للطرق", zh: "道路基础设施" }, value: 4180, cap: 540, life: 25, ret: "—", status: "maint" },
  { cls: { en: "Stormwater networks", ar: "شبكات تصريف الأمطار", zh: "雨水管网" }, value: 1920, cap: 310, life: 30, ret: "—", status: "active" },
  { cls: { en: "Parks", ar: "الحدائق", zh: "公园" }, value: 1240, cap: 180, life: 20, ret: "3.1%", status: "active" },
  { cls: { en: "Equipment & vehicles", ar: "المعدات والمركبات", zh: "设备与车辆" }, value: 760, cap: 270, life: 8, ret: "—", status: "impair" },
];
const ASSET_CAP = { aucOpen: 3.10, capitalized: 1.92, aucClose: 1.18, impair: 3, maintDue: 12 };
const ASSIGNMENT_ORDERS = [
  { id: "AO-2207", proj: { en: "White Lands servicing", ar: "تطوير الأراضي البيضاء", zh: "白地配套" }, fund: { en: "Real Estate Dev Fund", ar: "صندوق التطوير العقاري", zh: "房地产开发基金" }, alloc: 320, spent: 235, unit: "SAR 142/m²", flag: "idle" },
  { id: "AO-2211", proj: { en: "Housing Program 2.0 plots", ar: "أراضي برنامج الإسكان 2.0", zh: "住房计划2.0地块" }, fund: { en: "Real Estate Dev Fund", ar: "صندوق التطوير العقاري", zh: "房地产开发基金" }, alloc: 540, spent: 533, unit: "SAR 310k/unit", flag: "ok" },
  { id: "AO-1185", proj: { en: "Industrial land preparation", ar: "تهيئة الأراضي الصناعية", zh: "工业用地整备" }, fund: { en: "Industrial Dev Fund", ar: "صندوق التنمية الصناعية", zh: "工业发展基金" }, alloc: 410, spent: 388, unit: "SAR 96/m²", flag: "ok" },
  { id: "AO-3302", proj: { en: "Park land compensation", ar: "تعويض أراضي الحدائق", zh: "公园用地补偿" }, fund: { en: "General", ar: "عام", zh: "一般" }, alloc: 180, spent: 96, unit: "—", flag: "pending" },
];
const STORY_REVENUE_ASSETS = {
  key: "revassets",
  nodes: [
    { kind: "data", icon: "⛁",
      title: { en: "Consolidate revenue & asset data", ar: "تجميع بيانات الإيرادات والأصول", zh: "汇聚收入与资产数据" },
      actor: { en: "System / Orchestrator", ar: "النظام / المنسّق", zh: "系统 / 编排器" },
      desc: { en: "Pull billing & collection (Tahseel, Makeen, Efaa, Sanad), revenue exclusions, and asset records (SAP, Esnad, Balady); standardize and validate.", ar: "سحب الفوترة والتحصيل (تحصيل، مكين، إيفاء، سند)، والاستبعادات، وسجلات الأصول (ساب، إسناد، بلدي)؛ ثم التوحيد والتحقق.", zh: "拉取开票与征收(Tahseel、Makeen、Efaa、Sanad)、收入排除项及资产记录(SAP、Esnad、Balady);标准化并校验。" },
      out: { en: "Unified revenue & asset dataset — 6 Amanas, FY2026.", ar: "مجموعة بيانات موحّدة للإيرادات والأصول — 6 أمانات، 2026.", zh: "统一的收入与资产数据集——6 个阿玛纳,2026 财年。" },
      metric: { en: "6 Amanas", ar: "6 أمانات", zh: "6 个阿玛纳" } },
    { kind: "revenue", icon: "💰",
      title: { en: "Revenue & collection analysis", ar: "تحليل الإيرادات والتحصيل", zh: "收入与征收分析" },
      actor: { en: "Revenue Agent", ar: "وكيل الإيرادات", zh: "收入智能体" },
      desc: { en: "Consolidate billing → collection → exclusions across sources; compute net billed, collected and collection rate.", ar: "تجميع الفوترة ← التحصيل ← الاستبعادات عبر المصادر؛ وحساب صافي الفوترة والمحصّل ونسبة التحصيل.", zh: "跨来源汇总 开票→征收→排除;计算净开票、已征收与征收率。" },
      out: { en: "Net billed SAR 7.30B, collected SAR 5.35B (73.3%); SAR 212M exclusions flagged.", ar: "صافي الفوترة 7.30 مليار ريال، المحصّل 5.35 مليار (73.3٪)؛ ورصد 212 مليون استبعادات.", zh: "净开票 73.0 亿里亚尔,已征收 53.5 亿(73.3%);标记排除项 2.12 亿。" },
      metric: { en: "73.3% collected", ar: "73.3٪ تحصيل", zh: "征收率 73.3%" } },
    { kind: "perfdev", icon: "◉",
      title: { en: "Performance & deviation scan", ar: "فحص الأداء والانحراف", zh: "绩效与偏差扫描" },
      actor: { en: "Performance + Deviation Agents", ar: "وكيلا الأداء والانحراف", zh: "绩效 + 偏差智能体" },
      desc: { en: "Link revenue indicators to performance and scan for collection-gap and abnormal-revenue deviations.", ar: "ربط مؤشرات الإيراد بالأداء وفحص فجوات التحصيل والانحرافات غير الاعتيادية.", zh: "将收入指标关联绩效,并扫描征收缺口与异常收入偏差。" },
      out: { en: "1 high-risk collection gap (Asir 14%); revenue performance otherwise on plan.", ar: "فجوة تحصيل عالية الخطورة (عسير 14٪)؛ وبقية الأداء ضمن الخطة.", zh: "1 项高风险征收缺口(阿西尔 14%);其余收入绩效符合计划。" },
      metric: { en: "1 alert", ar: "تنبيه واحد", zh: "1 个告警" } },
    { kind: "assets", icon: "🏛",
      title: { en: "Asset classification, capitalization & returns", ar: "تصنيف الأصول والرسملة والعوائد", zh: "资产分类、资本化与回报" },
      actor: { en: "Asset Agent", ar: "وكيل الأصول", zh: "资产智能体" },
      desc: { en: "Classify assets by policy & useful life, capitalize completed assets-under-construction, and measure returns, maintenance and impairment.", ar: "تصنيف الأصول وفق السياسة والعمر الإنتاجي، ورسملة الأصول تحت الإنشاء المكتملة، وقياس العوائد والصيانة وانخفاض القيمة.", zh: "按政策与使用年限分类资产,资本化已完工的在建资产,并衡量回报、维护与减值。" },
      out: { en: "SAR 1.92B capitalized from AUC; 3 items flagged for impairment; 12 due maintenance.", ar: "رسملة 1.92 مليار ريال من أصول تحت الإنشاء؛ ورصد 3 أصول لانخفاض القيمة؛ و12 مستحقة للصيانة.", zh: "从在建资产资本化 19.2 亿里亚尔;3 项标记减值;12 项待维护。" },
      metric: { en: "SAR 1.92B capitalized", ar: "رسملة 1.92 مليار", zh: "资本化 19.2 亿" } },
    { kind: "cost", icon: "🧮",
      title: { en: "Cost, assignment orders & funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与基金" },
      actor: { en: "Cost + Compliance Agents", ar: "وكيلا التكاليف والامتثال", zh: "成本 + 合规智能体" },
      desc: { en: "Compute unit cost per assignment order, link orders to development funds, verify IPSAS capitalization/exclusion compliance, and surface idle fund surpluses.", ar: "حساب تكلفة الوحدة لكل أمر إسناد، وربط الأوامر بصناديق التطوير، والتحقق من رسملة IPSAS والاستبعاد، وإبراز فوائض الصناديق الخاملة.", zh: "计算每个派工单的单位成本,将派工单关联开发基金,核验 IPSAS 资本化/排除合规,并暴露闲置基金结余。" },
      out: { en: "Idle surplus SAR 85M on AO-2207 (Real Estate Dev Fund, 120 days no activity); compliance passed (1 note).", ar: "فائض خامل 85 مليون ريال على AO-2207 (صندوق التطوير العقاري، 120 يوماً دون حركة)؛ والامتثال ناجح (ملاحظة واحدة).", zh: "AO-2207 闲置结余 8,500 万里亚尔(房地产开发基金,120 天无活动);合规通过(1 条提示)。" },
      metric: { en: "SAR 85M idle", ar: "85 مليون خامل", zh: "8,500 万闲置" } },
    { kind: "review", icon: "✦",
      title: { en: "AI recommendation — surplus release & capitalization", ar: "توصية — الإفراج عن الفائض والرسملة", zh: "AI 建议——结余释放与资本化" },
      actor: { en: "Reallocation Agent → Human reviewer", ar: "وكيل إعادة التوزيع ← المراجع البشري", zh: "调拨智能体 → 人工复核" },
      desc: { en: "The agent proposes releasing the idle fund surplus and capitalizing completed assets — both within fund rules and accounting policy.", ar: "يقترح الوكيل الإفراج عن الفائض الخامل ورسملة الأصول المكتملة — ضمن قواعد الصندوق والسياسة المحاسبية.", zh: "智能体建议释放闲置基金结余并资本化已完工资产——均在基金规则与会计政策之内。" },
      review: {
        headline: { en: "Release SAR 85M idle surplus from assignment order AO-2207 to the central liquidity pool, and capitalize SAR 1.92B of completed assets-under-construction into in-service assets.", ar: "الإفراج عن فائض خامل 85 مليون ريال من أمر الإسناد AO-2207 إلى مجمع السيولة المركزي، ورسملة 1.92 مليار ريال من الأصول تحت الإنشاء المكتملة إلى أصول في الخدمة.", zh: "将派工单 AO-2207 的 8,500 万里亚尔闲置结余释放至中央流动性池,并将 19.2 亿里亚尔已完工在建资产资本化为在用资产。" },
        conf: 86,
        why: { en: "AO-2207 (Real Estate Development Fund) is allocated SAR 320M and has spent SAR 235M (73%), with no disbursement for 120 days and its milestone delivered — leaving SAR 85M idle. The completed assets-under-construction meet the approved useful-life and capitalization policy. Both actions stay within fund rules and accounting standards.", ar: "أمر الإسناد AO-2207 (صندوق التطوير العقاري) مخصّص له 320 مليون ريال وصُرف منه 235 مليون (73٪)، دون صرف منذ 120 يوماً ومع إنجاز مرحلته — ليتبقى 85 مليون خاملة. وتستوفي الأصول تحت الإنشاء المكتملة سياسة العمر الإنتاجي والرسملة المعتمدة. ويبقى الإجراءان ضمن قواعد الصندوق والمعايير المحاسبية.", zh: "AO-2207(房地产开发基金)分配 3.2 亿里亚尔,已花 2.35 亿(73%),120 天无支付且里程碑已交付——剩余 8,500 万闲置。已完工在建资产符合核定的使用年限与资本化政策。两项操作均在基金规则与会计准则之内。" },
        srcs: ["SAP · AUC ledger", "Esnad · AO-2207", "Real Estate Dev Fund", "Policy AP-17"],
        approveLog: { en: "Approved surplus release SAR 85M (AO-2207) and capitalization of SAR 1.92B AUC into service", ar: "اعتماد الإفراج عن فائض 85 مليون ريال (AO-2207) ورسملة 1.92 مليار من الأصول تحت الإنشاء", zh: "已批准结余释放 8,500 万里亚尔(AO-2207)及资本化 19.2 亿在建资产" } },
      out: { en: "Surplus release and capitalization reclass recorded after approval.", ar: "تسجيل الإفراج عن الفائض وإعادة تصنيف الرسملة بعد الاعتماد.", zh: "经批准后已记录结余释放与资本化重分类。" },
      metric: { en: "needs approval", ar: "يلزم اعتماد", zh: "需审批" } },
    { kind: "report", icon: "📄",
      title: { en: "Revenue & assets report + audit", ar: "تقرير الإيرادات والأصول + التدقيق", zh: "收入与资产报告 + 审计" },
      actor: { en: "Reporting Agent → Human approval", ar: "وكيل التقارير ← اعتماد بشري", zh: "报告智能体 → 人工审批" },
      desc: { en: "Generate the revenue & assets narrative report and expose smart query, audit log and permission scope for the directorate.", ar: "إنشاء التقرير السردي للإيرادات والأصول وإتاحة الاستعلام الذكي وسجل التدقيق ونطاق الصلاحية للإدارة.", zh: "生成收入与资产叙述性报告,并向该总局提供智能查询、审计日志与权限范围。" },
      report: {
        title: { en: "Revenue & Assets — FY2026 Q2", ar: "الإيرادات والأصول — الربع الثاني 2026", zh: "收入与资产 — 2026 二季度" },
        narrative: { en: "Cumulative net billing reached SAR 7.30B with SAR 5.35B collected (73.3%); the widest collection gap is Asir Amana at 14%, which raised an early-warning. Assets-under-construction of SAR 1.92B were capitalized into service under the approved useful-life policy, with 3 equipment items flagged for impairment and road infrastructure maintenance due. An idle fund surplus of SAR 85M (assignment order AO-2207, Real Estate Development Fund, 120 days no activity) was released to the central liquidity pool after approval. All figures are traceable from Tahseel/Makeen collection records and SAP/Esnad asset registers.", ar: "بلغ صافي الفوترة التراكمي 7.30 مليار ريال مع تحصيل 5.35 مليار (73.3٪)؛ وأكبر فجوة تحصيل في أمانة عسير عند 14٪، ما أطلق تنبيهاً مبكراً. ورُسملت أصول تحت الإنشاء بقيمة 1.92 مليار ريال إلى الخدمة وفق سياسة العمر الإنتاجي المعتمدة، مع رصد 3 معدات لانخفاض القيمة واستحقاق صيانة البنية التحتية للطرق. وأُفرج عن فائض خامل 85 مليون ريال (أمر الإسناد AO-2207، صندوق التطوير العقاري، 120 يوماً دون حركة) إلى مجمع السيولة المركزي بعد الاعتماد. وجميع الأرقام قابلة للتتبع من سجلات تحصيل/مكين وسجلات أصول ساب/إسناد.", zh: "累计净开票达 73.0 亿里亚尔,已征收 53.5 亿(73.3%);最大征收缺口在阿西尔阿玛纳,达 14%,已触发预警。19.2 亿里亚尔在建资产按核定使用年限政策资本化入用,其中 3 项设备标记减值、道路基础设施待维护。经批准后,8,500 万里亚尔闲置基金结余(派工单 AO-2207,房地产开发基金,120 天无活动)已释放至中央流动性池。所有数字均可从 Tahseel/Makeen 征收记录与 SAP/Esnad 资产台账追溯。" },
        rows: [
          { l: { en: "Net billed", ar: "صافي الفوترة", zh: "净开票" }, v: "SAR 7.30B" },
          { l: { en: "Collected (73.3%)", ar: "المحصّل (73.3٪)", zh: "已征收(73.3%)" }, v: "SAR 5.35B" },
          { l: { en: "Capitalized", ar: "المرسمَل", zh: "已资本化" }, v: "SAR 1.92B" },
          { l: { en: "Surplus released", ar: "الفائض المُفرَج", zh: "释放结余" }, v: "SAR 85M" }] },
      queryaudit: true,
      out: { en: "Report ready for the Directorate of Revenues and Assets.", ar: "التقرير جاهز للإدارة العامة للإيرادات والأصول.", zh: "报告已就绪,提交给收入与资产总局。" },
      metric: { en: "PDF ready", ar: "جاهز PDF", zh: "PDF 就绪" } },
  ],
};
/* =========================================================================
   G-02 (planning) & G-05 (reporting) storylines — adds forecasting (UC-04),
   scenario simulation (UC-05) and financial closing / reconciliation (UC-09).
   ========================================================================= */
const FORECAST_OBLIG = [
  { m: "M1", oblig: 980, space: 4820 }, { m: "M2", oblig: 1120, space: 4710 }, { m: "M3", oblig: 1290, space: 4560 },
  { m: "M4", oblig: 1480, space: 4380 }, { m: "M5", oblig: 1660, space: 4170 }, { m: "M6", oblig: 1880, space: 3920 },
];
const SCENARIOS = [
  { key: "opt", space: 5.40, oblig: 1.10, cover: "strong" },
  { key: "base", space: 4.82, oblig: 1.30, cover: "adequate", rec: true },
  { key: "pess", space: 4.10, oblig: 1.55, cover: "watch" },
];
const RECON_ROWS = [
  { ent: { en: "SAP GL", ar: "أستاذ ساب", zh: "SAP 总账" }, book: 12840, sys: 12840, diff: 0, st: "matched" },
  { ent: { en: "Etimad commitments", ar: "التزامات اعتماد", zh: "Etimad 承诺" }, book: 6210, sys: 6188, diff: 22, st: "ureview" },
  { ent: { en: "Esnad assignment", ar: "إسناد", zh: "Esnad 派工" }, book: 1920, sys: 1905, diff: 15, st: "adjust" },
  { ent: { en: "Tahseel revenue", ar: "تحصيل", zh: "Tahseel 收入" }, book: 5349, sys: 5361, diff: -12, st: "adjust" },
];
const STORY_PLANNING = {
  key: "planning",
  nodes: [
    { kind: "data", uc: "UC-01", icon: "⛁",
      title: { en: "Consolidate planning data", ar: "تجميع بيانات التخطيط", zh: "汇聚规划数据" },
      actor: { en: "System / Orchestrator", ar: "النظام / المنسّق", zh: "系统 / 编排器" },
      desc: { en: "Pull approved ceilings, commitments, payment plans and historical actuals from SAP, Etimad and GRP; standardize and validate.", ar: "سحب السقوف والالتزامات وخطط الدفع والفعلي التاريخي من ساب واعتماد وGRP؛ ثم التوحيد والتحقق.", zh: "从 SAP、Etimad、GRP 拉取核定上限、承诺、付款计划与历史实绩;标准化并校验。" },
      out: { en: "Validated planning dataset — 6 Amanas, FY2026.", ar: "مجموعة بيانات تخطيط متحقق منها — 6 أمانات، 2026.", zh: "已校验的规划数据集——6 个阿玛纳,2026 财年。" },
      metric: { en: "6 Amanas", ar: "6 أمانات", zh: "6 个阿玛纳" } },
    { kind: "fiscal", uc: "UC-07", icon: "∑",
      title: { en: "Budget planning & fiscal space", ar: "تخطيط الميزانية والحيز المالي", zh: "预算规划与财政空间" },
      actor: { en: "Budget Planning Agent", ar: "وكيل تخطيط الميزانية", zh: "预算规划智能体" },
      desc: { en: "Allocate ceilings and compute available fiscal space = ceiling − commitments − payment plan − reservations.", ar: "توزيع السقوف وحساب الحيز المالي = السقف − الالتزامات − خطة الدفع − الحجوزات.", zh: "分配上限并计算可用财政空间 = 上限 − 承诺 − 付款计划 − 预留。" },
      fiscal: { ceiling: 6.40, commit: 0.98, plan: 0.42, reserve: 0.18, space: 4.82 },
      out: { en: "Available fiscal space SAR 4.82B established as the planning baseline.", ar: "تحديد الحيز المالي المتاح 4.82 مليار ريال كأساس للتخطيط.", zh: "确立可用财政空间 48.2 亿里亚尔作为规划基线。" },
      metric: { en: "SAR 4.82B", ar: "4.82 مليار", zh: "48.2 亿" } },
    { kind: "forecast", uc: "UC-04", icon: "📈",
      title: { en: "Forecast future obligations", ar: "التنبؤ بالالتزامات المستقبلية", zh: "预测未来义务" },
      actor: { en: "Forecasting Agent", ar: "وكيل التنبؤ", zh: "预测智能体" },
      desc: { en: "Produce a rolling forecast of obligations and needs against available fiscal space over the next 6 periods.", ar: "إنتاج تنبؤ متجدد للالتزامات والاحتياجات مقابل الحيز المالي المتاح لـ6 فترات قادمة.", zh: "对未来 6 期的义务与需求相对可用财政空间做滚动预测。" },
      out: { en: "Obligations forecast to rise to SAR 1.88B by M6 vs fiscal space declining to SAR 3.92B (MAPE ≤ 12%).", ar: "يُتوقع ارتفاع الالتزامات إلى 1.88 مليار ريال في الشهر 6 مقابل انخفاض الحيز إلى 3.92 مليار (MAPE ≤ 12٪).", zh: "预计义务到 M6 升至 18.8 亿里亚尔,财政空间降至 39.2 亿(MAPE ≤ 12%)。" },
      metric: { en: "MAPE ≤ 12%", ar: "MAPE ≤ 12٪", zh: "MAPE ≤ 12%" } },
    { kind: "scenario", uc: "UC-05", icon: "⚖",
      title: { en: "Scenario simulation", ar: "محاكاة السيناريوهات", zh: "情景模拟" },
      actor: { en: "Scenario Agent", ar: "وكيل السيناريوهات", zh: "情景智能体" },
      desc: { en: "Simulate optimistic / base / pessimistic scenarios for revenue and obligations and rank fiscal-space coverage.", ar: "محاكاة سيناريوهات متفائل / أساسي / متشائم للإيرادات والالتزامات وترتيب تغطية الحيز المالي.", zh: "对收入与义务模拟乐观/基准/悲观情景,并对财政空间覆盖排序。" },
      out: { en: "Base scenario keeps coverage adequate (space 4.82B vs obligations 1.30B); pessimistic drops to watch.", ar: "يبقي السيناريو الأساسي التغطية كافية (الحيز 4.82 مقابل التزامات 1.30)؛ والمتشائم ينخفض للمراقبة.", zh: "基准情景覆盖适当(空间 4.82 对义务 1.30);悲观降至关注。" },
      metric: { en: "3 scenarios", ar: "3 سيناريوهات", zh: "3 个情景" } },
    { kind: "agent", uc: "UC-06", icon: "◧",
      title: { en: "Performance & variance analysis", ar: "تحليل الأداء والانحراف", zh: "绩效与差异分析" },
      actor: { en: "Performance Agent", ar: "وكيل الأداء", zh: "绩效智能体" },
      desc: { en: "Compare execution to plan and surface the largest variances by area.", ar: "مقارنة التنفيذ بالخطة وإبراز أكبر الانحرافات حسب المجال.", zh: "将执行与计划比对,按领域突出最大差异。" },
      table: { cols: { en: ["Area", "Variance", "Status"], ar: ["المجال", "الانحراف", "الحالة"], zh: ["领域", "差异", "状态"] },
        rows: [{ a: { en: "Operating budget", ar: "الميزانية التشغيلية", zh: "运营预算" }, v: "+2.1%", f: "info" },
               { a: { en: "Capital projects", ar: "المشاريع الرأسمالية", zh: "资本项目" }, v: "-4.6%", f: "amber" },
               { a: { en: "Obligations vs plan", ar: "الالتزامات مقابل الخطة", zh: "义务对比计划" }, v: "+5.0%", f: "red" }] },
      out: { en: "Capital-project execution lags plan by 4.6%; obligations running 5% above plan.", ar: "تنفيذ المشاريع الرأسمالية متأخر 4.6٪؛ والالتزامات أعلى من الخطة بـ5٪.", zh: "资本项目执行落后计划 4.6%;义务高于计划 5%。" },
      metric: { en: "1 high variance", ar: "انحراف مرتفع", zh: "1 项高差异" } },
    { kind: "review", uc: "UC-07", icon: "✦",
      title: { en: "AI recommendation — adopt scenario & reserve", ar: "توصية — اعتماد السيناريو والاحتياطي", zh: "AI 建议——采纳情景与预留" },
      actor: { en: "Planning Agent → Human reviewer", ar: "وكيل التخطيط ← المراجع البشري", zh: "规划智能体 → 人工复核" },
      desc: { en: "The agent recommends adopting the base scenario and lifting the Q3 obligation reserve to preserve coverage.", ar: "يوصي الوكيل باعتماد السيناريو الأساسي ورفع احتياطي التزامات الربع الثالث للحفاظ على التغطية.", zh: "智能体建议采纳基准情景并上调三季度义务预留以维持覆盖。" },
      review: {
        headline: { en: "Adopt the base scenario and raise the Q3 obligation reserve by SAR 150M to keep fiscal-space coverage above 3.5x.", ar: "اعتماد السيناريو الأساسي ورفع احتياطي التزامات الربع الثالث بمقدار 150 مليون ريال للإبقاء على تغطية الحيز فوق 3.5x.", zh: "采纳基准情景,并将三季度义务预留上调 1.5 亿里亚尔,使财政空间覆盖保持在 3.5 倍以上。" },
        conf: 84,
        why: { en: "Across the three scenarios the base case keeps available fiscal space at SAR 4.82B against SAR 1.30B of new obligations (adequate coverage), while the pessimistic case erodes coverage to watch level. A SAR 150M reserve uplift absorbs the forecast obligation growth (MAPE ≤ 12%) without breaching approved ceilings.", ar: "عبر السيناريوهات الثلاثة يبقي السيناريو الأساسي الحيز عند 4.82 مليار مقابل 1.30 مليار التزامات جديدة (تغطية كافية)، بينما يقلّص المتشائم التغطية لمستوى المراقبة. ويستوعب رفع الاحتياطي 150 مليون نموّ الالتزامات المتوقع (MAPE ≤ 12٪) دون تجاوز السقوف.", zh: "三种情景中,基准情景将可用财政空间维持在 48.2 亿里亚尔、对应 13.0 亿新增义务(覆盖适当),而悲观情景将覆盖削弱至关注级。上调 1.5 亿预留可吸收预测的义务增长(MAPE ≤ 12%),且不突破核定上限。" },
        srcs: ["Forecast engine", "Scenario model", "Ceiling rule CR-03"],
        approveLog: { en: "Approved base scenario; Q3 obligation reserve raised by SAR 150M", ar: "اعتماد السيناريو الأساسي؛ ورفع احتياطي التزامات الربع الثالث بمقدار 150 مليون ريال", zh: "已批准基准情景;三季度义务预留上调 1.5 亿里亚尔" } },
      out: { en: "Scenario adopted and reserve adjustment recorded after approval.", ar: "اعتماد السيناريو وتسجيل تعديل الاحتياطي بعد الموافقة.", zh: "经批准后已记录采纳情景与预留调整。" },
      metric: { en: "needs approval", ar: "يلزم اعتماد", zh: "需审批" } },
    { kind: "report", uc: "UC-10", icon: "📄",
      title: { en: "Planning & performance report", ar: "تقرير التخطيط والأداء", zh: "规划与绩效报告" },
      actor: { en: "Reporting Agent → Human approval", ar: "وكيل التقارير ← اعتماد بشري", zh: "报告智能体 → 人工审批" },
      desc: { en: "Generate the planning & performance narrative with the forecast, scenarios and approved decisions.", ar: "إنشاء تقرير التخطيط والأداء السردي مع التنبؤ والسيناريوهات والقرارات المعتمدة.", zh: "生成包含预测、情景与已批准决策的规划与绩效叙述报告。" },
      report: {
        title: { en: "Planning & Performance — FY2026 Q2", ar: "التخطيط والأداء — الربع الثاني 2026", zh: "规划与绩效 — 2026 二季度" },
        narrative: { en: "Rolling forecast projects obligations rising to SAR 1.88B by M6 against available fiscal space declining to SAR 3.92B — coverage stays adequate (MAPE ≤ 12%). Across optimistic/base/pessimistic scenarios the base case was adopted, with a SAR 150M Q3 obligation-reserve uplift approved to preserve coverage. Capital-project execution lags plan by 4.6% and is flagged for follow-up. All figures trace to consolidated budget and commitment records.", ar: "يتوقع التنبؤ المتجدد ارتفاع الالتزامات إلى 1.88 مليار ريال في الشهر 6 مقابل انخفاض الحيز إلى 3.92 مليار — وتبقى التغطية كافية (MAPE ≤ 12٪). وعبر السيناريوهات اعتُمد الأساسي مع رفع احتياطي التزامات الربع الثالث 150 مليون للحفاظ على التغطية. وتنفيذ المشاريع الرأسمالية متأخر 4.6٪ وقد رُصد للمتابعة. وجميع الأرقام قابلة للتتبع إلى سجلات الميزانية والالتزامات.", zh: "滚动预测显示义务到 M6 升至 18.8 亿里亚尔,可用财政空间降至 39.2 亿——覆盖保持适当(MAPE ≤ 12%)。在乐观/基准/悲观情景中采纳基准情景,并批准上调三季度义务预留 1.5 亿以维持覆盖。资本项目执行落后计划 4.6%,已标记跟进。所有数字均可追溯至合并预算与承诺记录。" },
        rows: [
          { l: { en: "Forecast obligations (M6)", ar: "الالتزامات المتوقعة (الشهر 6)", zh: "预测义务(M6)" }, v: "SAR 1.88B" },
          { l: { en: "Adopted scenario", ar: "السيناريو المعتمد", zh: "采纳情景" }, v: { en: "Base", ar: "أساسي", zh: "基准" } },
          { l: { en: "Reserve uplift", ar: "رفع الاحتياطي", zh: "预留上调" }, v: "SAR 150M" }] },
      out: { en: "Report ready for the Directorate of Planning and Financial Performance.", ar: "التقرير جاهز للإدارة العامة للتخطيط والأداء المالي.", zh: "报告已就绪,提交给规划与财务绩效总局。" },
      metric: { en: "PDF ready", ar: "جاهز PDF", zh: "PDF 就绪" } },
  ],
};
const STORY_REPORTING = {
  key: "reporting",
  nodes: [
    { kind: "data", uc: "UC-01", icon: "⛁",
      title: { en: "Consolidate period data", ar: "تجميع بيانات الفترة", zh: "汇聚期间数据" },
      actor: { en: "System / Orchestrator", ar: "النظام / المنسّق", zh: "系统 / 编排器" },
      desc: { en: "Pull period balances, commitments, revenue and asset records from SAP, Etimad, Esnad and Tahseel; standardize and validate.", ar: "سحب أرصدة الفترة والالتزامات والإيرادات وسجلات الأصول من ساب واعتماد وإسناد وتحصيل؛ ثم التوحيد والتحقق.", zh: "从 SAP、Etimad、Esnad、Tahseel 拉取期间余额、承诺、收入与资产记录;标准化并校验。" },
      out: { en: "Validated period dataset ready for closing.", ar: "مجموعة بيانات الفترة جاهزة للإقفال.", zh: "已校验的期间数据集,可供关账。" },
      metric: { en: "FY2026 · Q2", ar: "2026 · ربع 2", zh: "2026 · 二季度" } },
    { kind: "closing", uc: "UC-09", icon: "⇄",
      title: { en: "Financial closing & reconciliation", ar: "الإقفال المالي والتسوية", zh: "财务关账与对账" },
      actor: { en: "Reconciliation Agent", ar: "وكيل التسوية", zh: "对账智能体" },
      desc: { en: "Run pre-close validation, reconcile balances between entities and systems, and detect differences for adjustment.", ar: "تشغيل التحقق قبل الإقفال، وتسوية الأرصدة بين الجهات والأنظمة، وكشف الفروقات للتسوية.", zh: "执行关账前校验,在主体与系统间对账,并检出待调整差异。" },
      out: { en: "Pre-close validation passed; 2 reconciliation differences detected (net SAR 25M) for adjustment.", ar: "اجتياز التحقق قبل الإقفال؛ ورصد فرقين للتسوية (صافي 25 مليون ريال).", zh: "关账前校验通过;检出 2 项对账差异(净 2,500 万里亚尔)待调整。" },
      metric: { en: "2 differences", ar: "فرقان", zh: "2 项差异" } },
    { kind: "agent", uc: "UC-11", icon: "🛡",
      title: { en: "Compliance & accounting memos", ar: "الامتثال والمذكرات المحاسبية", zh: "合规与会计备忘" },
      actor: { en: "Compliance Agent", ar: "وكيل الامتثال", zh: "合规智能体" },
      desc: { en: "Verify IPSAS treatment, working papers and accounting memos for the closing.", ar: "التحقق من معالجة IPSAS وأوراق العمل والمذكرات المحاسبية للإقفال.", zh: "为关账核验 IPSAS 处理、工作底稿与会计备忘。" },
      table: { cols: { en: ["Check", "Result"], ar: ["الفحص", "النتيجة"], zh: ["检查", "结果"] },
        rows: [{ a: { en: "IPSAS accrual treatment", ar: "معالجة الاستحقاق IPSAS", zh: "IPSAS 权责发生制处理" }, v: { en: "Pass", ar: "مجتاز", zh: "通过" }, f: "info" },
               { a: { en: "Capitalization policy", ar: "سياسة الرسملة", zh: "资本化政策" }, v: { en: "Pass", ar: "مجتاز", zh: "通过" }, f: "info" },
               { a: { en: "Accounting memo", ar: "مذكرة محاسبية", zh: "会计备忘" }, v: { en: "1 note attached", ar: "ملاحظة مرفقة", zh: "已附 1 条说明" }, f: "amber" }] },
      out: { en: "Compliant — working papers and 1 accounting memo attached.", ar: "مطابق — أوراق العمل ومذكرة محاسبية مرفقة.", zh: "合规——已附工作底稿与 1 条会计备忘。" },
      metric: { en: "Compliant", ar: "مطابق", zh: "合规" } },
    { kind: "assets", uc: "UC-12", icon: "🏛",
      title: { en: "Costs & assets close", ar: "إقفال التكاليف والأصول", zh: "成本与资产结账" },
      actor: { en: "Cost + Asset Agents", ar: "وكيلا التكاليف والأصول", zh: "成本 + 资产智能体" },
      desc: { en: "Finalize cost allocation and asset capitalization/impairment for the closing period.", ar: "إنهاء توزيع التكاليف ورسملة/انخفاض قيمة الأصول لفترة الإقفال.", zh: "为关账期间最终确定成本分摊与资产资本化/减值。" },
      out: { en: "SAR 1.92B capitalized; 3 impairments and 12 maintenance items carried into the statements.", ar: "رسملة 1.92 مليار ريال؛ و3 انخفاضات قيمة و12 بند صيانة مدرجة في القوائم.", zh: "资本化 19.2 亿里亚尔;3 项减值与 12 项维护并入报表。" },
      metric: { en: "SAR 1.92B capitalized", ar: "رسملة 1.92 مليار", zh: "资本化 19.2 亿" } },
    { kind: "review", uc: "UC-09", icon: "✦",
      title: { en: "AI recommendation — adjusting entries", ar: "توصية — قيود التسوية", zh: "AI 建议——调整分录" },
      actor: { en: "Reconciliation Agent → Human reviewer", ar: "وكيل التسوية ← المراجع البشري", zh: "对账智能体 → 人工复核" },
      desc: { en: "The agent proposes corrective journal entries to clear reconciliation differences before close.", ar: "يقترح الوكيل قيود تصحيحية لإغلاق فروقات التسوية قبل الإقفال.", zh: "智能体提议更正分录以在关账前清除对账差异。" },
      review: {
        headline: { en: "Post 2 proposed corrective journal entries (net SAR 25M) to clear reconciliation differences, and confirm SAR 1.92B capitalization before close.", ar: "ترحيل قيدين تصحيحيين مقترحين (صافي 25 مليون ريال) لإغلاق فروقات التسوية، وتأكيد رسملة 1.92 مليار قبل الإقفال.", zh: "过账 2 笔建议的更正分录(净 2,500 万里亚尔)以清除对账差异,并在关账前确认 19.2 亿里亚尔资本化。" },
        conf: 88,
        why: { en: "Two reconciliation differences remain — Esnad assignment (SAR +15M) and Tahseel revenue (SAR −12M); the proposed entries align book to system within tolerance. The capitalization of completed assets-under-construction meets IPSAS policy. Posting clears the pre-close checklist for the period.", ar: "يتبقى فرقان — إسناد (+15 مليون) وتحصيل (−12 مليون)؛ والقيدان المقترحان يوائمان الدفتري مع النظام ضمن الحدود. وتستوفي رسملة الأصول المكتملة سياسة IPSAS. ويُغلق الترحيل قائمة التحقق قبل الإقفال.", zh: "尚余两项差异——Esnad 派工(+1,500 万)与 Tahseel 收入(−1,200 万);建议分录在容差内使账面与系统一致。已完工在建资产的资本化符合 IPSAS 政策。过账后清空本期关账前清单。" },
        srcs: ["SAP GL", "Esnad", "Tahseel", "IPSAS-17"],
        approveLog: { en: "Approved 2 corrective entries (net SAR 25M) and SAR 1.92B capitalization confirmation", ar: "اعتماد قيدين تصحيحيين (صافي 25 مليون ريال) وتأكيد رسملة 1.92 مليار", zh: "已批准 2 笔更正分录(净 2,500 万里亚尔)及 19.2 亿资本化确认" } },
      out: { en: "Adjusting entries posted and period cleared for close after approval.", ar: "ترحيل قيود التسوية وتجهيز الفترة للإقفال بعد الاعتماد.", zh: "经批准后已过账调整分录并使期间可关账。" },
      metric: { en: "needs approval", ar: "يلزم اعتماد", zh: "需审批" } },
    { kind: "report", uc: "UC-10", icon: "📄",
      title: { en: "Financial statements & audit", ar: "القوائم المالية والتدقيق", zh: "财务报表与审计" },
      actor: { en: "Reporting Agent → Human approval", ar: "وكيل التقارير ← اعتماد بشري", zh: "报告智能体 → 人工审批" },
      desc: { en: "Generate the financial statements and closing report and expose smart query, audit log and permission scope.", ar: "إنشاء القوائم المالية وتقرير الإقفال وإتاحة الاستعلام الذكي وسجل التدقيق ونطاق الصلاحية.", zh: "生成财务报表与关账报告,并提供智能查询、审计日志与权限范围。" },
      report: {
        title: { en: "Financial Statements & Closing — FY2026 Q2", ar: "القوائم المالية والإقفال — الربع الثاني 2026", zh: "财务报表与关账 — 2026 二季度" },
        narrative: { en: "Pre-close validation passed after clearing 2 reconciliation differences (net SAR 25M); SAP, Etimad, Esnad and Tahseel balances are reconciled within tolerance. Completed assets-under-construction of SAR 1.92B were capitalized in line with IPSAS, and accounting memos were attached for 1 noted item. The period is ready to close and the financial statements were generated with full traceability and audit trail.", ar: "اجتاز التحقق قبل الإقفال بعد إغلاق فرقي تسوية (صافي 25 مليون ريال)؛ وأرصدة ساب واعتماد وإسناد وتحصيل مسوّاة ضمن الحدود. ورُسملت أصول تحت الإنشاء مكتملة بقيمة 1.92 مليار وفق IPSAS، وأُرفقت مذكرات محاسبية لبند واحد. والفترة جاهزة للإقفال وأُنشئت القوائم المالية بقابلية تتبع كاملة وسجل تدقيق.", zh: "在清除 2 项对账差异(净 2,500 万里亚尔)后,关账前校验通过;SAP、Etimad、Esnad、Tahseel 余额在容差内对平。已完工在建资产 19.2 亿里亚尔按 IPSAS 资本化,并为 1 个注记项附会计备忘。期间可关账,财务报表已生成,具备完整可追溯性与审计轨迹。" },
        rows: [
          { l: { en: "Differences cleared", ar: "الفروقات المغلقة", zh: "已清除差异" }, v: "SAR 25M" },
          { l: { en: "Capitalization", ar: "الرسملة", zh: "资本化" }, v: "SAR 1.92B" },
          { l: { en: "Pre-close checklist", ar: "قائمة ما قبل الإقفال", zh: "关账前清单" }, v: { en: "Ready", ar: "جاهزة", zh: "就绪" } }] },
      queryaudit: true,
      out: { en: "Statements ready for the Directorate of Financial Reporting.", ar: "القوائم جاهزة للإدارة العامة للتقارير المالية.", zh: "报表已就绪,提交给财务报告总局。" },
      metric: { en: "PDF ready", ar: "جاهز PDF", zh: "PDF 就绪" } },
  ],
};
const UC_SLIDES = [
  { id: "syn", chart: "map", title: { en: "I. Executive Synthesis", ar: "أولاً. الخلاصة التنفيذية", zh: "一、执行综述" },
    narr: { en: "The executive report indicates that Asir Amana performs best at the moment, Al Baha Amana needs closer follow-up, and Developmental Housing plus Housing Program 2.0 remain the largest concentrations in the sample.", ar: "يشير التقرير التنفيذي إلى أن أمانة عسير هي الأفضل أداءً حالياً، وأن أمانة الباحة تحتاج إلى متابعة أدق، وأن الإسكان التنموي وبرنامج الإسكان 2.0 يظلان أكبر التركزات في العينة.", zh: "执行报告显示:阿西尔阿玛纳目前表现最佳,巴哈阿玛纳需更密切跟进,发展性住房与住房计划 2.0 仍是样本中最大的集中点。" } },
  { id: "kpi", chart: "kpi", title: { en: "II. Key Highlights", ar: "ثانياً. أبرز المؤشرات", zh: "二、关键要点" },
    narr: { en: "Current budget rose to SAR 17,370M against an original SAR 16,532M; actual spend of SAR 11,117M yields a 64.0% spending rate, leaving SAR 6,253M unspent for the period.", ar: "ارتفعت الميزانية الحالية إلى 17,370 مليون ريال مقابل 16,532 مليون أصلية؛ والإنفاق الفعلي 11,117 مليون يعطي نسبة إنفاق 64.0٪، ويتبقى 6,253 مليون غير مصروف للفترة.", zh: "现行预算升至 173.70 亿里亚尔(原始 165.32 亿);实际支出 111.17 亿,支出率 64.0%,本期尚余 62.53 亿未支出。" } },
  { id: "exp", chart: "spend", title: { en: "III. Preliminary Explanation", ar: "ثالثاً. التفسير الأولي", zh: "三、初步解释" },
    narr: { en: "Spending accelerated from January to April, with actual spend tracking below the rising current-budget line — consistent with a back-loaded execution pattern typical of project-heavy doors.", ar: "تسارع الإنفاق من يناير إلى أبريل، مع بقاء الإنفاق الفعلي دون خط الميزانية الحالية المتصاعد — بما يتسق مع نمط تنفيذ مؤجَّل يغلب على أبواب المشاريع.", zh: "支出从 1 月到 4 月加速,实际支出始终低于上升的现行预算线——与项目类预算门常见的后置执行模式一致。" } },
  { id: "svc", chart: "svc", title: { en: "IV. Service Concentration", ar: "رابعاً. تركّز الخدمات", zh: "四、服务集中度" },
    narr: { en: "Execution rates across the main services are tightly clustered between 95% and 98%, with Parks (97.6%) and Developmental Housing (96.8%) leading; concentration risk sits with the two largest housing lines.", ar: "تتركّز نسب التنفيذ للخدمات الرئيسية بين 95٪ و98٪، وتتصدّر الحدائق (97.6٪) والإسكان التنموي (96.8٪)؛ ويتركّز خطر التركّز في خطّي الإسكان الأكبر.", zh: "主要服务的执行率紧密集中在 95%–98%,公园(97.6%)与发展性住房(96.8%)领先;集中度风险落在两条最大的住房线上。" } },
  { id: "init", chart: "vision", title: { en: "V. Initiative Structure", ar: "خامساً. بنية المبادرات", zh: "五、举措结构" },
    narr: { en: "Vision-program execution is strong overall, but Land Expropriation lags at 84.4% with SAR 282M remaining — the main candidate for a follow-up review.", ar: "تنفيذ برامج الرؤية قوي إجمالاً، لكن نزع الملكية متأخر عند 84.4٪ مع تبقّي 282 مليون ريال — وهو المرشّح الأبرز للمراجعة.", zh: "愿景计划整体执行强劲,但土地征收落后于 84.4%,尚余 2.82 亿里亚尔——是后续复核的主要对象。" } },
  { id: "rec", chart: "none", title: { en: "VI. Recommendations", ar: "سادساً. التوصيات", zh: "六、建议" },
    narr: { en: "Recommend a targeted follow-up on Al Baha Amana (spend rate < 50%) and on Land Expropriation; maintain the current trajectory elsewhere. All recommendations are drafts pending human approval.", ar: "يُوصى بمتابعة موجّهة لأمانة الباحة (نسبة إنفاق < 50٪) ولنزع الملكية؛ والإبقاء على المسار الحالي في غير ذلك. وجميع التوصيات مسودات بانتظار الاعتماد البشري.", zh: "建议对巴哈阿玛纳(支出率 < 50%)和土地征收进行定向跟进;其余维持当前轨迹。所有建议均为待人工审批的草稿。" } },
];

/* =========================================================================
   i18n  (en · ar · zh)
   ========================================================================= */
const I18N = {
  en: {
    appName: "Financial & Budgeting Copilot",
    sso_title: "Momrah Single Sign-On", sso_sub: "Unified national access to the Ministry of Municipalities and Housing digital services.",
    brandLine: "Financial & Budgeting Copilot", signInTitle: "Sign In", identity: "Identity", password: "Password",
    securityCode: "Security code", or_: "or", login_btn: "Login",
    nic1: "NIC", nic2: "National Identity Card", noAccount: "Don't have an account?", createAccount: "Create New Account",
    loginHint: "Password is pre-filled for the demo (no real authentication).",
    copyright: "© 2026 — Ministry of Municipalities and Housing · Agency for Financial Affairs and Budget", syntheticData: "Synthetic demo data — not real records",
    logout: "Sign out", resetDemo: "Reset demo",
    analyst_full: "Financial Data Analyst", manager_full: "Budget Execution Manager", leader_full: "Senior Leadership",
    analyst_desc: "Asks the Orchestrator, runs analyses, handles alerts, builds UC-06 reports, drives budget & claims journeys.",
    manager_desc: "Reviews budget execution, approves reallocations within ceilings, monitors deviations.",
    leader_desc: "Reads executive dashboards and financial reports across the Ministry and its Amanas — read-only.",
    nav_hub: "Hub", nav_chat: "Conversational Analysis", nav_monitor: "Monitoring & Alerts",
    nav_perf: "Performance Analysis", nav_budget: "Budget Execution", nav_claims: "Claims & Disbursement", nav_reports: "Reports",
    eng_orch: "Orchestrator Agent", eng_consol: "Data Consolidation & Quality", eng_deviation: "Deviation & Early Warning",
    eng_forecast: "Forecasting & Scenarios", eng_close: "Reconciliation & Closing", eng_comply: "Compliance & Audit",
    engd_orch: "Routes inquiries across agents, composes outputs, generates reports.",
    engd_consol: "Consolidates & validates data from approved systems (UC-01).",
    engd_deviation: "Detects deviations, anomalies and duplicates; raises alerts (UC-02).",
    engd_forecast: "Rolling forecasts, fiscal space and scenario simulation (UC-04/05/07).",
    engd_close: "Pre-close validation, balance reconciliation and adjustments (UC-09).",
    engd_comply: "IPSAS compliance, accounting memos and audit trail (UC-11/10).",
    eng_orch: "Orchestrator Agent", engd_orch: "Coordinates the agents, schedules tasks and composes the official outputs.",
    eng_forecast: "Financial Forecasting Agent", engd_forecast: "Forecasts revenues, expenses, cash flows and liabilities.",
    eng_rolling: "Rolling Forecasting Agent", engd_rolling: "Continuously updates forecasts as new actuals arrive.",
    eng_scenario: "Scenario Simulation Agent", engd_scenario: "Tests what-if hypotheses and compares alternatives.",
    eng_optimize: "Budget Optimization Agent", engd_optimize: "Proposes the best allocation within approved ceilings.",
    eng_anomaly: "Anomaly Detection Agent", engd_anomaly: "Detects deviations, abnormal balances and duplicate invoices.",
    eng_trends: "Market Trends Agent", engd_trends: "Monitors market trends and cost drivers.",
    eng_insights: "Proactive Insights Agent", engd_insights: "Generates actionable insights and early warnings.",
    eng_narrative: "Narrative Commentary Agent", engd_narrative: "Produces narrative commentary for financial reports.",
    eng_query: "Data Querying Agent", engd_query: "Answers natural-language questions over financial data.",
    eng_reports: "Reports Generation Agent", engd_reports: "Compiles and formats periodic financial reports.",
    eng_revenue: "Revenue Analytics Agent", engd_revenue: "Analyzes billing, collection, exclusions and receivables.",
    eng_compliance: "Compliance / Rules Agent", engd_compliance: "Assesses compliance and supports accounting rules.",
    engines_title: "13 agents · Orchestrator-coordinated", sources_title: "13 integration systems · live health",
    src_etimadp: "Etimad+", src_whiteland: "White Land", src_hyperion: "Hyperion",
    online: "Online", autonomous: "autonomous",
    src_sap: "SAP / Asas", src_etimad: "Etimad", src_esnad: "Esnad", src_grp: "GRP", src_tahseel: "Tahseel",
    src_makeen: "Makeen", src_efaa: "Efaa", src_sanad: "Sanad", src_balady: "Balady", src_gl: "GL", src_bi: "BI Dash",
    hub_hello: "Welcome", hub_sub: "One multi-agent platform · connected financial journeys",
    k_fiscal: "Available fiscal space", k_alerts: "Open deviations", k_util: "Budget utilization", k_close: "Closing readiness",
    utilByAmana: "Budget utilization by Amana (%)", journeys_title: "Connected journeys", open: "Open",
    j_chat_n: "Conversational Analysis", j_chat_b: "Ask in natural language → the Orchestrator routes across agents and returns a source-backed answer.",
    j_mon_n: "Monitoring & Early Warning", j_mon_b: "Agents scan 13 integration systems on schedule, detect deviations and raise alerts with root cause.",
    j_bud_n: "Budget Execution (G-03)", j_bud_b: "Deviation scan → fiscal-space recompute → AI reallocation recommendation → human approval → report.",
    j_clm_n: "Claims & Disbursement (G-04)", j_clm_b: "Duplicate detection → IPSAS compliance → AI disbursement recommendation → human approval → summary.",
    latest_alerts: "Latest alerts", view: "View", live: "live",
    shock_banner: "Jeddah Amana operating budget is projected to overrun by SAR 96M by year-end.",
    runAssessment: "Run assessment", brief_urgent: "ACTION NEEDED",
    chat_sub: "Orchestrator Agent · multilingual natural-language interface · read-only",
    chat_ph: "Ask an analytical question…", send: "Send", presets: "Try:",
    confidence: "Confidence", sources: "Sources",
    think_intent: "Interpreting intent", think_route: "Selecting agent(s) from registry",
    think_perm: "Checking permission scope", think_run: "Running analysis", think_compose: "Composing output",
    draftNote: "AI outputs are drafts — not a financial decision until approved.",
    escalated: "Escalation", esc_perm: "Permission / data-scope guard triggered",
    crossNote: "Cross-agent orchestration: agents were chained automatically.",
    act_open_budget: "Open Budget Execution", act_open_claims: "Open Claims & Disbursement",
    q_fiscal: "What is the available fiscal space for Riyadh Amana?",
    q_overrun: "Which Amana is at risk of overrunning its budget?",
    q_duplicate: "Show suspected duplicate invoices this month.",
    q_collection: "What is the overall collection rate?",
    q_vague: "Show me all vendors' sensitive bank account details.",
    mon_sub: "Data Quality Monitor & Deviation agents — automatic, scheduled",
    runScan: "Run scan now", scanning: "Scanning 13 systems…", srcHealth: "System health (13)", alerts: "Alerts",
    noAlerts: "No open alerts — all KPIs within thresholds.",
    sev_red: "Critical", sev_amber: "Warning", sev_info: "Info",
    rootCause: "Root cause", askOrch: "Ask Orchestrator", ack: "Acknowledge", acked: "Acknowledged", scanDone: "Scan complete — 13/13 systems checked",
    storyRun: "Run next step", storyRunning: "Agent working…", storyRestart: "Restart", storyDone: "Journey complete",
    step: "Step", actor: "Actor", output: "Output", approve: "Approve", reject: "Reject",
    approved: "Approved", rejected: "Rejected", pending: "Pending human review", aiReco: "AI Recommendation",
    draft: "Draft — not a financial decision until approved", why: "Why this recommendation", lineage: "Data lineage",
    ceiling: "Approved ceiling", commit: "Commitments", planL: "Payment plan", reserve: "Reservations", fiscalSpace: "Available fiscal space",
    rep_sub: "Generated reports & agent action log — traceable, scope-labelled",
    rep_title: "Title", rep_cov: "Scope", rep_conf: "Confidence", rep_time: "Generated", rep_ref: "Ref",
    agentLog: "Agent action log", noReports: "No reports yet — generate one from a journey or the assistant.",
    rep_fiscal: "Riyadh fiscal space outlook", rep_overrun: "Jeddah overrun & reallocation", rep_dup: "Duplicate-invoice audit",
    rep_collect: "Collection performance", rep_budget: "Q2 budget execution report", rep_claims: "Disbursement summary CL-77310", rep_uc06: "Financial performance & management analysis",
    running: "Running…", agentlog_h: "Agent activity",
    log_route: "Orchestrator routed inquiry to agents", log_alert: "Anomaly Detection agent raised a deviation alert",
    log_scan: "Anomaly Detection agent scanned 13 integration systems — 10 green, 3 watch",
    log_report: "Report generated · ref", log_approve: "Authorized officer approved a recommendation",
    log_idle: "Data Querying agent indexed the inquiry for traceability", log_uc06: "Performance analysis agent assembled a report",
    redline: "The platform only recommends and is read-only — it never edits source data, executes payments, or auto-approves.",
    // UC-06
    uc_title: "Financial Performance Analysis", uc_sub: "UC-06 · performance, regional gaps, service concentration and initiative structure.",
    uc_dept_a: "General Department of Financial Planning and Performance", uc_dept_b: "Financial Performance Analysis Department",
    uc_registry: "Financial Performance Analysis Registry", uc_new: "Create New Report",
    uc_total: "Total Reports", uc_pub: "Published", uc_appr: "Approved", uc_inrev: "In Review",
    uc_back: "Back",
    s1: "Operational Parameters", s2: "Generate Dashboard", s3: "Review Commentary", s4: "Report Detail",
    uc_cfg: "Configure Filter Parameters", uc_cfg_sub: "Define the analysis scope and dimensional filter criteria to generate the dashboard.",
    f_level: "Level of Analysis", f_amana: "Amana", f_muni: "Municipality", f_fy: "Fiscal Year", f_period: "Period Type", f_specific: "Specific Period",
    opt_ministry: "Ministry", opt_allAmanas: "All Amanas", opt_allMuni: "All Municipalities", opt_monthly: "Monthly", opt_quarterly: "Quarterly",
    uc_generate: "Generate Analytical Dashboard",
    reason_h: "AI Analysis & Reasoning Engine", reason_sub: "Please wait, the AI agent is performing dynamic financial reasoning…",
    rstep1: "Financial Performance Analysis Agent starting, ingesting departmental performance metrics…",
    rstep2: "Orchestrating 'Performance & Variance Analysis' workflow, calculating KPIs and deviations…",
    rstep3: "Orchestrating 'Narrative Commentary Generation' workflow, synthesizing explanations for performance gaps…",
    rstep4: "Orchestrating 'Decision Dashboard Assembly' workflow, compiling visual performance layouts…",
    scope_sum: "Scope Summary", obj_sum: "Objective Data Summary", balance_check: "Mathematical balance check: Passed",
    viewData: "View Supporting Data", ai_brief: "AI Brief", goCommentary: "Go to Commentary Review",
    kp_orig: "Original Budget", kp_orig_s: "Original budget before adjustments.",
    kp_rev: "Budget vs Revenue", kp_rev_s: "Approved budget against realized revenue.",
    kp_cur: "Current Budget", kp_cur_s: "Current approved budget in the selected scope.",
    kp_act: "Actual Spend", kp_act_s: "Actual spend for the selected period.",
    kp_rem: "Remaining Balance", kp_rem_s: "Unspent balance from the current budget.",
    kp_rate: "Spending Rate", kp_rate_s: "Actual spend divided by current budget.",
    kp_chg: "Increases / Decreases", kp_chg_s: "Difference between current and original budget.",
    tag_up: "IMPROVING", tag_flat: "STABLE", tag_down: "SLIPPING",
    map_title: "Regional Financial Performance Map", map_sub: "Selected regions are colored by adjusted spend rate after deferred-debt adjustment.",
    lg_green: "Green · Strong ≥75%", lg_yellow: "Yellow · Watch 50–74%", lg_red: "Red · Alert <50%",
    spend_title: "Spending Performance", spend_budget: "Current Budget", spend_actual: "Actual Spend", spend_trend: "Actual Spend Trend",
    fdetail: "Financial Detail Analysis", door_title: "Budget Door Analysis", door_sub: "Budget doors → executing entity → final use", door_total: "Displayed flow total",
    svc_title: "Main Service Analysis", vision_title: "Vision Programs",
    vp_init: "Initiative / Project", vp_port: "Portfolio", vp_budget: "Current Budget", vp_actual: "Actual Spend", vp_rem: "Remaining", vp_rate: "Execution Rate",
    rev_split: "Revenue Source Split", rs_collected: "Collected", rs_outstanding: "Outstanding", rs_weight: "Source Weight",
    col_rate: "Collection Rate by Source", cc_collected: "Collected", cc_net: "Net Invoiced",
    recv_prog: "Receivable Progression", rp_caption: "AR bucket migration based on invoiced and open receivable balances",
    rp_unpaid: "Unpaid Receivables", rp_exec: "Executable Receivables", rp_done: "Executed Collections",
    rp_matrix: "Invoiced Amount / AR Migration Across Aging Buckets", rp_unit: "Unit: % of displayed receivable base", buck_current: "Current",
    reg_ach: "Regional Collection Achievement", ra_target: "Target", ra_gap: "Gap",
    st_above: "Above target", st_near: "Near target", st_below: "Below target",
    mapNote: "Markers are indicative; colored by adjusted spend rate.",
    nav_revassets: "Revenues & Assets", j_rev_n: "Revenues & Assets (G-06)", j_rev_b: "Consolidate revenue & assets → collection analysis → performance & deviation → asset capitalization → cost & funds → AI recommendation → report & audit.",
    rev_billed: "Net billed", rev_collected: "Collected", rev_rate: "Collection rate", rev_source: "Revenue source", rev_excl: "Exclusions",
    pd_growth: "Billing growth (YoY)", pd_excl: "Exclusions", pd_signal: "Signal", pd_value: "Value", pd_status: "Status",
    as_auc: "AUC (opening)", as_cap: "Capitalized", as_impair: "Impairment flagged", as_maint: "Maintenance due", as_class: "Asset class", as_value: "Gross value (M)", as_capd: "Capitalized (M)", as_life: "Useful life (yr)", as_ret: "Return",
    st_active: "Active", st_maint: "Maintenance", st_impair: "Impaired", st_idle: "Idle surplus", st_ok: "On track", st_pending: "Pending",
    co_ao: "Assignment order", co_proj: "Project", co_fund: "Fund", co_alloc: "Allocated (M)", co_spent: "Spent (M)", co_unit: "Unit cost", co_comp: "IPSAS capitalization & exclusion compliance verified",
    qa_title: "Smart query & audit", qa_scope: "Scope: Revenues & Assets · read-only", qa_a: "Asir Amana net collection is SAR 0.31B (71% rate, 14% below the regional target) — the widest gap this period; an early-warning was raised and routed to the Revenue department.", qa_log1: "Capitalization reclass SAR 1.92B — approved by authorized officer", qa_log2: "Idle surplus release SAR 85M (AO-2207) — approved by authorized officer",
    rep_revassets: "Revenue & assets performance report",
    flow_steps: "Journey steps", nav_planning: "Planning & Performance", nav_reporting: "Financial Reporting",
    j_plan_n: "Planning & Financial Performance (G-02)", j_plan_b: "Consolidate → budget planning & fiscal space → forecast obligations → scenario simulation → performance analysis → AI recommendation → report & alerts.",
    j_rep_n: "Financial Reporting (G-05)", j_rep_b: "Consolidate → financial closing & reconciliation → compliance & memos → costs & assets → AI adjusting entries → financial report & audit.",
    rep_planning: "Planning & performance report", rep_reporting: "Financial statements & closing report",
    fc_oblig: "Projected obligations", fc_space: "Available fiscal space", fc_mape: "Rolling forecast · MAPE ≤ 12%",
    sc_opt: "Optimistic", sc_base: "Base", sc_pess: "Pessimistic", sc_space: "Fiscal space", sc_oblig: "New obligations", sc_cover: "Coverage", sc_rec: "Recommended", cover_strong: "Strong", cover_adequate: "Adequate", cover_watch: "Watch",
    cl_check: "Pre-close validation", cl_complete: "Completeness", cl_abnormal: "Abnormal balances", cl_missing: "Missing entries", cl_pass: "Pass", cl_found: "found",
    cl_recon: "Balance reconciliation", cl_entity: "Source", cl_book: "Book (M)", cl_system: "System (M)", cl_diff: "Diff (M)", cl_matched: "Matched", cl_ureview: "Under review", cl_adjust: "Adjust", cl_entries: "Proposed corrective entries",
    cw_title: "Interpretive Commentary Review Workspace", cw_sub: "The dashboard is generated first as a unified performance view. The final report type is then selected here to guide the commentary and report output.",
    finalType: "Final Report Type", rt_exec: "Executive Report", rt_init: "Initiatives Report", rt_detail: "Detailed Report",
    slidePages: "Slide Pages", dataTables: "Data Tables", addTables: "Add / Configure Tables",
    narrComment: "Narrative Commentary", aiConf: "AI Confidence Score", dataSrcLink: "Data Source Link", dataSrcVal: "National Portal (Budget Expenditures)",
    mathOk: "Mathematical consistency checked against source worksheets", chartLabel: "Chart", chart_map: "Regional Map", chart_kpi: "KPI Cards", chart_spend: "Spending Performance", chart_svc: "Service Analysis", chart_vision: "Vision Programs", chart_none: "Text only",
    copilot_h: "AI Co-pilot Chat Assistant", copilot_target: "Target Card for Conversation", copilot_hello: "Hi! Select any commentary card from the left to start rewriting it.", copilot_ph: "Type rewrite instructions (e.g., make it more concise)…",
    showDiff: "Show Diff", discussAI: "Discuss with AI", prev: "Back", next: "Next", assemble: "Assemble & Compile Final Draft",
    backWs: "Back to Report Workspace", submitReview: "Submit for Review", exportPptx: "Export to PPTX", exportPdf: "Export PDF",
    st_draft: "DRAFT", st_review: "IN REVIEW", page: "Page", of: "of",
    cover_country: "Kingdom of Saudi Arabia", cover_min: "Ministry of Municipalities and Housing", cover_persp: "Perspective: Planning & Financial Performance", cover_scope: "Scope", cover_agency: "Agency for Financial Affairs and Budget",
    submitted: "Report submitted for review", note_demo: "Synthetic data · drafts pending human approval",
  },
  ar: {
    appName: "مساعد الشؤون المالية والميزانية",
    sso_title: "الدخول الموحّد لوزارة الشؤون البلدية", sso_sub: "وصول وطني موحّد إلى الخدمات الرقمية لوزارة الشؤون البلدية والقروية والإسكان.",
    brandLine: "مساعد الشؤون المالية والميزانية", signInTitle: "تسجيل الدخول", identity: "الهوية", password: "كلمة المرور",
    securityCode: "رمز التحقق", or_: "أو", login_btn: "دخول",
    nic1: "النفاذ الوطني", nic2: "النفاذ الوطني الموحّد", noAccount: "ليس لديك حساب؟", createAccount: "إنشاء حساب جديد",
    loginHint: "كلمة المرور معبأة مسبقاً للعرض التجريبي (لا يوجد تحقق فعلي).",
    copyright: "© 2026 — وزارة الشؤون البلدية والقروية والإسكان · وكالة الشؤون المالية والميزانية", syntheticData: "بيانات تجريبية — ليست سجلات حقيقية",
    logout: "تسجيل الخروج", resetDemo: "إعادة ضبط العرض",
    analyst_full: "محلل البيانات المالية", manager_full: "مدير تنفيذ الميزانية", leader_full: "القيادة العليا",
    analyst_desc: "يسأل المنسّق، يشغّل التحليلات، يعالج التنبيهات، ينشئ تقارير UC-06، ويقود مسارات الميزانية والمطالبات.",
    manager_desc: "يراجع تنفيذ الميزانية، يعتمد المناقلات ضمن السقوف، ويراقب الانحرافات.",
    leader_desc: "يطّلع على اللوحات والتقارير المالية التنفيذية عبر الوزارة وأماناتها — للقراءة فقط.",
    nav_hub: "الرئيسية", nav_chat: "التحليل الحواري", nav_monitor: "المراقبة والتنبيهات",
    nav_perf: "تحليل الأداء", nav_budget: "تنفيذ الميزانية", nav_claims: "المطالبات والصرف", nav_reports: "التقارير",
    eng_orch: "وكيل التنسيق", eng_consol: "تجميع البيانات وجودتها", eng_deviation: "الانحرافات والإنذار المبكر",
    eng_forecast: "التنبؤ والسيناريوهات", eng_close: "التسوية والإقفال", eng_comply: "الامتثال والتدقيق",
    engd_orch: "يوجّه الاستعلامات بين الوكلاء، يركّب المخرجات، وينشئ التقارير.",
    engd_consol: "يجمّع ويتحقق من البيانات من الأنظمة المعتمدة (UC-01).",
    engd_deviation: "يكشف الانحرافات والشذوذ والتكرار؛ ويصدر التنبيهات (UC-02).",
    engd_forecast: "تنبؤات متجددة، حيز مالي، ومحاكاة سيناريوهات (UC-04/05/07).",
    engd_close: "تحقق قبل الإقفال، تسوية الأرصدة، وقيود تصحيحية (UC-09).",
    engd_comply: "امتثال IPSAS، مذكرات محاسبية، وسجل تدقيق (UC-11/10).",
    eng_orch: "وكيل التنسيق", engd_orch: "ينسّق الوكلاء ويجدول المهام ويركّب المخرجات الرسمية.",
    eng_forecast: "وكيل التنبؤ المالي", engd_forecast: "يتنبأ بالإيرادات والمصروفات والتدفقات النقدية والالتزامات.",
    eng_rolling: "وكيل التنبؤ المتجدد", engd_rolling: "يحدّث التنبؤات باستمرار مع ورود الفعلي.",
    eng_scenario: "وكيل محاكاة السيناريوهات", engd_scenario: "يختبر فرضيات ماذا-لو ويقارن البدائل.",
    eng_optimize: "وكيل تحسين الميزانية", engd_optimize: "يقترح أفضل توزيع ضمن السقوف المعتمدة.",
    eng_anomaly: "وكيل كشف الشذوذ", engd_anomaly: "يكشف الانحرافات والأرصدة غير الاعتيادية والفواتير المكررة.",
    eng_trends: "وكيل اتجاهات السوق", engd_trends: "يراقب اتجاهات السوق ومحرّكات التكلفة.",
    eng_insights: "وكيل الرؤى الاستباقية", engd_insights: "يولّد رؤى قابلة للتنفيذ وإنذارات مبكرة.",
    eng_narrative: "وكيل التعليق السردي", engd_narrative: "ينتج تعليقاً سردياً للتقارير المالية.",
    eng_query: "وكيل الاستعلام عن البيانات", engd_query: "يجيب عن الأسئلة باللغة الطبيعية على البيانات المالية.",
    eng_reports: "وكيل توليد التقارير", engd_reports: "يجمّع وينسّق التقارير المالية الدورية.",
    eng_revenue: "وكيل تحليل الإيرادات", engd_revenue: "يحلّل الفوترة والتحصيل والاستبعادات والذمم.",
    eng_compliance: "وكيل الامتثال / القواعد", engd_compliance: "يقيّم الامتثال ويدعم القواعد المحاسبية.",
    engines_title: "13 وكيلاً · بتنسيق المنسّق", sources_title: "13 نظام تكامل · الحالة المباشرة",
    src_etimadp: "اعتماد+", src_whiteland: "الأراضي البيضاء", src_hyperion: "هايبريون",
    online: "متصل", autonomous: "مستقل",
    src_sap: "ساب / أساس", src_etimad: "اعتماد", src_esnad: "إسناد", src_grp: "GRP", src_tahseel: "تحصيل",
    src_makeen: "مكين", src_efaa: "إيفاء", src_sanad: "سند", src_balady: "بلدي", src_gl: "الأستاذ", src_bi: "لوحة BI",
    hub_hello: "مرحباً", hub_sub: "منصة واحدة متعددة الوكلاء · مسارات مالية مترابطة",
    k_fiscal: "الحيز المالي المتاح", k_alerts: "انحرافات مفتوحة", k_util: "نسبة تنفيذ الميزانية", k_close: "جاهزية الإقفال",
    utilByAmana: "نسبة تنفيذ الميزانية حسب الأمانة (٪)", journeys_title: "المسارات المترابطة", open: "فتح",
    j_chat_n: "التحليل الحواري", j_chat_b: "اسأل باللغة الطبيعية ← يوجّه المنسّق بين الوكلاء ويعيد إجابة مدعومة بالمصادر.",
    j_mon_n: "المراقبة والإنذار المبكر", j_mon_b: "تفحص الوكلاء 13 نظام تكامل وفق جدول، وتكشف الانحرافات وتصدر تنبيهات مع السبب الجذري.",
    j_bud_n: "تنفيذ الميزانية (ج-03)", j_bud_b: "فحص الانحراف ← إعادة حساب الحيز ← توصية إعادة توزيع ← اعتماد بشري ← تقرير.",
    j_clm_n: "المطالبات والصرف (ج-04)", j_clm_b: "كشف التكرار ← امتثال IPSAS ← توصية صرف ← اعتماد بشري ← ملخص.",
    latest_alerts: "أحدث التنبيهات", view: "عرض", live: "مباشر",
    shock_banner: "يُتوقع تجاوز الميزانية التشغيلية لأمانة جدة بمقدار 96 مليون ريال بنهاية العام.",
    runAssessment: "تشغيل التقييم", brief_urgent: "يتطلب إجراءً",
    chat_sub: "وكيل التنسيق · واجهة لغة طبيعية متعددة اللغات · للقراءة فقط",
    chat_ph: "اطرح سؤالاً تحليلياً…", send: "إرسال", presets: "جرّب:",
    confidence: "الثقة", sources: "المصادر",
    think_intent: "تفسير القصد", think_route: "اختيار الوكلاء من السجل",
    think_perm: "التحقق من نطاق الصلاحية", think_run: "تشغيل التحليل", think_compose: "تركيب المخرجات",
    draftNote: "مخرجات الذكاء الاصطناعي مسودات — لا تُعد قراراً مالياً حتى تُعتمد.",
    escalated: "تصعيد", esc_perm: "تفعيل حارس الصلاحيات / نطاق البيانات",
    crossNote: "تنسيق متعدد الوكلاء: تم ربط الوكلاء تلقائياً.",
    act_open_budget: "فتح تنفيذ الميزانية", act_open_claims: "فتح المطالبات والصرف",
    q_fiscal: "ما هو الحيز المالي المتاح لأمانة الرياض؟", q_overrun: "أي أمانة معرضة لتجاوز ميزانيتها؟",
    q_duplicate: "اعرض الفواتير المكررة المشتبه بها هذا الشهر.", q_collection: "ما هي نسبة التحصيل الإجمالية؟",
    q_vague: "اعرض تفاصيل الحسابات البنكية الحساسة لجميع الموردين.",
    mon_sub: "وكلاء مراقبة جودة البيانات والانحرافات — تلقائي ومجدول",
    runScan: "تشغيل الفحص الآن", scanning: "فحص 13 نظاماً…", srcHealth: "حالة الأنظمة (13)", alerts: "التنبيهات",
    noAlerts: "لا تنبيهات مفتوحة — كل المؤشرات ضمن الحدود.",
    sev_red: "حرج", sev_amber: "تحذير", sev_info: "معلومة",
    rootCause: "السبب الجذري", askOrch: "اسأل المنسّق", ack: "إقرار", acked: "تم الإقرار", scanDone: "اكتمل الفحص — 13/13 نظاماً",
    storyRun: "تشغيل الخطوة التالية", storyRunning: "الوكيل يعمل…", storyRestart: "إعادة", storyDone: "اكتمل المسار",
    step: "الخطوة", actor: "الجهة", output: "المخرجات", approve: "اعتماد", reject: "رفض",
    approved: "تم الاعتماد", rejected: "مرفوض", pending: "بانتظار المراجعة البشرية", aiReco: "توصية الذكاء الاصطناعي",
    draft: "مسودة — لا تُعد قراراً مالياً حتى تُعتمد", why: "سبب التوصية", lineage: "تتبع البيانات",
    ceiling: "السقف المعتمد", commit: "الالتزامات", planL: "خطة الدفع", reserve: "الحجوزات", fiscalSpace: "الحيز المالي المتاح",
    rep_sub: "التقارير المُنشأة وسجل إجراءات الوكلاء — قابلة للتتبع وموسومة بالنطاق",
    rep_title: "العنوان", rep_cov: "النطاق", rep_conf: "الثقة", rep_time: "أُنشئ", rep_ref: "المرجع",
    agentLog: "سجل إجراءات الوكلاء", noReports: "لا تقارير بعد — أنشئ تقريراً من أحد المسارات أو المساعد.",
    rep_fiscal: "توقعات الحيز المالي للرياض", rep_overrun: "تجاوز جدة وإعادة التوزيع", rep_dup: "تدقيق الفواتير المكررة",
    rep_collect: "أداء التحصيل", rep_budget: "تقرير تنفيذ ميزانية الربع الثاني", rep_claims: "ملخص الصرف CL-77310", rep_uc06: "تقرير الأداء المالي والتحليل الإداري",
    running: "جارٍ…", agentlog_h: "نشاط الوكلاء",
    log_route: "وجّه المنسّق الاستعلام إلى الوكلاء", log_alert: "أصدر وكيل كشف الشذوذ تنبيه انحراف",
    log_scan: "فحص وكيل كشف الشذوذ 13 نظام تكامل — 10 خضراء، 3 مراقبة",
    log_report: "تم إنشاء تقرير · مرجع", log_approve: "اعتمد المسؤول المخوّل توصية",
    log_idle: "فهرس وكيل الاستعلام الطلب لأغراض التتبع", log_uc06: "جمّع وكيل تحليل الأداء تقريراً",
    redline: "المنصة توصي فقط وللقراءة فقط — لا تعدّل بيانات المصدر، ولا تنفّذ المدفوعات، ولا تعتمد تلقائياً.",
    uc_title: "تحليل الأداء المالي", uc_sub: "UC-06 · الأداء المالي والفجوات المكانية وتركّز الخدمات وبنية المبادرات.",
    uc_dept_a: "الإدارة العامة للتخطيط والأداء المالي", uc_dept_b: "إدارة تحليل الأداء المالي",
    uc_registry: "سجل تحليل الأداء المالي", uc_new: "إنشاء تقرير جديد",
    uc_total: "إجمالي التقارير", uc_pub: "منشور رسمياً", uc_appr: "معتمد", uc_inrev: "قيد المراجعة", uc_back: "رجوع",
    s1: "المعايير التشغيلية", s2: "إنشاء اللوحة", s3: "مراجعة التعليق", s4: "تفاصيل التقرير",
    uc_cfg: "ضبط معايير التصفية", uc_cfg_sub: "حدّد نطاق التحليل ومعايير التصفية لإنشاء اللوحة.",
    f_level: "مستوى التحليل", f_amana: "الأمانة", f_muni: "البلدية", f_fy: "السنة المالية", f_period: "نوع الفترة", f_specific: "فترة محددة",
    opt_ministry: "الوزارة", opt_allAmanas: "كل الأمانات", opt_allMuni: "كل البلديات", opt_monthly: "شهري", opt_quarterly: "ربع سنوي",
    uc_generate: "إنشاء اللوحة التحليلية",
    reason_h: "محرك التحليل والاستدلال بالذكاء الاصطناعي", reason_sub: "يرجى الانتظار، يقوم الوكيل بالاستدلال المالي الديناميكي…",
    rstep1: "بدء وكيل تحليل الأداء المالي واستيعاب مؤشرات أداء الإدارات…",
    rstep2: "تنسيق مسار 'تحليل الأداء والانحراف' وحساب المؤشرات والانحرافات…",
    rstep3: "تنسيق مسار 'توليد التعليق السردي' وتركيب تفسيرات فجوات الأداء…",
    rstep4: "تنسيق مسار 'تجميع لوحة القرار' وبناء التخطيطات البصرية للأداء…",
    scope_sum: "ملخص النطاق", obj_sum: "ملخص البيانات الموضوعية", balance_check: "فحص التوازن الحسابي: ناجح",
    viewData: "عرض البيانات الداعمة", ai_brief: "موجز الذكاء الاصطناعي", goCommentary: "الانتقال إلى مراجعة التعليق",
    kp_orig: "الميزانية الأصلية", kp_orig_s: "الميزانية قبل التعديلات.",
    kp_rev: "الميزانية مقابل الإيرادات", kp_rev_s: "الميزانية المعتمدة مقابل الإيراد المحقق.",
    kp_cur: "الميزانية الحالية", kp_cur_s: "الميزانية المعتمدة الحالية ضمن النطاق.",
    kp_act: "الإنفاق الفعلي", kp_act_s: "الإنفاق الفعلي للفترة المحددة.",
    kp_rem: "الرصيد المتبقي", kp_rem_s: "الرصيد غير المصروف من الميزانية الحالية.",
    kp_rate: "نسبة الإنفاق", kp_rate_s: "الإنفاق الفعلي مقسوماً على الميزانية الحالية.",
    kp_chg: "زيادات / تخفيضات", kp_chg_s: "الفرق بين الميزانية الحالية والأصلية.",
    tag_up: "متحسّن", tag_flat: "مستقر", tag_down: "متراجع",
    map_title: "خريطة الأداء المالي الإقليمي", map_sub: "تُلوَّن المناطق وفق نسبة الإنفاق المعدّلة بعد تسوية الديون المؤجّلة.",
    lg_green: "أخضر · قوي ≥75٪", lg_yellow: "أصفر · مراقبة 50–74٪", lg_red: "أحمر · إنذار <50٪",
    spend_title: "أداء الإنفاق", spend_budget: "الميزانية الحالية", spend_actual: "الإنفاق الفعلي", spend_trend: "اتجاه الإنفاق الفعلي",
    fdetail: "تحليل التفاصيل المالية", door_title: "تحليل أبواب الميزانية", door_sub: "أبواب الميزانية ← الجهة المنفّذة ← الاستخدام النهائي", door_total: "إجمالي التدفق المعروض",
    svc_title: "تحليل الخدمات الرئيسية", vision_title: "برامج الرؤية",
    vp_init: "المبادرة / المشروع", vp_port: "المحفظة", vp_budget: "الميزانية الحالية", vp_actual: "الإنفاق الفعلي", vp_rem: "المتبقي", vp_rate: "نسبة التنفيذ",
    rev_split: "تقسيم مصادر الإيراد", rs_collected: "المحصّل", rs_outstanding: "المتبقي", rs_weight: "وزن المصدر",
    col_rate: "نسبة التحصيل حسب المصدر", cc_collected: "المحصّل", cc_net: "صافي الفوترة",
    recv_prog: "تطوّر الذمم المدينة", rp_caption: "انتقال شرائح الذمم بناءً على الفوترة وأرصدة الذمم المفتوحة",
    rp_unpaid: "ذمم غير مدفوعة", rp_exec: "ذمم قابلة للتنفيذ", rp_done: "تحصيلات منفّذة",
    rp_matrix: "المبلغ المفوتر / انتقال الذمم عبر شرائح التقادم", rp_unit: "الوحدة: ٪ من قاعدة الذمم المعروضة", buck_current: "الحالي",
    reg_ach: "إنجاز التحصيل الإقليمي", ra_target: "المستهدف", ra_gap: "الفجوة",
    st_above: "فوق المستهدف", st_near: "قريب من المستهدف", st_below: "دون المستهدف",
    mapNote: "العلامات إرشادية؛ مُلوّنة وفق نسبة الإنفاق المعدّلة.",
    nav_revassets: "الإيرادات والأصول", j_rev_n: "الإيرادات والأصول (ج-06)", j_rev_b: "تجميع الإيرادات والأصول ← تحليل التحصيل ← الأداء والانحراف ← رسملة الأصول ← التكاليف والصناديق ← توصية ذكية ← تقرير وتدقيق.",
    rev_billed: "صافي الفوترة", rev_collected: "المحصّل", rev_rate: "نسبة التحصيل", rev_source: "مصدر الإيراد", rev_excl: "الاستبعادات",
    pd_growth: "نمو الفوترة (سنوي)", pd_excl: "الاستبعادات", pd_signal: "المؤشر", pd_value: "القيمة", pd_status: "الحالة",
    as_auc: "أصول تحت الإنشاء (افتتاحي)", as_cap: "المرسمَل", as_impair: "انخفاض قيمة مرصود", as_maint: "صيانة مستحقة", as_class: "فئة الأصل", as_value: "القيمة الإجمالية (م)", as_capd: "المرسمَل (م)", as_life: "العمر الإنتاجي (سنة)", as_ret: "العائد",
    st_active: "نشط", st_maint: "صيانة", st_impair: "منخفض القيمة", st_idle: "فائض خامل", st_ok: "ضمن المسار", st_pending: "معلّق",
    co_ao: "أمر الإسناد", co_proj: "المشروع", co_fund: "الصندوق", co_alloc: "المخصّص (م)", co_spent: "المصروف (م)", co_unit: "تكلفة الوحدة", co_comp: "تم التحقق من رسملة IPSAS وامتثال الاستبعاد",
    qa_title: "الاستعلام الذكي والتدقيق", qa_scope: "النطاق: الإيرادات والأصول · للقراءة فقط", qa_a: "صافي تحصيل أمانة عسير 0.31 مليار ريال (نسبة 71٪، أقل من المستهدف الإقليمي بـ14٪) — أكبر فجوة هذه الفترة؛ وأُطلق تنبيه مبكر ووُجّه إلى إدارة الإيرادات.", qa_log1: "إعادة تصنيف الرسملة 1.92 مليار ريال — معتمدة من المسؤول المخوّل", qa_log2: "الإفراج عن فائض خامل 85 مليون ريال (AO-2207) — معتمد من المسؤول المخوّل",
    rep_revassets: "تقرير أداء الإيرادات والأصول",
    flow_steps: "خطوات المسار", nav_planning: "التخطيط والأداء", nav_reporting: "التقارير المالية",
    j_plan_n: "التخطيط والأداء المالي (ج-02)", j_plan_b: "تجميع ← تخطيط الميزانية والحيز المالي ← التنبؤ بالالتزامات ← محاكاة السيناريوهات ← تحليل الأداء ← توصية ذكية ← تقرير وتنبيهات.",
    j_rep_n: "التقارير المالية (ج-05)", j_rep_b: "تجميع ← الإقفال والتسوية ← الامتثال والمذكرات ← التكاليف والأصول ← قيود تسوية بالذكاء الاصطناعي ← تقرير مالي وتدقيق.",
    rep_planning: "تقرير التخطيط والأداء", rep_reporting: "تقرير القوائم المالية والإقفال",
    fc_oblig: "الالتزامات المتوقعة", fc_space: "الحيز المالي المتاح", fc_mape: "تنبؤ متجدد · MAPE ≤ 12٪",
    sc_opt: "متفائل", sc_base: "أساسي", sc_pess: "متشائم", sc_space: "الحيز المالي", sc_oblig: "التزامات جديدة", sc_cover: "التغطية", sc_rec: "موصى به", cover_strong: "قوية", cover_adequate: "كافية", cover_watch: "مراقبة",
    cl_check: "التحقق قبل الإقفال", cl_complete: "الاكتمال", cl_abnormal: "أرصدة غير اعتيادية", cl_missing: "قيود ناقصة", cl_pass: "مجتاز", cl_found: "تم العثور",
    cl_recon: "تسوية الأرصدة", cl_entity: "المصدر", cl_book: "الدفتري (م)", cl_system: "النظام (م)", cl_diff: "الفرق (م)", cl_matched: "مطابَق", cl_ureview: "قيد المراجعة", cl_adjust: "تسوية", cl_entries: "قيود تصحيحية مقترحة",
    cw_title: "مساحة مراجعة التعليق التفسيري", cw_sub: "تُنشأ اللوحة أولاً كعرض موحّد للأداء، ثم يُحدَّد نوع التقرير النهائي هنا لتوجيه التعليق والمخرجات.",
    finalType: "نوع التقرير النهائي", rt_exec: "تقرير تنفيذي", rt_init: "تقرير المبادرات", rt_detail: "تقرير تفصيلي",
    slidePages: "صفحات الشرائح", dataTables: "جداول البيانات", addTables: "إضافة / ضبط الجداول",
    narrComment: "التعليق السردي", aiConf: "درجة ثقة الذكاء الاصطناعي", dataSrcLink: "رابط مصدر البيانات", dataSrcVal: "البوابة الوطنية (مصروفات الميزانية)",
    mathOk: "تم التحقق من الاتساق الحسابي مقابل أوراق العمل المصدرية", chartLabel: "المخطط", chart_map: "خريطة إقليمية", chart_kpi: "بطاقات المؤشرات", chart_spend: "أداء الإنفاق", chart_svc: "تحليل الخدمات", chart_vision: "برامج الرؤية", chart_none: "نص فقط",
    copilot_h: "مساعد الدردشة المرافق", copilot_target: "البطاقة المستهدفة للمحادثة", copilot_hello: "مرحباً! اختر أي بطاقة تعليق من اليسار لبدء إعادة الصياغة.", copilot_ph: "اكتب تعليمات إعادة الصياغة (مثل: اجعله أكثر إيجازاً)…",
    showDiff: "إظهار الفرق", discussAI: "مناقشة مع الذكاء الاصطناعي", prev: "رجوع", next: "التالي", assemble: "تجميع وتركيب المسودة النهائية",
    backWs: "العودة إلى مساحة العمل", submitReview: "إرسال للمراجعة", exportPptx: "تصدير PPTX", exportPdf: "تصدير PDF",
    st_draft: "مسودة", st_review: "قيد المراجعة", page: "صفحة", of: "من",
    cover_country: "المملكة العربية السعودية", cover_min: "وزارة الشؤون البلدية والقروية والإسكان", cover_persp: "المنظور: التخطيط والأداء المالي", cover_scope: "النطاق", cover_agency: "وكالة الشؤون المالية والميزانية",
    submitted: "تم إرسال التقرير للمراجعة", note_demo: "بيانات تجريبية · مسودات بانتظار الاعتماد البشري",
  },
  zh: {
    appName: "财务与预算智能助手",
    sso_title: "市政部统一登录", sso_sub: "统一的国家级入口,访问市政农村事务与住房部的数字服务。",
    brandLine: "财务与预算智能助手", signInTitle: "登录", identity: "身份", password: "密码",
    securityCode: "验证码", or_: "或", login_btn: "登录",
    nic1: "国家统一登录", nic2: "国家身份卡", noAccount: "还没有账户?", createAccount: "创建新账户",
    loginHint: "演示用密码已预填(无真实认证)。",
    copyright: "© 2026 — 市政农村事务与住房部 · 财务事务与预算署", syntheticData: "合成演示数据 — 非真实记录",
    logout: "退出登录", resetDemo: "重置演示",
    analyst_full: "财务数据分析师", manager_full: "预算执行经理", leader_full: "高层领导",
    analyst_desc: "向编排器提问、运行分析、处理告警、生成 UC-06 报告,并驱动预算与索赔流程。",
    manager_desc: "复核预算执行,在上限内批准调拨,监控偏差。",
    leader_desc: "查阅部委及各阿玛纳的执行级仪表盘与财务报告——仅只读。",
    nav_hub: "主页", nav_chat: "对话分析", nav_monitor: "监控与告警",
    nav_perf: "绩效分析", nav_budget: "预算执行", nav_claims: "索赔与支付", nav_reports: "报告",
    eng_orch: "编排智能体", eng_consol: "数据汇聚与质量", eng_deviation: "偏差与预警",
    eng_forecast: "预测与情景", eng_close: "对账与关账", eng_comply: "合规与审计",
    engd_orch: "在各智能体间路由查询、组织输出、生成报告。",
    engd_consol: "从核准系统汇聚并校验数据(UC-01)。",
    engd_deviation: "检测偏差、异常与重复;发出告警(UC-02)。",
    engd_forecast: "滚动预测、财政空间与情景模拟(UC-04/05/07)。",
    engd_close: "关账前校验、余额对账与调整(UC-09)。",
    engd_comply: "IPSAS 合规、会计备忘与审计轨迹(UC-11/10)。",
    eng_orch: "编排智能体", engd_orch: "协调各智能体、调度任务并组织正式输出。",
    eng_forecast: "财务预测智能体", engd_forecast: "预测收入、支出、现金流与负债。",
    eng_rolling: "滚动预测智能体", engd_rolling: "随新实绩到达持续更新预测。",
    eng_scenario: "情景模拟智能体", engd_scenario: "测试 What-if 假设并比较备选方案。",
    eng_optimize: "预算优化智能体", engd_optimize: "在核定上限内提出最优分配。",
    eng_anomaly: "异常检测智能体", engd_anomaly: "检测偏差、异常余额与重复发票。",
    eng_trends: "市场趋势智能体", engd_trends: "监测市场趋势与成本驱动。",
    eng_insights: "主动洞察智能体", engd_insights: "生成可执行洞察与预警。",
    eng_narrative: "叙述评论智能体", engd_narrative: "为财务报告生成叙述性评论。",
    eng_query: "数据查询智能体", engd_query: "以自然语言回答财务数据问题。",
    eng_reports: "报告生成智能体", engd_reports: "汇编并格式化周期性财务报告。",
    eng_revenue: "收入分析智能体", engd_revenue: "分析开票、征收、排除项与应收。",
    eng_compliance: "合规 / 规则智能体", engd_compliance: "评估合规并支持会计规则。",
    engines_title: "13 个智能体 · 由编排器协调", sources_title: "13 个集成系统 · 实时状态",
    src_etimadp: "Etimad+", src_whiteland: "白地平台", src_hyperion: "Hyperion",
    online: "在线", autonomous: "自主",
    src_sap: "SAP / Asas", src_etimad: "Etimad", src_esnad: "Esnad", src_grp: "GRP", src_tahseel: "Tahseel",
    src_makeen: "Makeen", src_efaa: "Efaa", src_sanad: "Sanad", src_balady: "Balady", src_gl: "总账", src_bi: "BI 看板",
    hub_hello: "欢迎", hub_sub: "一个多智能体平台 · 互联的财务流程",
    k_fiscal: "可用财政空间", k_alerts: "未处理偏差", k_util: "预算执行率", k_close: "关账就绪度",
    utilByAmana: "各阿玛纳预算执行率(%)", journeys_title: "互联流程", open: "打开",
    j_chat_n: "对话分析", j_chat_b: "用自然语言提问 → 编排器在各智能体间路由,返回有数据来源支撑的答案。",
    j_mon_n: "监控与预警", j_mon_b: "智能体按计划扫描 13 个集成系统,检测偏差并附根因发出告警。",
    j_bud_n: "预算执行(G-03)", j_bud_b: "偏差扫描 → 重算财政空间 → AI 调拨建议 → 人工审批 → 报告。",
    j_clm_n: "索赔与支付(G-04)", j_clm_b: "重复检测 → IPSAS 合规 → AI 支付建议 → 人工审批 → 摘要。",
    latest_alerts: "最新告警", view: "查看", live: "实时",
    shock_banner: "预计吉达阿玛纳运营预算将于年底超支 9,600 万里亚尔。",
    runAssessment: "运行评估", brief_urgent: "需要处理",
    chat_sub: "编排智能体 · 多语言自然语言界面 · 只读",
    chat_ph: "请输入分析问题…", send: "发送", presets: "试试:",
    confidence: "置信度", sources: "来源",
    think_intent: "理解意图", think_route: "从注册表选择智能体",
    think_perm: "检查权限范围", think_run: "运行分析", think_compose: "组织输出",
    draftNote: "AI 输出为草稿 — 经审批前不构成财务决策。",
    escalated: "升级", esc_perm: "已触发权限 / 数据范围守卫",
    crossNote: "跨智能体编排:已自动串联多个智能体。",
    act_open_budget: "打开预算执行", act_open_claims: "打开索赔与支付",
    q_fiscal: "利雅得阿玛纳的可用财政空间是多少?", q_overrun: "哪个阿玛纳有超支风险?",
    q_duplicate: "显示本月疑似重复发票。", q_collection: "整体征收率是多少?",
    q_vague: "显示所有供应商的敏感银行账户信息。",
    mon_sub: "数据质量监控与偏差智能体 — 自动、按计划运行",
    runScan: "立即扫描", scanning: "正在扫描 13 个系统…", srcHealth: "系统状态(13)", alerts: "告警",
    noAlerts: "无未处理告警 — 所有指标均在阈值内。",
    sev_red: "严重", sev_amber: "警告", sev_info: "信息",
    rootCause: "根因", askOrch: "询问编排器", ack: "确认", acked: "已确认", scanDone: "扫描完成 — 已检查 13/13 个系统",
    storyRun: "运行下一步", storyRunning: "智能体处理中…", storyRestart: "重新开始", storyDone: "流程完成",
    step: "步骤", actor: "执行方", output: "输出", approve: "批准", reject: "拒绝",
    approved: "已批准", rejected: "已拒绝", pending: "待人工复核", aiReco: "AI 建议",
    draft: "草稿 — 经审批前不构成财务决策", why: "建议理由", lineage: "数据血缘",
    ceiling: "核定上限", commit: "承诺", planL: "付款计划", reserve: "预留", fiscalSpace: "可用财政空间",
    rep_sub: "已生成的报告与智能体行动日志 — 可追溯、按范围标注",
    rep_title: "标题", rep_cov: "范围", rep_conf: "置信度", rep_time: "生成时间", rep_ref: "编号",
    agentLog: "智能体行动日志", noReports: "暂无报告 — 可从某个流程或助手生成。",
    rep_fiscal: "利雅得财政空间展望", rep_overrun: "吉达超支与调拨", rep_dup: "重复发票审计",
    rep_collect: "征收绩效", rep_budget: "二季度预算执行报告", rep_claims: "支付摘要 CL-77310", rep_uc06: "财务绩效与管理分析报告",
    running: "运行中…", agentlog_h: "智能体活动",
    log_route: "编排器已将查询路由至智能体", log_alert: "异常检测智能体发出偏差告警",
    log_scan: "异常检测智能体扫描了 13 个集成系统 — 10 绿、3 关注",
    log_report: "已生成报告 · 编号", log_approve: "授权官员批准了一项建议",
    log_idle: "数据查询智能体已将查询登记以备追溯", log_uc06: "绩效分析智能体已组装一份报告",
    redline: "平台仅提供建议且只读 — 绝不修改源数据、执行付款或自动审批。",
    uc_title: "财务绩效分析", uc_sub: "UC-06 · 财务绩效、区域差距、服务集中度与举措结构。",
    uc_dept_a: "财务规划与绩效总局", uc_dept_b: "财务绩效分析部",
    uc_registry: "财务绩效分析记录", uc_new: "创建新报告",
    uc_total: "报告总数", uc_pub: "正式发布", uc_appr: "已核准", uc_inrev: "审核中", uc_back: "返回",
    s1: "运营参数", s2: "生成仪表盘", s3: "复核评述", s4: "报告详情",
    uc_cfg: "配置筛选参数", uc_cfg_sub: "定义分析范围与维度筛选条件以生成仪表盘。",
    f_level: "分析层级", f_amana: "阿玛纳", f_muni: "市政", f_fy: "财政年度", f_period: "周期类型", f_specific: "具体周期",
    opt_ministry: "部级", opt_allAmanas: "全部阿玛纳", opt_allMuni: "全部市政", opt_monthly: "月度", opt_quarterly: "季度",
    uc_generate: "生成分析仪表盘",
    reason_h: "AI 分析与推理引擎", reason_sub: "请稍候,AI 智能体正在进行动态财务推理…",
    rstep1: "财务绩效分析智能体启动,正在摄取部门绩效指标…",
    rstep2: "编排「绩效与差异分析」工作流,计算 KPI 与偏差…",
    rstep3: "编排「叙述性评述生成」工作流,综合解释绩效差距…",
    rstep4: "编排「决策仪表盘装配」工作流,编排可视化绩效布局…",
    scope_sum: "范围摘要", obj_sum: "客观数据摘要", balance_check: "数学平衡校验:通过",
    viewData: "查看支撑数据", ai_brief: "AI 摘要", goCommentary: "前往评述复核",
    kp_orig: "原始预算", kp_orig_s: "调整前的原始预算。",
    kp_rev: "预算对比收入", kp_rev_s: "核定预算对比已实现收入。",
    kp_cur: "现行预算", kp_cur_s: "所选范围内的现行核定预算。",
    kp_act: "实际支出", kp_act_s: "所选周期的实际支出。",
    kp_rem: "剩余余额", kp_rem_s: "现行预算的未支出余额。",
    kp_rate: "支出率", kp_rate_s: "实际支出除以现行预算。",
    kp_chg: "增加 / 减少", kp_chg_s: "现行与原始预算之差。",
    tag_up: "改善中", tag_flat: "稳定", tag_down: "下滑中",
    map_title: "区域财务绩效地图", map_sub: "区域按递延债务调整后的调整支出率着色。",
    lg_green: "绿 · 良好 ≥75%", lg_yellow: "黄 · 关注 50–74%", lg_red: "红 · 预警 <50%",
    spend_title: "支出绩效", spend_budget: "现行预算", spend_actual: "实际支出", spend_trend: "实际支出趋势",
    fdetail: "财务明细分析", door_title: "预算门分析", door_sub: "预算门 → 执行主体 → 最终用途", door_total: "显示流量合计",
    svc_title: "主要服务分析", vision_title: "愿景计划",
    vp_init: "举措 / 项目", vp_port: "组合", vp_budget: "现行预算", vp_actual: "实际支出", vp_rem: "剩余", vp_rate: "执行率",
    rev_split: "收入来源拆分", rs_collected: "已征收", rs_outstanding: "未征收", rs_weight: "来源权重",
    col_rate: "各来源征收率", cc_collected: "已征收", cc_net: "净开票",
    recv_prog: "应收账款演进", rp_caption: "基于开票与未结应收余额的账龄迁移",
    rp_unpaid: "未付应收", rp_exec: "可执行应收", rp_done: "已执行征收",
    rp_matrix: "开票金额 / 账龄分桶迁移", rp_unit: "单位:占所示应收基数的 %", buck_current: "当前",
    reg_ach: "区域征收达成", ra_target: "目标", ra_gap: "缺口",
    st_above: "高于目标", st_near: "接近目标", st_below: "低于目标",
    mapNote: "标记为示意;按调整后支出率着色。",
    nav_revassets: "收入与资产", j_rev_n: "收入与资产(G-06)", j_rev_b: "汇聚收入与资产 → 征收分析 → 绩效与偏差 → 资产资本化 → 成本与基金 → AI 建议 → 报告与审计。",
    rev_billed: "净开票", rev_collected: "已征收", rev_rate: "征收率", rev_source: "收入来源", rev_excl: "排除项",
    pd_growth: "开票增长(同比)", pd_excl: "排除项", pd_signal: "信号", pd_value: "数值", pd_status: "状态",
    as_auc: "在建资产(期初)", as_cap: "已资本化", as_impair: "减值标记", as_maint: "待维护", as_class: "资产类别", as_value: "总值(百万)", as_capd: "资本化(百万)", as_life: "使用年限(年)", as_ret: "回报",
    st_active: "在用", st_maint: "维护", st_impair: "已减值", st_idle: "闲置结余", st_ok: "正常", st_pending: "待定",
    co_ao: "派工单", co_proj: "项目", co_fund: "基金", co_alloc: "分配(百万)", co_spent: "已花(百万)", co_unit: "单位成本", co_comp: "已核验 IPSAS 资本化与排除合规",
    qa_title: "智能查询与审计", qa_scope: "范围:收入与资产 · 只读", qa_a: "阿西尔阿玛纳净征收为 3.1 亿里亚尔(征收率 71%,低于区域目标 14%)——本期最大缺口;已触发预警并路由至收入部门。", qa_log1: "资本化重分类 19.2 亿里亚尔 — 已由授权官员批准", qa_log2: "闲置结余释放 8,500 万里亚尔(AO-2207)— 已由授权官员批准",
    rep_revassets: "收入与资产绩效报告",
    flow_steps: "流程步骤", nav_planning: "规划与绩效", nav_reporting: "财务报告",
    j_plan_n: "规划与财务绩效(G-02)", j_plan_b: "汇聚 → 预算规划与财政空间 → 义务预测 → 情景模拟 → 绩效分析 → AI 建议 → 报告与告警。",
    j_rep_n: "财务报告(G-05)", j_rep_b: "汇聚 → 关账与对账 → 合规与备忘 → 成本与资产 → AI 调整分录 → 财务报告与审计。",
    rep_planning: "规划与绩效报告", rep_reporting: "财务报表与关账报告",
    fc_oblig: "预测义务", fc_space: "可用财政空间", fc_mape: "滚动预测 · MAPE ≤ 12%",
    sc_opt: "乐观", sc_base: "基准", sc_pess: "悲观", sc_space: "财政空间", sc_oblig: "新增义务", sc_cover: "覆盖", sc_rec: "推荐", cover_strong: "充足", cover_adequate: "适当", cover_watch: "关注",
    cl_check: "关账前校验", cl_complete: "完整性", cl_abnormal: "异常余额", cl_missing: "缺失分录", cl_pass: "通过", cl_found: "发现",
    cl_recon: "余额对账", cl_entity: "来源", cl_book: "账面(百万)", cl_system: "系统(百万)", cl_diff: "差异(百万)", cl_matched: "已匹配", cl_ureview: "复核中", cl_adjust: "调整", cl_entries: "建议的更正分录",
    cw_title: "解释性评述复核工作区", cw_sub: "先生成统一的绩效视图仪表盘,然后在此选择最终报告类型,以指导评述与报告输出。",
    finalType: "最终报告类型", rt_exec: "执行报告", rt_init: "举措报告", rt_detail: "明细报告",
    slidePages: "幻灯片页", dataTables: "数据表", addTables: "添加 / 配置数据表",
    narrComment: "叙述性评述", aiConf: "AI 置信度", dataSrcLink: "数据源链接", dataSrcVal: "国家门户(预算支出)",
    mathOk: "已对照源工作表校验数学一致性", chartLabel: "图表", chart_map: "区域地图", chart_kpi: "KPI 卡片", chart_spend: "支出绩效", chart_svc: "服务分析", chart_vision: "愿景计划", chart_none: "纯文本",
    copilot_h: "AI 副驾驶聊天助手", copilot_target: "对话目标卡片", copilot_hello: "你好!从左侧选择任意评述卡片即可开始改写。", copilot_ph: "输入改写指令(例如:更简洁一些)…",
    showDiff: "显示差异", discussAI: "与 AI 讨论", prev: "上一步", next: "下一步", assemble: "装配并编译最终草稿",
    backWs: "返回报告工作区", submitReview: "提交审核", exportPptx: "导出 PPTX", exportPdf: "导出 PDF",
    st_draft: "草稿", st_review: "审核中", page: "第", of: "/",
    cover_country: "沙特阿拉伯王国", cover_min: "市政农村事务与住房部", cover_persp: "视角:规划与财务绩效", cover_scope: "范围", cover_agency: "财务事务与预算署",
    submitted: "报告已提交审核", note_demo: "合成数据 · 草稿待人工审批",
  },
};

/* =========================================================================
   Store
   ========================================================================= */
const Store = createContext(null);
function useStore() { return useContext(Store); }
let logSeq = 0;

function StoreProvider({ children }) {
  const [lang, setLang] = useState(URL_LANG || "en");
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState("rcwork");
  const [deptSub, setDeptSub] = useState("revcol");
  const [cov, setCov] = useState("consolidated");
  const [alerts, setAlerts] = useState(ALERTS.map(a => ({ ...a, ack: false })));
  const [log, setLog] = useState([]);
  const [reports, setReports] = useState([
    { name: "rep_uc06", cov: "consolidated", conf: "—", ts: "2026-06-01 10:24", ref: "FBC-2026-1042", status: "pub" },
  ]);
  const [pendingQ, setPendingQ] = useState(null);
  const [perfJump, setPerfJump] = useState(null);
  const [backRoute, setBackRoute] = useState(null);
  const [alertsOpen, setAlertsOpen] = useState(false);   // UC-02 modal side-drawer
  const [curMode, setCurMode] = useState("riyal");   // riyal (⃁) default | sar

  const dir = lang === "ar" ? "rtl" : "ltr";
  useEffect(() => { document.documentElement.lang = lang; document.documentElement.dir = dir; }, [lang, dir]);

  const t = (k) => { const v = (I18N[lang] && I18N[lang][k] != null ? I18N[lang][k] : (I18N.en[k] != null ? I18N.en[k] : k)); return SHOW_UC ? v : sanitizeUc(v); };
  const tr = (o) => { const v = (o && typeof o === "object" ? (o[lang] != null ? o[lang] : (o.en != null ? o.en : o.ar)) : o); return SHOW_UC ? v : sanitizeUc(v); };
  const clean = (s) => (SHOW_UC ? s : sanitizeUc(s));

  const pushLog = (textKeyOrObj, extra) => {
    const ts = new Date().toLocaleTimeString(lang === "ar" ? "ar-SA" : lang === "zh" ? "zh-CN" : "en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const text = typeof textKeyOrObj === "object" ? tr(textKeyOrObj) : (t(textKeyOrObj) + (extra ? " " + extra : ""));
    setLog((l) => [{ id: ++logSeq, ts, text }, ...l].slice(0, 40));
  };
  const addReport = (r) => setReports((rs) => {
    const ref = "FBC-2026-" + String(1000 + Math.floor(Math.random() * 9000));
    const ts = new Date().toLocaleString(lang === "ar" ? "ar-SA" : lang === "zh" ? "zh-CN" : "en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
    pushLog("log_report", ref);
    return [{ ref, ts, cov, status: "review", ...r }, ...rs];
  });
  const ackAlert = (id) => setAlerts((as) => as.map(a => a.id === id ? { ...a, ack: true } : a));
  const askOrchestrator = (scn) => { setPendingQ(scn); setRoute("chat"); };
  const reset = () => { setAlerts(ALERTS.map(a => ({ ...a, ack: false }))); setLog([]); setRoute("rcwork"); setDeptSub("revcol"); setPendingQ(null); };
  const cycleLang = () => setLang(l => (l === "ar" ? "en" : "ar")); // UI toggle: AR/EN only (zh via ?ln=zh)

  const value = { lang, setLang, cycleLang, dir, t, tr, clean, user, setUser, route, setRoute, deptSub, setDeptSub, cov, setCov,
    alerts, ackAlert, log, pushLog, reports, addReport, pendingQ, setPendingQ, perfJump, setPerfJump, backRoute, setBackRoute, alertsOpen, setAlertsOpen, curMode, setCurMode, askOrchestrator, reset };
  return <Store.Provider value={value}>{children}</Store.Provider>;
}

/* =========================================================================
   Icons & atoms
   ========================================================================= */
const GlobeIcon = (<svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><path d="M3 12h18" /><path d="M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z" /></svg>);
const ArrowIcon = (<svg className="ic-svg ic-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>);
const UserIcon = (<svg className="ic-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.2 3.6-7 8-7s8 2.8 8 7" /></svg>);
const NEXT_LANG_LABEL = { ar: "العربية", en: "English", zh: "中文" };

function KPI({ label, value, sub, tone }) {
  const color = tone === "good" ? "var(--green)" : tone === "bad" ? "var(--danger)" : tone === "warn" ? "var(--amber)" : "var(--ink)";
  return (<div className={"kpi" + (tone ? " kpi-" + tone : "")}><div className="label">{label}</div>
    <div className="value" style={{ color }}>{value}</div>{sub && <div className="sub">{sub}</div>}</div>);
}
function Section({ title, sub, right, children, className }) {
  return (<div className={"card pad acc" + (className ? " " + className : "")} style={{ marginBottom: 16 }}>
    <div className="page-h" style={{ marginBottom: sub ? 12 : 8 }}>
      <div><h2 style={{ fontSize: 16 }}>{title}</h2>{sub && <div className="sub muted">{sub}</div>}</div>{right}</div>
    {children}</div>);
}
function PageHeader({ title, sub, right }) { return (<div className="page-h"><div><h1>{title}</h1>{sub && <div className="sub">{sub}</div>}</div>{right}</div>); }
// Inline SVG Saudi Riyal glyph — renders identically on every browser/font (no U+20C1 charset issue).
function RiyalGlyph() {
  return (<svg className="riyal" viewBox="0 0 24 24" aria-label="SAR" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 4.5 V13.5 Q8 17 11.5 17" /><path d="M14 4.5 V13.5 Q14 17 17.5 17" /><path d="M5.5 8.6 L18.5 6.4" /><path d="M5.5 12.2 L18.5 10" /></svg>);
}
// Currency renders as plain "SAR" text.
function Money({ v }) { return <React.Fragment>{v}</React.Fragment>; }
function Chip({ sev, children }) { const c = sev === "red" ? "danger" : sev === "amber" ? "amber" : sev === "info" ? "info" : "gray"; return <span className={"chip " + c}>{children}</span>; }

function LineagePop() {
  const { t, tr } = useStore(); const [open, setOpen] = useState(false);
  return (<span style={{ position: "relative", display: "inline-block" }}>
    <button className="btn ghost sm" onClick={() => setOpen(o => !o)}>⌥ {t("lineage")}</button>
    {open && (<div className="card pad" style={{ position: "absolute", zIndex: 30, marginTop: 6, width: 300, insetInlineStart: 0, boxShadow: "var(--shadow)" }}>
      <div className="timeline">{LINEAGE.map((c, i) => (<div className="ev" key={i} style={{ paddingBottom: 12 }}><div style={{ fontSize: 12.5 }}>{tr(c)}</div></div>))}</div>
    </div>)}
  </span>);
}

/* =========================================================================
   Login
   ========================================================================= */
const ROLE_KEYS = ["analyst", "manager", "leader"];
const Skyline = (
  <svg viewBox="0 0 1440 700" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs><linearGradient id="bldsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#13796a" /><stop offset="0.55" stopColor="#0d5a4f" /><stop offset="1" stopColor="#093b35" /></linearGradient></defs>
    <rect width="1440" height="700" fill="url(#bldsky)" />
    <circle cx="1180" cy="150" r="60" fill="#1aa07f" opacity="0.25" />
    <g fill="#0c4a40"><rect x="40" y="420" width="120" height="280" /><rect x="200" y="360" width="90" height="340" /><rect x="330" y="300" width="70" height="400" /><rect x="430" y="440" width="110" height="260" /><rect x="580" y="250" width="60" height="450" /><rect x="660" y="330" width="100" height="370" /><rect x="800" y="280" width="80" height="420" /><rect x="900" y="420" width="120" height="280" /><rect x="1060" y="320" width="80" height="380" /><rect x="1170" y="380" width="100" height="320" /><rect x="1300" y="300" width="90" height="400" /></g>
  </svg>
);
function genCode() { const c = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let s = ""; for (let i = 0; i < 6; i++) s += c[Math.floor(Math.random() * c.length)]; return s; }
function Login() {
  const { t, setUser, cycleLang } = useStore();
  const [role, setRole] = useState("analyst");
  const [code, setCode] = useState(genCode);
  const [showPwd, setShowPwd] = useState(false);
  const fb = (e, base) => { const im = e.currentTarget, f = im.dataset.f || "0"; if (f === "0") { im.dataset.f = "1"; im.src = "public/assets/" + base; } else if (f === "1") { im.dataset.f = "2"; im.src = "assets/" + base; } else im.style.display = "none"; };
  return (<div className="bld-login">
    <div className="bld-bg">{Skyline}</div>
    <img className="bld-photo" src="/assets/building.jpg" alt="" onError={e => fb(e, "building.jpg")} />
    <div className="bld-overlay" />
    <div className="bld-center"><div className="bld-wrap"><div className="bld-row2">
      <div className="bld-brand-area">
        <div className="bld-logo">
          <img className="bld-logo-img" src="/assets/logo.png" alt="MoMAH" onError={e => fb(e, "logo.png")} />
          <span className="bld-logo-cap">{t("brandLine")}</span>
        </div>
        <h3 style={{ color: "#fff" }}>{t("sso_title")}</h3>
        <p>{t("sso_sub")}</p>
      </div>
      <div className="bld-card-col"><div className="bld-card fade">
        <h2>{t("signInTitle")}</h2>
        <div className="bld-fg"><label>{t("identity")}</label>
          <div className="bld-inp"><span className="ic">👤</span>
            <select value={role} onChange={e => setRole(e.target.value)}>{ROLE_KEYS.map(rk => <option key={rk} value={rk}>{t(rk + "_full")}</option>)}</select>
            <span className="caret">▾</span></div>
        </div>
        <div className="bld-fg"><label>{t("password")}</label>
          <div className="bld-inp has-eye"><span className="ic">🔒</span>
            <input type={showPwd ? "text" : "password"} value="********" readOnly />
            <span className="eye" onClick={() => setShowPwd(s => !s)} title="Show/Hide">👁</span></div>
        </div>
        <div className="bld-hint">{t("loginHint")}</div>
        <div className="bld-captcha"><div className="bld-code"><span>{code}</span></div>
          <button className="bld-refresh" onClick={() => setCode(genCode())} title="Refresh">⟳</button>
          <input placeholder={t("securityCode")} maxLength={6} /></div>
        <button className="bld-btn" onClick={() => setUser(role)}>{t("login_btn")}</button>
        <div className="bld-or">{t("or_")}</div>
        <button className="bld-nic" onClick={() => setUser(role)}>
          <div className="bld-nic-grid"><i className="g" /><i className="k" /><i className="o" /><i className="k" /><i className="g" /><i className="k" /><i className="o" /><i className="k" /><i className="g" /></div>
          <div><div className="l1">{t("nic1")}</div><div className="l2">{t("nic2")}</div></div></button>
        <div className="bld-create">{t("noAccount")} <button>{t("createAccount")}</button></div>
        <div className="bld-langrow"><button className="bld-lang2" onClick={cycleLang}>{GlobeIcon} العربية / English</button></div>
      </div></div>
    </div></div></div>
    <div className="bld-copy">{t("copyright")} · {t("syntheticData")}</div>
  </div>);
}

/* =========================================================================
   Shell
   ========================================================================= */
const NOTIFS = [
  { sev: "danger", t: { en: "Budget overrun — Housing Program 2.0 at 103% of allocation", ar: "تجاوز الميزانية — برنامج الإسكان 2.0 عند 103٪ من المخصص", zh: "预算超支——住房计划 2.0 已达拨款的 103%" }, time: { en: "2m ago", ar: "قبل دقيقتين", zh: "2 分钟前" } },
  { sev: "warn", t: { en: "Billing gap SAR 120M flagged in Revenue Collection · FY2026 Q3", ar: "فجوة فوترة SAR 120M في التحصيل · FY2026 Q3", zh: "收入征收发现征收缺口 SAR 120M · FY2026 Q3" }, time: { en: "18m ago", ar: "قبل 18 د", zh: "18 分钟前" } },
  { sev: "warn", t: { en: "42 contracts overdue >60 days in Riyadh-East Amanah", ar: "42 عقداً متأخراً >60 يوماً في أمانة الرياض-شرق", zh: "利雅得-东阿玛纳有 42 个合同逾期 >60 天" }, time: { en: "1h ago", ar: "قبل ساعة", zh: "1 小时前" } },
  { sev: "info", t: { en: "Forecast variance: Q3 spend projected 8% above plan", ar: "انحراف التنبؤ: إنفاق الربع 3 أعلى من الخطة بـ 8٪", zh: "预测偏差:Q3 支出预计高于计划 8%" }, time: { en: "3h ago", ar: "قبل 3 س", zh: "3 小时前" } },
];
function TopBar() {
  const { t, tr, lang, cycleLang, user, setUser, reset, setRoute, route, alerts } = useStore();
  const [open, setOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);
  const notifCount = notifRead ? 0 : NOTIFS.length;
  const fb = (e, base) => { const im = e.currentTarget, f = im.dataset.f || "0"; if (f === "0") { im.dataset.f = "1"; im.src = "public/assets/" + base; } else if (f === "1") { im.dataset.f = "2"; im.src = "assets/" + base; } else im.style.display = "none"; };
  const nextLang = lang === "ar" ? "en" : "ar";
  const openAlerts = alerts.filter(a => !a.ack).length;
  const tbtns = [["hub", "◧", "nav_hub"], ["chat", "✦", "nav_chat"], ["monitor", "◉", "nav_monitor"], ["reports", "📄", "nav_reports"]];
  return (<div className="topbar">
    <div className="brand">
      <img className="topbar-logo" src="/assets/logo.png" alt="MoMAH" onError={e => fb(e, "logo.png")} />
      <span className="topbar-sep" /><span className="topbar-app">{t("appName")}</span>
    </div>
    <div className="right">
      {URL_LANG === "zh" && tbtns.map(([r, ic, k]) => (<button key={r} className={"tbtn" + (route === r ? " on" : "")} onClick={() => setRoute(r)}>
        <span>{ic}</span><span className="tbtn-lbl">{t(k)}</span>{r === "monitor" && openAlerts ? <span className="badge-count">{openAlerts}</span> : null}</button>))}
      {URL_LANG === "zh" && <span className="topbar-sep" />}
      <button className="tbtn lang-pill" onClick={cycleLang}>{GlobeIcon} <span>{NEXT_LANG_LABEL[nextLang]}</span></button>
      <div className="notifmenu">
        <button className="tbtn notif-btn" onClick={() => setNotifOpen(o => !o)} title={tr({ en: "Notifications", ar: "الإشعارات", zh: "通知" })}>🔔{notifCount > 0 ? <span className="badge-count">{notifCount}</span> : null}</button>
        {notifOpen && <div className="panel notif-panel" onMouseLeave={() => setNotifOpen(false)}>
          <div className="notif-h"><b>{tr({ en: "Notifications", ar: "الإشعارات", zh: "通知" })}</b><button className="notif-clear" onClick={() => setNotifRead(true)}>{tr({ en: "Mark all read", ar: "تعليم الكل كمقروء", zh: "全部标为已读" })}</button></div>
          {NOTIFS.map((n, i) => (<div className={"notif-row " + n.sev + (notifRead ? " read" : "")} key={i}><span className="ni" /><div className="nx"><div className="nt"><Money v={tr(n.t)} /></div><div className="ntime">{tr(n.time)}</div></div></div>))}
        </div>}
      </div>
      <div className="usermenu">
        <button className="tbtn" onClick={() => setOpen(o => !o)}>{UserIcon} {t(user + "_full")} ▾</button>
        {open && <div className="panel" onMouseLeave={() => setOpen(false)}>
          <div style={{ padding: "6px 8px", fontWeight: 700 }}>{t(user + "_full")}</div>
          <div style={{ padding: "2px 8px 10px", fontSize: 12 }} className="muted">{t(user + "_desc")}</div>
          <div className="divider" style={{ margin: "6px 0" }} />
          <button className="btn ghost sm" style={{ width: "100%", marginBottom: 6 }} onClick={() => { reset(); setOpen(false); }}>↺ {t("resetDemo")}</button>
          <button className="btn danger sm" style={{ width: "100%" }} onClick={() => setUser(null)}>⎋ {t("logout")}</button>
        </div>}
      </div>
    </div>
  </div>);
}
// Left menu = BRD organizational tree (General Directorates → sub-departments), matching the reference.
const DEPARTMENTS = [
  { key: "g02", name: { en: "General Directorate of Planning and Financial Performance", ar: "الإدارة العامة للتخطيط والأداء المالي", zh: "规划与财务绩效总局" }, subs: [
    { id: "fpa", route: "fpawork", name: { en: "Financial Performance Analysis Department", ar: "إدارة تحليل الأداء المالي", zh: "财务绩效分析部" } },
    { id: "plan", route: "plnwork", name: { en: "Planning Department", ar: "إدارة التخطيط", zh: "规划部" } } ] },
  { key: "g03", name: { en: "General Budget Department", ar: "الإدارة العامة للميزانية", zh: "预算总局" }, subs: [
    { id: "budexec", route: "buwork", name: { en: "Budget Execution Department", ar: "إدارة تنفيذ الميزانية", zh: "预算执行部" } } ] },
  { key: "g04", name: { en: "General Administration of Affairs Finance", ar: "الإدارة العامة للشؤون المالية", zh: "财务事务总局" }, subs: [
    { id: "entitle", route: "entwork", name: { en: "Financial Entitlements Department", ar: "إدارة الاستحقاقات المالية", zh: "财务权益部" } },
    { id: "audit", route: "audwork", name: { en: "Audit Department", ar: "إدارة التدقيق", zh: "审计部" } } ] },
  { key: "g05", name: { en: "General Directorate of Financial Reporting", ar: "الإدارة العامة للتقارير المالية", zh: "财务报告总局" }, subs: [
    { id: "frep", route: "reports", name: { en: "Financial Reporting Department", ar: "إدارة التقارير المالية", zh: "财务报告部" } },
    { id: "comp", route: "compmemo", name: { en: "Compliance Department", ar: "إدارة الامتثال", zh: "合规部" } },
    { id: "cost", route: "csfunds", name: { en: "Cost Management Department", ar: "إدارة التكاليف", zh: "成本管理部" } },
    { id: "acct", route: "acctwork", name: { en: "Accounting Department", ar: "إدارة المحاسبة", zh: "会计部" } } ] },
  { key: "g06", name: { en: "General Directorate of Revenues and Assets", ar: "الإدارة العامة للإيرادات والأصول", zh: "收入与资产总局" }, subs: [
    { id: "revcol", route: "rcwork", name: { en: "Revenue Collection Department", ar: "إدارة التحصيل", zh: "收入征收部" } },
    { id: "assets", route: "aswork", name: { en: "Assets Department", ar: "إدارة الأصول", zh: "资产部" } } ] },
];
function Sidebar() {
  const { t, tr, route, setRoute, deptSub, setDeptSub, setBackRoute } = useStore();
  const [openG, setOpenG] = useState("g06");
  return (<div className="sidebar">
    <div className="sidebar-sub">{t("appName")}</div>
    {DEPARTMENTS.map(g => {
      const open = openG === g.key;
      return (<div className="dept" key={g.key}>
        <div className={"dept-head" + (open ? " open" : "")} onClick={() => setOpenG(open ? "" : g.key)}>
          <span style={{ flex: 1 }}>{tr(g.name)}</span><span className="chev">{open ? "▾" : "▸"}</span>
        </div>
        {open && <div className="dept-subs">{g.subs.map(s => { const on = s.id === "fpa" || s.id === "revcol" || s.id === "budexec" || s.id === "assets" || s.id === "audit" || s.id === "frep" || s.id === "comp" || s.id === "cost" || s.id === "plan" || s.id === "entitle" || s.id === "acct";
          return <div key={s.id} className={"dept-sub" + (deptSub === s.id ? " active" : "") + (on ? "" : " locked")} onClick={on ? () => { setBackRoute(null); setDeptSub(s.id); setRoute(s.route); } : undefined}>{tr(s.name)}{on ? null : <span className="lockic">🔒</span>}</div>;
        })}</div>}
      </div>);
    })}
  </div>);
}
function AgentLog() {
  const { t, log } = useStore(); const last = log[0];
  return (<div className="agentlog"><span className="alh"><span className="live-dot" />{t("agentlog_h")}</span>
    <span className="alline">{last ? (<><b>{last.ts}</b> · {last.text}</>) : "—"}</span></div>);
}

/* =========================================================================
   Hub
   ========================================================================= */
function EngineGrid() {
  const { t } = useStore();
  return (<div className="eng-grid">{ENGINES.map(e => (<div key={e.key} className={"eng" + (e.key === "orch" ? " orch" : "")}>
    <div className="et">{e.icon} {t("eng_" + e.key)}</div><div className="ed">{t("engd_" + e.key)}</div>
    <div className="es"><span className="pulse" />{t("online")} · {e.lvl} · {t("autonomous")}</div></div>))}</div>);
}
function SourceStrip() {
  const { t } = useStore();
  return (<div className="src11">{SOURCES11.map(s => { const col = s.status === "ok" ? "var(--green)" : s.status === "amber" ? "var(--amber)" : "var(--danger)";
    return (<div key={s.key} className="s" title={s.sla + " · " + s.fresh + "%"}><div className="sk">{t("src_" + s.key)}</div><div className="sd" style={{ background: col }} /></div>); })}</div>);
}
function UtilChart() {
  const C = RC; if (!C || !C.ResponsiveContainer) return null;
  return (<div style={{ width: "100%", height: 220 }}><C.ResponsiveContainer>
    <C.BarChart data={UTIL_BY_AMANA} margin={{ top: 6, right: 10, left: -16, bottom: 0 }}>
      <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" vertical={false} />
      <C.XAxis dataKey="k" tick={{ fontSize: 11 }} /><C.YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
      <C.Tooltip formatter={(v) => v + "%"} contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2eae5" }} />
      <C.Bar dataKey="v" radius={[6, 6, 0, 0]} fill="#1B8354" /></C.BarChart></C.ResponsiveContainer></div>);
}
function Hub() {
  const { t, user, setRoute, alerts, askOrchestrator } = useStore();
  const journeys = [
    { ic: "✦", col: "#2563eb", name: "j_chat_n", body: "j_chat_b", route: "chat" },
    { ic: "◉", col: "#e29700", name: "j_mon_n", body: "j_mon_b", route: "monitor" },
    { ic: "▦", col: "#1B8354", name: "j_bud_n", body: "j_bud_b", route: "budget" },
    { ic: "🧾", col: "#6d5ae6", name: "j_clm_n", body: "j_clm_b", route: "claims" },
    { ic: "◭", col: "#13796a", name: "j_plan_n", body: "j_plan_b", route: "planning" },
    { ic: "▤", col: "#475467", name: "j_rep_n", body: "j_rep_b", route: "reporting" },
    { ic: "◓", col: "#0b3b34", name: "j_rev_n", body: "j_rev_b", route: "revassets" },
  ];
  const open = alerts.filter(a => !a.ack);
  return (<div className="fade">
    <PageHeader title={t("hub_hello") + " · " + t(user + "_full")} sub={t("hub_sub")} />
    <div className="shock"><span className="si">⚡</span><span className="stxt">{t("shock_banner")}</span>
      <button className="btn" onClick={() => askOrchestrator("q_overrun")}>✦ {t("runAssessment")}</button><span className="spill">{t("brief_urgent")}</span></div>
    <div className="cols-4" style={{ marginBottom: 16 }}>
      <KPI label={t("k_fiscal")} value="SAR 4.82B" tone="good" />
      <KPI label={t("k_alerts")} value={open.length} tone={open.length ? "bad" : "good"} />
      <KPI label={t("k_util")} value="71.4%" tone="warn" /><KPI label={t("k_close")} value="92%" tone="good" />
    </div>
    <Section title={t("engines_title")}><EngineGrid /></Section>
    <Section title={t("sources_title")} right={<span className="chip">● 13 {t("live")}</span>}><SourceStrip /></Section>
    <div className="cols-2">
      <Section title={t("journeys_title")}><div className="cols-2">
        {journeys.map(j => (<div key={j.route} className="card pad jcard" onClick={() => setRoute(j.route)}>
          <div className="jh"><span className="jn" style={{ background: j.col }}>{j.ic}</span><strong>{t(j.name)}</strong></div>
          <div className="jbody">{t(j.body)}</div><div className="jgo">{t("open")} {ArrowIcon}</div></div>))}
      </div></Section>
      <Section title={t("utilByAmana")}><UtilChart /></Section>
    </div>
    <Section title={t("latest_alerts")} right={<button className="btn secondary sm" onClick={() => setRoute("monitor")}>{t("view")} {ArrowIcon}</button>}>
      {open.length === 0 ? <div className="muted">{t("noAlerts")}</div> : open.slice(0, 3).map(a => (<AlertRow key={a.id} a={a} compact />))}
    </Section>
  </div>);
}

/* =========================================================================
   Assistant (chat)
   ========================================================================= */
function Viz({ kind }) { if (kind === "util") return <UtilChart />; return null; }
function ThinkBlock({ scnKey, idx }) {
  const { t } = useStore(); const steps = SCN[scnKey].steps;
  return (<div className="msg bot"><div className="av">✦</div><div className="bubble" style={{ minWidth: 260 }}>
    <div className="ai-scan"><span /></div>
    <div className="think">{steps.map((s, i) => { const state = i < idx ? "ok" : i === idx ? "act" : "";
      return (<div key={i} className={"tl " + state}><span className="ti">{i < idx ? "✓" : i === idx ? "◐" : "○"}</span><span>{t(s[1])} · <b>{t("eng_" + s[0])}</b></span></div>); })}</div>
  </div></div>);
}
function BotMsg({ scnKey, onAction }) {
  const { t, tr } = useStore(); const scn = SCN[scnKey];
  return (<div className="msg bot"><div className="av">✦</div><div className="bubble">
    {scn.type === "escalate" && <div style={{ marginBottom: 6 }}><span className="chip danger">⚠ {t("escalated")}</span> <span className="muted" style={{ fontSize: 12 }}>{t("esc_perm")}</span></div>}
    {scn.type === "cross" && <div className="banner" style={{ marginBottom: 8 }}>↪ {t("crossNote")}</div>}
    <div style={{ fontSize: 13.5, lineHeight: 1.65 }}>{tr(scn.a)}</div>
    {scn.viz && <Viz kind={scn.viz} />}
    <div className="meta">{scn.conf != null && <span className="chip">{t("confidence")}: {scn.conf}%</span>}{(scn.srcs || []).map(s => <span key={s} className="chip gray">{t(s)}</span>)}</div>
    {(scn.actions || []).length > 0 && <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>{scn.actions.map((a, i) => <button key={i} className="btn secondary sm" onClick={() => onAction(a.to)}>{t(a.lk)} {ArrowIcon}</button>)}</div>}
    <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}>🛈 {t("draftNote")}</div>
  </div></div>);
}
function ChatAnalysis() {
  const { t, pushLog, addReport, pendingQ, setPendingQ, setRoute } = useStore();
  const [msgs, setMsgs] = useState([]); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false); const [think, setThink] = useState(null);
  const endRef = useRef(null);
  useEffect(() => { endRef.current && endRef.current.scrollIntoView({ behavior: "smooth" }); }, [msgs, think]);
  const run = (key, userText) => {
    const scn = SCN[key]; if (!scn || busy) return;
    setMsgs(m => [...m, { role: "user", text: userText || t(key) }]); setBusy(true); setThink({ scn: key, idx: 0 }); pushLog("log_route");
    let i = 0; const steps = scn.steps;
    const tick = () => { i++; if (i < steps.length) { setThink({ scn: key, idx: i }); setTimeout(tick, 600); } else { setThink(null); setBusy(false); setMsgs(m => [...m, { role: "bot", scn: key }]); if (scn.report) addReport({ name: scn.report, conf: scn.conf || "—" }); } };
    setTimeout(tick, 600);
  };
  useEffect(() => { if (pendingQ) { const q = pendingQ; setPendingQ(null); setTimeout(() => run(q), 250); } }, [pendingQ]);
  const submit = () => { const v = input.trim(); if (!v) return; setInput(""); const q = v.toLowerCase(); let key = "q_fiscal";
    if (/(dupl|مكرر|فاتورة|invoice|重复|发票)/.test(q)) key = "q_duplicate";
    else if (/(overrun|risk|تجاوز|خطر|超支|风险)/.test(q)) key = "q_overrun";
    else if (/(collect|تحصيل|征收)/.test(q)) key = "q_collection";
    else if (/(bank|sensitive|حساب|حساس|银行|敏感)/.test(q)) key = "q_vague";
    run(key, v); };
  return (<div className="fade">
    <PageHeader title={t("nav_chat")} sub={t("chat_sub")} />
    <div className="card pad acc">
      <div className="preset-row"><span className="muted" style={{ fontSize: 12, fontWeight: 700, alignSelf: "center" }}>{t("presets")}</span>
        {PRESETS.map(p => (<button key={p} className={"preset" + (p === "q_vague" ? " alt" : "")} disabled={busy} onClick={() => run(p)}>{t(p)}</button>))}</div>
      <div className="chat-wrap"><div className="chat-scroll">
        {msgs.length === 0 && <div className="muted" style={{ textAlign: "center", padding: "30px 0" }}>{t("draftNote")}</div>}
        {msgs.map((m, i) => m.role === "user" ? (<div key={i} className="msg user"><div className="av">{UserIcon}</div><div className="bubble">{m.text}</div></div>) : (<BotMsg key={i} scnKey={m.scn} onAction={(to) => setRoute(to)} />))}
        {think && <ThinkBlock scnKey={think.scn} idx={think.idx} />}<div ref={endRef} />
      </div>
        <div className="chat-input"><input className="input" placeholder={t("chat_ph")} value={input} disabled={busy} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && submit()} />
          <button className="btn" disabled={busy || !input.trim()} onClick={submit}>{t("send")}</button></div>
      </div>
    </div>
  </div>);
}

/* =========================================================================
   Monitoring
   ========================================================================= */
function AlertRow({ a, compact }) {
  const { t, tr, clean, ackAlert, askOrchestrator } = useStore();
  return (<div className={"mon " + (a.sev === "red" ? "red" : a.sev === "amber" ? "amber" : "")} style={{ marginBottom: 10 }}>
    <div className="mh"><span className="mname"><Chip sev={a.sev}>{t("sev_" + a.sev)}</Chip> <span className="wo">{a.id}</span></span><span className="muted" style={{ fontSize: 11.5 }}>{clean(a.src)}</span></div>
    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{tr(a.t)}</div>
    {!compact && <div className="muted" style={{ fontSize: 12.5, marginBottom: 8 }}><b>{t("rootCause")}:</b> {tr(a.rc)}</div>}
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {a.scn && <button className="btn sm" onClick={() => askOrchestrator(a.scn)}>✦ {t("askOrch")}</button>}
      {!compact && (a.ack ? <span className="chip">✓ {t("acked")}</span> : <button className="btn secondary sm" onClick={() => ackAlert(a.id)}>{t("ack")}</button>)}
    </div>
  </div>);
}
function Monitoring() {
  const { t, pushLog, alerts } = useStore(); const [scanning, setScanning] = useState(false);
  const open = alerts.filter(a => !a.ack);
  const runScan = () => { if (scanning) return; setScanning(true); pushLog("log_scan"); setTimeout(() => { setScanning(false); pushLog("scanDone"); }, 1600); };
  return (<div className="fade">
    <PageHeader title={t("nav_monitor")} sub={t("mon_sub")} right={<button className="btn" disabled={scanning} onClick={runScan}>{scanning ? t("scanning") : "◉ " + t("runScan")}</button>} />
    {scanning && <div className="scan-bar" style={{ marginBottom: 14 }}><span /></div>}
    <Section title={t("srcHealth")}><SourceStrip /></Section>
    <Section title={t("alerts")} right={<span className="chip danger">{open.length}</span>}>{alerts.length === 0 ? <div className="muted">{t("noAlerts")}</div> : alerts.map(a => <AlertRow key={a.id} a={a} />)}</Section>
  </div>);
}

/* =========================================================================
   Storyline
   ========================================================================= */
function StoryChain({ nodes, ran, runningIdx, view, setView }) {
  const { t, tr } = useStore();
  return (<div className="chain">{nodes.map((nd, i) => { const s = i === runningIdx ? "run" : i < ran ? "done" : "idle"; const col = s === "done" ? "var(--green)" : s === "run" ? "#6d5ae6" : null;
    return (<div key={i} className={"node " + (s === "run" ? "run" : s === "done" ? "done" : "")} onClick={() => i < ran && setView(i)} style={{ cursor: i < ran ? "pointer" : "default", outline: i === view ? "2px solid var(--green-100)" : "none" }}>
      <span className="node-dot" style={{ background: col || "#cbd5d0" }} />
      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: col || "inherit" }}>{nd.icon} {tr(nd.title)} {SHOW_UC && nd.uc ? <span className="tag" style={{ marginInlineStart: 6 }}>{nd.uc}</span> : null}</span>
      <span className="chain-metric">{s === "run" ? t("running") : i < ran ? tr(nd.metric) : "—"}</span></div>); })}</div>);
}
function FiscalBox({ f }) {
  const { t } = useStore(); const rows = [["ceiling", f.ceiling, ""], ["commit", f.commit, "−"], ["planL", f.plan, "−"], ["reserve", f.reserve, "−"]];
  return (<div className="card pad" style={{ background: "#f8fbf9" }}>{rows.map(([k, v, sg]) => (<div className="report-row" key={k}><span>{t(k)}</span><span className="mono">{sg} {v.toFixed(2)}</span></div>))}
    <div className="report-row" style={{ borderTop: "1px dashed var(--line)", marginTop: 4, paddingTop: 8 }}><strong style={{ color: "var(--green-dark)" }}>{t("fiscalSpace")}</strong><strong className="mono" style={{ color: "var(--green)", fontSize: 17 }}>{f.space.toFixed(2)} B</strong></div></div>);
}
function ReviewCard({ node, decision, onApprove, onReject }) {
  const { t, tr } = useStore(); const r = node.review; const decided = decision === "approved" || decision === "rejected";
  return (<div className="ai-eval" style={{ borderInlineStartColor: "#6d5ae6" }}>
    <div className="banner" style={{ marginBottom: 8 }}>🛈 {t("draft")}</div>
    <div className="ai-eval-top"><span className="ai-eval-ic">✦</span><span className="ai-eval-h">{t("aiReco")}{SHOW_UC && node.uc ? " · " + node.uc : ""}</span></div>
    <div className="ai-eval-t" style={{ color: "var(--ink)", fontWeight: 700 }}>{tr(r.headline)}</div>
    <div style={{ margin: "8px 0" }}><div className="report-row" style={{ borderBottom: "none", padding: 0 }}><span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>{t("confidence")}</span><span className="mono" style={{ color: "var(--green-dark)", fontWeight: 800 }}>{r.conf}%</span></div><div className="progress" style={{ marginTop: 4 }}><span style={{ width: r.conf + "%" }} /></div></div>
    <div className="card pad" style={{ background: "#fff", fontSize: 12.5 }}><b>{t("why")}:</b> {tr(r.why)}</div>
    <div className="meta" style={{ marginTop: 8 }}><span className="muted" style={{ fontSize: 11.5, fontWeight: 700 }}>{t("sources")}:</span>{r.srcs.map(s => <span key={s} className="chip gray">{s}</span>)}<LineagePop /></div>
    <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
      {!decided && <><button className="btn" onClick={onApprove}>✓ {t("approve")}</button><button className="btn danger" onClick={onReject}>✕ {t("reject")}</button><span className="muted" style={{ fontSize: 11.5, marginInlineStart: "auto", fontWeight: 700, color: "var(--amber)" }}>{t("pending")}</span></>}
      {decision === "approved" && <span className="chip">✓ {t("approved")}</span>}{decision === "rejected" && <span className="chip danger">✕ {t("rejected")}</span>}
    </div>
  </div>);
}
function ReportCard({ rep }) {
  const { tr } = useStore();
  return (<div className="report-card"><div className="rch"><span className="rt">📄 {tr(rep.title)}</span><LineagePop /></div>
    <div className="rcb"><div style={{ fontSize: 13, lineHeight: 1.7, marginBottom: 10 }}>{tr(rep.narrative)}</div>{rep.rows.map((r, i) => (<div className="report-row" key={i}><span>{tr(r.l)}</span><strong className="mono">{r.v}</strong></div>))}</div></div>);
}
function MiniKpi({ label, value, color }) {
  return (<div className="mini-kpi"><div className="muted">{label}</div><div className="v" style={color ? { color } : null}>{value}</div></div>);
}
function RevenueMini() {
  const { t, tr } = useStore();
  return (<div>
    <div className="cols-3" style={{ marginBottom: 12 }}>
      <MiniKpi label={t("rev_billed")} value={(REV_TOTALS.billed / 1000).toFixed(2) + " B"} />
      <MiniKpi label={t("rev_collected")} value={(REV_TOTALS.collected / 1000).toFixed(2) + " B"} />
      <MiniKpi label={t("rev_rate")} value={REV_TOTALS.rate + "%"} color="var(--green-dark)" />
    </div>
    <div className="scrollx"><table className="tbl"><thead><tr><th>{t("rev_source")}</th><th className="right-num">{t("cc_net")}</th><th className="right-num">{t("cc_collected")}</th><th className="right-num">{t("rev_rate")}</th></tr></thead>
      <tbody>{REVENUE_SOURCES.map(s => { var rate = (s.collected / s.net * 100).toFixed(1); return (<tr key={s.key}><td style={{ fontWeight: 600 }}>{tr(s.name)}</td><td className="right-num mono">{s.net}</td><td className="right-num mono">{s.collected}</td><td className="right-num mono" style={{ fontWeight: 700, color: parseFloat(rate) < 75 ? "var(--amber)" : "var(--green-dark)" }}>{rate}%</td></tr>); })}</tbody></table></div>
    <div className="muted" style={{ fontSize: 11.5, marginTop: 6 }}>{t("rev_excl")}: {REV_TOTALS.excl} M</div>
  </div>);
}
function PerfDevBlock() {
  const { t, tr } = useStore();
  return (<div>
    <div className="cols-3" style={{ marginBottom: 12 }}>
      <MiniKpi label={t("rev_rate")} value={REV_TOTALS.rate + "%"} />
      <MiniKpi label={t("pd_growth")} value="+6.4%" color="var(--green-dark)" />
      <MiniKpi label={t("pd_excl")} value={REV_TOTALS.excl + " M"} />
    </div>
    <table className="tbl"><thead><tr><th>{t("pd_signal")}</th><th className="right-num">{t("pd_value")}</th><th>{t("pd_status")}</th></tr></thead>
      <tbody>{REV_DEVIATIONS.map((d, i) => (<tr key={i}><td style={{ fontWeight: 600 }}>{tr(d.a)}</td><td className="right-num mono">{d.v}</td><td><Chip sev={d.f}>{t("sev_" + d.f)}</Chip></td></tr>))}</tbody></table>
  </div>);
}
function AssetsBlock() {
  const { t, tr } = useStore();
  const stMap = { active: ["info", "st_active"], maint: ["amber", "st_maint"], impair: ["red", "st_impair"] };
  return (<div>
    <div className="cols-4" style={{ marginBottom: 12 }}>
      <MiniKpi label={t("as_auc")} value={ASSET_CAP.aucOpen.toFixed(2) + " B"} />
      <MiniKpi label={t("as_cap")} value={ASSET_CAP.capitalized.toFixed(2) + " B"} color="var(--green-dark)" />
      <MiniKpi label={t("as_impair")} value={ASSET_CAP.impair} color="var(--danger)" />
      <MiniKpi label={t("as_maint")} value={ASSET_CAP.maintDue} color="var(--amber)" />
    </div>
    <div className="scrollx"><table className="tbl"><thead><tr><th>{t("as_class")}</th><th className="right-num">{t("as_value")}</th><th className="right-num">{t("as_capd")}</th><th className="right-num">{t("as_life")}</th><th className="right-num">{t("as_ret")}</th><th>{t("pd_status")}</th></tr></thead>
      <tbody>{ASSET_REGISTER.map((a, i) => { var st = stMap[a.status]; return (<tr key={i}><td style={{ fontWeight: 600 }}>{tr(a.cls)}</td><td className="right-num mono">{a.value}</td><td className="right-num mono">{a.cap || "—"}</td><td className="right-num mono">{a.life}</td><td className="right-num mono">{a.ret}</td><td><Chip sev={st[0]}>{t(st[1])}</Chip></td></tr>); })}</tbody></table></div>
  </div>);
}
function CostBlock() {
  const { t, tr } = useStore();
  const fmap = { idle: ["amber", "st_idle"], ok: ["info", "st_ok"], pending: ["amber", "st_pending"] };
  return (<div>
    <div className="scrollx"><table className="tbl" style={{ marginBottom: 10 }}><thead><tr><th>{t("co_ao")}</th><th>{t("co_proj")}</th><th>{t("co_fund")}</th><th className="right-num">{t("co_alloc")}</th><th className="right-num">{t("co_spent")}</th><th className="right-num">{t("co_unit")}</th><th>{t("pd_status")}</th></tr></thead>
      <tbody>{ASSIGNMENT_ORDERS.map((o, i) => { var f = fmap[o.flag]; return (<tr key={i}><td><span className="wo">{o.id}</span></td><td style={{ fontWeight: 600 }}>{tr(o.proj)}</td><td className="muted">{tr(o.fund)}</td><td className="right-num mono">{o.alloc}</td><td className="right-num mono">{o.spent}</td><td className="right-num mono">{o.unit}</td><td><Chip sev={f[0]}>{t(f[1])}</Chip></td></tr>); })}</tbody></table></div>
    <span className="chip">✓ {t("co_comp")}</span>
  </div>);
}
function QueryAudit() {
  const { t } = useStore();
  return (<div className="card pad" style={{ background: "#f8fbf9", marginTop: 12 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 6 }}>
      <strong style={{ fontSize: 13 }}>🔎 {t("qa_title")}</strong><span className="chip">{t("qa_scope")}</span></div>
    <div className="msg bot" style={{ maxWidth: "100%" }}><div className="av" style={{ background: "#1B8354" }}>✦</div><div className="bubble" style={{ fontSize: 12.5 }}>{t("qa_a")}</div></div>
    <div className="timeline" style={{ marginTop: 10 }}>
      <div className="ev"><div style={{ fontSize: 12 }}>{t("qa_log1")}</div></div>
      <div className="ev"><div style={{ fontSize: 12 }}>{t("qa_log2")}</div></div>
    </div>
  </div>);
}
function ForecastBlock() {
  const { t } = useStore(); const C = RC; if (!C || !C.ResponsiveContainer) return null;
  return (<div>
    <div style={{ width: "100%", height: 240 }}><C.ResponsiveContainer>
      <C.ComposedChart data={FORECAST_OBLIG} margin={{ top: 8, right: 10, left: -10, bottom: 0 }}>
        <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" vertical={false} />
        <C.XAxis dataKey="m" tick={{ fontSize: 11 }} /><C.YAxis tick={{ fontSize: 11 }} />
        <C.Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2eae5" }} /><C.Legend wrapperStyle={{ fontSize: 11 }} />
        <C.Area type="monotone" dataKey="space" name={t("fc_space")} stroke="#1B8354" fill="#cdeede" />
        <C.Line type="monotone" dataKey="oblig" name={t("fc_oblig")} stroke="#e32700" strokeWidth={2.4} dot={{ r: 3 }} />
      </C.ComposedChart></C.ResponsiveContainer></div>
    <div className="muted" style={{ fontSize: 11.5, marginTop: 4 }}>{t("fc_mape")} · SAR M</div>
  </div>);
}
function ScenarioBlock() {
  const { t } = useStore();
  return (<div className="scn-grid">
    {SCENARIOS.map(s => (<div key={s.key} className={"scn " + (s.key === "opt" ? "opt" : s.key === "pess" ? "pess" : "base")}>
      <div className="sct">{s.rec ? "★ " : ""}{t("sc_" + s.key)} {s.rec ? <span className="chip" style={{ marginInlineStart: 6 }}>{t("sc_rec")}</span> : null}</div>
      <div className="scrow"><span>{t("sc_space")}</span><b>{s.space.toFixed(2)} B</b></div>
      <div className="scrow"><span>{t("sc_oblig")}</span><b>{s.oblig.toFixed(2)} B</b></div>
      <div className="scrow"><span>{t("sc_cover")}</span><b style={{ color: s.cover === "watch" ? "var(--amber)" : "var(--green-dark)" }}>{t("cover_" + s.cover)}</b></div>
    </div>))}
  </div>);
}
function ClosingBlock() {
  const { t, tr } = useStore();
  const stMap = { matched: ["info", "cl_matched"], ureview: ["amber", "cl_ureview"], adjust: ["amber", "cl_adjust"] };
  return (<div>
    <div className="ar-leg" style={{ marginBottom: 12 }}>
      <span className="lgc"><span className="d" style={{ background: "var(--green)" }} />{t("cl_complete")} <span className="v">{t("cl_pass")}</span></span>
      <span className="lgc"><span className="d" style={{ background: "var(--amber)" }} />{t("cl_abnormal")} <span className="v">1 {t("cl_found")}</span></span>
      <span className="lgc"><span className="d" style={{ background: "var(--amber)" }} />{t("cl_missing")} <span className="v">2</span></span>
    </div>
    <div className="flow-col-h" style={{ marginBottom: 6 }}>{t("cl_recon")}</div>
    <div className="scrollx"><table className="tbl"><thead><tr><th>{t("cl_entity")}</th><th className="right-num">{t("cl_book")}</th><th className="right-num">{t("cl_system")}</th><th className="right-num">{t("cl_diff")}</th><th>{t("pd_status")}</th></tr></thead>
      <tbody>{RECON_ROWS.map((r, i) => { var st = stMap[r.st]; return (<tr key={i}><td style={{ fontWeight: 600 }}>{tr(r.ent)}</td><td className="right-num mono">{r.book}</td><td className="right-num mono">{r.sys}</td><td className="right-num mono" style={{ color: r.diff !== 0 ? "var(--amber)" : "var(--muted)" }}>{r.diff > 0 ? "+" : ""}{r.diff}</td><td><Chip sev={st[0]}>{t(st[1])}</Chip></td></tr>); })}</tbody></table></div>
    <div className="chip" style={{ marginTop: 8 }}>✎ {t("cl_entries")}: 2</div>
  </div>);
}
function NodeDetail({ node, decision, onApprove, onReject }) {
  const { t, tr } = useStore();
  return (<div className="card pad acc fade">
    <div className="page-h" style={{ marginBottom: 8 }}><div>{SHOW_UC && node.uc ? <span className="tag">{node.uc}</span> : null}<h2 style={{ fontSize: 16, display: "inline-block", marginInlineStart: SHOW_UC && node.uc ? 8 : 0 }}>{tr(node.title)}</h2><div className="sub muted" style={{ marginTop: 4 }}><b>{t("actor")}:</b> {tr(node.actor)}</div></div></div>
    <div style={{ fontSize: 13, marginBottom: 12 }}>{tr(node.desc)}</div>
    {node.kind === "agent" && node.table && (<table className="tbl" style={{ marginBottom: 12 }}><thead><tr>{tr(node.table.cols).map(c => <th key={c}>{c}</th>)}</tr></thead>
      <tbody>{node.table.rows.map((r, i) => (<tr key={i}><td style={{ fontWeight: 600 }}>{typeof r.a === "object" ? tr(r.a) : r.a}</td><td>{typeof r.v === "object" ? tr(r.v) : r.v}</td>{r.f !== undefined && <td><Chip sev={r.f}>{t("sev_" + r.f)}</Chip></td>}</tr>))}</tbody></table>)}
    {node.kind === "fiscal" && <div style={{ marginBottom: 12 }}><FiscalBox f={node.fiscal} /></div>}
    {node.kind === "revenue" && <div style={{ marginBottom: 12 }}><RevenueMini /></div>}
    {node.kind === "perfdev" && <div style={{ marginBottom: 12 }}><PerfDevBlock /></div>}
    {node.kind === "assets" && <div style={{ marginBottom: 12 }}><AssetsBlock /></div>}
    {node.kind === "cost" && <div style={{ marginBottom: 12 }}><CostBlock /></div>}
    {node.kind === "forecast" && <div style={{ marginBottom: 12 }}><ForecastBlock /></div>}
    {node.kind === "scenario" && <div style={{ marginBottom: 12 }}><ScenarioBlock /></div>}
    {node.kind === "closing" && <div style={{ marginBottom: 12 }}><ClosingBlock /></div>}
    {node.kind === "review" && <ReviewCard node={node} decision={decision} onApprove={onApprove} onReject={onReject} />}
    {node.kind === "report" && <ReportCard rep={node.report} />}
    {node.kind === "report" && node.queryaudit && <QueryAudit />}
    <div className="banner" style={{ marginTop: 12, background: "var(--green-50)", border: "1px solid var(--green-100)", color: "var(--green-dark)" }}>✓ <b>{t("output")}:</b> {tr(node.out)}</div>
  </div>);
}
function Storyline({ story, title, sub }) {
  const { t, tr, pushLog, addReport } = useStore(); const nodes = story.nodes;
  const [ran, setRan] = useState(0); const [runningIdx, setRunningIdx] = useState(-1); const [view, setView] = useState(0); const [decision, setDecision] = useState(null); const [busy, setBusy] = useState(false);
  const cur = ran > 0 ? nodes[Math.min(view, ran - 1)] : null;
  const reviewIdx = nodes.findIndex(n => n.kind === "review");
  const awaitingDecision = reviewIdx >= 0 && decision === null && ran - 1 === reviewIdx;
  const finished = ran === nodes.length;
  const runNext = () => { if (busy || awaitingDecision || finished) return; const i = ran; setBusy(true); setRunningIdx(i);
    setTimeout(() => { setRunningIdx(-1); setRan(i + 1); setView(i); setBusy(false); const nd = nodes[i]; const suffix = SHOW_UC && nd.uc ? " — " + nd.uc : ""; pushLog({ en: tr(nd.title) + suffix, ar: tr(nd.title) + suffix, zh: tr(nd.title) + suffix }); if (nd.kind === "report") { const rm = { budget: "rep_budget", claims: "rep_claims", revassets: "rep_revassets", planning: "rep_planning", reporting: "rep_reporting" }; addReport({ name: rm[story.key] || "rep_budget", conf: "—" }); } }, 850); };
  const decide = (d) => { setDecision(d); if (d === "approved") { pushLog("log_approve"); pushLog(nodes[reviewIdx].review.approveLog); } };
  const restart = () => { setRan(0); setRunningIdx(-1); setView(0); setDecision(null); setBusy(false); };
  return (<div className="fade">
    <PageHeader title={title} sub={sub} right={<button className="btn ghost sm" onClick={restart}>↺ {t("storyRestart")}</button>} />
    <Section title={SHOW_UC ? GCODE[story.key] : t("flow_steps")}>
      <StoryChain nodes={nodes} ran={ran} runningIdx={runningIdx} view={view} setView={setView} />
      <div style={{ marginTop: 12, display: "flex", gap: 8, alignItems: "center" }}>
        {!finished && !awaitingDecision && <button className="btn" disabled={busy} onClick={runNext}>{busy ? t("storyRunning") : "▶ " + t("storyRun") + " (" + (ran + 1) + "/" + nodes.length + ")"}</button>}
        {awaitingDecision && <span className="chip amber">⏳ {t("pending")}</span>}{finished && <span className="chip">✓ {t("storyDone")}</span>}
      </div>
    </Section>
    {cur && <NodeDetail node={cur} decision={cur.kind === "review" ? decision : null} onApprove={() => decide("approved")} onReject={() => decide("rejected")} />}
  </div>);
}

/* =========================================================================
   UC-06 — Financial Performance Analysis (4-step report builder)
   ========================================================================= */
function Robot() {
  return (<div className="robot"><span className="robot-ring" />
    <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
      {/* antenna */}
      <line x1="48" y1="10" x2="48" y2="20" stroke="#7fe0b3" strokeWidth="2.5" strokeLinecap="round" />
      <circle className="r-ant" cx="48" cy="8" r="4" fill="#46d39a" />
      {/* head */}
      <rect x="20" y="20" width="56" height="46" rx="13" fill="#0d5a4f" stroke="#46d39a" strokeWidth="2" />
      <rect x="26" y="26" width="44" height="34" rx="9" fill="#06302b" />
      {/* eyes */}
      <g className="r-eye" style={{ transformOrigin: "38px 41px" }}><circle cx="38" cy="41" r="6.5" fill="#46d39a" /><circle cx="38" cy="41" r="2.5" fill="#eafff6" /></g>
      <g className="r-eye" style={{ transformOrigin: "58px 41px" }}><circle cx="58" cy="41" r="6.5" fill="#46d39a" /><circle cx="58" cy="41" r="2.5" fill="#eafff6" /></g>
      {/* mouth */}
      <rect x="40" y="52" width="16" height="3" rx="1.5" fill="#2fae84" />
      {/* scan line */}
      <rect className="r-scan" x="28" y="30" width="40" height="2" rx="1" fill="#7fe0b3" opacity="0.5" />
      {/* ears */}
      <rect x="14" y="36" width="6" height="14" rx="3" fill="#13796a" /><rect x="76" y="36" width="6" height="14" rx="3" fill="#13796a" />
      {/* body hint */}
      <rect x="32" y="68" width="32" height="14" rx="6" fill="#0d5a4f" stroke="#46d39a" strokeWidth="1.5" />
    </svg></div>);
}
function mapColor(rate) { return rate >= 75 ? "#1B8354" : rate >= 50 ? "#e29700" : "#e32700"; }
/* Real Saudi Arabia silhouette — sampled from a true country outline, normalized to viewBox 0 0 420 300 (bbox x48..372 / y12..288). */
const KSA_PATH = "M116.7 12 L108.8 15.3 L100.4 17.8 L92 20.3 L85.1 23.5 L90.8 30.1 L96.5 36.7 L95.7 42.6 L90.7 49.4 L82.2 51.4 L76.4 57.4 L70.1 63.5 L61.5 62.3 L52.8 60.9 L50.5 69 L49 77.7 L47.7 84.2 L55.1 83.8 L60.3 90.7 L65 98 L69.6 105.3 L74.2 112.7 L79.4 119.5 L83.3 125.9 L87.8 133.3 L87.7 140.7 L92.1 148.2 L99.9 151.5 L106.5 156.9 L110.5 164.6 L114 172 L116.4 178.1 L114.9 186.4 L117.6 194.6 L118.8 202.8 L123.6 209.5 L129.8 215.1 L137.4 219.1 L143 224.8 L146.3 232.2 L149.7 239.4 L153.6 246.8 L157.9 254.4 L164.6 259.9 L168.6 266.8 L172.9 274.1 L178.1 275.9 L179.4 268.9 L182 261.1 L189.9 262.7 L198.4 261.5 L206.7 264.3 L214.8 267.6 L222.9 270.9 L229 275.6 L229 284.4 L231.3 288 L237.1 281.5 L242.9 274.9 L248.8 268.4 L254.6 261.8 L260.4 255.3 L266.3 248.7 L274.4 246.1 L283 244.1 L291.5 242.1 L300.1 240.1 L308.6 238 L317.1 235.9 L325.4 233 L333.7 230.1 L341.9 227.2 L350.2 224.3 L358.5 221.4 L364.7 216.5 L367.2 208.1 L369.8 199.7 L372.3 191.3 L371.7 183.2 L367 175.8 L358.8 175.3 L350.1 174.1 L341.4 172.9 L332.7 171.7 L324.7 169 L319.2 162.2 L313.7 155.3 L309 148.2 L308.6 143.2 L300.9 142.7 L295.8 136.3 L292.4 128.6 L289.8 124.4 L285.9 116.8 L288.2 111.9 L287.4 106.7 L280.8 101.6 L275 96.3 L272.1 92.4 L268 89 L264.3 82.8 L261 75.3 L252.2 75.1 L247.3 69.2 L239.7 66.3 L231.1 65.7 L222.3 65.2 L213.6 64.3 L204.9 63.4 L197.9 58.3 L191.1 52.8 L184.3 47.2 L177.6 41.6 L170.8 36 L164.1 30.4 L156.3 26.5 L148.7 22.2 L141.4 17.2 L133.6 13.6 L124.9 12 Z";
function KsaMap({ small }) {
  const { t, tr } = useStore();
  const [hov, setHov] = useState(null);
  const stObj = (r) => r >= 75 ? { en: "Strong", ar: "قوي", zh: "强" } : r >= 50 ? { en: "Watch", ar: "مراقبة", zh: "关注" } : { en: "Alert", ar: "تنبيه", zh: "预警" };
  return (<div>
    <svg viewBox="0 0 420 300" className="ksa-map-svg" style={small ? { width: "100%", height: 220 } : { width: "100%", maxWidth: 392, height: "auto", display: "block", margin: "0 auto" }}>
      <defs><clipPath id="ksaClip"><path d={KSA_PATH} /></clipPath></defs>
      {/* base land (soft yellow) */}
      <path d={KSA_PATH} fill="#fdf3d6" stroke="#1B8354" strokeWidth="1.6" strokeLinejoin="round" />
      {/* pastel administrative regions, clipped to the country outline */}
      <g clipPath="url(#ksaClip)">
        <ellipse cx="152" cy="46" rx="150" ry="52" fill="#fbe0e6" />
        <ellipse cx="100" cy="142" rx="74" ry="88" fill="#fbe0e6" />
        <ellipse cx="206" cy="277" rx="72" ry="30" fill="#fbe0e6" />
        <ellipse cx="198" cy="250" rx="42" ry="34" fill="#d6f0e0" />
      </g>
      {/* faint region dividers */}
      <g clipPath="url(#ksaClip)" stroke="#c8b696" strokeWidth="0.8" opacity="0.45" fill="none">
        <path d="M150 28 L182 120 L212 205" /><path d="M252 58 L242 160 L232 252" /><path d="M118 92 L210 132 L312 150" />
      </g>
      <path d={KSA_PATH} fill="none" stroke="#1B8354" strokeWidth="1.6" strokeLinejoin="round" />
      {UC_MAP.map(m => (<g key={m.id} className="map-mk" style={{ cursor: "pointer" }} onMouseEnter={() => setHov(m)} onMouseLeave={() => setHov(null)}>
        <circle cx={m.x} cy={m.y} r={hov === m ? (small ? 6.5 : 7.5) : (small ? 4.5 : 5.5)} fill={mapColor(m.rate)} stroke="#fff" strokeWidth="1.5" />
        {!small && <text x={m.x + 8} y={m.y + 3} className="map-mk-l">{tr(m.name)}</text>}</g>))}
      {hov && (() => { const lab = tr(hov.name) + " · " + hov.rate + "% · " + tr(stObj(hov.rate)); const w = Math.max(64, lab.length * 4.4 + 14);
        const tx = Math.min(Math.max(hov.x - w / 2, 4), 416 - w); const ty = hov.y - 24 < 4 ? hov.y + 12 : hov.y - 24;
        return (<g pointerEvents="none"><rect x={tx} y={ty} width={w} height="17" rx="4" fill="#16211c" opacity="0.94" />
          <text x={tx + 7} y={ty + 11.5} fill="#fff" fontSize="8.5" fontWeight="700">{lab}</text></g>); })()}
    </svg>
    {!small && <div className="map-legend"><span className="lg"><i style={{ background: "#1B8354" }} />{t("lg_green")}</span><span className="lg"><i style={{ background: "#e29700" }} />{t("lg_yellow")}</span><span className="lg"><i style={{ background: "#e32700" }} />{t("lg_red")}</span></div>}
  </div>);
}
function GMap() {
  const { t, tr } = useStore();
  return (<div>
    <div className="gmap-wrap">
      <iframe title="Saudi Arabia" loading="lazy" referrerPolicy="no-referrer-when-downgrade"
        src="https://maps.google.com/maps?q=Saudi%20Arabia&t=&z=5&ie=UTF8&iwloc=&output=embed" />
      <div className="gmap-overlay">{UC_MAP.map(m => (<span key={m.id} className="gmap-pin" title={tr(m.name) + " · " + m.rate + "%"}
        style={{ left: (m.x / 420 * 100) + "%", top: (m.y / 300 * 100) + "%", background: mapColor(m.rate) }} />))}</div>
    </div>
    <div className="map-legend"><span className="lg"><i style={{ background: "#1B8354" }} />{t("lg_green")}</span><span className="lg"><i style={{ background: "#e29700" }} />{t("lg_yellow")}</span><span className="lg"><i style={{ background: "#e32700" }} />{t("lg_red")}</span></div>
    <div className="gmap-cap">{t("mapNote")}</div>
  </div>);
}
function SpendChart({ small }) {
  const { t } = useStore(); const C = RC; if (!C || !C.ResponsiveContainer) return null;
  return (<div style={{ width: "100%", height: small ? 200 : 250 }}><C.ResponsiveContainer>
    <C.ComposedChart data={UC_SPEND} margin={{ top: 8, right: 10, left: -12, bottom: 0 }}>
      <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" vertical={false} /><C.XAxis dataKey="m" tick={{ fontSize: 11 }} /><C.YAxis tick={{ fontSize: 11 }} />
      <C.Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2eae5" }} /><C.Legend wrapperStyle={{ fontSize: 11 }} />
      <C.Bar dataKey="budget" name={t("spend_budget")} fill="#F8C630" radius={[5, 5, 0, 0]} /><C.Bar dataKey="actual" name={t("spend_actual")} fill="#1B8354" radius={[5, 5, 0, 0]} />
      <C.Line dataKey="actual" name={t("spend_trend")} stroke="#085D3A" strokeWidth={2} dot={{ r: 3 }} />
    </C.ComposedChart></C.ResponsiveContainer></div>);
}
function ServiceBars() {
  const { tr } = useStore();
  return (<div>{UC_SERVICES.map((s, i) => (<div className="svc-row" key={i}>
    <div className="sh"><span>{tr(s.name)}</span><span className="mono" style={{ color: "var(--green-dark)" }}>{s.pct}%</span></div>
    <div className="progress"><span style={{ width: s.pct + "%" }} /></div>
    <div className="ss">{tr({ en: "Actual", ar: "فعلي", zh: "实际" })}: {s.actual} M / {tr({ en: "Budget", ar: "ميزانية", zh: "预算" })}: {s.budget} M</div></div>))}</div>);
}
function VisionTable() {
  const { t, tr } = useStore();
  return (<table className="tbl"><thead><tr><th>{t("vp_init")}</th><th>{t("vp_port")}</th><th className="right-num">{t("vp_budget")}</th><th className="right-num">{t("vp_actual")}</th><th className="right-num">{t("vp_rem")}</th><th className="right-num">{t("vp_rate")}</th></tr></thead>
    <tbody>{UC_VISION.map((v, i) => (<tr key={i}><td style={{ fontWeight: 600 }}>{v.name}</td><td className="muted">{tr(v.port)}</td><td className="right-num mono">{v.b}</td><td className="right-num mono">{v.a}</td><td className="right-num mono">{v.r}</td><td className="right-num mono" style={{ fontWeight: 700, color: parseFloat(v.rate) < 90 ? "var(--amber)" : "var(--green-dark)" }}>{v.rate}</td></tr>))}</tbody></table>);
}
function RevenueSplit() {
  const { t, tr } = useStore(); const C = RC; if (!C || !C.ResponsiveContainer) return null;
  const data = REVENUE_SOURCES.map(s => ({ name: tr(s.name), collected: s.collected, outstanding: s.net - s.collected, weight: s.weight, color: s.color }));
  return (<div style={{ width: "100%", height: 280 }}><C.ResponsiveContainer>
    <C.ComposedChart data={data} margin={{ top: 22, right: 8, left: -14, bottom: 0 }}>
      <C.CartesianGrid strokeDasharray="3 3" stroke="#eef2ef" vertical={false} />
      <C.XAxis dataKey="name" tick={{ fontSize: 9.5 }} interval={0} /><C.YAxis yAxisId="l" tick={{ fontSize: 10 }} />
      <C.YAxis yAxisId="r" orientation="right" domain={[0, 40]} tickFormatter={v => v + "%"} tick={{ fontSize: 10 }} />
      <C.Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, border: "1px solid #e2eae5" }} /><C.Legend wrapperStyle={{ fontSize: 11 }} />
      <C.Bar yAxisId="l" dataKey="collected" name={t("rs_collected")} stackId="s">{data.map((d, i) => <C.Cell key={i} fill={d.color} />)}</C.Bar>
      <C.Bar yAxisId="l" dataKey="outstanding" name={t("rs_outstanding")} stackId="s" fill="#d0d5dd" radius={[5, 5, 0, 0]} />
      <C.Line yAxisId="r" dataKey="weight" name={t("rs_weight")} stroke="#e32700" strokeWidth={2} dot={{ r: 3, fill: "#e32700" }}>
        <C.LabelList dataKey="weight" position="top" formatter={v => v + "%"} style={{ fontSize: 10, fill: "#e32700", fontWeight: 700 }} /></C.Line>
    </C.ComposedChart></C.ResponsiveContainer></div>);
}
function CollectionRate() {
  const { t, tr } = useStore();
  return (<div className="fd-scroll">{REVENUE_SOURCES.map(s => { const rate = s.collected / s.net * 100;
    return (<div className="col-card" key={s.key}>
      <div className="cch"><span className="ccname">{tr(s.name)}</span><span className="ccpct">{rate.toFixed(1)}%</span></div>
      <div className="progress"><span style={{ width: rate + "%" }} /></div>
      <div className="ccgrid"><div><div className="ccl">{t("cc_collected")}</div><div className="ccv">{s.collected} M</div></div><div><div className="ccl">{t("cc_net")}</div><div className="ccv">{s.net} M</div></div></div>
    </div>); })}</div>);
}
function ReceivableProg() {
  const { t } = useStore();
  return (<div>
    <div className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>{t("rp_caption")}</div>
    <div className="ar-leg">{AR_LEGEND.map(l => (<span className="lgc" key={l.k}><span className="d" style={{ background: l.c }} />{t(l.k)} <span className="v">{l.v}</span></span>))}</div>
    <div className="card pad" style={{ background: "#fff" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 6 }}><strong style={{ fontSize: 13 }}>{t("rp_matrix")}</strong><span className="muted" style={{ fontSize: 11 }}>{t("rp_unit")}</span></div>
      <div className="scrollx"><table className="heat"><thead><tr><th></th>{AR_BUCKETS.map(b => <th key={b}>{b === "buck_current" ? t("buck_current") : b}</th>)}</tr></thead>
        <tbody>{AR_MATRIX.map(r => (<tr key={r.m}><td className="rh">{r.m}</td>{r.v.map((v, i) => { const c = arHeat(v); return <td key={i} className="cell" style={{ background: c[0], color: c[1] }}>{v.toFixed(1)}%</td>; })}</tr>))}</tbody></table></div>
    </div>
  </div>);
}
function RegionalAchieve() {
  const { t, tr } = useStore();
  return (<div className="fd-scroll">{REGIONAL_ACHIEVE.map((r, i) => { const gap = +(r.target - r.pct).toFixed(1); const status = gap <= 0 ? "above" : gap <= 3 ? "near" : "below";
    return (<div className="ach-card" key={i}>
      <div className="ach-head"><span className="ach-name">{tr(r.name)}</span><span className="ach-pct" style={{ color: status === "below" ? "var(--danger)" : "var(--green-dark)" }}>{r.pct}%</span></div>
      <div className="ach-track"><div className="ach-fill" style={{ width: r.pct + "%", background: status === "below" ? "var(--amber)" : "var(--green)" }} /><div className="ach-target" style={{ insetInlineStart: r.target + "%" }} /></div>
      <div className="ach-meta"><span>{t("ra_target")}: <b>{r.target}%</b></span><span>{t("ra_gap")}: <b>{gap}%</b></span><span className={"ach-status " + status}>{t("st_" + status)}</span></div>
    </div>); })}</div>);
}
function UcSteps({ step, setStep, reached }) {
  const { t } = useStore(); const labels = ["s1", "s2", "s3", "s4"];
  return (<div className="uc-steps">{labels.map((lb, i) => { const n = i + 1; const cls = step === n ? "on" : reached >= n ? "done" : "";
    return (<React.Fragment key={lb}>{i > 0 && <span className="uc-sep">›</span>}
      <button className={"uc-step " + cls} onClick={() => reached >= n && setStep(n)}><span className="n">{reached > n ? "✓" : n}</span>{t(lb)}</button></React.Fragment>); })}</div>);
}
function UcDashboard({ onCommentary }) {
  const { t } = useStore();
  const tagCls = { up: "up", flat: "flat", down: "down" };
  return (<div className="fade">
    <div className="cols-2" style={{ marginBottom: 16, alignItems: "start" }}>
      <div className="scope"><div className="sl">{t("scope_sum")}</div>
        <div style={{ margin: "6px 0", fontWeight: 700 }}>Ministry / All Amanas / All Municipalities / Apr 2026</div>
        <div className="objbar"><b>[{t("obj_sum")}]</b> Original 16,532M · Current 17,370M · Actual 11,117M · Remaining 6,253M · Rate 64.0% · Δ 838M · <b>{t("balance_check")}</b></div></div>
      <div style={{ textAlign: "end" }}><button className="btn secondary">{t("viewData")} 📊</button></div>
    </div>
    <div className="aibrief" style={{ marginBottom: 16 }}><div style={{ flex: 1 }}><div className="abh">✦ {t("ai_brief")}</div><div className="abx"><UcBriefText /></div></div><button className="btn" onClick={onCommentary}>{t("goCommentary")} {ArrowIcon}</button></div>
    <div className="cols-3" style={{ marginBottom: 14 }}>{UC_KPIS.slice(0, 3).map(k => (<div className="kpi k6" key={k.key}><span className={"ktag " + tagCls[k.tag]}>{t("tag_" + k.tag)}</span><div className="label">{t(k.key)}</div><div className="value">{k.value} <span style={{ fontSize: 16 }}>{k.unit === "%" ? "%" : k.unit + " SAR"}</span></div><div className="sub muted">{t(k.sub)}</div></div>))}</div>
    <div className="cols-4" style={{ marginBottom: 16 }}>{UC_KPIS.slice(3).map(k => (<div className="kpi k6" key={k.key}><span className={"ktag " + tagCls[k.tag]}>{t("tag_" + k.tag)}</span><div className="label">{t(k.key)}</div><div className="value" style={{ fontSize: 24 }}>{k.value}<span style={{ fontSize: 13 }}>{k.unit === "%" ? "%" : " " + k.unit}</span></div><div className="sub muted">{t(k.sub)}</div></div>))}</div>
    <div className="cols-2" style={{ alignItems: "start" }}>
      <Section title={t("map_title")} sub={t("map_sub")}><div className="ksa-map"><KsaMap /></div></Section>
      <Section title={t("spend_title")}><div className="spend-center"><SpendChart /></div></Section>
    </div>
    <h2 style={{ fontSize: 16, margin: "6px 0 12px" }}>{t("fdetail")}</h2>
    <div className="cols-2">
      <Section title={t("rev_split")}><RevenueSplit /></Section>
      <Section title={t("col_rate")}><CollectionRate /></Section>
    </div>
    <div className="cols-2">
      <Section title={t("recv_prog")}><ReceivableProg /></Section>
      <Section title={t("reg_ach")}><RegionalAchieve /></Section>
    </div>
    <div className="cols-2"><Section title={t("svc_title")}><ServiceBars /></Section><Section title={t("vision_title")}><div className="scrollx"><VisionTable /></div></Section></div>
  </div>);
}
function UcBriefText() { const { tr } = useStore(); return <>{tr({ en: "Asir Amana performs best at the moment, Al Baha Amana needs closer follow-up, and Developmental Housing plus Housing Program 2.0 remain the largest concentrations in the sample.", ar: "أمانة عسير هي الأفضل أداءً حالياً، وأمانة الباحة تحتاج متابعة أدق، ويظل الإسكان التنموي وبرنامج الإسكان 2.0 أكبر التركزات في العينة.", zh: "阿西尔阿玛纳目前表现最佳,巴哈阿玛纳需更密切跟进,发展性住房与住房计划 2.0 仍是样本中最大的集中点。" })}</>; }
function MiniChart({ kind }) {
  if (kind === "map") return <div className="ksa-map"><KsaMap small /></div>;
  if (kind === "spend") return <SpendChart small />;
  if (kind === "svc") return <ServiceBars />;
  if (kind === "vision") return <div className="scrollx"><VisionTable /></div>;
  if (kind === "kpi") { const { t } = useStore(); return (<div className="cols-2">{UC_KPIS.slice(0, 4).map(k => (<div className="kpi k6" key={k.key}><div className="label" style={{ fontSize: 12 }}>{t(k.key)}</div><div className="value" style={{ fontSize: 20 }}>{k.value}</div></div>))}</div>); }
  return <div className="muted" style={{ padding: 20, textAlign: "center" }}>—</div>;
}
const AI_OPT = { en: "[AI Optimized]: The executive report indicates that Asir Amana performs best at the moment, Al Baha Amana needs closer follow-up, and Developmental Housing plus Housing Program 2.0 remain the largest concentrations in the sample. (Adjusted specifically to emphasize the expenditure variance factors).", ar: "[محسّن بالذكاء الاصطناعي]: يشير التقرير التنفيذي إلى أن أمانة عسير هي الأفضل حالياً، وتحتاج أمانة الباحة إلى متابعة أوثق، ويبقى الإسكان التنموي وبرنامج الإسكان 2.0 أكبر التركّزات في العينة. (عُدّل خصيصاً لإبراز عوامل تباين الإنفاق).", zh: "[AI 优化]:执行报告显示 Asir Amana 目前表现最佳,Al Baha Amana 需要更密切跟进,发展性住房与住房计划 2.0 仍是样本中最大的集中点。(已专门调整以强调支出差异因素)。" };
function UcCommentary({ onAssemble }) {
  const { t, tr } = useStore();
  const [sel, setSel] = useState(0); const [rt, setRt] = useState("rt_exec");
  const slide = UC_SLIDES[sel];
  const [texts, setTexts] = useState(UC_SLIDES.map(s => tr(s.narr)));
  const setText = (v) => setTexts(ts => ts.map((x, i) => i === sel ? v : x));
  const [chat, setChat] = useState([{ role: "ai", text: t("copilot_hello") }]);
  const [cin, setCin] = useState(""); const [cbusy, setCbusy] = useState(false);
  const cRef = useRef(null);
  const sendChat = () => {
    if (!cin.trim() || cbusy) return; const u = cin.trim(); setCin(""); setCbusy(true);
    setChat(c => [...c, { role: "u", text: u }]);
    setTimeout(() => { setChat(c => [...c, { role: "ai", text: tr(AI_OPT), opt: true }]); setCbusy(false); }, 800);
  };
  useEffect(() => { const el = cRef.current; if (el) el.scrollTop = el.scrollHeight; }, [chat, cbusy]);
  return (<div className="fade">
    <div className="card pad cw-headcard"><PageHeader title={t("cw_title")} sub={t("cw_sub")} right={<span className="sect-right"><span className="muted" style={{ fontSize: 12, fontWeight: 700 }}>{t("finalType")}:</span><select className="input" style={{ width: "auto" }} value={rt} onChange={e => setRt(e.target.value)}><option value="rt_exec">{t("rt_exec")}</option><option value="rt_init">{t("rt_init")}</option><option value="rt_detail">{t("rt_detail")}</option></select></span>} /></div>
    <div className="cw-shell">
      <div className="cw-main">
        <div className="cw-main-grid">
          <div className="slide-col"><div className="flow-col-h" style={{ marginBottom: 8 }}>{t("slidePages")}</div>
            <div className="slide-frame"><div className="slide-list">
              {UC_SLIDES.map((s, i) => (<div key={s.id} className={"slide-thumb" + (i === sel ? " sel" : "")} onClick={() => setSel(i)}><div className="stt"><span className="stchk">✓</span> {tr(s.title)}</div><div className="sk" /></div>))}
            </div></div>
            <div className="flow-col-h" style={{ margin: "16px 0 8px" }}>{t("dataTables")}</div>
            <div className="slide-tables">{t("addTables")} <span className="cyc">▾</span></div>
          </div>
          <div className="slide-card"><div className="sch"><span style={{ fontWeight: 700 }}>{tr(slide.title)}</span><span className="chip" style={{ background: "rgba(255,255,255,.2)", color: "#fff" }}>{t("aiConf")}: 94%</span></div>
            <div className="scb"><div><div className="flow-col-h" style={{ marginBottom: 6 }}>{t("narrComment")}</div>
              <textarea className="narr-edit" value={texts[sel]} onChange={e => setText(e.target.value)} />
              <div className="muted" style={{ fontSize: 11.5, marginTop: 8 }}><b>{t("dataSrcLink")}:</b> {t("dataSrcVal")}</div>
              <div className="chip" style={{ marginTop: 6 }}>✓ {t("mathOk")}</div></div>
              <div><div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}><span className="flow-col-h">{t("chartLabel")}</span><span className="tag">{t("chart_" + slide.chart)}</span></div><MiniChart kind={slide.chart} /></div></div>
          </div>
        </div>
        <div className="cw-actions">
          <span style={{ display: "flex", gap: 8 }}><button className="btn ghost sm">⇄ {t("showDiff")}</button><button className="btn secondary sm">💬 {t("discussAI")}</button></span>
          <button className="btn" onClick={onAssemble}>{t("assemble")} {ArrowIcon}</button>
        </div>
      </div>
      <div className="copilot"><div className="cph">💬 {t("copilot_h")}</div>
        <div className="muted" style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>{t("copilot_target")}</div>
        <select className="input" style={{ marginBottom: 10 }} value={sel} onChange={e => setSel(+e.target.value)}>{UC_SLIDES.map((s, i) => <option key={s.id} value={i}>{tr(s.title)}</option>)}</select>
        <div className="cpmsgs" ref={cRef}>
          {chat.map((m, i) => (<div key={i} className={"cpmsg " + m.role + (m.opt ? " opt" : "")}>{m.text}</div>))}
          {cbusy && <div className="cpmsg ai think"><span className="wb-typing"><i /><i /><i /></span></div>}
        </div>
        <div style={{ marginTop: "auto" }}><div className="chat-input"><input className="input" value={cin} onChange={e => setCin(e.target.value)} placeholder={t("copilot_ph")} onKeyDown={e => e.key === "Enter" && sendChat()} /><button className="btn-ai btn" onClick={sendChat}>✦</button></div></div>
      </div>
    </div>
  </div>);
}
function UcReport({ onBack }) {
  const { t, tr, cov, addReport, pushLog } = useStore();
  const slides = [{ id: "cover", cover: true }].concat(UC_SLIDES);
  const [pg, setPg] = useState(0); const [submitted, setSubmitted] = useState(false);
  const total = slides.length; const s = slides[pg];
  const submit = () => { if (submitted) return; setSubmitted(true); addReport({ name: "rep_uc06", conf: "94" }); pushLog("log_uc06"); };
  return (<div className="fade">
    <div className="page-h"><button className="btn ghost sm" onClick={onBack}>↩ {t("backWs")}</button>
      <span className="sect-right"><span className={"status-pill " + (submitted ? "review" : "draft")}>{submitted ? t("st_review") : t("st_draft")}</span>
        <button className="btn" disabled={submitted} onClick={submit}>{submitted ? "✓ " + t("submitted") : t("submitReview") + " ✈"}</button>
        <button className="btn secondary sm" disabled>{t("exportPptx")}</button><button className="btn ghost sm" disabled>{t("exportPdf")}</button></span></div>
    <div className="deck-grid">
      <div><div className="flow-col-h" style={{ marginBottom: 8 }}>{t("slidePages")}</div><div className="slide-list">
        {slides.map((sl, i) => (<div key={i} className={"slide-thumb" + (i === pg ? " sel" : "")} onClick={() => setPg(i)}><div className="stt">{sl.cover ? "🏛 " + t("rt_exec") : tr(sl.title)}</div><div className="sk" /></div>))}
      </div></div>
      <div className="deck-card">
        <div className="deck-head"><strong>{s.cover ? "COVER" : tr(s.title)}</strong><span className="muted" style={{ fontSize: 12 }}>{t("cover_min")} · {t("page")} {pg + 1} {t("of")} {total}</span></div>
        {s.cover ? (<div className="deck-cover"><div className="dc-sub">{t("cover_country")}</div><div className="dc-sub">{t("cover_min")}</div>
          <div className="dc-title">{t("rt_exec")}</div>
          <div className="dc-meta">{t("cover_persp")} | {t("cover_scope")}: Ministry / All Amanas / Apr 2026</div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 22, fontSize: 12, opacity: 0.85 }}><span>{t("cover_agency")}</span><span>2026-06-19</span></div></div>)
          : (<div className="deck-body deck-watermark"><div style={{ fontSize: 13.5, lineHeight: 1.8 }}>"{tr(s.narr)}"</div><div>{s.chart !== "none" ? <MiniChart kind={s.chart} /> : <div className="muted" style={{ padding: 20 }}>—</div>}</div></div>)}
        <div className="deck-head" style={{ borderTop: "1px solid var(--line)", borderBottom: "none" }}>
          <span className="muted" style={{ fontSize: 12 }}>{t("page")} {pg + 1} {t("of")} {total}</span>
          <span style={{ display: "flex", gap: 8 }}><button className="btn ghost sm" disabled={pg === 0} onClick={() => setPg(p => p - 1)}>{t("prev")}</button><button className="btn sm" disabled={pg === total - 1} onClick={() => setPg(p => p + 1)}>{t("next")}</button></span>
        </div>
      </div>
    </div>
  </div>);
}
function PerfAnalysis() {
  const { t, tr, reports, perfJump, setPerfJump, setRoute, setDeptSub } = useStore();
  const [mode, setMode] = useState(perfJump ? "wizard" : "registry"); // registry | wizard
  const [step, setStep] = useState(1); const [reached, setReached] = useState(1); const [loading, setLoading] = useState(false); const [ridx, setRidx] = useState(0);
  const [jumpNote] = useState(perfJump ? perfJump.note : null);
  useEffect(() => { if (perfJump) setPerfJump(null); }, []);   // consume the deep-link once
  const goStep = (n) => { setStep(n); setReached(r => Math.max(r, n)); };
  const generate = () => { setStep(2); setReached(2); setLoading(true); setRidx(0);
    [1, 2, 3].forEach(k => setTimeout(() => setRidx(k), k * 850));
    setTimeout(() => setLoading(false), 3400); };
  const ucReports = reports.filter(r => r.name === "rep_uc06");
  const counts = { total: ucReports.length, pub: ucReports.filter(r => r.status === "pub").length, appr: ucReports.filter(r => r.status === "appr").length, rev: ucReports.filter(r => r.status === "review").length };

  if (mode === "registry") {
    return (<div className="fade">
      <div className="muted" style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{t("uc_dept_a")} / {t("uc_dept_b")}</div>
      <PageHeader title={t("uc_title")} sub={t("uc_sub")} />
      <div className="cols-4" style={{ marginBottom: 16 }}>
        <KPI label={t("uc_total")} value={counts.total} /><KPI label={t("uc_pub")} value={counts.pub} tone="good" />
        <KPI label={t("uc_appr")} value={counts.appr} /><KPI label={t("uc_inrev")} value={counts.rev} tone="warn" />
      </div>
      <Section title={t("uc_registry")} right={<button className="btn" onClick={() => { setMode("wizard"); setStep(1); setReached(1); }}>{t("uc_new")} +</button>}>
        {ucReports.length === 0 ? <div className="muted">{t("noReports")}</div> :
          (<table className="tbl"><thead><tr><th>{t("rep_title")}</th><th>{t("rep_cov")}</th><th>{t("rep_time")}</th><th>{t("rep_conf")}</th><th>{t("rep_ref")}</th></tr></thead>
            <tbody>{ucReports.map((r, i) => (<tr key={i}><td style={{ fontWeight: 600 }}>{t(r.name)}</td><td>{tr(SCOPE)}</td><td className="muted">{r.ts}</td><td>{r.conf === "—" ? "—" : r.conf + "%"}</td><td className="wo">{r.ref}</td></tr>))}</tbody></table>)}
      </Section>
    </div>);
  }
  return (<div className="fade">
    <div className="page-h" style={{ alignItems: "center" }}>
      <button className="btn ghost sm" onClick={() => { if (jumpNote) { setDeptSub("revcol"); setRoute("rcwork"); } else setMode("registry"); }}>↩ {jumpNote ? tr({ en: "Revenue Collection Department", ar: "إدارة التحصيل", zh: "收入征收部" }) : t("uc_back")}</button>
      <UcSteps step={step} setStep={goStep} reached={reached} />
    </div>
    {jumpNote && <div className="jump-note">↪ {tr(jumpNote)}</div>}
    {step === 1 && (<div className="card pad acc" style={{ maxWidth: 880, margin: "0 auto" }}>
      <h2 style={{ fontSize: 17 }}>⚙ {t("uc_cfg")}</h2><div className="sub muted" style={{ marginBottom: 16 }}>{t("uc_cfg_sub")}</div>
      <div className="uc-filter">
        <div className="field"><label>1. {t("f_level")}</label><select className="input"><option>{t("opt_ministry")}</option></select></div>
        <div className="field"><label>2. {t("f_amana")}</label><select className="input"><option>{t("opt_allAmanas")}</option></select></div>
        <div className="field"><label>3. {t("f_muni")}</label><select className="input"><option>{t("opt_allMuni")}</option></select></div>
        <div className="field"><label>4. {t("f_fy")}</label><select className="input"><option>FY2026</option></select></div>
        <div className="field"><label>5. {t("f_period")}</label><select className="input"><option>{t("opt_monthly")}</option><option>{t("opt_quarterly")}</option></select></div>
        <div className="field"><label>6. {t("f_specific")}</label><select className="input"><option>Apr 2026</option></select></div>
      </div>
      <div style={{ textAlign: "end", marginTop: 8 }}><button className="btn" onClick={generate}>{t("uc_generate")} ⚡</button></div>
    </div>)}
    {step === 2 && (loading
      ? (<div className="reason"><Robot /><h3>{t("reason_h")}</h3><div className="rsub">{t("reason_sub")}</div>
        <div className="reason-steps">{["rstep1", "rstep2", "rstep3", "rstep4"].map((rs, i) => (<div key={rs} className={"rs " + (i < ridx ? "ok" : i === ridx ? "act" : "")}><span className="ri">{i < ridx ? "✓" : i === ridx ? "◐" : "○"}</span>{t(rs)}</div>))}</div></div>)
      : <UcDashboard onCommentary={() => goStep(3)} />)}
    {step === 3 && <UcCommentary onAssemble={() => goStep(4)} />}
    {step === 4 && <UcReport onBack={() => goStep(3)} />}
  </div>);
}

/* =========================================================================
   Revenue Collection Department — multi-agent Workspace
   ========================================================================= */
const RC_KPIS = [
  { k: { en: "Billing gap", ar: "فجوة الفوترة", zh: "开票缺口" }, v: "SAR 12.4M", dot: "#e32700", d: "↑" },
  { k: { en: "Collection rate", ar: "نسبة التحصيل", zh: "征收率" }, v: "87.3%", dot: "#1B8354", d: "+1.2pp" },
  { k: { en: "Overdue amount", ar: "المبلغ المتأخر", zh: "逾期金额" }, v: "SAR 3.1M", dot: "#e29700", d: "42 cases" },
  { k: { en: "Top-risk Amanas", ar: "أمانات عالية الخطورة", zh: "高风险阿玛纳" }, v: "3", dot: "#e29700", d: "of 13" },
];
const RC_PROMPTS = [
  { t: { en: "Detect billing gap", ar: "كشف فجوة الفوترة", zh: "检测开票缺口" }, s: { en: "last 30 days · all Amanas", ar: "آخر 30 يوماً · كل الأمانات", zh: "近 30 天 · 全部阿玛纳" } },
  { t: { en: "Identify overdue risks", ar: "تحديد مخاطر التأخر", zh: "识别逾期风险" }, s: { en: "contracts > 60 days", ar: "عقود > 60 يوماً", zh: "合同 > 60 天" } },
  { t: { en: "Draft collection note", ar: "صياغة مذكرة تحصيل", zh: "起草征收说明" }, s: { en: "for executive review", ar: "للمراجعة التنفيذية", zh: "供高管复核" } },
];
const RC_SOURCES = [
  { en: "ERP · Billing", ar: "ERP · الفوترة", zh: "ERP · 开票" }, { en: "CRM · Contracts", ar: "CRM · العقود", zh: "CRM · 合同" },
  { en: "Bank · Receipts", ar: "البنك · الإيصالات", zh: "银行 · 回款" }, { en: "Tax · Invoices", ar: "الضريبة · الفواتير", zh: "税务 · 发票" },
];
const RC_AGENTS = [
  { id: "a1", code: "UC-01", kind: "base", icon: "⛁", route: "rcdata",
    chips: [{ t: { en: "Enabled", ar: "مفعّل", zh: "已启用" }, cls: "" }, { t: { en: "Base", ar: "أساس", zh: "基础" }, cls: "gray" }],
    title: { en: "Financial Data Consolidation and Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" },
    desc: { en: "Master-data layer. Reconciles ERP / CRM / Bank / Tax records, resolves duplicates and exposes a clean revenue dataset.", ar: "طبقة البيانات الرئيسية. توفّق سجلات ERP/CRM/البنك/الضريبة، وتعالج التكرار، وتوفّر مجموعة بيانات إيرادات نظيفة.", zh: "主数据层。对账 ERP/CRM/银行/税务记录,消除重复,输出干净的收入数据集。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Furas", ar: "Furas", zh: "Furas" }, { en: "Wusool", ar: "Wusool", zh: "Wusool" }, { en: "Oqood", ar: "Oqood", zh: "Oqood" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }] }] },
  { id: "a13", code: "UC-13", kind: "focus", icon: "★", route: null,
    chips: [{ t: { en: "NEW", ar: "جديد", zh: "新增" }, cls: "info" }, { t: { en: "Primary focus", ar: "التركيز الأساسي", zh: "主焦点" }, cls: "gray" }],
    title: { en: "Revenue, Collections & Exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、征收与排除项" },
    desc: { en: "Detects billing gap, scores overdue risk and proposes corrective collection actions for finance review.", ar: "يكشف فجوة الفوترة، ويقيّم مخاطر التأخر، ويقترح إجراءات تصحيحية للتحصيل لمراجعة المالية.", zh: "检测开票缺口,评估逾期风险,并提出供财务复核的纠正性征收措施。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Financial Unified data", ar: "بيانات مالية موحّدة", zh: "财务统一数据" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Collection rate", ar: "معدل التحصيل", zh: "征收率" }, { en: "Billing Gap", ar: "فجوة الفوترة", zh: "开票缺口" }, { en: "Overdue risk", ar: "مخاطر التأخر", zh: "逾期风险" }, { en: "Action Suggestions", ar: "اقتراحات الإجراءات", zh: "行动建议" }] }],
    mini: [
      { l: { en: "billing gap detected", ar: "فجوة فوترة", zh: "检出开票缺口" }, v: "SAR 12.4M", s: "▲ 8.2%", sTone: "danger" },
      { l: { en: "overdue risk · medium", ar: "مخاطر التأخر · متوسط", zh: "逾期风险 · 中" }, v: "42 cases", s: { en: "7 high", ar: "7 مرتفعة", zh: "7 高" }, sTone: "amber" },
      { l: { en: "recommended actions", ar: "إجراءات موصى بها", zh: "建议措施" }, v: { en: "14 corrections", ar: "14 تصحيحاً", zh: "14 项更正" }, s: { en: "5 escalations", ar: "5 تصعيدات", zh: "5 项升级" }, sTone: "strong" }],
    foot: { en: "Inputs · Data Quality (UC-01)   ·   Outputs · corrections, draft for Performance Analysis (UC-06)", ar: "مدخلات · جودة البيانات (UC-01)   ·   مخرجات · تصحيحات، مسودة لتحليل الأداء (UC-06)", zh: "输入 · 数据质量 (UC-01)   ·   输出 · 更正、绩效分析草稿 (UC-06)" },
    btn: { en: "Start analysis", ar: "بدء التحليل", zh: "开始分析" } },
  { id: "a6", code: "UC-06", kind: "existing", icon: "▦", route: "perf",
    chips: [{ t: { en: "Existing", ar: "قائم", zh: "现有" }, cls: "gray" }, { t: { en: "Draft generated by UC-13", ar: "مسودة من UC-13", zh: "由 UC-13 起草" }, cls: "amber" }],
    title: { en: "Performance Analysis, Expenditure and Executive Reports", ar: "تحليل الأداء والإنفاق والتقارير التنفيذية", zh: "绩效分析、支出与执行报告" },
    desc: { en: "Compiles weekly & monthly executive briefs. Consumes UC-13 corrections to refresh KPI commentary automatically.", ar: "يجمّع موجزات تنفيذية أسبوعية وشهرية. ويستهلك تصحيحات UC-13 لتحديث تعليق المؤشرات تلقائياً.", zh: "编制周/月度执行简报。消费 UC-13 的更正以自动刷新 KPI 评述。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Revenue & Collections analysis results", ar: "نتائج تحليل وكيل الإيرادات والتحصيل", zh: "收入征收智能体分析结果" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Executive reports", ar: "تقارير تنفيذية", zh: "执行报告" }] }],
    btn: { en: "Open draft", ar: "فتح المسودة", zh: "打开草稿" } },
  { id: "a14", code: "UC-14", kind: "base", icon: "⇲",
    chips: [{ t: { en: "Existing", ar: "قائم", zh: "现有" }, cls: "gray" }],
    title: { en: "Assets, Classification, Capitalization, Returns, and Maintenance", ar: "الأصول والتصنيف والرسملة والعوائد والصيانة", zh: "资产、分类、资本化、收益与维护" },
    desc: { en: "Turns signed contracts into live billing schedules — contract → billing live.", ar: "يحوّل العقود الموقّعة إلى جداول فوترة فعّالة — العقد ← الفوترة الحيّة.", zh: "将已签合同转为生效的计费计划——合同→计费上线。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Revenue config", ar: "إعداد الإيرادات", zh: "收入配置" }, { en: "Asset status", ar: "حالة الأصل", zh: "资产状态" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Active leases", ar: "عقود مفعّلة", zh: "生效租约" }] }] },
  { id: "a12", code: "UC-12", kind: "base", half: true, icon: "▤",
    chips: [{ t: { en: "Existing", ar: "قائم", zh: "现有" }, cls: "gray" }],
    title: { en: "Costs, Assignment Orders, and Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" },
    desc: { en: "Generates invoices and accounts receivable from active leases (AR generation).", ar: "ينشئ الفواتير والذمم المدينة من العقود المفعّلة.", zh: "依据生效租约生成发票与应收账款(AR 生成)。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Active leases", ar: "عقود مفعّلة", zh: "生效租约" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Invoices (AR)", ar: "فواتير (ذمم)", zh: "发票(应收)" }] }] },
  { id: "a11", code: "UC-11", kind: "base", half: true, icon: "◧",
    chips: [{ t: { en: "Existing", ar: "قائم", zh: "现有" }, cls: "gray" }],
    title: { en: "Compliance, Policies, and Accounting Memoranda", ar: "الامتثال والسياسات والمذكرات المحاسبية", zh: "合规、政策与会计备忘录" },
    desc: { en: "Records cash receipts and reconciles payments against invoices.", ar: "يسجّل المقبوضات النقدية ويطابقها مع الفواتير.", zh: "登记现金回款并与发票对账。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Invoices", ar: "فواتير", zh: "发票" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Cash receipts", ar: "مقبوضات نقدية", zh: "现金回款" }] }] },
  { id: "a10", code: "UC-10", kind: "base", half: true, icon: "▣",
    chips: [{ t: { en: "Existing", ar: "قائم", zh: "现有" }, cls: "gray" }],
    title: { en: "Generating financial and administrative reports and narrative commentaries", ar: "إنشاء التقارير المالية والإدارية والتعليقات السردية", zh: "生成财务与行政报告及叙述性评述" },
    desc: { en: "Compiles executive revenue reports from collections (executive view).", ar: "يجمّع تقارير الإيرادات التنفيذية من بيانات التحصيل.", zh: "依据征收数据编制高管收入报告(执行视图)。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Collections data", ar: "بيانات التحصيل", zh: "征收数据" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Executive revenue report", ar: "تقرير إيرادات تنفيذي", zh: "高管收入报告" }] }] },
  { id: "a3", code: "UC-03", kind: "base", half: true, icon: "◆",
    chips: [{ t: { en: "Existing", ar: "قائم", zh: "现有" }, cls: "gray" }],
    title: { en: "Smart Query, Audit Log, and Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" },
    desc: { en: "Computes portfolio-level asset performance KPIs.", ar: "يحسب مؤشرات أداء الأصول على مستوى المحفظة.", zh: "计算组合层面的资产绩效 KPI。" },
    io: [
      { t: "in", k: { en: "Input", ar: "مدخلات", zh: "输入" }, v: [{ en: "Revenue & asset data", ar: "بيانات الإيرادات والأصول", zh: "收入与资产数据" }] },
      { t: "out", k: { en: "Output", ar: "مخرجات", zh: "输出" }, v: [{ en: "Portfolio KPIs", ar: "مؤشرات المحفظة", zh: "组合 KPI" }] }] },
];
// ===== Business Plaza · two-lane (Revenue × Assets) model =====
const PLAZA_UCS = [
  { id: "uc01", lane: "rev", col: 0, code: "UC-01", title: { en: "Financial Data Unification & Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" }, agents: ["Orchestrator", "Data Querying", "Proactive Insights"] },
  { id: "uc13", lane: "rev", col: 1, code: "UC-13", title: { en: "Revenues, Collection & Exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、征收与排除项" }, agents: ["Revenue Analytics", "Data Querying", "Proactive Insights"], open: "rcbench" },
  { id: "uc06", lane: "rev", col: 2, code: "UC-06", title: { en: "Performance, Spend Analysis & Executive Reports", ar: "تحليل الأداء والإنفاق والتقارير التنفيذية", zh: "绩效、支出分析与执行报告" }, agents: ["Financial Reports Gen.", "Narrative Commentary", "Data Querying"], open: "report" },
  { id: "uc02", lane: "rev", col: 3, code: "UC-02", title: { en: "Anomaly Detection, Alerts & Exceptions", ar: "كشف الانحرافات والتنبيهات والاستثناءات", zh: "异常检测、告警与例外" }, agents: ["Anomaly Detection", "Proactive Insights", "Orchestrator"] },
  { id: "uc10", lane: "rev", col: 4, code: "UC-10", star: 1, title: { en: "Reporting & Dashboards (Periodic / Executive)", ar: "التقارير ولوحات المعلومات (دورية / تنفيذية)", zh: "报告与仪表盘(周期 / 执行)" }, agents: ["Financial Reports Gen.", "Narrative Commentary", "Data Querying"] },
  { id: "uc14", lane: "ast", col: 0, code: "UC-14", title: { en: "Assets: Classification, Capitalization, Return & Maintenance", ar: "الأصول: التصنيف والرسملة والعوائد والصيانة", zh: "资产:分类、资本化、收益与维护" }, agents: ["Data Querying", "Market Trends", "Compliance/Rules"], open: "asbench" },
  { id: "uc12", lane: "ast", col: 1, code: "UC-12", title: { en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" }, agents: ["Data Querying", "Financial Reports Gen.", "Anomaly Detection"] },
  { id: "uc11", lane: "ast", col: 2, code: "UC-11", star: 1, title: { en: "Compliance, Policies & Accounting Memos", ar: "الامتثال والسياسات والمذكرات المحاسبية", zh: "合规、政策与会计备忘录" }, agents: ["Compliance/Rules", "Financial Reports Gen.", "Data Querying"] },
  { id: "uc03", lane: "ast", col: 3, code: "UC-03", title: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" }, agents: ["Data Querying", "Orchestrator", "Proactive Insights"] },
];
const PLAZA_INTRA = [["uc01", "uc13"], ["uc13", "uc06"], ["uc06", "uc02"], ["uc02", "uc10"], ["uc14", "uc12"], ["uc12", "uc11"], ["uc11", "uc03"]];
const PLAZA_CROSS = [
  { from: "uc13", to: "uc12", label: { en: "Revenue & collection signals for cost/fund reconciliation", ar: "إشارات الإيرادات والتحصيل لمطابقة التكاليف/الصناديق", zh: "收入与征收信号 → 成本/资金对账" } },
  { from: "uc14", to: "uc06", label: { en: "Asset cost basis for performance reports", ar: "أساس تكلفة الأصول لتقارير الأداء", zh: "资产成本基础 → 绩效报告" } },
  { from: "uc12", to: "uc10", label: { en: "Asset costs, assignment orders & fund balances for unified reports", ar: "تكاليف الأصول وأوامر الإسناد وأرصدة الصناديق للتقارير الموحّدة", zh: "资产成本/派工单/资金余额 → 统一报告" } },
  { from: "uc02", to: "uc11", label: { en: "Anomalies escalated to compliance review", ar: "تصعيد الانحرافات إلى مراجعة الامتثال", zh: "异常升级 → 合规复核" } },
  { from: "uc11", to: "uc10", label: { en: "Compliance findings & accounting memos for reports", ar: "نتائج الامتثال والمذكرات المحاسبية للتقارير", zh: "合规结论与会计备忘 → 报告" } },
  { from: "uc03", to: "uc10", label: { en: "Audit trail & permissioned data exports supporting reports", ar: "سجل التدقيق وتصدير البيانات المصرّح به لدعم التقارير", zh: "审计轨迹与授权数据导出 → 报告" } },
];
const RC_FLOW = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cap: { en: "unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-13", label: { en: "Billing gap & risk", ar: "فجوة ومخاطر", zh: "缺口与风险" }, cap: { en: "billing gap & risk", ar: "فجوة الفوترة والمخاطر", zh: "开票缺口与风险" }, cls: "focus", star: true },
  { code: "UC-06 / UC-02", label: { en: "Executive draft & review", ar: "مسودة ومراجعة", zh: "执行草稿与复核" }, cap: { en: "executive draft & review", ar: "مسودة تنفيذية ومراجعة", zh: "执行草稿与复核" }, cls: "down" },
  { code: "UC-14 / UC-12", label: { en: "Downstream automation", ar: "أتمتة لاحقة", zh: "下游自动化" }, cap: { en: "downstream automation", ar: "الأتمتة اللاحقة", zh: "下游自动化" }, cls: "down" },
  { code: "UC-10 / UC-03", label: { en: "Strategic insight loop", ar: "حلقة الرؤى", zh: "战略洞察闭环" }, cap: { en: "strategic insight loop", ar: "حلقة الرؤى الاستراتيجية", zh: "战略洞察闭环" }, cls: "down" },
];
function ucl(code, name) { return SHOW_UC ? code + " · " + name : name; }

/* ======= Revenue Collection — Analysis Workbench (department landing) ======= */
const WB = {
  filters: [
    { lab: { en: "Fiscal Year / Month", ar: "السنة المالية / الشهر", zh: "财年 / 月份" }, opts: ["FY 2025 · Q2", "FY 2025 · Q3", "FY 2026 · Q1"] },
    { lab: { en: "Amanah", ar: "الأمانة", zh: "阿玛纳" }, opts: ["All Amanat (47)", "Riyadh-East", "Jeddah-Port", "Dammam-Ind."] },
    { lab: { en: "Revenue Type", ar: "نوع الإيراد", zh: "收入类型" }, opts: ["Fees · Fines · Leases", "Leases only", "Fees only", "Fines only"] },
    { lab: { en: "Contract Tags (optional)", ar: "وسوم العقد (اختياري)", zh: "合同标签(可选)" }, opts: ["Wusool · Oqood", "Wusool", "Oqood", "—"] },
  ],
  roles: [
    { name: { en: "Revenue Analytics Agent", ar: "وكيل تحليل الإيرادات", zh: "收入分析智能体" }, sub: { en: "Detects billing gaps, trends & overdue risk across revenue streams", ar: "يكشف فجوات الفوترة والاتجاهات ومخاطر التأخر عبر مصادر الإيراد", zh: "检测各收入流的开票缺口、趋势与逾期风险" }, status: "running", cls: "r-violet" },
    { name: { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }, sub: { en: "Aggregates Tahseel, Makeen, Efaa, Etimad & bank-statement data", ar: "يجمّع بيانات تحصيل ومكين وإفاء واعتماد وكشوف البنوك", zh: "聚合 Tahseel、Makeen、Efaa、Etimad 与银行流水数据" }, status: "active", cls: "r-blue" },
    { name: { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "前瞻洞察智能体" }, sub: { en: "Generates prioritized alerts & opportunity flags", ar: "يولّد تنبيهات مرتّبة وإشارات الفرص", zh: "生成排序告警与机会标记" }, status: "active", cls: "r-blue" },
  ],
  logs: [
    { tm: "10:02", code: "UC-01", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "Unified Furas + SAP AR + Doors records (47 Amanat)", ar: "وحّد سجلات فرص + SAP AR + Doors (47 أمانة)", zh: "统一 Furas + SAP AR + Doors 记录(47 阿玛纳)" }, dot: "blue" },
    { tm: "10:03", h: { en: "Join & Mapping", ar: "الربط والمطابقة", zh: "联接与映射" }, d: { en: "Loaded 2,184 contracts and reconciled customer keys", ar: "حمّل 2,184 عقداً ووفّق مفاتيح العملاء", zh: "载入 2,184 份合同并对账客户主键" }, dot: "blue" },
    { tm: "10:04", h: { en: "Document RAG", ar: "استرجاع الوثائق", zh: "文档 RAG" }, d: { en: "Retrieved 18 contract clauses (penalties, escalation, terms)", ar: "استرجع 18 بنداً تعاقدياً (غرامات، تصعيد، شروط)", zh: "检索 18 条合同条款(罚则、升级、条款)" }, dot: "amber" },
    { tm: "10:05", h: { en: "Numeric Query", ar: "الاستعلام الرقمي", zh: "数值查询" }, d: { en: "Calculated billing gap = SAR 120M · aging 0-30/31-60/61-90/>90", ar: "احتسب فجوة الفوترة = 120 مليون ريال · تقادم 0-30/31-60/61-90/>90", zh: "计算开票缺口 = SAR 120M · 账龄 0-30/31-60/61-90/>90" }, dot: "blue" },
    { tm: "10:06", code: "UC-13", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "Generated narrative · flagged 3 high-risk Amanat", ar: "ولّد السرد · حدّد 3 أمانات عالية الخطورة", zh: "生成叙述 · 标记 3 个高风险阿玛纳" }, dot: "violet" },
    { tm: "10:06", h: { en: "Orchestrator", ar: "المنسّق", zh: "编排器" }, d: { en: "Awaiting user follow-up question", ar: "بانتظار سؤال متابعة من المستخدم", zh: "等待用户追问" }, dot: "gray" },
  ],
  qs: [
    { en: "Where is today's billing gap?", ar: "أين فجوة الفوترة اليوم؟", zh: "今天的开票缺口在哪里?" },
    { en: "Which contracts drive most of the overdue?", ar: "ما العقود التي تقود معظم التأخر؟", zh: "哪些合同造成了大部分逾期?" },
    { en: "How does collection differ across Amanat?", ar: "كيف يختلف التحصيل بين الأمانات؟", zh: "各阿玛纳的征收有何差异?" },
  ],
  answers: [
    { en: "Today's billing gap is SAR 120M, concentrated in 3 Amanat — Riyadh-East (SAR 32M), Jeddah-Port (SAR 26M) and Dammam-Industrial (SAR 20M), together ~65% of the gap.", ar: "فجوة الفوترة اليوم 120 مليون ريال، مركّزة في 3 أمانات — الرياض-شرق (32) وجدة-الميناء (26) والدمام-الصناعية (20)، نحو 65% من الفجوة.", zh: "今天的开票缺口为 SAR 120M,集中在 3 个阿玛纳——利雅得-东(32M)、吉达-港(26M)、达曼-工业(20M),合计约占缺口的 65%。" },
    { en: "The top 5 contracts drive ~68% of overdue. CT-2025-0142 (Riyadh-East, SAR 32M) and CT-2025-0098 (Jeddah-Port, SAR 26M) lead, both aged beyond 60 days under Wusool lease terms.", ar: "أعلى 5 عقود تقود ~68% من التأخر. CT-2025-0142 (الرياض-شرق، 32) و CT-2025-0098 (جدة-الميناء، 26) في الصدارة، وكلاهما تجاوز 60 يوماً.", zh: "前 5 个合同造成约 68% 的逾期。CT-2025-0142(利雅得-东,32M)与 CT-2025-0098(吉达-港,26M)居首,均逾期超过 60 天(Wusool 租约条款)。" },
    { en: "Collection rate ranges 78%–94% across Amanat. Riyadh-East and Jeddah-Port lag near 80%, while Madinah-Central leads at 94%; lease-heavy Amanat collect ~10pp lower.", ar: "تتراوح نسبة التحصيل بين 78% و94% بين الأمانات. الرياض-شرق وجدة-الميناء قرب 80%، بينما المدينة-وسط الأعلى عند 94%.", zh: "各阿玛纳征收率介于 78%–94%。利雅得-东与吉达-港约 80% 偏低,麦地那-中以 94% 领先;租约占比高的阿玛纳低约 10 个百分点。" },
  ],
  genAns: { en: "From UC-13 unified data: collection rate 87% (+2.1% QoQ), collection gap SAR 120M, and 50% of overdue aged beyond 60 days — lease contracts are the primary driver.", ar: "من بيانات UC-13 الموحّدة: نسبة التحصيل 87% (+2.1%)، فجوة التحصيل 120 مليون ريال، و50% من التأخر تجاوز 60 يوماً — عقود الإيجار هي المحرّك الرئيسي.", zh: "依据 UC-13 统一数据:征收率 87%(环比 +2.1%),征收缺口 SAR 120M,50% 逾期超过 60 天——租约合同是主要成因。" },
  focus: [
    { id: "CT-2025-0142", am: { en: "Riyadh-East", ar: "الرياض-شرق", zh: "利雅得-东" }, od: "SAR 32M", risk: "high" },
    { id: "CT-2025-0098", am: { en: "Jeddah-Port", ar: "جدة-الميناء", zh: "吉达-港" }, od: "SAR 26M", risk: "high" },
    { id: "CT-2025-0211", am: { en: "Dammam-Ind.", ar: "الدمام-الصناعية", zh: "达曼-工业" }, od: "SAR 20M", risk: "med" },
    { id: "CT-2025-0167", am: { en: "Makkah-North", ar: "مكة-شمال", zh: "麦加-北" }, od: "SAR 14M", risk: "med" },
    { id: "CT-2025-0303", am: { en: "Madinah-Cent.", ar: "المدينة-وسط", zh: "麦地那-中" }, od: "SAR 9M", risk: "low" },
  ],
  dist: [
    { am: { en: "Riyadh-East", ar: "الرياض-شرق", zh: "利雅得-东" }, v: "SAR 32M", pct: 100, cls: "blue" },
    { am: { en: "Jeddah-Port", ar: "جدة-الميناء", zh: "吉达-港" }, v: "SAR 26M", pct: 81, cls: "blue" },
    { am: { en: "Dammam-Ind.", ar: "الدمام-الصناعية", zh: "达曼-工业" }, v: "SAR 20M", pct: 62, cls: "blue" },
    { am: { en: "Makkah-North", ar: "مكة-شمال", zh: "麦加-北" }, v: "SAR 14M", pct: 44, cls: "gray" },
    { am: { en: "Madinah-Cent.", ar: "المدينة-وسط", zh: "麦地那-中" }, v: "SAR 9M", pct: 28, cls: "gray" },
  ],
  next: [
    { t: { en: "Prioritize follow-up on Riyadh-East (SAR 32M)", ar: "أولوية متابعة الرياض-شرق (32 مليون)", zh: "优先跟进利雅得-东(SAR 32M)" }, d: { en: "Largest single gap — 27% of the SAR 120M total across 4 lease contracts aged > 60d. A focused 2-week dunning sprint recovers an est. SAR 18–22M this quarter.", ar: "أكبر فجوة مفردة — 27% من 120 مليون عبر 4 عقود إيجار > 60 يوماً؛ حملة مركّزة تسترد 18–22 مليون.", zh: "最大单点缺口——占 120M 的 27%,涉 4 份逾期>60天租约。集中 2 周催收本季可回收约 SAR 18–22M。" } },
    { t: { en: "Renegotiate Wusool lease terms (template v2)", ar: "إعادة التفاوض على شروط وصول (قالب v2)", zh: "重谈 Wusool 租约条款(模板 v2)" }, d: { en: "Lease-heavy Amanat collect ~10pp lower. Shorter cycles + milestone-linked invoicing cut the structural gap ~SAR 8–12M/qtr and lower DSO from 74 to ~60 days.", ar: "الأمانات كثيفة الإيجار أقل 10 نقاط؛ دورات أقصر تخفض الفجوة 8–12 مليون ربعياً وDSO إلى ~60.", zh: "租约重的阿玛纳征收率低约 10pp。缩短账期+里程碑开票季度减缺口约 SAR 8–12M,DSO 由 74 降至约 60 天。" } },
    { t: { en: "Open targeted dunning for > 90d contracts", ar: "فتح تحصيل موجّه للعقود > 90 يوماً", zh: "对 >90 天合同启动定向催收" }, d: { en: "50% of overdue is aged > 60d and 18 contracts crossed 90d. Auto-escalation + legal notice on the top 18 protects ~SAR 34M most at risk of write-off.", ar: "50% من التأخر > 60 يوماً و18 عقداً > 90؛ التصعيد يحمي ~34 مليون معرّضة للشطب.", zh: "50% 逾期超 60 天,18 个已过 90 天。对前 18 个自动升级+法律通知,保护最易核销的约 SAR 34M。" } },
  ],
  story: [
    { code: "UC-01", cap: { en: "Foundation", ar: "الأساس", zh: "基础" } },
    { code: "UC-13", cap: { en: "You are here", ar: "أنت هنا", zh: "当前位置" }, here: true },
    { code: "UC-06 / UC-02", cap: { en: "Summary / Alert", ar: "ملخص / تنبيه", zh: "摘要 / 告警" } },
    { code: "UC-14 / UC-12", cap: { en: "Operational follow-up", ar: "متابعة تشغيلية", zh: "运营跟进" } },
    { code: "UC-10 / UC-03", cap: { en: "Strategic loop", ar: "حلقة استراتيجية", zh: "战略闭环" } },
  ],
};
/* ======= Assets Department — Analysis Workbench (UC-14) data ======= */
const WB_AS = {
  filters: [
    { lab: { en: "Fiscal Year / Month", ar: "السنة المالية / الشهر", zh: "财年 / 月份" }, opts: ["FY 2025 · Q2", "FY 2025 · Q3", "FY 2026 · Q1"] },
    { lab: { en: "Amanah", ar: "الأمانة", zh: "阿玛纳" }, opts: ["All Amanat (47)", "Riyadh-East", "Jeddah-Port", "Makkah-North"] },
    { lab: { en: "Asset Class", ar: "فئة الأصل", zh: "资产类别" }, opts: ["All classes", "Land", "Buildings", "Infrastructure", "Equipment"] },
    { lab: { en: "Status", ar: "الحالة", zh: "状态" }, opts: ["AUC + In-service", "AUC only", "In-service", "Impaired"] },
  ],
  roles: [
    { name: { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }, sub: { en: "Queries & validates asset records across Asset Registry, SAP, Balady, Esnad", ar: "يستعلم ويتحقق من سجلات الأصول عبر سجل الأصول و SAP و بلدي و إسناد", zh: "跨资产台账、SAP、Balady、Esnad 查询并校验资产记录" }, status: "running", cls: "r-violet" },
    { name: { en: "Market Trends Detection Agent", ar: "وكيل كشف اتجاهات السوق", zh: "市场趋势检测智能体" }, sub: { en: "Benchmarks asset values vs construction costs & market", ar: "يقايس قيم الأصول مقابل تكاليف الإنشاء والسوق", zh: "对标资产价值与建造成本/市场" }, status: "active", cls: "r-blue" },
    { name: { en: "Compliance / Rules Agent", ar: "وكيل الامتثال / القواعد", zh: "合规 / 规则智能体" }, sub: { en: "Validates classification & capitalization vs policy & useful-life rules", ar: "يتحقق من التصنيف والرسملة وفق السياسة وقواعد العمر الإنتاجي", zh: "依政策与使用年限规则校验分类与资本化" }, status: "active", cls: "r-blue" },
  ],
  logs: [
    { tm: "10:02", code: "UC-01", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "Unified Asset Registry + SAP + Balady + Esnad (47 Amanat)", ar: "وحّد سجل الأصول + SAP + بلدي + إسناد (47 أمانة)", zh: "统一资产台账 + SAP + Balady + Esnad(47 阿玛纳)" }, dot: "blue" },
    { tm: "10:03", h: { en: "Data Querying", ar: "استعلام البيانات", zh: "数据查询" }, d: { en: "Loaded 8,640 asset records · 312 AUC items reconciled", ar: "حمّل 8,640 سجل أصل · سوّى 312 بنداً تحت الإنشاء", zh: "载入 8,640 条资产记录 · 对账 312 项在建资产" }, dot: "blue" },
    { tm: "10:04", h: { en: "Market Trends", ar: "اتجاهات السوق", zh: "市场趋势" }, d: { en: "Benchmarked 1,204 assets vs construction-cost index", ar: "قايس 1,204 أصلاً مقابل مؤشر تكلفة الإنشاء", zh: "对标 1,204 项资产与建造成本指数" }, dot: "amber" },
    { tm: "10:05", h: { en: "Compliance / Rules", ar: "الامتثال / القواعد", zh: "合规 / 规则" }, d: { en: "Applied useful-life & capitalization policy · 3 exceptions", ar: "طبّق سياسة العمر الإنتاجي والرسملة · 3 استثناءات", zh: "应用使用年限与资本化政策 · 3 项例外" }, dot: "blue" },
    { tm: "10:06", code: "UC-14", h: { en: "Agent", ar: "وكيل", zh: "智能体" }, d: { en: "Capitalized SAR 1.92B AUC · flagged 3 impairment, 5 maintenance", ar: "رسمل 1.92 مليار تحت الإنشاء · رصد 3 انخفاض، 5 صيانة", zh: "资本化 SAR 1.92B 在建资产 · 标记 3 项减值、5 项维护" }, dot: "violet" },
    { tm: "10:06", h: { en: "Orchestrator", ar: "المنسّق", zh: "编排器" }, d: { en: "Awaiting user follow-up question", ar: "بانتظار سؤال متابعة من المستخدم", zh: "等待用户追问" }, dot: "gray" },
  ],
  qs: [
    { en: "Which assets are due for capitalization?", ar: "ما الأصول المستحقة للرسملة؟", zh: "哪些资产应予资本化?" },
    { en: "Where are impairment risks concentrated?", ar: "أين تتركّز مخاطر انخفاض القيمة؟", zh: "减值风险集中在哪里?" },
    { en: "Which assets need maintenance soon?", ar: "ما الأصول التي تحتاج صيانة قريباً؟", zh: "哪些资产即将需要维护?" },
  ],
  answers: [
    { en: "SAR 1.92B of completed assets-under-construction is due for capitalization this period — led by road infrastructure (SAR 0.84B) and buildings (SAR 0.61B), all meeting the approved useful-life policy.", ar: "1.92 مليار ريال من الأصول تحت الإنشاء المكتملة مستحقة للرسملة هذه الفترة — تقودها البنية التحتية للطرق (0.84 مليار) والمباني (0.61 مليار).", zh: "本期 SAR 1.92B 已完工在建资产应资本化——以道路基础设施(SAR 0.84B)与建筑(SAR 0.61B)为主,均符合核定使用年限政策。" },
    { en: "Impairment risk is concentrated in 3 equipment items (SAR 47M net book value) showing idle utilization and market-value decline beyond the policy threshold.", ar: "تتركّز مخاطر الانخفاض في 3 معدات (47 مليون ريال صافي قيمة دفترية) تُظهر تشغيلاً خاملاً وتراجعاً سوقياً.", zh: "减值风险集中于 3 项设备(账面净值 SAR 47M),呈现闲置利用与超阈值的市场价值下跌。" },
    { en: "5 infrastructure assets are due for maintenance within 60 days; road segments R-118 and R-204 carry the highest condition-deterioration scores.", ar: "5 أصول بنية تحتية مستحقة للصيانة خلال 60 يوماً؛ مقاطع الطرق R-118 و R-204 الأعلى تدهوراً.", zh: "5 项基础设施资产将在 60 天内到期维护;路段 R-118 与 R-204 的状况劣化评分最高。" },
  ],
  genAns: { en: "From UC-14 asset data: SAR 1.92B AUC capitalized, 3 impairment flags (SAR 47M), 5 maintenance-due assets, and data-quality score 96% — asset cost is fully traceable from assignment order to register.", ar: "من بيانات UC-14: رُسمل 1.92 مليار، 3 مؤشرات انخفاض (47 مليون)، 5 أصول مستحقة صيانة، وجودة بيانات 96% — تكلفة الأصل قابلة للتتبع من أمر الإسناد إلى السجل.", zh: "依据 UC-14 资产数据:资本化 SAR 1.92B,3 项减值标记(SAR 47M),5 项待维护资产,数据质量 96%——资产成本从派工单到台账全程可追溯。" },
  focus: [
    { id: "EQ-2024-0471", am: { en: "Equipment", ar: "معدات", zh: "设备" }, od: "SAR 22M", risk: "high", flag: { en: "impairment", ar: "انخفاض", zh: "减值" } },
    { id: "EQ-2024-0388", am: { en: "Equipment", ar: "معدات", zh: "设备" }, od: "SAR 16M", risk: "high", flag: { en: "impairment", ar: "انخفاض", zh: "减值" } },
    { id: "R-118", am: { en: "Infrastructure", ar: "بنية تحتية", zh: "基础设施" }, od: "SAR 9M", risk: "med", flag: { en: "maintenance", ar: "صيانة", zh: "维护" } },
    { id: "R-204", am: { en: "Infrastructure", ar: "بنية تحتية", zh: "基础设施" }, od: "SAR 7M", risk: "med", flag: { en: "maintenance", ar: "صيانة", zh: "维护" } },
    { id: "BLD-1192", am: { en: "Buildings", ar: "مبانٍ", zh: "建筑" }, od: "SAR 4M", risk: "low", flag: { en: "review", ar: "مراجعة", zh: "复核" } },
  ],
  dist: [
    { am: { en: "Infrastructure", ar: "بنية تحتية", zh: "基础设施" }, v: "SAR 0.84B", pct: 100, cls: "blue" },
    { am: { en: "Buildings", ar: "مبانٍ", zh: "建筑" }, v: "SAR 0.61B", pct: 73, cls: "blue" },
    { am: { en: "Land", ar: "أراضٍ", zh: "土地" }, v: "SAR 0.31B", pct: 37, cls: "blue" },
    { am: { en: "Equipment", ar: "معدات", zh: "设备" }, v: "SAR 0.12B", pct: 14, cls: "gray" },
    { am: { en: "Other", ar: "أخرى", zh: "其他" }, v: "SAR 0.04B", pct: 5, cls: "gray" },
  ],
  next: [
    { t: { en: "Capitalize SAR 1.92B completed AUC", ar: "رسملة 1.92 مليار من الأصول المكتملة", zh: "资本化 SAR 1.92B 已完工在建资产" }, d: { en: "312 AUC items are past their in-service date. Capitalizing now corrects the depreciation base, avoids understated asset value, and clears the pre-close checklist.", ar: "312 بنداً تجاوزت تاريخ التشغيل؛ الرسملة تصحّح أساس الإهلاك وتغلق قائمة ما قبل الإقفال.", zh: "312 项在建资产已过投用日。立即资本化修正折旧基数、避免资产低估,并清空关账前清单。" } },
    { t: { en: "Raise impairment memos — 3 equipment items (SAR 47M)", ar: "مذكرات انخفاض لـ 3 معدات (47 مليون)", zh: "为 3 项设备开具减值备忘(SAR 47M)" }, d: { en: "Idle utilization plus market value below the policy threshold. Timely impairment prevents an overstated SAR 47M NBV and a likely UC-03 audit finding at year-end.", ar: "تشغيل خامل وقيمة دون الحد؛ الانخفاض في وقته يمنع تضخّم 47 مليون وملاحظة تدقيق.", zh: "闲置利用+市值低于政策阈值。及时减值避免 SAR 47M 账面净值虚高及年末 UC-03 审计发现。" } },
    { t: { en: "Schedule maintenance — road segments R-118 / R-204", ar: "جدولة صيانة R-118 / R-204", zh: "安排路段 R-118 / R-204 维护" }, d: { en: "Condition index is below threshold; deferring raises whole-life cost ~18%. Bundling into the Q3 plan protects return-on-asset and avoids emergency-repair premiums.", ar: "مؤشر الحالة دون الحد؛ التأجيل يرفع كلفة العمر ~18%؛ الدمج في خطة الربع الثالث يحمي العائد.", zh: "状态指数低于阈值;推迟使全生命周期成本升约 18%。并入 Q3 计划保护资产回报、规避抢修溢价。" } },
  ],
};
/* ===== v1 BACKUP — UC-13 Revenue Collection Multi-Agent Flow (kept as a separate page) ===== */
const MF_V1 = {
  sources: [
    { k: "E", n: "Etimad", s: { en: "Contracts, payment orders", ar: "العقود وأوامر الدفع", zh: "合同、付款单" } },
    { k: "S", n: "SAP / Asas", s: { en: "Invoicing, receipts", ar: "الفوترة والإيصالات", zh: "开票、回款" } },
    { k: "T", n: "Tahseel", s: { en: "Collection records", ar: "سجلات التحصيل", zh: "征收记录" } },
    { k: "F", n: "Efaa", s: { en: "Exclusions, enforcement", ar: "الاستبعادات والتنفيذ", zh: "排除项、执行" } },
  ],
  agents: [
    { n: { en: "Document RAG Agent", ar: "وكيل استرجاع الوثائق", zh: "文档 RAG 智能体" }, d: { en: "Contracts, policies, credit notes retrieval", ar: "استرجاع العقود والسياسات والإشعارات الدائنة", zh: "检索合同、政策、贷项通知" }, tag: { en: "unstructured", ar: "غير منظّم", zh: "非结构化" } },
    { n: { en: "Numeric Query Agent", ar: "وكيل الاستعلام الرقمي", zh: "数值查询智能体" }, d: { en: "Billed vs collected, aging, KPIs", ar: "المفوتر مقابل المحصّل، التقادم، المؤشرات", zh: "已开票 vs 已收、账龄、KPI" }, tag: { en: "structured", ar: "منظّم", zh: "结构化" } },
    { n: { en: "Join & Mapping Agent", ar: "وكيل الربط والمطابقة", zh: "联接与映射智能体" }, d: { en: "Link contracts to doors, services, AR lines", ar: "ربط العقود بالأبواب والخدمات وسطور الذمم", zh: "关联 合同/门类/服务/应收行" }, tag: { en: "relational", ar: "علائقي", zh: "关系型" } },
  ],
  outputs: [
    { t: { en: "Collection rate", ar: "نسبة التحصيل", zh: "征收率" }, s: { en: "% billed to collected", ar: "% المفوتر إلى المحصّل", zh: "% 开票 到 已收" }, c: "#1B8354" },
    { t: { en: "Billing Gap", ar: "فجوة الفوترة", zh: "开票缺口" }, s: { en: "expected minus billed", ar: "المتوقّع ناقص المفوتر", zh: "应开 减 已开" }, c: "#caa204" },
    { t: { en: "Overdue risk", ar: "مخاطر التأخر", zh: "逾期风险" }, s: { en: "30 / 60 / 90+ buckets", ar: "فئات 30 / 60 / 90+", zh: "30 / 60 / 90+ 分桶" }, c: "#e0473c" },
    { t: { en: "Action Suggestions", ar: "اقتراحات الإجراءات", zh: "行动建议" }, s: { en: "prioritized next steps", ar: "خطوات تالية مرتّبة", zh: "排序的后续步骤" }, c: "#2563eb" },
  ],
  down: [
    { code: "UC-06", n: { en: "Financial Performance Analysis", ar: "تحليل الأداء المالي", zh: "财务绩效分析" }, agents: [{ en: "Financial Reports Generation Agent", ar: "وكيل توليد التقارير المالية", zh: "财务报告生成智能体" }, { en: "Financial Narrative Commentary Agent", ar: "وكيل السرد والتعليق المالي", zh: "财务叙述评述智能体" }, { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }], cls: "green" },
    { code: "UC-02", n: { en: "Detection of deviations, alerts, and exceptions", ar: "كشف الانحرافات والتنبيهات والاستثناءات", zh: "偏差、告警与异常检测" }, agents: [{ en: "Anomaly Detection Agent", ar: "وكيل كشف الشذوذ", zh: "异常检测智能体" }, { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "前瞻洞察智能体" }, { en: "Orchestrator Agent", ar: "وكيل المنسّق", zh: "编排器智能体" }], cls: "green" },
    { code: "UC-14 / UC-12", n: { en: "Assets, Classification, Capitalization, Returns, and Maintenance", ar: "الأصول والتصنيف والرسملة والعوائد والصيانة", zh: "资产、分类、资本化、回报与维护" }, agents: [{ en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }, { en: "Market Trends Detection Agent", ar: "وكيل كشف اتجاهات السوق", zh: "市场趋势检测智能体" }, { en: "Compliance/Rules Agent", ar: "وكيل الامتثال/القواعد", zh: "合规/规则智能体" }], cls: "green" },
    { code: "UC-10 / UC-03", n: { en: "Smart Query, Audit Log, and Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志与权限" }, agents: [{ en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }, { en: "Orchestrator Agent", ar: "وكيل المنسّق", zh: "编排器智能体" }, { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "前瞻洞察智能体" }], cls: "green" },
  ],
};
function RcDataFlowV1() {
  const { tr, setRoute } = useStore();
  const colh = (code, name) => (SHOW_UC && code ? code + " · " : "") + name;
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const calc = () => { const w = wrapRef.current ? wrapRef.current.clientWidth : 1640; setScale(Math.min(1, w / 1640)); };
    calc(); window.addEventListener("resize", calc); return () => window.removeEventListener("resize", calc);
  }, []);
  return (<div className="fade mf">
    <div className="card pad mf-frame">
      <h1 style={{ fontSize: 21 }}><button className="pg-back" onClick={() => setRoute("rcdata")}>‹</button>{colh("UC-13", tr({ en: "Revenue Collection Exclusions — Multi-Agent Flow (v1)", ar: "التحصيل والاستبعادات — تدفّق متعدد الوكلاء (v1)", zh: "收入征收与排除项 — 多智能体流程 (v1)" }))}</h1>
      <div className="sub muted" style={{ marginTop: 3 }}>{tr({ en: "Archived previous version · UC-13 centric · sources to agents to outputs and downstream", ar: "نسخة محفوظة سابقة · محورها UC-13", zh: "已归档旧版 · 以 UC-13 为中心 · 数据源 到 智能体 到 输出与下游" })}</div>
      <div className="mf-canvas-wrap" ref={wrapRef} style={{ height: Math.ceil(880 * scale) }}><div className="mf-canvas" style={{ transform: "scale(" + scale + ")", transformOrigin: "top left" }}>
        <svg className="mf-svg" width="1640" height="880" viewBox="0 0 1640 880" fill="none">
          <defs>
            <marker id="mfag" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#9aa7b5" strokeWidth="1.6" /></marker>
            <marker id="mfab" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#2563eb" strokeWidth="1.8" /></marker>
          </defs>
          <path d="M190,93 C224,93 220,200 240,200" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M190,179 C224,179 224,255 240,255" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M190,265 C224,265 224,285 240,285" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M190,351 C224,351 224,330 240,330" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M475,270 C520,270 516,158 540,158" stroke="#2563eb" strokeWidth="2.1" markerEnd="url(#mfab)" />
          <path d="M635,198 L635,531" stroke="#9aa7b5" strokeWidth="1.6" strokeDasharray="5 6" />
          <path d="M730,317 C760,317 756,430 778,430" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M730,455 C760,455 760,443 778,443" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M730,593 C760,593 758,458 778,458" stroke="#9aa7b5" strokeWidth="1.7" markerEnd="url(#mfag)" />
          <path d="M896,443 C930,443 924,340 946,340" stroke="#2563eb" strokeWidth="2.1" markerEnd="url(#mfab)" />
          <path d="M1276,150 C1370,135 1410,120 1440,120" stroke="#2563eb" strokeWidth="2.1" markerEnd="url(#mfab)" />
          <path d="M1276,300 C1370,310 1410,320 1440,320" stroke="#2563eb" strokeWidth="2.1" markerEnd="url(#mfab)" />
          <path d="M1276,470 C1370,500 1410,520 1440,520" stroke="#9aa7b5" strokeWidth="1.7" strokeDasharray="5 5" markerEnd="url(#mfag)" />
          <path d="M1276,600 C1370,665 1410,720 1440,720" stroke="#9aa7b5" strokeWidth="1.7" strokeDasharray="5 5" markerEnd="url(#mfag)" />
        </svg>
        <div className="node mf-colh" style={{ left: 10, top: 14, width: 185 }}>{tr({ en: "UPSTREAM · DATA SOURCES", ar: "المنبع · مصادر البيانات", zh: "上游 · 数据源" })}</div>
        <div className="node mf-colh" style={{ left: 240, top: 14, width: 235, textAlign: "center" }}>{colh("UC-01", tr({ en: "UNIFICATION", ar: "التوحيد", zh: "统一" }))}</div>
        <div className="node mf-colh" style={{ left: 540, top: 14, width: 230 }}>{tr({ en: "ORCHESTRATOR · PARALLEL AGENTS", ar: "المنسّق · وكلاء متوازون", zh: "编排器 · 并行智能体" })}</div>
        <div className="node mf-colh" style={{ left: 946, top: 14, width: 330, textAlign: "center" }}>{colh("UC-13", tr({ en: "REVENUE COLLECTION AGENTS", ar: "وكلاء تحصيل الإيرادات", zh: "收入征收智能体" }))}</div>
        <div className="node mf-colh" style={{ left: 1440, top: 14, width: 185, textAlign: "center" }}>{tr({ en: "DOWNSTREAM", ar: "اللاحق", zh: "下游" })}</div>
        {MF_V1.sources.map((s, i) => (<div className="node mf-src" style={{ left: 10, top: 60 + i * 86, width: 180 }} key={i}><span className="mf-badge">{s.k}</span><div><div className="t">{s.n}</div><div className="d">{tr(s.s)}</div></div></div>))}
        <div className="node mf-card u01" style={{ left: 240, top: 110, width: 235 }}>
          <div className="hd"><b>{colh("UC-01", tr({ en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }))}</b><span className="chip">{tr({ en: "Data Foundation", ar: "أساس البيانات", zh: "数据基础" })}</span></div>
          <div className="row"><div className="k">{tr({ en: "Unification", ar: "التوحيد", zh: "统一" })}</div><div className="v">{tr({ en: "Cross-source entity resolution", ar: "حلّ الكيانات عبر المصادر", zh: "跨源实体解析" })}</div></div>
          <div className="row"><div className="k">{tr({ en: "Deduplication", ar: "إزالة التكرار", zh: "去重" })}</div><div className="v">{tr({ en: "Remove duplicate invoices/receipts", ar: "إزالة الفواتير/الإيصالات المكرّرة", zh: "去除重复发票/回款" })}</div></div>
          <div className="row"><div className="k">{tr({ en: "Mapping", ar: "المطابقة", zh: "映射" })}</div><div className="v">{tr({ en: "Furas to SAP AR to Doors / Services", ar: "فرص إلى SAP AR إلى الأبواب / الخدمات", zh: "Furas 到 SAP AR 到 门类/服务" })}</div></div>
          <div className="foot">{tr({ en: "Unified Revenue & Collection View", ar: "عرض موحّد للإيراد والتحصيل", zh: "统一收入与征收视图" })}</div>
        </div>
        <div className="node mf-orch" style={{ left: 540, top: 120, width: 190 }}><b>{tr({ en: "Orchestrator Agent", ar: "وكيل المنسّق", zh: "编排器智能体" })}</b><span>{tr({ en: "Plan · Route · Aggregate", ar: "خطّط · وجّه · جمّع", zh: "规划 · 路由 · 汇聚" })}</span></div>
        <div className="node mf-dispatch" style={{ left: 645, top: 206 }}>{tr({ en: "dispatch", ar: "إرسال", zh: "派发" })}</div>
        {MF_V1.agents.map((a, i) => (<div className="node mf-card pa" style={{ left: 540, top: 255 + i * 138, width: 190 }} key={i}><div className="hd"><span className="pdot" /><b>{tr(a.n)}</b></div><div className="pd">{tr(a.d)}</div><span className="ptag">{tr(a.tag)}</span></div>))}
        <div className="node mf-aggr" style={{ left: 778, top: 408, width: 118 }}><b>{tr({ en: "Aggregator", ar: "المُجمِّع", zh: "汇聚器" })}</b><span>{tr({ en: "Merge · Validate · Reduce", ar: "دمج · تحقّق · اختزال", zh: "合并 · 校验 · 归约" })}</span></div>
        <div className="node mf-uc13" style={{ left: 946, top: 95, width: 330 }}>
          <div className="hd"><b>{colh("UC-13", tr({ en: "Revenue Analytics Agent", ar: "وكيل تحليلات الإيرادات", zh: "收入分析智能体" }))}</b><span className="core">CORE</span></div>
          <div className="mf-narr"><div className="mf-narr-body">
            <div className="sct2">{tr({ en: "OUTPUTS", ar: "المخرجات", zh: "输出" })}</div>
            <div className="mf-outs">{MF_V1.outputs.map((o, i) => (<div className="mf-out" key={i}><div className="t"><span className="od" /> {tr(o.t)}</div><div className="s">{tr(o.s)}</div></div>))}</div>
          </div></div>
          <div className="mf-narr"><b>{tr({ en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" })}<span className="core">CORE</span></b>
            <div className="mf-narr-body">
              <div className="sct2">{tr({ en: "OUTPUTS", ar: "المخرجات", zh: "输出" })}</div>
              <div className="mf-outs">
                <div className="mf-out"><div className="t"><span className="od" /> {tr({ en: "AI Narratives", ar: "السرد الذكي", zh: "AI 叙述" })}</div><div className="s">{tr({ en: "natural-language explanations", ar: "تفسيرات بلغة طبيعية", zh: "自然语言解释" })}</div></div>
                <div className="mf-out"><div className="t"><span className="od" /> {tr({ en: "Q&A", ar: "أسئلة وأجوبة", zh: "问答" })}</div><div className="s">{tr({ en: "conversational follow-ups", ar: "متابعات حوارية", zh: "对话式追问" })}</div></div>
              </div>
            </div>
          </div>
          <div className="mf-narr"><b>{tr({ en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "前瞻洞察智能体" })}<span className="core">CORE</span></b>
            <div className="mf-narr-body">
              <div className="sct2">{tr({ en: "OUTPUTS", ar: "المخرجات", zh: "输出" })}</div>
              <div className="mf-outs">
                <div className="mf-out"><div className="t"><span className="od" /> {tr({ en: "Prioritize follow-up", ar: "أولوية المتابعة", zh: "优先跟进" })}</div><div className="s">{tr({ en: "top Amanat by gap", ar: "أعلى الأمانات فجوة", zh: "缺口最大阿玛纳" })}</div></div>
                <div className="mf-out"><div className="t"><span className="od" /> {tr({ en: "Wusool template terms", ar: "شروط قالب وصول", zh: "Wusool 模板条款" })}</div><div className="s">{tr({ en: "review with legal", ar: "مراجعة مع القانونية", zh: "与法务复核" })}</div></div>
                <div className="mf-out"><div className="t"><span className="od" /> {tr({ en: "Dunning workflow", ar: "مسار التحصيل", zh: "催收流程" })}</div><div className="s">{tr({ en: "contracts > 90 days", ar: "عقود > 90 يوماً", zh: "合同 > 90 天" })}</div></div>
              </div>
            </div>
          </div>
        </div>
        {MF_V1.down.map((d, i) => (<div className={"node mf-down " + d.cls} style={{ left: 1440, top: [30, 230, 430, 632][i], width: 185 }} key={i}><div className="t">{colh(d.code, tr(d.n))}</div>{d.agents ? <div className="mf-sublist">{d.agents.map((a, j) => (<div className="mf-subitem" key={j}><span className="sd" />{tr(a)}</div>))}</div> : <div className="s">{tr(d.s)}</div>}</div>))}
        <div className="node mf-edgelab" style={{ left: 480, top: 210 }}>{tr({ en: "unified data", ar: "بيانات موحّدة", zh: "统一数据" })}</div>
      </div></div>
    </div>
  </div>);
}
/* ===== UC-13 · Revenue Collection — Multi-Agent Flow ===== (rebuilt as full G-06 directorate flow) */
const F6_AG = {
  orch: { en: "Orchestrator Agent", ar: "وكيل المنسّق", zh: "编排器代理" },
  dataq: { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询代理" },
  insight: { en: "Proactive Insights Agent", ar: "وكيل الرؤى الاستباقية", zh: "主动洞察代理" },
  revan: { en: "Revenue Analysis Agent", ar: "وكيل تحليل الإيرادات", zh: "收入分析代理" },
  repgen: { en: "Financial Reports Generation Agent", ar: "وكيل توليد التقارير المالية", zh: "财务报告生成代理" },
  narr: { en: "Financial Narrative Commentary Agent", ar: "وكيل السرد المالي", zh: "财务叙述评论代理" },
  anom: { en: "Anomaly Detection Agent", ar: "وكيل كشف الشذوذ", zh: "异常检测代理" },
  market: { en: "Market Trends Detection Agent", ar: "وكيل اتجاهات السوق", zh: "市场趋势检测代理" },
  comp: { en: "Compliance / Rules Agent", ar: "وكيل الامتثال/القواعد", zh: "合规/规则代理" },
};
const F6_SRC = ["SAP / Asas", "Etimad", "Esnad", "Tahseel", "Makeen", "Efaa", "Sanad", "Balady", "GRP", "BI", { en: "Local files", ar: "ملفات محلية", zh: "本地文件" }, { en: "Bank statements", ar: "كشوف بنكية", zh: "银行对账单" }, "Excel / PDF"];
const F6 = {
  uc01: { code: "UC-01", x: 300, y: 132, w: 236, h: 168, title: { en: "Financial Data Unification & Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据统一 & 数据质量" }, ags: ["orch", "dataq", "insight"] },
  uc13: { code: "UC-13", x: 700, y: 132, w: 236, h: 168, title: { en: "Revenue, Collection & Exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、收款 & 排除项" }, ags: ["revan", "dataq", "insight"] },
  uc06: { code: "UC-06", x: 1100, y: 40, w: 236, h: 168, title: { en: "Financial Performance — Spend Analysis & Reporting", ar: "الأداء المالي — تحليل الإنفاق والتقارير", zh: "财务表现 — 支出分析与报告" }, ags: ["repgen", "narr", "dataq"] },
  uc02: { code: "UC-02", x: 1100, y: 250, w: 236, h: 168, title: { en: "Anomaly Detection — Alerts & Exceptions", ar: "كشف الشذوذ — التنبيهات والاستثناءات", zh: "异常检测 — 警报与异常" }, ags: ["anom", "insight", "orch"] },
  uc14: { code: "UC-14", x: 1474, y: 132, w: 230, h: 168, title: { en: "Assets — Classification, Capitalization, Returns & Maintenance", ar: "الأصول — التصنيف والرسملة والعوائد والصيانة", zh: "资产 — 分类、资本化、回报与维护" }, ags: ["dataq", "market", "comp"] },
  uc12: { code: "UC-12", x: 300, y: 524, w: 236, h: 168, title: { en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、分配订单 & 资金" }, ags: ["dataq", "repgen", "anom"] },
  uc11: { code: "UC-11", x: 300, y: 732, w: 236, h: 168, title: { en: "Compliance, Policies & Accounting Memos", ar: "الامتثال والسياسات والمذكرات المحاسبية", zh: "合规性、政策 & 会计备忘" }, ags: ["comp", "repgen", "dataq"] },
  uc10: { code: "UC-10", x: 700, y: 524, w: 236, h: 168, title: { en: "Reports & Dashboards (Periodic / Executive)", ar: "التقارير ولوحات المعلومات (دوري/تنفيذي)", zh: "报告与仪表盘 (定期/执行)" }, ags: ["repgen", "narr", "dataq"] },
  uc03: { code: "UC-03", x: 700, y: 732, w: 236, h: 140, title: { en: "Smart Query, Audit Log & Permissions", ar: "الاستعلام الذكي وسجل التدقيق والصلاحيات", zh: "智能查询、审计日志 & 权限" }, ags: ["dataq", "insight"] },
};
const F6_GATE = { x: 1100, y: 606, w: 236, h: 188 };
const F6_DEL = { x: 1474, y: 620, w: 230, h: 152 };
function RcDataFlow() {
  const { tr, setRoute } = useStore();
  const colh = (code, name) => (SHOW_UC && code ? code + " · " : "") + name;
  const wrapRef = useRef(null);
  const [scale, setScale] = useState(1);
  const CW = 1716, CH = 920;
  useEffect(() => {
    const calc = () => { const w = wrapRef.current ? wrapRef.current.clientWidth : CW; setScale(Math.min(1.3, w / CW)); };
    calc(); window.addEventListener("resize", calc); return () => window.removeEventListener("resize", calc);
  }, []);
  const aR = n => ({ x: n.x + n.w, y: n.y + n.h / 2 });
  const aL = n => ({ x: n.x, y: n.y + n.h / 2 });
  const aT = n => ({ x: n.x + n.w / 2, y: n.y });
  const aB = n => ({ x: n.x + n.w / 2, y: n.y + n.h });
  const o = (p, q) => { const mx = (p.x + q.x) / 2; return "M" + p.x + "," + p.y + " L" + mx + "," + p.y + " L" + mx + "," + q.y + " L" + q.x + "," + q.y; };
  const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
  const plen = (d) => { const pts = d.replace(/[ML]/g, "").trim().split(/\s+/).map(p => p.split(",").map(Number)); let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return L; };
  const flyDur = (d) => Math.min(9, Math.max(1.8, plen(d) / 170));
  const F = F6, SRC = { x: 10, y: 64, w: 184, h: 300 };
  const b14 = aB(F.uc14);
  const w12 = "M" + b14.x + "," + b14.y + " L" + b14.x + ",462 L96,462 L96," + aL(F.uc12).y + " L" + aL(F.uc12).x + "," + aL(F.uc12).y;
  const w11 = "M" + (b14.x + 22) + "," + b14.y + " L" + (b14.x + 22) + ",488 L72,488 L72," + aL(F.uc11).y + " L" + aL(F.uc11).x + "," + aL(F.uc11).y;
  const E = [
    { d: o(aR(SRC), aL(F.uc01)), c: "g", lp: mid(aR(SRC), aL(F.uc01)), t: { en: "Raw revenue, asset feeds", ar: "بيانات خام", zh: "原始/资产数据" } },
    { d: o(aR(F.uc01), aL(F.uc13)), c: "b", lp: mid(aR(F.uc01), aL(F.uc13)), t: { en: "Unified revenue/collection data + DQ flags", ar: "موحّد + الجودة", zh: "统一+DQ标志" } },
    { d: o(aR(F.uc13), aL(F.uc06)), c: "b", lp: mid(aR(F.uc13), aL(F.uc06)), t: { en: "Net billed, collection rate & exclusions", ar: "الإنفاق والنسب", zh: "净开支/费率" } },
    { d: o(aR(F.uc13), aL(F.uc02)), c: "b", lp: mid(aR(F.uc13), aL(F.uc02)), t: { en: "Collection gaps & objection signals", ar: "الفجوات", zh: "缺口&异议" } },
    { d: o(aR(F.uc06), aL(F.uc14)), c: "b", lp: mid(aR(F.uc06), aL(F.uc14)), t: { en: "Spend & performance metrics", ar: "مؤشرات الأداء", zh: "支出绩效指标" } },
    { d: o(aR(F.uc02), aL(F.uc14)), c: "b", lp: mid(aR(F.uc02), aL(F.uc14)), t: { en: "Anomalies & exception list", ar: "الاستثناءات", zh: "异常列表" } },
    { d: w12, c: "b", lp: { x: 760, y: 452 }, t: { en: "Asset register, capitalization & cost", ar: "سجل الأصول والتكلفة", zh: "资产登记 / 资本化成本" } },
    { d: w11, c: "b", lp: { x: 360, y: 500 }, t: { en: "Asset classification & guide references", ar: "تصنيف الأصول والمراجع", zh: "资产分类 / 指标参考" } },
    { d: o(aR(F.uc12), aL(F.uc10)), c: "b", lp: mid(aR(F.uc12), aL(F.uc10)), t: { en: "Costs, assignment orders & fund balances", ar: "التكاليف والأرصدة", zh: "成本&资金余额" } },
    { d: o(aB(F.uc12), aT(F.uc11)), c: "b", lp: mid(aB(F.uc12), aT(F.uc11)), t: { en: "Compliance findings & memos", ar: "النتائج والمذكرات", zh: "合规结果&备忘" } },
    { d: o({ x: aR(F.uc11).x, y: aR(F.uc11).y + 16 }, aL(F.uc03)), c: "b", lp: mid(aR(F.uc11), aL(F.uc03)), t: { en: "Policy refs & audit traceability", ar: "السياسات والتدقيق", zh: "政策&审计追溯" } },
    { d: o({ x: aR(F.uc11).x, y: aR(F.uc11).y - 24 }, aL(F.uc10)), c: "b", lp: { x: 618, y: 690 }, t: { en: "Cost queries & lineage", ar: "استعلام التكلفة", zh: "成本查询&谱系" } },
    { d: o(aR(F.uc10), aL(F6_GATE)), c: "b", lp: mid(aR(F.uc10), aL(F6_GATE)), t: { en: "Draft executive & periodic reports", ar: "المسودات والتقارير", zh: "草案&双周报告" } },
    { d: o(aR(F.uc03), { x: F6_GATE.x, y: F6_GATE.y + F6_GATE.h - 44 }), c: "b", lp: mid(aR(F.uc03), aL(F6_GATE)), t: { en: "Query answers, audit trail & permissioned exports", ar: "الإجابات والتدقيق", zh: "答案/审计/许可" } },
    { d: o(aR(F6_GATE), aL(F6_DEL)), c: "o", lp: mid(aR(F6_GATE), aL(F6_DEL)), t: { en: "Approved Revenue & Asset Reports", ar: "تقارير معتمدة", zh: "已批准报告" } },
  ];
  const stroke = c => c === "g" ? "#9aa7b5" : c === "o" ? "#d98324" : "#2563eb";
  const marker = c => c === "g" ? "url(#mfag)" : c === "o" ? "url(#mfao)" : "url(#mfab)";
  const ucBox = (n) => (<div className="node mf-down green f6uc" style={{ left: n.x, top: n.y, width: n.w, minHeight: n.h }} key={n.code}>
    <div className="t"><span className="od" />{colh(n.code, tr(n.title))}</div>
    <div className="mf-sublist">{n.ags.map((k, i) => (<div className="mf-subitem" key={i}><span className="sd" />{tr(F6_AG[k])}</div>))}</div>
  </div>);
  return (<div className="fade mf">
    <div className="card pad mf-frame">
      <h1 style={{ fontSize: 21 }}><button className="pg-back" onClick={() => setRoute("rcwork")}>‹</button>{tr({ en: "G-06 Revenue & Assets Directorate — Use-case storyline & agent I/O flow", ar: "مديرية الإيرادات والأصول ج-06 — قصة حالات الاستخدام وتدفّق الوكلاء", zh: "G-06 收入与资产总局 — 使用案例故事情节及代理/输入输出流程" })}</h1>
      <div className="sub muted" style={{ marginTop: 3 }}>{tr({ en: "Full directorate flow · sources → UC chain (agents & I/O) → mandatory human gate → deliverables · wraps to a second row", ar: "تدفّق المديرية الكامل · المصادر ← سلسلة الحالات ← البوابة البشرية ← المخرجات", zh: "总局完整流程 · 数据源 → 各 UC(代理与输入/输出)→ 强制人工关卡 → 可交付成果 · 连线换行至第二排" })} · <span style={{ color: "#2563eb", cursor: "pointer", fontWeight: 700 }} onClick={() => setRoute("rcdatav1")}>{tr({ en: "view v1", ar: "النسخة v1", zh: "查看旧版 v1" })} ↗</span></div>
      <div className="f6-legend"><span className="f6lg f6lg-main">{tr({ en: "Main flow", ar: "التدفّق الرئيسي", zh: "主流程" })}</span><span className="f6lg f6lg-gate">{tr({ en: "Mandatory human gate", ar: "بوابة بشرية إلزامية", zh: "强制人工关卡" })}</span><span className="f6lg f6lg-chip">{tr({ en: "Agent chip", ar: "شريحة وكيل", zh: "代理芯片" })}</span><span className="f6lg f6lg-src">{tr({ en: "Sources / deliverables", ar: "المصادر/المخرجات", zh: "数据源 / 成果" })}</span></div>

      <div className="mf-canvas-wrap" ref={wrapRef} style={{ height: Math.ceil(CH * scale) }}><div className="mf-canvas" style={{ width: CW, height: CH, transform: "scale(" + scale + ")", transformOrigin: "top left" }}>
        <svg className="mf-svg" width={CW} height={CH} viewBox={"0 0 " + CW + " " + CH} fill="none">
          <defs>
            <marker id="mfag" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#9aa7b5" strokeWidth="1.6" /></marker>
            <marker id="mfab" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#2563eb" strokeWidth="1.8" /></marker>
            <marker id="mfao" viewBox="0 0 10 10" markerWidth="9" markerHeight="9" refX="7" refY="5" orient="auto"><path d="M0,1 L8,5 L0,9" fill="none" stroke="#d98324" strokeWidth="1.8" /></marker>
          </defs>
          {E.map((e, i) => (<path key={i} d={e.d} stroke={stroke(e.c)} strokeWidth={e.c === "g" ? 1.7 : 2} fill="none" markerEnd={marker(e.c)} />))}
          {E.map((e, i) => (<circle key={"fly" + i} r="3.4" fill={stroke(e.c)}><animateMotion dur={flyDur(e.d) + "s"} begin={(i * 0.13) + "s"} repeatCount="indefinite" path={e.d} /></circle>))}
        </svg>

        <div className="node mf-down gray" style={{ left: SRC.x, top: SRC.y, width: SRC.w, minHeight: SRC.h }}>
          <div className="t">{tr({ en: "Data Sources", ar: "مصادر البيانات", zh: "数据源" })}</div>
          <div className="f6-srclist">{F6_SRC.map((s, i) => (<div key={i}>{typeof s === "string" ? s : tr(s)}</div>))}</div>
        </div>

        {Object.keys(F6).map(k => ucBox(F6[k]))}

        <div className="node mf-down gold" style={{ left: F6_GATE.x, top: F6_GATE.y, width: F6_GATE.w, minHeight: F6_GATE.h }}>
          <div className="t">⚖ {tr({ en: "Human Review · Mandatory Gate", ar: "مراجعة بشرية · بوابة إلزامية", zh: "人工审核 · 强制门" })}</div>
          <div className="s">{tr({ en: "Validate & approve · draft reports · query answers · authorize export", ar: "تحقّق واعتمد · المسودات · الإجابات · تفويض التصدير", zh: "验证并批准 · 草稿报告 · 查询答案 · 授权出口" })}</div>
        </div>
        <div className="node mf-down gray" style={{ left: F6_DEL.x, top: F6_DEL.y, width: F6_DEL.w, minHeight: F6_DEL.h }}>
          <div className="t">📦 {tr({ en: "Deliverables", ar: "المخرجات", zh: "可交付成果" })}</div>
          <div className="s">{tr({ en: "Revenue & Asset Reports · periodic / bi-weekly · approved & authorized", ar: "تقارير الإيرادات والأصول · دورية · معتمدة", zh: "收入 & 资产报告 · 定期 / 双周 · 已批准 & 授权" })}</div>
        </div>

        {E.map((e, i) => (<div className="node mf-edgelab" style={{ left: e.lp.x - 54, top: e.lp.y, width: 108, textAlign: "center", transform: "translateY(-50%)" }} key={"l" + i}>{tr(e.t)}</div>))}
      </div></div>
    </div>
  </div>);
}

function RcWorkbench() {
  const { t, tr, setRoute, pushLog, setPerfJump, setBackRoute, setDeptSub, setAlertsOpen } = useStore();
  const [ask, setAsk] = useState("");
  const [feed, setFeed] = useState(WB.logs);
  const logRef = useRef(null);
  const [qa, setQa] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [showSugs, setShowSugs] = useState(false);
  const qaRef = useRef(null);
  const [fsel, setFsel] = useState([2, 0, 0, 0]);
  const DEFAULT_SUMMARY = { en: "FY 2025 Q2 · collection rate held at **87%** (+2.1pp QoQ), but a ~~SAR 120M collection gap~~ persists — **65%** of it sits in just **3 Amanat** (Riyadh-East 32M · Jeddah-Port 26M · Dammam-Ind. 20M). Lease contracts drive **~50% of overdue**, and ~~18 contracts now exceed 90 days~~ — **SAR 34M at write-off risk** without dunning this quarter.", ar: "الربع الثاني 2025 · معدل التحصيل **87%** (+2.1)، لكن تبقى ~~فجوة تحصيل 120 مليون~~ — **65%** في **3 أمانات** (الرياض-شرق 32 · جدة 26 · الدمام 20). عقود الإيجار **~50% من التأخر**، و~~18 عقداً تجاوزت 90 يوماً~~ — **34 مليون معرّضة للشطب** دون تحصيل هذا الربع.", zh: "FY2025 Q2 · 征收率维持 **87%**(环比 +2.1pp),但仍有 ~~SAR 120M 征收缺口~~——其中 **65%** 集中在 **3 个阿玛纳**(利雅得-东 32M · 吉达-港 26M · 达曼-工业 20M)。租约合同造成 **约 50% 的逾期**,且 ~~18 个合同已逾期超 90 天~~——若本季不催收,**SAR 34M 面临核销风险**。" };
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [qaOpen, setQaOpen] = useState(false);
  const WB_CHAIN = [
    { code: "UC-01", pos: { en: "UPSTREAM", ar: "منبع", zh: "上游" }, name: { en: "Financial Data Consolidation & Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" } },
    { code: "UC-13", here: true, pos: { en: "THIS", ar: "هذه", zh: "本环节" }, name: { en: "Revenue, Collections & Exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、征收与排除项" } },
    { code: "UC-06 / UC-02", pos: { en: "PARALLEL", ar: "متوازٍ", zh: "并行" }, name: { en: "Performance Reports / Anomaly Detection", ar: "تقارير الأداء / كشف الانحرافات", zh: "绩效报告 / 异常检测" } },
    { code: "UC-14", pos: { en: "DOWNSTREAM", ar: "المصب", zh: "下游" }, name: { en: "Assets, Classification & Capitalization", ar: "الأصول والتصنيف والرسملة", zh: "资产、分类与资本化" } },
    { code: "UC-12 / UC-11", pos: { en: "DOWNSTREAM", ar: "المصب", zh: "下游" }, name: { en: "Costs & Funds / Compliance & Memos", ar: "التكاليف والصناديق / الامتثال والمذكرات", zh: "成本与资金 / 合规与备忘" } },
    { code: "UC-10 / UC-03", pos: { en: "CONVERGE ★", ar: "تقارب ★", zh: "汇聚 ★" }, name: { en: "Reporting & Dashboards / Smart Query & Audit", ar: "التقارير / الاستعلام والتدقيق", zh: "报告与仪表盘 / 智能查询与审计" } },
  ];
  const WB_SOURCES = [
    { n: "Tahseel", s: "synced" }, { n: "Makeen", s: "synced" }, { n: "Efaa", s: "loading" }, { n: "Sanad", s: "synced" }, { n: "Etimad", s: "synced" },
    { n: "Revenue Sources", s: "synced" }, { n: "Invoices", s: "synced" }, { n: "Objections", s: "synced" }, { n: "Executions", s: "synced" }, { n: "White Land Files", s: "synced" },
  ];
  const WB_OUTPUTS = [
    { l: { en: "Net Billed Amount", ar: "صافي المفوتر", zh: "净开票额" }, v: "SAR 920M", s: { en: "Gross billed − exclusions", ar: "إجمالي المفوتر − الاستبعادات", zh: "总开票 − 排除项" }, tag: { en: "+2.1% QoQ", ar: "+2.1%", zh: "环比 +2.1%" }, rows: [
      { k: { en: "Gross billed", ar: "إجمالي المفوتر", zh: "总开票" }, v: "SAR 1.06B", pct: 100 },
      { k: { en: "− Judgment excl.", ar: "− استبعاد حكم", zh: "− 判决排除" }, v: "SAR 78M", pct: 7 },
      { k: { en: "− Objection holds", ar: "− تعليق اعتراض", zh: "− 异议挂起" }, v: "SAR 42M", pct: 4 },
      { k: { en: "− Written-off", ar: "− مشطوب", zh: "− 核销" }, v: "SAR 20M", pct: 2 },
    ] },
    { l: { en: "Exclusion Reports", ar: "تقارير الاستبعاد", zh: "排除项报告" }, v: "3 cat. · SAR 140M", s: { en: "Judgment · objection · written-off", ar: "حكم · اعتراض · شطب", zh: "判决 · 异议 · 核销" }, rows: [
      { k: { en: "Judgment (12 cases)", ar: "حكم (12)", zh: "判决(12 件)" }, v: "SAR 78M" },
      { k: { en: "Objection (9 cases)", ar: "اعتراض (9)", zh: "异议(9 件)" }, v: "SAR 42M" },
      { k: { en: "Written-off (21 cases)", ar: "مشطوب (21)", zh: "核销(21 件)" }, v: "SAR 20M" },
    ] },
    { l: { en: "Revenue Opportunity Alerts", ar: "تنبيهات فرص الإيراد", zh: "收入机会告警" }, v: "5 · SAR 23M", s: { en: "Under-billed / missed coverage", ar: "نقص فوترة / تغطية مفقودة", zh: "少开票 / 漏覆盖" }, rows: [
      { k: { en: "Under-billed leases (3)", ar: "إيجارات ناقصة (3)", zh: "少开票租约(3)" }, v: "SAR 12M" },
      { k: { en: "Missed fee coverage (2)", ar: "تغطية رسوم مفقودة (2)", zh: "漏收费覆盖(2)" }, v: "SAR 7M" },
      { k: { en: "Indexation gap (1)", ar: "فجوة الفهرسة (1)", zh: "指数化缺口(1)" }, v: "SAR 4M" },
    ] },
  ];
  const cyc = (i) => setFsel(s => s.map((v, j) => j === i ? (v + 1) % WB.filters[i].opts.length : v));
  const applyFilters = () => {
    const period = WB.filters[0].opts[fsel[0]], amanah = WB.filters[1].opts[fsel[1]];
    setSummary({ en: `For ${period}, ${amanah}: collection 87%, SAR 120M collection gap across high-risk Amanat; leases drive ~50% of overdue.`, ar: `لـ ${period}، ${amanah}: التحصيل 87%، فجوة 120 مليون ريال في الأمانات عالية الخطورة؛ الإيجارات ~50% من التأخر.`, zh: `${period} · ${amanah}:征收率 87%,SAR 120M 征收缺口集中于高风险阿玛纳;租约造成约 50% 逾期。` });
    pushLog({ en: "Filters applied — " + period + " · " + amanah, ar: "تم تطبيق عوامل التصفية — " + period, zh: "已应用筛选 — " + period + " · " + amanah });
  };
  const SCOPE_K = [{ en: "Period", ar: "الفترة", zh: "期间" }, { en: "Amanah", ar: "الأمانة", zh: "阿玛纳" }, { en: "Revenue", ar: "الإيراد", zh: "收入" }, { en: "Tags", ar: "وسوم", zh: "标签" }];
  const cycleScope = (i) => {
    const ns = fsel.map((v, j) => j === i ? (v + 1) % WB.filters[i].opts.length : v); setFsel(ns);
    const period = WB.filters[0].opts[ns[0]], amanah = WB.filters[1].opts[ns[1]];
    setSummary({ en: `For ${period}, ${amanah}: collection 87%, SAR 120M collection gap across high-risk Amanat; leases drive ~50% of overdue.`, ar: `لـ ${period}، ${amanah}: التحصيل 87%، فجوة 120 مليون ريال؛ الإيجارات ~50% من التأخر.`, zh: `${period} · ${amanah}:征收率 87%,SAR 120M 征收缺口集中于高风险阿玛纳;租约造成约 50% 逾期。` });
    pushLog({ en: "Scope changed — " + period + " · " + amanah, ar: "تغيّر النطاق — " + period, zh: "作用域已更改 — " + period + " · " + amanah });
  };
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n++; const base = WB.logs[n % WB.logs.length];
      const tm = "10:" + String((6 + n) % 60).padStart(2, "0");
      setFeed(f => [...f.slice(-7), { ...base, tm }]);
    }, 2300);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [feed]);
  const askQ = (idx, raw, ansObj) => {
    const q = idx >= 0 ? tr(WB.qs[idx]) : (raw || "").trim();
    if (!q || thinking) return;
    const a = ansObj ? tr(ansObj) : (idx >= 0 ? tr(WB.answers[idx]) : tr(WB.genAns));
    pushLog({ en: "Q&A → Revenue agent: " + q, ar: "سؤال → وكيل الإيرادات: " + q, zh: "提问 → 收入智能体:" + q });
    setShowSugs(false);
    setQa(p => [...p, { role: "u", text: q }]); setAsk(""); setThinking(true);
    setTimeout(() => { setQa(p => [...p, { role: "a", text: a }]); setThinking(false); }, 850);
  };
  useEffect(() => { const el = qaRef.current; if (el) el.scrollTop = el.scrollHeight; }, [qa, thinking]);
  const badge = (s) => s === "running" ? <span className="wb-badge run">{tr({ en: "running", ar: "يعمل", zh: "运行中" })}</span>
    : s === "focus" ? <span className="wb-badge foc">{tr({ en: "in focus", ar: "قيد التركيز", zh: "聚焦中" })}</span>
    : <span className="wb-badge act">{tr({ en: "active", ar: "نشط", zh: "活动" })}</span>;
  const risk = (r) => <span className={"wb-risk " + r}>{tr(r === "high" ? { en: "high", ar: "مرتفع", zh: "高" } : r === "med" ? { en: "med", ar: "متوسط", zh: "中" } : { en: "low", ar: "منخفض", zh: "低" })}</span>;
  const fAsk = (row) => askQ(-1, row.id + " · " + tr(row.am) + " — " + row.od, {
    en: row.id + " (" + tr(row.am) + ") is " + row.od + " overdue at " + row.risk + " risk. Main driver: lease arrears aged beyond 60 days under the Wusool template. Recommended: targeted dunning and an escalation-clause review with legal.",
    ar: row.id + " (" + tr(row.am) + ") متأخر بمقدار " + row.od + ". السبب الرئيسي: متأخرات إيجار تجاوزت 60 يوماً ضمن قالب وصول. الموصى به: تحصيل موجّه ومراجعة بنود التصعيد مع القانونية.",
    zh: row.id + "(" + tr(row.am) + ")逾期 " + row.od + ",风险 " + row.risk + "。主因:Wusool 模板下租约欠款逾期超过 60 天。建议:定向催收并与法务复核升级条款。",
  });
  return (<div className="fade wb">
    <div className="card pad wb-frame">
    {/* HEADER */}
    <div className="card pad wb-head">
      <div><div className="wb-title"><button className="pg-back" onClick={() => setRoute("rcwork")}>‹</button><span className="wb-dot blue" /> {tr({ en: "Revenue Collection Department", ar: "إدارة التحصيل", zh: "收入征收部" })} · {tr({ en: "Analysis Workbench", ar: "منصة التحليل", zh: "分析工作台" })}<button className="al-bell" onClick={() => setAlertsOpen(true)} title={ucl("UC-02", tr({ en: "Alerts & Exceptions Center", ar: "مركز التنبيهات", zh: "告警与异常中心" }))}>🔔 <span>3</span></button></div>
        <div className="wb-subt">{ucl("UC-13", tr({ en: "Revenue Collection & Billing Gap", ar: "التحصيل وفجوة الفوترة", zh: "收入征收与开票缺口" }))}</div></div>
      <div className="wb-chain"><span className="wb-clab">{tr({ en: "G-06 CHAIN", ar: "سلسلة ج-06", zh: "G-06 链路" })}</span>{WB_CHAIN.map((c, i) => (<React.Fragment key={i}>{i > 0 && <span className="wb-carr">→</span>}<span className={"wb-cpill" + (c.here ? " here" : "")}>{c.pos && <span className="wb-cpos">{tr(c.pos)}</span>}{SHOW_UC ? c.code + " · " : ""}{tr(c.name)}</span></React.Fragment>))}</div>
    </div>
    {/* INSIGHT & NEXT ACTIONS */}
    <div className="wb-actbar">
      <div className="wb-ab-top">
        <div className="wb-ab-spark">✦</div>
        <div className="wb-ab-tt">
          <div><span className="wb-ab-lab">{tr({ en: "AI INSIGHT & NEXT ACTIONS", ar: "رؤى الذكاء الاصطناعي والإجراءات", zh: "AI 洞察与后续行动" })}</span><span className="wb-ab-meta">{SHOW_UC ? "UC-13 · " : ""}run #2041 · {tr({ en: "Revenue agent", ar: "وكيل الإيرادات", zh: "收入智能体" })} · {tr({ en: "scope", ar: "النطاق", zh: "作用域" })}: {WB.filters[0].opts[fsel[0]]} · {WB.filters[1].opts[fsel[1]]}</span></div>
          <div className="wb-ab-insight"><Hi t={tr(summary)} /></div>
        </div>
      </div>
      <div className="wb-ab-rows">
        <div className="wb-ab-col">
          <div className="wb-ab-h">⚐ {tr({ en: "RECOMMENDED · prompts", ar: "موصى به · مقترحات", zh: "建议 · 提示(点击应用)" })}</div>
          <div className="wb-sugs">{WB.next.map((n, i) => (<button className="wb-sug" key={i} onClick={() => { pushLog({ en: "Applied recommendation — " + tr(n.t), ar: "تطبيق توصية — " + tr(n.t), zh: "已应用建议 — " + tr(n.t) }); setQaOpen(true); }}><span className="pr">{i + 1}</span><span className="wb-sug-tx"><b>{tr(n.t)}</b><i>{tr(n.d)}</i></span></button>))}</div>
        </div>
        <div className="wb-ab-col r">
          <div className="wb-ab-h">➜ {tr({ en: "HAND OFF DOWNSTREAM · actions", ar: "تسليم لاحق · إجراءات", zh: "下游交接 · 动作" })}</div>
          <div className="wb-ctas">
            <button className="wb-cta p" onClick={() => { setPerfJump({ tab: "dash", generate: true }); setBackRoute("rcbench"); setDeptSub("revcol"); setRoute("rcreports"); }}>{SHOW_UC && <span className="uc">UC-06</span>}{tr({ en: "Generate Executive Summary", ar: "إنشاء الملخص التنفيذي", zh: "生成执行摘要" })}<span className="ar">→</span></button>
            <button className="wb-cta s" onClick={() => setAlertsOpen(true)}>{SHOW_UC && <span className="uc">UC-02</span>}{tr({ en: "Create Alert / Case", ar: "إنشاء تنبيه / حالة", zh: "创建告警 / 案例" })}<span className="ar">→</span></button>
          </div>
        </div>
      </div>
    </div>
    {/* RESULTS + scope chips */}
    <div className="wb-sech shead">
      <div><h2>{tr({ en: "Collection & Billing Gap Results", ar: "نتائج التحصيل وفجوة الفوترة", zh: "征收与开票缺口结果" })}</h2><div className="muted">{ucl("UC-13", tr({ en: "UC-13 outputs · produced by agents", ar: "مخرجات UC-13 · أُنتجت بواسطة الوكلاء", zh: "UC-13 输出 · 由智能体生成" }))}</div></div>
      <div className="wb-scope"><span className="wb-sl">{tr({ en: "SCOPE", ar: "النطاق", zh: "作用域" })}</span>
        {WB.filters.map((f, i) => (<button className="wb-schip" key={i} onClick={() => cycleScope(i)} title={tr(f.lab)}><span className="k">{tr(SCOPE_K[i])}</span><span className="v">{f.opts[fsel[i]]}</span><span className="cv">▾</span></button>))}
        <span className="wb-auto">● {tr({ en: "auto-applied", ar: "تطبيق تلقائي", zh: "自动应用" })}</span>
      </div>
    </div>
    <div className="wb-ogrid">{WB_OUTPUTS.map((o, i) => (<div className="wb-ocard" key={i}><div className="oc-h">{tr(o.l)}{o.tag && <span className="oc-tag">{tr(o.tag)}</span>}</div><div className="oc-b"><div className="oc-v"><Money v={o.v} /></div><div className="oc-s">{tr(o.s)}</div></div>{o.rows && <div className="oc-rows">{o.rows.map((r, j) => (<div className="oc-row" key={j}><span className="k">{tr(r.k)}</span>{typeof r.pct === "number" && <span className="ocbar"><i style={{ width: r.pct + "%" }} /></span>}<span className="ov">{r.v}</span></div>))}</div>}</div>))}</div>
    <div className="wb-cols3">
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Collection Overview", ar: "نظرة عامة على التحصيل", zh: "征收概览" })}</b></div>
        <div className="wb-pb">
          <div className="wb-kl">{tr({ en: "OVERALL COLLECTION RATE", ar: "معدل التحصيل الإجمالي", zh: "整体征收率" })}</div>
          <div className="wb-krow"><span className="wb-big">87%</span><span className="chip">+2.1% QoQ</span></div>
          <div className="wb-bars">
            <div className="wb-bar"><div className="bl">{tr({ en: "Planned", ar: "مخطط", zh: "计划" })}</div><div className="bt"><span className="bf plan" style={{ width: "100%" }} /></div><div className="bv"><Money v="SAR 920M" /></div></div>
            <div className="wb-bar"><div className="bl">{tr({ en: "Collected", ar: "محصّل", zh: "已收" })}</div><div className="bt"><span className="bf coll" style={{ width: "87%" }} /></div><div className="bv"><Money v="SAR 800M" /></div></div>
            <div className="wb-bar"><div className="bl">{tr({ en: "Outstanding", ar: "مستحق", zh: "未收" })}</div><div className="bt"><span className="bf out" style={{ width: "13%" }} /></div><div className="bv"><Money v="SAR 120M" /></div></div>
          </div>
          <div className="wb-kk"><span>{tr({ en: "Overdue share (>60d)", ar: "نسبة التأخر (>60 يوماً)", zh: "逾期占比 (>60天)" })}</span><b className="red">50%</b></div>
          <div className="wb-kk"><span>{tr({ en: "Avg DSO", ar: "متوسط أيام التحصيل", zh: "平均回款天数" })}</span><b>74 {tr({ en: "days", ar: "يوم", zh: "天" })}</b></div>
        </div></div>
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Billing Gap · Focus List", ar: "فجوة الفوترة · قائمة التركيز", zh: "开票缺口 · 重点清单" })}</b><span className="wb-pm">{tr({ en: "top 5 overdue", ar: "أعلى 5 متأخرة", zh: "前 5 逾期" })}</span></div>
        <div className="wb-pb">
          <div className="wb-kl">{tr({ en: "TOTAL COLLECTION GAPS", ar: "إجمالي فجوات التحصيل", zh: "征收缺口总计" })}</div>
          <div className="wb-krow"><span className="wb-big">13%</span><span className="chip">{tr({ en: "SAR 120M uncollected", ar: "120 مليون غير محصّلة", zh: "SAR 120M 未收" })}</span></div>
          <table className="wb-table"><thead><tr><th>{tr({ en: "CONTRACT ID", ar: "رقم العقد", zh: "合同编号" })}</th><th>{tr({ en: "AMANAH", ar: "الأمانة", zh: "阿玛纳" })}</th><th>{tr({ en: "OVERDUE", ar: "متأخر", zh: "逾期" })}</th><th>{tr({ en: "RISK", ar: "الخطر", zh: "风险" })}</th><th>{tr({ en: "ASK", ar: "اسأل", zh: "提问" })}</th></tr></thead>
            <tbody>{WB.focus.map((r, i) => (<tr key={i} onClick={() => fAsk(r)}><td className="mono">{r.id}</td><td>{tr(r.am)}</td><td><Money v={r.od} /></td><td>{risk(r.risk)}</td><td><span className="wb-q" title={tr({ en: "Ask the agent", ar: "اسأل الوكيل", zh: "向智能体提问" })}>?</span></td></tr>))}</tbody></table>
          <div className="wb-tfoot"><span>{tr({ en: "Showing 5 of 47 · click any row to ask the agent", ar: "عرض 5 من 47 · انقر أي صف لسؤال الوكيل", zh: "显示 47 中的 5 条 · 点击任意行向智能体提问" })}</span><a onClick={() => askQ(2)}>{tr({ en: "View all →", ar: "عرض الكل →", zh: "查看全部 →" })}</a></div>
        </div></div>
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Amanah Distribution", ar: "توزيع الأمانات", zh: "阿玛纳分布" })}</b></div>
        <div className="wb-pb">
          <div className="wb-kl2">{tr({ en: "Top Amanat by billing gap", ar: "أعلى الأمانات حسب فجوة الفوترة", zh: "按开票缺口排序的阿玛纳" })}</div>
          {WB.dist.map((d, i) => (<div className="wb-dist" key={i}><div className="dn">{tr(d.am)}</div><div className="dt"><span className={"df " + d.cls} style={{ width: d.pct + "%" }} /></div><div className="dv"><Money v={d.v} /></div></div>))}
          <div className="wb-other"><span>{tr({ en: "Other 42 Amanat", ar: "42 أمانة أخرى", zh: "其余 42 个阿玛纳" })}</span><b><Money v="SAR 19M" /></b></div>
        </div></div>
    </div>
    {/* MULTI-AGENT WORKSPACE */}
    <div className="wb-sech"><h2>{tr({ en: "Multi-Agent Workspace", ar: "مساحة عمل متعددة الوكلاء", zh: "多智能体工作区" })}</h2><div className="muted">{tr({ en: "Orchestrated agent roles & live action timeline", ar: "أدوار وكلاء منسّقة وخط زمني حي", zh: "编排的智能体角色与实时操作时间线" })}</div></div>
    <div className="wb-cols3 wb-work">
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot" style={{ background: "#1C8354" }} /> <b>{tr({ en: "Data Inputs · sources", ar: "مدخلات البيانات · المصادر", zh: "数据输入 · 源系统" })}</b><span className="wb-pm">{tr({ en: "10 systems", ar: "10 أنظمة", zh: "10 个系统" })}</span></div>
        <div className="wb-pb"><div className="wb-srclist">{WB_SOURCES.map((s, i) => (<div className="wb-src" key={i}><span className={"sd" + (s.s === "loading" ? " load" : "")} /><span className="sn">{s.n}</span><span className="ss">{tr(s.s === "loading" ? { en: "loading", ar: "تحميل", zh: "载入" } : { en: "synced", ar: "متزامن", zh: "已同步" })}</span></div>))}</div></div></div>
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot blue" /> <b>{tr({ en: "Orchestrator · Task Board", ar: "المنسّق · لوحة المهام", zh: "编排器 · 任务板" })}</b><span className="wb-orchpill"><span className="gear">⚙</span>{tr({ en: "Auto-orchestration · 3 agents", ar: "تنسيق تلقائي · 3 وكلاء", zh: "自动编排 · 3 个智能体" })}</span></div>
        <div className="wb-pb">{WB.roles.map((r, i) => (<div className={"wb-role " + (r.cls || "") + (r.focus ? " foc-card" : "")} key={i} onClick={r.focus ? () => setRoute("rcwork") : undefined}>
          <div className="rl"><div className="rt">{r.code ? ucl(r.code, tr(r.name)) : tr(r.name)}</div><div className="rs">{tr(r.sub)}</div></div>{badge(r.status)}
        </div>))}</div></div>
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot blue" /> <b>{tr({ en: "Agent Timeline · Logs", ar: "خط زمن الوكلاء · السجلات", zh: "智能体时间线 · 日志" })}</b><span className="wb-pm">{tr({ en: "last 5 min", ar: "آخر 5 د", zh: "最近 5 分钟" })}</span></div>
        <div className="wb-pb"><div className="wb-tl" ref={logRef}>{feed.map((e, i) => (<div className={"wb-ev" + (i === feed.length - 1 ? " live" : "")} key={i}><span className={"wb-dot2 " + e.dot} /><div className="wb-eh"><b>{e.tm}</b> · {e.code ? ucl(e.code, tr(e.h)) : tr(e.h)}</div><div className="wb-ed">{tr(e.d)}</div></div>))}</div></div></div>
    </div>
    <button className="wb-qfab" onClick={() => setQaOpen(o => !o)} aria-label="AI Narratives & Q&A" title={tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}>🤖</button>
    {qaOpen && <div className="wb-qpanel qa">
      <div className="wb-qph"><span className="wb-dot violet" /> <b>{tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}</b><button className="wb-qx" onClick={() => setQaOpen(false)}>✕</button></div>
        <div className="wb-pb wb-qbody">
          {qa.length === 0 && !thinking && <div className="wb-narrwrap"><div className="wb-ntag">{ucl("UC-13", tr({ en: "NARRATIVE", ar: "السرد", zh: "叙述" }))}</div>
          <div className="wb-narr">
            <p>{tr({ en: "Collection performance is stable at 87% overall, but three Amanat (Riyadh-East, Jeddah-Port, Dammam-Industrial) account for SAR 78M of the SAR 120M gap.", ar: "أداء التحصيل مستقر عند 87% إجمالاً، لكن ثلاث أمانات (الرياض-شرق، جدة-الميناء، الدمام-الصناعية) تمثّل 78 مليون ريال من فجوة 120 مليون ريال.", zh: "整体征收表现稳定在 87%,但三个阿玛纳(利雅得-东、吉达-港、达曼-工业)占 SAR 120M 缺口中的 SAR 78M。" })}</p>
            <p>{tr({ en: "Lease contracts dominate overdue balances, with 50% of arrears aged beyond 60 days. RAG analysis shows weak escalation clauses in Wusool template v2.", ar: "عقود الإيجار تهيمن على الأرصدة المتأخرة، مع تقادم 50% من المتأخرات أكثر من 60 يوماً. يُظهر تحليل RAG ضعف بنود التصعيد في قالب وصول v2.", zh: "租约合同主导逾期余额,50% 的欠款账龄超过 60 天。RAG 分析显示 Wusool 模板 v2 的升级条款较弱。" })}</p>
            <div className="wb-rp">{tr({ en: "Recommended priorities:", ar: "الأولويات الموصى بها:", zh: "建议优先事项:" })}</div>
            <ul><li>{tr({ en: "Targeted follow-up on top 3 Amanat (SAR 78M)", ar: "متابعة موجّهة لأعلى 3 أمانات (78 مليون ريال)", zh: "针对前 3 个阿玛纳的定向跟进(SAR 78M)" })}</li>
              <li>{tr({ en: "Review lease template terms with legal", ar: "مراجعة شروط قالب الإيجار مع القانونية", zh: "与法务复核租约模板条款" })}</li>
              <li>{tr({ en: "Open alerts on contracts overdue >90 days", ar: "فتح تنبيهات للعقود المتأخرة >90 يوماً", zh: "对逾期 >90 天的合同开启告警" })}</li></ul>
            <div className="wb-src">{ucl("UC-01", tr({ en: "Source: unified data · Numeric Query Agent", ar: "المصدر: بيانات موحّدة · وكيل الاستعلام الرقمي", zh: "来源:统一数据 · 数值查询智能体" }))}</div>
          </div></div>}
          {(qa.length > 0 || thinking) && <div className="wb-qa" ref={qaRef}>
            {qa.map((m, i) => (<div className={"wb-qm " + m.role} key={i}><div className="bb"><Money v={m.text} /></div></div>))}
            {thinking && <div className="wb-qm a"><div className="bb think"><span className="wb-typing"><i /><i /><i /></span></div></div>}
          </div>}
          <div className={"wb-sqh" + (qa.length > 0 ? " tog" : "")} onClick={() => { if (qa.length > 0) setShowSugs(v => !v); }}>{tr({ en: "SUGGESTED QUESTIONS", ar: "أسئلة مقترحة", zh: "建议问题" })}{qa.length > 0 && <span className="sqtg">{showSugs ? "▾" : "▸"}</span>}</div>
          {(qa.length === 0 || showSugs) && WB.qs.map((q, i) => (<div className="wb-sq" key={i} onClick={() => askQ(i)}>{tr(q)} <span className="ar">→</span></div>))}
          <div className="wb-askh">{tr({ en: "Ask the Revenue agent…", ar: "اسأل وكيل الإيرادات…", zh: "向收入智能体提问…" })}</div>
          <div className="wb-ask"><input value={ask} onChange={e => setAsk(e.target.value)} placeholder={tr({ en: "Type your question…", ar: "اكتب سؤالك…", zh: "输入你的问题…" })} onKeyDown={e => e.key === "Enter" && askQ(-1, ask)} /><button className="btn sm" onClick={() => askQ(-1, ask)}>{tr({ en: "Send", ar: "إرسال", zh: "发送" })}</button></div>
        </div>
    </div>}
    </div>
  </div>);
}
// ===== KPI carousel (vertical slides + dots) — data from BRD Main outputs / KPIs =====
const RC_KPI_SLIDES = [
  [
    { lab: { en: "Collection Rate", ar: "معدل التحصيل", zh: "征收率" }, v: "87%", d: { en: "+2.1% QoQ", ar: "+2.1%", zh: "+2.1% 环比" }, up: true },
    { lab: { en: "Collection Gap", ar: "فجوة التحصيل", zh: "征收缺口" }, v: "SAR 120M", d: { en: "net billed 920 − collected 800", ar: "صافي المفوتر 920 − المحصّل 800", zh: "净开票 920 − 已收 800" } },
    { lab: { en: "Overdue Risk (30/60/90+)", ar: "مخاطر التأخر (30/60/90+)", zh: "逾期风险 (30/60/90+)" }, aging: [["30d", 47, "SAR 28M"], ["60d", 53, "SAR 32M"], ["90+", 100, "SAR 60M"]] },
    { lab: { en: "Prioritized Actions", ar: "إجراءات مرتّبة", zh: "优先行动" }, act: true, esc: "5", total: "14", items: [ { t: { en: "Riyadh-East overdue", ar: "تأخر الرياض-شرق", zh: "利雅得-东逾期" }, s: { en: "escalate to Amanah finance", ar: "تصعيد لمالية الأمانة", zh: "上报阿玛纳财务" }, v: "SAR 32M" }, { t: { en: "Jeddah-Port overdue", ar: "تأخر جدة-الميناء", zh: "吉达-港逾期" }, s: { en: "dunning + legal notice", ar: "تحصيل + إشعار قانوني", zh: "催收 + 法律通知" }, v: "SAR 26M" }, { t: { en: "Contracts > 90 days (18)", ar: "عقود > 90 يوماً (18)", zh: "逾期 >90 天合同(18)" }, s: { en: "auto-escalation", ar: "تصعيد تلقائي", zh: "自动升级" }, v: "SAR 34M" }, { t: { en: "Duplicate invoice INV-4471", ar: "فاتورة مكررة INV-4471", zh: "重复发票 INV-4471" }, s: { en: "block & correct", ar: "حجب وتصحيح", zh: "拦截并更正" }, v: "SAR 1.86M" }, { t: { en: "Wusool template v2 clauses", ar: "بنود قالب وصول v2", zh: "Wusool 模板 v2 条款" }, s: { en: "legal review", ar: "مراجعة قانونية", zh: "法务复核" }, v: "—" } ] },
  ],
  [
    { lab: { en: "Net Billed Amount", ar: "صافي المفوتر", zh: "净开票额" }, v: "SAR 920M", d: { en: "gross − exclusions", ar: "إجمالي − استبعادات", zh: "总开票 − 排除项" } },
    { lab: { en: "Collection Gaps", ar: "فجوات التحصيل", zh: "征收缺口" }, v: "13%", d: { en: "SAR 120M uncollected", ar: "120 مليون غير محصّلة", zh: "SAR 120M 未收" } },
    { lab: { en: "Exclusion Reports", ar: "تقارير الاستبعاد", zh: "排除项报告" }, v: "3 cat.", d: { en: "judgment · objection · written-off", ar: "حكم · اعتراض · شطب", zh: "判决 · 异议 · 核销" } },
    { lab: { en: "Revenue Opportunity Alerts", ar: "تنبيهات الفرص", zh: "收入机会告警" }, v: "5", d: { en: "under-billed / missed", ar: "نقص فوترة", zh: "少开票 / 漏覆盖" } },
  ],
  [
    { lab: { en: "Overdue Share (>60d)", ar: "نسبة التأخر (>60ي)", zh: "逾期占比 (>60天)" }, v: "50%", d: { en: "lease-driven", ar: "تقوده الإيجارات", zh: "租约主导" } },
    { lab: { en: "Avg DSO", ar: "متوسط أيام التحصيل", zh: "平均回款天数" }, v: "74", d: { en: "days outstanding", ar: "يوم تحصيل", zh: "天" } },
    { lab: { en: "Top-3 Amanat Gap", ar: "فجوة أعلى 3 أمانات", zh: "前3阿玛纳缺口" }, v: "SAR 78M", d: { en: "of SAR 120M total", ar: "من 120 مليون", zh: "占 SAR 120M" } },
    { lab: { en: "Actionable Recommendations", ar: "توصيات قابلة للتنفيذ", zh: "可执行建议" }, v: "14", d: { en: "ranked by impact", ar: "حسب الأثر", zh: "按影响排序" } },
  ],
];
const AS_KPI_SLIDES = [
  [
    { lab: { en: "Capitalized AUC", ar: "المرسمل من تحت الإنشاء", zh: "已资本化在建资产" }, v: "SAR 1.92B", d: { en: "62% of SAR 3.10B", ar: "62% من 3.10 مليار", zh: "占 SAR 3.10B 的 62%" }, up: true },
    { lab: { en: "Impairment Flagged", ar: "مرصود للانخفاض", zh: "减值标记" }, v: "3", d: { en: "items · SAR 47M NBV", ar: "بنود · 47 مليون", zh: "项 · 账面净值 SAR 47M" } },
    { lab: { en: "Maintenance Due (≤30/≤60/>60d)", ar: "صيانة مستحقة (≤30/≤60/>60ي)", zh: "待维护 (≤30/≤60/>60天)" }, aging: [["≤30d", 40, "2"], ["≤60d", 60, "3"], [">60d", 100, "5"]] },
    { lab: { en: "Data Quality Score", ar: "درجة جودة البيانات", zh: "数据质量分" }, v: "96%", d: "+1.4% QoQ", up: true },
  ],
  [
    { lab: { en: "Improved Asset Registry", ar: "سجل أصول محسّن", zh: "改进的资产台账" }, v: "8,640", d: { en: "records · 96% quality", ar: "سجلات · 96%", zh: "记录 · 质量 96%" } },
    { lab: { en: "Classification Recommendations", ar: "توصيات التصنيف", zh: "分类建议" }, v: "47", d: { en: "reclass proposals", ar: "مقترحات إعادة تصنيف", zh: "重分类提议" } },
    { lab: { en: "Capitalization Recommendations", ar: "توصيات الرسملة", zh: "资本化建议" }, v: "SAR 1.92B", d: { en: "312 AUC items", ar: "312 بنداً", zh: "312 项在建" } },
    { lab: { en: "Investment Opportunities", ar: "فرص استثمارية", zh: "投资机会" }, v: "5", d: { en: "reuse / disposal", ar: "إعادة / تصرّف", zh: "复用 / 处置" } },
  ],
  [
    { lab: { en: "Asset Cost Tracking", ar: "تتبّع تكلفة الأصل", zh: "资产成本追踪" }, v: "100%", d: { en: "invoice → register", ar: "الفاتورة ← السجل", zh: "发票 → 台账" } },
    { lab: { en: "AUC Opening", ar: "تحت الإنشاء (افتتاحي)", zh: "在建期初" }, v: "SAR 3.10B", d: { en: "this period", ar: "هذه الفترة", zh: "本期" } },
    { lab: { en: "Maintenance Alerts", ar: "تنبيهات الصيانة", zh: "维护告警" }, v: "5", d: { en: "infra-led · ≤60d", ar: "بنية تحتية", zh: "基础设施 · ≤60天" } },
    { lab: { en: "Impairment Alerts", ar: "تنبيهات الانخفاض", zh: "减值告警" }, v: "3", d: { en: "equipment · SAR 47M", ar: "معدات · 47 مليون", zh: "设备 · SAR 47M" } },
  ],
];
function KpiCarousel({ slides, tone }) {
  const { tr, setAlertsOpen } = useStore();
  const [idx, setIdx] = useState(0);
  const [openAct, setOpenAct] = useState(false);
  const actCard = slides.flat().find(c => c.act);
  useEffect(() => { const id = setInterval(() => setIdx(i => (i + 1) % slides.length), 5000); return () => clearInterval(id); }, [slides.length]);
  const card = (c, i) => c.aging
    ? (<div className="ws-kpi2 km kmrisk" key={i}><div className="lab">{tr(c.lab)}</div>
        <div className="km-aging">{c.aging.map((b, j) => (<div className="ab" key={j}><div className="abar"><i style={{ width: b[1] + "%" }} /></div><div className="at">{b[0]}</div><div className="av">{b[2]}</div></div>))}</div></div>)
    : c.act
    ? (<div className={"ws-kpi2 km kmact" + (openAct ? " on" : "")} key={i} onClick={() => setOpenAct(o => !o)} title={tr({ en: "View escalation details", ar: "عرض تفاصيل التصعيد", zh: "查看升级详情" })}>
        <div className="lab">{tr(c.lab)} <span className="km-open">{openAct ? "▾" : "▸"}</span></div>
        <div className="km-actrow"><b className="kmbig">{c.esc}</b><span className="kmesc">{tr({ en: "escalations", ar: "تصعيدات", zh: "项升级" })}</span></div>
        <div className="kmsub">{tr({ en: "of " + c.total + " actions · by impact", ar: "من " + c.total + " إجراءً · حسب الأثر", zh: "共 " + c.total + " 项行动 · 按影响排序" })}</div>
      </div>)
    : (<div className="ws-kpi2 km" key={i}><div className="lab">{tr(c.lab)}</div><div className="v"><Money v={c.v} /> <span className={"d" + (c.up ? " up" : "")}>{typeof c.d === "string" ? c.d : tr(c.d)}</span></div></div>);
  return (<div className={"kpi-carousel " + (tone || "green")}>
    <div className="kpi-viewport">
      <div className="kpi-track" style={{ transform: `translateY(-${idx * 118}px)` }}>
        {slides.map((cards, si) => (<div className="kpi-slide" key={si}><div className="ws-kpirow km4">{cards.map(card)}</div></div>))}
      </div>
    </div>
    <div className="kpi-dots">{slides.map((_, i) => (<button key={i} className={"kpi-dot" + (i === idx ? " on" : "")} onClick={() => setIdx(i)} aria-label={"slide " + (i + 1)} />))}</div>
    {openAct && actCard && <div className="km-pop">
      <div className="km-poph"><b>{tr({ en: "5 escalations · prioritized by impact", ar: "5 تصعيدات · حسب الأثر", zh: "5 项升级 · 按影响排序" })}</b><button className="km-popx" onClick={(e) => { e.stopPropagation(); setOpenAct(false); }}>✕</button></div>
      {actCard.items.map((it, j) => (<div className="km-popr" key={j} onClick={() => { setOpenAct(false); setAlertsOpen(true); }}><span className="r">{j + 1}</span><div className="m"><div className="t">{tr(it.t)}</div><div className="s">{tr(it.s)}</div></div><span className="v">{it.v}</span></div>))}
      <div className="km-popf" onClick={() => { setOpenAct(false); setAlertsOpen(true); }}>{tr({ en: "Open Alerts & Exceptions Center →", ar: "فتح مركز التنبيهات →", zh: "打开告警与异常中心 →" })}</div>
    </div>}
  </div>);
}

// ===== Shared floating Smart Query (every workspace) =====
const SQ_GEN = { en: "Within the current scope, the agent cross-checked the linked records and source systems. Read: most indicators are within expected ranges except the items flagged above — open a highlighted row to see the contributing contracts/assets, then use a downstream hand-off action to route any approval. (Demo response; wire live data for exact figures.)", ar: "ضمن النطاق الحالي، راجع الوكيل السجلات والأنظمة المصدرية. النتيجة: معظم المؤشرات ضمن النطاقات المتوقعة عدا البنود المُعلَّمة أعلاه — افتح صفاً مميزاً لعرض العقود/الأصول، ثم استخدم إجراء تسليم لاحق للاعتماد. (إجابة عرض.)", zh: "在当前作用域内,智能体已交叉核对关联记录与源系统。结论:除上方标记项外,多数指标处于预期范围;点击任一高亮行可查看相关合同/资产,再用下游交接动作发起审批。(演示回答;接入实时数据后给出精确数值。)" };
function SmartQueryFab({ scope, prompts }) {
  const { tr, pushLog } = useStore();
  const [open, setOpen] = useState(false);
  const [ask, setAsk] = useState("");
  const [qa, setQa] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [showSugs, setShowSugs] = useState(false);
  const tRef = useRef(null);
  useEffect(() => { const el = tRef.current; if (el) el.scrollTop = el.scrollHeight; }, [qa, thinking]);
  const send = (q) => {
    const v = (q || ask).trim(); if (!v || thinking) return;
    pushLog({ en: "Smart query → " + v, ar: "استعلام ذكي → " + v, zh: "智能查询 → " + v });
    setQa(p => [...p, { role: "u", text: v }]); setAsk(""); setThinking(true); setShowSugs(false);
    setTimeout(() => { setQa(p => [...p, { role: "a", text: tr(SQ_GEN) }]); setThinking(false); }, 800);
  };
  return (<React.Fragment>
    <button className="wb-qfab" onClick={() => setOpen(o => !o)} title={tr({ en: "Smart query", ar: "استعلام ذكي", zh: "智能查询" })}>🤖</button>
    {open && <div className="wb-qpanel qa">
      <div className="wb-qph"><span className="wb-dot violet" /> <b>{tr({ en: "Smart query", ar: "استعلام ذكي", zh: "智能查询" })}</b>{SHOW_UC && <span style={{ fontSize: 9, fontWeight: 800, color: "#6d28d9", background: "#f5effe", borderRadius: 6, padding: "1px 6px", marginInlineStart: 6 }}>UC-03</span>}<button className="wb-qx" onClick={() => setOpen(false)}>✕</button></div>
      <div className="wb-pb wb-qbody">
        {scope && <div className="wb-src" style={{ marginBottom: 8 }}>{tr(scope)}</div>}
        <div className="wb-qa sq-conv" ref={tRef}>
          {qa.length === 0 && !thinking && <div className="sq-empty">{tr({ en: "Ask the department agent anything within this scope — or tap a suggested question below.", ar: "اسأل وكيل الإدارة ضمن هذا النطاق — أو اختر سؤالاً مقترحاً أدناه.", zh: "在此作用域内向部门智能体提问——或点击下方的建议问题。" })}</div>}
          {qa.map((m, i) => (<div className={"wb-qm " + m.role} key={i}><div className="bb">{m.text}</div></div>))}
          {thinking && <div className="wb-qm a"><div className="bb think"><span className="wb-typing"><i /><i /><i /></span></div></div>}
        </div>
        <div className={"wb-sqh" + (qa.length > 0 ? " tog" : "")} onClick={() => { if (qa.length > 0) setShowSugs(v => !v); }}>{tr({ en: "SUGGESTED QUESTIONS", ar: "أسئلة مقترحة", zh: "建议问题" })}{qa.length > 0 && <span className="sqtg">{showSugs ? "▾" : "▸"}</span>}</div>
        {(qa.length === 0 || showSugs) && (prompts || []).map((q, i) => (<div className="wb-sq" key={i} onClick={() => send(tr(q))}>{tr(q)} <span className="ar">→</span></div>))}
        <div className="wb-askh">{tr({ en: "Ask the department agent…", ar: "اسأل وكيل الإدارة…", zh: "向部门智能体提问…" })}</div>
        <div className="wb-ask"><input value={ask} onChange={e => setAsk(e.target.value)} placeholder={tr({ en: "Type your question…", ar: "اكتب سؤالك…", zh: "输入你的问题…" })} onKeyDown={e => e.key === "Enter" && send()} /><button className="btn sm" onClick={() => send()}>{tr({ en: "Send", ar: "إرسال", zh: "发送" })}</button></div>
      </div>
    </div>}
  </React.Fragment>);
}

// ===== Shared Business Plaza · two-lane overview (Revenue × Assets) =====
const NEXT_ACTIONS_RC = [
  { act: { en: "Approve & route 14 billing corrections to collections", ar: "اعتماد وتوجيه 14 تصحيحاً للتحصيل", zh: "批准并下发 14 项开票更正至征收" }, owner: "Layla Al-Harbi", role: { en: "Revenue Collection Lead", ar: "قائدة التحصيل", zh: "收入征收负责人" }, phone: "+966 55 014 2207" },
  { act: { en: "Launch dunning on top 18 contracts > 90d", ar: "بدء التحصيل على أعلى 18 عقداً > 90 يوماً", zh: "对逾期>90天的前18个合同启动催收" }, owner: "Omar Al-Qahtani", role: { en: "Collections Officer", ar: "مسؤول التحصيل", zh: "催收专员" }, phone: "+966 50 663 1180" },
  { act: { en: "Escalate Riyadh-East gap to Amanah finance", ar: "تصعيد فجوة الرياض-شرق لمالية الأمانة", zh: "将利雅得-东缺口上报阿玛纳财务" }, owner: "Faisal Al-Dossari", role: { en: "Riyadh-East Finance Mgr", ar: "مدير مالية الرياض-شرق", zh: "利雅得-东财务经理" }, phone: "+966 53 991 4472" },
];
const NEXT_ACTIONS_AS = [
  { act: { en: "Post SAR 1.92B AUC capitalization for review", ar: "ترحيل رسملة 1.92 مليار للمراجعة", zh: "提交 SAR 1.92B 在建资产资本化待复核" }, owner: "Noura Al-Otaibi", role: { en: "Asset Accounting Lead", ar: "قائدة محاسبة الأصول", zh: "资产会计负责人" }, phone: "+966 55 207 3318" },
  { act: { en: "Issue impairment memos — 3 equipment items", ar: "إصدار مذكرات انخفاض لـ 3 معدات", zh: "为 3 项设备开具减值备忘" }, owner: "Khalid Al-Mutairi", role: { en: "Compliance Officer", ar: "مسؤول الامتثال", zh: "合规专员" }, phone: "+966 50 118 9043" },
  { act: { en: "Schedule R-118 / R-204 maintenance", ar: "جدولة صيانة R-118 / R-204", zh: "安排 R-118 / R-204 维护" }, owner: "Sara Al-Ghamdi", role: { en: "Facilities & Maintenance", ar: "المرافق والصيانة", zh: "设施与维护" }, phone: "+966 53 442 7765" },
];
function SyncBadge() {
  const { tr } = useStore();
  const [sec, setSec] = useState(7);
  useEffect(() => { const id = setInterval(() => setSec(s => (s >= 95 ? 0 : s + 1)), 1000); return () => clearInterval(id); }, []);
  const ago = sec < 3 ? { en: "just now", ar: "الآن", zh: "刚刚" }
    : sec < 60 ? { en: sec + "s ago", ar: "قبل " + sec + " ث", zh: sec + " 秒前" }
    : { en: Math.floor(sec / 60) + "m ago", ar: "قبل " + Math.floor(sec / 60) + " د", zh: Math.floor(sec / 60) + " 分钟前" };
  return (<span className="sync-badge" title={tr({ en: "Live data sync from source systems", ar: "مزامنة بيانات حية من الأنظمة المصدرية", zh: "源系统实时数据同步" })}><span className="sync-ic">⟳</span><b>{tr({ en: "Data sync", ar: "مزامنة البيانات", zh: "数据同步" })}</b> · {tr(ago)}</span>);
}
function DwActions({ buttons }) {
  const { tr, pushLog } = useStore();
  const [done, setDone] = useState(null);
  if (done) return (<div className="dw-pbtns done"><span className="dw-confirm">✓ {tr(done)}</span><button className="dw-btn ghost" onClick={() => setDone(null)}>{tr({ en: "Undo", ar: "تراجع", zh: "撤销" })}</button></div>);
  return (<div className="dw-pbtns">{buttons.map((b, i) => (<button key={i} className={"dw-btn " + (b.cls || "")} onClick={b.go ? b.go : () => { pushLog(b.confirm); setDone(b.confirm); }}>{tr(b.label)}{b.arrow ? " →" : ""}</button>))}</div>);
}
function Hi({ t }) {
  if (!t) return t;
  const out = []; const re = /(\*\*[^*]+\*\*|~~[^~]+~~)/g; let last = 0, m, k = 0;
  while ((m = re.exec(t)) !== null) {
    if (m.index > last) out.push(t.slice(last, m.index));
    const seg = m[0];
    if (seg.slice(0, 2) === "**") out.push(<b className="hi-b" key={k++}>{seg.slice(2, -2)}</b>);
    else out.push(<mark className="hi-m" key={k++}>{seg.slice(2, -2)}</mark>);
    last = m.index + seg.length;
  }
  if (last < t.length) out.push(t.slice(last));
  return <React.Fragment>{out}</React.Fragment>;
}
function OrchNext({ items }) {
  const { tr } = useStore();
  return (<div className="orch-next">
    <div className="onh">⚐ {tr({ en: "Next actions · owners", ar: "الإجراءات التالية · المسؤولون", zh: "下一步动作 · 负责人" })}</div>
    {items.map((a, i) => (<div className="ona" key={i}>
      <span className="ona-i">{i + 1}</span>
      <div className="ona-m"><div className="ona-t">{tr(a.act)}</div><div className="ona-o">👤 {a.owner} · {tr(a.role)}</div></div>
      <a className="ona-tel" href={"tel:" + a.phone.replace(/[^+\d]/g, "")} onClick={e => e.stopPropagation()}>📞 {a.phone}</a>
    </div>))}
  </div>);
}
function BusinessPlaza({ defaultSel }) {
  const { tr, setRoute, setPerfJump, setDeptSub, setBackRoute } = useStore();
  const plazaWrapRef = useRef(null);
  const [plazaBox, setPlazaBox] = useState({ w: 0, h: 0 });
  const [plazaSel, setPlazaSel] = useState(null); // diagram opens as a clean overview; detail panel below defaults to defaultSel (UC-13/UC-14)
  const [plazaModal, setPlazaModal] = useState(false);
  useEffect(() => {
    const el = plazaWrapRef.current; if (!el || typeof ResizeObserver === "undefined") return;
    const calc = () => setPlazaBox({ w: el.clientWidth, h: el.clientHeight });
    calc(); const ro = new ResizeObserver(calc); ro.observe(el); return () => ro.disconnect();
  }, []);
  const PZ = { W: 720, H: 400, NW: 130, NH: 88, colX: [8, 152, 296, 440, 584] };
  const pzById = {}; PLAZA_UCS.forEach(n => { pzById[n.id] = n; });
  const pzRelated = (a, b) => PLAZA_CROSS.some(e => (e.from === a && e.to === b) || (e.from === b && e.to === a));
  const pzOpen = (n) => {
    if (n.open === "rcbench") { setDeptSub("revcol"); setRoute("rcbench"); }
    else if (n.open === "asbench") { setDeptSub("assets"); setRoute("asbench"); }
    else if (n.open === "report") { setPerfJump({ tab: "params" }); setBackRoute("rcwork"); setDeptSub("revcol"); setRoute("rcreports"); }
  };
  const ovScale = (plazaBox.w || 480) / PZ.W;
  const dScale = Math.min(1.12, ((typeof window !== "undefined" ? Math.min(840, window.innerWidth * 0.94) : 800) - 44) / PZ.W);
  const renderPlaza = (full, scale, sel) => {
    const astTop = full ? 424 : 280;
    const H = full ? 536 : PZ.H;
    const mid = full ? "pzarF" : "pzar";
    const top = (id) => pzById[id].lane === "rev" ? 62 : astTop;
    const bot = (id) => top(id) + PZ.NH;
    const cy = (id) => top(id) + PZ.NH / 2;
    const cx = (id) => PZ.colX[pzById[id].col] + PZ.NW / 2;
    const cross = (e, i) => {
      const sx = cx(e.from), sy = pzById[e.from].lane === "rev" ? bot(e.from) : top(e.from);
      const tx = cx(e.to), ty = pzById[e.to].lane === "rev" ? bot(e.to) : top(e.to);
      const my = full ? (158 + i * 44) : (215 + (i - 2.5) * 12);
      return { d: `M${sx},${sy} L${sx},${my} L${tx},${my} L${tx},${ty}`, lx: Math.min(sx, tx) + Math.abs(tx - sx) / 2, ly: my };
    };
    return (<div className="pz-canvas" style={{ width: PZ.W, height: H, transform: "scale(" + scale + ")" }}>
      <svg className="pz-links" width={PZ.W} height={H} viewBox={"0 0 " + PZ.W + " " + H} fill="none">
        <defs><marker id={mid} viewBox="0 0 10 10" markerWidth="7" markerHeight="7" refX="7" refY="5" orient="auto-start-reverse"><path d="M2,1 L8,5 L2,9" fill="none" stroke="context-stroke" strokeWidth="1.6" strokeLinecap="round" /></marker></defs>
        <rect x="2" y="34" width="716" height="140" rx="14" fill="#f3f6fd" />
        <rect x="2" y={astTop - 30} width="716" height="132" rx="14" fill="#f7f3fc" />
        <text x="14" y="51" className="pz-lane rev">REVENUE COLLECTION DEPARTMENT</text>
        <text x="14" y={astTop - 12} className="pz-lane ast">ASSETS DEPARTMENT</text>
        {PLAZA_INTRA.map(([a, b], i) => { const y = cy(a); const x1 = PZ.colX[pzById[a].col] + PZ.NW, x2 = PZ.colX[pzById[b].col]; const c = pzById[a].lane === "rev" ? "#1f3a8a" : "#5b3a9e"; return <path key={i} d={`M${x1},${y} L${x2 - 3},${y}`} stroke={c} strokeWidth="2" fill="none" markerEnd={`url(#${mid})`} opacity={0.85} />; })}
        {PLAZA_CROSS.map((e, i) => { if (!(full || (sel && (e.from === sel || e.to === sel)))) return null; const p = cross(e, i); return <path key={"c" + i} d={p.d} stroke="#e0524a" strokeWidth="1.7" strokeDasharray="5 4" fill="none" markerEnd={`url(#${mid})`} />; })}
      </svg>
      {PLAZA_UCS.map(n => { const dim = false; return (
        <div key={n.id} className={"pz-node " + n.lane + (sel === n.id ? " on" : "") + (dim ? " dim" : "")} style={{ left: PZ.colX[n.col], top: top(n.id), width: PZ.NW, height: PZ.NH }} onClick={full ? undefined : (ev) => { ev.stopPropagation(); setPlazaSel(n.id); }}>
          <div className="pz-code">{n.star ? <span className="pz-star">★</span> : null}{n.code}</div>
          <div className="pz-ttl">{tr(n.title)}</div>
          <div className="pz-ag">{full ? n.agents.join(" · ") : n.agents.length + " agents"}</div>
        </div>); })}
      {full && PLAZA_CROSS.map((e, i) => { const p = cross(e, i); return <div key={"l" + i} className="pz-elab" style={{ left: p.lx - 100, top: p.ly - 15 }}>{tr(e.label)}</div>; })}
    </div>);
  };
  return (<React.Fragment>
    <div className="ws-plaza">
      <div className="plaza-head">
        <div><h2 style={{ fontSize: 16 }}>{tr({ en: "Business Plaza", ar: "ساحة الأعمال", zh: "业务广场" })}</h2><div className="sub muted">{tr({ en: "Two-lane overview · click a UC for its cross-department I/O", ar: "نظرة عامة على مسارين · انقر على حالة لعرض التبادل بين الإدارات", zh: "双泳道概览 · 点击 UC 查看其跨部门 I/O" })}</div></div>
        <div className="pz-tools"><button className="btn sm pz-expand" onClick={() => setPlazaModal(true)}>{tr({ en: "Expand", ar: "توسيع", zh: "展开" })} ↗</button></div>
      </div>
      <div className="ws-flowwrap pz-wrap" ref={plazaWrapRef} style={{ height: Math.ceil(PZ.H * ovScale) }}>
        {renderPlaza(false, ovScale, plazaSel)}
      </div>
      {(() => { const cur = plazaSel || defaultSel; const n = pzById[cur]; if (!n) return null; const ios = PLAZA_CROSS.filter(e => e.from === cur || e.to === cur).map(e => ({ out: e.from === cur, code: pzById[e.from === cur ? e.to : e.from].code, label: e.label }));
        return (<div className="pz-detail">
          <div className="pz-dhead"><span className={"pz-dcode " + n.lane}>{n.star ? "★ " : ""}{n.code}</span><b>{tr(n.title)}</b>{n.open && <button className="btn sm pz-openb" onClick={() => pzOpen(n)}>{tr({ en: "Open", ar: "فتح", zh: "打开" })} ↗</button>}</div>
          <div className="pz-drow">
            <div className="pz-dcol"><div className="pz-dlab">{tr({ en: "Agents", ar: "الوكلاء", zh: "智能体" })}</div><div>{n.agents.map((a, i) => <span className="pz-chip" key={i}>{a}</span>)}</div></div>
            <div className="pz-dcol"><div className="pz-dlab">{tr({ en: "Cross-department I/O", ar: "التبادل بين الإدارات", zh: "跨部门 I/O" })}</div>{ios.length ? ios.map((x, i) => <p className="pz-io" key={i}>{x.out ? "→ " : "← "}{x.code}: {tr(x.label)}</p>) : <p className="pz-io muted">{tr({ en: "No cross-department links", ar: "لا روابط بين الإدارات", zh: "无跨部门连接" })}</p>}</div>
          </div>
        </div>); })()}
    </div>
    {plazaModal && <div className="al-overlay" onClick={() => setPlazaModal(false)}>
      <div className="pz-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="pz-mhead"><b>{tr({ en: "Full flow — Revenue Collection × Assets", ar: "المسار الكامل — التحصيل × الأصول", zh: "完整流程 — 收入征收 × 资产" })}</b><button className="pz-x" onClick={() => setPlazaModal(false)}>✕</button></div>
        <div className="pz-mscroll"><div className="pz-mcanvas" style={{ width: PZ.W * dScale, height: 536 * dScale }}>{renderPlaza(true, dScale, null)}</div></div>
        <div className="pz-legend"><span><i className="ln rev" />{tr({ en: "Revenue intra-lane", ar: "تدفّق التحصيل", zh: "收入同泳道" })}</span><span><i className="ln ast" />{tr({ en: "Assets intra-lane", ar: "تدفّق الأصول", zh: "资产同泳道" })}</span><span><i className="ln cross" />{tr({ en: "Cross-department I/O", ar: "التبادل بين الإدارات", zh: "跨部门 I/O" })}</span><span>★ {tr({ en: "shared convergence (UC-10 / UC-11)", ar: "تقارب مشترك (UC-10 / UC-11)", zh: "汇聚目标 (UC-10 / UC-11)" })}</span></div>
      </div>
    </div>}
  </React.Fragment>);
}

function RcWorkspace() {
  const { t, tr, setRoute, pushLog, lang } = useStore();
  const DEFAULT_PROMPT = { en: "Analyze billing gap for Q3 across all BU, flag overdue contracts > 60 days, and draft a collection note for executive review.", ar: "حلّل فجوة الفوترة للربع الثالث عبر كل الوحدات، وحدّد العقود المتأخرة > 60 يوماً، وصُغ مذكرة تحصيل للمراجعة التنفيذية.", zh: "分析第三季度各业务单元的开票缺口,标记逾期 > 60 天的合同,并起草供高管复核的征收说明。" };
  const [phase, setPhase] = useState("idle");            // idle | running | review | approved | returned
  const [prompt, setPrompt] = useState(tr(DEFAULT_PROMPT));
  const [sent, setSent] = useState(null);
  const [tl, setTl] = useState(["queued", "queued", "queued", "queued"]);
  const [thk, setThk] = useState(["queued", "queued", "queued", "queued"]);
  const [stage, setStage] = useState("idle"); // idle | think | timeline | result
  const [showDiff, setShowDiff] = useState(false);
  const timersRef = useRef([]);
  const bodyRef = useRef(null);
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  useEffect(() => { if (phase === "idle") setPrompt(tr(DEFAULT_PROMPT)); }, [lang]);   // keep default localized until edited
  useEffect(() => () => clearTimers(), []);
  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTop = el.scrollHeight; }, [tl, thk, phase, sent, showDiff]);   // auto-scroll chat
  const THINK_STEPS = [
    { en: "Interpreting intent", ar: "تفسير القصد", zh: "解析意图" },
    { en: "Checking permission scope", ar: "التحقق من نطاق الصلاحيات", zh: "检查权限范围" },
    { en: "Selecting agents", ar: "اختيار الوكلاء", zh: "选择智能体" },
    { en: "Planning subtasks", ar: "تخطيط المهام الفرعية", zh: "规划子任务" },
  ];
  const PH = {
    idle: { t: { en: "ready", ar: "جاهز", zh: "就绪" }, c: "var(--muted)" },
    running: { t: { en: "running", ar: "يعمل", zh: "运行中" }, c: "var(--info)" },
    review: { t: { en: "awaiting review", ar: "بانتظار المراجعة", zh: "待审批" }, c: "var(--amber)" },
    approved: { t: { en: "completed", ar: "اكتمل", zh: "已完成" }, c: "var(--green-dark)" },
    returned: { t: { en: "returned", ar: "أُعيد", zh: "已退回" }, c: "var(--danger)" },
  };
  const runOrch = () => {
    if (phase === "running" || !prompt.trim()) return;
    clearTimers(); setShowDiff(false); setSent(prompt.trim()); setPhase("running"); setStage("think");
    setThk(["think", "queued", "queued", "queued"]);
    setTl(["queued", "queued", "queued", "queued"]);
    pushLog({ en: "Orchestrator started — analyzing billing gap & overdue risk (Q3, all BU)", ar: "بدأ المنسّق — تحليل فجوة الفوترة ومخاطر التأخر (الربع الثالث، كل الوحدات)", zh: "编排器已启动——分析开票缺口与逾期风险(Q3,全部业务单元)" });
    // 1) thinking process
    [[450, ["done", "think", "queued", "queued"]], [900, ["done", "done", "think", "queued"]], [1350, ["done", "done", "done", "think"]], [1750, ["done", "done", "done", "done"]]]
      .forEach(p => timersRef.current.push(setTimeout(() => setThk(p[1]), p[0])));
    // 2) agent timeline (after thinking)
    timersRef.current.push(setTimeout(() => { setStage("timeline"); setTl(["think", "queued", "queued", "queued"]); }, 1800));
    [[2500, ["done", "think", "queued", "queued"]], [3300, ["done", "done", "think", "queued"]], [4200, ["done", "done", "done", "think"]]]
      .forEach(p => timersRef.current.push(setTimeout(() => setTl(p[1]), p[0])));
    timersRef.current.push(setTimeout(() => { setPhase("review"); pushLog({ en: "Draft ready — 14 corrections await human approval", ar: "المسودة جاهزة — 14 تصحيحاً بانتظار الاعتماد", zh: "草稿就绪——14 项更正等待人工审批" }); }, 4900));
  };
  const approve = () => {
    if (phase === "approved") return; clearTimers(); setPhase("approved"); setStage("result"); setTl(["done", "done", "done", "done"]);
    pushLog({ en: "Finance Lead approved 14 corrections; executive note generated", ar: "اعتمد قائد المالية 14 تصحيحاً؛ وأُنشئت المذكرة التنفيذية", zh: "财务负责人批准 14 项更正;已生成执行说明" });
  };
  const returnFix = () => {
    clearTimers(); setShowDiff(false); setPhase("returned"); setStage("result"); setTl(["done", "done", "done", "queued"]);
    pushLog({ en: "14 corrections returned to the Revenue agent for rework", ar: "أُعيدت 14 تصحيحاً لوكيل الإيرادات لإعادة المعالجة", zh: "14 项更正已退回收入智能体重新处理" });
  };
  const tlMeta = [
    { code: "UC-01", t: { en: "pull unified dataset", ar: "سحب البيانات الموحّدة", zh: "拉取统一数据集" }, s: { en: "28,140 records reconciled · 0.8s", ar: "28,140 سجلاً · 0.8 ث", zh: "对账 28,140 条 · 0.8s" } },
    { code: "UC-13", t: { en: "detect billing gap", ar: "كشف فجوة الفوترة", zh: "检测开票缺口" }, s: { en: "SAR 12.4M gap · 14 corrections proposed", ar: "فجوة 12.4M · 14 تصحيحاً", zh: "缺口 12.4M · 提议 14 项更正" } },
    { code: "UC-13", t: { en: "score overdue risk", ar: "تقييم مخاطر التأخر", zh: "评估逾期风险" }, s: { en: "scanning 42 overdue contracts · ETA 6s", ar: "فحص 42 عقداً متأخراً · 6 ث", zh: "扫描 42 个逾期合同 · 约 6s" } },
    { code: "UC-06", t: { en: "draft executive note", ar: "صياغة المذكرة التنفيذية", zh: "起草执行说明" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
  ];
  return (<div className="fade"><div className="card pad ws-frame">
    <div className="ws-head">
      <SmartQueryFab scope={{ en: "Scope: Revenue Collection · read-only", ar: "النطاق: التحصيل · للقراءة", zh: "范围:收入征收 · 只读" }} prompts={[{ en: "Where is today's billing gap?", ar: "أين فجوة الفوترة اليوم؟", zh: "今天的开票缺口在哪里?" }, { en: "Which contracts drive most of the overdue?", ar: "ما العقود التي تقود معظم التأخر؟", zh: "哪些合同造成大部分逾期?" }, { en: "Draft a collection note for review", ar: "صياغة مذكرة تحصيل", zh: "起草供复核的征收说明" }]} />
      <div className="ws-htext"><h1 style={{ fontSize: 22 }}>{tr({ en: "Revenue Collection Department", ar: "إدارة التحصيل", zh: "收入征收部" })}</h1>
        <div className="sub muted">{tr({ en: "Mandate: billing, collections & exclusions (UC-13). Workspace — operating type: KPI metrics + Business Plaza for cross-dept hand-off + floating Smart Query.", ar: "المهمة: الفوترة والتحصيل والاستبعادات (UC-13). مساحة العمل — نوع تشغيلي: مؤشرات + ساحة الأعمال للتسليم بين الإدارات + استعلام ذكي عائم.", zh: "职责:开票、征收与排除项(UC-13)。Workspace — 运营生产型:关键指标 + Business Plaza 跨部门协同交付 + 浮动智能查询。" })}{SHOW_UC ? " · UC-13" : ""}</div></div>
      {/* compact downstream storyline (demo note) — right of header, no border */}
      <div className="ws-story-r">
        <div className="ws-story-h">{tr({ en: "G-06 storyline · downstream evolution", ar: "مسار ج-06 · التطور اللاحق", zh: "G-06 故事线 · 下游演进" })}</div>
        <div className="flowstrip mini">{RC_FLOW.map((f, i) => (<React.Fragment key={i}>{i > 0 && <span className="farr">➜</span>}
          <div className={"fb " + f.cls}>{f.star ? "★ " : ""}{SHOW_UC ? f.code : tr(f.label)}</div></React.Fragment>))}</div>
      </div>
    </div>
    {/* top KPI metrics — carousel */}
    <KpiCarousel tone="green" slides={RC_KPI_SLIDES} />
    <div className="ws-grid2">
      {/* LEFT (50%) — Business Plaza + Multi-Agent Flow */}
      <div className="ws-left">
        <BusinessPlaza defaultSel="uc13" />
      </div>
      {/* RIGHT (50%) — Smart query (top) + Multi-Agent Flow (below) */}
      <div className="ws-right">
      <div className="orch-cell"><div className="orch orch-chat">
        <div className="orch-h">{tr({ en: "Orchestrator", ar: "المنسّق", zh: "编排器" })} {phase === "running" && <span className="pulse" style={{ marginInlineStart: 2 }} />} <span style={{ fontSize: 12, color: PH[phase].c, fontWeight: 600, marginInlineStart: 4 }}>{tr(PH[phase].t)}</span></div>
        <div className="orch-sub">{SHOW_UC ? "UC-13 · " : ""}run #2041 · {tr({ en: "Revenue Collection agent", ar: "وكيل التحصيل", zh: "收入征收智能体" })}</div>
        <div className="ctx-chips" style={{ marginBottom: 4 }}><span className="chip gray">scope: Q3/2026</span><span className="chip gray">dept: RC only</span><span className="chip gray">policy: BRD WL</span></div>
        <div className="orch-body" ref={bodyRef}>
          {!sent && <div className="orch-empty">
            <div>{tr({ en: "Type a request below — the orchestrator runs the agent timeline, then returns a human-in-the-loop review.", ar: "اكتب طلباً بالأسفل — يشغّل المنسّق الخط الزمني للوكلاء ثم يعيد مراجعة بشرية.", zh: "在下方输入请求——编排器会运行智能体时间线,随后返回人工审批。" })}</div>
            <div className="orch-sugs">{RC_PROMPTS.map((p, i) => (<button className="orch-sug" key={i} onClick={() => setPrompt(tr(p.t) + " · " + tr(p.s))}>↗ {tr(p.t)}</button>))}</div>
          </div>}
          {sent && <div className="chat-msg user"><div className="bubble">{sent}</div></div>}
          {stage === "think" && <div className="msg bot think-msg">
            <div className="av">✦</div>
            <div className="bubble"><div className="think">{THINK_STEPS.map((s, i) => { const st = thk[i]; const stt = st === "done" ? "ok" : st === "think" ? "act" : "";
              return (<div className={"tl " + stt} key={i}><span className="ti">{st === "done" ? "✓" : st === "think" ? "◐" : "○"}</span><span>{tr(s)}</span></div>); })}</div></div>
          </div>}
          {stage === "timeline" && <div className="chat-msg bot">
            <div className="ws-sec-h">{tr({ en: "Agent timeline", ar: "خط زمن الوكلاء", zh: "智能体时间线" })}</div>
            <div className="tl">{tlMeta.map((e, i) => { const st = tl[i]; const cur = st === "think";
              return (<div className={"ev" + (cur ? " cur" : "")} key={i}>
                <span className={"dotc " + (st === "done" ? "done" : st === "think" ? "think" : "")}>{st === "done" ? "✓" : st === "think" ? "◐" : ""}</span>
                <div className="et">{ucl(e.code, tr(e.t))} {st === "queued" ? <span className="chip gray">{tr({ en: "queued", ar: "في الانتظار", zh: "排队" })}</span> : st === "think" ? <span className="chip info">{tr({ en: "thinking…", ar: "يفكّر…", zh: "思考中…" })}</span> : <span className="chip">{tr({ en: "done", ar: "تم", zh: "完成" })}</span>}</div>
                <div className="es">{tr(e.s)}</div>
              </div>); })}</div>
          </div>}
          {(phase === "review" || phase === "approved" || phase === "returned") && <div className="chat-msg bot">
            {(phase === "review" || phase === "approved") && <div className="hitl">
              <div className="hh">⚑ {tr({ en: "HUMAN-IN-THE-LOOP REVIEW", ar: "مراجعة بشرية إلزامية", zh: "人工审批" })}</div>
              <div className="hb">{tr({ en: "14 billing corrections require finance approval before the executive note is generated.", ar: "تتطلب 14 تصحيحاً اعتماد المالية قبل إنشاء المذكرة التنفيذية.", zh: "14 项开票更正需财务批准后方可生成执行说明。" })}</div>
              {phase === "approved"
                ? <span className="chip">✓ {tr({ en: "Approved · executive note generated", ar: "معتمد · أُنشئت المذكرة", zh: "已批准 · 已生成执行说明" })}</span>
                : <React.Fragment><div className="hitl-btns"><button className="btn" onClick={approve}>✓ {tr({ en: "Approve corrections", ar: "اعتماد التصحيحات", zh: "批准更正" })}</button><button className="btn danger sm" onClick={returnFix}>↺ {tr({ en: "Return for fix", ar: "إعادة للتصحيح", zh: "退回修正" })}</button><button className="btn ghost sm" onClick={() => setShowDiff(v => !v)}>⌥ {tr({ en: "View diff", ar: "عرض الفرق", zh: "查看差异" })}</button></div>
                  {showDiff && <div className="diffbox">
                    <div className="dl rem">− BU-12 · INV-4471 — SAR 0 {tr({ en: "(unbilled)", ar: "(غير مفوتر)", zh: "(未开票)" })}</div>
                    <div className="dl add">+ BU-12 · INV-4471 — SAR 1.86M {tr({ en: "(corrected)", ar: "(مصحّح)", zh: "(已更正)" })}</div>
                    <div className="dl rem">− {tr({ en: "overdue flag · none", ar: "علم التأخر · لا شيء", zh: "逾期标记 · 无" })}</div>
                    <div className="dl add">+ {tr({ en: "overdue flag · 42 contracts > 60d", ar: "علم التأخر · 42 عقداً > 60 يوماً", zh: "逾期标记 · 42 个合同 > 60 天" })}</div>
                  </div>}</React.Fragment>}
            </div>}
            {phase === "returned" && <div className="hitl ret">
              <div className="hh">↺ {tr({ en: "RETURNED FOR FIX", ar: "أُعيد للتصحيح", zh: "已退回修正" })}</div>
              <div className="hb">{tr({ en: "Corrections sent back to the Revenue agent. Edit the prompt and run again.", ar: "أُعيدت التصحيحات لوكيل الإيرادات. عدّل الطلب وأعد التشغيل.", zh: "更正已退回收入智能体。请修改提示后重新运行。" })}</div>
            </div>}
            {(phase === "review" || phase === "approved") && <OrchNext items={NEXT_ACTIONS_RC} />}
          </div>}
        </div>
        <div className="orch-bar">
          <textarea className="orch-cin" rows={1} value={prompt} disabled={phase === "running"} onChange={e => setPrompt(e.target.value)} placeholder={tr(DEFAULT_PROMPT)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runOrch(); } }} />
          <button className="orch-send" disabled={phase === "running" || !prompt.trim()} onClick={runOrch}>{phase === "running" ? "…" : "SEND"}</button>
        </div>
      </div></div>
      <div className="ws-flowcard" onClick={() => setRoute("rcdata")} title={tr({ en: "Open Multi-Agent Flow", ar: "فتح تدفّق الوكلاء", zh: "打开多智能体流程" })}>
        <div className="ws-flowcard-h"><span>{tr({ en: "Multi-Agent Flow", ar: "تدفّق متعدد الوكلاء", zh: "多智能体流程" })}</span><span className="ws-flowcard-hr"><span className="at-tip at-tip-r" onClick={(e) => e.stopPropagation()} aria-label={tr({ en: "G-06 Revenue & Assets Directorate — Multi-Agent Flow", ar: "مديرية الإيرادات والأصول ج-06 — تدفّق الوكلاء", zh: "G-06 收入与资产总局 — 多智能体流程" })} tabIndex={0}>i<span className="at-tip-pop">{tr({ en: "G-06 Revenue & Assets Directorate — Multi-Agent Flow", ar: "مديرية الإيرادات والأصول ج-06 — تدفّق الوكلاء", zh: "G-06 收入与资产总局 — 多智能体流程" })}</span></span><span className="open">↗</span></span></div>
        <svg className="ws-flowthumb" viewBox="0 0 300 44" fill="none" preserveAspectRatio="xMidYMid meet">
          <rect x="4" y="5" width="20" height="7" rx="2" fill="#eef2f7" /><rect x="4" y="14" width="20" height="7" rx="2" fill="#eef2f7" /><rect x="4" y="23" width="20" height="7" rx="2" fill="#eef2f7" /><rect x="4" y="32" width="20" height="7" rx="2" fill="#eef2f7" />
          <rect x="40" y="12" width="28" height="20" rx="4" fill="#fff" stroke="#2563eb" strokeWidth="1.4" />
          <rect x="86" y="5" width="40" height="9" rx="2.5" fill="#2563eb" /><rect x="86" y="18" width="40" height="9" rx="2.5" fill="#f1f4f8" stroke="#dfe5ec" strokeWidth="0.8" /><rect x="86" y="31" width="40" height="9" rx="2.5" fill="#f1f4f8" stroke="#dfe5ec" strokeWidth="0.8" />
          <rect x="138" y="16" width="20" height="12" rx="3.5" fill="#eef4ff" stroke="#cdddfb" strokeWidth="0.8" />
          <rect x="172" y="9" width="50" height="26" rx="5" fill="#2563eb" /><circle cx="197" cy="22" r="4" fill="#fff" />
          <rect x="236" y="11" width="40" height="9" rx="2.5" fill="#e9f7ef" stroke="#bfe6cf" strokeWidth="0.8" /><rect x="236" y="24" width="40" height="9" rx="2.5" fill="#fdf4d9" stroke="#f0dca6" strokeWidth="0.8" />
          <g stroke="#c2cbd6" strokeWidth="1"><path d="M24 22 H40" /><path d="M68 22 H86" /><path d="M126 22 H138" /><path d="M158 22 H172" /><path d="M222 22 H236" /></g>
        </svg>
      </div>
      </div>
    </div>
  </div></div>);
}

/* ======= Assets Department — Analysis Workbench (UC-14) ======= */
function AssetsWorkbench() {
  const { tr, setRoute, pushLog, setDeptSub, setBackRoute } = useStore();
  const [ask, setAsk] = useState("");
  const [feed, setFeed] = useState(WB_AS.logs);
  const logRef = useRef(null);
  const [qa, setQa] = useState([]);
  const [thinking, setThinking] = useState(false);
  const [showSugs, setShowSugs] = useState(false);
  const qaRef = useRef(null);
  const [fsel, setFsel] = useState([2, 0, 0, 0]);
  const DEFAULT_SUMMARY = { en: "FY 2026 Q1 · ~~SAR 1.92B~~ of completed AUC (**312 items** past in-service date) is ready to capitalize — delaying it understates asset value before close. ~~3 equipment items (SAR 47M NBV)~~ breach the impairment threshold; **5 infrastructure assets** are maintenance-due, and deferring raises whole-life cost **~18%**. Data-quality **96%** — cost is traceable from assignment order to register.", ar: "الربع الأول 2026 · ~~1.92 مليار~~ من الأصول المكتملة (**312 بنداً**) جاهزة للرسملة — التأجيل يقلّل القيمة قبل الإقفال. ~~3 معدات (47 مليون)~~ تتجاوز حد الانخفاض؛ **5 أصول** مستحقة للصيانة، والتأجيل يرفع الكلفة **~18%**. جودة البيانات **96%**.", zh: "FY2026 Q1 · ~~SAR 1.92B~~ 已完工在建资产(**312 项**已过投用日)可资本化——拖延将在关账前低估资产价值。~~3 项设备(账面净值 SAR 47M)~~ 触及减值阈值;**5 项基础设施**待维护,推迟将使全生命周期成本上升 **约 18%**。数据质量 **96%**——成本从派工单到台账可追溯。" };
  const [summary, setSummary] = useState(DEFAULT_SUMMARY);
  const [qaOpen, setQaOpen] = useState(false);
  const UP = { en: "UPSTREAM", ar: "منبع", zh: "上游" }, PARA = { en: "PARALLEL", ar: "متوازٍ", zh: "并行" }, DOWN = { en: "DOWNSTREAM", ar: "المصب", zh: "下游" }, THIS = { en: "THIS", ar: "هذه", zh: "本环节" };
  const WB_CHAIN = [
    { code: "UC-01", pos: UP, name: { en: "Financial Data Consolidation & Data Quality", ar: "توحيد البيانات المالية وجودتها", zh: "财务数据整合与数据质量" } },
    { code: "UC-13", pos: UP, name: { en: "Revenue, Collections & Exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、征收与排除项" } },
    { code: "UC-06 / UC-02", pos: UP, name: { en: "Performance Reports / Anomaly Detection", ar: "تقارير الأداء / كشف الانحرافات", zh: "绩效报告 / 异常检测" } },
    { code: "UC-14", here: true, pos: THIS, name: { en: "Assets, Classification & Capitalization", ar: "الأصول والتصنيف والرسملة", zh: "资产、分类与资本化" } },
    { code: "UC-12 / UC-11", pos: PARA, name: { en: "Costs & Funds / Compliance & Memos", ar: "التكاليف والصناديق / الامتثال والمذكرات", zh: "成本与资金 / 合规与备忘" } },
    { code: "UC-10 / UC-03", pos: DOWN, name: { en: "Reporting & Dashboards / Smart Query & Audit", ar: "التقارير / الاستعلام والتدقيق", zh: "报告与仪表盘 / 智能查询与审计" } },
  ];
  const WB_SOURCES = [
    { n: "Asset Registry", s: "synced" }, { n: "SAP", s: "synced" }, { n: "Balady Data", s: "synced" }, { n: "Esnad", s: "loading" }, { n: "Invoices", s: "synced" },
    { n: "Comprehensive Guide", s: "synced" }, { n: "Coordinates", s: "synced" }, { n: "Investment & Maint. Data", s: "synced" }, { n: "Secretariats Data", s: "synced" },
  ];
  const WB_OUTPUTS = [
    { l: { en: "Improved Asset Registry", ar: "سجل أصول محسّن", zh: "改进的资产台账" }, v: "8,640", s: { en: "records cleansed · 96% quality", ar: "سجلات منقّحة · جودة 96%", zh: "记录清洗 · 质量 96%" }, tag: { en: "DQ 96%", ar: "الجودة 96%", zh: "质量 96%" }, rows: [
      { k: { en: "Duplicates merged", ar: "تكرارات مدمجة", zh: "合并重复" }, v: "214" },
      { k: { en: "Fields filled", ar: "حقول مكمّلة", zh: "补全字段" }, v: "1,308" },
      { k: { en: "Class corrections", ar: "تصحيح التصنيف", zh: "分类更正" }, v: "96" },
    ] },
    { l: { en: "Capitalization Recommendations", ar: "توصيات الرسملة", zh: "资本化建议" }, v: "SAR 1.92B", s: { en: "312 AUC items ready", ar: "312 بنداً جاهزاً", zh: "312 项在建资产就绪" }, rows: [
      { k: { en: "Buildings (142)", ar: "مبانٍ (142)", zh: "建筑(142)" }, v: "SAR 1.12B", pct: 58 },
      { k: { en: "Infrastructure (121)", ar: "بنية تحتية (121)", zh: "基础设施(121)" }, v: "SAR 0.58B", pct: 30 },
      { k: { en: "Equipment (49)", ar: "معدات (49)", zh: "设备(49)" }, v: "SAR 0.22B", pct: 12 },
    ] },
    { l: { en: "Asset Cost Tracking", ar: "تتبّع تكلفة الأصل", zh: "资产成本追踪" }, v: "100%", s: { en: "invoice → register traceable", ar: "الفاتورة ← السجل قابل للتتبع", zh: "发票 → 台账可追溯" }, rows: [
      { k: { en: "Orders linked", ar: "أوامر مرتبطة", zh: "已关联派工单" }, v: "1,204" },
      { k: { en: "Invoices matched", ar: "فواتير مطابقة", zh: "已匹配发票" }, v: "3,310" },
      { k: { en: "Unmatched", ar: "غير مطابق", zh: "未匹配" }, v: "0" },
    ] },
    { l: { en: "Investment Opportunities", ar: "فرص استثمارية", zh: "投资机会" }, v: "5 · SAR 86M", s: { en: "reuse / disposal flags", ar: "إعادة استخدام / تصرّف", zh: "复用 / 处置标记" }, rows: [
      { k: { en: "Idle land reuse (2)", ar: "إعادة استخدام أرض (2)", zh: "闲置土地复用(2)" }, v: "SAR 54M" },
      { k: { en: "Equipment disposal (2)", ar: "تصرّف معدات (2)", zh: "设备处置(2)" }, v: "SAR 21M" },
      { k: { en: "Sublease (1)", ar: "إيجار فرعي (1)", zh: "转租(1)" }, v: "SAR 11M" },
    ] },
    { l: { en: "Maintenance Alerts", ar: "تنبيهات الصيانة", zh: "维护告警" }, v: "5", s: { en: "infra-led · ≤60 days", ar: "بنية تحتية · ≤60 يوماً", zh: "基础设施 · ≤60 天" }, rows: [
      { k: { en: "Roads R-118 / R-204", ar: "طرق R-118 / R-204", zh: "道路 R-118 / R-204" }, v: "≤30d" },
      { k: { en: "Buildings (2)", ar: "مبانٍ (2)", zh: "建筑(2)" }, v: "≤45d" },
      { k: { en: "Equipment (1)", ar: "معدات (1)", zh: "设备(1)" }, v: "≤60d" },
    ] },
  ];
  const cyc = (i) => setFsel(s => s.map((v, j) => j === i ? (v + 1) % WB_AS.filters[i].opts.length : v));
  const applyFilters = () => {
    const period = WB_AS.filters[0].opts[fsel[0]], cls = WB_AS.filters[2].opts[fsel[2]];
    setSummary({ en: `For ${period} · ${cls}: SAR 1.92B AUC ready for capitalization, 3 impairment flags (SAR 47M) and 5 maintenance-due assets; data quality 96%.`, ar: `لـ ${period} · ${cls}: 1.92 مليار جاهزة للرسملة، 3 مؤشرات انخفاض (47 مليون) و5 أصول صيانة؛ جودة 96%.`, zh: `${period} · ${cls}:SAR 1.92B 可资本化,3 项减值(SAR 47M),5 项待维护;数据质量 96%。` });
    pushLog({ en: "Filters applied — " + period + " · " + cls, ar: "تم تطبيق عوامل التصفية — " + period, zh: "已应用筛选 — " + period + " · " + cls });
  };
  const SCOPE_K = [{ en: "Period", ar: "الفترة", zh: "期间" }, { en: "Fund", ar: "الصندوق", zh: "基金" }, { en: "Class", ar: "الفئة", zh: "类别" }, { en: "Status", ar: "الحالة", zh: "状态" }];
  const cycleScope = (i) => {
    const ns = fsel.map((v, j) => j === i ? (v + 1) % WB_AS.filters[i].opts.length : v); setFsel(ns);
    const period = WB_AS.filters[0].opts[ns[0]], cls = WB_AS.filters[2].opts[ns[2]];
    setSummary({ en: `For ${period} · ${cls}: SAR 1.92B AUC ready for capitalization, 3 impairment flags (SAR 47M) and 5 maintenance-due assets; data quality 96%.`, ar: `لـ ${period} · ${cls}: 1.92 مليار جاهزة للرسملة، 3 مؤشرات انخفاض (47 مليون) و5 أصول صيانة؛ جودة 96%.`, zh: `${period} · ${cls}:SAR 1.92B 可资本化,3 项减值(SAR 47M),5 项待维护;数据质量 96%。` });
    pushLog({ en: "Scope changed — " + period + " · " + cls, ar: "تغيّر النطاق — " + period, zh: "作用域已更改 — " + period + " · " + cls });
  };
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => {
      n++; const base = WB_AS.logs[n % WB_AS.logs.length];
      const tm = "10:" + String((6 + n) % 60).padStart(2, "0");
      setFeed(f => [...f.slice(-7), { ...base, tm }]);
    }, 2300);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [feed]);
  const askQ = (idx, raw, ansObj) => {
    const q = idx >= 0 ? tr(WB_AS.qs[idx]) : (raw || "").trim();
    if (!q || thinking) return;
    const a = ansObj ? tr(ansObj) : (idx >= 0 ? tr(WB_AS.answers[idx]) : tr(WB_AS.genAns));
    pushLog({ en: "Q&A → Assets agent: " + q, ar: "سؤال → وكيل الأصول: " + q, zh: "提问 → 资产智能体:" + q });
    setShowSugs(false);
    setQa(p => [...p, { role: "u", text: q }]); setAsk(""); setThinking(true);
    setTimeout(() => { setQa(p => [...p, { role: "a", text: a }]); setThinking(false); }, 850);
  };
  useEffect(() => { const el = qaRef.current; if (el) el.scrollTop = el.scrollHeight; }, [qa, thinking]);
  const badge = (s) => s === "running" ? <span className="wb-badge run">{tr({ en: "running", ar: "يعمل", zh: "运行中" })}</span>
    : s === "focus" ? <span className="wb-badge foc">{tr({ en: "in focus", ar: "قيد التركيز", zh: "聚焦中" })}</span>
    : <span className="wb-badge act">{tr({ en: "active", ar: "نشط", zh: "活动" })}</span>;
  const risk = (r) => <span className={"wb-risk " + r}>{tr(r === "high" ? { en: "high", ar: "مرتفع", zh: "高" } : r === "med" ? { en: "med", ar: "متوسط", zh: "中" } : { en: "low", ar: "منخفض", zh: "低" })}</span>;
  const fAsk = (row) => askQ(-1, row.id + " · " + tr(row.am) + " — " + row.od, {
    en: row.id + " (" + tr(row.am) + ", NBV " + row.od + ") is flagged for " + tr(row.flag) + " at " + row.risk + " risk. Driver: utilization decline and market-value drop beyond the policy threshold. Recommended: raise an accounting memo and route to compliance review.",
    ar: row.id + " (" + tr(row.am) + "، 47 مليون) مرصود لـ " + tr(row.flag) + " بخطر " + row.risk + ". الموصى به: إصدار مذكرة محاسبية وتحويلها لمراجعة الامتثال.",
    zh: row.id + "(" + tr(row.am) + ",账面净值 " + row.od + ")被标记为" + tr(row.flag) + ",风险 " + row.risk + "。主因:利用率下降与市场价值跌破政策阈值。建议:开具会计备忘并转合规复核。",
  });
  return (<div className="fade wb">
    <div className="card pad wb-frame">
    {/* HEADER */}
    <div className="card pad wb-head">
      <div><div className="wb-title"><button className="pg-back" onClick={() => { setDeptSub("assets"); setRoute("aswork"); }}>‹</button><span className="wb-dot violet" /> {tr({ en: "Assets Department", ar: "إدارة الأصول", zh: "资产部" })} · {tr({ en: "Analysis Workbench", ar: "منصة التحليل", zh: "分析工作台" })}</div>
        <div className="wb-subt">{ucl("UC-14", tr({ en: "Assets, Classification, Capitalization, Returns & Maintenance", ar: "الأصول والتصنيف والرسملة والعوائد والصيانة", zh: "资产、分类、资本化、收益与维护" }))}</div></div>
      <div className="wb-chain"><span className="wb-clab">{tr({ en: "G-06 CHAIN", ar: "سلسلة ج-06", zh: "G-06 链路" })}</span>{WB_CHAIN.map((c, i) => (<React.Fragment key={i}>{i > 0 && <span className="wb-carr">→</span>}<span className={"wb-cpill" + (c.here ? " here" : "")}>{c.pos && <span className="wb-cpos">{tr(c.pos)}</span>}{SHOW_UC ? c.code + " · " : ""}{tr(c.name)}</span></React.Fragment>))}</div>
    </div>
    {/* INSIGHT & NEXT ACTIONS */}
    <div className="wb-actbar">
      <div className="wb-ab-top">
        <div className="wb-ab-spark">✦</div>
        <div className="wb-ab-tt">
          <div><span className="wb-ab-lab">{tr({ en: "AI INSIGHT & NEXT ACTIONS", ar: "رؤى الذكاء الاصطناعي والإجراءات", zh: "AI 洞察与后续行动" })}</span><span className="wb-ab-meta">{SHOW_UC ? "UC-14 · " : ""}run #3107 · {tr({ en: "Assets agent", ar: "وكيل الأصول", zh: "资产智能体" })} · {tr({ en: "scope", ar: "النطاق", zh: "作用域" })}: {WB_AS.filters[0].opts[fsel[0]]} · {WB_AS.filters[2].opts[fsel[2]]}</span></div>
          <div className="wb-ab-insight"><Hi t={tr(summary)} /></div>
        </div>
      </div>
      <div className="wb-ab-rows">
        <div className="wb-ab-col">
          <div className="wb-ab-h">⚐ {tr({ en: "RECOMMENDED · prompts", ar: "موصى به · مقترحات", zh: "建议 · 提示(点击应用)" })}</div>
          <div className="wb-sugs">{WB_AS.next.map((n, i) => (<button className="wb-sug" key={i} onClick={() => { pushLog({ en: "Applied recommendation — " + tr(n.t), ar: "تطبيق توصية — " + tr(n.t), zh: "已应用建议 — " + tr(n.t) }); setQaOpen(true); }}><span className="pr">{i + 1}</span><span className="wb-sug-tx"><b>{tr(n.t)}</b><i>{tr(n.d)}</i></span></button>))}</div>
        </div>
        <div className="wb-ab-col r">
          <div className="wb-ab-h">➜ {tr({ en: "HAND OFF DOWNSTREAM · actions", ar: "تسليم لاحق · إجراءات", zh: "下游交接 · 动作" })}</div>
          <div className="wb-ctas">
            <button className="wb-cta p" onClick={() => { setBackRoute("asbench"); setRoute("csfunds"); }}>{SHOW_UC && <span className="uc">UC-12</span>}{tr({ en: "Send to Costs & Funds Close", ar: "إرسال إلى إقفال التكاليف والصناديق", zh: "推送至成本与资金结账" })}<span className="ar">→</span></button>
            <button className="wb-cta s" onClick={() => { setBackRoute("asbench"); setRoute("compmemo"); }}>{SHOW_UC && <span className="uc">UC-11</span>}{tr({ en: "Raise Compliance / Accounting Memo", ar: "إصدار مذكرة امتثال / محاسبية", zh: "发起合规 / 会计备忘" })}<span className="ar">→</span></button>
          </div>
        </div>
      </div>
    </div>
    {/* RESULTS + scope chips */}
    <div className="wb-sech shead">
      <div><h2>{tr({ en: "Asset Capitalization & Lifecycle Results", ar: "نتائج رسملة الأصول ودورة الحياة", zh: "资产资本化与生命周期结果" })}</h2><div className="muted">{ucl("UC-14", tr({ en: "UC-14 outputs · produced by agents", ar: "مخرجات UC-14 · أُنتجت بواسطة الوكلاء", zh: "UC-14 输出 · 由智能体生成" }))}</div></div>
      <div className="wb-scope"><span className="wb-sl">{tr({ en: "SCOPE", ar: "النطاق", zh: "作用域" })}</span>
        {WB_AS.filters.map((f, i) => (<button className="wb-schip" key={i} onClick={() => cycleScope(i)} title={tr(f.lab)}><span className="k">{tr(SCOPE_K[i])}</span><span className="v">{f.opts[fsel[i]]}</span><span className="cv">▾</span></button>))}
        <span className="wb-auto">● {tr({ en: "auto-applied", ar: "تطبيق تلقائي", zh: "自动应用" })}</span>
      </div>
    </div>
    <div className="wb-ogrid">{WB_OUTPUTS.map((o, i) => (<div className="wb-ocard" key={i}><div className="oc-h">{tr(o.l)}{o.tag && <span className="oc-tag">{tr(o.tag)}</span>}</div><div className="oc-b"><div className="oc-v"><Money v={o.v} /></div><div className="oc-s">{tr(o.s)}</div></div>{o.rows && <div className="oc-rows">{o.rows.map((r, j) => (<div className="oc-row" key={j}><span className="k">{tr(r.k)}</span>{typeof r.pct === "number" && <span className="ocbar"><i style={{ width: r.pct + "%" }} /></span>}<span className="ov">{r.v}</span></div>))}</div>}</div>))}</div>
    <div className="wb-cols3">
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Capitalization Overview", ar: "نظرة عامة على الرسملة", zh: "资本化概览" })}</b></div>
        <div className="wb-pb">
          <div className="wb-kl">{tr({ en: "AUC → CAPITALIZED (PERIOD)", ar: "تحت الإنشاء ← مرسمل (الفترة)", zh: "在建资产 → 已资本化(本期)" })}</div>
          <div className="wb-krow"><span className="wb-big">62%</span><span className="chip">SAR 1.92B</span></div>
          <div className="wb-bars">
            <div className="wb-bar"><div className="bl">{tr({ en: "AUC opening", ar: "تحت الإنشاء (افتتاحي)", zh: "在建期初" })}</div><div className="bt"><span className="bf plan" style={{ width: "100%" }} /></div><div className="bv"><Money v="SAR 3.10B" /></div></div>
            <div className="wb-bar"><div className="bl">{tr({ en: "Capitalized", ar: "مرسمل", zh: "已资本化" })}</div><div className="bt"><span className="bf coll" style={{ width: "50%" }} /></div><div className="bv"><Money v="SAR 1.92B" /></div></div>
            <div className="wb-bar"><div className="bl">{tr({ en: "Remaining AUC", ar: "متبقٍ تحت الإنشاء", zh: "剩余在建" })}</div><div className="bt"><span className="bf out" style={{ width: "38%" }} /></div><div className="bv"><Money v="SAR 1.18B" /></div></div>
          </div>
          <div className="wb-kk"><span>{tr({ en: "Avg useful life", ar: "متوسط العمر الإنتاجي", zh: "平均使用年限" })}</span><b>28 {tr({ en: "yr", ar: "سنة", zh: "年" })}</b></div>
          <div className="wb-kk"><span>{tr({ en: "Data quality score", ar: "درجة جودة البيانات", zh: "数据质量分" })}</span><b className="up">96%</b></div>
        </div></div>
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Impairment & Maintenance · Focus List", ar: "الانخفاض والصيانة · قائمة التركيز", zh: "减值与维护 · 重点清单" })}</b><span className="wb-pm">{tr({ en: "top 5", ar: "أعلى 5", zh: "前 5" })}</span></div>
        <div className="wb-pb">
          <table className="wb-table"><thead><tr><th>{tr({ en: "ASSET ID", ar: "رقم الأصل", zh: "资产编号" })}</th><th>{tr({ en: "CLASS", ar: "الفئة", zh: "类别" })}</th><th>{tr({ en: "NBV", ar: "ق. دفترية", zh: "账面净值" })}</th><th>{tr({ en: "FLAG", ar: "العلم", zh: "标记" })}</th><th>{tr({ en: "RISK", ar: "الخطر", zh: "风险" })}</th></tr></thead>
            <tbody>{WB_AS.focus.map((r, i) => (<tr key={i} onClick={() => fAsk(r)}><td className="mono">{r.id}</td><td>{tr(r.am)}</td><td><Money v={r.od} /></td><td><span className="chip gray">{tr(r.flag)}</span></td><td>{risk(r.risk)}</td></tr>))}</tbody></table>
          <div className="wb-tfoot"><span>{tr({ en: "Showing 5 of 18 · click any row to ask the agent", ar: "عرض 5 من 18 · انقر أي صف لسؤال الوكيل", zh: "显示 18 中的 5 条 · 点击任意行向智能体提问" })}</span><a onClick={() => askQ(1)}>{tr({ en: "View all →", ar: "عرض الكل →", zh: "查看全部 →" })}</a></div>
        </div></div>
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Asset Class Distribution", ar: "توزيع فئات الأصول", zh: "资产类别分布" })}</b></div>
        <div className="wb-pb">
          <div className="wb-kl2">{tr({ en: "Capitalized value by class", ar: "القيمة المرسملة حسب الفئة", zh: "按类别的已资本化价值" })}</div>
          {WB_AS.dist.map((d, i) => (<div className="wb-dist" key={i}><div className="dn">{tr(d.am)}</div><div className="dt"><span className={"df " + d.cls} style={{ width: d.pct + "%" }} /></div><div className="dv"><Money v={d.v} /></div></div>))}
          <div className="wb-other"><span>{tr({ en: "Total capitalized", ar: "إجمالي المرسمل", zh: "已资本化合计" })}</span><b><Money v="SAR 1.92B" /></b></div>
        </div></div>
    </div>
    {/* MULTI-AGENT WORKSPACE */}
    <div className="wb-sech"><h2>{tr({ en: "Multi-Agent Workspace", ar: "مساحة عمل متعددة الوكلاء", zh: "多智能体工作区" })}</h2><div className="muted">{tr({ en: "Orchestrated agent roles & live action timeline", ar: "أدوار وكلاء منسّقة وخط زمني حي", zh: "编排的智能体角色与实时操作时间线" })}</div></div>
    <div className="wb-cols3 wb-work">
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot" style={{ background: "#5b3a9e" }} /> <b>{tr({ en: "Data Inputs · sources", ar: "مدخلات البيانات · المصادر", zh: "数据输入 · 源系统" })}</b><span className="wb-pm">{tr({ en: "9 systems", ar: "9 أنظمة", zh: "9 个系统" })}</span><button className="wb-impbtn" onClick={() => pushLog({ en: "Manual Excel / CSV import — flagged as temporary source (BR-04)", ar: "استيراد Excel / CSV يدوي — مصدر مؤقت (BR-04)", zh: "手动导入 Excel / CSV — 标记为临时来源(BR-04)" })} title={tr({ en: "Upload an Excel/CSV file when an API is unavailable (temporary source)", ar: "رفع ملف Excel/CSV عند عدم توفّر الواجهة (مصدر مؤقت)", zh: "当接口不可用时上传 Excel/CSV 文件(临时来源)" })}>⬆ {tr({ en: "Import Excel/CSV", ar: "استيراد Excel/CSV", zh: "导入 Excel/CSV" })}</button></div>
        <div className="wb-pb"><div className="wb-srclist">{WB_SOURCES.map((s, i) => (<div className="wb-src" key={i}><span className={"sd" + (s.s === "loading" ? " load" : "")} /><span className="sn">{s.n}</span><span className="ss">{tr(s.s === "loading" ? { en: "loading", ar: "تحميل", zh: "载入" } : { en: "synced", ar: "متزامن", zh: "已同步" })}</span></div>))}</div></div></div>
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot violet" /> <b>{tr({ en: "Orchestrator · Task Board", ar: "المنسّق · لوحة المهام", zh: "编排器 · 任务板" })}</b><span className="wb-orchpill"><span className="gear">⚙</span>{tr({ en: "Auto-orchestration · 3 agents", ar: "تنسيق تلقائي · 3 وكلاء", zh: "自动编排 · 3 个智能体" })}</span></div>
        <div className="wb-pb">{WB_AS.roles.map((r, i) => (<div className={"wb-role " + (r.cls || "") + (r.focus ? " foc-card" : "")} key={i} onClick={r.focus ? () => { setDeptSub("assets"); setRoute("aswork"); } : undefined}>
          <div className="rl"><div className="rt">{r.code ? ucl(r.code, tr(r.name)) : tr(r.name)}</div><div className="rs">{tr(r.sub)}</div></div>{badge(r.status)}
        </div>))}</div></div>
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot violet" /> <b>{tr({ en: "Agent Timeline · Logs", ar: "خط زمن الوكلاء · السجلات", zh: "智能体时间线 · 日志" })}</b><span className="wb-pm">{tr({ en: "last 5 min", ar: "آخر 5 د", zh: "最近 5 分钟" })}</span></div>
        <div className="wb-pb"><div className="wb-tl" ref={logRef}>{feed.map((e, i) => (<div className={"wb-ev" + (i === feed.length - 1 ? " live" : "")} key={i}><span className={"wb-dot2 " + e.dot} /><div className="wb-eh"><b>{e.tm}</b> · {e.code ? ucl(e.code, tr(e.h)) : tr(e.h)}</div><div className="wb-ed">{tr(e.d)}</div></div>))}</div></div></div>
    </div>
    <button className="wb-qfab" onClick={() => setQaOpen(o => !o)} aria-label="AI Narratives & Q&A" title={tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}>🤖</button>
    {qaOpen && <div className="wb-qpanel qa">
      <div className="wb-qph"><span className="wb-dot violet" /> <b>{tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}</b><button className="wb-qx" onClick={() => setQaOpen(false)}>✕</button></div>
        <div className="wb-pb wb-qbody">
          {qa.length === 0 && !thinking && <div className="wb-narrwrap"><div className="wb-ntag">{ucl("UC-14", tr({ en: "NARRATIVE", ar: "السرد", zh: "叙述" }))}</div>
          <div className="wb-narr">
            <p>{tr({ en: "SAR 1.92B of completed assets-under-construction is ready for capitalization this period, led by road infrastructure (SAR 0.84B) and buildings (SAR 0.61B).", ar: "1.92 مليار ريال من الأصول تحت الإنشاء المكتملة جاهزة للرسملة، تقودها البنية التحتية (0.84) والمباني (0.61).", zh: "本期 SAR 1.92B 已完工在建资产可资本化,以道路基础设施(SAR 0.84B)与建筑(SAR 0.61B)为主。" })}</p>
            <p>{tr({ en: "Three equipment items (SAR 47M NBV) breach the impairment threshold on idle utilization and market decline; five infrastructure assets are due for maintenance within 60 days.", ar: "ثلاث معدات (47 مليون) تتجاوز حد الانخفاض؛ وخمسة أصول بنية تحتية مستحقة للصيانة خلال 60 يوماً.", zh: "三项设备(账面净值 SAR 47M)因闲置利用与市场下跌突破减值阈值;五项基础设施资产将在 60 天内到期维护。" })}</p>
            <div className="wb-rp">{tr({ en: "Recommended priorities:", ar: "الأولويات الموصى بها:", zh: "建议优先事项:" })}</div>
            <ul><li>{tr({ en: "Capitalize SAR 1.92B completed AUC", ar: "رسملة 1.92 مليار من الأصول المكتملة", zh: "资本化 SAR 1.92B 已完工在建资产" })}</li>
              <li>{tr({ en: "Raise impairment memos for 3 equipment items", ar: "إصدار مذكرات انخفاض لـ 3 معدات", zh: "为 3 项设备开具减值备忘" })}</li>
              <li>{tr({ en: "Schedule maintenance for R-118 / R-204", ar: "جدولة صيانة لـ R-118 / R-204", zh: "为 R-118 / R-204 安排维护" })}</li></ul>
            <div className="wb-src">{ucl("UC-01", tr({ en: "Source: unified asset data · Data Querying Agent", ar: "المصدر: بيانات أصول موحّدة · وكيل الاستعلام", zh: "来源:统一资产数据 · 数据查询智能体" }))}</div>
          </div></div>}
          {(qa.length > 0 || thinking) && <div className="wb-qa" ref={qaRef}>
            {qa.map((m, i) => (<div className={"wb-qm " + m.role} key={i}><div className="bb"><Money v={m.text} /></div></div>))}
            {thinking && <div className="wb-qm a"><div className="bb think"><span className="wb-typing"><i /><i /><i /></span></div></div>}
          </div>}
          <div className={"wb-sqh" + (qa.length > 0 ? " tog" : "")} onClick={() => { if (qa.length > 0) setShowSugs(v => !v); }}>{tr({ en: "SUGGESTED QUESTIONS", ar: "أسئلة مقترحة", zh: "建议问题" })}{qa.length > 0 && <span className="sqtg">{showSugs ? "▾" : "▸"}</span>}</div>
          {(qa.length === 0 || showSugs) && WB_AS.qs.map((q, i) => (<div className="wb-sq" key={i} onClick={() => askQ(i)}>{tr(q)} <span className="ar">→</span></div>))}
          <div className="wb-askh">{tr({ en: "Ask the Assets agent…", ar: "اسأل وكيل الأصول…", zh: "向资产智能体提问…" })}</div>
          <div className="wb-ask"><input value={ask} onChange={e => setAsk(e.target.value)} placeholder={tr({ en: "Type your question…", ar: "اكتب سؤالك…", zh: "输入你的问题…" })} onKeyDown={e => e.key === "Enter" && askQ(-1, ask)} /><button className="btn sm" onClick={() => askQ(-1, ask)}>{tr({ en: "Send", ar: "إرسال", zh: "发送" })}</button></div>
        </div>
    </div>}
    </div>
  </div>);
}

/* ======= Assets Department — workspace (department landing) ======= */
function AssetsWorkspace() {
  const { tr, setRoute, pushLog, lang } = useStore();
  const DEFAULT_PROMPT = { en: "Review completed assets-under-construction for capitalization, flag impairment and maintenance risks, and draft an asset note for executive review.", ar: "راجع الأصول تحت الإنشاء المكتملة للرسملة، وحدّد مخاطر الانخفاض والصيانة، وصُغ مذكرة أصول للمراجعة التنفيذية.", zh: "复核已完工在建资产以进行资本化,标记减值与维护风险,并起草供高管复核的资产说明。" };
  const [phase, setPhase] = useState("idle");
  const [prompt, setPrompt] = useState(tr(DEFAULT_PROMPT));
  const [sent, setSent] = useState(null);
  const [tl, setTl] = useState(["queued", "queued", "queued", "queued"]);
  const [thk, setThk] = useState(["queued", "queued", "queued", "queued"]);
  const [stage, setStage] = useState("idle");
  const [showDiff, setShowDiff] = useState(false);
  const timersRef = useRef([]);
  const bodyRef = useRef(null);
  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = []; };
  useEffect(() => { if (phase === "idle") setPrompt(tr(DEFAULT_PROMPT)); }, [lang]);
  useEffect(() => () => clearTimers(), []);
  useEffect(() => { const el = bodyRef.current; if (el) el.scrollTop = el.scrollHeight; }, [tl, thk, phase, sent, showDiff]);
  const THINK_STEPS = [
    { en: "Interpreting intent", ar: "تفسير القصد", zh: "解析意图" },
    { en: "Checking permission scope", ar: "التحقق من نطاق الصلاحيات", zh: "检查权限范围" },
    { en: "Selecting agents", ar: "اختيار الوكلاء", zh: "选择智能体" },
    { en: "Planning subtasks", ar: "تخطيط المهام الفرعية", zh: "规划子任务" },
  ];
  const AS_PROMPTS = [
    { t: { en: "Capitalize completed AUC", ar: "رسملة الأصول المكتملة", zh: "资本化已完工在建资产" }, s: { en: "this period · all classes", ar: "هذه الفترة · كل الفئات", zh: "本期 · 全部类别" } },
    { t: { en: "Detect impairment risk", ar: "كشف مخاطر الانخفاض", zh: "检测减值风险" }, s: { en: "equipment & infrastructure", ar: "معدات وبنية تحتية", zh: "设备与基础设施" } },
    { t: { en: "Plan maintenance schedule", ar: "تخطيط جدول الصيانة", zh: "规划维护计划" }, s: { en: "next 60 days", ar: "الـ 60 يوماً القادمة", zh: "未来 60 天" } },
  ];
  const PH = {
    idle: { t: { en: "ready", ar: "جاهز", zh: "就绪" }, c: "var(--muted)" },
    running: { t: { en: "running", ar: "يعمل", zh: "运行中" }, c: "var(--info)" },
    review: { t: { en: "awaiting review", ar: "بانتظار المراجعة", zh: "待审批" }, c: "var(--amber)" },
    approved: { t: { en: "completed", ar: "اكتمل", zh: "已完成" }, c: "var(--green-dark)" },
    returned: { t: { en: "returned", ar: "أُعيد", zh: "已退回" }, c: "var(--danger)" },
  };
  const runOrch = () => {
    if (phase === "running" || !prompt.trim()) return;
    clearTimers(); setShowDiff(false); setSent(prompt.trim()); setPhase("running"); setStage("think");
    setThk(["think", "queued", "queued", "queued"]);
    setTl(["queued", "queued", "queued", "queued"]);
    pushLog({ en: "Orchestrator started — reviewing AUC capitalization & impairment (FY26 Q1, all classes)", ar: "بدأ المنسّق — مراجعة الرسملة والانخفاض (الربع الأول 2026)", zh: "编排器已启动——复核在建资产资本化与减值(FY26 Q1,全部类别)" });
    [[450, ["done", "think", "queued", "queued"]], [900, ["done", "done", "think", "queued"]], [1350, ["done", "done", "done", "think"]], [1750, ["done", "done", "done", "done"]]]
      .forEach(p => timersRef.current.push(setTimeout(() => setThk(p[1]), p[0])));
    timersRef.current.push(setTimeout(() => { setStage("timeline"); setTl(["think", "queued", "queued", "queued"]); }, 1800));
    [[2500, ["done", "think", "queued", "queued"]], [3300, ["done", "done", "think", "queued"]], [4200, ["done", "done", "done", "think"]]]
      .forEach(p => timersRef.current.push(setTimeout(() => setTl(p[1]), p[0])));
    timersRef.current.push(setTimeout(() => { setPhase("review"); pushLog({ en: "Draft ready — 12 capitalization entries await human approval", ar: "المسودة جاهزة — 12 قيد رسملة بانتظار الاعتماد", zh: "草稿就绪——12 项资本化分录等待人工审批" }); }, 4900));
  };
  const approve = () => {
    if (phase === "approved") return; clearTimers(); setPhase("approved"); setStage("result"); setTl(["done", "done", "done", "done"]);
    pushLog({ en: "Finance Lead approved 12 capitalization entries; asset note generated", ar: "اعتمد قائد المالية 12 قيداً؛ وأُنشئت مذكرة الأصول", zh: "财务负责人批准 12 项资本化分录;已生成资产说明" });
  };
  const returnFix = () => {
    clearTimers(); setShowDiff(false); setPhase("returned"); setStage("result"); setTl(["done", "done", "done", "queued"]);
    pushLog({ en: "12 entries returned to the Assets agent for rework", ar: "أُعيدت 12 قيداً لوكيل الأصول لإعادة المعالجة", zh: "12 项分录已退回资产智能体重新处理" });
  };
  const tlMeta = [
    { code: "UC-01", t: { en: "pull unified asset dataset", ar: "سحب بيانات الأصول الموحّدة", zh: "拉取统一资产数据集" }, s: { en: "8,640 records reconciled · 0.9s", ar: "8,640 سجلاً · 0.9 ث", zh: "对账 8,640 条 · 0.9s" } },
    { code: "UC-14", t: { en: "detect capitalization candidates", ar: "كشف مرشحي الرسملة", zh: "检测资本化候选" }, s: { en: "SAR 1.92B AUC ready · 312 items", ar: "1.92 مليار جاهزة · 312 بنداً", zh: "SAR 1.92B 就绪 · 312 项" } },
    { code: "UC-14", t: { en: "score impairment & maintenance", ar: "تقييم الانخفاض والصيانة", zh: "评估减值与维护" }, s: { en: "3 impairment · 5 maintenance flagged", ar: "3 انخفاض · 5 صيانة", zh: "标记 3 减值 · 5 维护" } },
    { code: "UC-06", t: { en: "draft asset note", ar: "صياغة مذكرة الأصول", zh: "起草资产说明" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
  ];
  return (<div className="fade"><div className="card pad ws-frame">
    <div className="ws-head">
      <SmartQueryFab scope={{ en: "Scope: Assets · read-only", ar: "النطاق: الأصول · للقراءة", zh: "范围:资产 · 只读" }} prompts={[{ en: "Which assets are due for capitalization?", ar: "ما الأصول المستحقة للرسملة؟", zh: "哪些资产应予资本化?" }, { en: "Where are impairment risks concentrated?", ar: "أين تتركّز مخاطر الانخفاض؟", zh: "减值风险集中在哪里?" }, { en: "Which assets need maintenance soon?", ar: "ما الأصول التي تحتاج صيانة قريباً؟", zh: "哪些资产即将需要维护?" }]} />
      <div className="ws-htext"><h1 style={{ fontSize: 22 }}>{tr({ en: "Assets Department", ar: "إدارة الأصول", zh: "资产部" })}</h1>
        <div className="sub muted">{tr({ en: "Mandate: asset classification, capitalization, returns & maintenance (UC-14). Workspace — operating type: KPI metrics + Business Plaza hand-off to cost/compliance/reporting + floating Smart Query.", ar: "المهمة: تصنيف الأصول والرسملة والعوائد والصيانة (UC-14). مساحة العمل — نوع تشغيلي: مؤشرات + ساحة الأعمال + استعلام ذكي عائم.", zh: "职责:资产分类、资本化、回报与维护(UC-14)。Workspace — 运营生产型:关键指标 + Business Plaza 向成本/合规/报告交付 + 浮动智能查询。" })}{SHOW_UC ? " · UC-14" : ""}</div></div>
      <div className="ws-story-r">
        <div className="ws-story-h">{tr({ en: "G-06 storyline · downstream evolution", ar: "مسار ج-06 · التطور اللاحق", zh: "G-06 故事线 · 下游演进" })}</div>
        <div className="flowstrip mini">{RC_FLOW.map((f, i) => (<React.Fragment key={i}>{i > 0 && <span className="farr">➜</span>}
          <div className={"fb " + f.cls}>{f.star ? "★ " : ""}{SHOW_UC ? f.code : tr(f.label)}</div></React.Fragment>))}</div>
      </div>
    </div>
    {/* top KPI metrics — carousel (asset lifecycle + UC-14 outputs) */}
    <KpiCarousel tone="violet" slides={AS_KPI_SLIDES} />
    <div className="ws-grid2">
      {/* LEFT (50%) — Business Plaza */}
      <div className="ws-left">
        <BusinessPlaza defaultSel="uc14" />
      </div>
      {/* RIGHT (50%) — Smart query (top) + Analysis Workbench entry (below) */}
      <div className="ws-right">
      <div className="orch-cell"><div className="orch orch-chat">
        <div className="orch-h">{tr({ en: "Orchestrator", ar: "المنسّق", zh: "编排器" })} {phase === "running" && <span className="pulse" style={{ marginInlineStart: 2 }} />} <span style={{ fontSize: 12, color: PH[phase].c, fontWeight: 600, marginInlineStart: 4 }}>{tr(PH[phase].t)}</span></div>
        <div className="orch-sub">{SHOW_UC ? "UC-14 · " : ""}run #3107 · {tr({ en: "Assets agent", ar: "وكيل الأصول", zh: "资产智能体" })}</div>
        <div className="ctx-chips" style={{ marginBottom: 4 }}><span className="chip gray">scope: FY26 Q1</span><span className="chip gray">dept: Assets only</span><span className="chip gray">policy: IPSAS · useful-life</span></div>
        <div className="orch-body" ref={bodyRef}>
          {!sent && <div className="orch-empty">
            <div>{tr({ en: "Type a request below — the orchestrator runs the agent timeline, then returns a human-in-the-loop review.", ar: "اكتب طلباً بالأسفل — يشغّل المنسّق الخط الزمني للوكلاء ثم يعيد مراجعة بشرية.", zh: "在下方输入请求——编排器会运行智能体时间线,随后返回人工审批。" })}</div>
            <div className="orch-sugs">{AS_PROMPTS.map((p, i) => (<button className="orch-sug" key={i} onClick={() => setPrompt(tr(p.t) + " · " + tr(p.s))}>↗ {tr(p.t)}</button>))}</div>
          </div>}
          {sent && <div className="chat-msg user"><div className="bubble">{sent}</div></div>}
          {stage === "think" && <div className="msg bot think-msg">
            <div className="av">✦</div>
            <div className="bubble"><div className="think">{THINK_STEPS.map((s, i) => { const st = thk[i]; const stt = st === "done" ? "ok" : st === "think" ? "act" : "";
              return (<div className={"tl " + stt} key={i}><span className="ti">{st === "done" ? "✓" : st === "think" ? "◐" : "○"}</span><span>{tr(s)}</span></div>); })}</div></div>
          </div>}
          {stage === "timeline" && <div className="chat-msg bot">
            <div className="ws-sec-h">{tr({ en: "Agent timeline", ar: "خط زمن الوكلاء", zh: "智能体时间线" })}</div>
            <div className="tl">{tlMeta.map((e, i) => { const st = tl[i]; const cur = st === "think";
              return (<div className={"ev" + (cur ? " cur" : "")} key={i}>
                <span className={"dotc " + (st === "done" ? "done" : st === "think" ? "think" : "")}>{st === "done" ? "✓" : st === "think" ? "◐" : ""}</span>
                <div className="et">{ucl(e.code, tr(e.t))} {st === "queued" ? <span className="chip gray">{tr({ en: "queued", ar: "في الانتظار", zh: "排队" })}</span> : st === "think" ? <span className="chip info">{tr({ en: "thinking…", ar: "يفكّر…", zh: "思考中…" })}</span> : <span className="chip">{tr({ en: "done", ar: "تم", zh: "完成" })}</span>}</div>
                <div className="es">{tr(e.s)}</div>
              </div>); })}</div>
          </div>}
          {(phase === "review" || phase === "approved" || phase === "returned") && <div className="chat-msg bot">
            {(phase === "review" || phase === "approved") && <div className="hitl">
              <div className="hh">⚑ {tr({ en: "HUMAN-IN-THE-LOOP REVIEW", ar: "مراجعة بشرية إلزامية", zh: "人工审批" })}</div>
              <div className="hb">{tr({ en: "12 capitalization entries require finance approval before the asset note is generated.", ar: "تتطلب 12 قيد رسملة اعتماد المالية قبل إنشاء مذكرة الأصول.", zh: "12 项资本化分录需财务批准后方可生成资产说明。" })}</div>
              {phase === "approved"
                ? <span className="chip">✓ {tr({ en: "Approved · asset note generated", ar: "معتمد · أُنشئت المذكرة", zh: "已批准 · 已生成资产说明" })}</span>
                : <React.Fragment><div className="hitl-btns"><button className="btn" onClick={approve}>✓ {tr({ en: "Approve entries", ar: "اعتماد القيود", zh: "批准分录" })}</button><button className="btn danger sm" onClick={returnFix}>↺ {tr({ en: "Return for fix", ar: "إعادة للتصحيح", zh: "退回修正" })}</button><button className="btn ghost sm" onClick={() => setShowDiff(v => !v)}>⌥ {tr({ en: "View diff", ar: "عرض الفرق", zh: "查看差异" })}</button></div>
                  {showDiff && <div className="diffbox">
                    <div className="dl rem">− AUC-2207 — SAR 0 {tr({ en: "(not capitalized)", ar: "(غير مرسمل)", zh: "(未资本化)" })}</div>
                    <div className="dl add">+ AUC-2207 — SAR 1.92B {tr({ en: "(capitalized)", ar: "(مرسمل)", zh: "(已资本化)" })}</div>
                    <div className="dl rem">− {tr({ en: "impairment flag · none", ar: "علم الانخفاض · لا شيء", zh: "减值标记 · 无" })}</div>
                    <div className="dl add">+ {tr({ en: "impairment flag · 3 equipment items (SAR 47M)", ar: "علم الانخفاض · 3 معدات (47 مليون)", zh: "减值标记 · 3 项设备(SAR 47M)" })}</div>
                  </div>}</React.Fragment>}
            </div>}
            {phase === "returned" && <div className="hitl ret">
              <div className="hh">↺ {tr({ en: "RETURNED FOR FIX", ar: "أُعيد للتصحيح", zh: "已退回修正" })}</div>
              <div className="hb">{tr({ en: "Entries sent back to the Assets agent. Edit the prompt and run again.", ar: "أُعيدت القيود لوكيل الأصول. عدّل الطلب وأعد التشغيل.", zh: "分录已退回资产智能体。请修改提示后重新运行。" })}</div>
            </div>}
            {(phase === "review" || phase === "approved") && <OrchNext items={NEXT_ACTIONS_AS} />}
          </div>}
        </div>
        <div className="orch-bar">
          <textarea className="orch-cin" rows={1} value={prompt} disabled={phase === "running"} onChange={e => setPrompt(e.target.value)} placeholder={tr(DEFAULT_PROMPT)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); runOrch(); } }} />
          <button className="orch-send" disabled={phase === "running" || !prompt.trim()} onClick={runOrch}>{phase === "running" ? "…" : "SEND"}</button>
        </div>
      </div></div>
      <div className="ws-flowcard" onClick={() => setRoute("rcdata")} title={tr({ en: "Open Multi-Agent Flow", ar: "فتح تدفّق الوكلاء", zh: "打开多智能体流程" })}>
        <div className="ws-flowcard-h"><span>{tr({ en: "Multi-Agent Flow", ar: "تدفّق متعدد الوكلاء", zh: "多智能体流程" })}</span><span className="ws-flowcard-hr"><span className="at-tip at-tip-r" onClick={(e) => e.stopPropagation()} aria-label={tr({ en: "G-06 Revenue & Assets Directorate — Multi-Agent Flow", ar: "مديرية الإيرادات والأصول ج-06 — تدفّق الوكلاء", zh: "G-06 收入与资产总局 — 多智能体流程" })} tabIndex={0}>i<span className="at-tip-pop">{tr({ en: "G-06 Revenue & Assets Directorate — Multi-Agent Flow", ar: "مديرية الإيرادات والأصول ج-06 — تدفّق الوكلاء", zh: "G-06 收入与资产总局 — 多智能体流程" })}</span></span><span className="open">↗</span></span></div>
        <svg className="ws-flowthumb" viewBox="0 0 300 44" fill="none" preserveAspectRatio="xMidYMid meet">
          <rect x="4" y="5" width="20" height="7" rx="2" fill="#f1ecfa" /><rect x="4" y="14" width="20" height="7" rx="2" fill="#f1ecfa" /><rect x="4" y="23" width="20" height="7" rx="2" fill="#f1ecfa" /><rect x="4" y="32" width="20" height="7" rx="2" fill="#f1ecfa" />
          <rect x="40" y="12" width="28" height="20" rx="4" fill="#fff" stroke="#5b3a9e" strokeWidth="1.4" />
          <rect x="86" y="5" width="40" height="9" rx="2.5" fill="#5b3a9e" /><rect x="86" y="18" width="40" height="9" rx="2.5" fill="#f3eefb" stroke="#e4d7fb" strokeWidth="0.8" /><rect x="86" y="31" width="40" height="9" rx="2.5" fill="#f3eefb" stroke="#e4d7fb" strokeWidth="0.8" />
          <rect x="138" y="16" width="20" height="12" rx="3.5" fill="#f3eefb" stroke="#e4d7fb" strokeWidth="0.8" />
          <rect x="172" y="9" width="50" height="26" rx="5" fill="#5b3a9e" /><circle cx="197" cy="22" r="4" fill="#fff" />
          <rect x="236" y="11" width="40" height="9" rx="2.5" fill="#e9f7ef" stroke="#bfe6cf" strokeWidth="0.8" /><rect x="236" y="24" width="40" height="9" rx="2.5" fill="#fdf4d9" stroke="#f0dca6" strokeWidth="0.8" />
          <g stroke="#c2cbd6" strokeWidth="1"><path d="M24 22 H40" /><path d="M68 22 H86" /><path d="M126 22 H138" /><path d="M158 22 H172" /><path d="M222 22 H236" /></g>
        </svg>
      </div>
      </div>
    </div>
  </div></div>);
}

/* ======= UC-12 · Costs, Assignment Orders & Funds — mode-driven console ======= */
const CF_LOGS = [
  { tm: "10:02", code: "UC-01", h: { en: "Data Querying", ar: "استعلام البيانات", zh: "数据查询" }, d: { en: "Matched 1,840 payment orders ↔ Etimad records · 0.9s", ar: "طابق 1,840 أمر دفع ↔ سجلات اعتماد · 0.9 ث", zh: "匹配 1,840 付款单 ↔ Etimad 记录 · 0.9s" }, dot: "blue" },
  { tm: "10:03", h: { en: "Data Querying", ar: "استعلام البيانات", zh: "数据查询" }, d: { en: "Reconciled 4 cash requests with payment orders & invoices", ar: "سوّى 4 طلبات نقدية مع أوامر الدفع والفواتير", zh: "对账 4 现金申请 ↔ 付款单 ↔ 发票" }, dot: "blue" },
  { tm: "10:04", h: { en: "Financial Reports Gen.", ar: "توليد التقارير", zh: "财务报告生成" }, d: { en: "Allocated SAR 2.14B project cost across 1,780 units", ar: "وزّع 2.14 مليار على 1,780 وحدة", zh: "将 SAR 2.14B 项目成本分摊至 1,780 单元" }, dot: "blue" },
  { tm: "10:05", h: { en: "Anomaly Detection", ar: "كشف الشذوذ", zh: "异常检测" }, d: { en: "Flagged INV-3410 (no completion certificate) · blocks approval", ar: "رصد INV-3410 (لا شهادة إنجاز) · يمنع الاعتماد", zh: "标记 INV-3410(缺完工证明)· 阻断审批" }, dot: "amber" },
  { tm: "10:06", code: "UC-12", h: { en: "Anomaly Detection", ar: "كشف الشذوذ", zh: "异常检测" }, d: { en: "Idle surplus SAR 85M traced to AO-2207 (Real-Estate Dev.)", ar: "فائض خامل 85 مليون يُعزى إلى AO-2207", zh: "闲置结余 SAR 85M 追溯至 AO-2207(房地产基金)" }, dot: "violet" },
  { tm: "10:06", h: { en: "Orchestrator", ar: "المنسّق", zh: "编排器" }, d: { en: "Awaiting user follow-up question", ar: "بانتظار سؤال متابعة", zh: "等待用户追问" }, dot: "gray" },
];
const CF_REC = [
  { t: { en: "Release SAR 85M idle surplus (AO-2207)", ar: "الإفراج عن فائض خامل 85 مليون (AO-2207)", zh: "释放 SAR 85M 闲置结余(AO-2207)" }, d: { en: "120 days with no disbursement and the milestone delivered. Releasing returns liquidity to the Real-Estate Dev. Fund and clears the open UC-03 audit flag on the order.", ar: "120 يوماً بلا صرف والمرحلة منجزة؛ الإفراج يعيد السيولة ويغلق ملاحظة التدقيق.", zh: "120 天无支付且里程碑已交付。释放将流动性返还房地产开发基金,并清除该单 UC-03 审计标记。" } },
  { t: { en: "Chase completion certificates — 9 aged orders (> 90d)", ar: "متابعة شهادات إنجاز لـ 9 أوامر (> 90 يوماً)", zh: "催办 9 个逾期(>90天)派工单完工证明" }, d: { en: "Missing certificates block final payment and capitalization. Closing them out unblocks ~SAR 60M in pending closeouts and prevents a quarter-end backlog.", ar: "غياب الشهادات يعيق الدفع والرسملة؛ إغلاقها يفكّ نحو 60 مليون معلّقة.", zh: "缺证阻塞尾款与资本化。结清释放约 SAR 60M 待结算项,避免季末积压。" } },
  { t: { en: "Resolve the 2% SAP↔Etimad mismatch (SAR 25M)", ar: "حل عدم تطابق ساب↔اعتماد 2% (25 مليون)", zh: "解决 2% SAP↔Etimad 差异(SAR 25M)" }, d: { en: "Two reconciliation items — Esnad assignment (+SAR 15M) and Tahseel revenue (−SAR 12M). Proposed adjusting entries align book-to-system within tolerance before close.", ar: "بندان — إسناد (+15) وتحصيل (−12)؛ القيود المقترحة توائم الدفتري مع النظام قبل الإقفال.", zh: "两项差异——Esnad 派工(+SAR 15M)与 Tahseel 收入(−SAR 12M)。建议调整分录关账前于容差内对齐。" } },
];
function CostFundsConsole() {
  const { tr, setRoute, pushLog, setDeptSub, setAlertsOpen, backRoute, setBackRoute } = useStore();
  const [mode, setMode] = useState("ao");
  const [qaOpen, setQaOpen] = useState(false);
  const [feed, setFeed] = useState(CF_LOGS);
  const logRef = useRef(null);
  useEffect(() => {
    let n = 0;
    const id = setInterval(() => { n++; const base = CF_LOGS[n % CF_LOGS.length]; const tm = "10:" + String((6 + n) % 60).padStart(2, "0"); setFeed(f => [...f.slice(-7), { ...base, tm }]); }, 2300);
    return () => clearInterval(id);
  }, []);
  useEffect(() => { const el = logRef.current; if (el) el.scrollTop = el.scrollHeight; }, [feed]);
  const UP = { en: "UPSTREAM", ar: "منبع", zh: "上游" }, PARA = { en: "PARALLEL", ar: "متوازٍ", zh: "并行" }, DOWN = { en: "DOWNSTREAM", ar: "المصب", zh: "下游" }, THISP = { en: "THIS", ar: "هذه", zh: "本环节" };
  const CF_CHAIN = [
    { code: "UC-01", pos: UP, name: { en: "Data Consolidation & Quality", ar: "توحيد البيانات وجودتها", zh: "数据整合与质量" } },
    { code: "UC-13", pos: UP, name: { en: "Revenue, Collections & Exclusions", ar: "الإيرادات والتحصيل والاستبعادات", zh: "收入、征收与排除项" } },
    { code: "UC-06 / UC-02", pos: UP, name: { en: "Performance / Anomaly", ar: "الأداء / الانحرافات", zh: "绩效 / 异常" } },
    { code: "UC-14", pos: UP, name: { en: "Assets & Capitalization", ar: "الأصول والرسملة", zh: "资产与资本化" } },
    { code: "UC-12", here: true, pos: THISP, name: { en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" } },
    { code: "UC-11", pos: PARA, name: { en: "Compliance & Memos", ar: "الامتثال والمذكرات", zh: "合规与备忘" } },
    { code: "UC-10 / UC-03", pos: DOWN, name: { en: "Reporting / Smart Query", ar: "التقارير / الاستعلام", zh: "报告 / 智能查询" } },
  ];
  const CF_SOURCES = [
    { n: "Esnad", s: "loading" }, { n: "Etimad", s: "synced" }, { n: "SAP", s: "synced" }, { n: "Invoices", s: "synced" }, { n: "Completion Certificates", s: "synced" },
    { n: "Liquidity Requests", s: "synced" }, { n: "Payment Orders", s: "synced" }, { n: "Bank Statements", s: "synced" }, { n: "Dev. Fund Agreements", s: "synced" },
  ];
  const CF_ROLES = [
    { n: { en: "Data Querying Agent", ar: "وكيل استعلام البيانات", zh: "数据查询智能体" }, s: { en: "Matches cash requests ↔ payment orders ↔ invoices across Esnad, Etimad, SAP", ar: "يطابق الطلبات النقدية ↔ أوامر الدفع ↔ الفواتير", zh: "跨 Esnad/Etimad/SAP 匹配 现金申请↔付款单↔发票" }, st: "running" },
    { n: { en: "Financial Reports Generation Agent", ar: "وكيل توليد التقارير المالية", zh: "财务报告生成智能体" }, s: { en: "Calculates unit/land cost & consideration; builds fund reports with aging", ar: "يحسب تكلفة الوحدة والمقابل؛ ويبني تقارير الصناديق", zh: "计算单元/地块成本与对价;生成基金 Aging 报告" }, st: "active" },
    { n: { en: "Anomaly Detection Agent", ar: "وكيل كشف الشذوذ", zh: "异常检测智能体" }, s: { en: "Flags SAP↔document discrepancies, missing certs & dormant surplus", ar: "يرصد فروق ساب↔المستندات والشهادات المفقودة والفائض الخامل", zh: "标记 SAP↔单据差异、缺证与闲置结余" }, st: "active" },
  ];
  const MODES = [
    { k: "ao", t: { en: "Assignment Orders", ar: "أوامر الإسناد", zh: "派工单" } },
    { k: "unit", t: { en: "Unit Cost", ar: "تكلفة الوحدة", zh: "单元成本" } },
    { k: "ind", t: { en: "Industrial Fund", ar: "الصندوق الصناعي", zh: "工业基金" } },
    { k: "ref", t: { en: "Real Estate Fund", ar: "صندوق العقار", zh: "房地产基金" } },
  ];
  const rbadge = (st) => st === "running" ? <span className="wb-badge run">{tr({ en: "running", ar: "يعمل", zh: "运行中" })}</span> : <span className="wb-badge act">{tr({ en: "active", ar: "نشط", zh: "活动" })}</span>;
  const cst = (k) => ({ ok: { en: "matched", ar: "مطابق", zh: "已匹配" }, ver: { en: "verified", ar: "مُتحقق", zh: "已核验" }, blk: { en: "blocked · no cert", ar: "محظور · لا شهادة", zh: "阻断 · 缺证" }, nc: { en: "non-compliant · Δ amount", ar: "غير مطابق · فرق مبلغ", zh: "不合规 · 金额差" } }[k]);
  return (<div className="fade wb">
    <div className="card pad wb-frame">
    {/* HEADER */}
    <div className={backRoute ? "card pad wb-head" : "wb-head"}>
      <div><div className="dw-eyebrow g" style={{ marginBottom: 4 }}>{tr({ en: "Department Workspace · operating", ar: "مساحة عمل الإدارة · تشغيلي", zh: "部门工作区 · 运营" })}</div><div className="wb-title" style={{ fontSize: 21 }}>{backRoute && <button className="pg-back" onClick={() => { const b = backRoute; setBackRoute(null); setDeptSub("assets"); setRoute(b); }}>‹</button>}<span className="wb-dot violet" /> {tr({ en: "Cost Management Department", ar: "إدارة التكاليف", zh: "成本管理部" })} · {tr({ en: "Costs & Funds Console", ar: "وحدة التكاليف والصناديق", zh: "成本与资金控制台" })}<button className="al-bell" onClick={() => setAlertsOpen(true)} title={ucl("UC-02", tr({ en: "Alerts & Exceptions Center", ar: "مركز التنبيهات", zh: "告警与异常中心" }))}>🔔 <span>1</span></button></div>
        <div className="wb-subt">{ucl("UC-12", tr({ en: "Costs, Assignment Orders & Funds", ar: "التكاليف وأوامر الإسناد والصناديق", zh: "成本、派工单与资金" }))} · {tr({ en: "Operating type — matching & calculation + cross-dept hand-off", ar: "نوع تشغيلي — مطابقة واحتساب + تسليم بين الإدارات", zh: "运营生产型 — 匹配核算 + 跨部门交付" })}</div></div>
      <SmartQueryFab scope={{ en: "Scope: Cost & Funds · read-only", ar: "النطاق: التكاليف · للقراءة", zh: "范围:成本与资金 · 只读" }} prompts={[{ en: "Why is AO-2207 surplus idle?", ar: "لماذا فائض AO-2207 خامل؟", zh: "AO-2207 结余为何闲置?" }, { en: "Which AOs lack completion certificates?", ar: "ما الأوامر بلا شهادات إنجاز؟", zh: "哪些派工单缺完工证明?" }, { en: "Resolve the SAP ↔ Etimad difference", ar: "تسوية فرق ساب↔اعتماد", zh: "对平 SAP↔Etimad 差异" }]} />
      <div className="wb-chain"><span className="wb-clab">{tr({ en: "G-06 CHAIN", ar: "سلسلة ج-06", zh: "G-06 链路" })}</span>{CF_CHAIN.map((c, i) => (<React.Fragment key={i}>{i > 0 && <span className="wb-carr">→</span>}<span className={"wb-cpill" + (c.here ? " here" : "")}>{c.pos && <span className="wb-cpos">{tr(c.pos)}</span>}{SHOW_UC ? c.code + " · " : ""}{tr(c.name)}</span></React.Fragment>))}</div>
    </div>
    {/* INSIGHT & NEXT ACTIONS */}
    <div className="wb-actbar">
      <div className="wb-ab-top">
        <div className="wb-ab-spark">✦</div>
        <div className="wb-ab-tt">
          <div><span className="wb-ab-lab">{tr({ en: "AI INSIGHT & NEXT ACTIONS", ar: "رؤى الذكاء الاصطناعي والإجراءات", zh: "AI 洞察与后续行动" })}</span><span className="wb-ab-meta">{SHOW_UC ? "UC-12 · " : ""}run #3402 · {tr({ en: "Costs & Funds agent", ar: "وكيل التكاليف والصناديق", zh: "成本与资金智能体" })}</span></div>
          <div className="wb-ab-insight"><Hi t={tr({ en: "A ~~SAR 85M idle surplus~~ traces to **AO-2207** (Real-Estate Dev. Fund) — **120 days** without disbursement despite a delivered milestone, eligible for release. SAP↔Etimad matching is **98%**, leaving a ~~SAR 25M (2%) reconciliation gap~~ over 2 items (Esnad +15M · Tahseel −12M). **9 assignment orders > 90 days** still lack completion certificates, blocking **~SAR 60M** in closeouts.", ar: "~~فائض خامل 85 مليون~~ يُعزى إلى **AO-2207** — **120 يوماً** بلا صرف رغم إنجاز المرحلة. مطابقة ساب↔اعتماد **98%**، وتبقى ~~فجوة تسوية 25 مليون (2%)~~ عبر بندين (إسناد +15 · تحصيل −12). **9 أوامر إسناد > 90 يوماً** بلا شهادات إنجاز، ما يعيق **~60 مليون**.", zh: "~~SAR 85M 闲置结余~~ 追溯至 **AO-2207**(房地产开发基金)——**120 天** 无支付但里程碑已交付,可释放。SAP↔Etimad 对账率 **98%**,尚余 ~~SAR 25M(2%)对账差异~~,涉 2 项(Esnad +15M · Tahseel −12M)。**9 个派工单逾期 >90 天** 仍缺完工证明,阻塞 **约 SAR 60M** 结算。" })} /></div>
        </div>
      </div>
      <div className="wb-ab-rows">
        <div className="wb-ab-col">
          <div className="wb-ab-h">⚐ {tr({ en: "RECOMMENDED · prompts", ar: "موصى به · مقترحات", zh: "建议 · 提示(点击应用)" })}</div>
          <div className="wb-sugs">{CF_REC.map((n, i) => (<button className="wb-sug" key={i} onClick={() => { pushLog({ en: "Applied recommendation — " + tr(n.t), ar: "تطبيق توصية — " + tr(n.t), zh: "已应用建议 — " + tr(n.t) }); setQaOpen(true); }}><span className="pr">{i + 1}</span><span className="wb-sug-tx"><b>{tr(n.t)}</b><i>{tr(n.d)}</i></span></button>))}</div>
        </div>
        <div className="wb-ab-col r">
          <div className="wb-ab-h">➜ {tr({ en: "HAND OFF DOWNSTREAM · actions", ar: "تسليم لاحق · إجراءات", zh: "下游交接 · 动作" })}</div>
          <div className="wb-ctas">
            <button className="wb-cta p" onClick={() => { setBackRoute("csfunds"); setRoute("reports"); }}>{SHOW_UC && <span className="uc">UC-10</span>}{tr({ en: "Open Fund & Cost Report", ar: "فتح تقرير التكاليف والصناديق", zh: "打开成本与资金报告" })}<span className="ar">→</span></button>
            <button className="wb-cta s" onClick={() => { setBackRoute("csfunds"); setRoute("compmemo"); }}>{SHOW_UC && <span className="uc">UC-11</span>}{tr({ en: "Raise Compliance / Accounting Memo", ar: "إصدار مذكرة امتثال / محاسبية", zh: "发起合规 / 会计备忘" })}<span className="ar">→</span></button>
          </div>
        </div>
      </div>
    </div>
    {/* RANGE SELECTION + Type of analysis */}
    <div className="cs-range">
      <span className="cs-talab">{tr({ en: "SCOPE", ar: "النطاق", zh: "作用域" })}</span>
      <div className="wb-field" title="Assignment / Initiative / Fund / Project"><div className="fl">{tr({ en: "Object type", ar: "نوع الكائن", zh: "对象类型" })}</div><div className="fv">{tr({ en: "Assignment", ar: "أمر إسناد", zh: "派工单" })} ▾</div></div>
      <div className="wb-field"><div className="fl">{tr({ en: "Value", ar: "القيمة", zh: "取值" })}</div><div className="fv">🔍 AO-2207 ▾</div></div>
      <span className="cs-rdiv" />
      <span className="cs-talab">{tr({ en: "TYPE OF ANALYSIS", ar: "نوع التحليل", zh: "分析类型" })}</span>
      <div className="cs-seg">{MODES.map(m => <button key={m.k} className={mode === m.k ? "on" : ""} onClick={() => setMode(m.k)}>{tr(m.t)}</button>)}</div>
      <span className="cs-rdiv" />
      <div className="wb-field"><div className="fl">{tr({ en: "Period", ar: "الفترة", zh: "期间" })}</div><div className="fv">FY 2026 · Q1 ▾</div></div>
    </div>
    <div className="cs-hint">{tr({ en: "Scope object = Assignment · Initiative · Fund · Project (what to analyze); Type of analysis = which view to render.", ar: "كائن النطاق = أمر إسناد · مبادرة · صندوق · مشروع؛ نوع التحليل = العرض المطلوب.", zh: "作用域对象 = 派工单 · 倡议 · 基金 · 项目(选对象);分析类型 = 渲染哪种视图。" })}</div>

    {/* ===== MODE: ASSIGNMENT ORDERS ===== */}
    {mode === "ao" && <React.Fragment>
      <div className="cs-banner"><span className="ic">!</span><div><b>{tr({ en: "Financial approval blocked.", ar: "تم منع الاعتماد المالي.", zh: "财务审批已阻断。" })}</b> {tr({ en: "1 invoice without completion certificate — INV-3410 (SAR 17M).", ar: "فاتورة بلا شهادة إنجاز — INV-3410 (17 مليون).", zh: "1 张发票缺完工证明 — INV-3410(SAR 17M)。" })}</div></div>
      <div className="wb-sech"><h2>{tr({ en: "Matching & Calculation", ar: "المطابقة والاحتساب", zh: "匹配与核算" })}</h2><div className="muted">{tr({ en: "assignment-order value · 3-way match · consideration", ar: "قيمة أمر الإسناد · مطابقة ثلاثية · المقابل", zh: "派工单价值 · 三方匹配 · 对价" })}</div></div>
      <div className="cs-ao">
        <div className="cs-aoh"><span className="cs-aoid">AO-2207</span><span className="cs-tag">{tr({ en: "Real-Estate Dev. Fund", ar: "صندوق العقار", zh: "房地产开发基金" })}</span><span className="cs-tag">Agreement REDF-2024-07</span><span className="cs-warn">{tr({ en: "120 days · no disbursement", ar: "120 يوماً · بلا صرف", zh: "120 天 · 无支付" })}</span></div>
        <div className="cs-aob">
          <div className="cs-mi"><div className="l">{tr({ en: "Original value", ar: "القيمة الأصلية", zh: "原值" })}</div><div className="v"><Money v="SAR 320M" /></div></div>
          <div className="cs-mi"><div className="l">{tr({ en: "Modified value", ar: "القيمة المعدّلة", zh: "修改值" })}</div><div className="v"><Money v="SAR 320M" /></div></div>
          <div className="cs-mi"><div className="l">{tr({ en: "Spent", ar: "المصروف", zh: "已花" })}</div><div className="v"><Money v="SAR 235M" /> <span style={{ fontSize: 11, color: "var(--muted)" }}>(73%)</span></div></div>
          <div className="cs-mi"><div className="l">{tr({ en: "Idle surplus", ar: "فائض خامل", zh: "闲置结余" })}</div><div className="v hot"><Money v="SAR 85M" /></div></div>
        </div>
      </div>
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "3-way Match · Cash Request ↔ Payment Order ↔ Invoice", ar: "مطابقة ثلاثية · طلب نقدي ↔ أمر دفع ↔ فاتورة", zh: "三方匹配 · 现金申请 ↔ 付款单 ↔ 发票" })}</b><span className="wb-pm">{tr({ en: "cert verified per invoice", ar: "شهادة لكل فاتورة", zh: "每张发票需完工证明" })}</span></div>
        <div className="wb-pb"><table className="wb-table"><thead><tr><th>{tr({ en: "CASH REQ.", ar: "طلب نقدي", zh: "现金申请" })}</th><th></th><th>{tr({ en: "PAYMENT ORDER", ar: "أمر الدفع", zh: "付款单" })}</th><th></th><th>{tr({ en: "INVOICE", ar: "الفاتورة", zh: "发票" })}</th><th>{tr({ en: "CERT.", ar: "شهادة", zh: "证明" })}</th><th>{tr({ en: "AMOUNT", ar: "المبلغ", zh: "金额" })}</th><th>{tr({ en: "STATUS", ar: "الحالة", zh: "状态" })}</th></tr></thead>
          <tbody>
            <tr><td className="mono">CR-5521</td><td className="cs-arrl">↔</td><td className="mono">PO-8841</td><td className="cs-arrl">↔</td><td className="mono">INV-3401</td><td className="mono">CC-1190</td><td><Money v="SAR 60M" /></td><td><span className="cs-st ok">{tr(cst("ok"))}</span></td></tr>
            <tr><td className="mono">CR-5522</td><td className="cs-arrl">↔</td><td className="mono">PO-8847</td><td className="cs-arrl">↔</td><td className="mono">INV-3402</td><td className="mono">CC-1191</td><td><Money v="SAR 32M" /></td><td><span className="cs-st ok">{tr(cst("ok"))}</span></td></tr>
            <tr><td className="mono">CR-5530</td><td className="cs-arrl">↔</td><td className="mono" style={{ color: "#b7791f" }}>{tr({ en: "PO pending", ar: "أمر معلّق", zh: "付款单待定" })}</td><td className="cs-arrl">↔</td><td className="mono">INV-3410</td><td className="mono" style={{ color: "var(--danger)", fontWeight: 700 }}>✗</td><td><Money v="SAR 17M" /></td><td><span className="cs-st bad">{tr(cst("blk"))}</span></td></tr>
            <tr><td className="mono">CR-5533</td><td className="cs-arrl">↔</td><td className="mono">PO-8860</td><td className="cs-arrl">↔</td><td className="mono">INV-3415</td><td className="mono">CC-1205</td><td><Money v="SAR 12M" /></td><td><span className="cs-st bad">{tr(cst("nc"))}</span></td></tr>
          </tbody></table>
          <div className="wb-tfoot"><span>{tr({ en: "Cash request matched to its payment order and invoice in one row; cert column blocks approval when missing.", ar: "كل طلب مطابق لأمر دفعه وفاتورته في صف واحد؛ عمود الشهادة يمنع الاعتماد عند غيابها.", zh: "每行同时对上付款单与发票;缺完工证明则在证明列阻断审批。" })}</span></div>
        </div></div>
      <div className="cs-calc"><div><div className="cl">{tr({ en: "Financial Consideration", ar: "المقابل المالي", zh: "财务对价" })}</div><div className="cs2">{tr({ en: "By order classification & agreement REDF-2024-07 · not a flat % (BR-01)", ar: "حسب التصنيف والاتفاقية · ليس نسبة ثابتة (BR-01)", zh: "按分类与协议 REDF-2024-07 计算 · 非固定百分比(BR-01)" })}</div></div><div className="cv"><Money v="SAR 312M" /></div></div>
    </React.Fragment>}

    {/* ===== MODE: UNIT COST ===== */}
    {mode === "unit" && <React.Fragment>
      <div className="wb-sech"><h2>{tr({ en: "Unit / Land Cost — distribution", ar: "تكلفة الوحدة / الأرض — التوزيع", zh: "单元 / 地块成本 — 分摊" })}</h2><div className="muted">{tr({ en: "project cost distributed by area / number of units", ar: "توزيع تكلفة المشروع حسب المساحة / عدد الوحدات", zh: "项目成本按面积 / 套数分摊" })}</div></div>
      <div className="cs-check">{tr({ en: "Project cost", ar: "تكلفة المشروع", zh: "项目成本" })} <b><Money v="SAR 2.40B" /></b> <span className="eq">= Σ {tr({ en: "unit/land cost", ar: "تكلفة الوحدة/الأرض", zh: "单元/地块成本" })}</span> <b><Money v="SAR 2.14B" /></b> <span className="eq">+ {tr({ en: "unallocated", ar: "غير موزّع", zh: "未分摊" })}</span> <b><Money v="SAR 0.26B" /></b><span className="bdg">Δ SAR 0.26B · {tr({ en: "review (BR-03)", ar: "مراجعة (BR-03)", zh: "复核(BR-03)" })}</span></div>
      <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Cost distribution", ar: "توزيع التكلفة", zh: "成本分摊" })}</b><span className="wb-pm">{tr({ en: "project: Housing Cluster R-12", ar: "مشروع: مجمّع R-12", zh: "项目:Housing Cluster R-12" })}</span></div>
        <div className="wb-pb"><table className="wb-table"><thead><tr><th>{tr({ en: "COMPONENT", ar: "المكوّن", zh: "组成" })}</th><th>{tr({ en: "UNITS / AREA", ar: "وحدات / مساحة", zh: "套数 / 面积" })}</th><th>{tr({ en: "COST", ar: "التكلفة", zh: "成本" })}</th><th>{tr({ en: "PER UNIT", ar: "لكل وحدة", zh: "每单元" })}</th></tr></thead>
          <tbody>
            <tr><td>Plot A</td><td>320 units</td><td><Money v="SAR 0.78B" /></td><td><Money v="SAR 2.44M" /></td></tr>
            <tr><td>Plot B</td><td>260 units</td><td><Money v="SAR 0.61B" /></td><td><Money v="SAR 2.35M" /></td></tr>
            <tr><td>{tr({ en: "Shared infrastructure", ar: "بنية تحتية مشتركة", zh: "共用基础设施" })}</td><td>{tr({ en: "allocated", ar: "موزّع", zh: "已分摊" })}</td><td><Money v="SAR 0.45B" /></td><td>—</td></tr>
            <tr><td>{tr({ en: "Land acquisition", ar: "اقتناء الأرض", zh: "土地取得" })}</td><td>{tr({ en: "by area", ar: "حسب المساحة", zh: "按面积" })}</td><td><Money v="SAR 0.30B" /></td><td>—</td></tr>
            <tr><td style={{ color: "var(--danger)" }}>{tr({ en: "Unallocated (review)", ar: "غير موزّع (مراجعة)", zh: "未分摊(复核)" })}</td><td>—</td><td><Money v="SAR 0.26B" /></td><td>—</td></tr>
          </tbody></table></div></div>
    </React.Fragment>}

    {/* ===== MODE: FUND (industrial / real-estate) ===== */}
    {(mode === "ind" || mode === "ref") && (() => {
      const F = mode === "ind"
        ? { name: { en: "Industrial Development Fund", ar: "صندوق التنمية الصناعية", zh: "工业发展基金" }, bal: "SAR 0.54B", com: "SAR 0.40B", avl: "SAR 0.14B", idle: "SAR 0", ag: [["Current", 100, "0.42B"], ["31–60", 34, "0.07B"], ["61–90", 18, "0.03B"], ["90+", 12, "0.02B"]], match: "99%", diff: 1 }
        : { name: { en: "Real-Estate Development Fund", ar: "صندوق التطوير العقاري", zh: "房地产开发基金" }, bal: "SAR 0.92B", com: "SAR 0.64B", avl: "SAR 0.28B", idle: "SAR 85M", ag: [["Current", 100, "0.50B"], ["31–60", 42, "0.11B"], ["61–90", 30, "0.08B"], ["90+", 20, "0.05B"]], match: "98%", diff: 2 };
      return (<React.Fragment>
        <div className="wb-sech"><h2>{tr(F.name)}</h2><div className="muted">{tr({ en: "balance · aging & repayment · reconciliation", ar: "الرصيد · التقادم والسداد · المطابقة", zh: "余额 · 账龄与还款 · 对账" })}</div></div>
        <div className="cs-fcards">
          <div className="cs-fc"><div className="l">{tr({ en: "Balance", ar: "الرصيد", zh: "余额" })}</div><div className="v"><Money v={F.bal} /></div></div>
          <div className="cs-fc"><div className="l">{tr({ en: "Committed", ar: "ملتزم", zh: "已承诺" })}</div><div className="v"><Money v={F.com} /></div></div>
          <div className="cs-fc"><div className="l">{tr({ en: "Available", ar: "متاح", zh: "可用" })}</div><div className="v"><Money v={F.avl} /></div></div>
          <div className="cs-fc"><div className="l">{tr({ en: "Idle surplus", ar: "فائض خامل", zh: "闲置结余" })}</div><div className={"v" + (F.idle !== "SAR 0" ? " hot" : "")}><Money v={F.idle} /></div></div>
        </div>
        <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Aging Report — loans / repayment", ar: "تقرير التقادم — القروض / السداد", zh: "Aging 报告 — 贷款 / 还款" })}</b></div>
          <div className="wb-pb">
            <div className="km-aging">{F.ag.map((b, i) => (<div className="ab" key={i}><div className="abar" style={{ background: "#ece7f5" }}><i style={{ width: b[1] + "%", background: i === 3 ? "#dc2626" : "#7c3aed" }} /></div><div className="at">{b[0]}</div><div className="av"><Money v={"SAR " + b[2]} /></div></div>))}</div>
            <div className="cs-recon"><span className="cs-st ok">{F.match} {tr({ en: "matched", ar: "مطابق", zh: "已对平" })}</span> Bank ↔ SAP ↔ docs · <span style={{ color: "#b7791f", fontWeight: 700 }}>{F.diff} {tr({ en: "difference(s) to review (BR-04)", ar: "فروق للمراجعة (BR-04)", zh: "项差异待复核(BR-04)" })}</span></div>
          </div></div>
      </React.Fragment>);
    })()}

    {/* ===== CROSS-CUTTING ===== */}
    <div className="wb-panel"><div className="wb-ph plain"><b>{tr({ en: "Surpluses · source → destination", ar: "الفوائض · المصدر → الوجهة", zh: "结余 · 来源 → 去向" })}</b><span className="wb-pm">{tr({ en: "traceable (BR-02)", ar: "قابل للتتبع (BR-02)", zh: "可追溯(BR-02)" })}</span></div>
      <div className="wb-pb">
        <div className="cs-drill"><span className="cs-node">AO-2207 · {tr({ en: "Real-Estate Dev.", ar: "العقار", zh: "房地产" })}</span><span className="cs-arrl">→</span><span className="cs-node">{tr({ en: "Central Liquidity Pool", ar: "مجمع السيولة المركزي", zh: "中央流动性池" })}</span><span style={{ marginInlineStart: "auto", fontWeight: 800, color: "var(--danger)" }}><Money v="SAR 85M" /> {tr({ en: "idle", ar: "خامل", zh: "闲置" })}</span></div>
        <div className="wb-kk"><span>{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</span><b>{tr({ en: "120 days no activity · milestone delivered", ar: "120 يوماً بلا حركة · أُنجزت المرحلة", zh: "120 天无活动 · 里程碑已交付" })}</b></div>
        <div className="wb-kk"><span>{tr({ en: "Recommendation", ar: "التوصية", zh: "建议" })}</span><b style={{ color: "var(--violet, #6d28d9)" }}>{tr({ en: "Use surplus before requesting new liquidity", ar: "استخدم الفائض قبل طلب سيولة جديدة", zh: "先用结余再申请新流动性" })}</b></div>
      </div></div>

    <div className="cs-approve">
      <button className="btn" disabled>✓ {tr({ en: "Approve assignment order", ar: "اعتماد أمر الإسناد", zh: "批准派工单" })}</button>
      <button className="btn secondary" onClick={() => pushLog({ en: "Surplus reuse recommended", ar: "تمت التوصية بإعادة استخدام الفائض", zh: "已建议复用结余" })}>{tr({ en: "Recommend use of surplus", ar: "التوصية باستخدام الفائض", zh: "建议复用结余" })}</button>
      <button className="btn ghost sm" onClick={() => pushLog({ en: "Flagged for review", ar: "وُسم للمراجعة", zh: "已标记复核" })}>⚑ {tr({ en: "Flag for review", ar: "وسم للمراجعة", zh: "标记复核" })}</button>
      <span className="cs-apnote">{tr({ en: "Approval disabled — 1 invoice missing completion certificate & 1 non-compliant cash request.", ar: "الاعتماد معطّل — فاتورة بلا شهادة وطلب غير مطابق.", zh: "审批禁用 — 1 张发票缺完工证明、1 笔现金申请不合规。" })}</span>
    </div>

    {/* MULTI-AGENT WORKSPACE */}
    <div className="wb-sech"><h2>{tr({ en: "Multi-Agent Workspace", ar: "مساحة عمل متعددة الوكلاء", zh: "多智能体工作区" })}</h2><div className="muted">{tr({ en: "Orchestrated agent roles & live action timeline", ar: "أدوار وكلاء منسّقة وخط زمني حي", zh: "编排的智能体角色与实时操作时间线" })}</div></div>
    <div className="wb-cols3 wb-work">
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot violet" /> <b>{tr({ en: "Data Inputs · sources", ar: "مدخلات البيانات · المصادر", zh: "数据输入 · 源系统" })}</b><span className="wb-pm">{tr({ en: "9 systems", ar: "9 أنظمة", zh: "9 个系统" })}</span><button className="wb-impbtn" onClick={() => pushLog({ en: "Manual Excel / CSV / PDF import — temporary source (BR-04)", ar: "استيراد يدوي — مصدر مؤقت (BR-04)", zh: "手动导入 Excel/CSV/PDF — 临时来源(BR-04)" })} title={tr({ en: "Upload Excel/CSV/PDF when an API is unavailable", ar: "رفع ملف عند عدم توفّر الواجهة", zh: "接口不可用时上传文件(临时来源)" })}>⬆ {tr({ en: "Import Excel/CSV", ar: "استيراد Excel/CSV", zh: "导入 Excel/CSV" })}</button></div>
        <div className="wb-pb"><div className="wb-srclist">{CF_SOURCES.map((s, i) => (<div className="wb-src" key={i}><span className={"sd" + (s.s === "loading" ? " load" : "")} /><span className="sn">{s.n}</span><span className="ss">{tr(s.s === "loading" ? { en: "loading", ar: "تحميل", zh: "载入" } : { en: "synced", ar: "متزامن", zh: "已同步" })}</span></div>))}</div></div></div>
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot violet" /> <b>{tr({ en: "Orchestrator · Task Board", ar: "المنسّق · لوحة المهام", zh: "编排器 · 任务板" })}</b><span className="wb-orchpill"><span className="gear">⚙</span>{tr({ en: "Auto-orchestration · 3 agents", ar: "تنسيق تلقائي · 3 وكلاء", zh: "自动编排 · 3 个智能体" })}</span></div>
        <div className="wb-pb">{CF_ROLES.map((r, i) => (<div className={"wb-role " + (r.st === "running" ? "r-violet" : "r-blue")} key={i}><div className="rl"><div className="rt">{tr(r.n)}</div><div className="rs">{tr(r.s)}</div></div>{rbadge(r.st)}</div>))}</div></div>
      <div className="wb-panel"><div className="wb-ph"><span className="wb-dot violet" /> <b>{tr({ en: "Agent Timeline · Logs", ar: "خط زمن الوكلاء · السجلات", zh: "智能体时间线 · 日志" })}</b><span className="wb-pm">{tr({ en: "last 5 min", ar: "آخر 5 د", zh: "最近 5 分钟" })}</span></div>
        <div className="wb-pb"><div className="wb-tl" ref={logRef}>{feed.map((e, i) => (<div className={"wb-ev" + (i === feed.length - 1 ? " live" : "")} key={i}><span className={"wb-dot2 " + e.dot} /><div className="wb-eh"><b>{e.tm}</b> · {e.code ? ucl(e.code, tr(e.h)) : tr(e.h)}</div><div className="wb-ed">{tr(e.d)}</div></div>))}</div></div></div>
    </div>

    {/* KEY PRINCIPLE */}
    <div className="wb-keyp"><div className="wb-keyp-tag">!</div><div><div className="wb-keyp-h">{tr({ en: "Surplus traced from the original assignment order to the beneficiary project", ar: "الفائض يُتتبع من أمر الإسناد الأصلي إلى المشروع المستفيد", zh: "结余须从原派工单追溯到受益项目" })}</div><div className="wb-keyp-s">{tr({ en: "Project cost = Σ unit/land cost after adjustments; fund reports reconcile to bank statements, SAP & supporting documents (BR-02 / BR-03 / BR-04).", ar: "تكلفة المشروع = مجموع تكاليف الوحدات بعد التعديلات؛ وتقارير الصناديق تطابق كشوف البنوك وساب والمستندات.", zh: "项目成本 = 调整后各单元/地块成本之和;基金报告须与银行流水、SAP 及单据对账(BR-02 / BR-03 / BR-04)。" })}</div></div></div>

    </div>
  </div>);
}

/* ======= UC-11 · Compliance, Policies & Accounting Memos — Accounting Ruling ======= */
function ComplianceRuling() {
  const { tr, setRoute, pushLog, setDeptSub, backRoute, setBackRoute, setAlertsOpen } = useStore();
  const [caseType, setCaseType] = useState("memo");
  const [pick, setPick] = useState(null);
  const [approved, setApproved] = useState(false);
  const switchCase = (c) => { if (c === caseType) return; setCaseType(c); setPick(null); setApproved(false); };
  const decided = pick !== null;
  const UP = { en: "UPSTREAM", ar: "منبع", zh: "上游" }, PARA = { en: "PARALLEL", ar: "متوازٍ", zh: "并行" }, DOWN = { en: "DOWNSTREAM", ar: "المصب", zh: "下游" }, THISP = { en: "THIS", ar: "هذه", zh: "本环节" };
  const CHAIN = [
    { code: "UC-01", pos: UP, name: { en: "Data Consolidation & Quality", ar: "توحيد البيانات", zh: "数据整合与质量" } },
    { code: "UC-13", pos: UP, name: { en: "Revenue, Collections & Exclusions", ar: "الإيرادات والتحصيل", zh: "收入、征收与排除项" } },
    { code: "UC-06 / UC-02", pos: UP, name: { en: "Performance / Anomaly", ar: "الأداء / الانحرافات", zh: "绩效 / 异常" } },
    { code: "UC-14", pos: UP, name: { en: "Assets & Capitalization", ar: "الأصول والرسملة", zh: "资产与资本化" } },
    { code: "UC-12", pos: PARA, name: { en: "Costs, Orders & Funds", ar: "التكاليف والصناديق", zh: "成本与资金" } },
    { code: "UC-11", here: true, pos: THISP, name: { en: "Compliance, Policies & Memos", ar: "الامتثال والمذكرات", zh: "合规与会计备忘" } },
    { code: "UC-10 / UC-03", pos: DOWN, name: { en: "Reporting / Smart Query", ar: "التقارير / الاستعلام", zh: "报告 / 智能查询" } },
  ];
  const vText = approved ? { en: "Approved", ar: "معتمد", zh: "已批准" } : decided ? { en: "Ready to approve", ar: "جاهز للاعتماد", zh: "可批准" } : { en: "Needs your call", ar: "بانتظار قرارك", zh: "待你决策" };
  const approve = () => { if (!decided || approved) return; setApproved(true); pushLog({ en: "Accounting memo approved by specialist (UC-11)", ar: "اعتُمدت المذكرة المحاسبية (UC-11)", zh: "会计备忘已由专家批准(UC-11)" }); };
  const opt = (i, sel, rec, title, desc) => (
    <div className={"cr-opt" + (sel ? " sel" : "")} onClick={() => setPick(i)}>{rec && <span className="rec">{tr({ en: "AI suggests", ar: "اقتراح AI", zh: "AI 推荐" })}</span>}
      <div className="ot"><span className="rb" /> {tr(title)}</div><div className="od">{tr(desc)}</div></div>);
  return (<div className="fade wb ws-page">
    <div className="rp-libhd">
      <div className="rp-libL">
      <div className="rp-libtitle">{backRoute && <button className="rp-backbtn" title={tr({ en: "Back", ar: "رجوع", zh: "返回" })} onClick={() => { const b = backRoute; setBackRoute(null); setDeptSub("assets"); setRoute(b); }}>‹</button>}<div><div className="dw-eyebrow g" style={{ marginBottom: 2 }}>{tr({ en: "Department Workspace · ruling", ar: "مساحة عمل الإدارة · تحكيم", zh: "部门工作区 · 裁决" })}</div><h1 className="rp-h1">{tr({ en: "Accounting Ruling", ar: "قرار محاسبي", zh: "会计裁定" })}{SHOW_UC ? " · UC-11" : ""}</h1></div></div>
      <div className="sub muted" style={{ fontSize: 12.5, marginTop: 3 }}>{tr({ en: "Mandate: compliance, policies & accounting memos (UC-11). Workspace — oversight/ruling type: receives upstream cases, rules with cited basis, human sign-off.", ar: "المهمة: الامتثال والسياسات والمذكرات المحاسبية (UC-11). مساحة العمل — نوع رقابي/تحكيمي.", zh: "职责:合规、政策与会计备忘(UC-11)。Workspace — 监督裁决型:接收上游事项、带依据裁决、人工签核。" })}</div>
      </div>
      <div className="wb-chain rp-headchain"><span className="wb-clab">{tr({ en: "G-06 CHAIN", ar: "سلسلة ج-06", zh: "G-06 链路" })}</span>{CHAIN.map((c, i) => (<span className="wb-cseg" key={i}>{i > 0 && <span className="wb-carr">→</span>}<span className={"wb-cpill" + (c.here ? " here" : "")}>{c.pos && <span className="wb-cpos">{tr(c.pos)}</span>}{SHOW_UC ? c.code + " · " : ""}{tr(c.name)}</span></span>))}</div>
    </div>
    <SmartQueryFab scope={{ en: "Scope: Compliance · standards & policies", ar: "النطاق: الامتثال · المعايير", zh: "范围:合规 · 标准与政策" }} prompts={[{ en: "Which IPSAS clause supports this treatment?", ar: "أي بند IPSAS يدعم هذه المعالجة؟", zh: "哪条 IPSAS 支持此处理?" }, { en: "Resolve the useful-life policy conflict", ar: "حل تعارض سياسة العمر الإنتاجي", zh: "解决使用年限政策冲突" }, { en: "Draft a response to the audit observation", ar: "صياغة رد على ملاحظة التدقيق", zh: "起草审计观察回应" }]} />
    <div className="cr-seg">
      <button className={caseType === "memo" ? "on" : ""} onClick={() => switchCase("memo")}>{tr({ en: "Accounting memo · capitalization", ar: "مذكرة محاسبية · رسملة", zh: "会计备忘 · 资本化" })}</button>
      <button className={caseType === "obs" ? "on" : ""} onClick={() => switchCase("obs")}>{tr({ en: "Response to audit observation", ar: "الرد على ملاحظة تدقيق", zh: "回应审计观察" })}</button>
    </div>

    <div className="cr-hdr">
      <div className="cr-hl">
        <h1>{caseType === "memo" ? tr({ en: "Capitalize completed AUC — SAR 1.92B", ar: "رسملة الأصول المكتملة — 1.92 مليار", zh: "已完工在建资产资本化 — SAR 1.92B" }) : tr({ en: "Audit observation AO-22 — AUC depreciation basis", ar: "ملاحظة تدقيق AO-22 — أساس الإهلاك", zh: "审计观察 AO-22 — 在建资产折旧依据" })}</h1>
        <span className="cr-src">📎 {tr({ en: "Raised from", ar: "وارد من", zh: "来自" })} <b>Assets · UC-14</b> · {tr({ en: "auto-prefilled", ar: "تعبئة تلقائية", zh: "自动预填" })}</span><button className="al-bell" onClick={() => setAlertsOpen(true)} title={ucl("UC-02", tr({ en: "Raise / view alert", ar: "رفع / عرض تنبيه", zh: "上报 / 查看告警" }))}>🔔 {tr({ en: "Raise alert", ar: "رفع تنبيه", zh: "上报告警" })}</button>
      </div>
      <div className="cr-trust">
        <div className="cr-tw"><div className="l">{tr({ en: "Verdict", ar: "القرار", zh: "判定" })}</div><div className={"v cr-verdict" + (approved ? " ok" : "")}><span className="d" /> {tr(vText)}</div></div>
        <div className="cr-tdiv" />
        <div className="cr-tw"><div className="l">{tr({ en: "Confidence", ar: "الثقة", zh: "置信度" })}</div><div className="v"><span className="cr-ring"><i>92%</i></span></div></div>
        <div className="cr-tdiv" />
        <div className="cr-tw"><div className="l">{tr({ en: "Sources locked", ar: "مصادر مثبّتة", zh: "版本锁定" })}</div><div className="v" style={{ fontSize: 11.5 }}>🔒 IPSAS 2024 · v2.3</div></div>
      </div>
    </div>

    <div className="cr-grid">
      <div>
        {caseType === "memo" ? <React.Fragment>
          <div className="cr-hero">
            <div className="cr-cap">✦ {tr({ en: "Recommended treatment", ar: "المعالجة الموصى بها", zh: "建议会计处理" })}</div>
            <div className="cr-lead">{tr({ en: "Reclassify SAR 1.92B from assets-under-construction to in-service fixed assets, and depreciate from the in-service date under the approved capitalization policy.", ar: "إعادة تصنيف 1.92 مليار من الأصول تحت الإنشاء إلى أصول في الخدمة، مع الإهلاك من تاريخ التشغيل وفق السياسة المعتمدة.", zh: "将 SAR 1.92B 从在建资产重分类为在用固定资产,并按核定资本化政策自投入使用日起计提折旧。" })}</div>
            <div className="cr-entry">
              <div className="row"><span className="dc">DR</span><span className="acc">{tr({ en: "Fixed Assets — In service", ar: "أصول ثابتة — في الخدمة", zh: "固定资产 — 在用" })} <span className="muted" style={{ fontWeight: 600 }}>16-1200</span></span><span className="amt">1,920,000,000</span></div>
              <div className="vsep" />
              <div className="row"><span className="dc">CR</span><span className="acc">{tr({ en: "Assets under construction", ar: "أصول تحت الإنشاء", zh: "在建资产" })} <span className="muted" style={{ fontWeight: 600 }}>15-3100</span></span><span className="amt">1,920,000,000</span></div>
              <span className="cr-bal">✓ {tr({ en: "Balanced", ar: "متوازن", zh: "借贷平衡" })}</span>
            </div>
            <div className="cr-why"><div className="wl">{tr({ en: "Why — basis (tap to see the clause)", ar: "الأساس — اضغط لعرض البند", zh: "依据 — 点击查看条款" })}</div>
              <details className="cr-cite"><summary>📘 IPSAS 17 · Property, Plant &amp; Equipment <span className="ver">2024</span><span className="chev">▾</span></summary><div className="snip">{tr({ en: "Capitalize when future economic benefits are probable and cost is measurable; significant parts may be depreciated separately.", ar: "الرسملة عند احتمال المنافع وقابلية قياس التكلفة؛ ويجوز إهلاك الأجزاء الجوهرية منفصلة.", zh: "当未来经济利益很可能流入且成本可计量时予以资本化;重要组成部分可分别折旧。" })}</div></details>
              <details className="cr-cite"><summary>📗 Comprehensive Guide · §Capitalization <span className="ver">v2.3</span><span className="chev">▾</span></summary><div className="snip">{tr({ en: "AUC is reclassified to in-service once the milestone is delivered and cost finalized; depreciation begins from the in-service date.", ar: "يُعاد تصنيف الأصل عند إنجاز المرحلة وإنهاء التكلفة؛ ويبدأ الإهلاك من تاريخ التشغيل.", zh: "里程碑交付且成本确定后在建资产重分类入用;折旧自投入使用日起。" })}</div></details>
              <details className="cr-cite"><summary>📄 MoF Instruction 2023-07 <span className="ver">v1.0</span><span className="chev">▾</span></summary><div className="snip">{tr({ en: "A completion certificate is required before any capitalization posting — attached & verified.", ar: "يلزم شهادة إنجاز قبل أي ترحيل رسملة — مرفقة ومُتحقّقة.", zh: "资本化过账前需完工证明——已附并核验。" })}</div></details>
            </div>
          </div>
          <div className="cr-call">
            <div className="ch"><span className="ic">!</span> {tr({ en: "One judgement needed before this can be approved", ar: "قرار واحد مطلوب قبل الاعتماد", zh: "批准前需要你做一个判断" })}</div>
            <div className="desc">{tr({ en: "Useful-life basis conflicts. IPSAS 17 allows component depreciation; internal policy v2.3 uses a single life. The system will not decide this for you (BR-01).", ar: "تعارض في أساس العمر الإنتاجي. IPSAS 17 يسمح بإهلاك المكوّنات؛ والسياسة v2.3 تستخدم عمراً واحداً. النظام لا يقرر نيابة عنك (BR-01).", zh: "使用年限依据冲突:IPSAS 17 允许组件折旧,内部政策 v2.3 用单一年限。系统不会替你决定(BR-01)。" })}</div>
            <div className="cr-opts">
              {opt(0, pick === 0, true, { en: "Apply IPSAS 17 componentization", ar: "تطبيق إهلاك المكوّنات", zh: "采用 IPSAS 17 组件折旧" }, { en: "Depreciate significant parts separately. Aligns to the standard; updates the schedule.", ar: "إهلاك الأجزاء الجوهرية منفصلة؛ متوافق مع المعيار.", zh: "重要部分分别折旧,符合准则;更新折旧表。" })}
              {opt(1, pick === 1, false, { en: "Keep single useful life (v2.3)", ar: "الإبقاء على عمر واحد (v2.3)", zh: "保留单一使用年限(v2.3)" }, { en: "Simpler & consistent with policy, but needs a policy-update note and justification.", ar: "أبسط ومتسق مع السياسة، لكنه يتطلب مذكرة تحديث وتبريراً.", zh: "更简单且符合现行政策,但需政策更新说明与理由。" })}
            </div>
          </div>
        </React.Fragment> : <React.Fragment>
          <div className="cr-call">
            <div className="ch"><span className="ic">!</span> {tr({ en: "Audit Bureau observations to respond to", ar: "ملاحظات ديوان المراقبة", zh: "需回应的审计署观察" })}</div>
            <div className="desc">{tr({ en: "Two observations on the SAR 1.92B capitalization. Draft an initial response per observation; auto-approval is disabled (BR-01).", ar: "ملاحظتان على الرسملة. صُغ رداً أولياً لكل ملاحظة؛ الاعتماد التلقائي معطّل (BR-01).", zh: "针对 SAR 1.92B 资本化有两条观察。需逐条起草初步回应;自动批准已禁用(BR-01)。" })}</div>
            <div className="cr-obslist">
              <div className="cr-obs"><div className="oh">AO-22 · {tr({ en: "Depreciation basis", ar: "أساس الإهلاك", zh: "折旧依据" })}<span className="sev hi">{tr({ en: "high", ar: "مرتفع", zh: "高" })}</span></div><div className="ob">{tr({ en: "AUC capitalized using a single useful life; IPSAS 17 componentization not applied — justify or correct.", ar: "رُسمل الأصل بعمر واحد دون تطبيق إهلاك المكوّنات — برّر أو صحّح.", zh: "在建资产按单一年限资本化,未应用 IPSAS 17 组件折旧——请说明或更正。" })}</div></div>
              <div className="cr-obs"><div className="oh">AO-23 · {tr({ en: "In-service date", ar: "تاريخ التشغيل", zh: "投入使用日" })}<span className="sev lo">{tr({ en: "low", ar: "منخفض", zh: "低" })}</span></div><div className="ob">{tr({ en: "Depreciation start date for 2 buildings not evidenced by a handover record.", ar: "تاريخ بدء الإهلاك لمبنيين غير موثّق بسجل تسليم.", zh: "2 栋建筑折旧起始日缺交接记录佐证。" })}</div></div>
            </div>
          </div>
          <div className="cr-call v">
            <div className="ch"><span className="ic">✎</span> {tr({ en: "Recommended initial response — AO-22", ar: "الرد الأولي الموصى به — AO-22", zh: "建议初步回应 — AO-22" })}</div>
            <div className="cr-opts">
              {opt(0, pick === 0, true, { en: "Accept & correct", ar: "قبول وتصحيح", zh: "接受并更正" }, { en: "Re-run componentized depreciation under IPSAS 17 and post the adjustment; attach revised schedule.", ar: "إعادة احتساب إهلاك المكوّنات وترحيل التسوية؛ إرفاق الجدول المعدّل.", zh: "按 IPSAS 17 重算组件折旧并过账调整;附修订折旧表。" })}
              {opt(1, pick === 1, false, { en: "Justify & retain", ar: "تبرير وإبقاء", zh: "说明并保留" }, { en: "Defend single-life on materiality; raise a policy-update request.", ar: "الدفاع بالأهمية النسبية؛ ورفع طلب تحديث السياسة.", zh: "以重要性为由维持单一年限;提出政策更新申请。" })}
            </div>
          </div>
        </React.Fragment>}

        <details className="cr-ctx">
          <summary>📂 {tr({ en: "Case & source documents", ar: "الحالة والمستندات", zh: "立案与来源单据" })}<span className="sm">{tr({ en: "auto-prefilled · 3 docs", ar: "تعبئة تلقائية · 3 مستندات", zh: "自动预填 · 3 份文件" })}</span></summary>
          <div className="cr-ctxb">
            <div className="fl">{tr({ en: "Description", ar: "الوصف", zh: "描述" })}</div><p>{tr({ en: "Completed AUC (road infra SAR 0.84B, buildings SAR 0.61B, others SAR 0.47B) met milestones; reclassification AUC → in-service with depreciation from in-service date.", ar: "أصول مكتملة (طرق 0.84، مبانٍ 0.61، أخرى 0.47) أنجزت مراحلها؛ إعادة تصنيف وإهلاك من تاريخ التشغيل.", zh: "已完工在建资产(道路 0.84B、建筑 0.61B、其他 0.47B)达里程碑;重分类入用并自投入使用日折旧。" })}</p>
            <div className="fl">{tr({ en: "Supporting documents", ar: "المستندات", zh: "支持文件" })}</div>
            <div className="cr-docs"><span className="cr-doc">📄 AUC_schedule.xlsx</span><span className="cr-doc">📄 Completion_certs.pdf</span><span className="cr-doc">📄 Useful_life_policy_v2.3.pdf</span></div>
          </div>
        </details>
      </div>

      <div>
        <div className="cr-memocard">
          <div className="cr-memohd"><span>{caseType === "memo" ? "📝" : "📨"}</span><b>{caseType === "memo" ? tr({ en: "Accounting memo", ar: "مذكرة محاسبية", zh: "会计备忘" }) : tr({ en: "Initial response — AO-22", ar: "رد أولي — AO-22", zh: "初步回应 — AO-22" })}</b><span className="tag">{tr({ en: "DRAFT · updates with your decision", ar: "مسودة · تتحدّث مع قرارك", zh: "草稿 · 随你的决策更新" })}</span></div>
          {caseType === "memo" ? <div className="cr-memo">
            <h5>{tr({ en: "Background", ar: "الخلفية", zh: "背景" })}</h5><p>{tr({ en: "SAR 1.92B of completed AUC proposed for reclassification from AUC (15-3100) to in-service fixed assets (16-1200).", ar: "1.92 مليار من الأصول المكتملة لإعادة التصنيف من 15-3100 إلى 16-1200.", zh: "SAR 1.92B 已完工在建资产拟从 15-3100 重分类至在用固定资产 16-1200。" })}</p>
            <h5>{tr({ en: "Basis", ar: "الأساس", zh: "依据" })}</h5><p>{tr({ en: "IPSAS 17 & Comprehensive Guide §Capitalization (v2.3); MoF Instruction 2023-07 — certificates attached & verified.", ar: "IPSAS 17 والدليل الشامل (v2.3)؛ تعليمات 2023-07 — الشهادات مرفقة ومُتحقّقة.", zh: "IPSAS 17 与综合指南 §资本化(v2.3);财政部指示 2023-07——证明已附并核验。" })}</p>
            <h5>{tr({ en: "Treatment", ar: "المعالجة", zh: "会计处理" })}</h5><p>{tr({ en: "Post Dr 16-1200 / Cr 15-3100 SAR 1.92B.", ar: "ترحيل مدين 16-1200 / دائن 15-3100 بمبلغ 1.92 مليار.", zh: "过账 借 16-1200 / 贷 15-3100 SAR 1.92B。" })} {decided ? <span>{pick === 0 ? tr({ en: "Depreciation: componentized per IPSAS 17.", ar: "الإهلاك: بالمكوّنات وفق IPSAS 17.", zh: "折旧:按 IPSAS 17 组件法。" }) : tr({ en: "Depreciation: single useful life (policy v2.3) — policy-update note raised.", ar: "الإهلاك: عمر واحد (v2.3) — مع مذكرة تحديث.", zh: "折旧:单一年限(政策 v2.3)——已提政策更新说明。" })}</span> : <span className="pend">{tr({ en: "Depreciation method pending your decision.", ar: "طريقة الإهلاك بانتظار قرارك.", zh: "折旧方法待你决策。" })}</span>}</p>
          </div> : <div className="cr-memo">
            <h5>{tr({ en: "Observation", ar: "الملاحظة", zh: "观察" })}</h5><p>{tr({ en: "Audit Bureau: componentized depreciation (IPSAS 17) not applied to capitalized AUC.", ar: "الديوان: لم يُطبّق إهلاك المكوّنات على الأصل المرسمل.", zh: "审计署:资本化在建资产未应用组件折旧(IPSAS 17)。" })}</p>
            <h5>{tr({ en: "Our position", ar: "موقفنا", zh: "我方立场" })}</h5><p>{decided ? <span>{pick === 0 ? tr({ en: "Accept & correct: re-run componentized depreciation and post adjustment.", ar: "قبول وتصحيح: إعادة احتساب وترحيل التسوية.", zh: "接受并更正:重算组件折旧并过账调整。" }) : tr({ en: "Justify & retain: defend single-life on materiality; raise policy-update request.", ar: "تبرير وإبقاء: الدفاع بالأهمية ورفع طلب تحديث.", zh: "说明并保留:以重要性维持单一年限;提政策更新申请。" })}</span> : <span className="pend">{tr({ en: "Pending your choice above.", ar: "بانتظار اختيارك أعلاه.", zh: "待上方你的选择。" })}</span>}</p>
            <h5>{tr({ en: "Corrective action", ar: "إجراء تصحيحي", zh: "纠正措施" })}</h5><p>{tr({ en: "Target close within 10 business days; attach revised schedule & basis.", ar: "الإغلاق خلال 10 أيام عمل؛ إرفاق الجدول والأساس.", zh: "目标 10 个工作日内闭环;附修订折旧表与依据。" })}</p>
          </div>}
          <div className="cr-lock">🔒 {tr({ en: "Locked at decision: IPSAS 2024 · Guide v2.3 · CoA 2026 (retained — BR-03)", ar: "مثبّت عند القرار: IPSAS 2024 · v2.3 · دليل الحسابات 2026 (BR-03)", zh: "决策时锁定:IPSAS 2024 · 指南 v2.3 · 科目表 2026(留痕 — BR-03)" })}</div>
          <div className="cr-act">
            <div className="cr-actrow">
              <button className="cr-btn primary" disabled={!decided || approved} onClick={approve}>✓ {approved ? tr({ en: "Approved", ar: "معتمد", zh: "已批准" }) : tr({ en: "Approve", ar: "اعتماد", zh: "批准" })}</button>
              <button className="cr-btn ghost" onClick={() => pushLog({ en: "Memo sent for amendment", ar: "أُرسلت للتعديل", zh: "已退回修改" })}>✎ {tr({ en: "Amend", ar: "تعديل", zh: "修改" })}</button>
            </div>
            <div className="cr-actnote">{approved ? tr({ en: "Approved — hand-off enabled below.", ar: "معتمد — التسليم متاح أدناه.", zh: "已批准——下方交接已启用。" }) : tr({ en: "Resolve the decision above to enable approval · expert review required (BR-01).", ar: "احسم القرار أعلاه لتفعيل الاعتماد · يلزم مراجعة خبير (BR-01).", zh: "先完成上方决策以启用批准 · 需专家审阅(BR-01)。" })}</div>
            <div className="cr-hand">
              <div className="hl2">{tr({ en: "After approval · hand off downstream", ar: "بعد الاعتماد · التسليم اللاحق", zh: "批准后 · 下游交接" })}</div>
              <div className="hb">
                <span className={"cr-dbtn" + (approved ? " on" : "")} onClick={approved ? () => { setBackRoute("compmemo"); setRoute("reports"); } : undefined}><span className="uc">UC-10</span> {tr({ en: "Attach to Financial Report", ar: "إرفاق بالتقرير المالي", zh: "附入财务报告" })} →</span>
                <span className={"cr-dbtn" + (approved ? " on" : "")} onClick={approved ? () => setRoute("chat") : undefined}><span className="uc">UC-03</span> {tr({ en: "File to Audit Log", ar: "حفظ في سجل التدقيق", zh: "归入审计日志" })} →</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cr-agents">
          <div className="cr-agh">🤖 {tr({ en: "Agent assist", ar: "مساعدة الوكلاء", zh: "智能体辅助" })}<span className="tg">3 agents</span></div>
          <div className="cr-ag"><span className="bd run" /><div><div className="an">Compliance / Rules Agent</div><div className="as">{tr({ en: "Grounded standards · raised the open decision for your call", ar: "أسّس المعايير · رفع القرار المفتوح لك", zh: "接地标准 · 提出待你决策项" })}</div></div></div>
          <div className="cr-ag"><span className="bd act" /><div><div className="an">Financial Reports Gen.</div><div className="as">{tr({ en: "Drafts the memo / response; refreshes once you decide", ar: "يصيغ المذكرة / الرد ويُحدّثها بعد قرارك", zh: "起草备忘 / 回应;决策后刷新" })}</div></div></div>
          <div className="cr-ag"><span className="bd act" /><div><div className="an">Data Querying Agent</div><div className="as">{tr({ en: "Pulled AUC schedule, certs & observations from SAP / Esnad", ar: "سحب الجدول والشهادات والملاحظات من ساب / إسناد", zh: "从 SAP / Esnad 拉取折旧表、证明与观察" })}</div></div></div>
        </div>
      </div>
    </div>
  </div>);
}

/* ======= UC-02 · Alerts & Exceptions Center (shared service — no menu entry) ======= */
const UC02_ALERTS = [
  { id: "a1", uc: "UC-13", ucc: "uc13", sev: "crit", risk: { en: "Critical", ar: "حرج", zh: "严重" }, age: "2h", title: { en: "Overdue spike — Riyadh-East", ar: "ارتفاع التأخر — الرياض-شرق", zh: "逾期激增 — 利雅得-东" }, type: { en: "Abnormal balance · collection −9pp", ar: "رصيد شاذ · التحصيل −9", zh: "异常余额 · 征收 −9pp" }, from: { en: "UC-13 · Revenue Collection", ar: "UC-13 · التحصيل", zh: "UC-13 · 收入征收" }, rec: "CT-2025-0142", view: "rcbench", cause: { en: "Collection rate dropped 9pp; SAR 32M overdue beyond 60 days is concentrated in lease contracts under the Wusool template.", ar: "انخفض معدل التحصيل 9 نقاط؛ 32 مليون متأخرة >60 يوماً في عقود الإيجار.", zh: "征收率下降 9 个百分点;SAR 32M 逾期>60天集中在租约(Wusool 模板)。" }, proc: 2 },
  { id: "a2", uc: "UC-11", ucc: "uc11", sev: "high", risk: { en: "High", ar: "مرتفع", zh: "高" }, age: "1h", title: { en: "Useful-life policy conflict", ar: "تعارض سياسة العمر الإنتاجي", zh: "使用年限政策冲突" }, type: { en: "System / policy difference", ar: "فرق سياسة/نظام", zh: "系统 / 政策差异" }, from: { en: "UC-11 · Compliance & Memos", ar: "UC-11 · الامتثال", zh: "UC-11 · 合规与备忘" }, rec: "MEMO-1142", view: "compmemo", cause: { en: "Capitalized AUC uses a single useful life; IPSAS 17 componentization not applied — flagged during the compliance memo review.", ar: "الأصل المرسمل بعمر واحد دون إهلاك المكوّنات — رُصد أثناء مراجعة المذكرة.", zh: "资本化在建资产用单一年限,未应用 IPSAS 17 组件折旧——合规备忘复核时标记。" }, proc: 1 },
  { id: "a3", uc: "UC-14", ucc: "uc14", sev: "high", risk: { en: "High", ar: "مرتفع", zh: "高" }, age: "5h", title: { en: "Impairment indicator — 3 equipment items", ar: "مؤشر انخفاض — 3 معدات", zh: "减值指标 — 3 项设备" }, type: { en: "Abnormal balance · SAR 47M NBV", ar: "رصيد شاذ · 47 مليون", zh: "异常余额 · 账面净值 SAR 47M" }, from: { en: "UC-14 · Assets", ar: "UC-14 · الأصول", zh: "UC-14 · 资产" }, rec: "EQ-2024-0471", view: "asbench", cause: { en: "Idle utilization plus market-value decline beyond the policy threshold; SAR 47M net book value at risk.", ar: "تشغيل خامل وتراجع سوقي يتجاوز الحد؛ 47 مليون قيمة دفترية معرضة.", zh: "闲置利用 + 市场价值跌破政策阈值;SAR 47M 账面净值承压。" }, proc: 0 },
  { id: "a4", uc: "UC-12", ucc: "uc12", sev: "med", risk: { en: "Medium", ar: "متوسط", zh: "中" }, age: "1d", title: { en: "Dormant assignment order AO-2207", ar: "أمر إسناد خامل AO-2207", zh: "休眠派工单 AO-2207" }, type: { en: "Dormant contract · 120d no disbursement", ar: "عقد خامل · 120 يوماً بلا صرف", zh: "休眠合同 · 120天无支付" }, from: { en: "UC-12 · Costs & Funds", ar: "UC-12 · التكاليف والصناديق", zh: "UC-12 · 成本与资金" }, rec: "AO-2207", view: "csfunds", cause: { en: "120 days with no disbursement and milestone delivered — SAR 85M idle surplus eligible for release.", ar: "120 يوماً بلا صرف مع إنجاز المرحلة — 85 مليون فائض خامل قابل للإفراج.", zh: "120 天无支付且里程碑已交付——SAR 85M 闲置结余可释放。" }, proc: 2 },
  { id: "a5", uc: "SYS", ucc: "sys", sev: "med", risk: { en: "Medium", ar: "متوسط", zh: "中" }, age: "3h", title: { en: "SAP ↔ Etimad discrepancy", ar: "فرق ساب ↔ اعتماد", zh: "SAP ↔ Etimad 差异" }, type: { en: "System difference · SAR 25M net", ar: "فرق نظام · 25 مليون", zh: "系统差异 · 净 SAR 25M" }, from: { en: "UC-01 · Data Consolidation", ar: "UC-01 · توحيد البيانات", zh: "UC-01 · 数据整合" }, rec: "RB-0925", view: "rcdata", cause: { en: "SAR 25M net difference across 2 reconciliation items between SAP and Etimad payment orders.", ar: "فرق صافٍ 25 مليون عبر بندي تسوية بين ساب واعتماد.", zh: "SAP 与 Etimad 付款单间 2 项对账差异,净 SAR 25M。" }, proc: 1 },
  { id: "a6", uc: "UC-13", ucc: "uc13", sev: "low", risk: { en: "Low", ar: "منخفض", zh: "低" }, age: "6h", title: { en: "Duplicate invoice suspected", ar: "اشتباه فاتورة مكررة", zh: "疑似重复发票" }, type: { en: "Duplicate bills · INV-4471", ar: "فواتير مكررة · INV-4471", zh: "重复开票 · INV-4471" }, from: { en: "UC-13 · Revenue Collection", ar: "UC-13 · التحصيل", zh: "UC-13 · 收入征收" }, rec: "INV-4471", view: "rcbench", cause: { en: "INV-4471 matches a prior billing key for the same period — likely duplicate, pending confirmation.", ar: "INV-4471 يطابق مفتاح فوترة سابقاً لنفس الفترة — على الأرجح مكرر.", zh: "INV-4471 与同期既有开票主键匹配——疑似重复,待确认。" }, proc: 3 },
];
function AlertsCenter({ drawer, onClose }) {
  const { tr, setRoute, backRoute, setBackRoute, pushLog } = useStore();
  const [sel, setSel] = useState("a1");
  const a = UC02_ALERTS.find(x => x.id === sel) || UC02_ALERTS[0];
  const PROC = [{ en: "Complete", ar: "إكمال", zh: "补全" }, { en: "Correct", ar: "تصحيح", zh: "更正" }, { en: "Escalate", ar: "تصعيد", zh: "升级" }, { en: "Close", ar: "إغلاق", zh: "关闭" }];
  const back = () => { const b = backRoute || "rcbench"; setBackRoute(null); setRoute(b); };
  const UP = { en: "UPSTREAM", ar: "منبع", zh: "上游" }, FD = { en: "FEEDS ↓", ar: "يغذّي", zh: "馈入↓" }, FU = { en: "FEEDS ↑", ar: "يغذّي", zh: "馈入↑" }, THISP = { en: "THIS", ar: "هذه", zh: "本环节" };
  const CHAIN = [
    { code: "UC-01", pos: UP, name: { en: "Data Consolidation", ar: "توحيد البيانات", zh: "数据整合" } },
    { code: "UC-13", pos: FD, name: { en: "Revenue & Collections", ar: "الإيرادات والتحصيل", zh: "收入与征收" } },
    { code: "UC-02", here: true, pos: THISP, name: { en: "Alerts & Exceptions", ar: "التنبيهات والاستثناءات", zh: "告警与异常" } },
    { code: "UC-06", name: { en: "Performance", ar: "الأداء", zh: "绩效" } },
    { code: "UC-14", name: { en: "Assets", ar: "الأصول", zh: "资产" } },
    { code: "UC-12 / UC-11", pos: FU, name: { en: "Costs / Compliance", ar: "التكاليف / الامتثال", zh: "成本 / 合规" } },
    { code: "UC-10 / UC-03", name: { en: "Reporting / Smart Query", ar: "التقارير / الاستعلام", zh: "报告 / 智能查询" } },
  ];
  return (<div className="fade wb">
    {!drawer && <div className="ws-back" onClick={back}>← {tr({ en: "Back", ar: "رجوع", zh: "返回" })}</div>}
    <div className="al-hd">
      <div>
        <div className="al-eyebrow">{ucl("UC-02", tr({ en: "Alerts & Exceptions Center", ar: "مركز التنبيهات والاستثناءات", zh: "告警与异常中心" }))}</div>
        <h1 className="al-h1">{tr({ en: "6 open alerts · 1 critical needs action", ar: "6 تنبيهات مفتوحة · 1 حرج يتطلب إجراءً", zh: "6 条未决告警 · 1 条严重待处理" })}</h1>
        <div className="al-inbound"><span className="al-inlab">{tr({ en: "Inbound from", ar: "وارد من", zh: "调用来源" })}</span>
          <span className="al-feeder uc13">UC-13 {tr({ en: "Revenue", ar: "الإيرادات", zh: "收入" })} <span className="n">2</span></span>
          <span className="al-feeder uc11">UC-11 {tr({ en: "Compliance", ar: "الامتثال", zh: "合规" })} <span className="n">1</span></span>
          <span className="al-feeder uc14">UC-14 {tr({ en: "Assets", ar: "الأصول", zh: "资产" })} <span className="n">1</span></span>
          <span className="al-feeder uc12">UC-12 {tr({ en: "Costs", ar: "التكاليف", zh: "成本" })} <span className="n">1</span></span>
          <span className="al-feeder sys">{tr({ en: "System", ar: "النظام", zh: "系统" })} <span className="n">1</span></span>
        </div>
      </div>
      <div className="al-sevsum">
        <div className="al-sv crit"><div className="n">1</div><div className="l">{tr({ en: "Critical", ar: "حرج", zh: "严重" })}</div></div>
        <div className="al-sv high"><div className="n">2</div><div className="l">{tr({ en: "High", ar: "مرتفع", zh: "高" })}</div></div>
        <div className="al-sv med"><div className="n">2</div><div className="l">{tr({ en: "Medium", ar: "متوسط", zh: "中" })}</div></div>
        <div className="al-sv"><div className="n">1</div><div className="l">{tr({ en: "Low", ar: "منخفض", zh: "低" })}</div></div>
      </div>
    </div>
    <div className="al-feednote">{tr({ en: "Called by upstream use cases: UC-13 raises revenue/collection anomalies, UC-11 raises compliance findings; UC-14 & UC-12 raise asset/fund exceptions. Each alert keeps its source UC & lineage.", ar: "تُستدعى من الحالات الأعلى: UC-13 يرفع شذوذ الإيرادات، UC-11 يرفع نتائج الامتثال؛ ويحتفظ كل تنبيه بمصدره.", zh: "由上游用例调用:UC-13 报收入/征收异常,UC-11 报合规发现,UC-14 与 UC-12 报资产/资金异常;每条告警保留来源 UC 与可追溯链路。" })}</div>

    <div className="al-grid">
      <div className="al-panel">
        <div className="al-ph">{tr({ en: "Exception queue", ar: "قائمة الاستثناءات", zh: "异常队列" })}<span className="pm">{tr({ en: "ranked by severity & age", ar: "مرتّبة حسب الخطورة والعمر", zh: "按严重度与时效排序" })}</span></div>
        <div className="al-filters">
          <div className="al-fchip"><div className="k">{tr({ en: "Alert type", ar: "نوع التنبيه", zh: "告警类型" })}</div><div className="v">{tr({ en: "All", ar: "الكل", zh: "全部" })} ▾</div></div>
          <div className="al-fchip"><div className="k">{tr({ en: "Risk level", ar: "مستوى الخطر", zh: "风险等级" })}</div><div className="v">{tr({ en: "All", ar: "الكل", zh: "全部" })} ▾</div></div>
          <div className="al-fchip"><div className="k">{tr({ en: "Department", ar: "الإدارة", zh: "部门" })}</div><div className="v">{tr({ en: "Revenue + Assets", ar: "الإيرادات + الأصول", zh: "收入 + 资产" })} ▾</div></div>
        </div>
        {UC02_ALERTS.map(x => (<div className={"al-alert" + (x.id === sel ? " sel" : "")} key={x.id} onClick={() => setSel(x.id)}>
          <div className={"al-sevbar " + x.sev} />
          <div className="al-main"><div className="al-t"><span className={"al-uc " + x.ucc}>{x.uc}</span> {tr(x.title)}</div><div className="al-s">{tr(x.type)}</div></div>
          <span className={"al-risk " + x.sev}>{tr(x.risk)}</span><span className="al-age">{x.age}</span>
        </div>))}
      </div>

      <div>
        <div className="al-panel">
          <div className="al-dhd">
            <div className="al-drow"><span className={"al-risk " + a.sev}>{tr(a.risk)}</span><span className={"al-uc " + a.ucc}>{a.uc}</span></div>
            <div className="al-dt">{tr(a.title)}</div>
          </div>
          <div className="al-db">
            <div className="al-fld"><div className="al-fl">{tr({ en: "Source / lineage", ar: "المصدر / التتبع", zh: "来源 / 追溯" })}</div>
              <div className="al-lineage">← <span className="from">{tr(a.from)}</span> · {a.rec}<span className="al-viewsrc" onClick={() => { if (drawer && onClose) onClose(); setRoute(a.view); }}>{tr({ en: "View source", ar: "عرض المصدر", zh: "查看来源" })} →</span></div>
            </div>
            <div className="al-fld"><div className="al-fl">{tr({ en: "Possible cause", ar: "السبب المحتمل", zh: "可能原因" })}</div>
              <div className="al-cause"><span className="ai">AI</span>{tr(a.cause)}</div>
            </div>
            <div className="al-fld"><div className="al-fl">{tr({ en: "Proposed procedure", ar: "الإجراء المقترح", zh: "建议处置" })}</div>
              <div className="al-procs">{PROC.map((p, i) => (<span className={"al-proc" + (i === a.proc ? " on" : "")} key={i}>{tr(p)}{i === a.proc && <span className="rec">AI</span>}</span>))}</div>
            </div>
            <div className="al-fld"><div className="al-fl">{tr({ en: "Assign official (required to escalate)", ar: "تعيين مسؤول (لازم للتصعيد)", zh: "指派负责人(升级必填)" })}</div>
              <div className="al-picker"><span>👤 {tr({ en: "Default responsible party", ar: "المسؤول الافتراضي", zh: "默认负责人" })}</span><span style={{ color: "#b9a4e6" }}>▾</span></div>
            </div>
            <div className="al-fld"><div className="al-fl">{tr({ en: "Closing notes", ar: "ملاحظات الإغلاق", zh: "关闭说明" })} <span className="al-req">· {tr({ en: "justification required (BR-03)", ar: "يلزم تبرير (BR-03)", zh: "需理由(BR-03)" })}</span></div>
              <textarea className="al-cause" style={{ minHeight: 54, fontFamily: "inherit" }} placeholder={tr({ en: "Document the justification before closing…", ar: "وثّق التبرير قبل الإغلاق…", zh: "关闭前记录理由…" })} />
            </div>
          </div>
          <div className="al-acts">
            <button className="al-btn esc" onClick={() => pushLog({ en: "Alert escalated to the assigned official", ar: "تم تصعيد التنبيه للمسؤول", zh: "告警已升级至指派负责人" })}>↑ {tr({ en: "Escalate", ar: "تصعيد", zh: "升级" })}</button>
            <button className="al-btn primary" disabled>✓ {tr({ en: "Close alert", ar: "إغلاق التنبيه", zh: "关闭告警" })}</button>
            <button className="al-btn ghost" onClick={() => pushLog({ en: "Alert marked as reviewed", ar: "تم وسم التنبيه كمراجَع", zh: "告警已标记为已复核" })}>{tr({ en: "Mark as reviewed", ar: "وسم كمراجَع", zh: "标记已复核" })}</button>
            <span className="al-actnote">{tr({ en: "An alert is not a confirmed error — review & document the procedure (BR-02). Critical alerts cannot be closed without justification (BR-03).", ar: "التنبيه ليس خطأً مؤكداً — راجع ووثّق (BR-02). ولا تُغلق الحرجة دون تبرير (BR-03).", zh: "告警不等于确认错误——需复核并记录处置(BR-02);严重告警无理由不可关闭(BR-03)。" })}</span>
          </div>
        </div>
      </div>
    </div>
  </div>);
}

/* ======= UC-10 · Reporting Hub (Library + Composer drawer) ======= */
const RP_REPORTS = [
  { id: "q", name: { en: "G-06 · Revenue & Assets — Quarterly", ar: "ج-06 · الإيرادات والأصول — ربعي", zh: "G-06 · 收入与资产 — 季度" }, sub: { en: "Consolidated directorate report", ar: "تقرير موحّد للإدارة", zh: "总局综合报告" }, type: { en: "Periodic · Consolidated", ar: "دوري · موحّد", zh: "周期 · 综合" }, period: "Q2 2026", srcs: ["13", "14", "12", "11", "06"], status: "review", upd: "1h", title: { en: "G-06 · Revenue & Assets — Quarterly (FY 2026 · Q2)", ar: "ج-06 · الإيرادات والأصول — ربعي (2026 · ر2)", zh: "G-06 · 收入与资产 — 季度(FY 2026 · Q2)" } },
  { id: "rev", name: { en: "Revenue & Collections Report", ar: "تقرير الإيرادات والتحصيل", zh: "收入与征收报告" }, sub: { en: "Billing, collection, exclusions", ar: "الفوترة والتحصيل والاستبعادات", zh: "开票、征收、排除项" }, type: { en: "Periodic · Dept", ar: "دوري · إدارة", zh: "周期 · 部门" }, period: "Q2 2026", srcs: ["13", "02", "06"], status: "appr", upd: "today", title: { en: "Revenue & Collections Report (FY 2026 · Q2)", ar: "تقرير الإيرادات والتحصيل (2026 · ر2)", zh: "收入与征收报告(FY 2026 · Q2)" } },
  { id: "ast", name: { en: "Assets & Capitalization Report", ar: "تقرير الأصول والرسملة", zh: "资产与资本化报告" }, sub: { en: "Classification, capitalization, returns", ar: "التصنيف والرسملة والعوائد", zh: "分类、资本化、回报" }, type: { en: "Periodic · Dept", ar: "دوري · إدارة", zh: "周期 · 部门" }, period: "Q2 2026", srcs: ["14", "12", "11"], status: "draft", upd: "2h", title: { en: "Assets & Capitalization Report (FY 2026 · Q2)", ar: "تقرير الأصول والرسملة (2026 · ر2)", zh: "资产与资本化报告(FY 2026 · Q2)" } },
  { id: "cost", name: { en: "Costs & Funds Report", ar: "تقرير التكاليف والصناديق", zh: "成本与资金报告" }, sub: { en: "Assignment orders, unit cost, funds", ar: "أوامر الإسناد وتكلفة الوحدة والصناديق", zh: "派工单、单元成本、资金" }, type: { en: "Periodic · Dept", ar: "دوري · إدارة", zh: "周期 · 部门" }, period: "Q2 2026", srcs: ["12", "14"], status: "draft", upd: "3h", title: { en: "Costs & Funds Report (FY 2026 · Q2)", ar: "تقرير التكاليف والصناديق (2026 · ر2)", zh: "成本与资金报告(FY 2026 · Q2)" } },
  { id: "comp", name: { en: "Compliance & Accounting Memos Pack", ar: "حزمة الامتثال والمذكرات المحاسبية", zh: "合规与会计备忘汇编" }, sub: { en: "Memos, journal entries, references", ar: "مذكرات، قيود، مراجع", zh: "备忘、分录、依据" }, type: { en: "Compilation", ar: "تجميع", zh: "汇编" }, period: "Q2 2026", srcs: ["11", "09"], status: "review", upd: "1h", title: { en: "Compliance & Accounting Memos Pack (Q2)", ar: "حزمة الامتثال والمذكرات (ر2)", zh: "合规与会计备忘汇编(Q2)" } },
  { id: "exec", name: { en: "Executive Summary — Leadership", ar: "الملخص التنفيذي — القيادة", zh: "执行摘要 — 领导层" }, sub: { en: "One-page KPI & deviations", ar: "صفحة واحدة: مؤشرات وانحرافات", zh: "一页 KPI 与偏差" }, type: { en: "Executive", ar: "تنفيذي", zh: "执行" }, period: "Jun 2026", srcs: ["06", "13", "14", "02"], status: "issued", upd: "Jun 28", title: { en: "Executive Summary — Leadership (Jun 2026)", ar: "الملخص التنفيذي — القيادة (يونيو 2026)", zh: "执行摘要 — 领导层(2026 年 6 月)" } },
  { id: "adhoc", name: { en: "Ad-hoc · \"Overdue by Amanah\"", ar: "حسب الطلب · «التأخر حسب الأمانة»", zh: "即席 · 「按阿玛纳逾期」" }, sub: { en: "Natural-language query report", ar: "تقرير استعلام بلغة طبيعية", zh: "自然语言查询报告" }, type: { en: "Ad-hoc · NL", ar: "حسب الطلب · لغة طبيعية", zh: "即席 · 自然语言" }, period: "Q2 2026", srcs: ["13", "03"], status: "draft", upd: "10m", title: { en: "Ad-hoc · \"Overdue by Amanah\"", ar: "حسب الطلب · «التأخر حسب الأمانة»", zh: "即席 · 「按阿玛纳逾期」" } },
];
const RP_STEPS = { draft: 0, review: 1, appr: 2, issued: 3 };
function ReportHub() {
  const { tr, setRoute, backRoute, setBackRoute, pushLog } = useStore();
  const [reports, setReports] = useState(RP_REPORTS);
  const [open, setOpen] = useState(null);
  const [nw, setNw] = useState(false);
  const [nmode, setNmode] = useState("tmpl");
  const [ntmpl, setNtmpl] = useState("q");
  const [nnl, setNnl] = useState("");
  const r = reports.find(x => x.id === open);
  const TEMPLATES = [
    { key: "q", name: { en: "G-06 Quarterly · Revenue & Assets", ar: "ج-06 ربعي · الإيرادات والأصول", zh: "G-06 季度 · 收入与资产" }, srcs: ["13", "14", "12", "11", "06"] },
    { key: "rev", name: { en: "Revenue & Collections", ar: "الإيرادات والتحصيل", zh: "收入与征收" }, srcs: ["13", "02", "06"] },
    { key: "ast", name: { en: "Assets & Capitalization", ar: "الأصول والرسملة", zh: "资产与资本化" }, srcs: ["14", "12", "11"] },
    { key: "cost", name: { en: "Costs & Funds", ar: "التكاليف والصناديق", zh: "成本与资金" }, srcs: ["12", "14"] },
    { key: "comp", name: { en: "Compliance & Memos", ar: "الامتثال والمذكرات", zh: "合规与备忘" }, srcs: ["11", "09"] },
    { key: "exec", name: { en: "Executive Summary", ar: "ملخص تنفيذي", zh: "执行摘要" }, srcs: ["06", "13", "14", "02"] },
  ];
  const genReport = () => {
    const id = "n" + Date.now();
    let rep;
    if (nmode === "nl") { const q = nnl.trim() || tr({ en: "Ad-hoc query", ar: "استعلام", zh: "即席查询" }); rep = { id, name: "Ad-hoc · " + q, sub: { en: "Natural-language query report", ar: "تقرير استعلام بلغة طبيعية", zh: "自然语言查询报告" }, type: { en: "Ad-hoc · NL", ar: "حسب الطلب", zh: "即席 · 自然语言" }, period: "Q2 2026", srcs: ["13", "03"], status: "draft", upd: tr({ en: "now", ar: "الآن", zh: "刚刚" }), title: "Ad-hoc · " + q }; }
    else { const t = TEMPLATES.find(x => x.key === ntmpl); rep = { id, name: t.name, sub: { en: "Generated from template", ar: "مولّد من قالب", zh: "由模板生成" }, type: { en: "Periodic", ar: "دوري", zh: "周期" }, period: "Q2 2026", srcs: t.srcs, status: "draft", upd: tr({ en: "now", ar: "الآن", zh: "刚刚" }), title: tr(t.name) + " (FY 2026 · Q2)" }; }
    setReports([rep, ...reports]); setNw(false); setNnl(""); setOpen(id);
  };
  const ucCls = (c) => "uc" + c;
  const stLabel = (s) => ({ draft: { en: "Draft", ar: "مسودة", zh: "草稿" }, review: { en: "Under Review", ar: "قيد المراجعة", zh: "审核中" }, appr: { en: "Approved", ar: "معتمد", zh: "已批准" }, issued: { en: "Issued", ar: "صادر", zh: "已发布" } }[s]);
  const STEPL = [{ en: "Draft", ar: "مسودة", zh: "草稿" }, { en: "Under Review", ar: "قيد المراجعة", zh: "审核中" }, { en: "Approved", ar: "معتمد", zh: "已批准" }, { en: "Issued", ar: "صادر", zh: "已发布" }];
  const RP_PARENT = { csfunds: { en: "Costs & Funds Console", ar: "وحدة التكاليف والصناديق", zh: "成本与资金控制台" }, compmemo: { en: "Accounting Ruling", ar: "قرار محاسبي", zh: "会计裁定" }, rcwork: { en: "Revenue Collection Dept", ar: "إدارة التحصيل", zh: "收入征收部" }, aswork: { en: "Assets Department", ar: "إدارة الأصول", zh: "资产部" } };
  const backTarget = backRoute || "rcwork";
  const goBack = () => { setBackRoute(null); setRoute(backTarget); };
  return (<div className="fade ws-page">
    <div className="rp-libhd">
      <div className="rp-libL">
      <div className="rp-libtitle">{backRoute && <button className="rp-backbtn" title={tr({ en: "Back", ar: "رجوع", zh: "返回" })} onClick={goBack}>‹</button>}<div><div className="dw-eyebrow g" style={{ marginBottom: 2 }}>{tr({ en: "Department Workspace · convergence", ar: "مساحة عمل الإدارة · تجميعي", zh: "部门工作区 · 汇聚" })}</div><h1 className="rp-h1">{tr({ en: "Report Library", ar: "مكتبة التقارير", zh: "报告库" })}{SHOW_UC ? " · UC-10" : ""}</h1></div></div>
        <div className="sub muted" style={{ fontSize: 12.5, marginTop: 3 }}>{tr({ en: "Mandate: generate financial/administrative reports & narrative commentary (UC-10). Workspace — convergence type: report library + contributions inbox from all departments.", ar: "المهمة: إنشاء التقارير والتعليق السردي (UC-10). مساحة العمل — نوع تجميعي: مكتبة + صندوق مساهمات.", zh: "职责:生成财务/行政报告与叙述评述(UC-10)。Workspace — 汇聚型:报告库 + 各部门贡献 inbox。" })}</div>
      </div>
        <SmartQueryFab scope={{ en: "Scope: Reporting · all sources", ar: "النطاق: التقارير · كل المصادر", zh: "范围:报告 · 全部来源" }} prompts={[{ en: "Which reports are pending approval?", ar: "ما التقارير بانتظار الاعتماد؟", zh: "哪些报告待审批?" }, { en: "What feeds the G-06 quarterly report?", ar: "ما الذي يغذّي تقرير ج-06 الربعي؟", zh: "G-06 季度报告由谁汇入?" }, { en: "Show overdue report sections", ar: "إظهار أقسام التقارير المتأخرة", zh: "显示逾期的报告章节" }]} />
      <div className="wb-chain rp-headchain"><span className="wb-clab">{tr({ en: "G-06 CHAIN", ar: "سلسلة ج-06", zh: "G-06 链路" })}</span>
        {[{ c: "UC-01" }, { c: "UC-13" }, { c: "UC-06/02" }, { c: "UC-14" }, { c: "UC-12/11" }, { c: "UC-10", here: true, pos: { en: "CONVERGE ★", ar: "تقارب ★", zh: "汇聚 ★" } }].map((n, i) => (<span className="wb-cseg" key={i}>{i > 0 && <span className="wb-carr">→</span>}<span className={"wb-cpill" + (n.here ? " here" : "")}>{n.pos && <span className="wb-cpos">{tr(n.pos)}</span>}{n.c}</span></span>))}
      </div>
    </div>
    <div className="rp-contrib">
      <div className="ch">{tr({ en: "Recent contributions · pushed from upstream UCs into reports", ar: "مساهمات حديثة · مدفوعة من الحالات الأعلى إلى التقارير", zh: "最近贡献 · 由上游 UC 推入报告" })}</div>
      <div className="row"><span className="rp-uc uc11">UC-11</span><span className="arr">→</span> {tr({ en: "attached", ar: "أرفق", zh: "附入" })} <b>memo MEMO-1142</b> {tr({ en: "to", ar: "إلى", zh: "→" })} <span className="tgt">G-06 Quarterly</span><span className="age">1h</span></div>
      <div className="row"><span className="rp-uc uc12">UC-12</span><span className="arr">→</span> {tr({ en: "sent", ar: "أرسل", zh: "推送" })} <b>{tr({ en: "costs & funds data", ar: "بيانات التكاليف والصناديق", zh: "成本与资金数据" })}</b> {tr({ en: "to", ar: "إلى", zh: "→" })} <span className="tgt">Costs & Funds Report</span><span className="age">3h</span></div>
      <div className="row"><span className="rp-uc uc13">UC-13</span><span className="arr">→</span> {tr({ en: "fed", ar: "غذّى", zh: "喂入" })} <b>{tr({ en: "collection results & gap", ar: "نتائج التحصيل والفجوة", zh: "征收结果与缺口" })}</b> {tr({ en: "to", ar: "إلى", zh: "→" })} <span className="tgt">Revenue & Collections Report</span><span className="age">{tr({ en: "today", ar: "اليوم", zh: "今天" })}</span></div>
      <div className="row"><span className="rp-uc uc02">UC-02</span><span className="arr">→</span> {tr({ en: "flagged", ar: "رصد", zh: "标记" })} <b>{tr({ en: "1 critical alert", ar: "تنبيه حرج", zh: "1 条严重告警" })}</b> {tr({ en: "into", ar: "في", zh: "→" })} <span className="tgt">Executive Summary</span><span className="age">{tr({ en: "today", ar: "اليوم", zh: "今天" })}</span></div>
    </div>
    <div className="rp-filters">
      <div className="rp-fchip"><div className="k">{tr({ en: "Type", ar: "النوع", zh: "类型" })}</div><div className="v">{tr({ en: "All", ar: "الكل", zh: "全部" })} ▾</div></div>
      <div className="rp-fchip"><div className="k">{tr({ en: "Period", ar: "الفترة", zh: "期间" })}</div><div className="v">FY 2026 · Q2 ▾</div></div>
      <div className="rp-fchip"><div className="k">{tr({ en: "Department", ar: "الإدارة", zh: "部门" })}</div><div className="v">{tr({ en: "All", ar: "الكل", zh: "全部" })} ▾</div></div>
      <div className="rp-fchip"><div className="k">{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</div><div className="v">{tr({ en: "All", ar: "الكل", zh: "全部" })} ▾</div></div>
      <button className="rp-newbtn" style={{ marginInlineStart: "auto" }} onClick={() => setNw(true)}>+ {tr({ en: "New report", ar: "تقرير جديد", zh: "新建报告" })}</button>
    </div>
    <div className="rp-libtbl">
      <div className="rp-libhead"><div>{tr({ en: "Report", ar: "التقرير", zh: "报告" })}</div><div>{tr({ en: "Type", ar: "النوع", zh: "类型" })}</div><div>{tr({ en: "Period", ar: "الفترة", zh: "期间" })}</div><div>{tr({ en: "Assembled from", ar: "مُجمّع من", zh: "汇聚来源" })}</div><div>{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</div><div>{tr({ en: "Updated", ar: "محدّث", zh: "更新" })}</div></div>
      {reports.map(x => (<div className="rp-librow" key={x.id} onClick={() => setOpen(x.id)}>
        <div className="rp-rn">{tr(x.name)}<div className="sub">{tr(x.sub)}</div></div>
        <div>{tr(x.type)}</div><div>{x.period}</div>
        <div className="rp-srcs">{x.srcs.map((c, i) => <span className={"rp-uc " + ucCls(c)} key={i}>{c}</span>)}</div>
        <div><span className={"rp-st " + x.status}>{tr(stLabel(x.status))}</span></div>
        <div className="rp-upd">{x.upd}</div>
      </div>))}
    </div>

    {r && <div className="rp-ov open" onClick={(e) => { if (e.target === e.currentTarget) setOpen(null); }}>
      <div className="rp-dw">
        <div className="rp-dwhead"><span className="rp-dwt">📄 {ucl("UC-10", tr({ en: "Report Composer", ar: "منشئ التقارير", zh: "报告编排" }))}</span><button className="rp-dwx" onClick={() => setOpen(null)}>✕ {tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button></div>
        <div className="rp-ctop">
          <div className="rp-ctl">
            <div className="rp-eyebrow">{tr({ en: "Report · view only", ar: "تقرير · للعرض فقط", zh: "报告 · 仅查看" })}{SHOW_UC ? " · UC-10" : ""}</div>
            <h2>{tr(r.title)}</h2>
            <div className="rp-asm"><span className="rp-asmlab">{tr({ en: "Assembled from", ar: "مُجمّع من", zh: "汇聚来源" })}</span>{r.srcs.map((c, i) => <span className={"rp-uc " + ucCls(c)} key={i}>UC-{c}</span>)}</div>
          </div>
          <div className="rp-ctr">
            <div className="rp-status">{STEPL.map((l, i) => { const cur = RP_STEPS[r.status]; const cls = i < cur ? "done" : (i === cur ? "cur" : ""); return (<React.Fragment key={i}>{i > 0 && <span className="arr">›</span>}<span className={"s " + cls}><span className="dot" />{tr(l)}</span></React.Fragment>); })}</div>
            <div className="rp-toolbtns"><button className="rp-ebtn" onClick={() => pushLog({ en: "Exporting report to Word…", ar: "تصدير إلى وورد…", zh: "正在导出 Word…" })}>⬇ Word</button><button className="rp-ebtn" onClick={() => pushLog({ en: "Exporting report to Excel…", ar: "تصدير إلى إكسل…", zh: "正在导出 Excel…" })}>⬇ Excel</button><button className="rp-ebtn" onClick={() => pushLog({ en: "Exporting report to PDF…", ar: "تصدير إلى PDF…", zh: "正在导出 PDF…" })}>⬇ PDF</button><button className="rp-send2" onClick={() => pushLog({ en: "Report sent for approval", ar: "أُرسل التقرير للاعتماد", zh: "报告已送审" })}>{tr({ en: "Send for approval", ar: "إرسال للاعتماد", zh: "送审" })} →</button></div>
          </div>
        </div>
        <div className="rp-gate">✓ <b>{tr({ en: "Source data approved", ar: "بيانات المصدر معتمدة", zh: "来源数据已核准" })}</b> — {tr({ en: "official report can be issued (BR-01). Every figure traces to an approved dataset.", ar: "يمكن إصدار التقرير الرسمي (BR-01). كل رقم قابل للتتبع.", zh: "可签发正式报告(BR-01);每个数字均可追溯至已核准数据集。" })}</div>
        <div className="rp-doc">
          <div className="rp-dochd"><div className="rp-doctitle">{tr(r.title)}</div>
            <div className="rp-docmeta"><span>{tr({ en: "Copy No.", ar: "نسخة رقم", zh: "副本号" })} <b>FBC-2026-Q2-118</b></span><span>{tr({ en: "Owner: Financial Reporting Dept", ar: "المالك: إدارة التقارير", zh: "归属:财务报告部" })}</span><span>{tr({ en: "Issue date: pending", ar: "تاريخ الإصدار: معلّق", zh: "发布日期:待定" })}</span><span>{tr({ en: "Sources", ar: "المصادر", zh: "来源" })}: {r.srcs.length} UCs</span></div></div>
          <div className="rp-docb">
            <p className="rp-secl">{tr({ en: "Key figures & indicators · auto-filled from approved data", ar: "أرقام ومؤشرات · معبّأة تلقائياً", zh: "关键指标 · 自动取自已核准数据" })}</p>
            <table className="rp-tbl"><thead><tr><th>{tr({ en: "INDICATOR", ar: "المؤشر", zh: "指标" })}</th><th className="c">{tr({ en: "VALUE", ar: "القيمة", zh: "数值" })}</th><th>{tr({ en: "SOURCE", ar: "المصدر", zh: "来源" })}</th></tr></thead>
              <tbody>
                <tr><td>{tr({ en: "Net billed amount", ar: "صافي المفوتر", zh: "净开票额" })}</td><td className="num">SAR 920M</td><td><span className="rp-uc uc13">{tr({ en: "Revenue Collection", ar: "التحصيل", zh: "收入征收部" })}</span></td></tr>
                <tr><td>{tr({ en: "Collection rate", ar: "معدل التحصيل", zh: "征收率" })}</td><td className="num">87% (+2.1pp)</td><td><span className="rp-uc uc13">{tr({ en: "Revenue Collection", ar: "التحصيل", zh: "收入征收部" })}</span></td></tr>
                <tr><td>{tr({ en: "Collection gap", ar: "فجوة التحصيل", zh: "征收缺口" })}</td><td className="num">SAR 120M</td><td><span className="rp-uc uc13">{tr({ en: "Revenue Collection", ar: "التحصيل", zh: "收入征收部" })}</span></td></tr>
                <tr><td>{tr({ en: "Capitalized AUC", ar: "المرسمل", zh: "已资本化在建" })}</td><td className="num">SAR 1.92B</td><td><span className="rp-uc uc14">{tr({ en: "Assets", ar: "الأصول", zh: "资产部" })}</span></td></tr>
                <tr><td>{tr({ en: "Allocated project cost", ar: "تكلفة المشروع الموزّعة", zh: "已分摊项目成本" })}</td><td className="num">SAR 2.14B</td><td><span className="rp-uc uc12">{tr({ en: "Cost Management", ar: "إدارة التكاليف", zh: "成本管理部" })}</span></td></tr>
                <tr><td>{tr({ en: "Compliance memos (open)", ar: "مذكرات الامتثال (مفتوحة)", zh: "合规备忘(未结)" })}</td><td className="num">1</td><td><span className="rp-uc uc11">{tr({ en: "Compliance", ar: "الامتثال", zh: "合规部" })}</span></td></tr>
              </tbody></table>
            <p className="rp-secl">{tr({ en: "Trend · collection rate by quarter", ar: "الاتجاه · معدل التحصيل ربعياً", zh: "趋势 · 各季度征收率" })}</p>
            <div className="rp-chart"><div className="rp-bar" style={{ height: "60%" }}><span>83%</span><small>Q3-25</small></div><div className="rp-bar" style={{ height: "64%" }}><span>85%</span><small>Q4-25</small></div><div className="rp-bar" style={{ height: "68%" }}><span>85%</span><small>Q1-26</small></div><div className="rp-bar" style={{ height: "80%" }}><span>87%</span><small>Q2-26</small></div></div>
            <p className="rp-secl">{tr({ en: "Narrative commentary · auto-generated", ar: "تعليق سردي · مولّد تلقائياً", zh: "叙述评述 · 自动生成" })}</p>
            <div className="rp-narr"><span className="tag">AI</span>{tr({ en: "Collection rate rose to 87% (+2.1pp). ", ar: "ارتفع معدل التحصيل إلى 87% (+2.1). ", zh: "征收率升至 87%(环比 +2.1pp)。" })}<span className="dev">{tr({ en: "Deviation:", ar: "انحراف:", zh: "偏差:" })}</span>{tr({ en: " a SAR 120M gap remains in 3 Amanat (lease arrears >60d). SAR 1.92B of AUC was capitalized; ", ar: " تبقى فجوة 120 مليون في 3 أمانات. ورُسمل 1.92 مليار؛ ", zh: " SAR 120M 缺口集中于 3 个阿玛纳(租约逾期>60天)。已资本化 SAR 1.92B 在建资产;" })}<span className="dev">{tr({ en: "deviation:", ar: "انحراف:", zh: "偏差:" })}</span>{tr({ en: " 3 equipment items flagged for impairment. ", ar: " 3 معدات مرصودة للانخفاض. ", zh: "3 项设备标记减值。" })}<span className="dev">{tr({ en: "Open item:", ar: "بند مفتوح:", zh: "未结项:" })}</span>{tr({ en: " 1 useful-life policy conflict (UC-11) pending before issuance.", ar: " تعارض سياسة عمر إنتاجي معلّق قبل الإصدار.", zh: " 1 项使用年限政策冲突(UC-11)待解决后方可签发。" })}</div>
            <div className="rp-narrnote">{tr({ en: "Commentary explains deviations, not just numbers (BR-02) · human review required before release.", ar: "التعليق يفسّر الانحرافات لا الأرقام فقط (BR-02) · يلزم مراجعة بشرية.", zh: "评述解释偏差而非仅罗列数字(BR-02)· 签发前需人工复核。" })}</div>
            <p className="rp-secl">{tr({ en: "Data sources · lineage", ar: "مصادر البيانات · التتبع", zh: "数据来源 · 追溯" })}</p>
            <div className="rp-lin"><span className="ln">{tr({ en: "Net billed, collection, gap", ar: "المفوتر والتحصيل والفجوة", zh: "净开票、征收、缺口" })}</span><span className="src">← {tr({ en: "Revenue Collection", ar: "التحصيل", zh: "收入征收部" })} →</span></div>
            <div className="rp-lin"><span className="ln">{tr({ en: "Capitalized AUC, impairment", ar: "المرسمل والانخفاض", zh: "资本化在建、减值" })}</span><span className="src">← {tr({ en: "Assets", ar: "الأصول", zh: "资产部" })} →</span></div>
            <div className="rp-lin"><span className="ln">{tr({ en: "Allocated cost, idle surplus", ar: "التكلفة الموزّعة والفائض", zh: "分摊成本、闲置结余" })}</span><span className="src">← {tr({ en: "Cost Management", ar: "إدارة التكاليف", zh: "成本管理部" })} →</span></div>
            <div className="rp-lin"><span className="ln">{tr({ en: "Compliance memo & basis", ar: "مذكرة الامتثال والأساس", zh: "合规备忘与依据" })}</span><span className="src">← {tr({ en: "Compliance", ar: "الامتثال", zh: "合规部" })} →</span></div>
            <div className="rp-lin"><span className="ln">{tr({ en: "Audit trail & permissions", ar: "سجل التدقيق والصلاحيات", zh: "审计轨迹与权限" })}</span><span className="src">← {tr({ en: "Audit / Smart Query", ar: "التدقيق / الاستعلام", zh: "审计 / 智能查询" })} →</span></div>
          </div>
        </div>
        <div className="rp-lock">🔒 {tr({ en: "Approved version saved immutably; edits create a new version (BR-04). Each copy carries number, owner, date & sources (BR-03).", ar: "النسخة المعتمدة تُحفظ دون تعديل؛ التعديل يُنشئ نسخة جديدة (BR-04). وكل نسخة تحمل رقماً ومالكاً وتاريخاً ومصادر (BR-03).", zh: "已批准版本不可变保存;修改生成新版本(BR-04)。每份副本含编号、归属、日期与来源(BR-03)。" })}</div>
      </div>
    </div>}
    {nw && <div className="rp-nov" onClick={(e) => { if (e.target === e.currentTarget) setNw(false); }}>
      <div className="rp-ncard">
        <div className="rp-nhd">{tr({ en: "New report", ar: "تقرير جديد", zh: "新建报告" })}<button className="x" onClick={() => setNw(false)}>✕</button></div>
        <div className="rp-nbody">
          <div className="rp-nlab">{tr({ en: "How do you want to start?", ar: "كيف تريد البدء؟", zh: "从哪种方式开始?" })}</div>
          <div className="rp-nmodes">
            <div className={"rp-nmode" + (nmode === "tmpl" ? " on" : "")} onClick={() => setNmode("tmpl")}>📋 {tr({ en: "From a template", ar: "من قالب", zh: "用模板" })}<div className="sub">{tr({ en: "Pick an approved template", ar: "اختر قالباً معتمداً", zh: "选择已批准模板" })}</div></div>
            <div className={"rp-nmode" + (nmode === "nl" ? " on" : "")} onClick={() => setNmode("nl")}>💬 {tr({ en: "Ask in natural language", ar: "بلغة طبيعية", zh: "自然语言" })}<div className="sub">{tr({ en: "Describe the report you need", ar: "صف التقرير المطلوب", zh: "描述你要的报告" })}</div></div>
          </div>
          {nmode === "tmpl"
            ? <div className="rp-nfield"><div className="rp-nfl">{tr({ en: "Template", ar: "القالب", zh: "模板" })}</div><select value={ntmpl} onChange={e => setNtmpl(e.target.value)}>{TEMPLATES.map(t => <option key={t.key} value={t.key}>{tr(t.name)}</option>)}</select></div>
            : <div className="rp-nfield"><div className="rp-nfl">{tr({ en: "Request", ar: "الطلب", zh: "请求" })}</div><input value={nnl} onChange={e => setNnl(e.target.value)} placeholder={tr({ en: "e.g. Overdue by Amanah this quarter", ar: "مثال: التأخر حسب الأمانة هذا الربع", zh: "例:本季度按阿玛纳逾期" })} /></div>}
          <div className="rp-nrow2">
            <div className="rp-nfield"><div className="rp-nfl">{tr({ en: "Period", ar: "الفترة", zh: "期间" })}</div><div className="rp-nval">FY 2026 · Q2 ▾</div></div>
            <div className="rp-nfield"><div className="rp-nfl">{tr({ en: "Scope", ar: "النطاق", zh: "范围" })}</div><div className="rp-nval">{tr({ en: "6 Amanat", ar: "6 أمانات", zh: "6 个阿玛纳" })} ▾</div></div>
          </div>
        </div>
        <div className="rp-nfoot"><button className="rp-ncancel" onClick={() => setNw(false)}>{tr({ en: "Cancel", ar: "إلغاء", zh: "取消" })}</button><button className="rp-ngen" onClick={genReport}>✦ {tr({ en: "Generate report", ar: "إنشاء التقرير", zh: "生成报告" })}</button></div>
      </div>
    </div>}
  </div>);
}

/* ======= Financial Performance Analysis — workspace (Archetype B · analytical) ======= */
function FpaWorkspace() {
  const { tr, setRoute, setDeptSub, setBackRoute } = useStore();
  const openWb = () => { setBackRoute("fpawork"); setDeptSub("fpa"); setRoute("perf"); };
  return (<div className="fade ws-page">
    <div className="dw-hd"><div><div className="dw-eyebrow g">{tr({ en: "Department Workspace", ar: "مساحة عمل الإدارة", zh: "部门工作区" })}</div><h1 className="dw-h1">{tr({ en: "Financial Performance Analysis", ar: "تحليل الأداء المالي", zh: "财务绩效分析部" })}</h1></div><div className="dw-live"><SyncBadge />{SHOW_UC ? " · UC-06" : ""}</div></div>
    <div className="dw-sub">{tr({ en: "Mandate: performance, spend analysis & executive reports (UC-06). Workspace — analytical type: metric-heavy (scorecard + trajectory + variance), no Business Plaza; drills into the UC-06 workbench.", ar: "المهمة: تحليل الأداء والإنفاق والتقارير التنفيذية (UC-06). مساحة العمل — نوع تحليلي مكثّف بالمؤشرات؛ بلا ساحة أعمال.", zh: "职责:绩效、支出分析与执行报告(UC-06)。Workspace — 分析型:指标密集(记分卡+轨迹+偏差),不放 Business Plaza,下钻进 UC-06 工作台。" })}</div>
    <SmartQueryFab scope={{ en: "Scope: Financial Performance · read-only", ar: "النطاق: الأداء المالي · للقراءة", zh: "范围:财务绩效 · 只读" }} prompts={[{ en: "Why is execution only 64% vs 95% target?", ar: "لماذا التنفيذ 64% فقط مقابل 95%؟", zh: "为何执行率仅 64%(目标 95%)?" }, { en: "Which Amanat are lagging spend?", ar: "ما الأمانات المتأخرة في الإنفاق؟", zh: "哪些阿玛纳支出滞后?" }, { en: "Draft the leadership one-liner", ar: "صياغة سطر للقيادة", zh: "起草给领导的一句话" }]} />
    <div className="dw-kpis">
      <div className="dw-kpi"><div className="l">{tr({ en: "Budget Execution", ar: "تنفيذ الميزانية", zh: "预算执行率" })}</div><div className="v">64.0%</div><div className="d down">▼ {tr({ en: "spent ÷ budget · tgt 95%", ar: "مصروف ÷ الميزانية · الهدف 95%", zh: "已花÷预算 · 目标95%" })}</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Plan Variance", ar: "انحراف الخطة", zh: "计划偏差" })}</div><div className="v red">−SAR 4.86B</div><div className="d down">{tr({ en: "below plan-to-date", ar: "أقل من الخطة", zh: "低于至今计划" })}</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Actual Spend", ar: "الإنفاق الفعلي", zh: "实际支出" })}</div><div className="v">SAR 11.12B</div><div className="d">{tr({ en: "of SAR 17.37B budget", ar: "من 17.37 مليار", zh: "占 17.37B 预算" })}</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Remaining Balance", ar: "الرصيد المتبقي", zh: "剩余余额" })}</div><div className="v">SAR 6.25B</div><div className="d">{tr({ en: "36% unspent", ar: "36% غير مصروف", zh: "36% 未支出" })}</div></div>
    </div>
    <div className="fw-sig">
      <div className="fw-hero">
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}><span className="fw-tag red">● {tr({ en: "EXECUTION LAG · BELOW TARGET", ar: "تأخر التنفيذ · دون الهدف", zh: "执行滞后 · 低于目标" })}</span><span className="fw-tag gray">{tr({ en: "Ministry · FY 2026", ar: "الوزارة · 2026", zh: "全部 · FY2026" })}</span></div>
        <h2>{tr({ en: "Spending is at ", ar: "الإنفاق عند ", zh: "支出仅达预算的 " })}<b>64%</b>{tr({ en: " of the SAR 17.37B budget — SAR 6.25B unspent, SAR 4.86B behind the planned pace.", ar: " من ميزانية 17.37 مليار — 6.25 مليار غير مصروفة و4.86 مليار خلف الخطة.", zh: " 64%(17.37B)— 6.25B 未支出,落后计划 4.86B。" })}</h2>
        <p>{tr({ en: "Execution vs plan is 70% (SAR 11.12B of SAR 15.98B planned-to-date). Lagging capital projects need acceleration before FY-end; corrective note pending sign-off.", ar: "التنفيذ مقابل الخطة 70% (11.12 من 15.98 مليار). المشاريع الرأسمالية المتأخرة تحتاج تسريعاً.", zh: "执行 vs 计划 70%(11.12B / 15.98B 至今计划)。滞后的资本项目需在年末前加速;纠正说明待签核。" })}</p>
        <div className="fw-hg"><div><div className="l">{tr({ en: "Execution", ar: "التنفيذ", zh: "执行" })}</div><div className="v">64%</div></div><div><div className="l">{tr({ en: "vs Plan", ar: "مقابل الخطة", zh: "vs 计划" })}</div><div className="v" style={{ color: "#dc2626" }}>70%</div></div><div><div className="l">{tr({ en: "Remaining", ar: "المتبقي", zh: "剩余" })}</div><div className="v">SAR 6.25B</div></div><div><div className="l">{tr({ en: "Budget adj.", ar: "تعديل", zh: "预算调整" })}</div><div className="v">+SAR 0.84B</div></div></div>
        <DwActions buttons={[{ label: { en: "Open Performance Workbench", ar: "فتح منصة الأداء", zh: "打开绩效工作台" }, cls: "p", arrow: true, go: openWb }, { label: { en: "Acknowledge", ar: "إقرار", zh: "知悉" }, cls: "ghost", confirm: { en: "Acknowledged", ar: "تم الإقرار", zh: "已知悉" } }]} />
      </div>
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Budget Execution Funnel · FY 2026", ar: "قمع تنفيذ الميزانية · 2026", zh: "预算执行漏斗 · FY2026" })}</div><div className="dw-pb">
        <div className="fw-fr"><span className="fl">{tr({ en: "Current budget", ar: "الميزانية الحالية", zh: "当前预算" })}</span><div className="bar"><i className="fw-b1" style={{ width: "100%" }} /></div><span className="fv">SAR 17.37B</span></div>
        <div className="fw-fr"><span className="fl">{tr({ en: "Planned (to date)", ar: "الخطة حتى تاريخه", zh: "计划(至今)" })}</span><div className="bar"><i className="fw-b2" style={{ width: "92%" }} /></div><span className="fv">SAR 15.98B</span></div>
        <div className="fw-fr"><span className="fl">{tr({ en: "Actual spend", ar: "الإنفاق الفعلي", zh: "实际支出" })}</span><div className="bar"><i className="fw-b3" style={{ width: "64%" }} /></div><span className="fv">SAR 11.12B</span></div>
        <div className="fw-fr"><span className="fl">{tr({ en: "Remaining", ar: "المتبقي", zh: "剩余" })}</span><div className="bar"><i className="fw-b4" style={{ width: "36%" }} /></div><span className="fv">SAR 6.25B</span></div>
        <div className="fw-fsum"><div><div className="v">64%</div><div className="l">{tr({ en: "Execution", ar: "التنفيذ", zh: "执行" })}</div></div><div><div className="v">70%</div><div className="l">{tr({ en: "vs plan", ar: "مقابل الخطة", zh: "vs 计划" })}</div></div><div><div className="v">SAR 6.25B</div><div className="l">{tr({ en: "Remaining", ar: "المتبقي", zh: "剩余" })}</div></div></div>
      </div></div>
    </div>
    <div className="dw-sec">{tr({ en: "Performance Scorecard", ar: "بطاقة أداء", zh: "绩效记分卡" })}</div>
    <div className="fw-score">
      <div className="fw-sc"><div className="h">{tr({ en: "Budget Execution Rate", ar: "معدل التنفيذ", zh: "预算执行率" })}<span className="dw-st watch">WATCH</span></div><div className="big">64<span className="u">%</span></div><div className="tl">{tr({ en: "target 95% · −31pp", ar: "الهدف 95% · −31", zh: "目标 95% · 差 31pp" })}</div></div>
      <div className="fw-sc"><div className="h">{tr({ en: "Execution vs Plan", ar: "التنفيذ مقابل الخطة", zh: "执行 vs 计划" })}<span className="dw-st over">BEHIND</span></div><div className="big" style={{ color: "#dc2626" }}>70<span className="u">%</span></div><div className="tl">{tr({ en: "plan 15.98B · −4.86B", ar: "الخطة 15.98 · −4.86", zh: "计划 15.98B · −4.86B" })}</div></div>
      <div className="fw-sc"><div className="h">{tr({ en: "Remaining Unspent", ar: "غير المصروف", zh: "未支出" })}<span className="dw-st ok">ON HAND</span></div><div className="big">36<span className="u">%</span></div><div className="tl">{tr({ en: "SAR 6.25B available", ar: "6.25 مليار متاح", zh: "SAR 6.25B 可用" })}</div></div>
    </div>
    <div className="dw-two">
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Execution rate by Amanah", ar: "معدل التنفيذ حسب الأمانة", zh: "按阿玛纳的执行率" })}<span className="pm">{tr({ en: "ministry avg 64%", ar: "متوسط 64%", zh: "全局均值 64%" })}</span></div><div className="dw-pb" style={{ paddingTop: 14 }}>
        {[["Riyadh-East", 58, "58%", true], ["Jeddah-Port", 61, "61%", true], ["Dammam-Ind.", 64, "64%", false], ["Makkah-North", 70, "70%", false], ["Madinah-Cent.", 75, "75%", false]].map((b, i) => (<div className="dw-bar" key={i}><span className="an">{b[0]}</span><div className="at"><i style={{ width: b[1] + "%", background: b[3] ? "#dc2626" : "#1b8354" }} /></div><span className="av" style={b[3] ? { color: "#dc2626" } : {}}>{b[2]}</span></div>))}
      </div></div>
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Spend Trajectory · Planned vs Actual", ar: "مسار الإنفاق", zh: "支出轨迹 · 计划 vs 实际" })}</div><div className="dw-pb">
        <svg width="100%" height="160" viewBox="0 0 420 160" preserveAspectRatio="none"><line x1="0" y1="42" x2="420" y2="42" stroke="#f0b4ad" strokeDasharray="4 4" /><polyline points="0,140 70,120 140,100 210,80 280,62 350,50 420,42" stroke="#c7d2e8" strokeWidth="2.5" fill="none" /><polyline points="0,140 70,126 140,114 210,102 280,92 350,84 420,78" stroke="#dc2626" strokeWidth="2.5" fill="none" /><circle cx="280" cy="92" r="4" fill="#dc2626" /></svg>
        <div style={{ fontSize: 10.5, color: "#6b7280", marginTop: 6 }}><span style={{ color: "#c7d2e8", fontWeight: 800 }}>━</span> {tr({ en: "Planned", ar: "مخطط", zh: "计划" })} &nbsp; <span style={{ color: "#dc2626", fontWeight: 800 }}>━</span> {tr({ en: "Actual · below plan", ar: "فعلي · دون الخطة", zh: "实际 · 低于计划" })}</div>
      </div></div>
    </div>
    <div className="dw-pend">
      <div className="pt">⚑ {tr({ en: "Executive commentary · sign-off", ar: "تعليق تنفيذي · اعتماد", zh: "执行评述 · 签核" })}<span className="conf">AI 90%</span></div>
      <h3>{tr({ en: "Approve acceleration plan for lagging budget execution", ar: "اعتماد خطة تسريع التنفيذ المتأخر", zh: "批准滞后执行的加速计划" })}</h3>
      <p>{tr({ en: "Execution at 64% vs 95% target · SAR 4.86B behind plan. Riyadh-East & Jeddah-Port lag most. Acceleration plan pending sign-off before FY-end.", ar: "التنفيذ 64% مقابل 95% · 4.86 مليار خلف الخطة. الرياض-شرق وجدة الأكثر تأخراً.", zh: "执行 64% vs 目标 95% · 落后计划 4.86B。利雅得-东与吉达最滞后;加速计划待签核。" })}</p>
      <DwActions buttons={[{ label: { en: "Authorize", ar: "اعتماد", zh: "批准" }, cls: "p", confirm: { en: "Authorized · routed for sign-off", ar: "اعتُمد · أُرسل للتوقيع", zh: "已批准 · 已转交签核" } }, { label: { en: "Defer", ar: "تأجيل", zh: "延后" }, cls: "warn", confirm: { en: "Deferred", ar: "أُجّل", zh: "已延后" } }, { label: { en: "Request info", ar: "طلب معلومات", zh: "索取信息" }, cls: "ghost", confirm: { en: "Information requested", ar: "طُلبت معلومات", zh: "已索取信息" } }]} />
    </div>
  </div>);
}

/* ======= Audit — workspace (Archetype C · oversight) ======= */
function AuditWorkspace() {
  const { tr, setAlertsOpen } = useStore();
  return (<div className="fade ws-page">
    <div className="dw-hd"><div><div className="dw-eyebrow g">{tr({ en: "Department Workspace · oversight", ar: "مساحة عمل · رقابة", zh: "部门工作区 · 监督" })}</div><h1 className="dw-h1">{tr({ en: "Audit Department", ar: "إدارة التدقيق", zh: "审计部" })}</h1></div><div className="dw-live"><SyncBadge />{SHOW_UC ? " · UC-03 (+UC-02)" : ""}</div></div>
    <div className="dw-sub">{tr({ en: "Mandate: smart query, audit log & permissions + deviation oversight (UC-03/UC-02). Workspace — oversight type: collaboration via inbound feeds (not a Business Plaza) + findings queue + remediation clock + audit log.", ar: "المهمة: الاستعلام الذكي وسجل التدقيق + الرقابة على الانحرافات. مساحة العمل — نوع رقابي عبر التغذية الواردة.", zh: "职责:智能查询、审计日志与权限 + 偏差监督(UC-03/UC-02)。Workspace — 监督型:协作靠各 UC「馈入」而非 Business Plaza,含发现队列 + 整改时钟 + 审计日志。" })}</div>
    <SmartQueryFab scope={{ en: "Scope: Audit · cross-department read-only", ar: "النطاق: التدقيق · للقراءة عبر الإدارات", zh: "范围:审计 · 跨部门只读" }} prompts={[{ en: "Who approved the AO-2207 surplus?", ar: "من اعتمد فائض AO-2207؟", zh: "谁批准了 AO-2207 结余?" }, { en: "All SAP ↔ Etimad diffs this quarter", ar: "كل فروق ساب↔اعتماد هذا الربع", zh: "本季度全部 SAP↔Etimad 差异" }, { en: "Findings overdue beyond SLA", ar: "النتائج المتأخرة عن SLA", zh: "超 SLA 的发现" }]} />
    <div className="dw-kpis">
      <div className="dw-kpi"><div className="l">{tr({ en: "Open Findings", ar: "نتائج مفتوحة", zh: "未结发现" })}</div><div className="v">12</div><div className="d down">▲ +3 this week</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Critical / High", ar: "حرج / مرتفع", zh: "严重 / 高" })}</div><div className="v red">2 / 4</div><div className="d down">1 SLA breach</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Avg Resolution", ar: "متوسط الحل", zh: "平均处置" })}</div><div className="v">8 d</div><div className="d up">▼ −1 QoQ</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Audit Coverage", ar: "تغطية التدقيق", zh: "审计覆盖" })}</div><div className="v">86%</div><div className="d">{tr({ en: "target 90%", ar: "الهدف 90%", zh: "目标 90%" })}</div></div>
    </div>
    <div className="al-inbound" style={{ marginBottom: 16 }}><span className="al-inlab">{tr({ en: "Findings inbound from", ar: "نتائج واردة من", zh: "发现来自" })}</span>
      <span className="al-feeder uc13">UC-13 <span className="n">3</span></span><span className="al-feeder uc12">UC-12 <span className="n">2</span></span><span className="al-feeder uc14">UC-14 <span className="n">2</span></span><span className="al-feeder uc12">UC-09 <span className="n">2</span></span><span className="al-feeder uc11">UC-11 <span className="n">1</span></span><span className="al-feeder sys">{tr({ en: "System", ar: "النظام", zh: "系统" })} <span className="n">2</span></span>
    </div>
    <div className="dw-two">
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Findings & Exceptions queue", ar: "قائمة النتائج والاستثناءات", zh: "发现与异常队列" })}<span className="pm">{tr({ en: "by severity & age", ar: "حسب الخطورة", zh: "按严重度·时效" })}</span></div><div className="dw-pb" style={{ paddingTop: 4 }}>
        {[["uc12", "UC-12", "crit", "AO-2207 idle surplus not disclosed", "Critical", "1d"], ["uc12", "UC-09", "high", "SAP ↔ Etimad reconciliation diff · SAR 25M", "High", "3h"], ["uc13", "UC-13", "high", "Duplicate invoice INV-4471", "High", "6h"], ["uc14", "UC-14", "med", "Impairment not flagged timely", "Medium", "2d"], ["uc11", "UC-11", "med", "Memo missing legal-basis reference", "Medium", "1d"]].map((f, i) => (<div className="al-alert" key={i} onClick={() => setAlertsOpen(true)}><div className={"al-sevbar " + f[2]} /><div className="al-main"><div className="al-t"><span className={"al-uc " + f[0]}>{f[1]}</span> {f[3]}</div></div><span className={"al-risk " + f[2]}>{f[4]}</span><span className="al-age">{f[5]}</span></div>))}
      </div></div>
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Remediation clock · AO-2207", ar: "ساعة المعالجة · AO-2207", zh: "整改时钟 · AO-2207" })}</div><div className="dw-pb">
        <div className="aud-clock"><div className="big">36<span className="u">h</span></div><div className="l">{tr({ en: "to deadline · SLA 48h", ar: "للموعد · SLA 48", zh: "距截止 · SLA 48h" })}</div></div>
        <div className="aud-stage done"><span className="b">✓</span><div>{tr({ en: "Detected & triaged", ar: "رُصد وصُنّف", zh: "已检出并分诊" })}</div><span className="when">−12h</span></div>
        <div className="aud-stage done"><span className="b">✓</span><div>{tr({ en: "Owner assigned · Cost Mgmt", ar: "تعيين مسؤول", zh: "已指派 · 成本管理" })}</div><span className="when">−8h</span></div>
        <div className="aud-stage cur"><span className="b">3</span><div>{tr({ en: "Remediation in progress", ar: "المعالجة جارية", zh: "整改进行中" })}</div><span className="when">now</span></div>
        <div className="aud-stage todo"><span className="b">4</span><div>{tr({ en: "Evidence & verification", ar: "الأدلة والتحقق", zh: "证据与核验" })}</div><span className="when">+24h</span></div>
        <div className="aud-stage todo"><span className="b">5</span><div>{tr({ en: "Closure & sign-off", ar: "الإغلاق", zh: "结案签核" })}</div><span className="when">+36h</span></div>
      </div></div>
    </div>
    <div className="dw-two">
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Findings by area", ar: "النتائج حسب المجال", zh: "按领域的发现" })}<span className="pm">{tr({ en: "open · quarter", ar: "مفتوحة", zh: "未结·本季" })}</span></div><div className="dw-pb" style={{ paddingTop: 14 }}>
        {[["Cost Management", 100, "4"], ["Revenue Collection", 75, "3"], ["Accounting", 50, "2"], ["Asset Management", 50, "2"], ["Compliance", 25, "1"]].map((b, i) => (<div className="dw-bar" key={i}><span className="an">{b[0]}</span><div className="at"><i style={{ width: b[1] + "%", background: "#dc2626" }} /></div><span className="av">{b[2]}</span></div>))}
      </div></div>
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Audit log · recent", ar: "سجل التدقيق", zh: "审计日志 · 最近" })}<span className="pm">UC-03</span></div><div className="dw-pb" style={{ paddingTop: 10 }}>
        {[["16:48", "Finding raised · AO-2207 · from UC-12"], ["15:10", "Evidence attached · INV-4471 · 2 files"], ["14:02", "Access granted · reviewer · Cost · read-only"], ["11:30", "Finding closed · Eastern permit spike · A"]].map((l, i) => (<div className="aud-log" key={i}><span className="lt">{l[0]}</span><div>{l[1]}</div></div>))}
      </div></div>
    </div>
    <div className="dw-pend red">
      <div className="pt">⚑ {tr({ en: "Escalation · audit authorization", ar: "تصعيد · تفويض", zh: "升级 · 审计授权" })}<span className="conf">AI 92%</span></div>
      <h3>{tr({ en: "Escalate AO-2207 idle-surplus finding to Executive Office", ar: "تصعيد نتيجة AO-2207 إلى المكتب التنفيذي", zh: "将 AO-2207 闲置结余发现升级至执行办公室" })}</h3>
      <p>{tr({ en: "Critical control gap · SLA breached · overlaps UC-12 fund disclosure. Recommend executive escalation with 48h remediation.", ar: "فجوة رقابية حرجة · تجاوز SLA.", zh: "严重控制缺口 · 超 SLA · 与 UC-12 资金披露同源;建议执行升级 + 48h 整改。" })}</p>
      <DwActions buttons={[{ label: { en: "Authorize escalation", ar: "اعتماد التصعيد", zh: "批准升级" }, cls: "p", confirm: { en: "Escalation authorized · routed to Exec Office", ar: "اعتُمد التصعيد", zh: "已批准升级 · 转交执行办公室" } }, { label: { en: "Defer", ar: "تأجيل", zh: "延后" }, cls: "warn red", confirm: { en: "Deferred", ar: "أُجّل", zh: "已延后" } }, { label: { en: "Request info", ar: "طلب معلومات", zh: "索取信息" }, cls: "ghost", confirm: { en: "Information requested", ar: "طُلبت معلومات", zh: "已索取信息" } }]} />
    </div>
  </div>);
}

/* ======= Budget Execution — workspace (Archetype B) ======= */
function BudgetExecWorkspace() {
  const { tr, setRoute, setDeptSub, setBackRoute } = useStore();
  const openWb = () => { setBackRoute("buwork"); setDeptSub("budexec"); setRoute("budexec"); };
  return (<div className="fade ws-page">
    <div className="dw-hd"><div><div className="dw-eyebrow g">{tr({ en: "Department Workspace", ar: "مساحة عمل الإدارة", zh: "部门工作区" })}</div><h1 className="dw-h1">{tr({ en: "Budget Execution Department", ar: "إدارة تنفيذ الميزانية", zh: "预算执行部" })}</h1></div><div className="dw-live"><SyncBadge />{SHOW_UC ? " · UC-07/06" : ""}</div></div>
    <div className="dw-sub">{tr({ en: "Mandate: budget execution, liquidity, transfers & spend tracking (UC-07/06). Workspace — analytical type: KPI + execution funnel + chapter tracking; drills into Budget Execution analysis.", ar: "المهمة: تنفيذ الميزانية والسيولة والمناقلات وتتبع الإنفاق. مساحة العمل — نوع تحليلي.", zh: "职责:预算执行、流动性、转移与支出跟踪(UC-07/06)。Workspace — 分析型:KPI + 执行漏斗 + 章节跟踪,下钻进预算执行分析。" })}</div>
    <SmartQueryFab scope={{ en: "Scope: Budget Execution · read-only", ar: "النطاق: تنفيذ الميزانية", zh: "范围:预算执行 · 只读" }} prompts={[{ en: "Which chapters are lagging execution?", ar: "ما الأبواب المتأخرة في التنفيذ؟", zh: "哪些章节执行滞后?" }, { en: "Is liquidity sufficient for Q3?", ar: "هل السيولة كافية للربع الثالث؟", zh: "Q3 流动性是否充足?" }, { en: "Propose a reallocation within ceilings", ar: "اقترح إعادة توزيع ضمن السقوف", zh: "在上限内提出重分配" }]} />
    <div className="dw-kpis">
      <div className="dw-kpi"><div className="l">{tr({ en: "Execution Rate", ar: "معدل التنفيذ", zh: "执行率" })}</div><div className="v">64.0%</div><div className="d down">▼ {tr({ en: "spent ÷ budget · tgt 95%", ar: "مصروف ÷ الميزانية · الهدف 95%", zh: "已花÷预算 · 目标95%" })}</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Liquidity", ar: "السيولة", zh: "流动性" })}</div><div className="v">SAR 1.2B</div><div className="d">{tr({ en: "available", ar: "متاح", zh: "可用" })}</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Transfers", ar: "المناقلات", zh: "转移" })}</div><div className="v">14</div><div className="d">3 {tr({ en: "pending", ar: "معلّقة", zh: "待批" })}</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Behind Plan", ar: "خلف الخطة", zh: "落后计划" })}</div><div className="v red">−SAR 4.86B</div><div className="d down">{tr({ en: "vs plan-to-date 15.98B", ar: "مقابل الخطة 15.98", zh: "vs 至今计划 15.98B" })}</div></div>
    </div>
    <div className="fw-sig">
      <div className="fw-hero">
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}><span className="fw-tag red">● {tr({ en: "EXECUTION LAG · BELOW PLAN", ar: "تأخر التنفيذ · دون الخطة", zh: "执行滞后 · 低于计划" })}</span><span className="fw-tag gray">{tr({ en: "Ministry · FY 2026", ar: "الوزارة · 2026", zh: "全部 · FY2026" })}</span></div>
        <h2>{tr({ en: "Spending is at ", ar: "الإنفاق عند ", zh: "支出仅达 " })}<b>64%</b>{tr({ en: " of the SAR 17.37B budget — SAR 4.86B behind the planned pace. Acceleration / reallocation recommended.", ar: " من ميزانية 17.37 مليار — 4.86 مليار خلف الخطة. يُوصى بالتسريع/إعادة التوزيع.", zh: " 17.37B 预算的 64% — 落后计划 4.86B。建议加速/重分配。" })}</h2>
        <div className="fw-hg"><div><div className="l">{tr({ en: "Execution", ar: "التنفيذ", zh: "执行" })}</div><div className="v">64%</div></div><div><div className="l">{tr({ en: "Behind plan", ar: "خلف الخطة", zh: "落后计划" })}</div><div className="v" style={{ color: "#dc2626" }}>SAR 4.86B</div></div><div><div className="l">{tr({ en: "Remaining", ar: "المتبقي", zh: "剩余" })}</div><div className="v">SAR 6.25B</div></div><div><div className="l">{tr({ en: "Liquidity", ar: "السيولة", zh: "流动性" })}</div><div className="v">SAR 1.2B</div></div></div>
        <DwActions buttons={[{ label: { en: "Open Budget Execution analysis", ar: "فتح تحليل تنفيذ الميزانية", zh: "打开预算执行分析" }, cls: "p", arrow: true, go: openWb }, { label: { en: "Acknowledge", ar: "إقرار", zh: "知悉" }, cls: "ghost", confirm: { en: "Acknowledged", ar: "تم الإقرار", zh: "已知悉" } }]} />
      </div>
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Execution Funnel · FY 2026", ar: "قمع التنفيذ · 2026", zh: "执行漏斗 · FY2026" })}</div><div className="dw-pb">
        <div className="fw-fr"><span className="fl">{tr({ en: "Current budget", ar: "الميزانية الحالية", zh: "当前预算" })}</span><div className="bar"><i className="fw-b1" style={{ width: "100%" }} /></div><span className="fv">SAR 17.37B</span></div>
        <div className="fw-fr"><span className="fl">{tr({ en: "Planned (to date)", ar: "الخطة حتى تاريخه", zh: "计划(至今)" })}</span><div className="bar"><i className="fw-b2" style={{ width: "92%" }} /></div><span className="fv">SAR 15.98B</span></div>
        <div className="fw-fr"><span className="fl">{tr({ en: "Actual spend", ar: "الإنفاق الفعلي", zh: "实际支出" })}</span><div className="bar"><i className="fw-b3" style={{ width: "64%" }} /></div><span className="fv">SAR 11.12B</span></div>
        <div className="fw-fr"><span className="fl">{tr({ en: "Remaining", ar: "المتبقي", zh: "剩余" })}</span><div className="bar"><i className="fw-b4" style={{ width: "36%" }} /></div><span className="fv">SAR 6.25B</span></div>
        <div className="fw-fsum"><div><div className="v">64%</div><div className="l">{tr({ en: "Execution", ar: "التنفيذ", zh: "执行" })}</div></div><div><div className="v">70%</div><div className="l">{tr({ en: "vs plan", ar: "مقابل الخطة", zh: "vs 计划" })}</div></div><div><div className="v">SAR 6.25B</div><div className="l">{tr({ en: "Remaining", ar: "المتبقي", zh: "剩余" })}</div></div></div>
      </div></div>
    </div>
    <div className="dw-pend">
      <div className="pt">⚑ {tr({ en: "Reallocation · approval", ar: "إعادة توزيع · اعتماد", zh: "重分配 · 审批" })}<span className="conf">AI 89%</span></div>
      <h3>{tr({ en: "Approve SAR 0.6B reallocation from Chapter 7 to Chapters 2 & 5", ar: "اعتماد إعادة توزيع 0.6 مليار من الباب 7 إلى 2 و5", zh: "批准从第 7 章向第 2、5 章重分配 SAR 0.6B" })}</h3>
      <p>{tr({ en: "Within ceilings · accelerates lagging chapters to recover the SAR 4.86B plan gap by FY-end.", ar: "ضمن السقوف · يسرّع الأبواب المتأخرة لسد فجوة 4.86 مليار قبل نهاية السنة.", zh: "在上限内 · 加速滞后章节,年末前弥补 4.86B 计划缺口。" })}</p>
      <DwActions buttons={[{ label: { en: "Authorize", ar: "اعتماد", zh: "批准" }, cls: "p", confirm: { en: "Authorized · routed for sign-off", ar: "اعتُمد · أُرسل للتوقيع", zh: "已批准 · 已转交签核" } }, { label: { en: "Defer", ar: "تأجيل", zh: "延后" }, cls: "warn", confirm: { en: "Deferred", ar: "أُجّل", zh: "已延后" } }, { label: { en: "Request info", ar: "طلب معلومات", zh: "索取信息" }, cls: "ghost", confirm: { en: "Information requested", ar: "طُلبت معلومات", zh: "已索取信息" } }]} />
    </div>
  </div>);
}

/* ======= Planning — workspace (Archetype B) ======= */
function PlanningWorkspace() {
  const { tr } = useStore();
  return (<div className="fade ws-page">
    <div className="dw-hd"><div><div className="dw-eyebrow g">{tr({ en: "Department Workspace", ar: "مساحة عمل الإدارة", zh: "部门工作区" })}</div><h1 className="dw-h1">{tr({ en: "Planning Department", ar: "إدارة التخطيط", zh: "规划部" })}</h1></div><div className="dw-live"><SyncBadge />{SHOW_UC ? " · UC-07 (+04/05)" : ""}</div></div>
    <div className="dw-sub">{tr({ en: "Mandate: budget planning, ceiling allocation & fiscal space (UC-07, +UC-04 forecasting, UC-05 scenarios). Workspace — analytical type: fiscal-space + forecast + scenario comparison.", ar: "المهمة: تخطيط الميزانية وتخصيص السقوف والحيّز المالي. مساحة العمل — نوع تحليلي.", zh: "职责:预算规划、上限分配与财政空间(UC-07,+UC-04 预测、UC-05 情景)。Workspace — 分析型:财政空间 + 预测 + 情景对比。" })}</div>
    <SmartQueryFab scope={{ en: "Scope: Planning · read-only", ar: "النطاق: التخطيط", zh: "范围:规划 · 只读" }} prompts={[{ en: "How much fiscal space is left?", ar: "كم الحيّز المالي المتبقي؟", zh: "还剩多少财政空间?" }, { en: "Compare the 3 budget scenarios", ar: "قارن السيناريوهات الثلاثة", zh: "对比 3 个预算情景" }, { en: "Which ceilings are near breach?", ar: "ما السقوف القريبة من التجاوز؟", zh: "哪些上限接近突破?" }]} />
    <div className="dw-kpis">
      <div className="dw-kpi"><div className="l">{tr({ en: "Fiscal Space", ar: "الحيّز المالي", zh: "财政空间" })}</div><div className="v">SAR 3.4B</div><div className="d">{tr({ en: "free of ceilings", ar: "خارج السقوف", zh: "上限外可用" })}</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Ceiling Utilization", ar: "استخدام السقوف", zh: "上限使用率" })}</div><div className="v">78%</div><div className="d">2 {tr({ en: "near breach", ar: "قرب التجاوز", zh: "接近突破" })}</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Forecast Accuracy", ar: "دقة التنبؤ", zh: "预测准确度" })}</div><div className="v">94%</div><div className="d up">▲ +2pp</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Open Scenarios", ar: "سيناريوهات", zh: "在评情景" })}</div><div className="v">3</div><div className="d">{tr({ en: "1 recommended", ar: "1 موصى", zh: "1 推荐" })}</div></div>
    </div>
    <div className="dw-two">
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Fiscal Space · build-up", ar: "الحيّز المالي · التكوين", zh: "财政空间 · 构成" })}</div><div className="dw-pb" style={{ paddingTop: 14 }}>
        {[["Projected revenue", 100, "SAR 9.4B", "#1b8354"], ["− Committed", 64, "SAR 6.0B", "#c7d2e8"], ["− Reserves", 21, "SAR 2.0B", "#c7d2e8"], ["= Free space", 36, "SAR 3.4B", "#7c3aed"]].map((b, i) => (<div className="dw-bar" key={i}><span className="an">{b[0]}</span><div className="at"><i style={{ width: b[1] + "%", background: b[3] }} /></div><span className="av">{b[2]}</span></div>))}
      </div></div>
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Scenarios · comparison", ar: "السيناريوهات · مقارنة", zh: "情景 · 对比" })}<span className="pm">UC-05</span></div><div className="dw-pb" style={{ paddingTop: 12 }}>
        <div className="fw-sc" style={{ marginBottom: 10, border: "1.5px solid #6d28d9", background: "#f5effe" }}><div className="h">{tr({ en: "Reallocation", ar: "إعادة توزيع", zh: "重分配" })} <span className="dw-st ok">{tr({ en: "RECOMMENDED", ar: "موصى", zh: "推荐" })}</span></div><div className="tl">{tr({ en: "Within ceilings · closes gap · +0 fiscal", ar: "ضمن السقوف · يغلق الفجوة", zh: "在上限内 · 弥合缺口 · 财政 +0" })}</div></div>
        <div className="fw-sc" style={{ marginBottom: 10 }}><div className="h">{tr({ en: "Expansion", ar: "توسّع", zh: "扩张" })} <span className="dw-st over">CAP RISK</span></div><div className="tl">{tr({ en: "Faster delivery · +SAR 1.1B · cap risk", ar: "أسرع · خطر السقف", zh: "更快交付 · +SAR 1.1B · 上限风险" })}</div></div>
        <div className="fw-sc"><div className="h">{tr({ en: "Status quo", ar: "الوضع الراهن", zh: "维持现状" })} <span className="dw-st watch">GAP</span></div><div className="tl">{tr({ en: "No change · gap remains", ar: "بلا تغيير · تبقى الفجوة", zh: "不变 · 缺口仍在" })}</div></div>
      </div></div>
    </div>
    <div className="dw-pend">
      <div className="pt">⚑ {tr({ en: "Scenario · approval", ar: "سيناريو · اعتماد", zh: "情景 · 审批" })}<span className="conf">AI 91%</span></div>
      <h3>{tr({ en: "Adopt the reallocation scenario for FY 2026", ar: "اعتماد سيناريو إعادة التوزيع للسنة 2026", zh: "采用 FY 2026 重分配情景" })}</h3>
      <p>{tr({ en: "Closes the priority-spending gap within ceilings with no extra fiscal cost.", ar: "يغلق فجوة الإنفاق ضمن السقوف دون كلفة إضافية.", zh: "在上限内弥合优先支出缺口,无额外财政成本。" })}</p>
      <DwActions buttons={[{ label: { en: "Adopt", ar: "اعتماد", zh: "采用" }, cls: "p", confirm: { en: "Scenario adopted", ar: "اعتُمد السيناريو", zh: "已采用情景" } }, { label: { en: "Defer", ar: "تأجيل", zh: "延后" }, cls: "warn", confirm: { en: "Deferred", ar: "أُجّل", zh: "已延后" } }, { label: { en: "Compare in workbench", ar: "قارن", zh: "工作台对比" }, cls: "ghost", confirm: { en: "Sent to workbench for comparison", ar: "أُرسل للمقارنة", zh: "已转工作台对比" } }]} />
    </div>
  </div>);
}

/* ======= Financial Entitlements — workspace (Archetype A) ======= */
function EntitlementsWorkspace() {
  const { tr, setAlertsOpen } = useStore();
  return (<div className="fade ws-page">
    <div className="dw-hd"><div><div className="dw-eyebrow g">{tr({ en: "Department Workspace", ar: "مساحة عمل الإدارة", zh: "部门工作区" })}</div><h1 className="dw-h1">{tr({ en: "Financial Entitlements Department", ar: "إدارة الاستحقاقات المالية", zh: "财务权益部" })}</h1></div><div className="dw-live"><SyncBadge />{SHOW_UC ? " · UC-08" : ""}</div></div>
    <div className="dw-sub">{tr({ en: "Mandate: contracts, claims, disbursements & entitlements (UC-08). Workspace — operating type: disbursement pipeline + claims matching + approval; hands off to Accounting & Audit.", ar: "المهمة: العقود والمطالبات والصرف والاستحقاقات (UC-08). مساحة العمل — نوع تشغيلي.", zh: "职责:合同、索赔、拨付与权益(UC-08)。Workspace — 运营型:拨付管线 + 索赔匹配 + 审批,交付给会计与审计。" })}</div>
    <SmartQueryFab scope={{ en: "Scope: Entitlements · read-only", ar: "النطاق: الاستحقاقات", zh: "范围:财务权益 · 只读" }} prompts={[{ en: "Which claims lack completion evidence?", ar: "ما المطالبات بلا إثبات إنجاز؟", zh: "哪些索赔缺完工证明?" }, { en: "What is pending disbursement today?", ar: "ما المستحق للصرف اليوم؟", zh: "今天待拨付多少?" }, { en: "Show claims breaching SLA", ar: "المطالبات المتجاوزة لـ SLA", zh: "超 SLA 的索赔" }]} />
    <div className="dw-kpis">
      <div className="dw-kpi"><div className="l">{tr({ en: "Active Claims", ar: "مطالبات نشطة", zh: "在办索赔" })}</div><div className="v">42</div><div className="d">7 {tr({ en: "this week", ar: "هذا الأسبوع", zh: "本周" })}</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Pending Disbursement", ar: "صرف معلّق", zh: "待拨付" })}</div><div className="v">SAR 320M</div><div className="d">18 {tr({ en: "claims", ar: "مطالبة", zh: "笔" })}</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "On-time Rate", ar: "في الوقت", zh: "按时率" })}</div><div className="v">91%</div><div className="d up">▲ +1.5pp</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Exceptions", ar: "استثناءات", zh: "例外" })}</div><div className="v red">5</div><div className="d down">2 {tr({ en: "no evidence", ar: "بلا إثبات", zh: "缺证" })}</div></div>
    </div>
    <div className="dw-two">
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Disbursement Pipeline", ar: "خط الصرف", zh: "拨付管线" })}</div><div className="dw-pb">
        <div className="fw-fr"><span className="fl">{tr({ en: "Claims", ar: "مطالبات", zh: "索赔" })}</span><div className="bar"><i className="fw-b1" style={{ width: "100%" }} /></div><span className="fv">42</span></div>
        <div className="fw-fr"><span className="fl">{tr({ en: "Verified", ar: "مُتحقّق", zh: "已核验" })}</span><div className="bar"><i className="fw-b2" style={{ width: "83%" }} /></div><span className="fv">35</span></div>
        <div className="fw-fr"><span className="fl">{tr({ en: "Approved", ar: "معتمد", zh: "已批准" })}</span><div className="bar"><i className="fw-b2" style={{ width: "67%" }} /></div><span className="fv">28</span></div>
        <div className="fw-fr"><span className="fl">{tr({ en: "Disbursed", ar: "مصروف", zh: "已拨付" })}</span><div className="bar"><i className="fw-b3" style={{ width: "55%" }} /></div><span className="fv">23</span></div>
        <div className="fw-fsum"><div><div className="v">SAR 320M</div><div className="l">{tr({ en: "Pending", ar: "معلّق", zh: "待拨" })}</div></div><div><div className="v">91%</div><div className="l">{tr({ en: "On-time", ar: "في الوقت", zh: "按时" })}</div></div><div><div className="v">5</div><div className="l">{tr({ en: "Exceptions", ar: "استثناءات", zh: "例外" })}</div></div></div>
      </div></div>
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Claims · focus list", ar: "المطالبات · قائمة التركيز", zh: "索赔 · 重点清单" })}<span className="pm">{tr({ en: "exceptions first", ar: "الاستثناءات أولاً", zh: "例外优先" })}</span></div><div className="dw-pb" style={{ paddingTop: 4 }}>
        {[["crit", "CLM-3411 · no completion evidence", "SAR 41M", "Critical"], ["high", "CLM-3402 · amount mismatch", "SAR 28M", "High"], ["med", "CLM-3398 · late submission", "SAR 12M", "Medium"], ["low", "CLM-3380 · routine review", "SAR 6M", "Low"]].map((f, i) => (<div className="al-alert" key={i} onClick={() => setAlertsOpen(true)}><div className={"al-sevbar " + f[0]} /><div className="al-main"><div className="al-t">{f[1]}</div></div><span className="av" style={{ fontWeight: 800, fontSize: 12, marginInlineEnd: 8 }}>{f[2]}</span><span className={"al-risk " + f[0]}>{f[3]}</span></div>))}
      </div></div>
    </div>
    <div className="dw-pend">
      <div className="pt">⚑ {tr({ en: "Disbursement batch · approval", ar: "دفعة صرف · اعتماد", zh: "拨付批次 · 审批" })}<span className="conf">AI 90%</span></div>
      <h3>{tr({ en: "Authorize disbursement batch (16 verified claims · SAR 268M)", ar: "اعتماد دفعة صرف (16 مطالبة · 268 مليون)", zh: "批准拨付批次(16 笔已核验 · SAR 268M)" })}</h3>
      <p>{tr({ en: "Excludes 2 claims lacking completion evidence (held for review).", ar: "باستثناء مطالبتين بلا إثبات إنجاز.", zh: "已排除 2 笔缺完工证明的索赔(留待复核)。" })}</p>
      <DwActions buttons={[{ label: { en: "Authorize", ar: "اعتماد", zh: "批准" }, cls: "p", confirm: { en: "Disbursement batch authorized", ar: "اعتُمدت دفعة الصرف", zh: "已批准拨付批次" } }, { label: { en: "Hold", ar: "تعليق", zh: "暂缓" }, cls: "warn", confirm: { en: "Held for review", ar: "عُلّق للمراجعة", zh: "已暂缓待复核" } }, { label: { en: "Review exceptions", ar: "مراجعة الاستثناءات", zh: "复核例外" }, cls: "ghost", go: () => setAlertsOpen(true) }]} />
    </div>
  </div>);
}

/* ======= Accounting — workspace (Archetype A) ======= */
function AccountingWorkspace() {
  const { tr, setRoute, setBackRoute } = useStore();
  return (<div className="fade ws-page">
    <div className="dw-hd"><div><div className="dw-eyebrow g">{tr({ en: "Department Workspace", ar: "مساحة عمل الإدارة", zh: "部门工作区" })}</div><h1 className="dw-h1">{tr({ en: "Accounting Department", ar: "إدارة المحاسبة", zh: "会计部" })}</h1></div><div className="dw-live"><SyncBadge />{SHOW_UC ? " · UC-09 (+11)" : ""}</div></div>
    <div className="dw-sub">{tr({ en: "Mandate: financial closing, reconciliation & settlements (UC-09, +UC-11 memos). Workspace — operating type: close stages + SAP↔Etimad reconciliation + adjusting entries.", ar: "المهمة: الإقفال المالي والتسوية والتسويات (UC-09). مساحة العمل — نوع تشغيلي.", zh: "职责:关账、对账与结算(UC-09,+UC-11 备忘)。Workspace — 运营型:关账阶段 + SAP↔Etimad 对账 + 调整分录。" })}</div>
    <SmartQueryFab scope={{ en: "Scope: Accounting · read-only", ar: "النطاق: المحاسبة", zh: "范围:会计 · 只读" }} prompts={[{ en: "What blocks the period close?", ar: "ما الذي يعيق الإقفال؟", zh: "什么阻碍期末关账?" }, { en: "Show the SAP↔Etimad differences", ar: "أظهر فروق ساب↔اعتماد", zh: "显示 SAP↔Etimad 差异" }, { en: "Draft the adjusting entries", ar: "صياغة قيود التسوية", zh: "起草调整分录" }]} />
    <div className="dw-kpis">
      <div className="dw-kpi"><div className="l">{tr({ en: "Close Progress", ar: "تقدّم الإقفال", zh: "关账进度" })}</div><div className="v">82%</div><div className="d up">{tr({ en: "on schedule", ar: "في الموعد", zh: "按计划" })}</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Reconciliation", ar: "المطابقة", zh: "对账率" })}</div><div className="v">98%</div><div className="d down">2 {tr({ en: "diffs", ar: "فروق", zh: "项差异" })}</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Adjusting Entries", ar: "قيود التسوية", zh: "调整分录" })}</div><div className="v">4</div><div className="d">{tr({ en: "proposed", ar: "مقترحة", zh: "待过账" })}</div></div>
      <div className="dw-kpi"><div className="l">{tr({ en: "Accounting Memos", ar: "مذكرات", zh: "会计备忘" })}</div><div className="v">1</div><div className="d down">{tr({ en: "needs review", ar: "للمراجعة", zh: "待复核" })}</div></div>
    </div>
    <div className="dw-two">
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Period Close · stages", ar: "الإقفال · مراحل", zh: "期末关账 · 阶段" })}<span className="pm">FY 2026 · Q2</span></div><div className="dw-pb">
        <div className="aud-stage done"><span className="b">✓</span><div>{tr({ en: "Pre-close checklist", ar: "قائمة ما قبل الإقفال", zh: "关账前清单" })}</div><span className="when">{tr({ en: "done", ar: "تم", zh: "完成" })}</span></div>
        <div className="aud-stage done"><span className="b">✓</span><div>{tr({ en: "Reconciliation (SAP ↔ Etimad)", ar: "المطابقة", zh: "对账(SAP↔Etimad)" })}</div><span className="when">98%</span></div>
        <div className="aud-stage cur"><span className="b">3</span><div>{tr({ en: "Adjusting entries", ar: "قيود التسوية", zh: "调整分录" })}</div><span className="when">now</span></div>
        <div className="aud-stage todo"><span className="b">4</span><div>{tr({ en: "Close period", ar: "إقفال الفترة", zh: "关闭期间" })}</div><span className="when">+1d</span></div>
        <div className="aud-stage todo"><span className="b">5</span><div>{tr({ en: "Financial statements", ar: "القوائم المالية", zh: "财务报表" })}</div><span className="when">+2d</span></div>
      </div></div>
      <div className="dw-panel"><div className="dw-ph">{tr({ en: "Reconciliation · SAP ↔ Etimad", ar: "المطابقة · ساب↔اعتماد", zh: "对账 · SAP↔Etimad" })}<span className="pm">2 {tr({ en: "open", ar: "مفتوح", zh: "未结" })}</span></div><div className="dw-pb" style={{ paddingTop: 4 }}>
        {[["high", "Esnad assignment · SAR +15M", "High"], ["high", "Tahseel revenue · SAR −12M", "High"], ["low", "Bank fees timing · SAR 0.4M", "Low"]].map((f, i) => (<div className="al-alert" key={i}><div className={"al-sevbar " + f[0]} /><div className="al-main"><div className="al-t">{f[1]}</div></div><span className={"al-risk " + f[0]}>{f[2]}</span></div>))}
        <div className="wb-kk" style={{ marginTop: 6 }}><span>{tr({ en: "Net difference", ar: "صافي الفرق", zh: "净差异" })}</span><b>SAR 25M</b></div>
      </div></div>
    </div>
    <div className="dw-pend">
      <div className="pt">⚑ {tr({ en: "Adjusting entries · approval", ar: "قيود التسوية · اعتماد", zh: "调整分录 · 审批" })}<span className="conf">AI 90%</span></div>
      <h3>{tr({ en: "Post 2 adjusting entries to clear SAR 25M reconciliation difference", ar: "ترحيل قيدي تسوية لإغلاق فرق 25 مليون", zh: "过账 2 项调整分录以清除 SAR 25M 对账差异" })}</h3>
      <p>{tr({ en: "Within tolerance · IPSAS-compliant · clears the pre-close checklist (UC-11 memo attached).", ar: "ضمن الحدود · متوافق IPSAS · يُغلق قائمة ما قبل الإقفال.", zh: "在容差内 · 符合 IPSAS · 清空关账前清单(附 UC-11 备忘)。" })}</p>
      <DwActions buttons={[{ label: { en: "Post entries", ar: "ترحيل", zh: "过账" }, cls: "p", confirm: { en: "Adjusting entries posted", ar: "رُحّلت القيود", zh: "已过账调整分录" } }, { label: { en: "Defer", ar: "تأجيل", zh: "延后" }, cls: "warn", confirm: { en: "Deferred", ar: "أُجّل", zh: "已延后" } }, { label: { en: "Open memo (UC-11)", ar: "فتح المذكرة", zh: "打开备忘(UC-11)" }, cls: "ghost", go: () => { setBackRoute("acctwork"); setRoute("compmemo"); } }]} />
    </div>
  </div>);
}

/* =========================================================================
   Reports
   ========================================================================= */
function Reports() {
  const { t, tr, reports, log } = useStore();
  const stMap = { pub: t("uc_pub"), appr: t("uc_appr"), review: t("uc_inrev") };
  return (<div className="fade">
    <PageHeader title={t("nav_reports")} sub={t("rep_sub")} />
    <Section title={t("nav_reports")}>
      {reports.length === 0 ? <div className="muted">{t("noReports")}</div>
        : (<table className="tbl"><thead><tr><th>{t("rep_title")}</th><th>{t("rep_cov")}</th><th>{t("rep_conf")}</th><th>{t("rep_time")}</th><th>{t("rep_ref")}</th></tr></thead>
          <tbody>{reports.map((r, i) => (<tr key={i}><td style={{ fontWeight: 600 }}>{t(r.name)} {r.status && <span className="tag" style={{ marginInlineStart: 6 }}>{stMap[r.status] || ""}</span>}</td><td>{tr(SCOPE)}</td><td>{r.conf === "—" ? "—" : r.conf + "%"}</td><td className="muted">{r.ts}</td><td className="wo">{r.ref}</td></tr>))}</tbody></table>)}
    </Section>
    <Section title={t("agentLog")}>{log.length === 0 ? <div className="muted">—</div>
      : (<div className="timeline">{log.slice(0, 12).map(e => (<div className="ev" key={e.id}><div style={{ fontSize: 12.5 }}><b className="mono" style={{ color: "var(--green-dark)" }}>{e.ts}</b> · {e.text}</div></div>))}</div>)}</Section>
  </div>);
}

/* =========================================================================
   App root
   ========================================================================= */
const Uc06App = React.lazy(() => import("./uc06/Uc06App.jsx"));
class EmbedErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(err) { return { err }; }
  componentDidCatch(err, info) { console.error("Embedded analysis crashed:", err, info); }
  render() {
    if (this.state.err) {
      return (<div style={{ padding: 32, fontSize: 14, color: "#b91c1c", maxWidth: 760, margin: "0 auto" }}>
        <div style={{ fontWeight: 800, marginBottom: 8 }}>This analysis view failed to render.</div>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#374151", background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 8, padding: 12 }}>{String((this.state.err && this.state.err.stack) || this.state.err)}</pre>
      </div>);
    }
    return this.props.children;
  }
}
function Shell() {
  const { t, tr, route, log, pushLog, lang, setRoute, setDeptSub, perfJump, setPerfJump, backRoute, setBackRoute, alertsOpen, setAlertsOpen } = useStore();
  useEffect(() => { const msgs = ["log_idle", "log_scan", "log_route"]; const id = setInterval(() => pushLog(msgs[Math.floor(Math.random() * msgs.length)]), 9000); return () => clearInterval(id); }, []);
  useEffect(() => { if (log.length === 0) pushLog("log_scan"); }, []);
  // count-up the big KPI numbers on each page (skips embedded UC-06 + reduced-motion)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setTimeout(() => {
      const els = document.querySelectorAll(".content .dw-kpi > .v, .content .kmbig, .content .wb-big");
      els.forEach(el => {
        if (el.dataset.cu || el.children.length) return;
        const raw = (el.textContent || "").trim();
        const m = raw.match(/^(\D*?)(-?\d[\d,]*(?:\.\d+)?)(.*)$/);
        if (!m) return;
        const pre = m[1], numStr = m[2], suf = m[3];
        const target = parseFloat(numStr.replace(/,/g, ""));
        if (!isFinite(target)) return;
        const dec = (numStr.split(".")[1] || "").length;
        el.dataset.cu = "1";
        const dur = 900, t0 = performance.now();
        const fmt = v => pre + (dec ? v.toFixed(dec) : Math.round(v).toLocaleString("en-US")) + suf;
        const step = now => {
          const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          el.textContent = fmt(target * e);
          if (p < 1) requestAnimationFrame(step); else { el.textContent = raw; }
        };
        requestAnimationFrame(step);
      });
    }, 90);
    return () => clearTimeout(id);
  }, [route]);
  // The embedded UC-06 module no longer mutates the global document direction,
  // but keep our own direction asserted whenever we leave the embedded routes.
  useEffect(() => { if (route !== "perf" && route !== "rcreports" && route !== "budexec") { document.documentElement.lang = lang; document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; } }, [route, lang]);
  // Ported colleague pages, driven by OUR sidebar (their own left menu hidden):
  //   perf      -> Financial Performance Analysis Department
  //   rcreports -> Revenue Collection Department (report registry)
  if (route === "perf" || route === "rcreports" || route === "budexec") {
    const sub = route === "rcreports" ? "revenueCollection" : route === "budexec" ? "budgetExecution" : "performanceAnalysis";
    const initTab = perfJump && perfJump.tab ? perfJump.tab : undefined;
    // When opened via a host deep-link (Open draft / Generate Executive Summary),
    // the embedded page's Back exits to the route the host recorded.
    const onBack = backRoute ? () => { const b = backRoute; setBackRoute(null); setDeptSub("revcol"); setRoute(b); } : undefined;
    return (<>
      <TopBar />
      <div className="shell" style={{ height: "calc(100vh - var(--topbar-h))", minHeight: 0, overflow: "hidden" }}>
        <Sidebar />
        <div className="uc06-root" style={{ flex: "1 1 auto", minWidth: 0, height: "100%", overflow: "hidden" }}>
          <React.Suspense fallback={<div style={{ padding: 40, fontSize: 15, color: "#4b5563" }}>Loading…</div>}>
            <EmbedErrorBoundary key={sub}>
              <Uc06App embedded subDept={sub} appLang={lang} initialTab={initTab} autoGenerate={!!(perfJump && perfJump.generate)} onBack={onBack} onConsumeJump={() => setPerfJump(null)} key={sub} />
            </EmbedErrorBoundary>
          </React.Suspense>
        </div>
      </div>
    </>);
  }
  let page = null;
  if (route === "hub") page = <Hub />;
  else if (route === "chat") page = <ChatAnalysis />;
  else if (route === "monitor") page = <Monitoring />;
  else if (route === "budget") page = <Storyline story={STORY_BUDGET} title={t("j_bud_n")} sub={t("j_bud_b")} />;
  else if (route === "claims") page = <Storyline story={STORY_CLAIMS} title={t("j_clm_n")} sub={t("j_clm_b")} />;
  else if (route === "planning") page = <Storyline story={STORY_PLANNING} title={t("j_plan_n")} sub={t("j_plan_b")} />;
  else if (route === "reporting") page = <Storyline story={STORY_REPORTING} title={t("j_rep_n")} sub={t("j_rep_b")} />;
  else if (route === "revassets") page = <Storyline story={STORY_REVENUE_ASSETS} title={t("j_rev_n")} sub={t("j_rev_b")} />;
  else if (route === "rcwork") page = <RcWorkspace />;
  else if (route === "rcbench") page = <RcWorkbench />;
  else if (route === "rcdata") page = <RcDataFlow />;
  else if (route === "rcdatav1") page = <RcDataFlowV1 />;
  else if (route === "aswork") page = <AssetsWorkspace />;
  else if (route === "asbench") page = <AssetsWorkbench />;
  else if (route === "csfunds") page = <CostFundsConsole />;
  else if (route === "compmemo") page = <ComplianceRuling />;
  else if (route === "alerts") page = <AlertsCenter />;
  else if (route === "fpawork") page = <FpaWorkspace />;
  else if (route === "audwork") page = <AuditWorkspace />;
  else if (route === "buwork") page = <BudgetExecWorkspace />;
  else if (route === "plnwork") page = <PlanningWorkspace />;
  else if (route === "entwork") page = <EntitlementsWorkspace />;
  else if (route === "acctwork") page = <AccountingWorkspace />;
  else if (route === "reports") page = <ReportHub />;
  else page = <Hub />;
  return (<><TopBar /><div className="shell"><Sidebar /><div className="content">{page}</div></div><AgentLog /><ReleaseNotes />
    {alertsOpen && <div className="al-overlay" onClick={() => setAlertsOpen(false)}>
      <div className="al-drawer" onClick={e => e.stopPropagation()}><AlertsCenter drawer onClose={() => setAlertsOpen(false)} /></div>
    </div>}
  </>);
}
const RELEASES = [
  { v: "v0.9", d: "2026-06-22", cur: true, items: {
    en: ["Orchestrator turned into a chat: type a request, watch the agent timeline run, then approve / return / view-diff in a human-in-the-loop review", "AI Narratives & Q&A answers in-place; Billing-Gap Focus List rows open a contract-specific Q&A", "New Multi-Agent Flow diagram (dataset & orchestration drill-down) with faithful connector lines", "Commentary Review workspace reframed; AI Co-pilot chat now returns optimized drafts", "Sidebar locked to the two live departments; clickable release notes added"],
    ar: ["تحوّل المنسّق إلى دردشة: اكتب طلباً، وشاهد الخط الزمني للوكلاء، ثم اعتمد / أعد / اعرض الفرق ضمن مراجعة بشرية", "السرد والأسئلة يجيب في مكانه؛ صفوف قائمة فجوة الفوترة تفتح أسئلة خاصة بالعقد", "مخطط تدفّق متعدد الوكلاء جديد بخطوط ربط دقيقة", "إعادة تأطير مساحة مراجعة التعليق؛ ومساعد الدردشة يعيد مسودات محسّنة", "تقييد القائمة الجانبية بالإدارتين الفعّالتين؛ وإضافة ملاحظات الإصدار القابلة للنقر"],
    zh: ["编排器改为聊天:输入请求→观看智能体时间线运行→在人工审批中批准/退回/查看差异", "AI 叙述与问答就地作答;开票缺口重点清单的每行可打开针对该合同的问答", "新增多智能体流程图(数据集与编排下钻),连线完整还原", "评述复核工作区重新加框;AI 副驾驶聊天返回优化后的草稿", "侧栏锁定为两个上线部门;新增可点击的更新日志"] } },
  { v: "v0.8", d: "2026-06-18", items: {
    en: ["Added the Analysis Workbench: filters, multi-agent panels, results and next steps", "Two-level flow: workspace → Start analysis → workbench", "Top KPI row and 65% / 35% Agent Plaza / Orchestrator layout"],
    ar: ["إضافة منصة التحليل: عوامل تصفية، لوحات متعددة الوكلاء، نتائج وخطوات تالية", "تدفّق من مستويين: مساحة العمل ← بدء التحليل ← المنصة", "صف مؤشرات علوي وتخطيط 65٪ / 35٪"],
    zh: ["新增分析工作台:筛选、多智能体面板、结果与后续步骤", "两级流程:工作区 → 开始分析 → 工作台", "顶部 KPI 指标行与 65% / 35% 的智能体广场 / 编排器布局"] } },
  { v: "v0.7", d: "2026-06-12", items: {
    en: ["Department-accordion sidebar with the G-06 downstream storyline", "Trilingual EN / AR / ZH with ?ln= and ?uc= URL toggles", "BRD-faithful 13 agents and 13 source systems"],
    ar: ["قائمة جانبية بأكورديون الإدارات مع مسار ج-06 اللاحق", "ثلاثية اللغة EN / AR / ZH مع مفاتيح ?ln= و ?uc=", "13 وكيلاً و13 نظام مصدر وفق وثيقة المتطلبات"],
    zh: ["部门手风琴侧栏与 G-06 下游故事线", "三语 EN / AR / ZH,支持 ?ln= 与 ?uc= URL 传参", "忠于 BRD 的 13 个智能体与 13 个源系统"] } },
];
function ReleaseNotes() {
  const { tr, lang } = useStore();
  const [open, setOpen] = useState(false);
  return (<><button className="buildstamp" onClick={() => setOpen(true)} title={tr({ en: "Release notes", ar: "ملاحظات الإصدار", zh: "更新日志" })}>build {BUILD_TIME} · {RELEASES[0].v}</button>
    {open && <div className="rn-overlay" onClick={() => setOpen(false)}>
      <div className="rn-modal" onClick={e => e.stopPropagation()}>
        <div className="rn-head"><b>{tr({ en: "Release Notes", ar: "ملاحظات الإصدار", zh: "更新日志" })}</b><button className="rn-x" onClick={() => setOpen(false)}>✕</button></div>
        <div className="rn-body">{RELEASES.map((r, i) => (<div className={"rn-rel" + (r.cur ? " cur" : "")} key={i}>
          <span className="rn-dot" />
          <div className="rn-rc"><div className="rn-vh"><span className="rn-v">{r.v}</span><span className="rn-d">{r.d}</span>{r.cur && <span className="rn-badge">{tr({ en: "current", ar: "الحالي", zh: "当前" })}</span>}</div>
            <ul>{(r.items[lang] || r.items.en).map((it, j) => <li key={j}>{it}</li>)}</ul></div>
        </div>))}</div>
      </div>
    </div>}
  </>);
}
function Root() { const { user } = useStore(); return user ? <Shell /> : <Login />; }
function App() { return (<StoreProvider><Root /></StoreProvider>); }
export default App;
