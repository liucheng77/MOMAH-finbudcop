/* =========================================================================
   Shell · TopBar — top-level chrome: brand, top-level nav (zh demo only),
   language switcher, notification bell, user menu.
   Reads from the host Store via useStore (provided by App.jsx).
   ========================================================================= */
import React, { useState } from "react";
import { useStore, Money } from "../shared/store.jsx";
import { GlobeIcon, UserIcon } from "./icons.jsx";
import { LANGS, URL_LANG, NEXT_LANG_LABEL, NOTIFS } from "./labels.js";

export function TopBar() {
  const { t, tr, lang, setLang, user, setUser, reset, setRoute, route, alerts } = useStore();
  const [open, setOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);
  const notifCount = notifRead ? 0 : NOTIFS.length;
  const fb = (e, base) => { const im = e.currentTarget, f = im.dataset.f || "0"; if (f === "0") { im.dataset.f = "1"; im.src = "public/assets/" + base; } else if (f === "1") { im.dataset.f = "2"; im.src = "assets/" + base; } else im.style.display = "none"; };
  const openAlerts = alerts.filter(a => !a.ack).length;
  const tbtns = [["hub", "◧", "nav_hub"], ["chat", "✦", "nav_chat"], ["monitor", "◉", "nav_monitor"], ["reports", "📄", "nav_reports"]];
  return (<div className="topbar">
    <div className="brand">
      <img className="topbar-logo" src="/assets/logo.png" alt="MoMAH" onError={e => fb(e, "logo.png")} />
      <span className="topbar-sep" /><span className="topbar-app">{t("appName")}</span>
    </div>
    <div className="right">
      {URL_LANG === "zh" && tbtns.map(([r, ic, k]) => (<button key={r} className={"tbtn" + (route === r ? " on" : "")} onClick={() => setRoute(r)}>
        <span>{ic}</span><span className="tbtn-lbl">{t(k)}</span>{r === "monitor" && openAlerts ? <span className="badge-count">{openAlerts}</span> : null}</button>))}
      {URL_LANG === "zh" && <span className="topbar-sep" />}
      <div className="langmenu">
        <button className="tbtn lang-pill" onClick={() => setLangOpen(o => !o)} title={tr({ en: "Language", ar: "اللغة", zh: "语言" })}>
          {GlobeIcon} <span>{NEXT_LANG_LABEL[lang]}</span> <span className={"chev" + (langOpen ? " up" : "")}>{langOpen ? "▴" : "▾"}</span>
        </button>
        {langOpen && <div className="panel lang-panel" onMouseLeave={() => setLangOpen(false)}>
          <div className="lang-ph">{tr({ en: "Language", ar: "اللغة", zh: "语言" })}</div>
          {LANGS.map(code => (
            <button key={code} className={"lang-opt" + (code === lang ? " active" : "")} onClick={() => { setLang(code); setLangOpen(false); }}>
              <span className="lang-opt-nm">{NEXT_LANG_LABEL[code]}</span>
              <span className="lang-opt-sub">{code === "ar" ? "Arabic" : code === "en" ? "English" : "Chinese"}</span>
              {code === lang ? <span className="lang-check">✓</span> : null}
            </button>
          ))}
        </div>}
      </div>
      <div className="notifmenu">
        <button className="tbtn notif-btn" onClick={() => setNotifOpen(o => !o)} title={tr({ en: "Notifications", ar: "الإشعارات", zh: "通知" })}>🔔{notifCount > 0 ? <span className="badge-count">{notifCount}</span> : null}</button>
        {notifOpen && <div className="panel notif-panel" onMouseLeave={() => setNotifOpen(false)}>
          <div className="notif-h"><b>{tr({ en: "Notifications", ar: "الإشعارات", zh: "通知" })}</b><button className="notif-clear" onClick={() => setNotifRead(true)}>{tr({ en: "Mark all read", ar: "تعليم الكل كمقروء", zh: "全部标为已读" })}</button></div>
          {NOTIFS.map((n, i) => (<div className={"notif-row " + n.sev + (notifRead ? " read" : "")} key={i}><span className="ni" /><div className="nx"><div className="nt"><Money v={tr(n.t)} /></div><div className="ntime">{tr(n.time)}</div></div></div>))}
        </div>}
      </div>
      <div className="usermenu">
        <button className="tbtn" onClick={() => setOpen(o => !o)}>{UserIcon} {t(user + "_full")} ▾</button>
        {open && <div className="panel" onMouseLeave={() => setOpen(false)}>
          <div style={{ padding: "6px 8px", fontWeight: 700 }}>{t(user + "_full")}</div>
          <div style={{ padding: "2px 8px 10px", fontSize: 12 }} className="muted">{t(user + "_desc")}</div>
          <div className="divider" style={{ margin: "6px 0" }} />
          <button className="btn ghost sm" style={{ width: "100%", marginBottom: 6 }} onClick={() => { reset(); setOpen(false); }}>↺ {t("resetDemo")}</button>
          <button className="btn danger sm" style={{ width: "100%" }} onClick={() => setUser(null)}>⎋ {t("logout")}</button>
        </div>}
      </div>
    </div>
  </div>);
}
