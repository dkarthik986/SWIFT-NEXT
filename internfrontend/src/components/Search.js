import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import "./css/Search.css";
import { useAuth } from "../AuthContext";

const API_BASE_URL      = `${process.env.REACT_APP_API_BASE_URL || "http://localhost:8081"}/api/search`;
const API_DROPDOWN_URL  = `${process.env.REACT_APP_API_BASE_URL || "http://localhost:8081"}/api/dropdown-options`;


const BASE_MT_MX_PAIRS = {
    "MT103/pacs.008": ["MT103", "pacs.008"],
    "MT199/pacs.002": ["MT199", "pacs.002"],
    "MT202/pacs.009": ["MT202", "pacs.009"],
    "MT700/pain.001": ["MT700", "pain.001"],
    "MT940/camt.053": ["MT940", "camt.053"],
};
const addOneMonth = (dateStr) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split("/").map(Number);
    const next = new Date(y, m, d);
    const yy = next.getFullYear();
    const mm = String(next.getMonth() + 1).padStart(2, "0");
    const dd = String(next.getDate()).padStart(2, "0");
    return `${yy}/${mm}/${dd}`;
};

const formatDirection = (val) => {
    if (!val) return "—";
    const v = String(val).trim().toUpperCase();
    if (v === "I")  return "INCOMING";
    if (v === "O")  return "OUTGOING";
    return v;
};
const dirClass = (val) => {
    if (!val) return "";
    const v = String(val).trim().toUpperCase();
    if (v === "I" || v === "INCOMING") return "dir-incoming";
    if (v === "O" || v === "OUTGOING") return "dir-outgoing";
    return "";
};

const clampToOneMonth = (startStr, endStr) => {
    if (!startStr || !endStr) return endStr;
    const maxEnd = addOneMonth(startStr);
    return endStr > maxEnd ? maxEnd : endStr;
};

const normalizeFormat = (rawFormat) => {
    if (!rawFormat) return rawFormat;
    return rawFormat.replace("ALL-MT&MX", "ALL MT&MX");
};

const buildAllMtMxTypeMap = (backendPairs) => {
    const map = { ...BASE_MT_MX_PAIRS };
    if (backendPairs && backendPairs.length > 0) {
        backendPairs.forEach(label => {
            if (!map[label]) {
                const parts = label.split("/");
                if (parts.length === 2) map[label] = [parts[0].trim(), parts[1].trim()];
            }
        });
    }
    return map;
};

let allMtMxTypeMap = { ...BASE_MT_MX_PAIRS };

const getDisplayFormat = (msg) => {
    return normalizeFormat(msg.format);
};

const getDisplayType = (msg) => {
    if (normalizeFormat(msg.format) === "ALL MT&MX") {
        for (const [pairedLabel, individualTypes] of Object.entries(allMtMxTypeMap)) {
            if (individualTypes.includes(msg.type)) return pairedLabel;
        }
    }
    return msg.type;
};

const COLUMNS = [
    { key: "sequenceNumber",  label: "Seq No.",       sortable: true },
    { key: "format",          label: "Format",        sortable: true },
    { key: "type",            label: "Type",          sortable: true },
    { key: "date",            label: "Date",          sortable: true },
    { key: "time",            label: "Time",          sortable: true },
    { key: "direction",       label: "Direction",     sortable: true },
    { key: "network",         label: "Network",       sortable: true },
    { key: "sourceSystem",    label: "Source System", sortable: true },
    { key: "sender",          label: "Sender",        sortable: true },
    { key: "receiver",        label: "Receiver",      sortable: true },
    { key: "status",          label: "Status",        sortable: true },
    { key: "currency",        label: "Currency",      sortable: true },
    { key: "amount",          label: "Amount",        sortable: true },
    { key: "userReference",   label: "User Ref",      sortable: true },
    { key: "rfkReference",    label: "RFK Ref",       sortable: true },
    { key: "messageReference",label: "Msg Ref",       sortable: true },
    { key: "uetr",            label: "UETR",          sortable: true },
    { key: "finCopy",         label: "FIN-COPY",      sortable: true },
    { key: "action",          label: "Action",        sortable: true },
    { key: "reason",          label: "Reason",        sortable: true },
    { key: "correspondent",   label: "Correspondent", sortable: true },
    { key: "ownerUnit",       label: "Owner/Unit",    sortable: true },
    { key: "phase",           label: "Phase",         sortable: true },
    { key: "backendChannel",  label: "Channel",       sortable: true },
];
const FIELD_DEFINITIONS = [
    { key: "format",               label: "Message Format",        group: "Classification", type: "select",       optKey: "formats",          placeholder: "All Formats",      stateKeys: ["format"],                              colKeys: ["format"] },
    { key: "type",                 label: "Message Type",          group: "Classification", type: "select-type",  optKey: null,               placeholder: "All Types",        stateKeys: ["type"],                                colKeys: ["type"] },
    { key: "messageCode",          label: "Message Code",          group: "Classification", type: "select",       optKey: "messageCodes",     placeholder: "All Codes",        stateKeys: ["messageCode"],                         colKeys: ["type"] },
    { key: "dateRange",            label: "Date / Time Range",     group: "Date & Time",    type: "date-range",   optKey: null,               placeholder: null,               stateKeys: ["startDate","startTime","endDate","endTime"], colKeys: ["date","time"] },
    { key: "direction",            label: "Message Direction",     group: "Classification", type: "select",       optKey: "directions",       placeholder: "All Directions",   stateKeys: ["direction"],                           colKeys: ["direction"] },
    { key: "status",               label: "Status",                group: "Classification", type: "select",       optKey: "statuses",         placeholder: "All Status",       stateKeys: ["status"],                              colKeys: ["status"] },
    { key: "network",              label: "Network",               group: "Routing",        type: "select",       optKey: "networks",         placeholder: "All Networks",     stateKeys: ["network"],                             colKeys: ["network"] },
    { key: "sourceSystem",         label: "Source System",         group: "Routing",        type: "select",       optKey: "sourceSystems",    placeholder: "All Systems",      stateKeys: ["sourceSystem"],                        colKeys: ["sourceSystem"] },
    { key: "finCopy",              label: "FIN-COPY",              group: "Classification", type: "select",       optKey: "finCopies",        placeholder: "All",              stateKeys: ["finCopy"],                             colKeys: ["finCopy"] },
    { key: "currency",             label: "Currency (CCY)",        group: "Financial",      type: "select",       optKey: "currencies",       placeholder: "All Currencies",   stateKeys: ["currency"],                            colKeys: ["currency"] },
    { key: "ownerUnit",            label: "Owner / Unit",          group: "Routing",        type: "select",       optKey: "ownerUnits",       placeholder: "All Units",        stateKeys: ["ownerUnit"],                           colKeys: ["ownerUnit"] },
    { key: "phase",                label: "Phase",                 group: "Lifecycle",      type: "select",       optKey: "phases",           placeholder: "All Phases",       stateKeys: ["phase"],                               colKeys: ["phase"] },
    { key: "action",               label: "Action",                group: "Lifecycle",      type: "select",       optKey: "actions",          placeholder: "All Actions",      stateKeys: ["action"],                              colKeys: ["action"] },
    { key: "backendChannel",       label: "Channel / Session",     group: "Routing",        type: "select",       optKey: "backendChannels",  placeholder: "All Channels",     stateKeys: ["backendChannel"],                      colKeys: ["backendChannel"] },
    { key: "country",              label: "Country",               group: "Routing",        type: "select",       optKey: "countries",        placeholder: "All Countries",    stateKeys: ["country"],                             colKeys: ["country"] },
    { key: "workflow",             label: "Workflow",              group: "Routing",        type: "select",       optKey: "workflows",        placeholder: "All Workflows",    stateKeys: ["workflow"],                            colKeys: ["workflow"] },
    { key: "networkChannel",       label: "Network Channel",       group: "Routing",        type: "select",       optKey: "networkChannels",  placeholder: "All Channels",     stateKeys: ["networkChannel"],                      colKeys: ["networkChannel"] },
    { key: "networkPriority",      label: "Network Priority",      group: "Routing",        type: "select",       optKey: "networkPriorities",placeholder: "All Priorities",   stateKeys: ["networkPriority"],                     colKeys: ["networkPriority"] },
    { key: "sender",               label: "Sender BIC",            group: "Parties",        type: "text",         placeholder: "Enter Sender BIC",                             stateKeys: ["sender"],                              colKeys: ["sender"] },
    { key: "receiver",             label: "Receiver BIC",          group: "Parties",        type: "text",         placeholder: "Enter Receiver BIC",                           stateKeys: ["receiver"],                            colKeys: ["receiver"] },
    { key: "userReference",        label: "User Reference (MUR)",  group: "References",     type: "text",         placeholder: "MUR",                                          stateKeys: ["userReference"],                       colKeys: ["userReference"] },
    { key: "rfkReference",         label: "RFK Reference / UMID",  group: "References",     type: "text",         placeholder: "Enter RFK Reference",                          stateKeys: ["rfkReference"],                        colKeys: ["rfkReference"] },
    { key: "messageReference",     label: "Message Reference",     group: "References",     type: "text",         placeholder: "Message Reference",                            stateKeys: ["messageReference"],                    colKeys: ["messageReference"] },
    { key: "reference",            label: "Reference",             group: "References",     type: "text",         placeholder: "Reference",                                    stateKeys: ["reference"],                           colKeys: ["reference"] },
    { key: "transactionReference", label: "Transaction Reference", group: "References",     type: "text",         placeholder: "Transaction Reference",                        stateKeys: ["transactionReference"],                colKeys: ["transactionReference"] },
    { key: "transferReference",    label: "Transfer Reference",    group: "References",     type: "text",         placeholder: "Transfer Reference",                           stateKeys: ["transferReference"],                   colKeys: ["transferReference"] },
    { key: "uetr",                 label: "UETR",                  group: "References",     type: "text",         placeholder: "Enter UETR (e.g. 8a562c65-...)",               stateKeys: ["uetr"],                                colKeys: ["uetr"] },
    { key: "reason",               label: "Reason",                group: "Lifecycle",      type: "text",         placeholder: "Enter Reason",                                 stateKeys: ["reason"],                              colKeys: ["reason"] },
    { key: "correspondent",        label: "Correspondent",         group: "Parties",        type: "text",         placeholder: "Correspondent",                                stateKeys: ["correspondent"],                       colKeys: ["correspondent"] },
    { key: "historyEntity",        label: "History Entity",        group: "History",        type: "text",         placeholder: "e.g. Document, Workflow",                      stateKeys: ["historyEntity"],                       colKeys: [] },
    { key: "historyDescription",   label: "History Description",   group: "History",        type: "text",         placeholder: "e.g. STP processing...",                       stateKeys: ["historyDescription"],                  colKeys: [] },
    { key: "amountRange",          label: "Amount Range",          group: "Financial",      type: "amount-range", placeholder: null,                                           stateKeys: ["amountFrom","amountTo"],               colKeys: ["amount","currency"] },
    { key: "seqRange",             label: "Sequence No. Range",    group: "Reference",      type: "seq-range",    placeholder: null,                                           stateKeys: ["seqFrom","seqTo"],                     colKeys: ["sequenceNumber"] },
    { key: "freeSearchText",       label: "Free Search Text",      group: "Other",          type: "text-wide",    placeholder: "Searches across all fields...",                stateKeys: ["freeSearchText"],                      colKeys: [] },
];

