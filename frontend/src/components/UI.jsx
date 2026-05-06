// ── Metric Card ──────────────────────────────────────────────
export function MetricCard({ label, value, color = "blue", sub }) {
  return (
    <div className={`metric-card metric-${color}`}>
      <div className="metric-num">{value ?? "—"}</div>
      <div className="metric-label">{label}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────
export function Badge({ type }) {
  const map = {
    selection:   { cls: "badge-sel",  label: "Sel"  },
    onboarding:  { cls: "badge-ob",   label: "Ob"   },
    offboarding: { cls: "badge-off",  label: "Off"  },
    Bench:       { cls: "badge-bench",label: "Bench" },
    Partner:     { cls: "badge-partner",label: "Partner" },
  };
  const { cls = "badge-sel", label = type } = map[type] || {};
  return <span className={`badge ${cls}`}>{label}</span>;
}

// ── Bar ──────────────────────────────────────────────────────
export function Bar({ label, value, max, color = "#1f6fbf" }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="bar-row">
      <span className="bar-label">{label}</span>
      <div className="bar-track">
        <div className="bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="bar-count">{value}</span>
    </div>
  );
}

// ── Toast ────────────────────────────────────────────────────
export function Toast({ message, visible }) {
  return (
    <div className={`toast ${visible ? "toast-show" : ""}`}>{message}</div>
  );
}

// ── Spinner ──────────────────────────────────────────────────
export function Spinner({ size = "md" }) {
  return <span className={`spinner spinner-${size}`} />;
}

// ── Empty ────────────────────────────────────────────────────
export function Empty({ text = "No data for selected period." }) {
  return <p className="empty-msg">{text}</p>;
}

export function FilterBar({ 
  month, 
  week, 
  months, 
  onMonth, 
  onWeek, 
  onRefresh, 
  loading,
  fromDate,
  toDate,
  onFromDateChange,
  onToDateChange
}) {
  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label>Month</label>
        <select value={month} onChange={e => onMonth(e.target.value)}>
          <option value="ALL">All months</option>
          {months.map(m => <option key={m}>{m}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>Week</label>
        <select value={week} onChange={e => onWeek(e.target.value)}>
          {["ALL","W1","W2","W3","W4"].map(w => (
            <option key={w} value={w}>
              {w === "ALL" ? "All weeks" : w}
            </option>
          ))}
        </select>
      </div>

      {/* ✅ FROM DATE */}
      <div className="filter-group">
        <label>From</label>
        <input
          type="date"
          value={fromDate || ""}
          onChange={(e) => onFromDateChange(e.target.value)}
        />
      </div>

      {/* ✅ TO DATE */}
      <div className="filter-group">
        <label>To</label>
        <input
          type="date"
          value={toDate || ""}
          onChange={(e) => onToDateChange(e.target.value)}
        />
      </div>

      {onRefresh && (
        <button className="btn btn-sm" onClick={onRefresh} disabled={loading}>
          {loading ? <span className="spinner-sm" /> : "↻"} Refresh
        </button>
      )}
    </div>
  );
}
