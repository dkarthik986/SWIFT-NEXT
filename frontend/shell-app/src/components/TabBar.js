import React, { useRef } from "react";

const ICONS = {
  search:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
  users:   <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  profile: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
};

export default function TabBar({ tabs, activeTabId, onSwitch, onClose }) {
  const scrollRef = useRef(null);
  if (tabs.length === 0) return null;
  return (
    <div className="tabbar-wrapper">
      <div className="tabbar-scroll" ref={scrollRef}>
        {tabs.map(tab => (
          <div
            key={tab.id}
            className={`tabbar-tab ${tab.id === activeTabId ? "active" : ""}`}
            onClick={() => onSwitch(tab.id)}
            onMouseDown={e => { if (e.button === 1) { e.preventDefault(); onClose(tab.id); } }}
            title={tab.label}
          >
            <span className="tab-icon">{ICONS[tab.icon] || ICONS.search}</span>
            <span className="tab-label">{tab.label}</span>
            <button className="tab-close" onClick={e => onClose(tab.id, e)} title="Close">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            {tab.id === activeTabId && <div className="tab-active-bar" />}
          </div>
        ))}
      </div>
    </div>
  );
}
