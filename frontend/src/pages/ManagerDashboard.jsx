import { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";
import { MetricCard, Bar, Badge, Empty, Spinner, FilterBar } from "../components/UI";
import { Chart } from "react-google-charts";

function DynamicChart({ type, data }) {
  return (
    <Chart
      chartType={type}
      width="100%"
      height="250px"
      data={data}
      options={{
        legend: { position: "top" },
        chartArea: { width: "80%", height: "70%" },
        pieHole: type === "PieChart" ? 0.4 : undefined,
      }}
    />
  );
}

function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }); }
  catch { return d; }
}

export default function ManagerDashboard({ onToast }) {
  const [tab, setTab] = useState("summary");
  const [month, setMonth] = useState("ALL");
  const [week, setWeek] = useState("ALL");
  const [months, setMonths] = useState([]);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [meta, setMeta] = useState({ clients: [], verticals: [], ams: [] });
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [selChart, setSelChart] = useState("ColumnChart");
  const [obChart, setObChart] = useState("ColumnChart");
  const [vertChart, setVertChart] = useState("ColumnChart");

  // fetch meta once on mount
  useEffect(() => {
    api.meta().then(m => setMeta(m)).catch(() => { });
  }, []);

  const load = useCallback(async (showToast = false) => {
    setLoading(true);
    try {
      let params = {};

      if (fromDate && toDate) {
        params = { from_date: fromDate, to_date: toDate };
      } else {
        params = { month, week };
      }

      const [e, m] = await Promise.all([
        api.getEntries(params),
        api.months()
      ]);

      setEntries(e);
      setMonths(m);

      if (showToast) onToast("Data refreshed ✓");
    } catch (err) {
      console.error("LOAD ERROR:", err);   // ✅ add this
      if (showToast) onToast("Error loading data");
    }
    setLoading(false);
  }, [month, week, fromDate, toDate]);

  // const load = useCallback(async (showToast = false) => {
  //   setLoading(true);
  //   try {
  //     const [e, m] = await Promise.all([api.getEntries({ month, week }), api.months()]);
  //     setEntries(e);
  //     setMonths(m);
  //     if (showToast) onToast("Data refreshed ✓");
  //   } catch { if (showToast) onToast("Error loading data"); }
  //   setLoading(false);
  // }, [month, week]);

  useEffect(() => { load(); }, [load]);

  const sel = entries.filter(r => r.type === "selection");
  const ob = entries.filter(r => r.type === "onboarding");
  const off = entries.filter(r => r.type === "offboarding");
  const net = ob.length - off.length;

  const MONTHS_ORDER = ["Jan'25", "Feb'25", "Mar'25", "Apr'25", "May'25", "Jun'25", "Jul'25", "Aug'25", "Sep'25", "Oct'25", "Nov'25", "Dec'25", "Jan'26", "Feb'26", "Mar'26", "Apr'26", "May'26", "Jun'26", "Jul'26", "Aug'26", "Sep'26", "Oct'26", "Nov'26", "Dec'26"];

  return (
    <div className="page">
      <div className="tab-bar">
        {[["summary", "Summary"], ["by-am", "By AM"], ["by-client", "By Client"], ["by-vert", "By Vertical"], ["rollup", "Week → Year"], ["my-records", "All Records"]].map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* <FilterBar month={month} week={week} months={months} onMonth={setMonth} onWeek={setWeek} onRefresh={() => load(true)} loading={loading} /> */}
      <FilterBar
        month={month}
        week={week}
        months={months}
        onMonth={setMonth}
        onWeek={setWeek}
        onRefresh={() => load(true)}
        loading={loading}
        fromDate={fromDate}
        toDate={toDate}
        onFromDateChange={setFromDate}
        onToDateChange={setToDate}
      />
      {loading && <div style={{ marginBottom: 12 }}><Spinner /></div>}

      {/* ── SUMMARY ── */}
      {tab === "summary" && (
        <>
          {/* Metrics */}
          <div className="metric-grid">
            <MetricCard label="Selections" value={sel.length} color="blue" />
            <MetricCard label="Onboardings" value={ob.length} color="green" />
            <MetricCard label="Offboardings" value={off.length} color="red" />
            <MetricCard
              label="Net Active"
              value={(net > 0 ? "+" : "") + net}
              color="purple"
            />
          </div>

          <div className="grid-2">

            {/* Selections */}
            <div className="card">
              <div className="flex justify-between items-center mb-2">
                <h3>Selections — By Source</h3>

                <select value={selChart} onChange={(e) => setSelChart(e.target.value)}>
                  <option value="ColumnChart">Bar</option>
                  <option value="LineChart">Line</option>
                  <option value="PieChart">Pie</option>
                </select>
              </div>

              <DynamicChart
                type={selChart}
                data={[
                  ["Source", "Count"],
                  ["Bench", sel.filter(r => r.source === "Bench").length],
                  ["Partner", sel.filter(r => r.source === "Partner").length],
                ]}
              />
            </div>

            {/* Onboardings */}
            <div className="card">
              <div className="flex justify-between items-center mb-2">
                <h3>Onboardings — By Source</h3>

                <select value={obChart} onChange={(e) => setObChart(e.target.value)}>
                  <option value="BarChart">Bar</option>
                  <option value="LineChart">Line</option>
                  <option value="PieChart">Pie</option>
                </select>
              </div>

              <DynamicChart
                type={obChart}
                data={[
                  ["Source", "Count"],
                  ["Bench", ob.filter(r => r.source === "Bench").length],
                  ["Partner", ob.filter(r => r.source === "Partner").length],
                ]}
              />
            </div>
          </div>

          {/* Vertical */}
          <div className="card">
            <div className="flex justify-between items-center mb-2">
              <h3>Selections by Vertical</h3>

              <select value={vertChart} onChange={(e) => setVertChart(e.target.value)}>
                <option value="BarChart">Bar</option>
                <option value="LineChart">Line</option>
                <option value="PieChart">Pie</option>
              </select>
            </div>

            <DynamicChart
              type={vertChart}
              data={[
                ["Vertical", "Selections"],
                ...meta.verticals
                  .map(v => [v, sel.filter(r => r.vertical === v).length])
                  .filter(([, val]) => val > 0),
              ]}
            />
          </div>
        </>
      )}

      {/* ── AM RECORDS ── */}
      {tab === "my-records" && (
        <AMRecordsSection entries={entries} meta={meta} />
      )}

      {/* ── ROLLUP ── */}
      {tab === "rollup" && (
        <RollupSection entries={entries} allMonths={months.sort((a, b) => MONTHS_ORDER.indexOf(a) - MONTHS_ORDER.indexOf(b))} />
      )}

      {/* ── BY AM ── */}
      {tab === "by-am" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Account Manager</th>
                <th style={{ color: "#1f6fbf" }}>Sel</th><th>Sel B</th><th>Sel P</th>
                <th style={{ color: "#1a7a4a" }}>Ob</th><th>Ob B</th><th>Ob P</th>
                <th style={{ color: "#b91c1c" }}>Off</th><th>Off B</th><th>Off P</th>
                <th>Net Active</th>
              </tr>
            </thead>
            <tbody>
              {meta.ams.map(am => {
                const as = sel.filter(r => r.am === am), ao = ob.filter(r => r.am === am), af = off.filter(r => r.am === am);
                const n = ao.length - af.length;
                return (
                  <tr key={am}>
                    <td><strong>{am}</strong></td>
                    <td style={{ color: "#1f6fbf", fontWeight: 600 }}>{as.length}</td>
                    <td>{as.filter(r => r.source === "Bench").length}</td>
                    <td>{as.filter(r => r.source === "Partner").length}</td>
                    <td style={{ color: "#1a7a4a", fontWeight: 600 }}>{ao.length}</td>
                    <td>{ao.filter(r => r.source === "Bench").length}</td>
                    <td>{ao.filter(r => r.source === "Partner").length}</td>
                    <td style={{ color: "#b91c1c", fontWeight: 600 }}>{af.length}</td>
                    <td>{af.filter(r => r.source === "Bench").length}</td>
                    <td>{af.filter(r => r.source === "Partner").length}</td>
                    <td style={{ fontWeight: 700, color: n >= 0 ? "#1a7a4a" : "#b91c1c" }}>{n > 0 ? "+" : ""}{n}</td>
                  </tr>
                );
              })}
              <tr className="row-total">
                <td>Total</td>
                <td>{sel.length}</td>
                <td>{sel.filter(r => r.source === "Bench").length}</td>
                <td>{sel.filter(r => r.source === "Partner").length}</td>
                <td>{ob.length}</td>
                <td>{ob.filter(r => r.source === "Bench").length}</td>
                <td>{ob.filter(r => r.source === "Partner").length}</td>
                <td>{off.length}</td>
                <td>{off.filter(r => r.source === "Bench").length}</td>
                <td>{off.filter(r => r.source === "Partner").length}</td>
                <td style={{ fontWeight: 700, color: net >= 0 ? "#1a7a4a" : "#b91c1c" }}>{net > 0 ? "+" : ""}{net}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* ── BY CLIENT ── */}
      {tab === "by-client" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Client</th>
                <th style={{ color: "#1f6fbf" }}>Sel</th>
                <th style={{ color: "#1a7a4a" }}>Ob</th>
                <th style={{ color: "#b91c1c" }}>Off</th>
                <th>Net</th><th>DV</th><th>PD</th><th>AL/AD</th><th>DFT/RTL</th>
              </tr>
            </thead>
            <tbody>
              {[...new Set(entries.map(r => r.client))].filter(Boolean).sort().map(c => {
                const cs = sel.filter(r => r.client === c), co = ob.filter(r => r.client === c), cf = off.filter(r => r.client === c);
                const n = co.length - cf.length;
                return (
                  <tr key={c}>
                    <td><strong>{c}</strong></td>
                    <td style={{ color: "#1f6fbf", fontWeight: 600 }}>{cs.length}</td>
                    <td style={{ color: "#1a7a4a", fontWeight: 600 }}>{co.length}</td>
                    <td style={{ color: "#b91c1c", fontWeight: 600 }}>{cf.length}</td>
                    <td style={{ fontWeight: 700, color: n >= 0 ? "#1a7a4a" : "#b91c1c" }}>{n > 0 ? "+" : ""}{n}</td>
                    <td>{cs.filter(r => r.vertical === "DV").length}</td>
                    <td>{cs.filter(r => r.vertical === "PD").length}</td>
                    <td>{cs.filter(r => ["AL", "AD"].includes(r.vertical)).length}</td>
                    <td>{cs.filter(r => ["DFT", "RTL"].includes(r.vertical)).length}</td>
                  </tr>
                );
              })}
              {!entries.length && <tr><td colSpan="9" className="empty-cell">No data</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {/* ── BY VERTICAL ── */}
      {tab === "by-vert" && (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Vertical</th>
                <th style={{ color: "#1f6fbf" }}>Sel</th>
                <th style={{ color: "#1a7a4a" }}>Ob</th>
                <th style={{ color: "#b91c1c" }}>Off</th>
                <th>Net</th><th>Bench</th><th>Partner</th>
              </tr>
            </thead>
            <tbody>
              {meta.verticals.map(v => {
                const vs = sel.filter(r => r.vertical === v), vo = ob.filter(r => r.vertical === v), vf = off.filter(r => r.vertical === v);
                if (!vs.length && !vo.length && !vf.length) return null;
                const n = vo.length - vf.length;
                return (
                  <tr key={v}>
                    <td><strong>{v}</strong></td>
                    <td style={{ color: "#1f6fbf", fontWeight: 600 }}>{vs.length}</td>
                    <td style={{ color: "#1a7a4a", fontWeight: 600 }}>{vo.length}</td>
                    <td style={{ color: "#b91c1c", fontWeight: 600 }}>{vf.length}</td>
                    <td style={{ fontWeight: 700, color: n >= 0 ? "#1a7a4a" : "#b91c1c" }}>{n > 0 ? "+" : ""}{n}</td>
                    <td>{vs.filter(r => r.source === "Bench").length}</td>
                    <td>{vs.filter(r => r.source === "Partner").length}</td>
                  </tr>
                );
              })}
              <tr className="row-total">
                <td>Total</td>
                <td>{sel.length}</td><td>{ob.length}</td><td>{off.length}</td>
                <td style={{ fontWeight: 700, color: net >= 0 ? "#1a7a4a" : "#b91c1c" }}>{net > 0 ? "+" : ""}{net}</td>
                <td>{sel.filter(r => r.source === "Bench").length}</td>
                <td>{sel.filter(r => r.source === "Partner").length}</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function RollupSection({ entries, allMonths }) {
  if (!allMonths.length) return <Empty />;
  const count = (m, w, t) => entries.filter(r => r.month === m && r.week === w && r.type === t).length;
  let cs = 0, co = 0, cf = 0;
  return (
    <div className="rollup-wrap">
      <p className="section-title">Week → Month</p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              {[1, 2, 3, 4].map(w => (
                <><th key={w + "s"} style={{ color: "#1f6fbf" }}>W{w} Sel</th>
                  <th key={w + "o"} style={{ color: "#1a7a4a" }}>W{w} Ob</th>
                  <th key={w + "f"} style={{ color: "#b91c1c" }}>W{w} Off</th></>
              ))}
              <th style={{ color: "#1f6fbf", background: "#eef2f8" }}>Mo Sel</th>
              <th style={{ color: "#1a7a4a", background: "#eef2f8" }}>Mo Ob</th>
              <th style={{ color: "#b91c1c", background: "#eef2f8" }}>Mo Off</th>
              <th style={{ background: "#eef2f8" }}>Net</th>
            </tr>
          </thead>
          <tbody>
            {allMonths.map(m => {
              const [ms, mo, mf] = ["selection", "onboarding", "offboarding"].map(t => entries.filter(r => r.month === m && r.type === t).length);
              const net = mo - mf; cs += ms; co += mo; cf += mf;
              return (
                <tr key={m}>
                  <td><strong>{m}</strong></td>
                  {[1, 2, 3, 4].map(w => (
                    <><td key={w + "s"} style={{ color: "#1f6fbf" }}>{count(m, "W" + w, "selection") || "—"}</td>
                      <td key={w + "o"} style={{ color: "#1a7a4a" }}>{count(m, "W" + w, "onboarding") || "—"}</td>
                      <td key={w + "f"} style={{ color: "#b91c1c" }}>{count(m, "W" + w, "offboarding") || "—"}</td></>
                  ))}
                  <td style={{ fontWeight: 700, color: "#1f6fbf", background: "#eef2f8" }}>{ms}</td>
                  <td style={{ fontWeight: 700, color: "#1a7a4a", background: "#eef2f8" }}>{mo}</td>
                  <td style={{ fontWeight: 700, color: "#b91c1c", background: "#eef2f8" }}>{mf}</td>
                  <td style={{ fontWeight: 700, background: "#eef2f8", color: net >= 0 ? "#1a7a4a" : "#b91c1c" }}>{net > 0 ? "+" : ""}{net}</td>
                </tr>
              );
            })}
            <tr className="row-total">
              <td>Total</td>
              {[1, 2, 3, 4].map(w => <><td key={w + "s"} /><td key={w + "o"} /><td key={w + "f"} /></>)}
              <td style={{ color: "#1f6fbf" }}>{cs}</td>
              <td style={{ color: "#1a7a4a" }}>{co}</td>
              <td style={{ color: "#b91c1c" }}>{cf}</td>
              <td style={{ color: co - cf >= 0 ? "#1a7a4a" : "#b91c1c" }}>{co - cf > 0 ? "+" : ""}{co - cf}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AMRecordsSection({ entries: initialEntries, meta }) {
  const [selectedAM, setSelectedAM] = useState("");
  const [entries, setEntries] = useState(initialEntries);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [deletingId, setDeletingId] = useState(null);

  // Set default AM once meta loads
  useEffect(() => {
    if (meta.ams.length && !selectedAM) setSelectedAM(meta.ams[0]);
  }, [meta.ams]);

  useEffect(() => { setEntries(initialEntries); }, [initialEntries]);

  const amEntries = entries.filter(r => r.am === selectedAM);

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
      const payload = {
        date: editData.date,
        client: editData.client,
        vertical: editData.vertical,
        source: editData.source,
        empType: editData.empType,
        candidateName: editData.candidateName,
        remarks: editData.remarks,
      };
      const updated = await api.updateEntry(id, payload);
      setEntries(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r));
      setEditingId(null);
    } catch { alert("Failed to save."); }
  };

  const confirmDelete = (id) => setDeletingId(id);
  const cancelDelete = () => setDeletingId(null);

  const doDelete = async (id) => {
    try {
      await api.deleteEntry(id);
      setEntries(prev => prev.filter(r => r.id !== id));
      setDeletingId(null);
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
    <>
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

      <div className="filter-bar">
        <div className="filter-group">
          <label>Account Manager</label>
          <select value={selectedAM} onChange={e => { setSelectedAM(e.target.value); cancelEdit(); }}>
            {meta.ams.map(am => <option key={am}>{am}</option>)}
          </select>
        </div>
      </div>

      <div className="metric-grid">
        <MetricCard label="Total selections" value={amEntries.filter(r => r.type === "selection").length} color="blue" />
        <MetricCard label="Total onboardings" value={amEntries.filter(r => r.type === "onboarding").length} color="green" />
        <MetricCard label="Bench selections" value={amEntries.filter(r => r.type === "selection" && r.source === "Bench").length} color="neutral" />
        <MetricCard label="Partner selections" value={amEntries.filter(r => r.type === "selection" && r.source === "Partner").length} color="amber" />
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
                  <th>Date</th><th>Client</th><th>Vertical</th>
                  <th>Source</th><th>Emp Type</th><th>Candidate</th><th>Remarks</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {amEntries.filter(r => r.type === type).length === 0
                  ? <tr><td colSpan="8" className="empty-cell">No entries</td></tr>
                  : amEntries.filter(r => r.type === type).map(r => (
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
    </>
  );
}