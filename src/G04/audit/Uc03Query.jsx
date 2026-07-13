/* 审计部 — UC-03 智能问数与审计 (Smart Query & Audit) 专属页面.
   布局对标 src/group02/Group02Pages.jsx 的 SmartQueryAuditPage
   (标题 + 元数据条 + 左查询 / 右审计轨迹),复用全局 g2-* 样式
   (group02.css 在 App.jsx 全局引入)。内容改为审计部语境,数据取自 useStore。 */
import React, { useState } from "react";
import { useStore } from "../../shared/store.jsx";

const PAGE = {
  title: { en: "Smart query & audit", ar: "الاستعلام الذكي والتدقيق", zh: "智能问数与审计" },
  sub: { en: "Ask within the current audit context, inspect the source behind every number, and review the query & approval audit trail.", ar: "اسأل ضمن سياق التدقيق الحالي، وافحص مصدر كل رقم، وراجع مسار تدقيق الاستعلامات والاعتمادات.", zh: "在当前审计上下文中提问，查看每个数字的来源，并审阅查询与审批的审计轨迹。" },
};

const PRESETS = [
  { id: "exception", q: { en: "What are today's critical exceptions?", ar: "ما الاستثناءات الحرجة اليوم؟", zh: "今天有哪些严重异常?" } },
  { id: "claim", q: { en: "What is missing from claim CLM-7731?", ar: "ما الناقص في المطالبة CLM-7731؟", zh: "索赔包 CLM-7731 缺什么材料?" } },
  { id: "diff", q: { en: "Show all SAP↔Etimad differences this quarter", ar: "أظهر فروق ساب↔اعتماد هذا الربع", zh: "显示本季度全部 SAP↔Etimad 差异" } },
  { id: "approval", q: { en: "Who approved the AO-2207 idle surplus?", ar: "من اعتمد فائض AO-2207 الخامل؟", zh: "审计日志里谁批准了 AO-2207?" } },
];

const AUDIT_TRAIL = [
  { type: "CONTEXT", detail: { en: "Audit context loaded — FY2026 Q2, cross-department read-only scope.", ar: "حُمِّل سياق التدقيق — الربع الثاني 2026، نطاق عبر الإدارات للقراءة فقط.", zh: "审计上下文已加载——FY2026 Q2,跨部门只读范围。" }, at: "02 Jul 2026 · 09:24", id: "AUD-1048" },
  { type: "QUERY", detail: { en: "Smart query reconstructed the AO-2207 approval chain (3 approvers).", ar: "أعاد الاستعلام الذكي بناء سلسلة اعتماد AO-2207 (3 معتمدين).", zh: "智能查询重建了 AO-2207 审批链(3 名审批人)。" }, at: "02 Jul 2026 · 09:31", id: "AUD-1051" },
  { type: "REVIEW", detail: { en: "Reviewer approved the Arabic return note for CLM-7731 (3 missing docs).", ar: "اعتمد المراجع إشعار الإعادة بالعربية لـ CLM-7731 (3 نواقص).", zh: "审核人批准了 CLM-7731 的阿语退回说明(3 项缺件)。" }, at: "02 Jul 2026 · 09:46", id: "AUD-1055" },
  { type: "PERMISSION", detail: { en: "2 permissioned exports denied — outside role scope.", ar: "رُفض طلبا تصدير مصرّح — خارج نطاق الدور.", zh: "2 笔授权导出被拒——越权范围。" }, at: "02 Jul 2026 · 10:02", id: "AUD-1059" },
];

