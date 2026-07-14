/* 会计部 — department workspace page (DeptWorkspace config + wrapper).
   Verbatim WS_CFG_ACCT from src/App.jsx. */
import React from "react";
import { DeptWorkspace } from "../shared.jsx";
import { PLAZA_G05 } from "../plazaG05.js";
import { FLOW_ACCT } from "./flow";

const WS_CFG_ACCT = {
  uc: "UC-09 (+11)", kpiTone: "violet", flow: FLOW_ACCT, plazaModel: PLAZA_G05, plazaSel: "uc09", flowRoute: "g05acctflow",
  title: { en: "Accounting Department", ar: "إدارة المحاسبة", zh: "会计部" },
  mandate: { en: "Mandate: financial closing, reconciliation & settlements (UC-09, +UC-11 memos). KPI metrics + Business Plaza for cross-dept hand-off + floating Smart Query.", ar: "المهمة: الإقفال المالي والتسوية والتسويات (UC-09). مؤشرات + ساحة الأعمال + استعلام ذكي عائم.", zh: "职责:关账、对账与结算(UC-09,+UC-11 备忘)。关键指标 + Business Plaza 跨部门协同 + 浮动智能查询。" },
  sqScope: { en: "Scope: Accounting · read-only", ar: "النطاق: المحاسبة", zh: "范围:会计 · 只读" },
  sqPrompts: [{ en: "What blocks the period close?", ar: "ما الذي يعيق الإقفال؟", zh: "什么阻碍期末关账?" }, { en: "Show the SAP↔Etimad differences", ar: "أظهر فروق ساب↔اعتماد", zh: "显示 SAP↔Etimad 差异" }, { en: "Draft the adjusting entries", ar: "صياغة قيود التسوية", zh: "起草调整分录" }],
  kpiSlides: [
    [
      { lab: { en: "Close Progress", ar: "تقدّم الإقفال", zh: "关账进度" }, v: "82%", d: { en: "pre-close checklist (UC-09)", ar: "قائمة ما قبل الإقفال (UC-09)", zh: "关账前清单(UC-09)" }, up: true },
      { lab: { en: "Reconciliation", ar: "المطابقة", zh: "对账率" }, v: "98%", d: { en: "matched · 2 diffs open", ar: "مطابق · فرقان", zh: "已匹配 · 2 项差异" } },
      { lab: { en: "Proposed Adjustments", ar: "قيود تسوية مقترحة", zh: "建议调整分录" }, v: "2", d: { en: "entries to post (UC-09)", ar: "قيود للترحيل (UC-09)", zh: "待过账(UC-09)" } },
      { lab: { en: "Accounting Memos", ar: "مذكرات محاسبية", zh: "会计备忘" }, v: "1", d: { en: "needs review (UC-11)", ar: "للمراجعة (UC-11)", zh: "待复核(UC-11)" } },
    ],
    [
      { lab: { en: "Unmatched Difference", ar: "الفرق غير المطابق", zh: "未匹配差异" }, v: "SAR 25M", d: { en: "Esnad +15M, Tahseel +10M", ar: "إسناد +15، تحصيل +10", zh: "Esnad +15M, Tahseel +10M" } },
      { lab: { en: "SAP ↔ Etimad Diffs", ar: "فروق ساب↔اعتماد", zh: "SAP↔Etimad 差异" }, v: "2", d: { en: "open items", ar: "بنود مفتوحة", zh: "未结项" } },
      { lab: { en: "Within Tolerance", ar: "ضمن الحدود", zh: "容差内" }, v: "Yes", d: { en: "bank fees 0.4M auto", ar: "رسوم بنكية 0.4 تلقائي", zh: "银行费 0.4M 自动" }, up: true },
      { lab: { en: "Days to Close", ar: "أيام للإقفال", zh: "距关账" }, v: "1 d", d: { en: "Q2 FY2026", ar: "الربع 2 2026", zh: "FY2026 Q2" } },
    ],
    [
      { lab: { en: "Diffs by Materiality", ar: "الفروق حسب الأهمية", zh: "按重要性差异" }, aging: [["Esnad", 60, "+15M"], ["Tahseel", 40, "+10M"], ["Bank", 5, "0.4M"]] },
      { lab: { en: "IPSAS Compliant", ar: "متوافق IPSAS", zh: "符合 IPSAS" }, v: "✓", d: { en: "entries validated (UC-11)", ar: "قيود مُتحقّقة (UC-11)", zh: "分录已校验(UC-11)" }, up: true },
      { lab: { en: "Observations", ar: "ملاحظات", zh: "观察项" }, v: "1", d: { en: "initial response drafted", ar: "رد أولي مُصاغ", zh: "已起草初步回应" } },
      { lab: { en: "Memo Pending", ar: "مذكرة معلّقة", zh: "待办备忘" }, v: "1", d: { en: "legal basis attached", ar: "الأساس القانوني مرفق", zh: "附法律依据" } },
    ],
  ],
  orch: {
    uc: "UC-09", run: "#9027", agent: { en: "Accounting agent", ar: "وكيل المحاسبة", zh: "会计智能体" },
    chips: ["scope: FY2026 Q2", "dept: close", "policy: IPSAS"],
    defaultPrompt: { en: "Identify what blocks the period close, reconcile the SAP↔Etimad differences, and draft the adjusting entries to clear the SAR 25M gap for approval.", ar: "حدّد ما يعيق إقفال الفترة، وسوِّ فروق ساب↔اعتماد، وصُغ قيود التسوية لإغلاق فرق 25 مليون للاعتماد.", zh: "识别阻碍期末关账的因素,对平 SAP↔Etimad 差异,并起草调整分录以清除 SAR 25M 差异供审批。" },
    startLog: { en: "Orchestrator started — reconciling SAP↔Etimad for period close (Q2)", ar: "بدأ المنسّق — مطابقة ساب↔اعتماد للإقفال", zh: "编排器已启动——为期末关账对平 SAP↔Etimad(Q2)" },
    reviewLog: { en: "Draft ready — 2 adjusting entries await accounting approval", ar: "المسودة جاهزة — قيدا تسوية بانتظار اعتماد المحاسبة", zh: "草稿就绪——2 项调整分录等待会计审批" },
    approveLog: { en: "Adjusting entries posted; pre-close checklist cleared", ar: "رُحّلت قيود التسوية؛ وأُغلقت قائمة ما قبل الإقفال", zh: "调整分录已过账;关账前清单已清空" },
    returnLog: { en: "Entries returned to the Accounting agent for rework", ar: "أُعيدت القيود لوكيل المحاسبة", zh: "分录已退回会计智能体重新处理" },
    prompts: [{ t: { en: "What blocks the close", ar: "ما الذي يعيق الإقفال", zh: "什么阻碍关账" }, s: { en: "open items", ar: "بنود مفتوحة", zh: "未结项" } }, { t: { en: "SAP↔Etimad differences", ar: "فروق ساب↔اعتماد", zh: "SAP↔Etimad 差异" }, s: { en: "net SAR 25M", ar: "صافي 25 مليون", zh: "净 SAR 25M" } }, { t: { en: "Draft adjusting entries", ar: "صياغة قيود التسوية", zh: "起草调整分录" }, s: { en: "clear the gap", ar: "أغلق الفرق", zh: "清除差异" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "pull ledgers", ar: "سحب الدفاتر", zh: "拉取总账" }, s: { en: "SAP & Etimad balances loaded · 0.7s", ar: "أرصدة ساب واعتماد · 0.7 ث", zh: "SAP 与 Etimad 余额加载 · 0.7s" } },
      { code: "UC-09", t: { en: "reconcile SAP ↔ Etimad", ar: "مطابقة ساب ↔ اعتماد", zh: "对平 SAP ↔ Etimad" }, s: { en: "98% matched · SAR 25M net diff", ar: "98% مطابق · فرق 25 مليون", zh: "匹配 98% · 净差 SAR 25M" } },
      { code: "UC-11", t: { en: "check policy & memo basis", ar: "فحص السياسة وأساس المذكرة", zh: "核查政策与备忘依据" }, s: { en: "IPSAS-compliant · within tolerance", ar: "متوافق IPSAS · ضمن الحدود", zh: "符合 IPSAS · 在容差内" } },
      { code: "UC-09", t: { en: "draft adjusting entries", ar: "صياغة قيود التسوية", zh: "起草调整分录" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
    ],
    reviewBody: { en: "Posting 2 adjusting entries to clear the SAR 25M reconciliation difference requires accounting approval before the period closes.", ar: "يتطلب ترحيل قيدي تسوية لإغلاق فرق المطابقة 25 مليون اعتماد المحاسبة قبل إقفال الفترة.", zh: "过账 2 项调整分录以清除 SAR 25M 对账差异,需会计审批后方可关账。" },
    approveLabel: { en: "Post entries", ar: "ترحيل القيود", zh: "过账分录" },
    approvedChip: { en: "Posted · pre-close checklist cleared", ar: "رُحّلت · أُغلقت قائمة ما قبل الإقفال", zh: "已过账 · 关账前清单已清空" },
    diff: [
      { k: "rem", t: { en: "Esnad assignment · SAR +15M unmatched", ar: "إسناد إسناد · +15 مليون غير مطابق", zh: "Esnad 派工 · SAR +15M 未匹配" } },
      { k: "add", t: { en: "Esnad assignment · adjusted", ar: "إسناد إسناد · مُسوّى", zh: "Esnad 派工 · 已调整" } },
      { k: "rem", t: { en: "Tahseel revenue · SAR +10M unmatched", ar: "إيراد تحصيل · +10 مليون غير مطابق", zh: "Tahseel 收入 · SAR +10M 未匹配" } },
      { k: "add", t: { en: "Tahseel revenue · adjusted", ar: "إيراد تحصيل · مُسوّى", zh: "Tahseel 收入 · 已调整" } },
    ],
    returnBody: { en: "Entries sent back to the Accounting agent. Edit the prompt and run again.", ar: "أُعيدت القيود لوكيل المحاسبة. عدّل الطلب وأعد التشغيل.", zh: "分录已退回会计智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Post 2 adjusting entries (clear SAR 25M)", ar: "ترحيل قيدي تسوية (إغلاق 25 مليون)", zh: "过账 2 项调整分录(清除 SAR 25M)" }, owner: "Nada Al-Shamrani", role: { en: "Accounting Lead", ar: "قائدة المحاسبة", zh: "会计负责人" }, phone: "+966 55 118 4420" },
      { act: { en: "Attach UC-11 memo & legal basis", ar: "إرفاق مذكرة UC-11 والأساس القانوني", zh: "附 UC-11 备忘与法律依据" }, owner: "Ibrahim Al-Faleh", role: { en: "Compliance Officer", ar: "مسؤول الامتثال", zh: "合规专员" }, phone: "+966 50 662 7781" },
      { act: { en: "Close period & issue statements", ar: "إقفال الفترة وإصدار القوائم", zh: "关闭期间并出具报表" }, owner: "Sami Al-Rashidi", role: { en: "Financial Controller", ar: "المراقب المالي", zh: "财务总监" }, phone: "+966 53 904 2216" },
    ],
  },
};
function AccountingWorkspace() { return <DeptWorkspace cfg={WS_CFG_ACCT} />; }
export { WS_CFG_ACCT, AccountingWorkspace };
