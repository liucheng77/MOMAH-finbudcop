/* 财务报告部 — department workspace page (DeptWorkspace config + wrapper).
   Verbatim WS_CFG_REPORTING from src/App.jsx. */
import React from "react";
import { DeptWorkspace } from "../shared.jsx";
import { PLAZA_G05 } from "../plazaG05.js";
import { FLOW_REP } from "./flow";

const WS_CFG_REPORTING = {
  uc: "UC-10", kpiTone: "green", flow: FLOW_REP, plazaModel: PLAZA_G05, plazaSel: "uc10", flowRoute: "g05repflow",
  title: { en: "Financial Reporting Department", ar: "إدارة التقارير المالية", zh: "财务报告部" },
  mandate: { en: "Mandate: financial & administrative reports, narrative commentary & executive dashboards (UC-10). KPI metrics + Business Plaza for cross-dept hand-off + floating Smart Query.", ar: "المهمة: التقارير المالية والإدارية والتعليق السردي ولوحات المعلومات التنفيذية (UC-10). مؤشرات + ساحة الأعمال + استعلام ذكي عائم.", zh: "职责:财务与行政报告、叙述性评述与执行仪表盘(UC-10)。关键指标 + Business Plaza 跨部门协同 + 浮动智能查询。" },
  sqScope: { en: "Scope: Reporting · read-only", ar: "النطاق: التقارير", zh: "范围:财务报告 · 只读" },
  sqPrompts: [{ en: "What reports are in review?", ar: "ما التقارير قيد المراجعة؟", zh: "哪些报告在复核中?" }, { en: "Generate the quarterly narrative", ar: "إنشاء السرد الربعي", zh: "生成季度叙述" }, { en: "Prepare the executive summary", ar: "تجهيز الملخص التنفيذي", zh: "准备执行摘要" }],
  kpiSlides: [
    [
      { lab: { en: "Reports (period)", ar: "التقارير (الفترة)", zh: "本期报告" }, v: "7", d: { en: "Q2 FY2026", ar: "الربع 2 2026", zh: "FY2026 Q2" } },
      { lab: { en: "In Review", ar: "قيد المراجعة", zh: "复核中" }, v: "2", d: { en: "awaiting sign-off", ar: "بانتظار التوقيع", zh: "待签核" } },
      { lab: { en: "Approved / Issued", ar: "معتمد / صادر", zh: "已批准 / 已发布" }, v: "2", d: { en: "this period", ar: "هذه الفترة", zh: "本期" }, up: true },
      { lab: { en: "Drafts", ar: "مسودات", zh: "草稿" }, v: "3", d: { en: "auto-compiled", ar: "مجمّعة تلقائياً", zh: "自动汇编" } },
    ],
    [
      { lab: { en: "Executive Dashboards", ar: "لوحات تنفيذية", zh: "执行仪表盘" }, v: "1", d: { en: "leadership view", ar: "عرض القيادة", zh: "领导视图" } },
      { lab: { en: "Narrative Coverage", ar: "تغطية السرد", zh: "叙述覆盖" }, v: "100%", d: { en: "commentary on all KPIs", ar: "تعليق على كل المؤشرات", zh: "全部 KPI 有评述" }, up: true },
      { lab: { en: "Ad-hoc (NL)", ar: "حسب الطلب (لغة)", zh: "即席(自然语言)" }, v: "1", d: { en: "natural-language query", ar: "استعلام بلغة طبيعية", zh: "自然语言查询" } },
      { lab: { en: "Avg Turnaround", ar: "متوسط الإنجاز", zh: "平均周转" }, v: "2 d", d: { en: "request → draft", ar: "طلب ← مسودة", zh: "请求 → 草稿" } },
    ],
    [
      { lab: { en: "Reports by Status", ar: "التقارير حسب الحالة", zh: "按状态报告" }, aging: [["Issued", 100, "2"], ["Review", 50, "2"], ["Draft", 75, "3"]] },
      { lab: { en: "Sources Linked", ar: "مصادر مرتبطة", zh: "已链接来源" }, v: "6", d: { en: "traceable to UC-13/14/12/11/09/06", ar: "قابلة للتتبع", zh: "可追溯至各 UC" } },
      { lab: { en: "Auto-filled", ar: "تعبئة تلقائية", zh: "自动填充" }, v: "Yes", d: { en: "from approved data", ar: "من بيانات معتمدة", zh: "源自批准数据" }, up: true },
      { lab: { en: "On-time Issuance", ar: "الإصدار في الوقت", zh: "按时发布率" }, v: "96%", d: { en: "vs schedule", ar: "مقابل الجدول", zh: "对计划" }, up: true },
    ],
  ],
  orch: {
    uc: "UC-10", run: "#1100", agent: { en: "Reporting agent", ar: "وكيل التقارير", zh: "报告智能体" },
    chips: ["scope: Q2 2026", "dept: Reporting", "policy: templates"],
    defaultPrompt: { en: "Compile the G-06 quarterly report from approved sources, generate narrative commentary, and prepare the executive summary for review.", ar: "جمّع التقرير الربعي ج-06 من المصادر المعتمدة، وأنشئ التعليق السردي، وجهّز الملخص التنفيذي للمراجعة.", zh: "从批准来源汇编 G-06 季度报告,生成叙述性评述,并准备供复核的执行摘要。" },
    startLog: { en: "Orchestrator started — compiling quarterly report & commentary (UC-10)", ar: "بدأ المنسّق — تجميع التقرير الربعي والتعليق", zh: "编排器已启动——汇编季度报告与评述(UC-10)" },
    reviewLog: { en: "Draft ready — quarterly report & executive summary await sign-off", ar: "المسودة جاهزة — التقرير الربعي والملخص بانتظار التوقيع", zh: "草稿就绪——季度报告与执行摘要等待签核" },
    approveLog: { en: "Report approved and issued; executive summary published", ar: "اعتُمد التقرير وصدر؛ ونُشر الملخص التنفيذي", zh: "报告已批准并发布;执行摘要已发布" },
    returnLog: { en: "Report returned to the Reporting agent for rework", ar: "أُعيد التقرير لوكيل التقارير", zh: "报告已退回报告智能体重新处理" },
    prompts: [{ t: { en: "Compile quarterly report", ar: "تجميع التقرير الربعي", zh: "汇编季度报告" }, s: { en: "G-06 · Q2", ar: "ج-06 · ر2", zh: "G-06 · Q2" } }, { t: { en: "Generate narrative commentary", ar: "إنشاء التعليق السردي", zh: "生成叙述性评述" }, s: { en: "all KPIs", ar: "كل المؤشرات", zh: "全部 KPI" } }, { t: { en: "Prepare executive summary", ar: "تجهيز الملخص التنفيذي", zh: "准备执行摘要" }, s: { en: "leadership", ar: "للقيادة", zh: "面向领导" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "pull approved data", ar: "سحب البيانات المعتمدة", zh: "拉取批准数据" }, s: { en: "6 sources validated · 0.6s", ar: "6 مصادر مُتحقّقة · 0.6 ث", zh: "6 来源已校验 · 0.6s" } },
      { code: "UC-10", t: { en: "build report & dashboard", ar: "بناء التقرير ولوحة المعلومات", zh: "构建报告与仪表盘" }, s: { en: "tables & indicators auto-filled", ar: "جداول ومؤشرات تلقائية", zh: "表格与指标自动填充" } },
      { code: "UC-06", t: { en: "add narrative & alerts", ar: "إضافة السرد والتنبيهات", zh: "添加评述与告警" }, s: { en: "commentary + variances", ar: "تعليق + انحرافات", zh: "评述 + 偏差" } },
      { code: "UC-10", t: { en: "prepare executive summary", ar: "تجهيز الملخص التنفيذي", zh: "准备执行摘要" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
    ],
    reviewBody: { en: "The G-06 quarterly report and executive summary require sign-off before issuance (2 reports in review).", ar: "يتطلب التقرير الربعي ج-06 والملخص التنفيذي التوقيع قبل الإصدار (تقريران قيد المراجعة).", zh: "G-06 季度报告与执行摘要需签核后方可发布(2 份报告在复核中)。" },
    approveLabel: { en: "Approve & issue", ar: "اعتماد وإصدار", zh: "批准并发布" },
    approvedChip: { en: "Approved · report issued", ar: "معتمد · صدر التقرير", zh: "已批准 · 报告已发布" },
    diff: [
      { k: "rem", t: { en: "quarterly report · draft", ar: "التقرير الربعي · مسودة", zh: "季度报告 · 草稿" } },
      { k: "add", t: { en: "quarterly report · issued (PDF/Word)", ar: "التقرير الربعي · صادر", zh: "季度报告 · 已发布(PDF/Word)" } },
      { k: "rem", t: { en: "narrative commentary · missing", ar: "التعليق السردي · مفقود", zh: "叙述性评述 · 缺失" } },
      { k: "add", t: { en: "narrative commentary · generated", ar: "التعليق السردي · مُنشأ", zh: "叙述性评述 · 已生成" } },
    ],
    returnBody: { en: "Report sent back to the Reporting agent. Edit the prompt and run again.", ar: "أُعيد التقرير لوكيل التقارير. عدّل الطلب وأعد التشغيل.", zh: "报告已退回报告智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Approve & issue G-06 quarterly report", ar: "اعتماد وإصدار التقرير الربعي ج-06", zh: "批准并发布 G-06 季度报告" }, owner: "Maha Al-Subaie", role: { en: "Reporting Lead", ar: "قائدة التقارير", zh: "报告负责人" }, phone: "+966 55 901 3326" },
      { act: { en: "Publish executive summary to leadership", ar: "نشر الملخص التنفيذي للقيادة", zh: "向领导层发布执行摘要" }, owner: "Omar Al-Bishi", role: { en: "Narrative Officer", ar: "مسؤول السرد", zh: "叙述专员" }, phone: "+966 50 447 8852" },
      { act: { en: "Link sources & record issue log", ar: "ربط المصادر وتسجيل الإصدار", zh: "链接来源并记录发布日志" }, owner: "Nada Al-Otaibi", role: { en: "Reports Analyst", ar: "محللة التقارير", zh: "报告分析师" }, phone: "+966 53 220 6691" },
    ],
  },
};
function ReportingWorkspace() { return <DeptWorkspace cfg={WS_CFG_REPORTING} />; }
export { WS_CFG_REPORTING, ReportingWorkspace };