export function Uc03QueryAudit() {
  const { tr, setRoute, setBackRoute, pushLog } = useStore();
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState(null);

  const back = () => { setBackRoute(null); setRoute("audwork"); };
  const go = (route) => { setBackRoute("bench03"); setRoute(route); };

  const runQuery = (text) => {
    const n = (text || "").toLowerCase();
    let result;
    if (n.includes("exception") || n.includes("异常") || n.includes("حرجة") || n.includes("استثناء")) result = { text: { en: "2 critical exceptions are open: a duplicate invoice (INV-55021, vendor 700412) and an abnormal TB entry (account 2310) — both auto-routed to the audit queue with owners.", ar: "استثناءان حرجان مفتوحان: فاتورة مكررة (INV-55021، مورد 700412) وقيد شاذ (حساب 2310) — كلاهما مُوجَّه آلياً لقائمة التدقيق.", zh: "当前 2 项严重异常未结:重复发票(INV-55021,供应商 700412)与试算平衡异常分录(科目 2310)——均已自动路由至审计队列并指派负责人。" }, route: "g04bench02", label: { en: "Open anomaly detection", ar: "فتح كشف الشذوذ", zh: "打开异常检测" }, source: "EX-2026-CRIT · 95%" };
    else if (n.includes("claim") || n.includes("索赔") || n.includes("مطالبة") || n.includes("7731")) result = { text: { en: "CLM-7731 is missing 3 documents: IBAN certificate, CR copy, and tax clearance. An Arabic return note citing page references is drafted and awaiting reviewer sign-off.", ar: "تنقص CLM-7731 ثلاثة مستندات: شهادة آيبان، نسخة السجل، والبراءة الضريبية. وصيغ إشعار إعادة بالعربية بمراجع الصفحات بانتظار التوقيع.", zh: "CLM-7731 缺 3 项材料:IBAN 证明、CR 副本、清税证明。引用页码的阿语退回说明已起草,等待审核人签核。" }, route: "g04bench02", label: { en: "Open anomaly detection", ar: "فتح كشف الشذوذ", zh: "打开异常检测" }, source: "CLM-7731 · 96%" };
    else if (n.includes("diff") || n.includes("差异") || n.includes("فرق") || n.includes("etimad") || n.includes("sap")) result = { text: { en: "2 open differences this quarter, net SAR 25M: Esnad assignment (+15M) and Tahseel revenue (+10M); adjusting entries are drafted in reconciliation, pending approval.", ar: "فرقان مفتوحان هذا الربع بصافي 25 مليوناً: إسناد (+15) وتحصيل (+10)؛ وصيغت قيود تسوية في المطابقة بانتظار الاعتماد.", zh: "本季度 2 项未结差异,净 SAR 25M:Esnad 派工(+15M)与 Tahseel 收入(+10M);对账中已起草调整分录,等待审批。" }, route: "g04bench10", label: { en: "Open reports & dashboards", ar: "فتح التقارير", zh: "打开报告与仪表盘" }, source: "REC-2026-Q2 · 93%" };
    else if (n.includes("approv") || n.includes("批准") || n.includes("اعتمد") || n.includes("2207")) result = { text: { en: "AO-2207 was approved by 3 officers (Cost Mgmt lead → Finance controller → Directorate sign-off) between 14–18 May; the full chain with timestamps and basis is in the audit log. Confidence 95%.", ar: "اعتُمد AO-2207 بثلاثة مسؤولين (قائد التكاليف ← المراقب المالي ← توقيع المديرية) بين 14–18 مايو؛ السلسلة الكاملة في سجل التدقيق. الثقة 95%.", zh: "AO-2207 由 3 名审批人先后批准(成本管理负责人 → 财务总监 → 总局签核,5 月 14–18 日);完整链条含时间戳与依据在审计日志中。置信度 95%。" }, route: "bench03", label: { en: "Open audit log", ar: "فتح سجل التدقيق", zh: "打开审计轨迹" }, source: "AUD-1042 · 95%" };
    else result = { text: { en: "The cross-department audit index covers 28,140 events; average answer confidence is 92%, and every answer carries cited sources and lineage. All queries are permission-scoped and fully traceable.", ar: "يغطي فهرس التدقيق عبر الإدارات 28,140 حدثاً؛ متوسط الثقة 92%، وكل إجابة تحمل مصادر وتتبعاً. كل الاستعلامات محكومة بالصلاحيات.", zh: "跨部门审计索引覆盖 28,140 个事件;平均回答置信度 92%,每个答案附引用来源与血缘。所有查询受权限约束、全程可追溯。" }, route: "bench03", label: { en: "Open audit log", ar: "فتح سجل التدقيق", zh: "打开审计轨迹" }, source: "IDX-2026 · 92%" };
    setAnswer(result);
    pushLog({ en: "Smart query → " + text, ar: "استعلام ذكي → " + text, zh: "智能查询 → " + text });
  };

  return (
    <div className="g2-page fade">
      <div className="g2-pagehead">
        <div className="g2-pagecopy">
          <div className="g2-titlebar"><button className="pg-back" onClick={back}>‹</button><h1>{tr(PAGE.title)}</h1></div>
          <p>{tr(PAGE.sub)}</p>
        </div>
        <div className="g2-header-side">
          <div className="g2-headactions">
            <button className="btn danger sm" onClick={() => go("g04bench02")}>{tr({ en: "Anomaly detection", ar: "كشف الشذوذ", zh: "异常检测" })}</button>
          </div>
        </div>
      </div>

      <div className="g2-contextbar">
        <div><span>{tr({ en: "Audit period", ar: "فترة التدقيق", zh: "审计期间" })}</span><b>FY2026 · Q2</b></div>
        <div><span>{tr({ en: "Scope", ar: "النطاق", zh: "范围" })}</span><b>{tr({ en: "Cross-department", ar: "عبر الإدارات", zh: "跨部门" })}</b></div>
        <div><span>{tr({ en: "Data version", ar: "نسخة البيانات", zh: "数据版本" })}</span><b>DV-2026-AUD-07</b></div>
        <div><span>{tr({ en: "Audit baseline", ar: "خط أساس التدقيق", zh: "审计基线" })}</span><b>AUD-CHK-v3</b></div>
        <div className="g2-context-status"><span>{tr({ en: "Status", ar: "الحالة", zh: "状态" })}</span><strong className="g2-state good">{tr({ en: "Read-only", ar: "للقراءة فقط", zh: "只读" })}</strong></div>
      </div>

      <div className="g2-query-layout">
        <section className="g2-query-main">
          <div className="g2-query-box">
            <span>{tr({ en: "Ask about this audit cycle", ar: "اسأل عن دورة التدقيق هذه", zh: "询问当前审计上下文" })}</span>
            <div>
              <input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) runQuery(query.trim()); }} placeholder={tr({ en: "Ask an audit question", ar: "اطرح سؤال تدقيق", zh: "输入审计问题" })} />
              <button className="btn sm" disabled={!query.trim()} onClick={() => runQuery(query.trim())}>{tr({ en: "Ask", ar: "اسأل", zh: "提问" })}</button>
            </div>
          </div>
          <div className="g2-query-presets">{PRESETS.map((p) => <button key={p.id} onClick={() => { const t = tr(p.q); setQuery(t); runQuery(t); }}>{tr(p.q)}</button>)}</div>
          {answer ? (
            <div className="g2-answer">
              <span>{tr({ en: "Answer · source-backed", ar: "إجابة · مدعومة بالمصدر", zh: "回答 · 可追溯" })}</span>
              <p>{tr(answer.text)}</p>
              <div><small>{answer.source}</small><button className="btn ghost sm" onClick={() => go(answer.route)}>{tr(answer.label)} →</button></div>
            </div>
          ) : (
            <div className="g2-query-empty">
              <b>{tr({ en: "Answers stay inside the active FY2026 Q2 cross-department audit context.", ar: "تبقى الإجابات ضمن سياق التدقيق النشط للربع الثاني 2026.", zh: "回答将限定在当前 FY2026 Q2 跨部门审计上下文中。" })}</b>
              <p>{tr({ en: "Every answer includes a version, confidence score, and a route to the supporting analysis.", ar: "تتضمن كل إجابة نسخة ودرجة ثقة ومساراً إلى التحليل الداعم.", zh: "每条回答都包含版本、置信度和支持分析的下钻入口。" })}</p>
            </div>
          )}
        </section>

        <section className="g2-section g2-audit-panel">
          <div className="g2-section-head">
            <div><h2>{tr({ en: "Audit trail", ar: "مسار التدقيق", zh: "审计轨迹" })}</h2><p>{tr({ en: "Query, approval, and permission events.", ar: "أحداث الاستعلام والاعتماد والصلاحيات.", zh: "查询、审批与权限事件。" })}</p></div>
          </div>
          <div className="g2-audit-list">{AUDIT_TRAIL.map((e) => <div key={e.id}><span>{e.type}</span><b>{tr(e.detail)}</b><small>{e.at} · {e.id}</small></div>)}</div>
        </section>
      </div>
    </div>
  );
}
