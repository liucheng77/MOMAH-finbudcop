/* 财务权益部 — department workspace page (DeptWorkspace config + wrapper).
   Verbatim WS_CFG_ENT from src/App.jsx. */
import React from "react";
import { DeptWorkspace } from "../shared.jsx";
import { PLAZA_G04 } from "../plazaG04.js";
import { FLOW_ENT } from "./flow";

const WS_CFG_ENT = {
  uc: "UC-08", kpiTone: "violet", flow: FLOW_ENT, plazaModel: PLAZA_G04, plazaSel: "uc08", flowRoute: "g04entflow",
  title: { en: "Financial Entitlements Department", ar: "إدارة الاستحقاقات المالية", zh: "财务权益部" },
  mandate: { en: "Mandate: supplier & contractor payments — shift from claim-triggered processing to know-before-it-arrives (UC-08). Annual payment plans vs Etimad actuals expose the next 4–8 weeks of liquidity gaps and trigger transfer / enhancement requests to Budget Execution.", ar: "المهمة: مدفوعات الموردين والمقاولين — التحول من المعالجة عند ورود المطالبة إلى المعرفة المسبقة وتجهيز السيولة (UC-08). مقارنة خطط الدفع السنوية بمدفوعات اعتماد الفعلية تكشف فجوات سيولة الأسابيع 4–8 القادمة وتُطلق طلبات مناقلة / تعزيز لتنفيذ الميزانية.", zh: "职责:供应商与承包商付款——从「索赔来了才处理」转向「索赔到来前先知道、先备资金」(UC-08)。以年度付款计划对比 Etimad 实际付款,提前暴露未来 4–8 周流动性缺口,并向预算执行部触发转移/增强请求。" },
  sqScope: { en: "Scope: Entitlements · read-only", ar: "النطاق: الاستحقاقات", zh: "范围:财务权益 · 只读" },
  sqPrompts: [{ en: "Expected claims vs available funds, next 4–8 weeks?", ar: "المطالبات المتوقعة مقابل الأموال المتاحة للأسابيع 4–8؟", zh: "未来 4–8 周预期索赔 vs 可用资金?" }, { en: "Where is plan vs actual payment variance largest?", ar: "أين أكبر انحراف بين خطة الدفع والفعلي؟", zh: "计划与实际付款偏差最大在哪里?" }, { en: "Which budget lines need a transfer or enhancement?", ar: "ما البنود التي تحتاج مناقلة أو تعزيزاً؟", zh: "哪些预算行需要转移或增强?" }],
  kpiSlides: [
    [
      { lab: { en: "Active Claims", ar: "مطالبات نشطة", zh: "在办索赔" }, v: "42", d: { en: "7 this week", ar: "7 هذا الأسبوع", zh: "本周 7" } },
      { lab: { en: "Net Due", ar: "صافي المستحق", zh: "净应付" }, v: "SAR 320M", d: { en: "18 claims pending", ar: "18 مطالبة معلّقة", zh: "18 笔待付" } },
      { lab: { en: "Matching Rate", ar: "نسبة المطابقة", zh: "匹配率" }, v: "83%", d: { en: "matched ÷ claims (35/42)", ar: "مطابقة ÷ مطالبات (35/42)", zh: "已匹配 ÷ 索赔(35/42)" } },
      { lab: { en: "Exceptions", ar: "استثناءات", zh: "例外" }, v: "5", d: { en: "2 missing justification", ar: "2 بلا مبرر", zh: "2 缺依据" } },
    ],
    [
      { lab: { en: "Verified", ar: "مُتحقّق", zh: "已核验" }, v: "35", d: { en: "of 42 claims", ar: "من 42", zh: "共 42 笔" } },
      { lab: { en: "Approved", ar: "معتمد", zh: "已批准" }, v: "28", d: { en: "ready to pay", ar: "جاهز للدفع", zh: "可付款" } },
      { lab: { en: "Disbursed", ar: "مصروف", zh: "已拨付" }, v: "23", d: { en: "this period", ar: "هذه الفترة", zh: "本期" } },
      { lab: { en: "Batch Ready", ar: "دفعة جاهزة", zh: "批次就绪" }, v: "SAR 268M", d: { en: "16 verified claims", ar: "16 مطالبة متحققة", zh: "16 笔已核验" } },
    ],
    [
      { lab: { en: "Expected Claims (wk 28–35)", ar: "المطالبات المتوقعة (أسابيع 28–35)", zh: "预期索赔(第28–35周)" }, v: "SAR 412M", d: { en: "from annual payment plans · 96 claims", ar: "من خطط الدفع السنوية · 96 مطالبة", zh: "来自年度付款计划 · 96 笔" } },
      { lab: { en: "Liquidity-Gap Lines", ar: "بنود بفجوة سيولة", zh: "流动性缺口预算行" }, v: "2", d: { en: "SAR 57M short vs SAP availability", ar: "عجز 57 مليون مقابل توافر ساب", zh: "对比 SAP 可用资金短缺 SAR 57M" } },
      { lab: { en: "Plan vs Actual Variance", ar: "انحراف الخطة عن الفعلي", zh: "计划 vs 实际偏差" }, v: "18%", d: { en: "template quality uneven across Amanat", ar: "تفاوت جودة القوالب بين الجهات", zh: "各方模版填报质量不一" } },
      { lab: { en: "Transfer Lead Time", ar: "زمن إنجاز المناقلة", zh: "转移办理时长" }, v: "9 d", d: { en: "target < 5 · was 1–2 weeks+", ar: "الهدف < 5 · كان 1–2 أسبوعاً+", zh: "目标 <5 天 · 原 1–2 周以上" } },
    ],
  ],
  orch: {
    live: true,
    uc: "UC-08", run: "#8033", agent: { en: "Entitlements agent", ar: "وكيل الاستحقاقات", zh: "权益智能体" },
    chips: ["scope: wk 28–35", "src: plan + Etimad + SAP", "policy: human gate"],
    defaultPrompt: { en: "How many claims are in the Financial Balance Program and what is their total value by responsible department?", ar: "ما عدد مطالبات برنامج التوازن المالي وإجمالي قيمتها حسب الإدارة المسؤولة؟", zh: "财政平衡计划共有多少笔索赔?按责任部门统计其总金额是多少?" },
    startLog: { en: "Orchestrator started — aligning payment plan ↔ Etimad actuals & forecasting claims", ar: "بدأ المنسّق — مطابقة خطة الدفع مع فعليات اعتماد والتنبؤ بالمطالبات", zh: "编排器已启动——对齐付款计划 ↔ Etimad 实际并预测索赔" },
    reviewLog: { en: "Draft ready — transfer / enhancement request (2 lines · SAR 57M) awaits approval", ar: "المسودة جاهزة — طلب المناقلة / التعزيز (بندان · 57 مليون) بانتظار الاعتماد", zh: "草稿就绪——转移/增强申请(2 行 · SAR 57M)等待审批" },
    approveLog: { en: "Request approved; Arabic note routed to Budget Execution (liquidity signal)", ar: "اعتُمد الطلب؛ أُرسلت المذكرة العربية لتنفيذ الميزانية (إشارة سيولة)", zh: "申请已批准;阿语说明已发送预算执行部(流动性信号)" },
    returnLog: { en: "Request returned to the Entitlements agent for rework", ar: "أُعيد الطلب لوكيل الاستحقاقات", zh: "申请已退回权益智能体重新处理" },
    prompts: [{ t: { en: "What is the total planned spending of the 2026 Housing Program?", ar: "ما إجمالي الإنفاق المخطط لبرنامج الإسكان لعام 2026؟", zh: "2026年住房计划支出计划总额是多少?" }, s: { en: "", ar: "", zh: "" } }, { t: { en: "Which 10 project codes have the highest planned 2026 spending in the Housing Program?", ar: "ما رموز المشاريع العشرة الأعلى في الإنفاق المخطط لعام 2026 ضمن برنامج الإسكان؟", zh: "住房计划中,2026年计划支出最高的10个项目代码是什么?" }, s: { en: "", ar: "", zh: "" } }, { t: { en: "Which housing project portfolio has the highest 2026 spending plan?", ar: "أي محفظة مشاريع إسكان لديها أعلى خطة إنفاق لعام 2026؟", zh: "哪个住房项目组合的2026年支出计划最高?" }, s: { en: "", ar: "", zh: "" } }],
    tlMeta: [
      { code: "UC-01", t: { en: "align plan ↔ Etimad export", ar: "مطابقة الخطة مع تصدير اعتماد", zh: "对齐付款计划 ↔ Etimad 导出" }, s: { en: "field mapping auto-detected · 1,240 rows · 0.7s", ar: "اكتشاف تلقائي للحقول · 1,240 صفاً · 0.7 ث", zh: "自动识别字段映射 · 1,240 行 · 0.7s" } },
      { code: "UC-08", t: { en: "compute plan vs actual variance", ar: "احتساب انحراف الخطة عن الفعلي", zh: "计算计划 vs 实际偏差" }, s: { en: "18% variance · top gaps by project & budget line", ar: "انحراف 18% · أكبر الفجوات حسب المشروع والبند", zh: "偏差 18% · 按项目与预算行排缺口" } },
      { code: "UC-08", t: { en: "forecast claims (wk 28–35)", ar: "توقع المطالبات (أسابيع 28–35)", zh: "预测索赔(第28–35周)" }, s: { en: "SAR 412M expected · 2 lines short SAR 57M vs SAP", ar: "412 مليون متوقعة · بندان بعجز 57 مليون", zh: "预期 SAR 412M · 2 行对 SAP 短缺 57M" } },
      { code: "UC-02", t: { en: "draft transfer / enhancement note", ar: "صياغة مذكرة المناقلة / التعزيز", zh: "起草转移/增强说明" }, s: { en: "Arabic draft · waits for human approval", ar: "مسودة عربية · بانتظار الاعتماد البشري", zh: "阿语草稿 · 等待人工审批" } },
    ],
    reviewBody: { en: "An Arabic transfer / enhancement request for 2 budget lines (SAR 57M, weeks 28–31) will be sent to Budget Execution — Entitlements review required before the liquidity signal is triggered.", ar: "سيُرسل طلب مناقلة / تعزيز بالعربية لبندين (57 مليون، الأسابيع 28–31) إلى تنفيذ الميزانية — تلزم مراجعة الاستحقاقات قبل إطلاق إشارة السيولة.", zh: "针对 2 条预算行(SAR 57M,第 28–31 周)的阿语转移/增强申请将发往预算执行部——触发流动性信号前需权益部审阅。" },
    approveLabel: { en: "Send to Budget Execution", ar: "إرسال لتنفيذ الميزانية", zh: "发送预算执行部" },
    approvedChip: { en: "Sent · liquidity signal triggered", ar: "أُرسل · أُطلقت إشارة السيولة", zh: "已发送 · 已触发流动性信号" },
    diff: [
      { k: "rem", t: { en: "line B-3402 · claim arrives, then scramble (1–2 wks)", ar: "B-3402 · تدبير السيولة بعد ورود المطالبة (1–2 أسبوع)", zh: "B-3402 · 索赔到达后再补资金(1–2 周)" } },
      { k: "add", t: { en: "line B-3402 · pre-funded before claims (wk 28–31)", ar: "B-3402 · سيولة مجهزة قبل المطالبات (أسابيع 28–31)", zh: "B-3402 · 索赔到达前完成备资(第28–31周)" } },
      { k: "rem", t: { en: "weekly PPT · manual Etimad → Excel → slides", ar: "تقرير أسبوعي · يدوي من اعتماد إلى إكسل إلى شرائح", zh: "周报 PPT · 手工 Etimad→Excel→幻灯片" } },
      { k: "add", t: { en: "weekly report · auto plan-vs-actual by Vision portfolio", ar: "تقرير أسبوعي · آلي حسب محافظ الرؤية", zh: "周报 · 按 Vision 组合自动生成计划vs实际" } },
    ],
    returnBody: { en: "Request sent back to the Entitlements agent. Edit the prompt and run again.", ar: "أُعيد الطلب لوكيل الاستحقاقات. عدّل الطلب وأعد التشغيل.", zh: "申请已退回权益智能体。请修改提示后重新运行。" },
    nextActions: [
      { act: { en: "Approve & send transfer request (2 lines · SAR 57M)", ar: "اعتماد وإرسال طلب المناقلة (بندان · 57 مليون)", zh: "批准并发送转移申请(2 行 · SAR 57M)" }, owner: "Latifa Al-Qahtani", role: { en: "Entitlements Lead", ar: "قائدة الاستحقاقات", zh: "权益负责人" }, phone: "+966 55 904 1182" },
      { act: { en: "Confirm expected claims with 3 Amanat (plan quality)", ar: "تأكيد المطالبات المتوقعة مع 3 أمانات (جودة الخطط)", zh: "与 3 个阿玛纳确认预期索赔(计划质量)" }, owner: "Bandar Al-Otaibi", role: { en: "Claims Officer", ar: "مسؤول المطالبات", zh: "索赔专员" }, phone: "+966 50 337 6650" },
      { act: { en: "Track Etimad Plus migration impact on exports", ar: "متابعة أثر انتقال اعتماد بلس على التصدير", zh: "跟踪 Etimad Plus 迁移对导出报表的影响" }, owner: "Mona Al-Harbi", role: { en: "Contracts Coordinator", ar: "منسقة العقود", zh: "合同协调员" }, phone: "+966 53 220 9914" },
    ],
  },
};

/* ---- Accounting Department (UC-09 +11) ---- */
function EntitlementsWorkspace() { return <DeptWorkspace cfg={WS_CFG_ENT} />; }
export { WS_CFG_ENT, EntitlementsWorkspace };
