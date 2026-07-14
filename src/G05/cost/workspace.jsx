/* 成本管理部 — department workspace page (DeptWorkspace config + wrapper).
   Verbatim WS_CFG_COST from src/App.jsx. */
import React from "react";
import { DeptWorkspace } from "../shared.jsx";
import { PLAZA_G05 } from "../plazaG05.js";
import { FLOW_COST } from "./flow";

const WS_CFG_COST = {
  uc: "UC-12", kpiTone: "violet", flow: FLOW_COST, plazaModel: PLAZA_G05, plazaSel: "uc12", flowRoute: "g05costflow",
  title: { en: "Cost Management Department", ar: "إدارة التكاليف", zh: "成本管理部" },
  mandate: { en: "Mandate: costs, assignment orders, unit cost & funds (UC-12). KPI metrics + Business Plaza for cross-dept hand-off + floating Smart Query.", ar: "المهمة: التكاليف وأوامر الإسناد وتكلفة الوحدة والصناديق (UC-12). مؤشرات + ساحة الأعمال + استعلام ذكي عائم.", zh: "职责:成本、派工单、单元成本与资金(UC-12)。关键指标 + Business Plaza 跨部门协同 + 浮动智能查询。" },
  sqScope: { en: "Scope: Cost & Funds · read-only", ar: "النطاق: التكاليف والصناديق", zh: "范围:成本与资金 · 只读" },
  sqPrompts: [{ en: "Why is AO-2207 surplus idle?", ar: "لماذا فائض AO-2207 خامل؟", zh: "AO-2207 结余为何闲置?" }, { en: "Which orders lack completion certificates?", ar: "ما الأوامر بلا شهادات إنجاز؟", zh: "哪些派工单缺完工证明?" }, { en: "Resolve the SAP ↔ Etimad difference", ar: "تسوية فرق ساب↔اعتماد", zh: "对平 SAP↔Etimad 差异" }],
  kpiSlides: [
    [
      { lab: { en: "Project Cost Allocated", ar: "تكلفة المشاريع الموزّعة", zh: "已分摊项目成本" }, v: "SAR 2.14B", d: { en: "across 1,780 units", ar: "على 1,780 وحدة", zh: "分摊至 1,780 单元" } },
      { lab: { en: "Idle Surplus", ar: "فائض خامل", zh: "闲置结余" }, v: "SAR 85M", d: { en: "AO-2207 · 120d no disb.", ar: "AO-2207 · 120 يوماً بلا صرف", zh: "AO-2207 · 120天无支付" } },
      { lab: { en: "Aged Orders (>90d)", ar: "أوامر متقادمة (>90ي)", zh: "逾期派工单 (>90天)" }, v: "9", d: { en: "missing certificates", ar: "بلا شهادات", zh: "缺完工证明" } },
      { lab: { en: "Match Rate", ar: "نسبة المطابقة", zh: "匹配率" }, v: "98%", d: { en: "SAP ↔ Etimad · 2% diff", ar: "ساب↔اعتماد · 2% فرق", zh: "SAP↔Etimad · 2% 差异" } },
    ],
    [
      { lab: { en: "Avg Unit Cost", ar: "متوسط تكلفة الوحدة", zh: "平均单元成本" }, v: "SAR 1.20M", d: { en: "land + build (UC-12)", ar: "أرض + إنشاء (UC-12)", zh: "土地+建造(UC-12)" } },
      { lab: { en: "Assignment Orders", ar: "أوامر الإسناد", zh: "派工单" }, v: "1,840", d: { en: "matched ↔ Etimad", ar: "مطابقة ↔ اعتماد", zh: "已匹配 ↔ Etimad" } },
      { lab: { en: "Funds Tracked", ar: "صناديق متتبَّعة", zh: "跟踪基金" }, v: "2", d: { en: "Industrial · Real-Estate", ar: "الصناعي · العقاري", zh: "工业 · 房地产" } },
      { lab: { en: "SAP↔Etimad Gap", ar: "فجوة ساب↔اعتماد", zh: "SAP↔Etimad 差额" }, v: "SAR 25M", d: { en: "2 reconciliation items", ar: "بندا مطابقة", zh: "2 项对账" } },
    ],
    [
      { lab: { en: "Idle Surplus by Fund", ar: "الفائض الخامل حسب الصندوق", zh: "按基金闲置结余" }, aging: [["Real-Estate", 100, "85M"], ["Industrial", 35, "30M"], ["Other", 10, "8M"]] },
      { lab: { en: "Releasable Now", ar: "قابل للإفراج الآن", zh: "可立即释放" }, v: "SAR 85M", d: { en: "AO-2207 · milestone met", ar: "AO-2207 · المرحلة منجزة", zh: "AO-2207 · 里程碑达成" }, up: true },
      { lab: { en: "Unblocked by Certs", ar: "يُفك بالشهادات", zh: "凭证释放" }, v: "SAR 60M", d: { en: "9 aged orders", ar: "9 أوامر متقادمة", zh: "9 个逾期派工单" } },
      { lab: { en: "Cost Alerts", ar: "تنبيهات التكلفة", zh: "成本告警" }, v: "1", d: { en: "dormant order (UC-02)", ar: "أمر خامل (UC-02)", zh: "休眠派工单(UC-02)" } },
    ],
  ],
  orch: {
    uc: "UC-12", run: "#1242", agent: { en: "Costs & Funds agent", ar: "وكيل التكاليف والصناديق", zh: "成本与资金智能体" },
    chips: ["scope: FY2026", "dept: Cost", "policy: Esnad/Etimad"],
    defaultPrompt: { en: "Match assignment orders to payment orders, flag idle surplus and missing completion certificates, and draft a fund-release note for review.", ar: "طابق أوامر الإسناد بأوامر الدفع، وحدّد الفائض الخامل والشهادات المفقودة، وصُغ مذكرة إفراج عن الأموال للمراجعة.", zh: "将派工单与付款单匹配,标记闲置结余与缺失完工证明,并起草供复核的资金释放说明。" },
    startLog: { en: "Orchestrator started — matching orders & tracing idle surplus (UC-12)", ar: "بدأ المنسّق — مطابقة الأوامر وتتبع الفائض الخامل", zh: "编排器已启动——匹配派工单并追溯闲置结余(UC-12)" },
    reviewLog: { en: "Draft ready — SAR 85M surplus release awaits fund-owner approval", ar: "المسودة جاهزة — الإفراج عن 85 مليون بانتظار اعتماد مالك الصندوق", zh: "草稿就绪——SAR 85M 结余释放等待基金所有者审批" },
    approveLog: { en: "Fund owner approved release; transfer routed for sign-off", ar: "اعتمد مالك الصندوق الإفراج؛ وأُرسل التحويل للتوقيع", zh: "基金所有者已批准释放;转账已转交签核" },
    returnLog: { en: "Release note returned to the Costs & Funds agent for rework", ar: "أُعيدت المذكرة لوكيل التكاليف", zh: "释放说明已退回成本与资金智能体重新处理" },
    prompts: [{ t: { en: "Match AO ↔ payment orders", ar: "مطابقة الأوامر ↔ الدفع", zh: "匹配派工单 ↔ 付款单" }, s: { en: "Esnad / Etimad / SAP", ar: "إسناد / اعتماد / ساب", zh: "Esnad / Etimad / SAP" } }, { t: { en: "Flag idle surplus & missing certs", ar: "رصد الفائض والشهادات المفقودة", zh: "标记闲置结余与缺证" }, s: { en: ">90 days", ar: "> 90 يوماً", zh: ">90 天" } }, { t: { en: "Draft fund-release note", ar: "صياغة مذكرة إفراج", zh: "起草资金释放说明" }, s: { en: "for review", ar: "للمراجعة", zh: "供复核" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "pull cost & order data", ar: "سحب بيانات التكلفة والأوامر", zh: "拉取成本与派工数据" }, s: { en: "1,840 orders ↔ Etimad · 0.9s", ar: "1,840 أمراً ↔ اعتماد · 0.9 ث", zh: "1,840 派工单 ↔ Etimad · 0.9s" } },
      { code: "UC-12", t: { en: "calculate unit / land cost", ar: "احتساب تكلفة الوحدة / الأرض", zh: "计算单元/地块成本" }, s: { en: "SAR 2.14B across 1,780 units", ar: "2.14 مليار على 1,780 وحدة", zh: "SAR 2.14B 分摊至 1,780 单元" } },
      { code: "UC-02", t: { en: "flag idle surplus & certs", ar: "رصد الفائض والشهادات", zh: "标记闲置结余与缺证" }, s: { en: "AO-2207 idle SAR 85M · 9 missing", ar: "AO-2207 خامل 85 مليون · 9 ناقصة", zh: "AO-2207 闲置 SAR 85M · 9 缺证" } },
      { code: "UC-12", t: { en: "draft fund-release note", ar: "صياغة مذكرة الإفراج", zh: "起草资金释放说明" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
    ],
    reviewBody: { en: "Releasing the SAR 85M idle surplus on AO-2207 requires fund-owner approval before the transfer is created.", ar: "يتطلب الإفراج عن فائض 85 مليون الخامل على AO-2207 اعتماد مالك الصندوق قبل إنشاء التحويل.", zh: "释放 AO-2207 上 SAR 85M 闲置结余需基金所有者审批后方可创建转账。" },
    approveLabel: { en: "Approve release", ar: "اعتماد الإفراج", zh: "批准释放" },
    approvedChip: { en: "Approved · surplus release routed", ar: "معتمد · أُرسل الإفراج", zh: "已批准 · 结余释放已转交" },
    diff: [
      { k: "rem", t: { en: "AO-2207 surplus · idle 120d", ar: "فائض AO-2207 · خامل 120 يوماً", zh: "AO-2207 结余 · 闲置 120 天" } },
      { k: "add", t: { en: "AO-2207 · SAR 85M released to fund", ar: "AO-2207 · إفراج 85 مليون للصندوق", zh: "AO-2207 · 释放 SAR 85M 至基金" } },
      { k: "rem", t: { en: "completion certificates · 9 missing", ar: "شهادات الإنجاز · 9 ناقصة", zh: "完工证明 · 9 缺失" } },
      { k: "add", t: { en: "completion certificates · chased (9 orders)", ar: "شهادات الإنجاز · متابعة (9 أوامر)", zh: "完工证明 · 已催办(9 派工单)" } },
    ],
    returnBody: { en: "Release note sent back to the Costs & Funds agent. Edit the prompt and run again.", ar: "أُعيدت المذكرة لوكيل التكاليف. عدّل الطلب وأعد التشغيل.", zh: "释放说明已退回成本与资金智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Approve SAR 85M idle-surplus release (AO-2207)", ar: "اعتماد الإفراج عن فائض 85 مليون (AO-2207)", zh: "批准 SAR 85M 闲置结余释放(AO-2207)" }, owner: "Khalid Al-Mutlaq", role: { en: "Cost Management Lead", ar: "قائد إدارة التكاليف", zh: "成本管理负责人" }, phone: "+966 55 412 9930" },
      { act: { en: "Chase 9 completion certificates (> 90d)", ar: "متابعة 9 شهادات إنجاز (> 90 يوماً)", zh: "催办 9 份完工证明(>90天)" }, owner: "Reem Al-Juhani", role: { en: "Funds Officer", ar: "مسؤولة الصناديق", zh: "资金专员" }, phone: "+966 50 771 4408" },
      { act: { en: "Resolve SAP↔Etimad SAR 25M mismatch", ar: "حل عدم تطابق ساب↔اعتماد 25 مليون", zh: "解决 SAP↔Etimad SAR 25M 差异" }, owner: "Tariq Al-Amri", role: { en: "Reconciliation Analyst", ar: "محلل المطابقة", zh: "对账分析师" }, phone: "+966 53 668 1175" },
    ],
  },
};
function CostWorkspace() { return <DeptWorkspace cfg={WS_CFG_COST} />; }
export { WS_CFG_COST, CostWorkspace };
