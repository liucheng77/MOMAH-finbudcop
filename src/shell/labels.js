/* =========================================================================
   Shell · labels — trilingual labels, language metadata and notification
   seed data.  URL_LANG is read once at module load from window.location.
   Both App.jsx (StoreProvider initial lang) and TopBar import from here so
   the value is computed exactly once.
   ========================================================================= */

/* ---- supported UI languages (also used by the language switcher) ---- */
export const LANGS = ["ar", "en", "zh"];

/* ---- ?ln=zh / ?ln=en / ?ln=ar URL hint, evaluated once ---- */
export const URL_LANG = (() => {
  try {
    const p = new URLSearchParams(window.location.search).get("ln");
    return LANGS.indexOf(p) >= 0 ? p : null;
  } catch (e) {
    return null;
  }
})();

/* ---- native labels for the language switcher pill ---- */
export const NEXT_LANG_LABEL = { ar: "العربية", en: "English", zh: "中文" };

/* ---- notification seed data shown in the top-bar bell ---- */
export const NOTIFS = [
  { sev: "danger", t: { en: "Budget overrun — Housing Program 2.0 at 103% of allocation", ar: "تجاوز الميزانية — برنامج الإسكان 2.0 عند 103٪ من المخصص", zh: "预算超支——住房计划 2.0 已达拨款的 103%" }, time: { en: "2m ago", ar: "قبل دقيقتين", zh: "2 分钟前" } },
  { sev: "warn",   t: { en: "Billing gap SAR 120M flagged in Revenue Collection · FY2026 Q3", ar: "فجوة فوترة SAR 120M في التحصيل · FY2026 Q3", zh: "收入征收发现征收缺口 SAR 120M · FY2026 Q3" }, time: { en: "18m ago", ar: "قبل 18 د", zh: "18 分钟前" } },
  { sev: "warn",   t: { en: "42 contracts overdue >60 days in Riyadh-East Amanah", ar: "42 عقداً متأخراً >60 يوماً في أمانة الرياض-شرق", zh: "利雅得-东阿玛纳有 42 个合同逾期 >60 天" }, time: { en: "1h ago", ar: "قبل ساعة", zh: "1 小时前" } },
  { sev: "info",   t: { en: "Forecast variance: Q3 spend projected 8% above plan", ar: "انحراف التنبؤ: إنفاق الربع 3 أعلى من الخطة بـ 8٪", zh: "预测偏差:Q3 支出预计高于计划 8%" }, time: { en: "3h ago", ar: "قبل 3 س", zh: "3 小时前" } },
];
