/* 合规部 — department workspace page (DeptWorkspace config + wrapper).
   Verbatim WS_CFG_COMPLIANCE from src/App.jsx. */
import React from "react";
import { DeptWorkspace } from "../shared.jsx";
import { PLAZA_G05 } from "../plazaG05.js";
import { FLOW_COMP } from "./flow";

const WS_CFG_COMPLIANCE = {
  uc: "UC-11", kpiTone: "violet", flow: FLOW_COMP, plazaModel: PLAZA_G05, plazaSel: "uc11", flowRoute: "g05compflow",
  title: { en: "Compliance Department", ar: "إدارة الامتثال", zh: "合规部" },
  mandate: { en: "Mandate: IPSAS & public-sector compliance review of Ministry and Amanat statements (UC-11). Standardize inputs (TB, journals, statements, reporting packages), modernize the existing Excel compliance engine — not rewrite its logic — add traceability, and deepen transaction-level anomaly checks.", ar: "المهمة: مراجعة امتثال IPSAS لقوائم الوزارة والأمانات (UC-11): توحيد المدخلات (ميزان المراجعة، القيود، القوائم، حزم التقارير)، وتحديث محرك الامتثال الحالي في إكسل دون إعادة كتابة منطقه، وإضافة التتبع وفحوصات الشذوذ على مستوى المعاملات.", zh: "职责:对部里及各阿玛纳财务报表进行 IPSAS 与公共部门会计合规审查(UC-11)。标准化输入(试算表、分录、报表、报告包),现代化既有 Excel 合规引擎——不重写专业逻辑——增加可追溯性,并深入交易级异常检测。" },
  sqScope: { en: "Scope: Compliance · read-only", ar: "النطاق: الامتثال", zh: "范围:合规 · 只读" },
  sqPrompts: [{ en: "Suggest account mappings for this Amanah's TB", ar: "اقترح مطابقات الحسابات لميزان مراجعة هذه الأمانة", zh: "为这套阿玛纳试算表建议科目映射" }, { en: "Which accounts are one-sided or missing depreciation?", ar: "ما الحسابات أحادية الاتجاه أو بلا إهلاك؟", zh: "哪些科目长期单向借/贷或缺折旧分录?" }, { en: "Run the 4 compliance indicators for this period", ar: "شغّل مؤشرات الامتثال الأربعة لهذه الفترة", zh: "运行本期 4 项合规指标" }],
  kpiSlides: [
    [
      { lab: { en: "Open Memos", ar: "مذكرات مفتوحة", zh: "未结备忘" }, v: "3", d: { en: "1 needs sign-off", ar: "1 بانتظار التوقيع", zh: "1 待签核" } },
      { lab: { en: "IPSAS Findings", ar: "نتائج IPSAS", zh: "IPSAS 发现" }, v: "2", d: { en: "componentization gaps", ar: "فجوات المكوّنات", zh: "组件折旧缺口" } },
      { lab: { en: "Policy Conflicts", ar: "تعارضات السياسات", zh: "政策冲突" }, v: "1", d: { en: "useful-life · MEMO-1142", ar: "العمر الإنتاجي · MEMO-1142", zh: "使用年限 · MEMO-1142" } },
      { lab: { en: "Compliance Score", ar: "درجة الامتثال", zh: "合规评分" }, v: "94%", d: { en: "+2pp QoQ", ar: "+2 ربعياً", zh: "环比 +2pp" }, up: true },
    ],
    [
      { lab: { en: "Proposed Entries", ar: "قيود مقترحة", zh: "建议分录" }, v: "4", d: { en: "from UC-09 close", ar: "من إقفال UC-09", zh: "来自 UC-09 关账" } },
      { lab: { en: "Observations", ar: "ملاحظات", zh: "观察项" }, v: "5", d: { en: "2 responded", ar: "2 مُجاب عنها", zh: "2 已回应" } },
      { lab: { en: "Legal Docs Logged", ar: "وثائق قانونية", zh: "法律文档" }, v: "12", d: { en: "audit-traceable", ar: "قابلة للتدقيق", zh: "可审计追溯" } },
      { lab: { en: "Rulings Issued", ar: "قرارات صادرة", zh: "已出裁定" }, v: "2", d: { en: "this period", ar: "هذه الفترة", zh: "本期" } },
    ],
    [
      { lab: { en: "Mapping Coverage", ar: "تغطية المطابقة", zh: "科目映射覆盖率" }, v: "91%", d: { en: "TB accounts auto-mapped to unified CoA", ar: "مطابقة آلية لدليل الحسابات الموحّد", zh: "试算表科目自动映射至统一科目表" }, up: true },
      { lab: { en: "Dormant Accounts", ar: "حسابات ساكنة", zh: "静止科目" }, v: "14", d: { en: "should move monthly · static > 90d", ar: "يفترض تحركها شهرياً · ساكنة > 90 يوماً", zh: "应每月有动 · 静止>90天" } },
      { lab: { en: "Missing Depreciation", ar: "إهلاك مفقود", zh: "缺折旧分录" }, v: "6", d: { en: "asset classes with no entries", ar: "فئات أصول بلا قيود", zh: "资产类别无折旧分录" } },
      { lab: { en: "Engine Indicators", ar: "مؤشرات المحرك", zh: "引擎合规指标" }, v: "4/4", d: { en: "computed with lineage & docs", ar: "محسوبة مع التتبع والتوثيق", zh: "带追溯与文档计算完成" }, up: true },
    ],
  ],
  orch: {
    uc: "UC-11", run: "#1142", agent: { en: "Compliance Engine agent", ar: "وكيل محرك الامتثال", zh: "合规引擎智能体" },
    chips: ["scope: Amanah pkg", "engine: modernized", "policy: IPSAS + local"],
    defaultPrompt: { en: "Standardize the uploaded Amanah package (TB + journals + statements + reporting package), map accounts to the unified chart of accounts, run the modernized compliance engine (4 indicators), list transaction-level anomalies — one-sided accounts, missing depreciation, dormant accounts — and draft the working-paper memo for review.", ar: "وحّد حزمة الأمانة المرفوعة (ميزان المراجعة + القيود + القوائم + حزمة التقارير)، وطابق الحسابات مع الدليل الموحّد، وشغّل محرك الامتثال المحدّث (4 مؤشرات)، واسرد شذوذ مستوى المعاملات — حسابات أحادية الاتجاه، إهلاك مفقود، حسابات ساكنة — وصُغ مذكرة ورقة العمل للمراجعة.", zh: "标准化上传的阿玛纳文件包(试算表+分录+报表+报告包),映射至统一会计科目表,运行现代化合规引擎(4 项指标),列出交易级异常——单向借贷、缺折旧、静止科目——并起草工作底稿备忘供审阅。" },
    startLog: { en: "Orchestrator started — standardizing Amanah package & mapping accounts", ar: "بدأ المنسّق — توحيد حزمة الأمانة ومطابقة الحسابات", zh: "编排器已启动——标准化阿玛纳文件包并映射科目" },
    reviewLog: { en: "Draft ready — working paper (4 indicators · 28 anomalies) awaits sign-off", ar: "المسودة جاهزة — ورقة العمل (4 مؤشرات · 28 شذوذاً) بانتظار التوقيع", zh: "草稿就绪——工作底稿(4 指标 · 28 项异常)等待签核" },
    approveLog: { en: "Compliance approved the working paper; memo logged with lineage", ar: "اعتمد الامتثال ورقة العمل؛ سُجّلت المذكرة مع التتبع", zh: "合规已批准工作底稿;备忘已连同追溯记录归档" },
    returnLog: { en: "Working paper returned to the Compliance agent for rework", ar: "أُعيدت ورقة العمل لوكيل الامتثال", zh: "底稿已退回合规智能体重新处理" },
    prompts: [{ t: { en: "Standardize & map package", ar: "توحيد الحزمة ومطابقتها", zh: "标准化并映射文件包" }, s: { en: "TB → unified CoA", ar: "الميزان ← الدليل الموحّد", zh: "试算表 → 统一科目表" } }, { t: { en: "Run compliance engine", ar: "تشغيل محرك الامتثال", zh: "运行合规引擎" }, s: { en: "4 indicators · with lineage", ar: "4 مؤشرات · مع التتبع", zh: "4 项指标 · 带追溯" } }, { t: { en: "Find transaction anomalies", ar: "إيجاد شذوذ المعاملات", zh: "查找交易级异常" }, s: { en: "one-sided · no depreciation · dormant", ar: "أحادية · بلا إهلاك · ساكنة", zh: "单向 · 缺折旧 · 静止" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "standardize TB / journals / statements", ar: "توحيد الميزان والقيود والقوائم", zh: "标准化试算表/分录/报表" }, s: { en: "3 formats unified · 2,180 accounts · 0.8s", ar: "توحيد 3 صيغ · 2,180 حساباً · 0.8 ث", zh: "统一 3 种格式 · 2,180 科目 · 0.8s" } },
      { code: "UC-11", t: { en: "map accounts & run engine", ar: "مطابقة الحسابات وتشغيل المحرك", zh: "映射科目并运行引擎" }, s: { en: "91% auto-mapped · 4 indicators computed", ar: "مطابقة آلية 91% · حساب 4 مؤشرات", zh: "自动映射 91% · 计算 4 项指标" } },
      { code: "UC-02", t: { en: "scan transaction-level anomalies", ar: "فحص شذوذ مستوى المعاملات", zh: "扫描交易级异常" }, s: { en: "8 one-sided · 6 no-depreciation · 14 dormant", ar: "8 أحادية · 6 بلا إهلاك · 14 ساكنة", zh: "8 单向 · 6 缺折旧 · 14 静止" } },
      { code: "UC-11", t: { en: "draft working-paper memo", ar: "صياغة مذكرة ورقة العمل", zh: "起草工作底稿备忘" }, s: { en: "waits for human approval", ar: "بانتظار الاعتماد البشري", zh: "等待人工审批" } },
    ],
    reviewBody: { en: "The working-paper memo consolidates 4 compliance indicators and 28 transaction-level findings for this Amanah — compliance sign-off required before release to leadership / external audit.", ar: "تجمع مذكرة ورقة العمل 4 مؤشرات امتثال و28 نتيجة على مستوى المعاملات لهذه الأمانة — يلزم توقيع الامتثال قبل الإصدار للقيادة / التدقيق الخارجي.", zh: "工作底稿备忘汇总该阿玛纳 4 项合规指标与 28 项交易级发现——需合规签核后方可提交领导/外部审计。" },
    approveLabel: { en: "Approve working paper", ar: "اعتماد ورقة العمل", zh: "批准工作底稿" },
    approvedChip: { en: "Approved · memo logged with lineage", ar: "معتمد · سُجّلت مع التتبع", zh: "已批准 · 备忘带追溯归档" },
    diff: [
      { k: "rem", t: { en: "account mapping · manual Excel upkeep", ar: "مطابقة الحسابات · صيانة يدوية في إكسل", zh: "科目映射 · 人工维护 Excel" } },
      { k: "add", t: { en: "account mapping · versioned & documented (91% auto)", ar: "مطابقة الحسابات · مُوثّقة وذات إصدارات (91% آلياً)", zh: "科目映射 · 版本化+文档化(自动 91%)" } },
      { k: "rem", t: { en: "transaction review · not performed (no capacity)", ar: "مراجعة المعاملات · غير منفذة (نقص موارد)", zh: "交易级复核 · 无人力执行" } },
      { k: "add", t: { en: "transaction review · 28 findings, engine logic preserved", ar: "مراجعة المعاملات · 28 نتيجة مع الحفاظ على منطق المحرك", zh: "交易级复核 · 28 项发现,引擎逻辑保留" } },
    ],
    returnBody: { en: "Working paper sent back to the Compliance agent. Edit the prompt and run again.", ar: "أُعيدت ورقة العمل لوكيل الامتثال. عدّل الطلب وأعد التشغيل.", zh: "底稿已退回合规智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Sign off working paper & 4 indicators", ar: "توقيع ورقة العمل والمؤشرات الأربعة", zh: "签核工作底稿与 4 项指标" }, owner: "Huda Al-Faraj", role: { en: "Compliance Lead", ar: "قائدة الامتثال", zh: "合规负责人" }, phone: "+966 55 226 7781" },
      { act: { en: "Confirm mapping suggestions with the Amanah", ar: "تأكيد مقترحات المطابقة مع الأمانة", zh: "与该阿玛纳确认映射建议" }, owner: "Yousef Al-Harbi", role: { en: "Senior Accountant", ar: "محاسب أول", zh: "高级会计" }, phone: "+966 50 339 1264" },
      { act: { en: "Log rule changes into the governed rule set", ar: "تسجيل تغييرات القواعد في المجموعة المحوكمة", zh: "将规则变更纳入受治理规则集" }, owner: "Sara Al-Qahtani", role: { en: "Policy Officer", ar: "مسؤولة السياسات", zh: "政策专员" }, phone: "+966 53 884 2019" },
    ],
  },
};
function ComplianceWorkspace() { return <DeptWorkspace cfg={WS_CFG_COMPLIANCE} />; }
export { WS_CFG_COMPLIANCE, ComplianceWorkspace };
