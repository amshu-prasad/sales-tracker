import { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";
import { MetricCard, Badge, Bar, Empty, Spinner } from "../components/UI";
import EntryForm from "../components/EntryForm";
import { CSVLink } from "react-csv";

// const AMS_PEER = ["Shalini", "Shubha", "Shataveeresh", "Sathvik", "Sweatha", "Subhashini", "Jaibheema", "xxx", "yyy", "zzz"];

function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }); }
  catch { return d; }
}
function getWeek(ds) {
  try { const d = new Date(ds); return "W" + Math.min(4, Math.floor((d.getDate() - 1) / 7) + 1); } catch { return "W1"; }
}
function getMonth(ds) {
  try { const d = new Date(ds); return d.toLocaleString("en-GB", { month: "short", year: "2-digit" }).replace(" ", "'"); } catch { return ""; }
}

export default function AMDashboard({ user, onToast }) {
  const [tab, setTab] = useState("log");
  const [entries, setEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [months, setMonths] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeForm, setActiveForm] = useState(null);
  const [teamMonth, setTeamMonth] = useState("ALL");
  const [teamWeek, setTeamWeek] = useState("ALL");
  const [meta, setMeta] = useState({ clients: [], verticals: [], ams: [] });

  // fetch meta once
  useEffect(() => {
    api.meta().then(m => setMeta(m)).catch(() => { });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [e, m, all] = await Promise.all([api.getEntries(), api.months(), api.getEntries()]);
      setEntries(e);
      setMonths(m);
      setAllEntries(all);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const thisWeek = getWeek(new Date().toISOString().slice(0, 10));
  const thisMonth = getMonth(new Date().toISOString().slice(0, 10));
  const weekEntries = entries.filter(r => r.week === thisWeek && r.month === thisMonth);

  const handleSave = (entry) => {
    setEntries(prev => [entry, ...prev]);
    setActiveForm(null);
    onToast("Entry saved ✓");
  };

  return (
    <div className="page">
      <div className="tab-bar">
        {[["log", "Log Entry"], ["records", "My Records"], ["rollup", "Week → Year"], ["team", "Team View"]].map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => { setTab(id); if (id !== "log") load(); }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── LOG ENTRY ── */}
      {tab === "log" && (
        <>
          {!activeForm && (
            <div className="log-cards">
              {[
                { type: "selection", color: "#1d4ed8", bg: "#eff6ff", border: "#bfdbfe", title: "Selection", sub: "Engineer selected by client" },
                { type: "onboarding", color: "#065f46", bg: "#f0fdf4", border: "#a7f3d0", title: "Onboarding", sub: "Engineer joined client" },
                { type: "offboarding", color: "#991b1b", bg: "#fff5f5", border: "#fecaca", title: "Offboarding", sub: "Engineer exited client" },
              ].map(({ type, color, bg, border, title, sub }) => (
                <div key={type} className="log-card" style={{ background: bg, borderColor: border }} onClick={() => setActiveForm(type)}>
                  <p className="log-card-pre">Log a</p>
                  <p className="log-card-title" style={{ color }}>{title}</p>
                  <p className="log-card-sub">{sub}</p>
                </div>
              ))}
            </div>
          )}

          {activeForm && (
            <EntryForm type={activeForm} onSave={handleSave} onCancel={() => setActiveForm(null)} />
          )}

          <p className="section-title">This week's entries</p>
          {loading && <Spinner />}
          {!loading && !weekEntries.length && <Empty text="No entries this week yet. Use the buttons above to log." />}
          <div className="entry-list">
            {weekEntries.map(r => (
              <div key={r.id} className="entry-row">
                <Badge type={r.type} />
                <span className="entry-client">{r.client}</span>
                <span className="entry-vert">{r.vertical}</span>
                <Badge type={r.source} />
                <span className="entry-date">{fmt(r.date)}</span>
              </div>
            ))}
          </div>
          <div className="metric-grid" style={{ marginTop: 16 }}>
            <MetricCard label="This week selections" value={weekEntries.filter(r => r.type === "selection").length} color="blue" />
            <MetricCard label="This week onboardings" value={weekEntries.filter(r => r.type === "onboarding").length} color="green" />
            <MetricCard label="This week offboardings" value={weekEntries.filter(r => r.type === "offboarding").length} color="red" />
          </div>
        </>
      )}

      {/* ── MY RECORDS ── */}
      {tab === "records" && (
        <MyRecordsSection
          entries={entries}
          setEntries={setEntries}
          meta={meta}
          loading={loading}
          onToast={onToast}
        />
      )}

      {/* ── ROLLUP ── */}
      {tab === "rollup" && (
        <>
          {loading && <Spinner />}
          <RollupTable entries={entries} />
        </>
      )}

      {/* ── TEAM VIEW ── */}
      {tab === "team" && (
        <>
          <div className="peer-notice">
            <span className="badge badge-sel" style={{ background: "#f1f0fe", color: "#5b4fcf" }}>Peer View</span>
            &nbsp;Only counts, clients and weeks visible. Details are private.
          </div>
          <div className="filter-bar">
            <div className="filter-group">
              <label>Month</label>
              <select value={teamMonth} onChange={e => setTeamMonth(e.target.value)}>
                <option value="ALL">All months</option>
                {months.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div className="filter-group">
              <label>Week</label>
              <select value={teamWeek} onChange={e => setTeamWeek(e.target.value)}>
                {["ALL", "W1", "W2", "W3", "W4"].map(w => (
                  <option key={w} value={w}>{w === "ALL" ? "All weeks" : w}</option>
                ))}
              </select>
            </div>
          </div>
          {/* {AMS_PEER.filter(am => am !== user.username).map(am => {
            const d = allEntries.filter(r => r.am === am && (teamMonth === "ALL" || r.month === teamMonth) && (teamWeek === "ALL" || r.week === teamWeek));
            if (!d.length) return null;
            const sel = d.filter(r => r.type === "selection"), ob = d.filter(r => r.type === "onboarding"), off = d.filter(r => r.type === "offboarding");
            const clients = [...new Set(d.map(r => r.client))];
            const weeks = [...new Set(d.map(r => r.week))].sort();
            return (
              <div key={am} className="team-card">
                <div className="team-card-header">
                  <span className="team-name">{am}</span>
                  <div style={{ display: "flex", gap: 5 }}>
                    <Badge type="selection" /><span className="badge-count">{sel.length}</span>
                    <Badge type="onboarding" /><span className="badge-count">{ob.length}</span>
                    <Badge type="offboarding" /><span className="badge-count">{off.length}</span>
                  </div>
                </div>
                {clients.length > 0 && <p className="team-meta">Clients: {clients.join(", ")}</p>}
                {weeks.length > 0 && <p className="team-meta">Weeks: {weeks.join(", ")}</p>}
              </div>
            );
          })}
           */}
          {(meta.ams || [])
            .filter(am => am !== user.username)
            .map(am => {
              const d = allEntries.filter(
                r =>
                  r.am === am &&
                  (teamMonth === "ALL" || r.month === teamMonth) &&
                  (teamWeek === "ALL" || r.week === teamWeek)
              );

              if (!d.length) return null;

              const sel = d.filter(r => r.type === "selection");
              const ob = d.filter(r => r.type === "onboarding");
              const off = d.filter(r => r.type === "offboarding");

              const clients = [...new Set(d.map(r => r.client))];
              const weeks = [...new Set(d.map(r => r.week))].sort();

              return (
                <div key={am} className="team-card">
                  <div className="team-card-header">
                    <span className="team-name">{am}</span>

                    <div className="flex gap-2 items-center">
                      <Badge type="selection" />
                      <span className="badge-count">{sel.length}</span>

                      <Badge type="onboarding" />
                      <span className="badge-count">{ob.length}</span>

                      <Badge type="offboarding" />
                      <span className="badge-count">{off.length}</span>
                    </div>
                  </div>

                  {clients.length > 0 && (
                    <p className="team-meta">Clients: {clients.join(", ")}</p>
                  )}

                  {weeks.length > 0 && (
                    <p className="team-meta">Weeks: {weeks.join(", ")}</p>
                  )}
                </div>
              );
            })}
        </>
      )}
    </div>
  );
}

/* ── MY RECORDS SECTION ── */
function MyRecordsSection({ entries: initialEntries, setEntries: setParentEntries, meta, loading, onToast }) {
  const [entries, setEntries] = useState(initialEntries);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { setEntries(initialEntries); }, [initialEntries]);

  const sync = (updated) => {
    setEntries(updated);
    setParentEntries(updated); // keep parent in sync for log tab counts
  };

  // ✅ CSV DATA
  const csvData = entries.map((r) => ({
    Date: fmt(r.date),
    Type: r.type,
    Client: r.client,
    Vertical: r.vertical,
    Source: r.source,
    "Emp Type": r.empType || "",
    Candidate: r.candidateName || "",
    Remarks: r.remarks || "",
  }));

  // ✅ HEADERS
  const headers = [
    { label: "Date", key: "Date" },
    { label: "Type", key: "Type" },
    { label: "Client", key: "Client" },
    { label: "Vertical", key: "Vertical" },
    { label: "Source", key: "Source" },
    { label: "Emp Type", key: "Emp Type" },
    { label: "Candidate", key: "Candidate" },
    { label: "Remarks", key: "Remarks" },
  ];

  const startEdit = (r) => {
    setEditingId(r.id);
    setEditData({
      date: r.date ?? "",
      client: r.client ?? "",
      vertical: r.vertical ?? "",
      source: r.source ?? "",
      empType: r.empType ?? "",
      candidateName: r.candidateName ?? "",
      remarks: r.remarks ?? "",
    });
  };

  const cancelEdit = () => { setEditingId(null); setEditData({}); };

  const saveEdit = async (id) => {
    try {
      const updated = await api.updateEntry(id, editData);
      sync(entries.map(r => r.id === id ? { ...r, ...updated } : r));
      setEditingId(null);
      onToast("Entry updated ✓");
    } catch { alert("Failed to save."); }
  };

  const confirmDelete = (id) => setDeletingId(id);
  const cancelDelete = () => setDeletingId(null);

  const doDelete = async (id) => {
    try {
      await api.deleteEntry(id);
      sync(entries.filter(r => r.id !== id));
      setDeletingId(null);
      onToast("Entry deleted ✓");
    } catch { alert("Failed to delete."); }
  };

  const field = (key, opts) => opts
    ? <select
      value={editData[key] ?? ""}
      onChange={e => setEditData(p => ({ ...p, [key]: e.target.value }))}
      className="edit-select"
    >
      {opts.map(o => <option key={o}>{o}</option>)}
    </select>
    : <input
      value={editData[key] ?? ""}
      onChange={e => setEditData(p => ({ ...p, [key]: e.target.value }))}
      className="edit-input"
    />;

  return (
    <div style={{ position: "relative", paddingTop: 40 }}>
      <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
        <CSVLink
          data={csvData}
          headers={headers}
          filename={`entries_${new Date().toISOString().split("T")[0]}.csv`}
          className="no-underline"
        >
          <button
  disabled={!csvData.length}
  className="btn-export"
>
  ⬇️ Export CSV
</button>
          {/* <button
            disabled={!csvData.length}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
  border transition-all duration-200
  ${csvData.length
                ? "border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700"
                : "border-gray-300 text-gray-400 cursor-not-allowed"
              }`}
          >
            ⬇️ Export CSV
          </button> */}
        </CSVLink>
      </div>

      {/* Delete confirmation modal */}
      {deletingId && (
        <div className="modal-overlay">
          <div className="modal">
            <p style={{ fontWeight: 600, marginBottom: 8 }}>Delete this entry?</p>
            <p className="muted" style={{ marginBottom: 16 }}>This action cannot be undone.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="btn-ghost" onClick={cancelDelete}>Cancel</button>
              <button className="btn-danger" onClick={() => doDelete(deletingId)}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* {loading && <Spinner />} */}

      <div className="metric-grid">
        <MetricCard label="Total selections" value={entries.filter(r => r.type === "selection").length} color="blue" />
        <MetricCard label="Total onboardings" value={entries.filter(r => r.type === "onboarding").length} color="green" />
        <MetricCard label="Bench selections" value={entries.filter(r => r.type === "selection" && r.source === "Bench").length} color="neutral" />
        <MetricCard label="Partner selections" value={entries.filter(r => r.type === "selection" && r.source === "Partner").length} color="amber" />
      </div>

      {["selection", "onboarding", "offboarding"].map(type => (
        <div key={type}>
          <p className="section-title" style={{ marginTop: 14 }}>
            {type.charAt(0).toUpperCase() + type.slice(1)}s
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th style={{ minWidth: 90 }}>Date</th>
                  <th style={{ minWidth: 130 }}>Client</th>
                  <th style={{ minWidth: 110 }}>Vertical</th>
                  <th style={{ minWidth: 110 }}>Source</th>
                  <th style={{ minWidth: 90 }}>Emp Type</th>
                  <th style={{ minWidth: 130 }}>Candidate</th>
                  <th style={{ minWidth: 130 }}>Remarks</th>
                  <th style={{ minWidth: 80 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.filter(r => r.type === type).length === 0
                  ? <tr><td colSpan="8" className="empty-cell">No entries yet</td></tr>
                  : entries.filter(r => r.type === type).map(r => (
                    <tr key={r.id} style={{ background: editingId === r.id ? "#f8faff" : undefined }}>
                      {editingId === r.id ? (
                        <>
                          <td>{field("date")}</td>
                          <td>{field("client", meta.clients)}</td>
                          <td>{field("vertical", meta.verticals)}</td>
                          <td>{field("source", ["Bench", "Partner"])}</td>
                          <td>{field("empType", ["T&M", "ODC"])}</td>
                          <td>{field("candidateName")}</td>
                          <td>{field("remarks")}</td>
                          <td>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button className="btn-save" onClick={() => saveEdit(r.id)}>✓</button>
                              <button className="btn-ghost" onClick={cancelEdit}>✕</button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{fmt(r.date)}</td>
                          <td><strong>{r.client}</strong></td>
                          <td>{r.vertical}</td>
                          <td><Badge type={r.source} /></td>
                          <td>{r.empType || "—"}</td>
                          <td>{r.candidateName || "—"}</td>
                          <td className="muted">{r.remarks || "—"}</td>
                          <td>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button className="btn-edit" onClick={() => startEdit(r)}>✏️</button>
                              <button className="btn-danger" onClick={() => confirmDelete(r.id)}>🗑️</button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                }
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── ROLLUP TABLE ── */
function RollupTable({ entries }) {
  const MONTHS_ORDER = ["Jan'25", "Feb'25", "Mar'25", "Apr'25", "May'25", "Jun'25", "Jul'25", "Aug'25", "Sep'25", "Oct'25", "Nov'25", "Dec'25", "Jan'26", "Feb'26", "Mar'26", "Apr'26", "May'26", "Jun'26", "Jul'26", "Aug'26", "Sep'26", "Oct'26", "Nov'26", "Dec'26"];
  const months = [...new Set(entries.map(r => r.month))].filter(Boolean).sort((a, b) => MONTHS_ORDER.indexOf(a) - MONTHS_ORDER.indexOf(b));
  if (!months.length) return <Empty />;

  const count = (m, w, t) => entries.filter(r => r.month === m && r.week === w && r.type === t).length;
  let cumSel = 0, cumOb = 0, cumOff = 0;

  return (
    <div className="rollup-wrap">
      <p className="section-title">Week → Month Breakdown</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              {["W1", "W2", "W3", "W4"].map(w => (
                <>
                  <th key={w + "s"} style={{ color: "#1f6fbf" }}>{w} Sel</th>
                  <th key={w + "o"} style={{ color: "#1a7a4a" }}>{w} Ob</th>
                  <th key={w + "f"} style={{ color: "#b91c1c" }}>{w} Off</th>
                </>
              ))}
              <th style={{ color: "#1f6fbf" }}>Mo Sel</th>
              <th style={{ color: "#1a7a4a" }}>Mo Ob</th>
              <th style={{ color: "#b91c1c" }}>Mo Off</th>
              <th>Net</th>
            </tr>
          </thead>
          <tbody>
            {months.map(m => {
              const [ms, mo, mf] = ["selection", "onboarding", "offboarding"].map(t => entries.filter(r => r.month === m && r.type === t).length);
              const net = mo - mf;
              cumSel += ms; cumOb += mo; cumOff += mf;
              return (
                <tr key={m}>
                  <td><strong>{m}</strong></td>
                  {[1, 2, 3, 4].map(w => (
                    <>
                      <td key={w + "s"} style={{ color: "#1f6fbf" }}>{count(m, "W" + w, "selection") || "—"}</td>
                      <td key={w + "o"} style={{ color: "#1a7a4a" }}>{count(m, "W" + w, "onboarding") || "—"}</td>
                      <td key={w + "f"} style={{ color: "#b91c1c" }}>{count(m, "W" + w, "offboarding") || "—"}</td>
                    </>
                  ))}
                  <td style={{ fontWeight: 700, color: "#1f6fbf" }}>{ms}</td>
                  <td style={{ fontWeight: 700, color: "#1a7a4a" }}>{mo}</td>
                  <td style={{ fontWeight: 700, color: "#b91c1c" }}>{mf}</td>
                  <td style={{ fontWeight: 700, color: net >= 0 ? "#1a7a4a" : "#b91c1c" }}>{net > 0 ? "+" : ""}{net}</td>
                </tr>
              );
            })}
            <tr className="row-total">
              <td>Cumulative</td>
              {[1, 2, 3, 4].map(w => <><td key={w + "s"} /><td key={w + "o"} /><td key={w + "f"} /></>)}
              <td style={{ color: "#1f6fbf" }}>{cumSel}</td>
              <td style={{ color: "#1a7a4a" }}>{cumOb}</td>
              <td style={{ color: "#b91c1c" }}>{cumOff}</td>
              <td style={{ color: cumOb - cumOff >= 0 ? "#1a7a4a" : "#b91c1c" }}>{cumOb - cumOff > 0 ? "+" : ""}{cumOb - cumOff}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
