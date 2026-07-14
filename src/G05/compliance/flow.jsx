/* 合规部 (Compliance Department · compwork · UC-11) — flow data + wrapper.
   Verbatim from src/App.jsx. */
import React from "react";
import { DirectorateFlow } from "../shared.jsx";

const MF_G05_COMP = {
  back: "compwork", cw: 1010, ch: 600,
  title: { en: "Compliance Department — Multi-Agent Flow (G-05)", ar: "إدارة الامتثال — تدفّق متعدد الوكلاء (ج-05)", zh: "合规部 — 多智能体流程(G-05)" },
  subtitle: { en: "UC-11-centric · standards & policy inputs → compliance, policies & memos → compliance outputs · upstream UC-09, downstream UC-10, parallel UC-12/UC-14 · all outputs require specialist review before finalization", ar: "متمحور حول UC-11 · المدخلات المعيارية ← الامتثال والسياسات والمذكرات ← المخرجات · كل المخرجات تتطلب مراجعة المختص قبل الاعتماد", zh: "以 UC-11 为核心 · 准则与政策输入 → 合规/政策/备忘 → 合规输出 · 上游 UC-09、下游 UC-10、并行 UC-12/UC-14 · 所有输出定稿前均需专家复核" },
  src: { x: 14, y: 80, w: 204, h: 640, list: [
    { en: "IPSAS Standards", ar: "معايير IPSAS", zh: "IPSAS 准则" }, { en: "Comprehensive Guide", ar: "الدليل الشامل", zh: "综合指南" },
    { en: "Policies & Procedures", ar: "السياسات والإجراءات", zh: "政策与程序" }, { en: "Royal Orders", ar: "الأوامر الملكية", zh: "皇室令" },
    { en: "MoF Instructions", ar: "تعليمات المالية", zh: "财政部指示" }, { en: "Chart of Accounts", ar: "دليل الحسابات", zh: "会计科目表" },
    { en: "Previous Memos", ar: "المذكرات السابقة", zh: "历史备忘" },
    { en: "Accounting Cases", ar: "حالات محاسبية", zh: "会计案例" }, { en: "Audit Observations", ar: "ملاحظات التدقيق", zh: "审计观察" },
    { en: "New Policies & Standards", ar: "سياسات ومعايير جديدة", zh: "新政策与准则" },
    { en: "Amanat TB · journals · statements · reporting packages (Excel)", ar: "ميزان المراجعة والقيود والقوائم وحزم التقارير من الأمانات (إكسل)", zh: "阿玛纳试算表/分录/报表/报告包(Excel)" },
    { en: "Existing Excel compliance engine (mappings · rules · formulas)", ar: "محرك الامتثال الحالي في إكسل (مطابقات، قواعد، معادلات)", zh: "现有 Excel 合规引擎(映射表/规则/公式)" },
    { en: "12 accounting-cycle guides & working-paper templates", ar: "أدلة 12 دورة محاسبية وقوالب أوراق العمل", zh: "12 个会计周期流程指南与底稿模版" },
  ] },
  nodes: {
    uc11: { code: "UC-11", x: 460, y: 170, w: 320, h: 320, title: { en: "Compliance, Policies & Accounting Memos", ar: "الامتثال والسياسات والمذكرات المحاسبية", zh: "合规、政策与会计备忘" }, ags: ["comp", "repgen", "dataq"] },
  },
  del: { x: 1040, y: 120, w: 320, h: 432,
    head: { en: "Outputs", ar: "المخرجات", zh: "输出" },
    items: [
      { t: { en: "Compliance Reports", ar: "تقارير الامتثال", zh: "合规报告" }, d: { en: "compliance assessment", ar: "تقييم الامتثال", zh: "合规评估" } },
      { t: { en: "Accounting Memos", ar: "مذكرات محاسبية", zh: "会计备忘" }, d: { en: "position memos", ar: "مذكرات موقف", zh: "立场备忘" } },
      { t: { en: "Proposed Journal Entries", ar: "قيود مقترحة", zh: "建议分录" }, d: { en: "draft entries for review", ar: "قيود مسودة للمراجعة", zh: "待复核草稿分录" } },
      { t: { en: "Policy Gap Analysis", ar: "تحليل فجوات السياسات", zh: "政策差距分析" }, d: { en: "current vs required", ar: "الحالي مقابل المطلوب", zh: "现状 vs 要求" } },
      { t: { en: "Audit Response Drafts", ar: "مسودات الرد على التدقيق", zh: "审计回应草稿" }, d: { en: "responses to observations", ar: "ردود على الملاحظات", zh: "对观察项的回应" } },
    ],
    foot: { en: "All outputs require specialist review before finalization.", ar: "كل المخرجات تتطلب مراجعة المختص قبل الاعتماد.", zh: "所有输出定稿前均需专家复核。" },
  },
  edges: [
    { from: "src", fa: "R", to: "uc11", ta: "L", c: "g", t: { en: "Standards, policies, prior memos, accounting cases, audit observations", ar: "المعايير والسياسات والمذكرات السابقة والحالات وملاحظات التدقيق", zh: "准则、政策、历史备忘、会计案例、审计观察" } },
    { from: "uc11", fa: "R", to: "del", ta: "L", c: "o", t: { en: "Compliance reports, memos & outputs", ar: "تقارير الامتثال والمذكرات والمخرجات", zh: "合规报告、备忘与输出" } },
  ],
};
const FLOW_COMP = [
  { code: "UC-01", label: { en: "Unified data", ar: "بيانات موحّدة", zh: "统一数据" }, cls: "in" },
  { code: "UC-09", label: { en: "Closing & reconciliation", ar: "الإقفال والمطابقة", zh: "关账与对账" }, cls: "in" },
  { code: "UC-11", label: { en: "Compliance & memos", ar: "الامتثال والمذكرات", zh: "合规与备忘" }, cls: "focus", star: true },
  { code: "UC-12 / UC-14", label: { en: "Costs & assets", ar: "التكاليف والأصول", zh: "成本与资产" }, cls: "down" },
  { code: "UC-10", label: { en: "Reports & narrative", ar: "التقارير والسرد", zh: "报告与叙述" }, cls: "down" },
  { code: "UC-02 / UC-03", label: { en: "Alerts & smart query", ar: "التنبيهات والاستعلام", zh: "告警与智能查询" }, cls: "down" },
];
function FlowG05Comp() { return <DirectorateFlow flow={MF_G05_COMP} />; }
export { MF_G05_COMP, FLOW_COMP, FlowG05Comp };
