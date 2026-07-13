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
  const [approvalStatus, setApprovalStatus] = useState(null);
  const [ask, setAsk] = useState("");
  const [qa, setQa] = useState([]);
  const [qaOpen, setQaOpen] = useState(false);
  const [thinking, setThinking] = useState(false);
  const [showSugs, setShowSugs] = useState(false);
  const qaRef = useRef(null);
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

  const SETTLEMENT_DATA = [
    { period: "FY 2026 · Q2", settleType: "月度结算", accountScope: "所有项目", paymentOrder: "PO-2026-0601", contractNo: "CON-2025-A001", preStatus: { status: "通过", issues: [] }, sapDiff: { amount: "SAR 0", sapValue: "SAR 2.5M", etimadValue: "SAR 2.5M", reason: "无差异" }, pendingOrders: 0, settleAdvice: "批准结算", monthlyPlan: "已生成", finalAccount: "-" },
    { period: "FY 2026 · Q2", settleType: "月度结算", accountScope: "住房项目", paymentOrder: "PO-2026-0602", contractNo: "CON-2025-B001", preStatus: { status: "不通过", issues: ["数据缺失: 3 条记录", "异常余额: 科目 2310"] }, sapDiff: { amount: "SAR 0.3M", sapValue: "SAR 3.8M", etimadValue: "SAR 3.5M", reason: "Etimad 延迟同步" }, pendingOrders: 2, settleAdvice: "待处理差异", monthlyPlan: "已生成", finalAccount: "-" },
    { period: "FY 2026 · Q1", settleType: "季度结算", accountScope: "市政项目", paymentOrder: "PO-2026-0301", contractNo: "CON-2025-C001", preStatus: { status: "通过", issues: [] }, sapDiff: { amount: "SAR 0", sapValue: "SAR 5.6M", etimadValue: "SAR 5.6M", reason: "无差异" }, pendingOrders: 0, settleAdvice: "批准结算", monthlyPlan: "-", finalAccount: "已生成" },
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

  const statusColors = { "新建": "#6b7280", "审计中": "#3b82f6", "不完整": "#f59e0b", "已批准": "#10b981", "已审查": "#8b5cf6" };
  const paymentStatusColors = { "待付款": "#f59e0b", "付款处理中": "#3b82f6", "已付款": "#10b981", "付款失败": "#ef4444" };
  const liquidationStatusColors = { "待清算": "#f59e0b", "清算中": "#3b82f6", "已清算": "#10b981", "清算失败": "#ef4444" };

  const filteredContractData = CONTRACT_DATA.filter(item => {
    const matchClaim = !searchClaimNo || item.claimNo.toLowerCase().includes(searchClaimNo.toLowerCase());
    const matchPayment = !searchPaymentOrder || item.paymentOrder.toLowerCase().includes(searchPaymentOrder.toLowerCase());
    return matchClaim && matchPayment;
  });

  const filteredClaimData = CLAIM_DATA.filter(item => {
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

  const back = () => { if (backRoute) { const b = backRoute; setBackRoute(null); setRoute(b); } else setRoute(cfg.back); };

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
          {[{ en: "Contracts", ar: "العقود", zh: "合同" }, { en: "Claims", ar: "المطالبات", zh: "索赔" }, { en: "Payroll", ar: "مرتبات الموظفين", zh: "员工工资" }].map((tab, i) => (<button key={i} onClick={() => { setActiveTab(i); setSearchClaimNo(""); setSearchPaymentOrder(""); }} style={{ padding: "10px 24px", border: "none", background: "none", cursor: "pointer", fontSize: 14, fontWeight: activeTab === i ? 700 : 400, color: activeTab === i ? "var(--primary)" : "#6b7280", borderBottom: activeTab === i ? "2px solid var(--primary)" : "none", marginBottom: "-1px" }}>{tr(tab)}</button>))}
        </div>

        {(activeTab === 0 || activeTab === 1) && (<div style={{ display: "flex", gap: 12, margin: "12px 0", flexWrap: "wrap" }}>
          <input type="text" value={searchClaimNo} onChange={e => setSearchClaimNo(e.target.value)} placeholder={tr({ en: "Claim No.", ar: "رقم المطالبة", zh: "索赔编号" })} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 13, minWidth: 180 }} />
          <input type="text" value={searchPaymentOrder} onChange={e => setSearchPaymentOrder(e.target.value)} placeholder={tr({ en: "Payment Order No.", ar: "رقم أمر الدفع", zh: "付款订单编号" })} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid var(--line)", fontSize: 13, minWidth: 180 }} />
          <button onClick={() => { setSearchClaimNo(""); setSearchPaymentOrder(""); }} style={{ padding: "6px 16px", borderRadius: 8, border: "1px solid var(--line)", background: "none", cursor: "pointer", fontSize: 13 }}>{tr({ en: "Reset", ar: "إعادة تعيين", zh: "重置" })}</button>
        </div>)}

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
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "preStatus", data: row.preStatus })} style={{ background: "none", border: "none", color: row.preStatus.status === "通过" ? "#10b981" : "#ef4444", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.preStatus.status}</button></td>
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "sapDiff", data: row.sapDiff })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.sapDiff.amount}</button></td>
                <td style={{ padding: "8px", fontWeight: 700, color: row.pendingOrders > 0 ? "#ef4444" : "#10b981" }}>{row.pendingOrders} {tr({ en: "items", ar: "بنود", zh: "项" })}</td>
                <td style={{ padding: "8px" }}><button onClick={() => setModalOpen({ type: "settleAdvice", data: row.settleAdvice })} style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer", textDecoration: "underline", fontSize: 12 }}>{row.settleAdvice}</button></td>
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

      {modalOpen && (<div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setModalOpen(null)}>
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
            <div style={{ padding: 12, background: "#f3f4f6", borderRadius: 8 }}>
              <div style={{ marginBottom: 8 }}><b>{tr({ en: "Verification Result:", ar: "نتيجة التحقق:", zh: "验证结果:" })}</b> <span style={{ color: modalOpen.data.status === "通过" ? "#10b981" : "#ef4444" }}>{modalOpen.data.status}</span></div>
              {modalOpen.data.issues && modalOpen.data.issues.length > 0 && (<>
                <div><b>{tr({ en: "Issues found:", ar: "المشكلات:", zh: "发现问题:" })}</b></div>
                <ul style={{ margin: 4, paddingLeft: 20 }}>{modalOpen.data.issues.map((issue, i) => <li key={i}>{issue}</li>)}</ul>
              </>)}
              {(!modalOpen.data.issues || modalOpen.data.issues.length === 0) && (<div>{tr({ en: "No issues found.", ar: "لا توجد مشكلات.", zh: "未发现问题。" })}</div>)}
            </div>
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button>
          </>)}
          {modalOpen.type === "sapDiff" && (<>
            <h3 style={{ margin: "0 0 12px 0" }}>SAP/Etimad {tr({ en: "Difference Analysis", ar: "تحليل الفرق", zh: "差异分析" })}</h3>
            <div style={{ padding: 12, background: "#f3f4f6", borderRadius: 8 }}>
              <div style={{ marginBottom: 8 }}><b>{tr({ en: "Difference Amount:", ar: "مبلغ الفرق:", zh: "差异金额:" })}</b> {modalOpen.data.amount}</div>
              <div style={{ marginBottom: 4 }}><b>SAP {tr({ en: "Value:", ar: "القيمة:", zh: "值:" })}</b> {modalOpen.data.sapValue}</div>
              <div style={{ marginBottom: 4 }}><b>Etimad {tr({ en: "Value:", ar: "القيمة:", zh: "值:" })}</b> {modalOpen.data.etimadValue}</div>
              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #d1d5db" }}>
                <b>{tr({ en: "Root Cause:", ar: "السبب:", zh: "原因:" })}</b> {modalOpen.data.reason}
              </div>
            </div>
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button>
          </>)}
          {modalOpen.type === "settleAdvice" && (<>
            <h3 style={{ margin: "0 0 12px 0" }}>{tr({ en: "Settlement Advice", ar: "نصيحة التسوية", zh: "建议结算" })}</h3>
            <div style={{ padding: 12, background: "#f3f4f6", borderRadius: 8 }}>
              <div style={{ marginBottom: 8 }}><b>{modalOpen.data}</b></div>
              <div style={{ fontSize: 12, color: "#6b7280" }}>{tr({ en: "Based on verification and difference analysis.", ar: "بناءً على التحقق وتحليل الفرق.", zh: "根据验证和差异分析形成的结算建议。" })}</div>
            </div>
            <button onClick={() => setModalOpen(null)} style={{ marginTop: 16, padding: "8px 16px", borderRadius: 8, background: "var(--primary)", color: "white", border: "none", cursor: "pointer" }}>{tr({ en: "Close", ar: "إغلاق", zh: "关闭" })}</button>
          </>)}
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
      </div>)}

      {confirmModal && (<div className="modal-overlay" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setConfirmModal(null)}>
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
      </div>)}
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
