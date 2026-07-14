/* =========================================================================
   G-04 · 财务权益部专属工作台 — 参考规划部关键成本动因(Uc15Drivers)样式。
   -------------------------------------------------------------------------
   完全独立，不依赖 shared/ui.jsx。
   布局: 表单选择器 + 警示 + 三列结果面板 + 决策按钮
   ========================================================================= */
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useStore, Money } from "../shared/store.jsx";

const SHOW_UC = (() => { try { return new URLSearchParams(window.location.search).get("uc") === "true"; } catch (e) { return false; } })();  // mirror App.jsx: hide UC-xx codes unless ?uc=true
const BQ_POS = { up: { en: "UPSTREAM", ar: "منبع", zh: "上游" }, para: { en: "PARALLEL", ar: "متوازٍ", zh: "并行" }, down: { en: "DOWNSTREAM", ar: "المصب", zh: "下游" }, here: { en: "THIS", ar: "هذه", zh: "本环节" } };

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

function ucl(code, name) { return SHOW_UC ? code + " · " + name : name; }

export default function UcBenchG04({ cfg }) {
  const { tr, setRoute, backRoute, setBackRoute, pushLog, setAlertsOpen } = useStore();
  const [scopeVals, setScopeVals] = useState(cfg.scope ? cfg.scope.map(() => 0) : []);
  const [phase, setPhase] = useState("idle");
  const [dec, setDec] = useState(0);
  const [just, setJust] = useState("");
  const [openRow, setOpenRow] = useState(-1);
  const [activeTab, setActiveTab] = useState(0);
  const [searchClaimNo, setSearchClaimNo] = useState("");
  const [searchPaymentOrder, setSearchPaymentOrder] = useState("");
  const [searchPeriod, setSearchPeriod] = useState("");
  const [searchSettleType, setSearchSettleType] = useState("");
  const [searchAccount, setSearchAccount] = useState("");
  const [modalOpen, setModalOpen] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [adviceDrawer, setAdviceDrawer] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseLog, setParseLog] = useState([]);
  const [uploadedClaims, setUploadedClaims] = useState([]);
  const [parseSummary, setParseSummary] = useState(null);
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [liqState, setLiqState] = useState("idle");
  const [liqLog, setLiqLog] = useState([]);
  const [liqApproved, setLiqApproved] = useState(false);
  const [liqFiles, setLiqFiles] = useState({ plan: "", etimad: "" });
  const [ask, setAsk] = useState("");
  const [qa, setQa] = useState([]);
  const [qaOpen, setQaOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [showSugs, setShowSugs] = useState(false);
  const qaRef = useRef(null);
  const pkgFileRef = useRef(null);
  const planFileRef = useRef(null);
  const etimadFileRef = useRef(null);
  useEffect(() => { const el = qaRef.current; if (el) el.scrollTop = el.scrollHeight; }, [qa, thinking]);

  const UC_NAMES = {
    "UC-01": { en: "Data Integration & Quality", ar: "دمج البيانات وجودتها", zh: "财务数据整合与数据质量" },
    "UC-08": { en: "Contracts, Claims & Entitlements", ar: "العقود والمطالبات والحقوق", zh: "合同、索赔、拨付与权益" },
    "UC-09": { en: "Closing, Reconciliation & Settlement", ar: "إغلاق الحسابات والمطابقة والتسوية", zh: "财务关账、对账与结算" },
    "UC-10": { en: "Reports & Dashboards", ar: "التقارير واللوحات", zh: "报告与仪表盘" },
  };
  const ucName = UC_NAMES[cfg.uc] || { en: cfg.uc, ar: cfg.uc, zh: cfg.uc };

  const CONTRACT_DATA = [
    { claimNo: "CLM-2026-001", paymentOrder: "PO-2026-0801", contractNo: "CON-2025-A001", poNo: "PR-2025-1201", status: "已批准", reasonList: ["工程变更", "材料涨价"], completionCert: "COC-2026-001.pdf", qtyPlan: "85/100", claimAmount: "SAR 2.4M", penalty: "SAR 0.12M", sapStatus: { commitment: "SAR 2.5M", invoice: "SAR 2.4M", payment: "SAR 2.0M", balance: "SAR 0.4M", liquidity: "充足" }, systemAdvice: "批准", returnReason: "" },
    { claimNo: "CLM-2026-002", paymentOrder: "PO-2026-0802", contractNo: "CON-2025-A002", poNo: "PR-2025-1202", status: "审计中", reasonList: ["工期延误补偿"], completionCert: "COC-2026-002.pdf", qtyPlan: "92/100", claimAmount: "SAR 1.8M", penalty: "SAR 0", sapStatus: { commitment: "SAR 2.0M", invoice: "SAR 1.8M", payment: "SAR 1.5M", balance: "SAR 0.3M", liquidity: "充足" }, systemAdvice: "批准", returnReason: "" },
    { claimNo: "CLM-2026-003", paymentOrder: "PO-2026-0803", contractNo: "CON-2025-B001", poNo: "PR-2025-1301", status: "不完整", reasonList: ["资料不全"], completionCert: "", qtyPlan: "70/100", claimAmount: "SAR 3.2M", penalty: "SAR 0.24M", sapStatus: { commitment: "SAR 3.5M", invoice: "", payment: "SAR 1.0M", balance: "SAR 2.5M", liquidity: "不足" }, systemAdvice: "退回", returnReason: "缺少完工证书" },
    { claimNo: "CLM-2026-004", paymentOrder: "PO-2026-0804", contractNo: "CON-2025-B002", poNo: "PR-2025-1302", status: "新建", reasonList: ["正常进度款"], completionCert: "COC-2026-004.pdf", qtyPlan: "60/100", claimAmount: "SAR 4.1M", penalty: "SAR 0", sapStatus: { commitment: "SAR 5.0M", invoice: "SAR 4.1M", payment: "SAR 0", balance: "SAR 5.0M", liquidity: "充足" }, systemAdvice: "批准", returnReason: "" },
    { claimNo: "CLM-2026-005", paymentOrder: "PO-2026-0805", contractNo: "CON-2025-C001", poNo: "PR-2025-1401", status: "已审查", reasonList: ["最终结算"], completionCert: "COC-2026-005.pdf", qtyPlan: "100/100", claimAmount: "SAR 5.6M", penalty: "SAR 0", sapStatus: { commitment: "SAR 5.6M", invoice: "SAR 5.6M", payment: "SAR 5.6M", balance: "SAR 0", liquidity: "充足" }, systemAdvice: "完成", returnReason: "" },
  ];

  const CLAIM_DATA = [
    { claimNo: "CLM-2026-001", paymentOrder: "PO-2026-0801", contractNo: "CON-2025-A001", poNo: "PR-2025-1201", status: "已批准", reasonList: ["工程变更", "材料涨价"], completionCert: "COC-2026-001.pdf", qtyPlan: "85/100", claimAmount: "SAR 2.4M", penalty: "SAR 0.12M", sapStatus: { commitment: "SAR 2.5M", invoice: "SAR 2.4M", payment: "SAR 2.0M", balance: "SAR 0.4M", liquidity: "充足" }, systemAdvice: "批准", returnReason: "" },
    { claimNo: "CLM-2026-002", paymentOrder: "PO-2026-0802", contractNo: "CON-2025-A002", poNo: "PR-2025-1202", status: "审计中", reasonList: ["工期延误补偿"], completionCert: "COC-2026-002.pdf", qtyPlan: "92/100", claimAmount: "SAR 1.8M", penalty: "SAR 0", sapStatus: { commitment: "SAR 2.0M", invoice: "SAR 1.8M", payment: "SAR 1.5M", balance: "SAR 0.3M", liquidity: "充足" }, systemAdvice: "批准", returnReason: "" },
    { claimNo: "CLM-2026-003", paymentOrder: "PO-2026-0803", contractNo: "CON-2025-B001", poNo: "PR-2025-1301", status: "不完整", reasonList: ["资料不全"], completionCert: "", qtyPlan: "70/100", claimAmount: "SAR 3.2M", penalty: "SAR 0.24M", sapStatus: { commitment: "SAR 3.5M", invoice: "", payment: "SAR 1.0M", balance: "SAR 2.5M", liquidity: "不足" }, systemAdvice: "退回", returnReason: "缺少完工证书" },
  ];

  const PAYROLL_DATA = [
    { empNo: "EMP001", paymentOrder: "PO-2026-PR001", name: "张三", dept: "财务部", position: "高级会计师", bankAccount: "SA1234567890", baseSalary: "SAR 12,000", positionSalary: "SAR 3,000", performanceSalary: "SAR 2,400", overtime: "SAR 800", attendanceBonus: "SAR 500", otherSubsidy: "SAR 1,200", grossPay: "SAR 19,900", deduction: "SAR 2,100", netPay: "SAR 17,800", payDate: "2026-07-01", remark: "" },
    { empNo: "EMP002", paymentOrder: "PO-2026-PR002", name: "李四", dept: "审计部", position: "审计专员", bankAccount: "SA0987654321", baseSalary: "SAR 8,500", positionSalary: "SAR 2,000", performanceSalary: "SAR 1,700", overtime: "SAR 0", attendanceBonus: "SAR 500", otherSubsidy: "SAR 900", grossPay: "SAR 13,600", deduction: "SAR 1,400", netPay: "SAR 12,200", payDate: "2026-07-01", remark: "" },
    { empNo: "EMP003", paymentOrder: "PO-2026-PR003", name: "王五", dept: "权益部", position: "权益经理", bankAccount: "SA1122334455", baseSalary: "SAR 15,000", positionSalary: "SAR 4,000", performanceSalary: "SAR 3,000", overtime: "SAR 1,200", attendanceBonus: "SAR 500", otherSubsidy: "SAR 1,500", grossPay: "SAR 25,200", deduction: "SAR 2,700", netPay: "SAR 22,500", payDate: "2026-07-01", remark: "含Q2绩效奖金" },
    { empNo: "EMP004", paymentOrder: "PO-2026-PR004", name: "赵六", dept: "财务部", position: "出纳", bankAccount: "SA6677889900", baseSalary: "SAR 6,000", positionSalary: "SAR 1,500", performanceSalary: "SAR 1,200", overtime: "SAR 300", attendanceBonus: "SAR 500", otherSubsidy: "SAR 600", grossPay: "SAR 10,100", deduction: "SAR 1,100", netPay: "SAR 9,000", payDate: "2026-07-01", remark: "" },
  ];

  /* 支出汇总(合同 / 索赔 / 员工工资) — 显示在批量操作卡片上方 */
  const EXPENDITURE_DATA = [
    { paymentOrder: "PO-2026-0801", type: "合同", netPayable: "SAR 2.4M", paymentPlan: { en: "By progress (monthly)", ar: "حسب التقدّم (شهري)", zh: "按进度(月度)" }, disbursementOrder: "DIS-2026-0801", expenditureOrder: "EO-0801", contractNo: "CON-2025-A001", poNo: "PR-2025-1201", status: "已批准", reasonList: ["工程变更", "材料涨价"], completionCert: "COC-2026-001.pdf", qtyPlan: "85/100", claimAmount: "SAR 2.4M", penalty: "SAR 0.12M", sapStatus: { commitment: "SAR 2.5M", invoice: "SAR 2.4M", payment: "SAR 2.0M", balance: "SAR 0.4M", liquidity: "充足" }, systemAdvice: "批准", returnReason: "" },
    { paymentOrder: "PO-2026-0803", type: "索赔", netPayable: "SAR 3.2M", paymentPlan: { en: "One-off", ar: "دفعة واحدة", zh: "一次性" }, disbursementOrder: "DIS-2026-0803", expenditureOrder: "EO-0803", contractNo: "CON-2025-B001", poNo: "PR-2025-1301", status: "不完整", reasonList: ["资料不全"], completionCert: "", qtyPlan: "70/100", claimAmount: "SAR 3.2M", penalty: "SAR 0.24M", sapStatus: { commitment: "SAR 3.5M", invoice: "", payment: "SAR 1.0M", balance: "SAR 2.5M", liquidity: "不足" }, systemAdvice: "退回", returnReason: "缺少完工证书" },
    { paymentOrder: "PO-2026-PR001", type: "员工工资", netPayable: "SAR 17,800", paymentPlan: { en: "Monthly payroll", ar: "رواتب شهرية", zh: "月度薪资" }, disbursementOrder: "DIS-2026-PR001", expenditureOrder: "EO-PR001", contractNo: "-", poNo: "-", status: "已批准", reasonList: [], completionCert: "-", qtyPlan: "-", claimAmount: "-", penalty: "-", sapStatus: null, systemAdvice: "批准", returnReason: "" },
    { paymentOrder: "PO-2026-0805", type: "合同", netPayable: "SAR 5.6M", paymentPlan: { en: "Final settlement", ar: "تسوية نهائية", zh: "最终结算" }, disbursementOrder: "DIS-2026-0805", expenditureOrder: "EO-0805", contractNo: "CON-2025-C001", poNo: "PR-2025-1401", status: "已审查", reasonList: ["最终结算"], completionCert: "COC-2026-005.pdf", qtyPlan: "100/100", claimAmount: "SAR 5.6M", penalty: "SAR 0", sapStatus: { commitment: "SAR 5.6M", invoice: "SAR 5.6M", payment: "SAR 5.6M", balance: "SAR 0", liquidity: "充足" }, systemAdvice: "完成", returnReason: "" },
  ];

  const SETTLEMENT_DATA = [
    { period: "FY 2026 · Q2", settleType: "月度结算", accountScope: "所有项目", paymentOrder: "PO-2026-0601", contractNo: "CON-2025-A001", preStatus: { status: "通过", missingEntries: [], abnormalBalances: [], unsettledInvoices: [] }, sapDiff: { amount: "SAR 0", contractAmount: "SAR 2.5M", invoiceAmount: "SAR 2.5M", paymentAmount: "SAR 2.5M", diffType: "无差异", reason: "无差异" }, pendingOrders: 0, pendingOrdersList: [], settleAdvice: "批准结算", settleAdviceList: [{ item: "PO-2026-0601 全额结算", amount: "SAR 2.5M", basis: "SAP=Etimad 已对平 · 验证通过", action: "采纳" }], monthlyPlan: "已生成", finalAccount: "-" },
    { period: "FY 2026 · Q2", settleType: "月度结算", accountScope: "住房项目", paymentOrder: "PO-2026-0602", contractNo: "CON-2025-B001", preStatus: { status: "不通过", missingEntries: [{ item: "CON-2025-B001 缺完工证明(COC)", note: "阻塞结算" }, { item: "3 条发票缺失税率字段", note: "影响税额核算" }], abnormalBalances: [{ item: "科目 2310 余额异常 +SAR 0.3M", note: "待核查" }, { item: "预付款科目 2140 未摊销", note: "需补摊销" }], unsettledInvoices: [{ item: "INV-8821 未结算 (SAR 1.2M)", note: "超 30 天" }, { item: "INV-8845 未结算 (SAR 0.6M)", note: "待付款" }] }, sapDiff: { amount: "SAR 0.3M", contractAmount: "SAR 3.5M", invoiceAmount: "SAR 3.8M", paymentAmount: "SAR 3.5M", diffType: "异步来源", reason: "Etimad 延迟同步,发票金额未及时回写 SAP" }, pendingOrders: 2, pendingOrdersList: [{ po: "PO-2026-0602-A", desc: "住房项目 · 土建尾款", amount: "SAR 1.8M", status: "待差异核验" }, { po: "PO-2026-0602-B", desc: "住房项目 · 机电安装", amount: "SAR 1.7M", status: "待完工证明" }], settleAdvice: "待处理差异", settleAdviceList: [{ item: "暂缓 PO-2026-0602 全额结算", amount: "SAR 3.5M", basis: "存在 SAR 0.3M 未核差异 + 2 项缺件", action: "先核差异" }, { item: "先结算已对平部分 PO-2026-0602-A", amount: "SAR 1.7M", basis: "该笔 SAP=Etimad 已对平", action: "部分采纳" }, { item: "补齐完工证明后结算 PO-2026-0602-B", amount: "SAR 1.8M", basis: "缺 COC,待补", action: "挂起" }], monthlyPlan: "已生成", finalAccount: "-" },
    { period: "FY 2026 · Q1", settleType: "季度结算", accountScope: "市政项目", paymentOrder: "PO-2026-0301", contractNo: "CON-2025-C001", preStatus: { status: "通过", missingEntries: [], abnormalBalances: [], unsettledInvoices: [] }, sapDiff: { amount: "SAR 0", contractAmount: "SAR 5.6M", invoiceAmount: "SAR 5.6M", paymentAmount: "SAR 5.6M", diffType: "无差异", reason: "无差异" }, pendingOrders: 0, pendingOrdersList: [], settleAdvice: "批准结算", settleAdviceList: [{ item: "PO-2026-0301 季度结算", amount: "SAR 5.6M", basis: "对账通过 · 生成决算账户", action: "采纳" }], monthlyPlan: "-", finalAccount: "已生成" },
  ];

  const RECONCILIATION_DATA = [
    { period: "FY 2026 · Q2", accountScope: "所有项目", preStatus: { status: "通过", issues: [] }, paymentOrder: "PO-2026-0601", sapDiff: { amount: "SAR 0", sapValue: "SAR 2.5M", etimadValue: "SAR 2.5M", reason: "无差异" }, settleAdvice: "批准结算" },
    { period: "FY 2026 · Q2", accountScope: "住房项目", preStatus: { status: "不通过", issues: ["数据缺失", "异常余额"] }, paymentOrder: "PO-2026-0602", sapDiff: { amount: "SAR 0.3M", sapValue: "SAR 3.8M", etimadValue: "SAR 3.5M", reason: "Etimad 延迟同步" }, settleAdvice: "调整后重新对账" },
    { period: "FY 2026 · Q1", accountScope: "市政项目", preStatus: { status: "通过", issues: [] }, paymentOrder: "PO-2026-0301", sapDiff: { amount: "SAR 0", sapValue: "SAR 5.6M", etimadValue: "SAR 5.6M", reason: "无差异" }, settleAdvice: "批准结算" },
  ];

  const LIQUIDATION_DATA = [
    { paymentOrder: "PO-2026-0601", paymentStatus: "已付款", liquidationStatus: "已清算", liquidationNo: "LQ-2026-0601", liquidationDate: "2026-06-15", liquidationAmount: "SAR 2.5M", transactionNo: "TXN-SAR-20260615-001" },
    { paymentOrder: "PO-2026-0602", paymentStatus: "付款处理中", liquidationStatus: "清算中", liquidationNo: "LQ-2026-0602", liquidationDate: "2026-06-16", liquidationAmount: "SAR 3.5M", transactionNo: "TXN-SAR-20260616-002" },
    { paymentOrder: "PO-2026-0603", paymentStatus: "待付款", liquidationStatus: "待清算", liquidationNo: "-", liquidationDate: "-", liquidationAmount: "SAR 1.8M", transactionNo: "-" },
    { paymentOrder: "PO-2026-0604", paymentStatus: "付款失败", liquidationStatus: "清算失败", liquidationNo: "LQ-2026-0604", liquidationDate: "2026-06-14", liquidationAmount: "SAR 0", transactionNo: "TXN-SAR-20260614-004" },
  ];

  const statusColors = { "新建": "#6b7280", "审计中": "#3b82f6", "不完整": "#f59e0b", "已批准": "#10b981", "已审查": "#8b5cf6", "解析完成": "#2563eb" };
  const paymentStatusColors = { "待付款": "#f59e0b", "付款处理中": "#3b82f6", "已付款": "#10b981", "付款失败": "#ef4444" };
  const liquidationStatusColors = { "待清算": "#f59e0b", "清算中": "#3b82f6", "已清算": "#10b981", "清算失败": "#ef4444" };

  const filteredContractData = CONTRACT_DATA.filter(item => {
    const matchClaim = !searchClaimNo || item.claimNo.toLowerCase().includes(searchClaimNo.toLowerCase());
    const matchPayment = !searchPaymentOrder || item.paymentOrder.toLowerCase().includes(searchPaymentOrder.toLowerCase());
    return matchClaim && matchPayment;
  });

  const filteredClaimData = [...CLAIM_DATA, ...uploadedClaims].filter(item => {
    const matchClaim = !searchClaimNo || item.claimNo.toLowerCase().includes(searchClaimNo.toLowerCase());
    const matchPayment = !searchPaymentOrder || item.paymentOrder.toLowerCase().includes(searchPaymentOrder.toLowerCase());
    return matchClaim && matchPayment;
  });

  const handleAction = (item, actionType) => {
    setConfirmModal({ item, actionType });
  };

  const confirmAction = () => {
    const { actionType } = confirmModal;
    setConfirmModal(null);
    setModalOpen({ type: actionType === "adopt" ? "adoptSuccess" : "returnSuccess" });
  };

  /* 上传索赔包 → AI 解析 (先让 AI 跑) → 将包内多条索赔写入索赔表 */
  const handleUploadPkg = (e) => {
    const fn = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!fn || parsing) return;
    setActiveTab(1);
    setParsing(true); setParseLog([]); setParseSummary(null);
    const fname = fn.name;
    const steps = [
      { d: 0, t: { en: "⬆ Uploading claim package: " + fname, ar: "⬆ رفع حزمة المطالبة: " + fname, zh: "⬆ 正在上传索赔包: " + fname } },
      { d: 600, t: { en: "🤖 AI unpacking · contracts / invoices / COC / payment orders", ar: "🤖 يفكك الذكاء الحزمة · عقود / فواتير / شهادات / أوامر دفع", zh: "🤖 AI 拆包 · 合同 / 发票 / 完工证 / 付款单" } },
      { d: 1200, t: { en: "🔤 OCR + field mapping · 1 package · 3 claims", ar: "🔤 OCR + مطابقة الحقول · حزمة واحدة · 3 مطالبات", zh: "🔤 OCR + 字段映射 · 1 个包 · 3 条索赔" } },
      { d: 1800, t: { en: "🔗 Cross-check vs SAP / Etimad · matching computed", ar: "🔗 مطابقة مع ساب / اعتماد · حساب المطابقة", zh: "🔗 与 SAP / Etimad 交叉核验 · 计算匹配率" } },
      { d: 2400, t: { en: "✓ Parse complete · 3 claims extracted → Claims table", ar: "✓ اكتمل التحليل · 3 مطالبات → جدول المطالبات", zh: "✓ 解析完成 · 提取 3 条索赔 → 写入索赔表" } },
    ];
    steps.forEach(s => setTimeout(() => setParseLog(l => [...l, s.t]), s.d));
    setTimeout(() => {
      const parsedClaims = [
        { claimNo: "CLM-2026-006", paymentOrder: "PO-2026-0806", contractNo: "CON-2025-D001", poNo: "PR-2025-1501", status: "解析完成", reasonList: ["进度款(第3期)", "材料调差"], completionCert: "COC-2026-006.pdf", qtyPlan: "78/100", claimAmount: "SAR 3.6M", penalty: "SAR 0.18M", sapStatus: { commitment: "SAR 3.8M", invoice: "SAR 3.6M", payment: "SAR 0", balance: "SAR 3.8M", liquidity: "充足" }, systemAdvice: "批准", returnReason: "" },
        { claimNo: "CLM-2026-007", paymentOrder: "PO-2026-0807", contractNo: "CON-2025-D002", poNo: "PR-2025-1502", status: "解析完成", reasonList: ["最终结算"], completionCert: "COC-2026-007.pdf", qtyPlan: "100/100", claimAmount: "SAR 2.1M", penalty: "SAR 0", sapStatus: { commitment: "SAR 2.1M", invoice: "SAR 2.1M", payment: "SAR 0", balance: "SAR 2.1M", liquidity: "充足" }, systemAdvice: "批准", returnReason: "" },
        { claimNo: "CLM-2026-008", paymentOrder: "PO-2026-0808", contractNo: "CON-2025-D003", poNo: "PR-2025-1503", status: "不完整", reasonList: ["缺税率表"], completionCert: "", qtyPlan: "60/100", claimAmount: "SAR 1.4M", penalty: "SAR 0.07M", sapStatus: { commitment: "SAR 1.5M", invoice: "SAR 1.4M", payment: "SAR 0", balance: "SAR 1.5M", liquidity: "充足" }, systemAdvice: "退回", returnReason: "缺税率表" },
      ];
      setUploadedClaims(parsedClaims);
      setParseSummary({ claims: 3, matched: 2, missing: 1, amount: "SAR 7.1M", pkg: fname });
      setParsing(false);
      pushLog({ en: "Claim package parsed · 3 claims added to Claims table", ar: "حُلّلت حزمة المطالبة · 3 مطالبات أُضيفت للجدول", zh: "索赔包解析完成 · 3 条索赔已写入索赔表" });
    }, 2800);
  };

  const back = () => { if (backRoute) { const b = backRoute; setBackRoute(null); setRoute(b); } else setRoute(cfg.back); };

  /* 流动性预测: 上传年度付款计划 Excel + Etimad 导出 → 自动对齐 / 差异 / 预测 */
  const handleLiqUpload = () => {
    if (liqState !== "idle") return;
    setLiqState("parsing"); setLiqLog([]); setLiqApproved(false);
    const steps = [
      { d: 0, t: { en: "⬆ Loading annual payment-plan Excel + Etimad export", ar: "⬆ تحميل خطة الدفع + تصدير اعتماد", zh: "⬆ 载入年度付款计划 Excel + Etimad 导出" } },
      { d: 700, t: { en: "🔤 Auto field mapping · 1,240 rows", ar: "🔤 مطابقة آلية للحقول · 1,240 صفاً", zh: "🔤 自动字段映射 · 1,240 行" } },
      { d: 1400, t: { en: "🔗 Aligning projects & budget lines vs SAP", ar: "🔗 مطابقة المشاريع والبنود مقابل ساب", zh: "🔗 对齐项目与预算行 vs SAP" } },
      { d: 2100, t: { en: "📈 Plan-vs-actual variance 18% · forecasting wk 28–35", ar: "📈 انحراف 18% · توقع الأسابيع 28–35", zh: "📈 计划 vs 实际偏差 18% · 预测 28-35 周" } },
      { d: 2800, t: { en: "✓ 2 budget lines short SAR 57M vs SAP", ar: "✓ بندان بعجز 57 مليوناً مقابل ساب", zh: "✓ 2 条预算行对 SAP 短缺 SAR 57M" } },
    ];
    steps.forEach(s => setTimeout(() => setLiqLog(l => [...l, s.t]), s.d));
    setTimeout(() => { setLiqState("done"); pushLog({ en: "Liquidity forecast ready · SAR 412M expected · SAR 57M gap", ar: "توقّع السيولة جاهز · 412 مليون متوقعة · عجز 57", zh: "流动性预测就绪 · 预期 SAR 412M · 缺口 SAR 57M" }); }, 3100);
  };

  const cycleScope = (i, v) => { const f = [...scopeVals]; f[i] = v; setScopeVals(f); setPhase("idle"); };

  const run = () => {
    setPhase("done");
    setDec(0);
    setOpenRow(-1);
    setJust("");
    pushLog({ en: tr(ucName) + " review executed", ar: "مراجعة " + tr(ucName), zh: tr(ucName) + " 审查已执行" });
  };

  const decide = (k) => {
    if (k === 1 && cfg.requiresJustification && !just.trim()) return;
    setDec(k);
    pushLog(k === 1 ? { en: tr(ucName) + " approved", ar: tr(ucName) + " معتمد", zh: tr(ucName) + " 已批准" } : k === 2 ? { en: tr(ucName) + " returned for modification", ar: tr(ucName) + " أُعيد للتعديل", zh: tr(ucName) + " 已退回修改" } : k === 3 ? { en: tr(ucName) + " returned", ar: tr(ucName) + " أُعيد", zh: tr(ucName) + " 已退回申请方" } : { en: tr(ucName) + " escalated", ar: tr(ucName) + " صُعد", zh: tr(ucName) + " 已升级" });
  };

  const askQ = (idx, raw) => {
    const q = idx >= 0 ? tr(cfg.qs[idx]) : (raw || "").trim();
    if (!q || thinking) return;
    const a = idx >= 0 ? tr(cfg.answers[idx]) : tr(cfg.genAns);
    pushLog({ en: "Q&A → " + tr(cfg.agent) + ": " + q, ar: "سؤال → " + tr(cfg.agent) + ": " + q, zh: "提问 → " + tr(cfg.agent) + ":" + q });
    setShowSugs(false); setQaOpen(true);
    setQa(p => [...p, { role: "u", text: q }]); setAsk(""); setThinking(true);
    setTimeout(() => { setQa(p => [...p, { role: "a", text: a }]); setThinking(false); }, 850);
  };

  return (<div className="fade wb">
    <div className="card pad wb-frame">
      <div className="card pad wb-head">
        <div>
          <div className="wb-title">
            <button className="pg-back" onClick={back}>‹</button>
            <span className={"wb-dot " + (cfg.tone || "violet")} />
            {tr(cfg.deptName)}{cfg.benchLabel ? " · " + tr(cfg.benchLabel) : ""}
            {(cfg.uc === "UC-08" || cfg.uc === "UC-09") && <button className="al-bell" onClick={() => setAlertsOpen(true)} title={tr({ en: "Exceptions", ar: "استثناءات", zh: "异常" })}>🔔</button>}
          </div>
          <div className="wb-subt">{ucl(cfg.uc, tr(cfg.subt))}</div>
        </div>
        <div className="wb-chain">
          <span className="wb-clab">{tr(cfg.chainLab)}</span>
          {cfg.chain.map((c, i) => (<React.Fragment key={i}>
            {i > 0 && <span className="wb-carr">→</span>}
            <span className={"wb-cpill" + (c.here ? " here" : "") + (c.route && !c.here ? " link" : "")} onClick={c.route && !c.here ? () => { setBackRoute(cfg.route); setRoute(c.route); } : undefined}>
              <span className="wb-cpos">{tr(BQ_POS[c.pos])}</span>
              {(SHOW_UC && !cfg.chainHideUc) ? c.code + " · " : ""}{tr(c.name)}
            </span>
          </React.Fragment>))}
        </div>
      </div>

      <div className="wb-actbar">
        <div className="wb-ab-top">
          <div className="wb-ab-spark">✦</div>
          <div className="wb-ab-tt">
            <div>
              <span className="wb-ab-lab">{tr({ en: "AI INSIGHT & NEXT ACTIONS", ar: "رؤى الذكاء الاصطناعي والإجراءات", zh: "AI 洞察与后续行动" })}</span>
            </div>
            <div className="wb-ab-insight"><Hi t={tr(cfg.summary)} /></div>
          </div>
        </div>
        <div className="wb-ab-rows">
          <div className="wb-ab-col">
            <div className="wb-ab-h">⚐ {tr({ en: "RECOMMENDED · prompts", ar: "موصى به · مقترحات", zh: "建议 · 提示(点击应用)" })}</div>
            <div className="wb-sugs">
              {cfg.recs.map((n, i) => (<button className="wb-sug" key={i} onClick={() => {
                pushLog({ en: "Applied recommendation — " + tr(n.t), ar: "تطبيق توصية — " + tr(n.t), zh: "已应用建议 — " + tr(n.t) });
              }}>
                <span className="pr">{i + 1}</span>
                <span className="wb-sug-tx"><b>{tr(n.t)}</b><i>{tr(n.d)}</i></span>
              </button>))}
            </div>
          </div>
        </div>
      </div>

      {cfg.uc === "UC-01" && (<div className="card">
        <div className="uf-sec" style={{ padding: "16px 20px", background: "#f8fafc", borderBottom: "1px solid var(--line)" }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
            <div className="wb-schip">
              <span className="k">期间</span>
              <select className="wb-ssel" defaultValue="FY2026-03">
                <option>FY2026-03</option>
                <option>FY2026-02</option>
                <option>FY2026-01</option>
              </select>
            </div>
            <div className="wb-schip">
              <span className="k">实体</span>
              <select className="wb-ssel" defaultValue="Ministry">
                <option>Ministry</option>
                <option>Agency</option>
                <option>Project</option>
              </select>
            </div>
            <div className="wb-schip">
              <span className="k">阿玛纳</span>
              <select className="wb-ssel" defaultValue="Al 16">
                <option>Al 16</option>
                <option>Al 01</option>
                <option>Al 02</option>
              </select>
            </div>
            <div className="wb-schip">
              <span className="k">来源</span>
              <select className="wb-ssel" defaultValue="All 13 systems">
                <option>All 13 systems</option>
                <option>SAP/Asas</option>
                <option>Etimad</option>
              </select>
            </div>
            <div className="wb-schip">
              <span className="k">章节</span>
              <select className="wb-ssel" defaultValue="All">
                <option>All</option>
                <option>1xxx</option>
                <option>2xxx</option>
              </select>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <button className="btn sm" onClick={() => pushLog("财务数据整合与数据质量 上传 Excel/CSV")}>上传 Excel/CSV (已配置规则)</button>
            </div>
          </div>
        </div>

        <div className="uf-sec" style={{ padding: "16px 20px" }}>
          <div className="uf-h">① 数据源连接面板 · 10 系统</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginTop: 12 }}>
            {[
              { name: "SAP / Asas", types: "预算 · 执行 · 财务科目", count: "12.4M" },
              { name: "Etimad / Etimad Plus", types: "合同 · 付款 · 付款", count: "1.8M" },
              { name: "Esnad", types: "施工单 · 合同记录", count: "1.2M" },
              { name: "SADAD", types: "中央收单 · 付款记录", count: "3.1M" },
              { name: "Efa'a (Ifmis)", types: "财政 · 拨款", count: "2.4M" },
              { name: "Makin", types: "收入/发票 · 付款记录", count: "5.1M" },
              { name: "Tahseel", types: "收入 · 收据", count: "6.4M" },
              { name: "Hyperion / MTFP", types: "预算提交 · 资产分类", count: "45K" },
              { name: "Jeem / Ba", types: "项目分类", count: "89K" },
              { name: "Excel / CSV", types: "外部数据(BR-04)", count: "-" },
            ].map((s, i) => (<div key={i} className="card pad" style={{ padding: "12px", border: "1px solid var(--line)", borderRadius: 8 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>{s.types}</div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: "#6b7280" }}>{s.count}</span>
                <button className="btn ghost sm" style={{ fontSize: 11, padding: "2px 8px" }}>详情</button>
              </div>
            </div>))}
          </div>
        </div>

        <div className="uf-sec" style={{ padding: "16px 20px", background: "#f8fafc" }}>
          <div className="uf-h">② 数据质量与差异清单</div>
          <div style={{ float: "right", fontSize: 12, color: "#6b7280", marginBottom: 12 }}>下次 KPI 合规检查截止 — 04:00 · 优先级按风险标注</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12, marginBottom: 16 }}>
            {[
              { label: "完整性", value: "96%", bar: 96, color: "#1B8354" },
              { label: "准确性", value: "94%", bar: 94, color: "#1B8354" },
              { label: "匹配余度", value: "98%", bar: 98, color: "#1B8354" },
              { label: "严重", value: "2", color: "#ef4444", badge: true },
              { label: "高", value: "2", color: "#f59e0b", badge: true },
              { label: "中", value: "2", color: "#3b82f6", badge: true },
            ].map((m, i) => (<div key={i} className="card" style={{ padding: "12px", borderRadius: 8 }}>
              {m.badge ? (<>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: m.color }}>{m.value}<span style={{ fontSize: 12, fontWeight: 400 }}> · 待处理</span></div>
              </>) : (<>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 24, fontWeight: 700 }}>{m.value}</div>
                <div style={{ height: 4, background: "#e5e7eb", borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: m.bar + "%", background: m.color, borderRadius: 2 }} />
                </div>
              </>)}
            </div>))}
          </div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button className="btn sm" style={{ fontSize: 12 }}>全部差异</button>
            <button className="btn ghost sm" style={{ fontSize: 12, color: "#ef4444" }}>6 条差异</button>
            <button className="btn ghost sm" style={{ fontSize: 12, color: "#f59e0b" }}>2 严重</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151", width: "30%" }}>差异描述</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151", width: "20%" }}>来源</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151", width: "15%" }}>状态</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151", width: "20%" }}>影响范围</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {[
                { desc: "EX-01 · 重复供应商发票 INV-55021", severity: "严重", source: "SAP + Etimad", status: "待处理", impact: "合同 213 金额不一致", action: "→ 修复" },
                { desc: "EX-02 · 科目 2130 金额不一致", severity: "严重", source: "SAP + Hyperion", status: "待处理", impact: "-", action: "→ 修复" },
                { desc: "EX-03 · 数据口 - Tahseel 数据 76% 完整", severity: "高", source: "Tahseel", status: "待刷新", impact: "-", action: "→ 同步" },
                { desc: "EX-04 · 供应商主数据不一致(19 条)", severity: "高", source: "Etimad + Ba", status: "待处理", impact: "-", action: "→ 修复" },
                { desc: "EX-05 · 汇率 / 数据字典陈旧", severity: "中", source: "Excel", status: "待更新", impact: "-", action: "→ 更新" },
                { desc: "EX-06 · 重复受益人记录(2 地区)", severity: "中", source: "Makin", status: "待处理", impact: "-", action: "→ 合并" },
              ].map((row, i) => (<tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                <td style={{ padding: "10px 8px" }}>
                  <span style={{ display: "inline-block", padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, marginRight: 8, background: row.severity === "严重" ? "#fee2e2" : row.severity === "高" ? "#fef3c7" : "#dbeafe", color: row.severity === "严重" ? "#dc2626" : row.severity === "高" ? "#d97706" : "#2563eb" }}>{row.severity}</span>
                  <span>{row.desc}</span>
                </td>
                <td style={{ padding: "10px 8px", color: "#6b7280" }}>{row.source}</td>
                <td style={{ padding: "10px 8px" }}><span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, background: "#f3f4f6", color: "#374151" }}>{row.status}</span></td>
                <td style={{ padding: "10px 8px", color: "#6b7280" }}>{row.impact}</td>
                <td style={{ padding: "10px 8px" }}><button style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.action}</button></td>
              </tr>))}
            </tbody>
          </table>
        </div>

        <div className="uf-sec" style={{ padding: "16px 20px" }}>
          <div className="uf-h">③ 血缘追踪</div>
          <div className="card pad" style={{ background: "#f8fafc", border: "1px dashed var(--line)" }}>
            <div style={{ fontSize: 13, color: "#6b7280", textAlign: "center", padding: 20 }}>血缘追踪可视化区域</div>
          </div>
        </div>

        <div className="uf-sec bp-actions" style={{ padding: "16px 20px", background: "#f8fafc", borderTop: "1px solid var(--line)" }}>
          <div className="uf-h">{tr({ en: "Decision", ar: "القرار", zh: "审批操作" })}</div>
          {approvalStatus ? (<div className="bp-next">
            <div className="bp-next-h">
              {approvalStatus === "approve" ? "✓ " + tr({ en: "Approved", ar: "معتمد", zh: "已批准" }) : approvalStatus === "reject" ? "✕ " + tr({ en: "Rejected", ar: "مرفوض", zh: "已驳回" }) : "✎ " + tr({ en: "Info requested", ar: "طُلبت معلومات", zh: "已请求补充信息" })}
            </div>
            <div className="bp-next-b">
              {tr(approvalStatus === "approve" ? { en: "Reviewed estimate approved · routed to budget commitment (audit-logged).", ar: "اعتُمد التقدير المُراجَع وتوجيهه إلى التزام الميزانية.", zh: "复核预估已批准 · 转入预算承诺(已写审计)。" } : approvalStatus === "reject" ? { en: "Returned to Qaboul with reasons; applicant may resubmit.", ar: "أُعيد لقبول.", zh: "附理由退回 Qaboul,申请部门可重新提交。" } : { en: "Quantity & unit-rate evidence requested from department via Qaboul.", ar: "طُلبت الأدلة.", zh: "已通过 Qaboul 向申请部门索取工程量与单价佐证。" })}
            </div>
            <button className="dw-btn" onClick={() => { setApprovalStatus(null); pushLog({ en: "财务数据整合与数据质量 review reopened", ar: "إعادة فتح مراجعة 财务数据整合与数据质量", zh: "财务数据整合与数据质量 重新评审" }); }}>↺ {tr({ en: "Reopen", ar: "إعادة فتح", zh: "重新评审" })}</button>
          </div>) : (<React.Fragment>
            <div className="pc-appr-sum">
              <div className="pc-appr-l">{tr({ en: "Approval object · reviewed estimate vs allocation", ar: "موضوع الاعتماد", zh: "审批对象 · 复核预估与分配额差额" })}</div>
              <div className="pc-appr-row">
                <div className="pc-appr-cell"><span>{tr({ en: "UC", ar: "UC", zh: "UC" })}</span><b className="pc-appr-nm">{tr(ucName)}</b></div>
                <div className="pc-appr-cell"><span>{tr({ en: "DQ SCORE", ar: "درجة الجودة", zh: "DQ 评分" })}</span><b>96%</b></div>
                <div className="pc-appr-cell"><span>{tr({ en: "EXCEPTIONS", ar: "الاستثناءات", zh: "例外项" })}</span><b className="up">6</b></div>
                <div className="pc-appr-cell"><span>{tr({ en: "REVIEW GATE", ar: "بوابة المراجعة", zh: "评审门" })}</span><b className="gate-ok">{tr({ en: "Ready", ar: "مستعد", zh: "就绪" })}</b></div>
              </div>
            </div>
            <div className="bp-act-btns">
              <button className="dw-btn primary" onClick={() => { setApprovalStatus("approve"); pushLog({ en: "财务数据整合与数据质量 approved", ar: "财务数据整合与数据质量 معتمد", zh: "财务数据整合与数据质量 已批准" }); }}>{tr({ en: "Approve reviewed estimate", ar: "اعتماد التقدير المُراجَع", zh: "批准复核预估" })}</button>
              <button className="dw-btn danger" onClick={() => { setApprovalStatus("reject"); pushLog({ en: "财务数据整合与数据质量 rejected", ar: "财务数据整合与数据质量 مرفوض", zh: "财务数据整合与数据质量 已驳回" }); }}>{tr({ en: "Reject", ar: "رفض", zh: "驳回" })}</button>
              <button className="dw-btn" onClick={() => { setApprovalStatus("info"); pushLog({ en: "财务数据整合与数据质量 info requested", ar: "اطلاعات مطلوبة 财务数据整合与数据质量", zh: "财务数据整合与数据质量 已请求补充信息" }); }}>{tr({ en: "Request more info", ar: "طلب معلومات", zh: "请求补充信息" })}</button>
            </div>
          </React.Fragment>)}
        </div>
      </div>)}

      {cfg.uc === "UC-08" && (<div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>
          {[{ en: "Contracts", ar: "العقود", zh: "合同" }, { en: "Claims", ar: "المطالبات", zh: "索赔" }, { en: "Payroll", ar: "مرتبات الموظفين", zh: "员工工资" }].map((tab, i) => (<button key={i} onClick={() => { setActiveTab(i); setSearchClaimNo(""); setSearchPaymentOrder(""); }} style={{ padding: "10px 24px", border: "none", background: activeTab === i ? "#ECFDF3" : "none", borderRadius: activeTab === i ? "8px 8px 0 0" : 0, cursor: "pointer", fontSize: 14, fontWeight: activeTab === i ? 700 : 400, color: activeTab === i ? "var(--primary)" : "#6b7280", borderBottom: activeTab === i ? "2px solid var(--primary)" : "none", marginBottom: "-1px" }}>{tr(tab)}</button>))}
        </div>

        {(activeTab === 0 || activeTab === 1) && (<div style={{ display: "flex", gap: 12, margin: "12px 0", flexWrap: "wrap" }}>
          <input type="text" value={searchClaimNo} onChange={e => setSearchClaimNo(e.target.value)} placeholder={tr({ en: "Claim No.", ar: "رقم المطالبة", zh: "索赔编号" })} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 13, minWidth: 180 }} />
          <input type="text" value={searchPaymentOrder} onChange={e => setSearchPaymentOrder(e.target.value)} placeholder={tr({ en: "Payment Order No.", ar: "رقم أمر الدفع", zh: "付款订单编号" })} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 13, minWidth: 180 }} />
          <button onClick={() => { setSearchClaimNo(""); setSearchPaymentOrder(""); }} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid var(--line)", background: "none", cursor: "pointer", fontSize: 13 }}>{tr({ en: "Reset", ar: "إعادة تعيين", zh: "重置" })}</button>
          {activeTab === 1 && (<>
            <input ref={pkgFileRef} type="file" accept=".zip,.pdf,.xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleUploadPkg} />
            <button onClick={() => pkgFileRef.current && pkgFileRef.current.click()} disabled={parsing} style={{ padding: "6px 16px", borderRadius: 8, background: "var(--green)", color: "white", border: "none", cursor: parsing ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 700, opacity: parsing ? 0.6 : 1 }}>⬆ {tr({ en: "Upload Claim Package", ar: "رفع حزمة المطالبة", zh: "上传索赔包" })}</button>
          </>)}
        </div>)}

        {activeTab === 1 && parsing && (
          <div className="card pad" style={{ margin: "0 0 12px 0", border: "1px dashed var(--primary)", background: "#f5f3ff" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <span className="pulse" />
              <b style={{ color: "var(--primary)" }}>{tr({ en: "AI parsing claim package…", ar: "الذكاء يحلّل حزمة المطالبة…", zh: "AI 正在解析索赔包…" })}</b>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 12, color: "#374151" }}>
              {parseLog.map((l, i) => (<div key={i} style={{ opacity: i === parseLog.length - 1 ? 1 : 0.65 }}>{tr(l)}</div>))}
              {parseLog.length < 5 && <span className="wb-typing"><i /><i /><i /></span>}
            </div>
          </div>
        )}
        {activeTab === 1 && parseSummary && !parsing && (
          <div className="card pad" style={{ margin: "0 0 12px 0", background: "#f0fdf4", border: "1px solid #bbf7d0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <b style={{ color: "#16a34a" }}>✓ {tr({ en: "Package parsed", ar: "تم تحليل الحزمة", zh: "解析完成" })}</b>
              <span style={{ fontSize: 12, color: "#6b7280" }}>{parseSummary.pkg}</span>
            </div>
            <div style={{ display: "flex", gap: 22, flexWrap: "wrap" }}>
              <div><div style={{ fontSize: 18, fontWeight: 700 }}>{parseSummary.claims}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{tr({ en: "Claims", ar: "مطالبات", zh: "索赔" })}</div></div>
              <div><div style={{ fontSize: 18, fontWeight: 700, color: "#16a34a" }}>{parseSummary.matched}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{tr({ en: "Matched", ar: "مطابق", zh: "已匹配" })}</div></div>
              <div><div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>{parseSummary.missing}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{tr({ en: "Missing", ar: "ناقص", zh: "缺失" })}</div></div>
              <div><div style={{ fontSize: 18, fontWeight: 700 }}>{parseSummary.amount}</div><div style={{ fontSize: 11, color: "#6b7280" }}>{tr({ en: "Claim Amount", ar: "مبلغ المطالبة", zh: "索赔金额" })}</div></div>
            </div>
          </div>
        )}

        {activeTab === 0 && (<div className="card pad" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Claim No.", ar: "رقم المطالبة", zh: "索赔编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Payment Order", ar: "أمر الدفع", zh: "付款订单编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Contract No.", ar: "رقم العقد", zh: "合同编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "PO No.", ar: "رقم الطلب", zh: "采购订单编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Status", ar: "الحالة", zh: "索赔状态" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Reason List", ar: "قائمة الأسباب", zh: "理由清单" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Completion Cert.", ar: "شهادة الإنجاز", zh: "完工证书" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Qty Plan", ar: "خطة الكمية", zh: "数量计划" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Claim Amount", ar: "مبلغ المطالبة", zh: "索赔金额" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Penalty", ar: "الغرامة", zh: "罚款和扣款" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>SAP/Asas</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "System Advice", ar: "نصيحة النظام", zh: "系统建议" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Return Reason", ar: "سبب الإرجاع", zh: "退回原因" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Action", ar: "الإجراء", zh: "操作" })}</th>
              </tr>
            </thead>
            <tbody>
              {filteredContractData.map((row, i) => (<tr key={i} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                <td style={{ padding: "8px" }}>{row.claimNo}</td>
                <td style={{ padding: "8px" }}>{row.paymentOrder}</td>
                <td style={{ padding: "8px" }}>{row.contractNo}</td>
                <td style={{ padding: "8px" }}>{row.poNo}</td>
                <td style={{ padding: "8px" }}><span style={{ color: statusColors[row.status] || "#6b7280", fontWeight: 700 }}>{row.status}</span></td>
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "reasonList", data: row.reasonList })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.reasonList.length} {tr({ en: "items", ar: "عناصر", zh: "项" })}</button></td>
                <td style={{ padding: "8px" }}>{row.completionCert ? <a href="#" onClick={e => { e.preventDefault(); setModalOpen({ type: "cert", data: row.completionCert }); }} style={{ color: "var(--primary)", textDecoration: "underline" }}>{row.completionCert}</a> : "-"}</td>
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "qtyPlan", data: row.qtyPlan })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.qtyPlan}</button></td>
                <td style={{ padding: "8px", fontWeight: 700 }}>{row.claimAmount}</td>
                <td style={{ padding: "8px", color: "#ef4444" }}>{row.penalty}</td>
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "sap", data: row.sapStatus })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>SAP/Asas</button></td>
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "advice", data: row.systemAdvice })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.systemAdvice}</button></td>
                <td style={{ padding: "8px", color: "#ef4444", fontSize: 11 }}>{row.returnReason || "-"}</td>
                <td style={{ padding: "8px" }}><button onClick={() => handleAction(row, "return")} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ef4444", color: "#ef4444", background: "none", cursor: "pointer", fontSize: 11 }}>{tr({ en: "Return", ar: "إرجاع", zh: "退回更正" })}</button></td>
              </tr>))}
            </tbody>
          </table>
        </div>)}

        {activeTab === 1 && (<div className="card pad" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Claim No.", ar: "رقم المطالبة", zh: "索赔编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Payment Order", ar: "أمر الدفع", zh: "付款订单编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Contract No.", ar: "رقم العقد", zh: "合同编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "PO No.", ar: "رقم الطلب", zh: "采购订单编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Status", ar: "الحالة", zh: "索赔状态" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Reason List", ar: "قائمة الأسباب", zh: "理由清单" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Completion Cert.", ar: "شهادة الإنجاز", zh: "完工证书" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Qty Plan", ar: "خطة الكمية", zh: "数量计划" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Claim Amount", ar: "مبلغ المطالبة", zh: "索赔金额" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Penalty", ar: "الغرامة", zh: "罚款和扣款" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>SAP/Asas</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "System Advice", ar: "نصيحة النظام", zh: "系统建议" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Return Reason", ar: "سبب الإرجاع", zh: "退回原因" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Action", ar: "الإجراء", zh: "操作" })}</th>
              </tr>
            </thead>
            <tbody>
              {filteredClaimData.map((row, i) => (<tr key={i} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                <td style={{ padding: "8px" }}>{row.claimNo}</td>
                <td style={{ padding: "8px" }}>{row.paymentOrder}</td>
                <td style={{ padding: "8px" }}>{row.contractNo}</td>
                <td style={{ padding: "8px" }}>{row.poNo}</td>
                <td style={{ padding: "8px" }}><span style={{ color: statusColors[row.status] || "#6b7280", fontWeight: 700 }}>{row.status}</span></td>
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "reasonList", data: row.reasonList })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.reasonList.length} {tr({ en: "items", ar: "عناصر", zh: "项" })}</button></td>
                <td style={{ padding: "8px" }}>{row.completionCert ? <a href="#" onClick={e => { e.preventDefault(); setModalOpen({ type: "cert", data: row.completionCert }); }} style={{ color: "var(--primary)", textDecoration: "underline" }}>{row.completionCert}</a> : "-"}</td>
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "qtyPlan", data: row.qtyPlan })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.qtyPlan}</button></td>
                <td style={{ padding: "8px", fontWeight: 700 }}>{row.claimAmount}</td>
                <td style={{ padding: "8px", color: "#ef4444" }}>{row.penalty}</td>
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "sap", data: row.sapStatus })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>SAP/Asas</button></td>
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "advice", data: row.systemAdvice })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.systemAdvice}</button></td>
                <td style={{ padding: "8px", color: "#ef4444", fontSize: 11 }}>{row.returnReason || "-"}</td>
                <td style={{ padding: "8px" }}><button onClick={() => handleAction(row, "return")} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #ef4444", color: "#ef4444", background: "none", cursor: "pointer", fontSize: 11 }}>{tr({ en: "Return", ar: "إرجاع", zh: "退回更正" })}</button></td>
              </tr>))}
            </tbody>
          </table>
        </div>)}

        {activeTab === 2 && (<div className="card pad" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Employee No.", ar: "رقم الموظف", zh: "员工编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Payment Order", ar: "أمر الدفع", zh: "付款订单编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Name", ar: "الاسم", zh: "姓名" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Department", ar: "القسم", zh: "部门" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Position", ar: "المسمى الوظيفي", zh: "岗位" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Bank Account", ar: "الحساب البنكي", zh: "银行账号" })}</th>
                <th style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: "#374151" }}>{tr({ en: "Base Salary", ar: "الراتب الأساسي", zh: "基本工资" })}</th>
                <th style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: "#374151" }}>{tr({ en: "Position Salary", ar: "راتب المسمى", zh: "岗位工资" })}</th>
                <th style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: "#374151" }}>{tr({ en: "Performance", ar: "الاداء", zh: "绩效工资" })}</th>
                <th style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: "#374151" }}>{tr({ en: "Overtime", ar: "الإضافي", zh: "加班费" })}</th>
                <th style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: "#374151" }}>{tr({ en: "Attendance Bonus", ar: "مكافأة الحضور", zh: "全勤奖" })}</th>
                <th style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: "#374151" }}>{tr({ en: "Other Subsidy", ar: "إعانات أخرى", zh: "其他补贴" })}</th>
                <th style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: "#374151" }}>{tr({ en: "Gross Pay", ar: "المبلغ الإجمالي", zh: "应发合计" })}</th>
                <th style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: "#374151" }}>{tr({ en: "Deduction", ar: "المكسرات", zh: "扣款合计" })}</th>
                <th style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: "#374151" }}>{tr({ en: "Net Pay", ar: "المبلغ النهائي", zh: "实发工资" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Pay Date", ar: "تاريخ الدفع", zh: "发放日期" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Remark", ar: "ملاحظات", zh: "备注" })}</th>
              </tr>
            </thead>
            <tbody>
              {PAYROLL_DATA.map((row, i) => (<tr key={i} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                <td style={{ padding: "8px" }}>{row.empNo}</td>
                <td style={{ padding: "8px" }}>{row.paymentOrder}</td>
                <td style={{ padding: "8px", fontWeight: 700 }}>{row.name}</td>
                <td style={{ padding: "8px" }}>{row.dept}</td>
                <td style={{ padding: "8px" }}>{row.position}</td>
                <td style={{ padding: "8px", fontFamily: "monospace" }}>{row.bankAccount}</td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace" }}>{row.baseSalary}</td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace" }}>{row.positionSalary}</td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace" }}>{row.performanceSalary}</td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace" }}>{row.overtime}</td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace" }}>{row.attendanceBonus}</td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace" }}>{row.otherSubsidy}</td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700, color: "var(--primary)" }}>{row.grossPay}</td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", color: "#ef4444" }}>{row.deduction}</td>
                <td style={{ padding: "8px", textAlign: "right", fontFamily: "monospace", fontWeight: 700 }}>{row.netPay}</td>
                <td style={{ padding: "8px" }}>{row.payDate}</td>
                <td style={{ padding: "8px", fontSize: 11, color: "#6b7280" }}>{row.remark || "-"}</td>
              </tr>))}
            </tbody>
          </table>
        </div>)}

        {(() => {
          const typeColors = { "合同": "#2563eb", "索赔": "#7c5cff", "员工工资": "#16a34a" };
          const th = { padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" };
          const linkBtn = { background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12, padding: 0 };
          return (
          <div className="card pad" style={{ marginTop: 12, overflowX: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "4px 0 10px 0" }}>
              <b style={{ fontSize: 14 }}>{tr({ en: "Expenditure", ar: "الإنفاق", zh: "支出" })}</b>
              <span style={{ fontSize: 12, color: "#6b7280" }}>· {tr({ en: "Contracts / Claims / Payroll", ar: "العقود / المطالبات / الرواتب", zh: "合同 / 索赔 / 员工工资" })}</span>
            </div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={th}>{tr({ en: "Payment Order", ar: "أمر الدفع", zh: "付款订单编号" })}</th>
                <th style={th}>{tr({ en: "Type", ar: "النوع", zh: "类型" })}</th>
                <th style={th}>{tr({ en: "Net Payable", ar: "صافي المستحق", zh: "应付净额" })}</th>
                <th style={th}>{tr({ en: "Payment Plan", ar: "خطة الدفع", zh: "付款计划" })}</th>
                <th style={th}>{tr({ en: "Disbursement Order", ar: "أمر الصرف", zh: "支出令" })}</th>
                <th style={th}>{tr({ en: "Expenditure Order", ar: "أمر الإنفاق", zh: "支出订单" })}</th>
                <th style={th}>{tr({ en: "Contract No.", ar: "رقم العقد", zh: "合同编号" })}</th>
                <th style={th}>{tr({ en: "PO No.", ar: "رقم الطلب", zh: "采购订单编号" })}</th>
                <th style={th}>{tr({ en: "Status", ar: "الحالة", zh: "索赔状态" })}</th>
                <th style={th}>{tr({ en: "Reason List", ar: "قائمة الأسباب", zh: "理由清单" })}</th>
                <th style={th}>{tr({ en: "Completion Cert.", ar: "شهادة الإنجاز", zh: "完工证书" })}</th>
                <th style={th}>{tr({ en: "Qty Plan", ar: "خطة الكمية", zh: "数量计划" })}</th>
                <th style={th}>{tr({ en: "Claim Amount", ar: "مبلغ المطالبة", zh: "索赔金额" })}</th>
                <th style={th}>{tr({ en: "Penalty", ar: "الغرامة", zh: "罚款和扣款" })}</th>
                <th style={th}>SAP/Asas</th>
                <th style={th}>{tr({ en: "System Advice", ar: "نصيحة النظام", zh: "系统建议" })}</th>
                <th style={th}>{tr({ en: "Return Reason", ar: "سبب الإرجاع", zh: "退回原因" })}</th>
              </tr></thead>
              <tbody>
                {EXPENDITURE_DATA.map((row, i) => (<tr key={i} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                  <td style={{ padding: "8px", fontFamily: "monospace", whiteSpace: "nowrap" }}>{row.paymentOrder}</td>
                  <td style={{ padding: "8px" }}><span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "#fff", background: typeColors[row.type] || "#6b7280", whiteSpace: "nowrap" }}>{row.type}</span></td>
                  <td style={{ padding: "8px", fontWeight: 700, whiteSpace: "nowrap" }}>{row.netPayable}</td>
                  <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{tr(row.paymentPlan)}</td>
                  <td style={{ padding: "8px", fontFamily: "monospace", whiteSpace: "nowrap" }}>{row.disbursementOrder}</td>
                  <td style={{ padding: "8px", fontFamily: "monospace", whiteSpace: "nowrap" }}>{row.expenditureOrder}</td>
                  <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{row.contractNo}</td>
                  <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{row.poNo}</td>
                  <td style={{ padding: "8px" }}><span style={{ color: statusColors[row.status] || "#6b7280", fontWeight: 700 }}>{row.status}</span></td>
                  <td style={{ padding: "8px" }}>{row.reasonList.length > 0 ? <button onClick={() => setModalOpen({ type: "reasonList", data: row.reasonList })} style={linkBtn}>{row.reasonList.length} {tr({ en: "items", ar: "عناصر", zh: "项" })}</button> : "-"}</td>
                  <td style={{ padding: "8px" }}>{row.completionCert && row.completionCert !== "-" ? <a href="#" onClick={e => { e.preventDefault(); setModalOpen({ type: "cert", data: row.completionCert }); }} style={{ color: "var(--primary)", textDecoration: "underline" }}>{row.completionCert}</a> : "-"}</td>
                  <td style={{ padding: "8px", whiteSpace: "nowrap" }}>{row.qtyPlan}</td>
                  <td style={{ padding: "8px", fontWeight: 700, whiteSpace: "nowrap" }}>{row.claimAmount}</td>
                  <td style={{ padding: "8px", color: "#ef4444", whiteSpace: "nowrap" }}>{row.penalty}</td>
                  <td style={{ padding: "8px" }}>{row.sapStatus ? <button onClick={() => setModalOpen({ type: "sap", data: row.sapStatus })} style={linkBtn}>SAP/Asas</button> : "-"}</td>
                  <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "advice", data: row.systemAdvice })} style={linkBtn}>{row.systemAdvice}</button></td>
                  <td style={{ padding: "8px", color: "#ef4444", fontSize: 11, whiteSpace: "nowrap" }}>{row.returnReason || "-"}</td>
                </tr>))}
              </tbody>
            </table>
          </div>
          );
        })()}

        {/* 流动性预测 · 提前预判 (上传年度付款计划 Excel + Etimad → 对齐/差异/预测/短缺/建议/阿语/人审) */}
        {(() => {
          const th = { padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151", whiteSpace: "nowrap" };
          const cell = { padding: "8px", whiteSpace: "nowrap" };
          const variance = [
            { line: "B-3402 · 住房基建", plan: "SAR 120M", actual: "SAR 163M", variance: "+36%", cls: "bad" },
            { line: "B-2884 · 市政项目", plan: "SAR 80M", actual: "SAR 94M", variance: "+18%", cls: "warn" },
            { line: "B-1190 · 设备采购", plan: "SAR 45M", actual: "SAR 42M", variance: "-7%", cls: "ok" },
            { line: "B-2055 · 咨询服务", plan: "SAR 30M", actual: "SAR 31M", variance: "+3%", cls: "ok" },
          ];
          const weeks = [
            { w: "28", v: 78, amt: "SAR 78M" }, { w: "29", v: 96, amt: "SAR 96M", peak: true },
            { w: "30", v: 71, amt: "SAR 71M" }, { w: "31", v: 65, amt: "SAR 65M" },
            { w: "32", v: 44, amt: "SAR 44M" }, { w: "33", v: 36, amt: "SAR 36M" },
            { w: "34", v: 14, amt: "SAR 14M" }, { w: "35", v: 8, amt: "SAR 8M" },
          ];
          const varColor = { bad: "#dc2626", warn: "#d97706", ok: "#16a34a" };
          return (
          <div className="card pad" style={{ marginTop: 12, border: "1px solid var(--line)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
              <span style={{ fontSize: 18 }}>🔮</span>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{tr({ en: "Liquidity Forecast — Know Before It Arrives", ar: "توقّع السيولة — المعرفة قبل الوصول", zh: "流动性预测 · 提前预判" })}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{tr({ en: "Upload the annual payment-plan Excel + Etimad payment export → Copilot auto-maps fields, aligns projects & budget lines, computes plan-vs-actual variance, forecasts claims 4-8 weeks out, flags shortages and drafts requests.", ar: "ارفع خطة الدفع السنوية (إكسل) + تصدير مدفوعات اعتماد → يطابق الذكاء الحقول، ويوائم المشاريع والبنود، ويحسب الانحراف، ويتوقّع المطالبات 4-8 أسابيع، ويرصد العجز ويصوغ الطلبات.", zh: "上传年度付款计划 Excel + Etimad 付款导出 → Copilot 自动识别字段、对齐项目与预算行、计算计划vs实际差异、预测未来4-8周索赔、标记短缺并草拟申请。" })}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", margin: "12px 0", padding: 12, background: liqState === "done" ? "#f0fdf4" : "#f8fafc", border: "1px dashed " + (liqState === "done" ? "#86efac" : "var(--line)"), borderRadius: 10 }}>
              <input ref={planFileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={e => { const f = e.target.files && e.target.files[0]; if (f) setLiqFiles(s => ({ ...s, plan: f.name })); e.target.value = ""; }} />
              <input ref={etimadFileRef} type="file" accept=".csv,.xlsx,.xls,.txt" style={{ display: "none" }} onChange={e => { const f = e.target.files && e.target.files[0]; if (f) setLiqFiles(s => ({ ...s, etimad: f.name })); e.target.value = ""; }} />
              <button onClick={() => planFileRef.current && planFileRef.current.click()} disabled={liqState !== "idle"} title={liqFiles.plan || tr({ en: "Upload annual payment-plan Excel", ar: "ارفع خطة الدفع", zh: "上传年度付款计划 Excel" })} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 999, background: liqFiles.plan ? "#dcfce7" : "#e0e7ff", color: liqFiles.plan ? "#16a34a" : "#4338ca", fontWeight: 700, border: "none", cursor: liqState !== "idle" ? "default" : "pointer", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📄 {liqFiles.plan ? "✓ " + liqFiles.plan : tr({ en: "Annual Plan Excel", ar: "خطة إكسل", zh: "年度付款计划 Excel" })}</button>
              <button onClick={() => etimadFileRef.current && etimadFileRef.current.click()} disabled={liqState !== "idle"} title={liqFiles.etimad || tr({ en: "Upload Etimad payment export", ar: "ارفع تصدير اعتماد", zh: "上传 Etimad 付款导出" })} style={{ fontSize: 12, padding: "4px 12px", borderRadius: 999, background: liqFiles.etimad ? "#dcfce7" : "#dbeafe", color: liqFiles.etimad ? "#16a34a" : "#1d4ed8", fontWeight: 700, border: "none", cursor: liqState !== "idle" ? "default" : "pointer", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>📤 {liqFiles.etimad ? "✓ " + liqFiles.etimad : "Etimad " + tr({ en: "Export", ar: "تصدير", zh: "导出" })}</button>
              {liqState === "idle" && (
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                  {!(liqFiles.plan && liqFiles.etimad) && <span style={{ fontSize: 11, color: "#92400e" }}>{tr({ en: "Select both files to start", ar: "اختر الملفين للبدء", zh: "请选择两份文件后再开始比对" })}</span>}
                  <button onClick={handleLiqUpload} disabled={!(liqFiles.plan && liqFiles.etimad)} style={{ padding: "8px 18px", borderRadius: 8, background: (liqFiles.plan && liqFiles.etimad) ? "var(--primary)" : "#cdd5df", color: "#fff", border: "none", cursor: (liqFiles.plan && liqFiles.etimad) ? "pointer" : "not-allowed", fontSize: 13, fontWeight: 700 }}>⚡ {tr({ en: "Start Comparison", ar: "ابدأ المقارنة", zh: "开始比对" })}</button>
                </div>
              )}
              {liqState === "parsing" && <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--primary)", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}><span className="pulse" /> {tr({ en: "AI aligning…", ar: "المطابقة جارية…", zh: "AI 对齐中…" })}</span>}
              {liqState === "done" && <span style={{ marginLeft: "auto", fontSize: 12, color: "#16a34a", fontWeight: 700 }}>✓ {tr({ en: "Aligned 1,240 rows · variance 18%", ar: "مطابقة 1,240 صفاً · انحراف 18%", zh: "已对齐 1,240 行 · 偏差 18%" })}</span>}
            </div>

            {liqState === "parsing" && (
              <div style={{ fontSize: 12, color: "#374151", margin: "0 0 12px 0", display: "flex", flexDirection: "column", gap: 3 }}>
                {liqLog.map((l, i) => <div key={i} style={{ opacity: i === liqLog.length - 1 ? 1 : 0.65 }}>{tr(l)}</div>)}
                {liqLog.length < 5 && <span className="wb-typing"><i /><i /><i /></span>}
              </div>
            )}

            {liqState === "done" && (<>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(140px,1fr))", gap: 10, margin: "0 0 14px 0" }}>
                <div className="card" style={{ padding: 10, borderRadius: 8 }}><div style={{ fontSize: 18, fontWeight: 700 }}>1,240</div><div style={{ fontSize: 11, color: "#6b7280" }}>{tr({ en: "Rows aligned", ar: "صفوف مطابقة", zh: "已对齐行" })}</div></div>
                <div className="card" style={{ padding: 10, borderRadius: 8 }}><div style={{ fontSize: 18, fontWeight: 700, color: "#d97706" }}>18%</div><div style={{ fontSize: 11, color: "#6b7280" }}>{tr({ en: "Plan vs Actual", ar: "الخطة مقابل الفعلي", zh: "计划 vs 实际" })}</div></div>
                <div className="card" style={{ padding: 10, borderRadius: 8 }}><div style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>SAR 412M</div><div style={{ fontSize: 11, color: "#6b7280" }}>{tr({ en: "Expected claims (wk 28-35)", ar: "مطالبات متوقعة (28-35)", zh: "预期索赔(28-35周)" })}</div></div>
                <div className="card" style={{ padding: 10, borderRadius: 8 }}><div style={{ fontSize: 18, fontWeight: 700, color: "#ef4444" }}>2</div><div style={{ fontSize: 11, color: "#6b7280" }}>{tr({ en: "Budget lines short", ar: "بنود بعجز", zh: "短缺预算行" })}</div></div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, margin: "4px 0 6px" }}>📊 {tr({ en: "Plan vs Actual Variance", ar: "انحراف الخطة مقابل الفعلي", zh: "计划 vs 实际差异" })}</div>
              <div style={{ overflowX: "auto", marginBottom: 14 }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr style={{ borderBottom: "2px solid var(--line)" }}>
                    <th style={th}>{tr({ en: "Budget Line", ar: "البند", zh: "预算行" })}</th>
                    <th style={th}>{tr({ en: "Plan", ar: "الخطة", zh: "计划" })}</th>
                    <th style={th}>{tr({ en: "Actual", ar: "الفعلي", zh: "实际" })}</th>
                    <th style={th}>{tr({ en: "Variance", ar: "الانحراف", zh: "偏差" })}</th>
                  </tr></thead>
                  <tbody>
                    {variance.map((r, i) => (<tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                      <td style={cell}>{r.line}</td>
                      <td style={cell}>{r.plan}</td>
                      <td style={cell}>{r.actual}</td>
                      <td style={cell}><span style={{ color: varColor[r.cls], fontWeight: 700 }}>{r.variance}</span></td>
                    </tr>))}
                  </tbody>
                </table>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, margin: "4px 0 6px" }}>📈 {tr({ en: "4-8 Week Claim Forecast (wk 28-35)", ar: "توقّع المطالبات 4-8 أسابيع (28-35)", zh: "未来 4-8 周索赔预测 (28-35周)" })}</div>
              <div style={{ display: "flex", gap: 6, alignItems: "flex-end", height: 84, margin: "0 0 4px", padding: "0 4px" }}>
                {weeks.map((wk, i) => (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: wk.peak ? "#dc2626" : "#374151", whiteSpace: "nowrap" }}>{wk.amt}</div>
                    <div style={{ width: "100%", height: wk.v + "%", minHeight: 6, borderRadius: "4px 4px 0 0", background: wk.peak ? "#dc2626" : "linear-gradient(180deg,#34d399,#1B8354)" }} title={wk.amt} />
                    <div style={{ fontSize: 10, color: "#6b7280" }}>w{wk.w}</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", margin: "0 0 14px" }}>🔺 {tr({ en: "Peak week 29 · SAR 96M", ar: "ذروة الأسبوع 29 · 96 مليون", zh: "峰值周 29 · SAR 96M" })}</div>

              <div style={{ fontSize: 12, fontWeight: 700, margin: "4px 0 6px" }}>⚠ {tr({ en: "Shortage vs SAP Available Funds", ar: "العجز مقابل توافر ساب", zh: "短缺预算行 (vs SAP 可用资金)" })}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 10, marginBottom: 14 }}>
                <div className="card" style={{ padding: 12, borderRadius: 8, borderLeft: "4px solid #dc2626" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>B-3402 · 住房基建</div>
                  <div style={{ fontSize: 12, color: "#6b7280", margin: "4px 0" }}>{tr({ en: "wk 28-31", ar: "الأسابيع 28-31", zh: "28-31 周" })}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#dc2626" }}>SAR 43M</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{tr({ en: "gap", ar: "العجز", zh: "缺口" })}</div>
                </div>
                <div className="card" style={{ padding: 12, borderRadius: 8, borderLeft: "4px solid #f59e0b" }}>
                  <div style={{ fontWeight: 700, fontSize: 13 }}>B-2884 · 市政项目</div>
                  <div style={{ fontSize: 12, color: "#6b7280", margin: "4px 0" }}>{tr({ en: "wk 30", ar: "الأسبوع 30", zh: "30 周" })}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#d97706" }}>SAR 14M</div>
                  <div style={{ fontSize: 11, color: "#6b7280" }}>{tr({ en: "gap", ar: "العجز", zh: "缺口" })}</div>
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, margin: "4px 0 6px" }}>✦ {tr({ en: "Generated Tasks / Recommendations → Budget Execution", ar: "مهام/توصيات مولّدة → تنفيذ الميزانية", zh: "系统建议 (面向 Budget Execution)" })}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 14 }}>
                <div className="card" style={{ padding: 10, borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>🔄</span>
                  <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{tr({ en: "Budget Transfer Request", ar: "طلب مناقلة", zh: "预算转移申请" })}</b><div style={{ fontSize: 12, color: "#6b7280" }}>{tr({ en: "Move SAR 43M into B-3402 before wk 28", ar: "نقل 43 مليون إلى B-3402 قبل الأسبوع 28", zh: "在 28 周前将 SAR 43M 转入 B-3402" })}</div></div>
                </div>
                <div className="card" style={{ padding: 10, borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 16 }}>➕</span>
                  <div style={{ flex: 1 }}><b style={{ fontSize: 13 }}>{tr({ en: "Budget Enhancement Request", ar: "طلب تعزيز", zh: "预算增强申请" })}</b><div style={{ fontSize: 12, color: "#6b7280" }}>{tr({ en: "Request SAR 14M enhancement for B-2884 (wk 30)", ar: "طلب تعزيز 14 مليون لـ B-2884 (الأسبوع 30)", zh: "为 B-2884 申请 SAR 14M 增强(30周)" })}</div></div>
                </div>
              </div>

              <div style={{ fontSize: 12, fontWeight: 700, margin: "4px 0 6px" }}>📝 {tr({ en: "Arabic Draft → Budget Execution / MoF", ar: "مسودة عربية → تنفيذ الميزانية / المالية", zh: "阿语说明草稿 (→ Budget Execution / MoF)" })}</div>
              <div dir="rtl" style={{ padding: 12, background: "#f8fafc", border: "1px solid var(--line)", borderRadius: 8, marginBottom: 14, textAlign: "right", fontSize: 13, lineHeight: 1.8 }}>
                الموضوع: طلب مناقلة وتعزيز سيولة للبندين B-3402 وB-2884. بالإشارة إلى توقّعات المطالبات للأسابيع 28-31، يُلاحظ عجز مقداره 57 مليون ريال مقابل التوافر في نظام ساب (43 مليون للبند B-3402 و14 مليون للبند B-2884). نرجو اعتماد المناقلة قبل الأسبوع 28 لتفادي تأخير الصرف، مع إرفاق جدول المطالبات ولقطات توافر ساب والمصادر.
              </div>

              <div style={{ padding: 12, background: liqApproved ? "#f0fdf4" : "#fffbeb", border: "1px solid " + (liqApproved ? "#86efac" : "#fde68a"), borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 16 }}>{liqApproved ? "✅" : "⚠️"}</span>
                <div style={{ flex: 1, fontSize: 12, color: liqApproved ? "#16a34a" : "#92400e" }}>{liqApproved ? tr({ en: "Reviewed — forecasts, recommendations & data sources confirmed; budget action triggered.", ar: "تمت المراجعة — تأكيد التوقعات والتوصيات والمصادر وبدء الإجراء.", zh: "已审阅 — 预测、建议与数据源引用已确认,预算动作已触发。" }) : tr({ en: "Human review gate: Entitlements team must review all forecasts, recommendations & data-source citations before triggering budget action.", ar: "بوابة المراجعة: يجب على فريق الاستحقاقات مراجعة كل التوقعات والتوصيات والمصادر قبل الإجراء.", zh: "人审入口:Entitlements 团队需审阅所有预测、建议与数据源引用后再正式触发预算动作。" })}</div>
                {!liqApproved && <button onClick={() => { setLiqApproved(true); pushLog({ en: "Liquidity forecast reviewed — transfer & enhancement triggered", ar: "تمت مراجعة توقّع السيولة — بدء المناقلة والتعزيز", zh: "流动性预测已审阅 — 转移与增强申请已触发" }); }} style={{ padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>{tr({ en: "Review & Approve", ar: "مراجعة واعتماد", zh: "审阅并通过" })}</button>}
              </div>
            </>)}
          </div>
          );
        })()}

        <div className="uf-sec bp-actions">
          <div className="uf-h">{tr({ en: "Decision", ar: "القرار", zh: "审批操作" })}</div>
          {approvalStatus ? (<div className="bp-next">
            <div className="bp-next-h">
              {approvalStatus === "approve" ? "✓ " + tr({ en: "Approved", ar: "معتمد", zh: "已批准" }) : approvalStatus === "reject" ? "✕ " + tr({ en: "Rejected", ar: "مرفوض", zh: "已驳回" }) : "✎ " + tr({ en: "Info requested", ar: "طُلبت معلومات", zh: "已请求补充信息" })}
            </div>
            <div className="bp-next-b">
              {tr(approvalStatus === "approve" ? { en: "Reviewed estimate approved · routed to budget commitment (audit-logged).", ar: "اعتُمد التقدير المُراجَع وتوجيهه إلى التزام الميزانية.", zh: "复核预估已批准 · 转入预算承诺(已写审计)。" } : approvalStatus === "reject" ? { en: "Returned to Qaboul with reasons; applicant may resubmit.", ar: "أُعيد لقبول.", zh: "附理由退回 Qaboul,申请部门可重新提交。" } : { en: "Quantity & unit-rate evidence requested from department via Qaboul.", ar: "طُلبت الأدلة.", zh: "已通过 Qaboul 向申请部门索取工程量与单价佐证。" })}
            </div>
            <button className="dw-btn" onClick={() => { setApprovalStatus(null); pushLog({ en: "合同、索赔、拨付与权益 review reopened", ar: "إعادة فتح مراجعة 合同、索赔、拨付与权益", zh: "合同、索赔、拨付与权益 重新评审" }); }}>↺ {tr({ en: "Reopen", ar: "إعادة فتح", zh: "重新评审" })}</button>
          </div>) : (<React.Fragment>
            <div className="pc-appr-sum">
              <div className="pc-appr-l">{tr({ en: "Approval object · reviewed estimate vs allocation", ar: "موضوع الاعتماد", zh: "审批对象 · 复核预估与分配额差额" })}</div>
              <div className="pc-appr-row">
                <div className="pc-appr-cell"><span>{tr({ en: "UC", ar: "UC", zh: "UC" })}</span><b className="pc-appr-nm">{tr(ucName)}</b></div>
                <div className="pc-appr-cell"><span>{tr({ en: "REVIEWED ESTIMATE", ar: "التقدير المُراجَع", zh: "复核预估" })}</span><b>SAR 8.5M</b></div>
                <div className="pc-appr-cell"><span>{tr({ en: "DELTA VS ALLOCATION", ar: "الفرق مقابل التخصيص", zh: "对比分配额差额" })}</span><b className="up">+SAR 0.3M</b></div>
                <div className="pc-appr-cell"><span>{tr({ en: "REVIEW GATE", ar: "بوابة المراجعة", zh: "评审门" })}</span><b className="gate-ok">{tr({ en: "Ready", ar: "مستعد", zh: "就绪" })}</b></div>
              </div>
            </div>
            <div className="bp-act-btns">
              <button className="dw-btn primary" onClick={() => { setApprovalStatus("approve"); pushLog({ en: "合同、索赔、拨付与权益 approved", ar: "合同、索赔、拨付与权益 معتمد", zh: "合同、索赔、拨付与权益 已批准" }); }}>{tr({ en: "Approve reviewed estimate", ar: "اعتماد التقدير المُراجَع", zh: "批准复核预估" })}</button>
              <button className="dw-btn danger" onClick={() => { setApprovalStatus("reject"); pushLog({ en: "合同、索赔、拨付与权益 rejected", ar: "合同、索赔、拨付与权益 مرفوض", zh: "合同、索赔、拨付与权益 已驳回" }); }}>{tr({ en: "Reject", ar: "رفض", zh: "驳回" })}</button>
              <button className="dw-btn" onClick={() => { setApprovalStatus("info"); pushLog({ en: "合同、索赔、拨付与权益 info requested", ar: "اطلاعات مطلوبة 合同、索赔、拨付与权益", zh: "合同、索赔、拨付与权益 已请求补充信息" }); }}>{tr({ en: "Request more info", ar: "طلب معلومات", zh: "请求补充信息" })}</button>
            </div>
          </React.Fragment>)}
        </div>
      </div>)}

      {cfg.uc === "UC-09" && (<div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", gap: 0, borderBottom: "1px solid var(--line)" }}>
          {[{ en: "Settlement", ar: "التسوية", zh: "结算" }, { en: "Reconciliation", ar: "المطابقة", zh: "对账" }, { en: "Liquidation", ar: "التصفية", zh: "清算" }].map((tab, i) => (<button key={i} onClick={() => { setActiveTab(i); setSearchPeriod(""); setSearchSettleType(""); setSearchAccount(""); }} style={{ padding: "10px 24px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: activeTab === i ? 700 : 400, color: activeTab === i ? "var(--primary)" : "#6b7280", borderBottom: activeTab === i ? "2px solid var(--primary)" : "none", marginBottom: "-1px" }}>{tr(tab)}</button>))}
        </div>

        <div style={{ display: "flex", gap: 12, margin: "12px 0", flexWrap: "wrap" }}>
          <select value={searchPeriod} onChange={e => setSearchPeriod(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 13 }}>
            <option value="">{tr({ en: "All Periods", ar: "جميع الفترات", zh: "全部财务期间" })}</option>
            <option value="FY2026-Q2">FY 2026 · Q2</option>
            <option value="FY2026-Q1">FY 2026 · Q1</option>
            <option value="FY2025-Q4">FY 2025 · Q4</option>
          </select>
          <select value={searchSettleType} onChange={e => setSearchSettleType(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 13 }}>
            <option value="">{tr({ en: "All Types", ar: "جميع الأنواع", zh: "全部结算类型" })}</option>
            <option value="monthly">月度结算</option>
            <option value="quarterly">季度结算</option>
            <option value="annual">年度结算</option>
            <option value="final">最终账户</option>
          </select>
          <select value={searchAccount} onChange={e => setSearchAccount(e.target.value)} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 13 }}>
            <option value="">{tr({ en: "All Accounts", ar: "جميع الحسابات", zh: "全部账户范围" })}</option>
            <option value="all">所有项目</option>
            <option value="housing">住房项目</option>
            <option value="municipal">市政项目</option>
          </select>
          <button onClick={() => { setSearchPeriod(""); setSearchSettleType(""); setSearchAccount(""); }} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid var(--line)", background: "none", cursor: "pointer", fontSize: 13 }}>{tr({ en: "Reset", ar: "إعادة تعيين", zh: "重置" })}</button>
        </div>

        {activeTab === 0 && (<div className="card pad" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Financial Period", ar: "الفترة المالية", zh: "财务期间" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Settlement Type", ar: "نوع التسوية", zh: "结算类型" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Account Scope", ar: "نطاق الحساب", zh: "账户范围" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Payment Order", ar: "أمر الدفع", zh: "付款订单编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Contract No.", ar: "رقم العقد", zh: "合同编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Pre-settlement Status", ar: "حالة التحقق قبل التسوية", zh: "结算前验证状态" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>SAP/Etimad {tr({ en: "Diff", ar: "الفرق", zh: "差异" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Pending Orders", ar: "الأوامر المعلقة", zh: "待处理付款订单" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Settlement Advice", ar: "نصيحة التسوية", zh: "建议结算" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Monthly Plan", ar: "خطة الشهر", zh: "月度计划" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Final Account", ar: "الحساب النهائي", zh: "最终账户" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Action", ar: "الإجراء", zh: "采纳结算" })}</th>
              </tr>
            </thead>
            <tbody>
              {SETTLEMENT_DATA.map((row, i) => (<tr key={i} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                <td style={{ padding: "8px" }}>{row.period}</td>
                <td style={{ padding: "8px" }}>{row.settleType}</td>
                <td style={{ padding: "8px" }}>{row.accountScope}</td>
                <td style={{ padding: "8px" }}>{row.paymentOrder}</td>
                <td style={{ padding: "8px" }}>{row.contractNo}</td>
                <td style={{ padding: "8px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                    <span style={{ color: row.preStatus.status === "通过" ? "#10b981" : "#ef4444", fontWeight: 700, fontSize: 12 }}>{row.preStatus.status}</span>
                    <button onClick={() => setModalOpen({ type: "preStatus", data: row.preStatus })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 11, padding: 0, textAlign: "left" }}>📋 {tr({ en: "Checklist", ar: "قائمة", zh: "清单" })} ({row.preStatus.missingEntries.length + row.preStatus.abnormalBalances.length + row.preStatus.unsettledInvoices.length})</button>
                  </div>
                </td>
                <td style={{ padding: "8px" }}>
                  <button onClick={() => setModalOpen({ type: "sapDiff", data: row.sapDiff })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.sapDiff.amount}</button>
                  {row.sapDiff.diffType !== "无差异" && <div style={{ fontSize: 10, color: "#f59e0b", marginTop: 2 }}>{row.sapDiff.diffType}</div>}
                </td>
                <td style={{ padding: "8px" }}>
                  <button onClick={() => row.pendingOrdersList.length > 0 && setModalOpen({ type: "pendingOrders", data: { count: row.pendingOrders, list: row.pendingOrdersList } })} style={{ background: "none", border: "none", color: row.pendingOrders > 0 ? "#ef4444" : "#10b981", fontWeight: 700, cursor: row.pendingOrdersList.length > 0 ? "pointer" : "default", textDecoration: row.pendingOrdersList.length > 0 ? "underline" : "none", fontSize: 12 }}>{row.pendingOrders} {tr({ en: "items", ar: "بنود", zh: "项" })}</button>
                </td>
                <td style={{ padding: "8px" }}><button onClick={() => setAdviceDrawer({ advice: row.settleAdvice, list: row.settleAdviceList, po: row.paymentOrder })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.settleAdvice} →</button></td>
                <td style={{ padding: "8px" }}>{row.monthlyPlan}</td>
                <td style={{ padding: "8px" }}>{row.finalAccount}</td>
                <td style={{ padding: "8px" }}><button onClick={() => handleAction(row, "adopt")} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid var(--primary)", color: "var(--primary)", background: "none", cursor: "pointer", fontSize: 11 }}>{tr({ en: "Adopt", ar: "اعتماد", zh: "采纳结算" })}</button></td>
              </tr>))}
            </tbody>
          </table>
        </div>)}

        {activeTab === 1 && (<div className="card pad" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Financial Period", ar: "الفترة المالية", zh: "财务期间" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Account Scope", ar: "نطاق الحساب", zh: "账户范围" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Pre-settlement Status", ar: "حالة التحقق قبل التسوية", zh: "结算前验证状态" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Payment Order", ar: "أمر الدفع", zh: "付款订单编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>SAP/Etimad {tr({ en: "Diff", ar: "الفرق", zh: "差异" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Settlement Advice", ar: "نصيحة التسوية", zh: "建议结算" })}</th>
              </tr>
            </thead>
            <tbody>
              {RECONCILIATION_DATA.map((row, i) => (<tr key={i} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                <td style={{ padding: "8px" }}>{row.period}</td>
                <td style={{ padding: "8px" }}>{row.accountScope}</td>
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "preStatus", data: row.preStatus })} style={{ background: "none", border: "none", color: row.preStatus.status === "通过" ? "#10b981" : "#ef4444", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.preStatus.status}</button></td>
                <td style={{ padding: "8px" }}>{row.paymentOrder}</td>
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "sapDiff", data: row.sapDiff })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.sapDiff.amount}</button></td>
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "settleAdvice", data: row.settleAdvice })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.settleAdvice}</button></td>
              </tr>))}
            </tbody>
          </table>
        </div>)}

        {activeTab === 2 && (<div className="card pad" style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--line)" }}>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Payment Order", ar: "أمر الدفع", zh: "付款订单编号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Payment Status", ar: "حالة الدفع", zh: "付款状态" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Liquidation Status", ar: "حالة التصفية", zh: "清算状态" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Liquidation No./Batch", ar: "رقم/دفعة التصفية", zh: "清算单号／清算批次号" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Liquidation Date", ar: "تاريخ التصفية", zh: "清算日期" })}</th>
                <th style={{ padding: "8px", textAlign: "right", fontWeight: 700, color: "#374151" }}>{tr({ en: "Liquidation Amount", ar: "مبلغ التصفية", zh: "清算金额" })}</th>
                <th style={{ padding: "8px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Payment Transaction No.", ar: "رقم المعاملة", zh: "支付流水号" })}</th>
              </tr>
            </thead>
            <tbody>
              {LIQUIDATION_DATA.map((row, i) => (<tr key={i} style={{ borderBottom: "1px solid var(--line)", verticalAlign: "top" }}>
                <td style={{ padding: "8px" }}>{row.paymentOrder}</td>
                <td style={{ padding: "8px" }}><span style={{ color: paymentStatusColors[row.paymentStatus] || "#6b7280", fontWeight: 700 }}>{row.paymentStatus}</span></td>
                <td style={{ padding: "8px" }}><span style={{ color: liquidationStatusColors[row.liquidationStatus] || "#6b7280", fontWeight: 700 }}>{row.liquidationStatus}</span></td>
                <td style={{ padding: "8px" }}>{row.liquidationNo}</td>
                <td style={{ padding: "8px" }}>{row.liquidationDate}</td>
                <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>{row.liquidationAmount}</td>
                <td style={{ padding: "8px", fontFamily: "monospace" }}>{row.transactionNo}</td>
              </tr>))}
            </tbody>
          </table>
        </div>)}

        <div className="uf-sec bp-actions">
          <div className="uf-h">{tr({ en: "Decision", ar: "القرار", zh: "审批操作" })}</div>
          {approvalStatus ? (<div className="bp-next">
            <div className="bp-next-h">
              {approvalStatus === "approve" ? "✓ " + tr({ en: "Approved", ar: "معتمد", zh: "已批准" }) : approvalStatus === "reject" ? "✕ " + tr({ en: "Rejected", ar: "مرفوض", zh: "已驳回" }) : "✎ " + tr({ en: "Info requested", ar: "طُلبت معلومات", zh: "已请求补充信息" })}
            </div>
            <div className="bp-next-b">
              {tr(approvalStatus === "approve" ? { en: "Reviewed estimate approved · routed to budget commitment (audit-logged).", ar: "اعتُمد التقدير المُراجَع وتوجيهه إلى التزام الميزانية.", zh: "复核预估已批准 · 转入预算承诺(已写审计)。" } : approvalStatus === "reject" ? { en: "Returned to Qaboul with reasons; applicant may resubmit.", ar: "أُعيد لقبول.", zh: "附理由退回 Qaboul,申请部门可重新提交。" } : { en: "Quantity & unit-rate evidence requested from department via Qaboul.", ar: "طُلبت الأدلة.", zh: "已通过 Qaboul 向申请部门索取工程量与单价佐证。" })}
            </div>
            <button className="dw-btn" onClick={() => { setApprovalStatus(null); pushLog({ en: "财务关账、对账与结算 review reopened", ar: "إعادة فتح مراجعة 财务关账、对账与结算", zh: "财务关账、对账与结算 重新评审" }); }}>↺ {tr({ en: "Reopen", ar: "إعادة فتح", zh: "重新评审" })}</button>
          </div>) : (<React.Fragment>
            <div className="pc-appr-sum">
              <div className="pc-appr-l">{tr({ en: "Approval object · reviewed estimate vs allocation", ar: "موضوع الاعتماد", zh: "审批对象 · 复核预估与分配额差额" })}</div>
              <div className="pc-appr-row">
                <div className="pc-appr-cell"><span>{tr({ en: "UC", ar: "UC", zh: "UC" })}</span><b className="pc-appr-nm">{tr(ucName)}</b></div>
                <div className="pc-appr-cell"><span>{tr({ en: "REVIEWED ESTIMATE", ar: "التقدير المُراجَع", zh: "复核预估" })}</span><b>SAR 12.3M</b></div>
                <div className="pc-appr-cell"><span>{tr({ en: "DELTA VS ALLOCATION", ar: "الفرق مقابل التخصيص", zh: "对比分配额差额" })}</span><b className="up">+SAR 0.8M</b></div>
                <div className="pc-appr-cell"><span>{tr({ en: "REVIEW GATE", ar: "بوابة المراجعة", zh: "评审门" })}</span><b className="gate-ok">{tr({ en: "Ready", ar: "مستعد", zh: "就绪" })}</b></div>
              </div>
            </div>
            <div className="bp-act-btns">
              <button className="dw-btn primary" onClick={() => { setApprovalStatus("approve"); pushLog({ en: "财务关账、对账与结算 approved", ar: "财务关账、对账与结算 معتمد", zh: "财务关账、对账与结算 已批准" }); }}>{tr({ en: "Approve reviewed estimate", ar: "اعتماد التقدير المُراجَع", zh: "批准复核预估" })}</button>
              <button className="dw-btn danger" onClick={() => { setApprovalStatus("reject"); pushLog({ en: "财务关账、对账与结算 rejected", ar: "财务关账、对账与结算 مرفوض", zh: "财务关账、对账与结算 已驳回" }); }}>{tr({ en: "Reject", ar: "رفض", zh: "驳回" })}</button>
              <button className="dw-btn" onClick={() => { setApprovalStatus("info"); pushLog({ en: "财务关账、对账与结算 info requested", ar: "اطلاعات مطلوبة 财务关账、对账与结算", zh: "财务关账、对账与结算 已请求补充信息" }); }}>{tr({ en: "Request more info", ar: "طلب معلومات", zh: "请求补充信息" })}</button>
            </div>
          </React.Fragment>)}
        </div>
      </div>)}

      {typeof document !== "undefined" && createPortal(<React.Fragment>{modalOpen && (<div className="al-overlay" style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,.5)", WebkitBackdropFilter: "blur(3px) saturate(1.1)", backdropFilter: "blur(3px) saturate(1.1)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100000 }} onClick={() => setModalOpen(null)}>
        <div className="modal-content" style={{ background: "white", borderRadius: 12, padding: 20, width: 480, maxHeight: "80vh", overflowY: "auto" }} onClick={e => e.stopPropagation()}>
          {modalOpen.type === "reasonList" && (<>
            <h3 style={{ margin: "0 0 12px 0" }}>{tr({ en: "Reason List", ar: "قائمة الأسباب", zh: "理由清单" })}</h3>
            <ul style={{ margin: 0, paddingLeft: 20 }}>{modalOpen.data.map((r, i) => <li key={i} style={{ marginBottom: 4 }}>{r}</li>)}</ul>
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button>
          </>)}
          {modalOpen.type === "cert" && (<>
            <h3 style={{ margin: "0 0 12px 0" }}>{tr({ en: "Completion Certificate", ar: "شهادة الإنجاز", zh: "完工证书" })}</h3>
            <div style={{ padding: 12, background: "#f3f4f6", borderRadius: 8 }}>📄 {modalOpen.data}</div>
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button>
          </>)}
          {modalOpen.type === "qtyPlan" && (<>
            <h3 style={{ margin: "0 0 12px 0" }}>{tr({ en: "Quantity Plan Details", ar: "تفاصيل خطة الكمية", zh: "数量计划详情" })}</h3>
            <div style={{ padding: 12, background: "#f3f4f6", borderRadius: 8 }}>
              <div style={{ marginBottom: 8 }}><b>{tr({ en: "Execution Progress:", ar: "تقدم التنفيذ:", zh: "执行进度:" })}</b> {modalOpen.data}</div>
              <div><b>{tr({ en: "Plan Details:", ar: "تفاصيل الخطة:", zh: "计划详情:" })}</b></div>
              <ul style={{ margin: 4, paddingLeft: 20 }}>
                <li>{tr({ en: "Total planned quantity: 100 units", ar: "الكمية المخططة: 100 وحدة", zh: "计划总量: 100 单位" })}</li>
                <li>{tr({ en: "Executed: 85 units", ar: "المتنفذ: 85 وحدة", zh: "已执行: 85 单位" })}</li>
                <li>{tr({ en: "Remaining: 15 units", ar: "المتبقي: 15 وحدة", zh: "剩余: 15 单位" })}</li>
              </ul>
            </div>
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button>
          </>)}
          {modalOpen.type === "sap" && (<>
            <h3 style={{ margin: "0 0 12px 0" }}>SAP/Asas {tr({ en: "Budget Status", ar: "حالة الميزانية", zh: "预算状态" })}</h3>
            <div style={{ padding: 12, background: "#f3f4f6", borderRadius: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>{tr({ en: "Commitment", ar: "التزام", zh: "承诺" })}</span><b>{modalOpen.data.commitment}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>{tr({ en: "Invoice", ar: "الفاتورة", zh: "发票" })}</span><b>{modalOpen.data.invoice}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>{tr({ en: "Payment", ar: "الدفع", zh: "付款" })}</span><b>{modalOpen.data.payment}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>{tr({ en: "Balance", ar: "الرصيد", zh: "余额" })}</span><b>{modalOpen.data.balance}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid #d1d5db" }}><span>{tr({ en: "Liquidity Status", ar: "حالة السيولة", zh: "流动性状态" })}</span><b style={{ color: modalOpen.data.liquidity === "充足" ? "#10b981" : "#ef4444" }}>{modalOpen.data.liquidity}</b></div>
              {modalOpen.data.liquidity === "不足" && (<div style={{ marginTop: 8, padding: 8, background: "#fee2e2", borderRadius: 6, color: "#b91c1c", fontSize: 12 }}>⚠ {tr({ en: "Payment order approved but no liquidity on budget line — please apply for budget transfer or enhancement", ar: "أمر الدفع مقرر لكن لا يوجد توافر على البند — يرجى تقديم طلب مناقلة أو تعزيز الميزانية", zh: "付款单已获批准但预算行无流动性，请申请预算转移或增强" })}</div>)}
            </div>
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button>
          </>)}
          {modalOpen.type === "advice" && (<>
            <h3 style={{ margin: "0 0 12px 0" }}>{tr({ en: "System Advice", ar: "نصيحة النظام", zh: "系统建议" })}</h3>
            <div style={{ padding: 12, background: "#f3f4f6", borderRadius: 8 }}>
              <div style={{ marginBottom: 8 }}><b>{modalOpen.data}</b></div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{tr({ en: "Recommendation details and supporting reasons for this advice.", ar: "تفاصيل التوصية والأسباب الداعمة لهذه النصيحة.", zh: "此建议的详细推荐理由和支持依据。" })}</div>
            </div>
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button>
          </>)}
          {modalOpen.type === "preStatus" && (<>
            <h3 style={{ margin: "0 0 12px 0" }}>{tr({ en: "Pre-settlement Verification Status", ar: "حالة التحقق قبل التسوية", zh: "结算前验证状态" })}</h3>
            <div style={{ marginBottom: 10 }}><b>{tr({ en: "Verification Result:", ar: "نتيجة التحقق:", zh: "验证结果:" })}</b> <span style={{ color: modalOpen.data.status === "通过" ? "#10b981" : "#ef4444", fontWeight: 700 }}>{modalOpen.data.status}</span></div>
            {(() => {
              const norm = (arr) => arr.map(x => typeof x === "string" ? { item: x, note: "" } : x);
              const rows = [
                ...norm(modalOpen.data.missingEntries).map(x => ({ ...x, cat: tr({ en: "Missing Entries", ar: "مدخلات مفقودة", zh: "缺失条目" }), cls: "amber" })),
                ...norm(modalOpen.data.abnormalBalances).map(x => ({ ...x, cat: tr({ en: "Abnormal Balances", ar: "أرصدة شاذة", zh: "异常余额" }), cls: "red" })),
                ...norm(modalOpen.data.unsettledInvoices).map(x => ({ ...x, cat: tr({ en: "Unsettled Invoices", ar: "فواتير غير مسوّاة", zh: "未结算发票" }), cls: "blue" })),
              ];
              const catColor = { amber: "#d97706", red: "#dc2626", blue: "#2563eb" };
              const catBg = { amber: "#fef3c7", red: "#fee2e2", blue: "#dbeafe" };
              if (rows.length === 0) return <div style={{ padding: 16, background: "#ecfdf5", borderRadius: 8, color: "#10b981", textAlign: "center" }}>✓ {tr({ en: "Verification passed — no checklist items.", ar: "اجتاز التحقق — لا توجد بنود.", zh: "验证通过,无清单项。" })}</div>;
              return (<div style={{ border: "1px solid var(--line)", borderRadius: 8, overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead><tr style={{ background: "#f8fafc", borderBottom: "2px solid var(--line)" }}>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#374151", width: "30%" }}>{tr({ en: "Type", ar: "النوع", zh: "类型" })}</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#374151" }}>{tr({ en: "Item", ar: "البند", zh: "条目" })}</th>
                    <th style={{ padding: "8px 10px", textAlign: "left", fontWeight: 700, color: "#374151", width: "26%" }}>{tr({ en: "Impact / Status", ar: "الأثر / الحالة", zh: "影响 / 状态" })}</th>
                  </tr></thead>
                  <tbody>{rows.map((r, i) => (<tr key={i} style={{ borderBottom: "1px solid var(--line)" }}>
                    <td style={{ padding: "8px 10px" }}><span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: catBg[r.cls], color: catColor[r.cls] }}>{r.cat}</span></td>
                    <td style={{ padding: "8px 10px" }}>{r.item}</td>
                    <td style={{ padding: "8px 10px", color: "#6b7280" }}>{r.note || "—"}</td>
                  </tr>))}</tbody>
                </table>
              </div>);
            })()}
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button>
          </>)}
          {modalOpen.type === "sapDiff" && (<>
            <h3 style={{ margin: "0 0 12px 0" }}>SAP/Etimad {tr({ en: "Difference Analysis", ar: "تحليل الفرق", zh: "差异分析" })}</h3>
            <div style={{ padding: 12, background: "#f3f4f6", borderRadius: 8 }}>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 8 }}>{tr({ en: "Same settlement request · payment-order amount breakdown", ar: "نفس طلب التسوية · تفصيل مبلغ أمر الدفع", zh: "同一结算请求 · 付款订单金额明细" })}</div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>{tr({ en: "Contract Amount", ar: "مبلغ العقد", zh: "合同金额" })}</span><b>{modalOpen.data.contractAmount}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>{tr({ en: "Invoice Amount", ar: "مبلغ الفاتورة", zh: "发票金额" })}</span><b>{modalOpen.data.invoiceAmount}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><span>{tr({ en: "Payment Amount", ar: "مبلغ الدفع", zh: "付款金额" })}</span><b>{modalOpen.data.paymentAmount}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid #d1d5db" }}><span><b>{tr({ en: "Difference", ar: "الفرق", zh: "差异" })}</b></span><b style={{ color: modalOpen.data.amount === "SAR 0" ? "#10b981" : "#ef4444" }}>{modalOpen.data.amount}</b></div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                <span>{tr({ en: "Difference Type", ar: "نوع الفرق", zh: "差异类型" })}</span>
                <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: modalOpen.data.diffType === "无差异" ? "#dcfce7" : "#fef3c7", color: modalOpen.data.diffType === "无差异" ? "#16a34a" : "#d97706" }}>{modalOpen.data.diffType}</span>
              </div>
              <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 6 }}>{tr({ en: "Types: 时间(timing) · 输入错误(input error) · 缺失限制(missing constraint) · 异步来源(async source)", ar: "الأنواع: توقيت · خطأ إدخال · قيد مفقود · مصدر غير متزامن", zh: "类型: 时间 · 输入错误 · 缺失限制 · 异步来源" })}</div>
              {modalOpen.data.diffType !== "无差异" && <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #d1d5db" }}><b>{tr({ en: "Root Cause:", ar: "السبب:", zh: "原因:" })}</b> {modalOpen.data.reason}</div>}
            </div>
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button>
          </>)}
          {modalOpen.type === "pendingOrders" && (<>
            <h3 style={{ margin: "0 0 12px 0" }}>{tr({ en: "Pending Payment Orders", ar: "أوامر الدفع المعلّقة", zh: "待处理付款订单" })} <span style={{ fontSize: 13, color: "#6b7280", fontWeight: 400 }}>({modalOpen.data.count})</span></h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {modalOpen.data.list.length > 0 ? modalOpen.data.list.map((o, i) => (
                <div key={i} style={{ padding: 10, background: "#f3f4f6", borderRadius: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}><b style={{ fontFamily: "monospace" }}>{o.po}</b><b>{o.amount}</b></div>
                  <div style={{ fontSize: 12, color: "#374151", marginBottom: 6 }}>{o.desc}</div>
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 4, background: "#fef3c7", color: "#d97706" }}>{o.status}</span>
                </div>
              )) : <div style={{ fontSize: 13, color: "#10b981" }}>✓ {tr({ en: "No pending payment orders.", ar: "لا توجد أوامر معلّقة.", zh: "无待处理付款订单。" })}</div>}
            </div>
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button>
          </>)}
          {/* settleAdvice now opens the right-side drawer (adviceDrawer) above */}
          {modalOpen.type === "returnSuccess" && (<>
            <h3 style={{ margin: "0 0 12px 0", color: "#10b981" }}>✓ {tr({ en: "Return Successful", ar: "الإرجاع ناجح", zh: "退回成功" })}</h3>
            <div style={{ padding: 12, background: "#ecfdf5", borderRadius: 8 }}>{tr({ en: "The claim has been returned and the reason has been recorded.", ar: "تم إرجاع المطالبة وتسجيل السبب.", zh: "索赔已退回，退回原因已记录。" })}</div>
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "OK", ar: "موافق", zh: "确定" })}</button>
          </>)}
          {modalOpen.type === "adoptSuccess" && (<>
            <h3 style={{ margin: "0 0 12px 0", color: "#10b981" }}>✓ {tr({ en: "Adopt Successful", ar: "الاعتماد ناجح", zh: "采纳成功" })}</h3>
            <div style={{ padding: 12, background: "#ecfdf5", borderRadius: 8 }}>{tr({ en: "The settlement has been approved and will be processed.", ar: "تم اعتماد التسوية وسيتم معالجتها.", zh: "结算已采纳，将进入处理流程。" })}</div>
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "OK", ar: "موافق", zh: "确定" })}</button>
          </>)}
          {modalOpen.type === "approvalSuccess" && (<>
            <h3 style={{ margin: "0 0 12px 0", color: modalOpen.data === "approve" ? "#10b981" : modalOpen.data === "reject" ? "#ef4444" : "#3b82f6" }}>
              {modalOpen.data === "approve" ? "✓ " : modalOpen.data === "reject" ? "✕ " : "✎ "}
              {tr(modalOpen.data === "approve" ? { en: "Approved", ar: "معتمد", zh: "已批准" } : modalOpen.data === "reject" ? { en: "Rejected", ar: "مرفوض", zh: "已驳回" } : { en: "Info Requested", ar: "طلبت معلومات", zh: "已请求补充信息" })}
            </h3>
            <div style={{ padding: 12, background: modalOpen.data === "approve" ? "#ecfdf5" : modalOpen.data === "reject" ? "#fee2e2" : "#eff6ff", borderRadius: 8 }}>
              {tr(modalOpen.data === "approve" ? { en: "Reviewed estimate approved and routed to budget commitment.", ar: "تم اعتماد التقدير المُراجَع وتوجيهه إلى التزام الميزانية.", zh: "复核预估已批准，转入预算承诺流程。" } : modalOpen.data === "reject" ? { en: "Returned with reasons; applicant may resubmit.", ar: "أُعيد مع الأسباب، يمكن للمُقدم إعادة التقديم.", zh: "附理由退回，申请部门可重新提交。" } : { en: "Evidence requested from the department via Qaboul.", ar: "طلبت الأدلة من القسم عبر قابول.", zh: "已通过 Qaboul 向申请部门索取佐证。" })}
            </div>
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "OK", ar: "موافق", zh: "确定" })}</button>
          </>)}
        </div>
      </div>)}</React.Fragment>, document.body)}

      {typeof document !== "undefined" && createPortal(<React.Fragment>{confirmModal && (<div className="al-overlay" style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,.5)", WebkitBackdropFilter: "blur(3px) saturate(1.1)", backdropFilter: "blur(3px) saturate(1.1)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100000 }} onClick={() => setConfirmModal(null)}>
        <div className="modal-content" style={{ background: "white", borderRadius: 12, padding: 20, width: 400 }} onClick={e => e.stopPropagation()}>
          <h3 style={{ margin: "0 0 12px 0", color: confirmModal.actionType === "adopt" ? "var(--primary)" : "#ef4444" }}>
            {confirmModal.actionType === "adopt" ? "✦ " : "⚠ "}
            {tr(confirmModal.actionType === "adopt" ? { en: "Confirm Adoption", ar: "تأكيد الاعتماد", zh: "确认采纳" } : { en: "Confirm Return", ar: "تأكيد الإرجاع", zh: "确认退回" })}
          </h3>
          <p style={{ margin: "0 0 16px 0" }}>
            {tr(confirmModal.actionType === "adopt" ? { en: "Are you sure you want to adopt this settlement?", ar: "هل أنت متأكد من رغبتك في اعتماد هذه التسوية؟", zh: "确定要采纳此结算吗？" } : { en: "Are you sure you want to return this claim?", ar: "هل أنت متأكد من رغبتك في إرجاع هذه المطالبة؟", zh: "确定要退回此索赔申请吗？" })}
          </p>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => setConfirmModal(null)} style={{ padding: "8px 20px", borderRadius: 8, border: "1px solid var(--line)", background: "none", cursor: "pointer" }}>{tr({ en: "Cancel", ar: "إلغاء", zh: "取消" })}</button>
            <button onClick={confirmAction} style={{ padding: "8px 20px", borderRadius: 8, background: confirmModal.actionType === "adopt" ? "var(--primary)" : "#ef4444", color: "white", border: "none", cursor: "pointer" }}>
              {tr(confirmModal.actionType === "adopt" ? { en: "Confirm", ar: "تأكيد", zh: "确认采纳" } : { en: "Confirm", ar: "تأكيد", zh: "确认退回" })}
            </button>
          </div>
        </div>
      </div>)}</React.Fragment>, document.body)}
      {/* 建议结算 — report modal (弹窗, centered) — portaled to body with the system .al-overlay scrim */}
      {typeof document !== "undefined" && createPortal(<React.Fragment>
      {adviceDrawer && (
        <div className="al-overlay" style={{ alignItems: "center", justifyContent: "center", zIndex: 100000 }} onClick={() => setAdviceDrawer(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#ffffff", borderRadius: 12, width: "min(560px, 92vw)", maxHeight: "82vh", display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 24px 60px rgba(0,0,0,0.18)" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--line)", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>{tr({ en: "Suggested Settlement Report", ar: "تقرير التسوية المقترحة", zh: "建议结算报告" })}</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>{adviceDrawer.advice} · <span style={{ fontFamily: "monospace", color: "var(--primary)" }}>{adviceDrawer.po}</span></div>
              </div>
              <button onClick={() => setAdviceDrawer(null)} style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#6b7280", lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ padding: 20, overflowY: "auto", flex: 1 }}>
              <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 12 }}>{tr({ en: "System-suggested settlement list based on verification & difference analysis.", ar: "قائمة التسوية المقترحة من النظام بناءً على التحقق وتحليل الفرق.", zh: "系统依据验证与差异分析给出的建议结算清单。" })}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {adviceDrawer.list.map((s, i) => (
                  <div key={i} style={{ padding: 12, border: "1px solid var(--line)", borderRadius: 8, background: "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 6 }}>
                      <b style={{ fontSize: 13 }}>{s.item}</b>
                      <b style={{ whiteSpace: "nowrap", color: "var(--primary)" }}>{s.amount}</b>
                    </div>
                    <div style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>{s.basis}</div>
                    <span style={{ fontSize: 11, padding: "3px 10px", borderRadius: 4, fontWeight: 700, background: s.action === "采纳" || s.action === "部分采纳" ? "#dcfce7" : s.action === "挂起" ? "#fef3c7" : "#e0e7ff", color: s.action === "采纳" || s.action === "部分采纳" ? "#16a34a" : s.action === "挂起" ? "#d97706" : "#4338ca" }}>{tr({ en: "Advice", ar: "نصيحة", zh: "建议" })}: {s.action}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: 16, borderTop: "1px solid var(--line)", display: "flex", gap: 8 }}>
              <button onClick={() => { const po = adviceDrawer.po; setAdviceDrawer(null); pushLog({ en: "Settlement advice adopted for " + po, ar: "اعتماد نصيحة التسوية لـ " + po, zh: "已采纳 " + po + " 的建议结算" }); }} style={{ flex: 1, padding: "10px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 700 }}>{tr({ en: "Adopt Advice", ar: "اعتماد النصيحة", zh: "采纳建议" })}</button>
              <button onClick={() => setAdviceDrawer(null)} style={{ padding: "10px 16px", borderRadius: 8, border: "1px solid var(--line)", background: "none", cursor: "pointer" }}>{tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button>
            </div>
          </div>
        </div>
      )}
      </React.Fragment>, document.body)}
      {/* floating Q&A — portaled to body */}
      {typeof document !== "undefined" && createPortal(<React.Fragment><button className="wb-qfab" onClick={() => setQaOpen(o => !o)} aria-label="AI Narratives & Q&A" title={tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}>🤖</button>
      {qaOpen && <div className="wb-qpanel qa">
        <div className="wb-qph"><span className={"wb-dot " + (cfg.tone || "violet")} /> <b>{tr({ en: "AI Narratives & Q&A", ar: "السرد الذكي والأسئلة", zh: "AI 叙述与问答" })}</b><button className="wb-qx" onClick={() => setQaOpen(false)}>✕</button></div>
        <div className="wb-pb wb-qbody">
          {qa.length === 0 && !thinking && <div className="wb-narrwrap"><div className="wb-ntag">{ucl(cfg.uc, tr({ en: "NARRATIVE", ar: "السرد", zh: "叙述" }))}</div>
          <div className="wb-narr">
            {cfg.narr.p.map((p, i) => <p key={i}>{tr(p)}</p>)}
            <div className="wb-rp">{tr({ en: "Recommended priorities:", ar: "الأولويات الموصى بها:", zh: "建议优先事项:" })}</div>
            <ul>{cfg.narr.recs.map((r, i) => <li key={i}>{tr(r)}</li>)}</ul>
            <div className="wb-src">{ucl(cfg.uc, tr(cfg.narr.src))}</div>
          </div></div>}
          {(qa.length > 0 || thinking) && <div className="wb-qa" ref={qaRef}>
            {qa.map((m, i) => (<div className={"wb-qm " + m.role} key={i}><div className="bb"><Money v={m.text} /></div></div>))}
            {thinking && <div className="wb-qm a"><div className="bb think"><span className="wb-typing"><i /><i /><i /></span></div></div>}
          </div>}
          <div className={"wb-sqh" + (qa.length > 0 ? " tog" : "")} onClick={() => { if (qa.length > 0) setShowSugs(v => !v); }}>{tr({ en: "SUGGESTED QUESTIONS", ar: "أسئلة مقترحة", zh: "建议问题" })}{qa.length > 0 && <span className="sqtg">{showSugs ? "▾" : "▸"}</span>}</div>
          {(qa.length === 0 || showSugs) && cfg.qs.map((q, i) => (<div className="wb-sq" key={i} onClick={() => askQ(i)}>{tr(q)} <span className="ar">→</span></div>))}
          <div className="wb-askh">{tr({ en: "Ask the agent…", ar: "اسأل الوكيل…", zh: "向智能体提问…" })}</div>
          <div className="wb-ask"><input value={ask} onChange={e => setAsk(e.target.value)} placeholder={tr({ en: "Type your question…", ar: "اكتب سؤالك…", zh: "输入你的问题…" })} onKeyDown={e => e.key === "Enter" && askQ(-1, ask)} /><button className="btn sm" onClick={() => askQ(-1, ask)}>{tr({ en: "Send", ar: "إرسال", zh: "发送" })}</button></div>
        </div>
      </div>}</React.Fragment>, document.body)}
    </div>
  </div>);
}