const FIELD_GROUPS = ["Classification", "Date & Time", "Parties", "References", "Financial", "Routing", "Lifecycle", "History", "Other"];

const ADV_BASE_COLS = new Set(["sequenceNumber", "format", "type", "date", "time"]);

const SORT_NONE = null, SORT_ASC = "asc", SORT_DESC = "desc";
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS   = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const initialSearchState = {
    format:"", type:"", startDate:"", startTime:"", endDate:"", endTime:"",
    direction:"", network:"", sender:"", receiver:"", sourceSystem:"",
    status:"", currency:"", userReference:"", rfkReference:"",
    messageReference:"", uetr:"", finCopy:"", action:"", reason:"",
    correspondent:"", amountFrom:"", amountTo:"", seqFrom:"",
    seqTo:"", ownerUnit:"", freeSearchText:"", backendChannel:"", phase:"",
    messageType:"", messageCode:"", io:"", country:"",
    workflow:"", owner:"", networkChannel:"", networkPriority:"", networkProtocol:"",
    reference:"", transactionReference:"", transferReference:"",
    historyEntity:"", historyDescription:""
};

const emptyOpts = {
    formats:[], types:[], mtTypes:[], mxTypes:[], allMtMxTypes:[],
    networks:[], sourceSystems:[], currencies:[], ownerUnits:[],
    backendChannels:[], directions:[], statuses:[], finCopies:[], actions:[], phases:[],
    messageCodes:[], senders:[], receivers:[], countries:[],
    workflows:[], owners:[], networkChannels:[], networkPriorities:[], networkProtocols:[],
    ioDirections:[]
};
function DateTimePicker({ label, dateValue, timeValue, onDateChange, onTimeChange, onKeyDown }) {
    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState(() => dateValue ? parseInt(dateValue.split("/")[0]) || new Date().getFullYear() : new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState(() => dateValue ? (parseInt(dateValue.split("/")[1]) - 1) || new Date().getMonth() : new Date().getMonth());
    const [timeMode, setTimeMode] = useState(false);
    const [typedDate, setTypedDate] = useState(dateValue || "");
    const [dateError, setDateError] = useState(false);
    const ref = useRef(null);

    const isValidDate = useCallback((str) => {
        if (!str) return true;
        const m = str.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
        if (!m) return false;
        const [, y, mo, d] = m.map(Number);
        if (mo < 1 || mo > 12) return false;
        return d >= 1 && d <= new Date(y, mo, 0).getDate();
    }, []);

    const commitDate = useCallback((v) => {
        if (!v) { onDateChange(""); setDateError(false); return; }
        if (isValidDate(v)) { onDateChange(v); setDateError(false); }
        else setDateError(true);
    }, [onDateChange, isValidDate]);

    useEffect(() => { setTypedDate(dateValue || ""); }, [dateValue]);
    useEffect(() => {
        const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) { setOpen(false); setTimeMode(false); commitDate(typedDate); } };
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, [typedDate, commitDate]);
    useEffect(() => {
        if (dateValue) {
            const p = dateValue.split("/");
            if (p[0] && parseInt(p[0]) > 999) setViewYear(parseInt(p[0]));
            if (p[1]) setViewMonth(parseInt(p[1]) - 1);
        }
    }, [dateValue]);

    const handleDateTyping = (raw) => {
        let v = raw.replace(/[^\d/]/g, "");
        if (v.length === 4 && !v.includes("/")) v += "/";
        else if (v.length === 7 && v.split("/").length === 2) v += "/";
        if (v.length > 10) v = v.slice(0, 10);
        setTypedDate(v); setDateError(false);
        if (v.length === 10) commitDate(v);
    };
    const handleDateKey = (e) => {
        if (e.key === "Enter") { commitDate(typedDate); if (onKeyDown) onKeyDown(e); }
        if (e.key === "Tab") commitDate(typedDate);
    };
    const handleClearAll = (e) => { e.stopPropagation(); setTypedDate(""); setDateError(false); onDateChange(""); onTimeChange(""); };

    const getDaysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();
    const getFirstDay    = (y, m) => new Date(y, m, 1).getDay();
    const selectedDay    = dateValue ? parseInt(dateValue.split("/")[2]) : null;
    const selectedMonth  = dateValue ? parseInt(dateValue.split("/")[1]) - 1 : null;
    const selectedYear   = dateValue ? parseInt(dateValue.split("/")[0]) : null;

    const handleDayClick = (day) => {
        const d = String(day).padStart(2,"0"), mo = String(viewMonth+1).padStart(2,"0");
        const newDate = `${viewYear}/${mo}/${d}`;
        setTypedDate(newDate); onDateChange(newDate); setDateError(false); setTimeMode(true);
    };
    const prevMonth = () => { if (viewMonth===0){setViewMonth(11);setViewYear(y=>y-1);}else setViewMonth(m=>m-1); };
    const nextMonth = () => { if (viewMonth===11){setViewMonth(0);setViewYear(y=>y+1);}else setViewMonth(m=>m+1); };

    const daysInMonth = getDaysInMonth(viewYear, viewMonth);
    const firstDay    = getFirstDay(viewYear, viewMonth);
    const today       = new Date();
    const todayY = today.getFullYear(), todayM = today.getMonth(), todayD = today.getDate();

    const [hh, mm, ss] = (timeValue || "").split(":");
    const setHH = (v) => onTimeChange(`${String(v).padStart(2,"0")}:${mm||"00"}:${ss||"00"}`);
    const setMM = (v) => onTimeChange(`${hh||"00"}:${String(v).padStart(2,"0")}:${ss||"00"}`);
    const setSS = (v) => onTimeChange(`${hh||"00"}:${mm||"00"}:${String(v).padStart(2,"0")}`);

    return (
        <div className="dtp-wrap" ref={ref}>
            {label && <label>{label}</label>}
            <div className={`dtp-input-row${open?" dtp-row-open":""}`}>
                <div className={`dtp-segment${dateError?" dtp-segment-error":""}`}>
                    <svg className="dtp-seg-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    <input className="dtp-type-input" placeholder="YYYY/MM/DD" value={typedDate} maxLength={10} onChange={e=>handleDateTyping(e.target.value)} onKeyDown={handleDateKey} onBlur={()=>commitDate(typedDate)} autoComplete="off" spellCheck={false}/>
                    {dateError && <span className="dtp-error-dot" title="Invalid date"/>}
                </div>
                {timeValue && (<><span className="dtp-seg-sep">·</span><div className="dtp-time-badge" onClick={()=>{setOpen(true);setTimeMode(true);}}><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>{timeValue}</span></div></>)}
                <div className="dtp-seg-actions">
                    {(dateValue||timeValue) && <button className="dtp-clear-btn" onClick={handleClearAll} tabIndex={-1}><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>}
                    <button className={`dtp-cal-toggle${open?" dtp-cal-toggle-active":""}`} onClick={()=>setOpen(p=>!p)} tabIndex={-1}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></button>
                </div>
            </div>
            {open && (
                <div className="dtp-dropdown">
                    <div className="dtp-tab-row">
                        <button className={`dtp-tab${!timeMode?" dtp-tab-active":""}`} onClick={()=>setTimeMode(false)}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/></svg>Date</button>
                        <button className={`dtp-tab${timeMode?" dtp-tab-active":""}`} onClick={()=>setTimeMode(true)}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Time</button>
                    </div>
                    {!timeMode ? (
                        <div className="dtp-calendar">
                            <div className="dtp-cal-nav"><button className="dtp-nav-btn" onClick={prevMonth}>‹</button><span className="dtp-cal-title">{MONTHS[viewMonth]} {viewYear}</span><button className="dtp-nav-btn" onClick={nextMonth}>›</button></div>
                            <div className="dtp-year-row"><button className="dtp-year-step" onClick={()=>setViewYear(y=>y-1)}>«</button><span className="dtp-year-val">{viewYear}</span><button className="dtp-year-step" onClick={()=>setViewYear(y=>y+1)}>»</button></div>
                            <div className="dtp-day-grid">
                                {DAYS.map(d=><span key={d} className="dtp-day-hdr">{d}</span>)}
                                {Array.from({length:firstDay}).map((_,i)=><span key={`e${i}`}/>)}
                                {Array.from({length:daysInMonth}).map((_,i)=>{
                                    const day=i+1;
                                    const isSel=day===selectedDay&&viewMonth===selectedMonth&&viewYear===selectedYear;
                                    const isToday=day===todayD&&viewMonth===todayM&&viewYear===todayY;
                                    return <button key={day} className={`dtp-day${isSel?" dtp-day-selected":""}${isToday&&!isSel?" dtp-day-today":""}`} onClick={()=>handleDayClick(day)}>{day}</button>;
                                })}
                            </div>
                            <div className="dtp-cal-footer">
                                <button className="dtp-today-btn" onClick={()=>{setViewYear(todayY);setViewMonth(todayM);handleDayClick(todayD);}}>Today</button>
                                {dateValue&&<button className="dtp-time-btn" onClick={()=>setTimeMode(true)}>Set Time →</button>}
                            </div>
                        </div>
                    ) : (
                        <div className="dtp-time-panel">
                            <div className="dtp-time-header"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>Set Time <span className="dtp-time-optional">(optional)</span></div>
                            <div className="dtp-time-cols">
                                {[["HH",hh,0,23,setHH],["MM",mm,0,59,setMM],["SS",ss,0,59,setSS]].map(([lbl,val,min,max,setter],idx)=>(
                                    <React.Fragment key={lbl}>
                                        {idx>0&&<span className="dtp-time-colon">:</span>}
                                        <div className="dtp-time-col">
                                            <span className="dtp-time-lbl">{lbl}</span>
                                            <button className="dtp-spin-btn" onClick={()=>setter(Math.min(max,parseInt(val||0)+1))}>▲</button>
                                            <input className="dtp-time-input" type="number" min={min} max={max} value={val||""} placeholder="00" onChange={e=>setter(Math.max(min,Math.min(max,parseInt(e.target.value)||0)))}/>
                                            <button className="dtp-spin-btn" onClick={()=>setter(Math.max(min,parseInt(val||0)-1))}>▼</button>
                                        </div>
                                    </React.Fragment>
                                ))}
                            </div>
                            <div className="dtp-time-presets">
                                {[["Start of Day","00:00:00"],["End of Day","23:59:59"],["Noon","12:00:00"]].map(([lbl,val])=>(
                                    <button key={lbl} className="dtp-preset-btn" onClick={()=>onTimeChange(val)}>{lbl}</button>
                                ))}
                            </div>
                            <div className="dtp-time-footer">
                                <button className="dtp-back-btn" onClick={()=>setTimeMode(false)}>← Back to Calendar</button>
                                <button className="dtp-done-btn" onClick={()=>{setOpen(false);setTimeMode(false);}}>Done</button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Dynamic Select ─── */
function DynSelect({ value, onChange, placeholder, options, loading }) {
    return (
        <select value={value} onChange={onChange} disabled={loading}>
            <option value="">{loading ? "Loading..." : placeholder}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    );
}
function Search() {
    // ✅ Get token from AuthContext
    const { token } = useAuth();

    // ✅ Helper: build fetch headers with JWT
    const authHeaders = () => ({
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})
    });

    const pagesPerGroup = 5;
    const [recordsPerPage, setRecordsPerPage] = useState(20);
    const [currentPage,  setCurrentPage]  = useState(1);
    const [startPage,    setStartPage]    = useState(1);
    const [showResult,   setShowResult]   = useState(false);
    const [goToPage,     setGoToPage]     = useState("");
    const [searchState,  setSearchState]  = useState(initialSearchState);
    const [result,       setResult]       = useState([]);
    const [allMessages,  setAllMessages]  = useState([]);
    const [isFetching,   setIsFetching]   = useState(true);
    const [fetchError,   setFetchError]   = useState(null);
    const [opts,         setOpts]         = useState(emptyOpts);
    const [optsLoading,  setOptsLoading]  = useState(true);
    const [activeCol,    setActiveCol]    = useState(null);
    const [colFilters,   setColFilters]   = useState({});
    const [sortKey,      setSortKey]      = useState(null);
    const [sortDir,      setSortDir]      = useState(SORT_NONE);
    const [selectedRows, setSelectedRows] = useState(new Set());
    const [visibleCols,  setVisibleCols]  = useState(new Set(COLUMNS.map(c=>c.key)));
    const [showColManager,  setShowColManager]  = useState(false);
    const [panelCollapsed,  setPanelCollapsed]  = useState(false);
    const [savedSearches,   setSavedSearches]   = useState([]);
    const [showSavedPanel,  setShowSavedPanel]  = useState(false);
    const [isSearching,     setIsSearching]     = useState(false);
    const [highlightText,   setHighlightText]   = useState("");
    const [showExportMenu,  setShowExportMenu]  = useState(false);
    const [exportScope,     setExportScope]     = useState("all");
    const [toastMsg,        setToastMsg]        = useState(null);
    const [modalMsg,        setModalMsg]        = useState(null);
    const [modalTab,        setModalTab]        = useState("header");
    const [modalIndex,      setModalIndex]      = useState(null);
    const [serverTotal,       setServerTotal]      = useState(0);
    const [serverTotalPages,  setServerTotalPages] = useState(0);
    const [isExporting,       setIsExporting]      = useState(false);
    const [searchMode,      setSearchMode]      = useState("fixed");
    const [advancedFields,  setAdvancedFields]  = useState([]);
    const [showFieldPicker, setShowFieldPicker] = useState(false);
    const [fieldPickerQuery,setFieldPickerQuery]= useState("");

    const bottomScrollRef = useRef(null);
    const tableWrapperRef = useRef(null);
    const colManagerRef   = useRef(null);
    const exportMenuRef   = useRef(null);
    const fieldPickerRef  = useRef(null);

    const set      = (key) => (e) => setSearchState(s=>({...s,[key]:e.target.value}));
    const setField = (key,val) => setSearchState(s=>({...s,[key]:val}));
    const showToast = (msg,type="success") => { setToastMsg({msg,type}); setTimeout(()=>setToastMsg(null),3000); };

    useEffect(()=>{ setIsFetching(false); },[]);

    // ✅ Dropdown fetch with JWT token
    useEffect(()=>{
        if (!token) return;
        setOptsLoading(true);
        fetch(API_DROPDOWN_URL, { headers: authHeaders() })
            .then(r=>{ if(!r.ok) throw new Error("dropdown-options error"); return r.json(); })
            .then(data=>{
                if(data.allMtMxTypes) allMtMxTypeMap = buildAllMtMxTypeMap(data.allMtMxTypes);
                setOpts(prev=>({
                    ...prev,
                    ...data,
                    types:          data.messageCodes  || data.types        || [],
                    mtTypes:        (data.messageCodes||[]).filter(c=>c.toUpperCase().startsWith("MT")).sort(),
                    mxTypes:        (data.messageCodes||[]).filter(c=>!c.toUpperCase().startsWith("MT")).sort(),
                    directions:     data.ioDirections  || data.directions   || [],
                    statuses:       data.statuses      || [],
                    actions:        data.actions       || [],
                    phases:         data.phases        || [],
                    ownerUnits:     data.owners        || data.ownerUnits   || [],
                    backendChannels:data.networkChannels||data.backendChannels||[],
                    networks:       data.networkProtocols||data.networks    || [],
                    currencies:     data.currencies    || [],
                    sourceSystems:  data.sourceSystems || [],
                    finCopies:      data.finCopies     || [],
                }));
                setOptsLoading(false);
            })
            .catch(()=>{ setOptsLoading(false); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    },[token]);

    useEffect(()=>{
        if(optsLoading || opts.formats.length>0 || allMessages.length===0) return;
        const unique = (key) => [...new Set(allMessages.map(m=>m[key]).filter(Boolean))].sort();
        const typesFromMt      = [...new Set(allMessages.filter(m=>normalizeFormat(m.format)==="MT").map(m=>m.type).filter(t=>t&&!t.includes("/")))].sort();
        const typesFromMx      = [...new Set(allMessages.filter(m=>normalizeFormat(m.format)==="MX").map(m=>m.type).filter(t=>t&&!t.includes("/")))].sort();
        const typesFromAllMtMx = [...new Set(allMessages.filter(m=>normalizeFormat(m.format)==="ALL MT&MX").map(m=>m.type).filter(t=>t&&!t.includes("/")))].sort();
        const allMtMxTypes = Object.entries(allMtMxTypeMap).filter(([,sides])=>typesFromAllMtMx.some(t=>sides.includes(t))).map(([k])=>k);
        allMtMxTypeMap = buildAllMtMxTypeMap(allMtMxTypes);
        const allIndividual = [...new Set([...typesFromMt,...typesFromMx,...typesFromAllMtMx])].sort();
        const formats=[];
        if(typesFromMt.length) formats.push("MT");
        if(typesFromMx.length) formats.push("MX");
        if(allMtMxTypes.length) formats.push("ALL MT&MX");
        setOpts({ formats, types:allIndividual, mtTypes:typesFromMt, mxTypes:typesFromMx, allMtMxTypes, networks:unique("network"), sourceSystems:unique("sourceSystem"), currencies:unique("currency"), ownerUnits:unique("ownerUnit"), backendChannels:unique("backendChannel"), directions:unique("direction"), statuses:unique("status"), finCopies:unique("finCopy"), actions:unique("action"), phases:unique("phase") });
    },[allMessages, optsLoading, opts.formats.length]);

    const typeOptions = useMemo(()=>{
        if(searchState.format==="MT")        return opts.mtTypes      || [];
        if(searchState.format==="MX")        return opts.mxTypes      || [];
        if(searchState.format==="ALL MT&MX") return opts.allMtMxTypes || [];
        return opts.types || [];
    },[searchState.format, opts]);

    useEffect(()=>{
        const h=(e)=>{
            if(colManagerRef.current&&!colManagerRef.current.contains(e.target)) setShowColManager(false);
            if(exportMenuRef.current&&!exportMenuRef.current.contains(e.target))  setShowExportMenu(false);
            if(fieldPickerRef.current&&!fieldPickerRef.current.contains(e.target)) setShowFieldPicker(false);
        };
        document.addEventListener("mousedown",h);
        return ()=>document.removeEventListener("mousedown",h);
    },[]);

    useEffect(()=>{
        const onKey=(e)=>{
            if(e.key==="Escape"){ setModalMsg(null); setShowFieldPicker(false); }
            if(modalMsg){ if(e.key==="ArrowLeft") goModalPrev(); if(e.key==="ArrowRight") goModalNext(); }
        };
        document.addEventListener("keydown",onKey);
        return ()=>document.removeEventListener("keydown",onKey);
    });

    const syncScroll=(src)=>{
        const sl=src.currentTarget.scrollLeft;
        if(src.currentTarget!==bottomScrollRef.current&&bottomScrollRef.current) bottomScrollRef.current.scrollLeft=sl;
        if(src.currentTarget!==tableWrapperRef.current&&tableWrapperRef.current) tableWrapperRef.current.scrollLeft=sl;
    };

    const handleModeSwitch = (mode) => {
        if (mode === searchMode) return;
        setSearchMode(mode);
        setSearchState(initialSearchState);
        setResult([]); setShowResult(false);
        setCurrentPage(1); setStartPage(1);
        setColFilters({}); setActiveCol(null);
        setSortKey(null); setSortDir(SORT_NONE);
        setSelectedRows(new Set()); setHighlightText("");
        setServerTotal(0); setServerTotalPages(0);
        if (mode === "advanced") setAdvancedFields(["dateRange"]);
        showToast(`Switched to ${mode === "fixed" ? "Fixed" : "Advanced"} Search`,"info");
    };

    const addAdvancedField = (fieldKey) => {
        if (!advancedFields.includes(fieldKey)) {
            setAdvancedFields(p=>[...p, fieldKey]);
        }
        setShowFieldPicker(false);
        setFieldPickerQuery("");
    };

    const removeAdvancedField = (fieldKey) => {
        setAdvancedFields(p=>p.filter(k=>k!==fieldKey));
        const def = FIELD_DEFINITIONS.find(f=>f.key===fieldKey);
        if (def) {
            const patch = {};
            def.stateKeys.forEach(sk=>{ patch[sk]=""; });
            setSearchState(s=>({...s,...patch}));
        }
    };

    const advancedResultCols = useMemo(()=>{
        if (searchMode !== "advanced") return null;
        const colKeySet = new Set(ADV_BASE_COLS);
        advancedFields.forEach(fkey=>{
            const def = FIELD_DEFINITIONS.find(f=>f.key===fkey);
            if (def) def.colKeys.forEach(ck=>colKeySet.add(ck));
        });
        return COLUMNS.filter(c=>colKeySet.has(c.key));
    },[searchMode, advancedFields]);

    const handleClear=()=>{
        setSearchState(initialSearchState); setResult([]); setShowResult(false);
        setCurrentPage(1); setStartPage(1); setColFilters({}); setActiveCol(null);
        setGoToPage(""); setSortKey(null); setSortDir(SORT_NONE);
        setSelectedRows(new Set()); setHighlightText(""); setExportScope("all");
        setServerTotal(0); setServerTotalPages(0);
        if (searchMode==="advanced") setAdvancedFields(["dateRange"]);
    };

    const buildParams = (s, page, size) => {
        const params = new URLSearchParams();
        if(s.messageType)       params.set("messageType",       s.messageType);
        else if(s.format)       params.set("messageType",       s.format);
        if(s.messageCode||s.type) params.set("messageCode",     s.messageCode||s.type);
        if(s.sender)            params.set("sender",            s.sender);
        if(s.receiver)          params.set("receiver",          s.receiver);
        if(s.country)           params.set("country",           s.country);
        if(s.workflow)          params.set("workflow",          s.workflow);
        if(s.owner||s.ownerUnit) params.set("owner",            s.owner||s.ownerUnit);
        if(s.networkChannel||s.backendChannel) params.set("networkChannel", s.networkChannel||s.backendChannel);
        if(s.networkPriority)   params.set("networkPriority",   s.networkPriority);
        if(s.networkProtocol||s.network) params.set("networkProtocol", s.networkProtocol||s.network);
        if(s.status)            params.set("status",            s.status);
        if(s.phase)             params.set("phase",             s.phase);
        if(s.action)            params.set("action",            s.action);
        if(s.io||s.direction)   params.set("io",                s.io||s.direction);
        if(s.sourceSystem)      params.set("source",            s.sourceSystem);
        if(s.reference)         params.set("reference",         s.reference);
        if(s.transactionReference) params.set("transactionReference", s.transactionReference);
        if(s.transferReference) params.set("transferReference", s.transferReference);
        if(s.uetr)              params.set("uetr",              s.uetr);
        if(s.currency)          params.set("ccy",               s.currency);
        if(s.historyEntity)     params.set("historyEntity",     s.historyEntity);
        if(s.historyDescription) params.set("historyDescription", s.historyDescription);
        if(s.freeSearchText)    params.set("freeSearchText",    s.freeSearchText);
        if(s.startDate) params.set("startDate", s.startDate.replace(/\//g,"-"));
        if(s.endDate)   params.set("endDate",   s.endDate.replace(/\//g,"-"));
        params.set("page", page);
        params.set("size", size);
        return params;
    };

    // ✅ Search fetch with JWT token
    const handleSearch=(pageOverride)=>{
        if(searchMode==="advanced"&&advancedFields.length===1&&advancedFields[0]==="dateRange"){
            showToast("Add at least one more search field in Advanced mode","error"); return;
        }
        setIsSearching(true); setIsFetching(true);

        const page = (pageOverride !== undefined) ? pageOverride : 0;
        const params = buildParams(searchState, page, recordsPerPage);

        fetch(`${API_BASE_URL}?${params.toString()}`, { headers: authHeaders() })
            .then(r=>{ if(!r.ok) throw new Error(`Search failed (${r.status})`); return r.json(); })
            .then(data=>{
                const rows = data.content || data;
                setResult(rows);
                setServerTotal(data.totalElements || rows.length);
                setServerTotalPages(data.totalPages || 1);
                setAllMessages(rows);
                setHighlightText(searchState.freeSearchText||"");
                setShowResult(true);
                setCurrentPage((data.pageNumber||0)+1);
                setStartPage(Math.floor((data.pageNumber||0)/pagesPerGroup)*pagesPerGroup+1);
                setColFilters({}); setActiveCol(null); setGoToPage("");
                setSortKey(null); setSortDir(SORT_NONE);
                setSelectedRows(new Set()); setExportScope("all");
                setIsSearching(false); setIsFetching(false); setFetchError(null);
                const total = data.totalElements || rows.length;
                showToast(`Found ${total} message${total!==1?"s":""}`, "info");
                if(!panelCollapsed && total>0) setPanelCollapsed(true);
            })
            .catch(err=>{
                setFetchError(err.message);
                setIsSearching(false); setIsFetching(false);
                showToast(err.message, "error");
            });
    };

    const handleKeyDown=(e)=>{ if(e.key==="Enter") handleSearch(); };
    const openModal=(msg,e,idx)=>{ e.stopPropagation(); setModalMsg(msg); setModalTab("header"); setModalIndex(indexOfFirst+idx); };
    const closeModal=()=>{ setModalMsg(null); setModalIndex(null); };

    const goModalPrev=()=>{ if(modalIndex===null||modalIndex<=0) return; setModalMsg(processed[modalIndex-1]); setModalIndex(modalIndex-1); setModalTab("header"); };
    const goModalNext=()=>{ if(modalIndex===null||modalIndex>=processed.length-1) return; setModalMsg(processed[modalIndex+1]); setModalIndex(modalIndex+1); setModalTab("header"); };

    const getReference=(msg)=>msg.rfkReference||msg.userReference||msg.messageReference||`REF-${String(msg.uetr||"").slice(0,8).toUpperCase()||"UNKNOWN"}`;
    const saveSearch=()=>{ const name=prompt("Name this search:"); if(!name)return; setSavedSearches(p=>[...p,{name,state:{...searchState},mode:searchMode,advFields:[...advancedFields],ts:Date.now()}]); showToast(`Search "${name}" saved`); };
    const loadSearch=(s)=>{ setSearchState(s.state); if(s.mode) setSearchMode(s.mode); if(s.advFields) setAdvancedFields(s.advFields); setShowSavedPanel(false); showToast(`Loaded "${s.name}"`); };
    const deleteSearch=(idx)=>setSavedSearches(p=>p.filter((_,i)=>i!==idx));

    const handleSort=(key)=>{
        if(sortKey!==key){
            setSortKey(key); setSortDir(SORT_ASC);
        } else if(sortDir===SORT_NONE||sortDir===null){
            setSortDir(SORT_ASC);
        } else if(sortDir===SORT_ASC){
            setSortDir(SORT_DESC);
        } else {
            setSortKey(null); setSortDir(SORT_NONE);
        }
        setCurrentPage(1); setStartPage(1);
    };

    const handleColFilter=(key,value)=>{ setColFilters(p=>({...p,[key]:value})); setCurrentPage(1); setStartPage(1); };
    const handleThClick=(key)=>setActiveCol(p=>p===key?null:key);
    const getMsgId=(msg)=>`${msg.sequenceNumber}-${msg.uetr||msg.rfkReference||msg.userReference}`;
    const toggleRow=(id)=>setSelectedRows(p=>{ const n=new Set(p); n.has(id)?n.delete(id):n.add(id); return n; });
    const toggleCol=(key)=>setVisibleCols(p=>{ const n=new Set(p); if(n.has(key)&&n.size>3) n.delete(key); else if(n.has(key)&&n.size<=3) showToast("Minimum 3 columns required","error"); else n.add(key); return n; });

    const shownCols = searchMode==="advanced" && advancedResultCols
        ? advancedResultCols
        : COLUMNS.filter(c=>visibleCols.has(c.key));

    const processed=useMemo(()=>{
        let data=result.filter(msg=>COLUMNS.every(col=>{ const fv=colFilters[col.key]; if(!fv)return true; if(col.key==="format")return getDisplayFormat(msg).toLowerCase().includes(fv.toLowerCase()); if(col.key==="type")return getDisplayType(msg).toLowerCase().includes(fv.toLowerCase()); return String(msg[col.key]??"").toLowerCase().includes(fv.toLowerCase()); }));
        if(sortKey&&sortDir!==SORT_NONE){
            data=[...data].sort((a,b)=>{
                const av=sortKey==="format"?getDisplayFormat(a):sortKey==="type"?getDisplayType(a):(a[sortKey]??"");
                const bv=sortKey==="format"?getDisplayFormat(b):sortKey==="type"?getDisplayType(b):(b[sortKey]??"");
                const cmp=typeof av==="number"?av-bv:String(av).localeCompare(String(bv));
                return sortDir===SORT_ASC?cmp:-cmp;
            });
        }
        return data;
    },[result,colFilters,sortKey,sortDir]);

    const indexOfLast=currentPage*recordsPerPage, indexOfFirst=indexOfLast-recordsPerPage;
    const currentRecords=processed;
    const totalPages=serverTotalPages || Math.ceil(processed.length/recordsPerPage);

    const handlePageClick=(page)=>{
        setCurrentPage(page);
        setSelectedRows(new Set());
        setStartPage(Math.floor((page-1)/pagesPerGroup)*pagesPerGroup+1);
        handleSearch(page-1);
    };

    // ✅ Export fetch with JWT token
    const fetchAllRows = async () => {
        const params = buildParams(searchState, 0, serverTotal > 0 ? serverTotal : 10000);
        const res = await fetch(`${API_BASE_URL}?${params.toString()}`, { headers: authHeaders() });
        if (!res.ok) throw new Error(`Export fetch failed (${res.status})`);
        const data = await res.json();
        return data.content || data;
    };

    const getExportRows = (scope) => {
        if (scope === "selected") return processed.filter(m => selectedRows.has(getMsgId(m)));
        if (scope === "page")     return currentRecords;
        return null;
    };

    const runExport = async (scope, format) => {
        setShowExportMenu(false);
        let rows;
        if (scope === "all") {
            setIsExporting(true);
            showToast(`Fetching all ${serverTotal.toLocaleString()} records…`, "info");
            try { rows = await fetchAllRows(); }
            catch (e) { showToast("Export failed: " + e.message, "error"); setIsExporting(false); return; }
            setIsExporting(false);
        } else {
            rows = getExportRows(scope);
        }

        const getCellVal = (c, msg) =>
            c.key === "format" ? getDisplayFormat(msg) :
            c.key === "type"   ? getDisplayType(msg)   :
            (msg[c.key] != null ? String(msg[c.key]) : "");

        if (format === "csv") {
            const header = shownCols.map(c => c.label).join(",");
            const body   = rows.map(msg => shownCols.map(c => '"' + getCellVal(c, msg) + '"').join(",")).join("\n");
            const blob   = new Blob([header + "\n" + body], { type: "text/csv" });
            const url    = URL.createObjectURL(blob);
            const a      = document.createElement("a"); a.href = url; a.download = "swift_messages.csv"; a.click();
            URL.revokeObjectURL(url);
            showToast(`Exported ${rows.length.toLocaleString()} row${rows.length !== 1 ? "s" : ""} as CSV`);
        } else if (format === "json") {
            const enriched = rows.map(msg => ({ ...msg, format: getDisplayFormat(msg) }));
            const blob     = new Blob([JSON.stringify(enriched, null, 2)], { type: "application/json" });
            const url      = URL.createObjectURL(blob);
            const a        = document.createElement("a"); a.href = url; a.download = "swift_messages.json"; a.click();
            URL.revokeObjectURL(url);
            showToast(`Exported ${rows.length.toLocaleString()} row${rows.length !== 1 ? "s" : ""} as JSON`);
        } else if (format === "excel") {
            const doExport = (XLSX) => {
                const getCellValNum = (c, msg) =>
                    c.key === "format" ? getDisplayFormat(msg) :
                    c.key === "type"   ? getDisplayType(msg)   :
                    (msg[c.key] != null ? msg[c.key] : "");
                const wsData = [shownCols.map(c => c.label), ...rows.map(msg => shownCols.map(c => getCellValNum(c, msg)))];
                const ws = XLSX.utils.aoa_to_sheet(wsData); ws["!cols"] = shownCols.map(() => ({ wch: 20 }));
                const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "SWIFT Messages");
                XLSX.writeFile(wb, "swift_messages.xlsx");
                showToast(`Exported ${rows.length.toLocaleString()} row${rows.length !== 1 ? "s" : ""} as Excel`);
            };
            if (window.XLSX) { doExport(window.XLSX); }
            else {
                const sc = document.createElement("script");
                sc.src = "https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js";
                sc.onload = () => doExport(window.XLSX);
                sc.onerror = () => showToast("Failed to load Excel library", "error");
                document.head.appendChild(sc);
            }
        }
    };

    const summaryStats=showResult?[
        {label:"Total",   value:serverTotal,color:"#0a0a0a"},
        {label:"Accepted",value:processed.filter(m=>m.status==="ACCEPTED"||m.status==="DELIVERED").length,color:"#1a6b3c"},
        {label:"Pending", value:processed.filter(m=>["PENDING","PROCESSING","REPAIR"].includes(m.status)).length,color:"#9a6500"},
        {label:"Failed",  value:processed.filter(m=>["REJECTED","FAILED"].includes(m.status)).length,color:"#c0392b"},
    ]:[];

    const statusClass=(s)=>({ACCEPTED:"badge-ok",DELIVERED:"badge-ok",PENDING:"badge-pending",PROCESSING:"badge-pending",REPAIR:"badge-pending",REJECTED:"badge-bypass",FAILED:"badge-bypass"}[s]||"");

    const highlight=(text,search)=>{
        if(!search||!text) return text??"—";
        const str=String(text); const idx=str.toLowerCase().indexOf(search.toLowerCase());
        if(idx===-1) return str;
        return <>{str.slice(0,idx)}<mark className="hl">{str.slice(idx,idx+search.length)}</mark>{str.slice(idx+search.length)}</>;
    };

    const renderCell=(col,msg)=>{
        const value=msg[col.key];
        if(col.key==="format")         { const d=getDisplayFormat(msg); return highlightText?highlight(d,highlightText):d; }
        if(col.key==="type")           { const d=getDisplayType(msg);   return highlightText?highlight(d,highlightText):d; }
        if(col.key==="status")         return <span className={statusClass(value)}>{value??"—"}</span>;
        if(col.key==="amount")         { if(value===undefined||value===null)return "—"; return Number(value).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2}); }
        if(col.key==="direction")      return <span className={`dir-badge ${dirClass(value)}`}>{formatDirection(value)}</span>;
        if(col.key==="sequenceNumber") return <span style={{fontFamily:"var(--mono)",fontWeight:600}}>{value??"—"}</span>;
        return highlightText?highlight(value,highlightText):(value??"—");
    };

    const sortIcon=(key)=>{ if(sortKey!==key)return <span className="sort-icon sort-idle">⇅</span>; return <span className="sort-icon sort-active">{sortDir===SORT_ASC?"↑":"↓"}</span>; };
    const activeFilterCount=Object.values(searchState).filter(v=>v!=="").length;
    const extraWidth=180+(shownCols.length>7?(shownCols.length-7)*130:0);
    const scopeTabs=[{key:"all",label:"All",count:serverTotal},{key:"page",label:"This Page",count:currentRecords.length},{key:"selected",label:"Selected",count:selectedRows.size}];
    const isFirstMsg=modalIndex===null||modalIndex<=0;
    const isLastMsg =modalIndex===null||modalIndex>=processed.length-1;

    const renderAdvancedField = (fieldKey) => {
        const def = FIELD_DEFINITIONS.find(f=>f.key===fieldKey);
        if (!def) return null;

        const fieldContent = () => {
            switch(def.type) {
                case "select":
                    return (
                        <DynSelect
                            value={searchState[def.stateKeys[0]]}
                            onChange={set(def.stateKeys[0])}
                            placeholder={def.placeholder}
                            options={opts[def.optKey] || []}
                            loading={optsLoading}
                        />
                    );
                case "select-type":
                    return (
                        <DynSelect
                            value={searchState.type}
                            onChange={set("type")}
                            placeholder="All Types"
                            options={typeOptions}
                            loading={optsLoading}
                        />
                    );
                case "date-range":
                    return (
                        <div className="adv-date-range-wrap">
                            <DateTimePicker
                                label="From"
                                dateValue={searchState.startDate}
                                timeValue={searchState.startTime}
                                onDateChange={v=>{
                                    setField("startDate", v);
                                    if (v) {
                                        const autoEnd = addOneMonth(v);
                                        if (!searchState.endDate || searchState.endDate > autoEnd) {
                                            setField("endDate", autoEnd);
                                        }
                                    }
                                }}
                                onTimeChange={v=>setField("startTime",v)}
                                onKeyDown={handleKeyDown}
                            />
                            <span className="adv-date-sep">→</span>
                            <DateTimePicker
                                label="To"
                                dateValue={searchState.endDate}
                                timeValue={searchState.endTime}
                                onDateChange={v=>{
                                    const clamped = clampToOneMonth(searchState.startDate, v);
                                    setField("endDate", clamped);
                                    if (clamped !== v) showToast("Max range is 1 month from start date", "error");
                                }}
                                onTimeChange={v=>setField("endTime",v)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                    );
                case "amount-range":
                    return (
                        <div className="adv-range-wrap">
                            <input type="number" placeholder="Min Amount" value={searchState.amountFrom} onChange={set("amountFrom")} onKeyDown={handleKeyDown}/>
                            <span className="adv-range-sep">—</span>
                            <input type="number" placeholder="Max Amount" value={searchState.amountTo} onChange={set("amountTo")} onKeyDown={handleKeyDown}/>
                        </div>
                    );
                case "seq-range":
                    return (
                        <div className="adv-range-wrap">
                            <input type="number" placeholder="e.g. 1" value={searchState.seqFrom} onChange={set("seqFrom")} onKeyDown={handleKeyDown}/>
                            <span className="adv-range-sep">—</span>
                            <input type="number" placeholder="e.g. 9999" value={searchState.seqTo} onChange={set("seqTo")} onKeyDown={handleKeyDown}/>
                        </div>
                    );
                case "text-wide":
                    return <input className="input-wide" placeholder={def.placeholder} value={searchState[def.stateKeys[0]]} onChange={set(def.stateKeys[0])} onKeyDown={handleKeyDown}/>;
                default:
                    return <input placeholder={def.placeholder} value={searchState[def.stateKeys[0]]} onChange={set(def.stateKeys[0])} onKeyDown={handleKeyDown}/>;
            }
        };

        return (
            <div key={fieldKey} className="adv-field-card">
                <div className="adv-field-header">
                    <span className="adv-field-label">{def.label}</span>
                    {fieldKey !== "dateRange" && (
                    <button className="adv-field-remove" onClick={()=>removeAdvancedField(fieldKey)} title="Remove field">
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                    )}
                </div>
                <div className="adv-field-input">{fieldContent()}</div>
            </div>
        );
    };

    const filteredFieldDefs = FIELD_DEFINITIONS.filter(f=>
        f.key !== "dateRange" &&
        !advancedFields.includes(f.key) &&
        (fieldPickerQuery==="" || f.label.toLowerCase().includes(fieldPickerQuery.toLowerCase()) || f.group.toLowerCase().includes(fieldPickerQuery.toLowerCase()))
    );

    const groupedFields = FIELD_GROUPS.reduce((acc,g)=>{
        const items = filteredFieldDefs.filter(f=>f.group===g);
        if (items.length) acc[g]=items;
        return acc;
    },{});

    return (
        <div className="container">
            {toastMsg&&<div className={`toast toast-${toastMsg.type}`}><span>{toastMsg.msg}</span></div>}

            {isFetching&&<div style={{padding:"10px 16px",background:"#f0f4ff",borderRadius:6,marginBottom:8,fontSize:13,color:"#3a5bd9",display:"flex",alignItems:"center",gap:8}}><span className="spinner" style={{borderTopColor:"#3a5bd9"}}/>Loading messages from backend...</div>}
            {fetchError &&<div style={{padding:"10px 16px",background:"#fff0f0",borderRadius:6,marginBottom:8,fontSize:13,color:"#c0392b",border:"1px solid #f5c6cb"}}>⚠ Backend error: {fetchError}. Make sure Spring Boot is running on http://localhost:8081</div>}

            <div className="app-header">
                
                <div className="app-header-actions">
                    <div className="search-mode-toggle">
                        <button
                            className={`mode-btn${searchMode==="fixed"?" mode-btn-active":""}`}
                            onClick={()=>handleModeSwitch("fixed")}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
                            Fixed
                        </button>
                        <button
                            className={`mode-btn${searchMode==="advanced"?" mode-btn-active":""}`}
                            onClick={()=>handleModeSwitch("advanced")}
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            Advanced
                        </button>
                    </div>
                    {savedSearches.length>0&&<button className="hdr-btn" onClick={()=>setShowSavedPanel(!showSavedPanel)}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/></svg>Saved ({savedSearches.length})</button>}
                    <button className="hdr-btn" onClick={saveSearch}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>Save Search</button>
                </div>
            </div>

            {showSavedPanel&&<div className="saved-panel"><div className="saved-panel-header"><span>Saved Searches</span><button className="icon-btn" onClick={()=>setShowSavedPanel(false)}>✕</button></div>{savedSearches.map((s,i)=>(<div key={i} className="saved-item"><span className="saved-name">{s.name}</span><span className="saved-ts">{new Date(s.ts).toLocaleDateString()}</span><button className="pg-btn" onClick={()=>loadSearch(s)}>Load</button><button className="icon-btn danger-btn" onClick={()=>deleteSearch(i)}>✕</button></div>))}</div>}

            {searchMode==="fixed"&&(
                <div className={`search-panel${panelCollapsed?" panel-collapsed":""}`}>
                    <div className="panel-section-title" onClick={()=>setPanelCollapsed(p=>!p)} style={{cursor:"pointer"}}>
                        <span>Search Criteria {activeFilterCount>0&&<span className="filter-badge">{activeFilterCount} active</span>}</span>
                        <span className="collapse-icon">{panelCollapsed?"▼ Expand":"▲ Collapse"}</span>
                    </div>
                    {!panelCollapsed&&(<>
                        <div className="row">
                            <div className="field-group"><label>Message Format</label>
                                <DynSelect value={searchState.format} onChange={e=>setSearchState(s=>({...s,format:e.target.value,type:""}))} placeholder="All Formats" options={opts.formats} loading={optsLoading}/>
                            </div>
                            <div className="field-group"><label>Message Type</label>
                                <select value={searchState.type} onChange={set("type")} onKeyDown={handleKeyDown}>
                                    <option value="">All Types</option>
                                    {(searchState.format===""
                                        ? opts.types
                                        : searchState.format==="MT" ? opts.mtTypes
                                        : searchState.format==="MX" ? opts.mxTypes
                                        : opts.allMtMxTypes
                                    ).map(t=><option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <DateTimePicker label="Starting Date / Time" dateValue={searchState.startDate} timeValue={searchState.startTime} onDateChange={v=>setField("startDate",v)} onTimeChange={v=>setField("startTime",v)} onKeyDown={handleKeyDown}/>
                            <DateTimePicker label="Ending Date / Time"   dateValue={searchState.endDate}   timeValue={searchState.endTime}   onDateChange={v=>setField("endDate",v)}   onTimeChange={v=>setField("endTime",v)}   onKeyDown={handleKeyDown}/>
                            <div className="field-group"><label>User Reference</label>
                                <input placeholder="MUR" value={searchState.userReference} onChange={set("userReference")} onKeyDown={handleKeyDown}/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="field-group"><label>Source System</label>
                                <DynSelect value={searchState.sourceSystem} onChange={set("sourceSystem")} placeholder="All Systems" options={opts.sourceSystems} loading={optsLoading}/>
                            </div>
                            <div className="field-group"><label>RFK Reference / UMID</label>
                                <input placeholder="Enter RFK Reference" value={searchState.rfkReference} onChange={set("rfkReference")} onKeyDown={handleKeyDown}/>
                            </div>
                            <div className="field-group"><label>Message Direction</label>
                                <DynSelect value={searchState.direction||searchState.io} onChange={e=>{setSearchState(s=>({...s,direction:e.target.value,io:e.target.value}))}} placeholder="All Directions" options={opts.directions.length?opts.directions:opts.ioDirections} loading={optsLoading}/>
                            </div>
                            <div className="field-group"><label>Status</label>
                                <DynSelect value={searchState.status} onChange={set("status")} placeholder="All Status" options={opts.statuses} loading={optsLoading}/>
                            </div>
                            <div className="field-group"><label>Fin-Copy</label>
                                <DynSelect value={searchState.finCopy} onChange={set("finCopy")} placeholder="All" options={opts.finCopies} loading={optsLoading}/>
                            </div>
                            <div className="field-group"><label>Network</label>
                                <DynSelect value={searchState.network||searchState.networkProtocol} onChange={e=>{setSearchState(s=>({...s,network:e.target.value,networkProtocol:e.target.value}))}} placeholder="All Networks" options={opts.networks.length?opts.networks:opts.networkProtocols} loading={optsLoading}/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="field-group"><label>Sender BIC</label>
                                <input placeholder="Enter Sender BIC" value={searchState.sender} onChange={set("sender")} onKeyDown={handleKeyDown}/>
                            </div>
                            <div className="field-group"><label>Receiver BIC</label>
                                <input placeholder="Enter Receiver BIC" value={searchState.receiver} onChange={set("receiver")} onKeyDown={handleKeyDown}/>
                            </div>
                            <div className="field-group"><label>Phase</label>
                                <DynSelect value={searchState.phase} onChange={set("phase")} placeholder="All Phases" options={opts.phases} loading={optsLoading}/>
                            </div>
                            <div className="field-group"><label>Action</label>
                                <DynSelect value={searchState.action} onChange={set("action")} placeholder="All Actions" options={opts.actions} loading={optsLoading}/>
                            </div>
                            <div className="field-group"><label>Reason</label>
                                <input placeholder="Enter Reason" value={searchState.reason} onChange={set("reason")} onKeyDown={handleKeyDown}/>
                            </div>
                            <div className="field-group"><label>Correspondent</label>
                                <input placeholder="Correspondent" value={searchState.correspondent} onChange={set("correspondent")} onKeyDown={handleKeyDown}/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="field-group"><label>Amount From</label>
                                <input type="number" placeholder="Min Amount" value={searchState.amountFrom} onChange={set("amountFrom")} onKeyDown={handleKeyDown}/>
                            </div>
                            <div className="field-group"><label>Amount To</label>
                                <input type="number" placeholder="Max Amount" value={searchState.amountTo} onChange={set("amountTo")} onKeyDown={handleKeyDown}/>
                            </div>
                            <div className="field-group"><label>Currency (CCY)</label>
                                <DynSelect value={searchState.currency} onChange={set("currency")} placeholder="All Currencies" options={opts.currencies} loading={optsLoading}/>
                            </div>
                            <div className="field-group"><label>Owner / Unit</label>
                                <DynSelect value={searchState.ownerUnit||searchState.owner} onChange={e=>{setSearchState(s=>({...s,ownerUnit:e.target.value,owner:e.target.value}))}} placeholder="All Units" options={opts.ownerUnits.length?opts.ownerUnits:opts.owners} loading={optsLoading}/>
                            </div>
                            <div className="field-group"><label>Message Reference</label>
                                <input placeholder="Message Reference" value={searchState.messageReference} onChange={set("messageReference")} onKeyDown={handleKeyDown}/>
                            </div>
                        </div>
                        <div className="row">
                            <div className="field-group"><label>Seq No. From</label>
                                <input type="number" placeholder="e.g. 1" value={searchState.seqFrom} onChange={set("seqFrom")} onKeyDown={handleKeyDown}/>
                            </div>
                            <div className="field-group"><label>Seq No. To</label>
                                <input type="number" placeholder="e.g. 9999" value={searchState.seqTo} onChange={set("seqTo")} onKeyDown={handleKeyDown}/>
                            </div>
                            <div className="field-group field-group-wide"><label>UETR</label>
                                <input className="input-wide" placeholder="Enter UETR (e.g. 8a562c65-...)" value={searchState.uetr} onChange={set("uetr")} onKeyDown={handleKeyDown}/>
                            </div>
                        </div>
                        <div className="row" style={{alignItems:"flex-end"}}>
                            <div className="field-group field-group-wide"><label>Free Search Text</label>
                                <input className="input-wide" placeholder="Searches across all fields..." value={searchState.freeSearchText} onChange={set("freeSearchText")} onKeyDown={handleKeyDown}/>
                            </div>
                            <div className="field-group"><label>Channel / Session</label>
                                <DynSelect value={searchState.backendChannel||searchState.networkChannel} onChange={e=>{setSearchState(s=>({...s,backendChannel:e.target.value,networkChannel:e.target.value}))}} placeholder="All Channels" options={opts.backendChannels.length?opts.backendChannels:opts.networkChannels} loading={optsLoading}/>
                            </div>
                        </div>
                    </>)}
                </div>
            )}

            {searchMode==="advanced"&&(
                <div className={`search-panel adv-panel${panelCollapsed?" panel-collapsed":""}`}>
                    <div className="panel-section-title" onClick={()=>setPanelCollapsed(p=>!p)} style={{cursor:"pointer"}}>
                        <div style={{display:"flex",alignItems:"center",gap:10}}>
                            <span>Advanced Search</span>
                            {advancedFields.length>0&&<span className="filter-badge">{advancedFields.length} field{advancedFields.length!==1?"s":""}</span>}
                            <span className="adv-mode-chip">
                                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                                Dynamic
                            </span>
                        </div>
                        <span className="collapse-icon">{panelCollapsed?"▼ Expand":"▲ Collapse"}</span>
                    </div>

                    {!panelCollapsed&&(
                        <>
                            <div className="adv-toolbar">
                                <div className="adv-picker-wrap" ref={fieldPickerRef}>
                                    <button className="adv-add-btn" onClick={()=>setShowFieldPicker(p=>!p)}>
                                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                        Add Search Field
                                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginLeft:2}}><polyline points="6 9 12 15 18 9"/></svg>
                                    </button>

                                    {showFieldPicker&&(
                                        <div className="adv-picker-dropdown">
                                            <div className="adv-picker-search">
                                                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>
                                                <input
                                                    placeholder="Search fields..."
                                                    value={fieldPickerQuery}
                                                    onChange={e=>setFieldPickerQuery(e.target.value)}
                                                    autoFocus
                                                />
                                                {fieldPickerQuery&&<button className="adv-picker-clear" onClick={()=>setFieldPickerQuery("")}>✕</button>}
                                            </div>
                                            <div className="adv-picker-body">
                                                {Object.keys(groupedFields).length===0&&(
                                                    <div className="adv-picker-empty">
                                                        {advancedFields.length===FIELD_DEFINITIONS.length?"All fields added":"No fields match"}
                                                    </div>
                                                )}
                                                {Object.entries(groupedFields).map(([group,items])=>(
                                                    <div key={group} className="adv-picker-group">
                                                        <div className="adv-picker-group-label">{group}</div>
                                                        {items.map(f=>(
                                                            <button key={f.key} className="adv-picker-item" onClick={()=>addAdvancedField(f.key)}>
                                                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                                                {f.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {advancedFields.length>0&&(
                                    <button className="adv-clear-fields-btn" onClick={()=>{setAdvancedFields(["dateRange"]);setSearchState(initialSearchState);}}>
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>
                                        Clear all fields
                                    </button>
                                )}

                                <div className="adv-info-text">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                                    Result table shows only columns for selected fields
                                </div>
                            </div>

                            <div className="adv-fixed-date-wrap">
                                {renderAdvancedField("dateRange")}
                            </div>

                            {advancedFields.filter(f=>f!=="dateRange").length===0&&(
                                <div className="adv-empty-state">
                                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#c8c8c8" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/><line x1="11" y1="8" x2="11" y2="14"/></svg>
                                    <p>No search fields added yet</p>
                                    <span>Click "Add Search Field" to choose which fields to search on</span>
                                </div>
                            )}

                            {advancedFields.filter(f=>f!=="dateRange").length>0&&(
                                <div className="adv-fields-grid">
                                    {advancedFields.filter(f=>f!=="dateRange").map(fkey=>renderAdvancedField(fkey))}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            <div className="action-bar">
                <div className="action-left">
                    <button className={`search-btn${isSearching?" btn-loading":""}`} onClick={handleSearch} disabled={isSearching}>
                        {isSearching?(<><span className="spinner"/>Searching...</>):(<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg>Search</>)}
                    </button>
                    <button className="clear-btn" onClick={handleClear}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></svg>Reset</button>
                </div>
                <div style={{display:"flex",alignItems:"center",gap:16}}>
                    {searchMode==="advanced"&&advancedFields.length>0&&(
                        <div className="adv-active-fields-strip">
                            {advancedFields.map(fkey=>{
                                const def=FIELD_DEFINITIONS.find(f=>f.key===fkey);
                                return def?<span key={fkey} className="adv-active-chip">{def.label}</span>:null;
                            })}
                        </div>
                    )}
                    <div className="action-hint"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>Press Enter in any field to search</div>
                </div>
            </div>

            {showResult&&(<>
                <div className="stats-row">
                    {summaryStats.map((s,i)=>(<div key={i} className="stat-card" style={{"--stat-color":s.color}}><span className="stat-value">{s.value.toLocaleString()}</span><span className="stat-label">{s.label}</span></div>))}
                    <div className="stats-spacer"/>

                    {searchMode==="fixed"&&(
                        <div className="col-manager-wrap" ref={colManagerRef}>
                            <button className="tool-btn" onClick={()=>setShowColManager(p=>!p)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>Columns ({visibleCols.size}/{COLUMNS.length})</button>
                            {showColManager&&<div className="col-manager-dropdown"><div className="col-manager-title">Toggle Columns</div><div className="col-manager-grid">{COLUMNS.map(col=>(<label key={col.key} className="col-toggle-item"><input type="checkbox" checked={visibleCols.has(col.key)} onChange={()=>toggleCol(col.key)}/><span>{col.label}</span></label>))}</div></div>}
                        </div>
                    )}

                    {searchMode==="advanced"&&advancedResultCols&&(
                        <div className="adv-cols-info">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                            {advancedResultCols.length} column{advancedResultCols.length!==1?"s":""} shown
                        </div>
                    )}

                    <div className="export-wrap" ref={exportMenuRef}>
                        <button className="tool-btn tool-btn-primary" onClick={()=>!isExporting&&setShowExportMenu(p=>!p)} disabled={isExporting}>
                            {isExporting
                                ? <><span className="spinner" style={{borderTopColor:"var(--accent)",borderColor:"var(--accent-mid)"}}/>Exporting…</>
                                : <><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Export<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg></>
                            }
                        </button>
                        {showExportMenu&&<div className="export-dropdown">
                            <div className="export-scope-section"><div className="export-scope-header"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>Export Scope</div>
                            <div className="export-scope-tabs">{scopeTabs.map(s=>{
                                const isDisabled = s.key==="selected" && selectedRows.size===0;
                                return (
                                    <button
                                        key={s.key}
                                        className={`export-scope-tab${exportScope===s.key?" export-scope-active":""}`}
                                        style={isDisabled?{opacity:0.4,cursor:"not-allowed",pointerEvents:"all"}:{}}
                                        onClick={()=>{ if(isDisabled){ showToast("No rows selected. Click rows in the table to select them.","error"); return; } setExportScope(s.key); }}
                                        title={isDisabled?"Select rows in the table first":undefined}
                                    >
                                        <span className="scope-tab-label">{s.label}</span>
                                        <span className="scope-tab-count">{typeof s.count==="number"?s.count.toLocaleString():s.count}</span>
                                    </button>
                                );
                            })}</div></div>
                            <div className="export-format-divider"><span>Format</span></div>
                            <button className="export-opt" onClick={()=>runExport(exportScope,"csv")}><span className="export-opt-icon export-icon-csv">CSV</span><span className="export-opt-info"><span className="export-opt-name">Comma Separated</span><span className="export-opt-ext">.csv</span></span></button>
                            <button className="export-opt" onClick={()=>runExport(exportScope,"excel")}><span className="export-opt-icon export-icon-xlsx">XLS</span><span className="export-opt-info"><span className="export-opt-name">Excel Workbook</span><span className="export-opt-ext">.xlsx</span></span></button>
                            <button className="export-opt" onClick={()=>runExport(exportScope,"json")}><span className="export-opt-icon export-icon-json">JSON</span><span className="export-opt-info"><span className="export-opt-name">JSON Data</span><span className="export-opt-ext">.json</span></span></button>
                        </div>}
                    </div>
                </div>

                {Object.keys(colFilters).some(k=>colFilters[k])&&<div className="active-filters-bar"><span className="af-label">Table filters:</span>{Object.entries(colFilters).filter(([,v])=>v).map(([k,v])=>(<span key={k} className="af-chip">{COLUMNS.find(c=>c.key===k)?.label}: {v}<button className="af-remove" onClick={()=>handleColFilter(k,"")}>✕</button></span>))}<button className="af-clear-all" onClick={()=>setColFilters({})}>Clear all</button></div>}

                <div className="table-wrapper" ref={tableWrapperRef} onScroll={syncScroll}>
                    <table style={{width:`calc(100% + ${extraWidth}px)`,minWidth:`calc(100% + ${extraWidth}px)`}}>
                        <thead><tr>
                            <th className="row-num-th">#</th>
                            <th className="ref-th">Reference</th>
                            {shownCols.map(col=>(<th key={col.key} className={activeCol===col.key?"active-col":""} onClick={()=>handleThClick(col.key)}>
                                <div className="th-label"><span className="th-text" onClick={e=>{e.stopPropagation();handleSort(col.key);}}>{col.label}{sortIcon(col.key)}</span><span className="search-icon"><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><line x1="16.5" y1="16.5" x2="22" y2="22"/></svg></span></div>
                                {activeCol===col.key&&<input className="col-search-input" placeholder={`Filter ${col.label}...`} value={colFilters[col.key]||""} onClick={e=>e.stopPropagation()} onChange={e=>handleColFilter(col.key,e.target.value)} autoFocus/>}
                            </th>))}
                        </tr></thead>
                        <tbody>
                            {currentRecords.length>0?currentRecords.map((msg,idx)=>{
                                const msgId=getMsgId(msg);
                                return(<tr key={msgId} className={selectedRows.has(msgId)?"row-selected":""} onClick={()=>toggleRow(msgId)}>
                                    <td className="row-num-td">{indexOfFirst+idx+1}</td>
                                    <td className="ref-td"><button className="ref-link" onClick={e=>openModal(msg,e,idx)}>{getReference(msg)}</button></td>
                                    {shownCols.map(col=>(<td key={col.key}>{renderCell(col,msg)}</td>))}
                                </tr>);
                            }):(
                                <tr><td colSpan={shownCols.length+2} className="no-result"><div className="no-result-inner"><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#c8c8c8" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><p>No messages found</p><span>Try adjusting your search criteria</span></div></td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="bottom-scrollbar" ref={bottomScrollRef} onScroll={syncScroll}><div className="scroll-inner" style={{width:`calc(100% + ${extraWidth}px)`}}/></div>

                {totalPages>=1&&<div className="pagination-bar">
                    <div className="pagination-left"><span className="record-range">Showing <strong>{indexOfFirst+1}–{Math.min(indexOfFirst+currentRecords.length, serverTotal)}</strong> of <strong>{serverTotal.toLocaleString()}</strong> records</span></div>
                    <div className="pagination-center">
                        <button className="pg-btn pg-edge" onClick={()=>handlePageClick(1)} disabled={currentPage===1}>««</button>
                        <button className="pg-btn" onClick={()=>handlePageClick(Math.max(1,currentPage-1))} disabled={currentPage===1}>‹ Prev</button>
                        {startPage>1&&<span className="pg-ellipsis">…</span>}
                        {[...Array(pagesPerGroup)].map((_,i)=>{ const p=startPage+i; if(p>totalPages)return null; return <button key={p} className={`pg-btn pg-num${currentPage===p?" pg-active":""}`} onClick={()=>handlePageClick(p)}>{p}</button>; })}
                        {startPage+pagesPerGroup-1<totalPages&&<span className="pg-ellipsis">…</span>}
                        <button className="pg-btn" onClick={()=>handlePageClick(Math.min(totalPages,currentPage+1))} disabled={currentPage===totalPages}>Next ›</button>
                        <button className="pg-btn pg-edge" onClick={()=>handlePageClick(totalPages)} disabled={currentPage===totalPages}>»»</button>
                    </div>
                    <div className="pagination-right">
                        <label className="pg-label">Go to</label>
                        <input className="pg-goto" type="number" min="1" max={totalPages} value={goToPage} placeholder="pg" onChange={e=>setGoToPage(e.target.value)} onKeyDown={e=>{ if(e.key==="Enter"){const p=parseInt(goToPage);if(p>=1&&p<=totalPages)handlePageClick(p);setGoToPage("");}}}/>
                        <span className="pg-of-total">of {totalPages}</span><span className="pg-divider"/>
                        <label className="pg-label">Rows</label>
                        <select className="pg-rows-select" value={recordsPerPage} onChange={e=>{setRecordsPerPage(Number(e.target.value));setCurrentPage(1);setStartPage(1);}}>
                            <option value={10}>10</option><option value={20}>20</option><option value={50}>50</option><option value={100}>100</option>
                        </select>
                    </div>
                </div>}
            </>)}

            {modalMsg&&(
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-box" onClick={e=>e.stopPropagation()}>
                        <div className="txn-header">
                            <div className="txn-header-left"><div className="txn-type-pill">{getDisplayFormat(modalMsg)}</div><div><div className="txn-title">{getDisplayType(modalMsg)||"Transaction"}</div><div className="txn-subtitle">{modalMsg.date}{modalMsg.time&&<span> · {modalMsg.time}</span>}</div></div></div>
                            <div className="txn-header-right">
                                <span className={`txn-status-badge ${statusClass(modalMsg.status)}`}>{modalMsg.status||"—"}</span>
                                <div className="txn-nav"><button className="txn-nav-btn" onClick={goModalPrev} disabled={isFirstMsg}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg></button><span className="txn-nav-count">{modalIndex+1}/{processed.length}</span><button className="txn-nav-btn" onClick={goModalNext} disabled={isLastMsg}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg></button></div>
                                <button className="txn-close" onClick={closeModal}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
                            </div>
                        </div>
                        <div className="txn-summary-strip">
                            <div className="txn-summary-item"><span className="txn-sum-label">Sender</span><span className="txn-sum-value mono">{modalMsg.sender||"—"}</span></div>
                            <div className="txn-summary-arrow"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg></div>
                            <div className="txn-summary-item"><span className="txn-sum-label">Receiver</span><span className="txn-sum-value mono">{modalMsg.receiver||"—"}</span></div>
                            <div className="txn-summary-divider"/>
                            <div className="txn-summary-item"><span className="txn-sum-label">Country</span><span className="txn-sum-value">{modalMsg.country||"—"}</span></div>
                            <div className="txn-summary-divider"/>
                            <div className="txn-summary-item"><span className="txn-sum-label">Owner</span><span className="txn-sum-value">{modalMsg.owner||modalMsg.ownerUnit||"—"}</span></div>
                            <div className="txn-summary-divider"/>
                            <div className="txn-summary-item"><span className="txn-sum-label">Network</span><span className="txn-sum-value">{modalMsg.networkProtocol||modalMsg.network||"—"}</span></div>
                            <div className="txn-summary-item"><span className="txn-sum-label">Direction</span><span className={`dir-badge ${dirClass(modalMsg.io||modalMsg.direction)}`}>{formatDirection(modalMsg.io||modalMsg.direction)}</span></div>
                        </div>
                        <div className="txn-tabs">{[{key:"header",label:"Header"},{key:"body",label:"Body"},{key:"history",label:"History"},{key:"details",label:"Details"}].map(t=>(<button key={t.key} className={`txn-tab${modalTab===t.key?" txn-tab-active":""}`} onClick={()=>setModalTab(t.key)}>{t.label}{t.key==="history"&&modalMsg.rawMessage?.historyLines?.length?<span className="txn-tab-count">{modalMsg.rawMessage.historyLines.length}</span>:null}</button>))}</div>
                        <div className="txn-body">
                            {modalTab==="header"&&<div className="txn-section-wrap">
                                <div className="hdr-section-label"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>Parties</div>
                                <div className="hdr-parties-row">
                                    <div className="hdr-party-card hdr-party-sender"><div className="hdr-party-role"><span className="hdr-party-role-dot hdr-dot-sender"/>Sender</div><div className="hdr-party-bic">{modalMsg.sender||"—"}</div><div className="hdr-party-meta">{modalMsg.rawMessage?.senderInstitutionName?<span>{modalMsg.rawMessage.senderInstitutionName}</span>:<span className="hdr-party-na">No institution name</span>}</div><div className="hdr-party-tag">Financial Institution</div></div>
                                    <div className="hdr-parties-arrow"><div className="hdr-arrow-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg></div></div>
                                    <div className="hdr-party-card hdr-party-receiver"><div className="hdr-party-role"><span className="hdr-party-role-dot hdr-dot-receiver"/>Receiver</div><div className="hdr-party-bic">{modalMsg.receiver||"—"}</div><div className="hdr-party-meta">{modalMsg.rawMessage?.receiverInstitutionName?<span>{modalMsg.rawMessage.receiverInstitutionName}</span>:<span className="hdr-party-na">No institution name</span>}</div><div className="hdr-party-tag">Financial Institution</div></div>
                                </div>
                                <div className="hdr-section-label" style={{marginTop:22}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>Message Details</div>
                                <div className="hdr-details-table">
                                    <div className="hdr-detail-row"><span className="hdr-detail-key">Message Code</span><span className="hdr-detail-val">{modalMsg.messageCode||getDisplayType(modalMsg)||"—"}</span></div>
                                    <div className="hdr-detail-row"><span className="hdr-detail-key">Message Format</span><span className="hdr-detail-val">{modalMsg.rawMessage?.messageFormat||getDisplayFormat(modalMsg)||"—"}</span></div>
                                    <div className="hdr-detail-row"><span className="hdr-detail-key">Reference</span><span className="hdr-detail-val mono">{modalMsg.reference||"—"}</span></div>
                                    <div className="hdr-detail-row"><span className="hdr-detail-key">Transaction Reference</span><span className="hdr-detail-val mono">{modalMsg.transactionReference||"—"}</span></div>
                                    <div className="hdr-detail-row"><span className="hdr-detail-key">Transfer Reference</span><span className="hdr-detail-val mono">{modalMsg.transferReference||"—"}</span></div>
                                    <div className="hdr-detail-row"><span className="hdr-detail-key">MUR</span><span className="hdr-detail-val mono">{modalMsg.mur||modalMsg.userReference||"—"}</span></div>
                                    <div className="hdr-detail-row"><span className="hdr-detail-key">Creation Date</span><span className="hdr-detail-val mono">{modalMsg.creationDate||modalMsg.date||"—"}</span></div>
                                    <div className="hdr-detail-row"><span className="hdr-detail-key">Received</span><span className="hdr-detail-val mono">{modalMsg.receivedDT||"—"}</span></div>
                                    <div className="hdr-detail-row"><span className="hdr-detail-key">Delivered</span><span className="hdr-detail-val mono">{modalMsg.deliveredDate||"—"}</span></div>
                                    <div className="hdr-detail-row"><span className="hdr-detail-key">UETR</span><span className="hdr-detail-val mono hdr-uetr-val">{modalMsg.uetr||"—"}</span></div>
                                    <div className="hdr-detail-row"><span className="hdr-detail-key">Workflow</span><span className="hdr-detail-val">{modalMsg.workflow||"—"}</span></div>
                                    <div className="hdr-detail-row"><span className="hdr-detail-key">Environment</span><span className="hdr-detail-val">{modalMsg.environment||"—"}</span></div>
                                    <div className="hdr-detail-row"><span className="hdr-detail-key">Status Message</span><span className="hdr-detail-val">{modalMsg.statusMessage||"—"}</span></div>
                                </div>
                            </div>}
                            {modalTab==="body"&&<div className="txn-section-wrap"><div className="txn-fields-grid">
                                <div className="txn-field"><span className="txn-field-label">Message Code</span><span className="txn-field-value">{modalMsg.messageCode||getDisplayType(modalMsg)||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Message Type</span><span className="txn-field-value">{getDisplayFormat(modalMsg)||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Network Protocol</span><span className="txn-field-value">{modalMsg.networkProtocol||modalMsg.network||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Network Channel</span><span className="txn-field-value">{modalMsg.networkChannel||modalMsg.backendChannel||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Network Priority</span><span className="txn-field-value">{modalMsg.networkPriority||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Country</span><span className="txn-field-value">{modalMsg.country||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Owner</span><span className="txn-field-value">{modalMsg.owner||modalMsg.ownerUnit||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Workflow</span><span className="txn-field-value">{modalMsg.workflow||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Direction</span><span className={`txn-field-value dir-badge ${dirClass(modalMsg.io||modalMsg.direction)}`}>{formatDirection(modalMsg.io||modalMsg.direction)}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Status</span><span className={`txn-field-value ${statusClass(modalMsg.status)}`}>{modalMsg.status||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Phase</span><span className="txn-field-value">{modalMsg.phase||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Action</span><span className="txn-field-value">{modalMsg.action||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Reason</span><span className="txn-field-value">{modalMsg.reason||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Environment</span><span className="txn-field-value">{modalMsg.environment||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Session No.</span><span className="txn-field-value mono">{modalMsg.sessionNumber||"—"}</span></div>
                                <div className="txn-field"><span className="txn-field-label">Sequence No.</span><span className="txn-field-value mono">{modalMsg.sequenceNumber||"—"}</span></div>
                            </div></div>}
                            {modalTab==="history"&&<div className="txn-section-wrap">
                                {(()=>{
                                    const lines = modalMsg.rawMessage?.historyLines || [];
                                    if(lines.length===0) return <div className="adv-empty-state"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#c8c8c8" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><p>No history lines available</p></div>;
                                    return (
                                        <div style={{overflowX:"auto",overflowY:"auto",maxHeight:"500px"}}>
                                            <table className="history-table" style={{width:"max-content",minWidth:"100%",borderCollapse:"collapse",fontSize:13,tableLayout:"auto"}}>
                                                <thead style={{position:"sticky",top:0,zIndex:10}}>
                                                    <tr style={{background:"#f8f9fa",borderBottom:"2px solid #e0e0e0"}}>
                                                        <th style={{padding:"12px 16px",textAlign:"center",fontWeight:600,color:"#666",whiteSpace:"nowrap",minWidth:50}}>#</th>
                                                        <th style={{padding:"12px 16px",textAlign:"left",fontWeight:600,color:"#666",whiteSpace:"nowrap",minWidth:180}}>Date & Time</th>
                                                        <th style={{padding:"12px 16px",textAlign:"left",fontWeight:600,color:"#666",whiteSpace:"nowrap",minWidth:120}}>Entity</th>
                                                        <th style={{padding:"12px 16px",textAlign:"left",fontWeight:600,color:"#666",whiteSpace:"nowrap",minWidth:120}}>Action</th>
                                                        <th style={{padding:"12px 16px",textAlign:"left",fontWeight:600,color:"#666",whiteSpace:"nowrap",minWidth:110}}>Phase</th>
                                                        <th style={{padding:"12px 16px",textAlign:"left",fontWeight:600,color:"#666",whiteSpace:"nowrap",minWidth:110}}>Reason</th>
                                                        <th style={{padding:"12px 16px",textAlign:"left",fontWeight:600,color:"#666",whiteSpace:"nowrap",minWidth:140}}>Channel</th>
                                                        <th style={{padding:"12px 16px",textAlign:"left",fontWeight:600,color:"#666",whiteSpace:"nowrap",minWidth:300}}>Description</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {lines.map((line, idx)=>(
                                                        <tr key={idx} style={{borderBottom:"1px solid #e8e8e8",background:idx%2===0?"#fff":"#fafafa"}}>
                                                            <td style={{padding:"12px 16px",color:"#666",fontWeight:600,textAlign:"center"}}>{line.index || idx+1}</td>
                                                            <td style={{padding:"12px 16px",fontFamily:"monospace",fontSize:12,color:"#444",whiteSpace:"nowrap"}}>
                                                                {line.historyDate ? new Date(line.historyDate).toLocaleString('en-US', {
                                                                    year: 'numeric', month: '2-digit', day: '2-digit',
                                                                    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
                                                                }) : "—"}
                                                            </td>
                                                            <td style={{padding:"12px 16px",whiteSpace:"nowrap"}}>
                                                                {line.entity ? <span className="txn-status-badge" style={{fontSize:11,padding:"4px 10px",whiteSpace:"nowrap"}}>{line.entity}</span> : "—"}
                                                            </td>
                                                            <td style={{padding:"12px 16px",whiteSpace:"nowrap"}}>
                                                                {line.action ? (
                                                                    <span className={`txn-status-badge ${
                                                                        line.action==="Distributed"||line.action==="Processed"||line.action==="Deliver" ? "badge-ok" :
                                                                        line.action==="Rejected"||line.action==="Failed" ? "badge-bypass" : "badge-pending"
                                                                    }`} style={{fontSize:11,padding:"4px 10px",whiteSpace:"nowrap"}}>
                                                                        {line.action}
                                                                    </span>
                                                                ) : "—"}
                                                            </td>
                                                            <td style={{padding:"12px 16px",color:"#555",whiteSpace:"nowrap"}}>{line.phase || "—"}</td>
                                                            <td style={{padding:"12px 16px",color:"#555",whiteSpace:"nowrap"}}>
                                                                {line.reason ? (
                                                                    <span style={{
                                                                        padding:"4px 10px", borderRadius:4, fontSize:11, fontWeight:600, whiteSpace:"nowrap",
                                                                        background: line.reason==="OK"||line.reason==="VALIDATION" ? "#e8f5e9" : line.reason==="NOK"||line.reason==="TIMEOUT"||line.reason==="DUPLICATE" ? "#ffebee" : "#f5f5f5",
                                                                        color: line.reason==="OK"||line.reason==="VALIDATION" ? "#2e7d32" : line.reason==="NOK"||line.reason==="TIMEOUT"||line.reason==="DUPLICATE" ? "#c62828" : "#666"
                                                                    }}>
                                                                        {line.reason}
                                                                    </span>
                                                                ) : "—"}
                                                            </td>
                                                            <td style={{padding:"12px 16px",fontFamily:"monospace",fontSize:12,color:"#555",whiteSpace:"nowrap"}}>{line.channel || "—"}</td>
                                                            <td style={{padding:"12px 16px",color:"#444",lineHeight:1.6,minWidth:300}}>{line.description || "—"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                })()}
                            </div>}
                            {modalTab==="details"&&<div className="txn-section-wrap"><div className="txn-fields-grid">{COLUMNS.map(col=>(<div className="txn-field" key={col.key}><span className="txn-field-label">{col.label}</span><span className="txn-field-value">{col.key==="format"?getDisplayFormat(modalMsg):col.key==="type"?getDisplayType(modalMsg):(modalMsg[col.key]!=null?String(modalMsg[col.key]):"—")}</span></div>))}</div></div>}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Search;