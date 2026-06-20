import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "../utils/api";
import { MetricCard, Bar, Badge, Empty, Spinner, FilterBar } from "../components/UI";
import { Chart } from "react-google-charts";
import { CLIENTS, VERTICALS } from "../constants/StringConstants";
import { ADMIN_DASHBOARD } from "../api/endpoints";
import { fetchData } from "../api/clients";

function DynamicChart({ type, data }) {
  if (!data || data.length <= 1) {
    return (
      <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0", fontSize: 13 }}>
        No data
      </div>
    );
  }
  return (
    <Chart
      chartType="ColumnChart"
      width="100%"
      height="180px"
      data={data}
      options={{
        legend: { position: "none" },
        chartArea: {
          width: "80%",
          height: "70%",
          top: 20,
          bottom: 50,
        },
        hAxis: {
          slantedText: true,
          slantedTextAngle: 35,
          textStyle: {
            fontSize: 12,
          },
        },
        vAxis: {
          minValue: 0,
          textPosition: "none",
        },
        annotations: {
          alwaysOutside: true,
          stem: {
            color: "transparent",
          },
          textStyle: {
            fontSize: 14,
            bold: true,
            color: "#000",
          },
        },
        bar: {
          groupWidth: "15%",
        },
      }}
    />
  );
}

function toChartRows(arr, { sortDesc = true } = {}) {
  const rows = (arr || [])
    .filter(({ count }) => count > 0)
    .map(({ name, count }) => [name, count, count]);
  if (sortDesc) rows.sort((a, b) => b[1] - a[1]);
  return rows;
}

function fmt(d) {
  if (!d) return "—";
  try { return new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" }); }
  catch { return d; }
}

function aggregateAMRows(rows) {
  const sumBy = (key) => rows.reduce((acc, r) => acc + (r[key] || 0), 0);
  return {
    demands: sumBy("demands"),
    positions: sumBy("positions"),
    selections: sumBy("selections"),
    onboardings: sumBy("onboardings"),
    offboardings: sumBy("offboardings"),
    net_adds: sumBy("net_adds"),
    charts: {
      selections_by_source: mergeNameCount(rows, "selections_by_source"),
      onboardings_by_source: mergeNameCount(rows, "onboardings_by_source"),
      selections_by_vertical: mergeNameCount(rows, "selections_by_vertical"),
      onboardings_by_vertical: mergeNameCount(rows, "onboardings_by_vertical"),
    },
  };
}

function normalizeDashboardResponse(raw) {
  const data = raw?.data ?? raw;
  if (Array.isArray(data)) return aggregateAMRows(data);

  return {
    demands: data?.demands || 0,
    positions: data?.positions || 0,
    selections: data?.selections || 0,
    onboardings: data?.onboardings || 0,
    offboardings: data?.offboardings || 0,
    net_adds: data?.net_adds || 0,
    charts: {
      selections_by_source: data?.charts?.selections_by_source || [],
      onboardings_by_source: data?.charts?.onboardings_by_source || [],
      selections_by_vertical: data?.charts?.selections_by_vertical || [],
      onboardings_by_vertical: data?.charts?.onboardings_by_vertical || [],
    },
  };
}

function mergeNameCount(list, chartKey) {
  const map = {};
  list.forEach(r => {
    (r.charts?.[chartKey] || []).forEach(({ name, count }) => {
      map[name] = (map[name] || 0) + (count || 0);
    });
  });
  return Object.entries(map).map(([name, count]) => ({ name, count }));
}

function getCount(arr, name) {
  return arr.find(item => item.name === name)?.count || 0;
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

  const [amData, setAmData] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const [dashboardData, setDashboardData] = useState({
    demands: 0,
    positions: 0,
    selections: 0,
    onboardings: 0,
    offboardings: 0,
    net_adds: 0,
    charts: {
      selections_by_source: [],
      onboardings_by_source: [],
      selections_by_vertical: [],
      onboardings_by_vertical: [],
    },
  });

  // ── Summary tab filter sidebar state ──
  const [summaryFilters, setSummaryFilters] = useState({
    client: "",
    vertical: "",
    am: "",
    source: "",
    from: "",
    to: "",
  });

  const handleSummaryFilterChange = (key, value) => {
    setSummaryFilters((prev) => ({ ...prev, [key]: value }));
  };
  const handleSummarySearch = async () => {
    try {
      setSummaryLoading(true);

      const params = new URLSearchParams();
      if (summaryFilters.client) params.append("client", summaryFilters.client);
      if (summaryFilters.vertical) params.append("vertical", summaryFilters.vertical);
      if (summaryFilters.am) params.append("am", summaryFilters.am);
      if (summaryFilters.source) params.append("source", summaryFilters.source);
      if (summaryFilters.from) params.append("from_date", summaryFilters.from);
      if (summaryFilters.to) params.append("to_date", summaryFilters.to);

      const url = `${ADMIN_DASHBOARD}?${params.toString()}`;
      const res = await fetchData(url);

      setDashboardData(normalizeDashboardResponse(res));
      onToast?.("Data refreshed ✓");
    } catch (error) {
      console.error("Dashboard search error:", error);
      onToast?.("Error loading data");
    } finally {
      setSummaryLoading(false);
    }
  };

  const resetSummaryFilters = () => {
    setSummaryFilters({ client: "", vertical: "", am: "", source: "", from: "", to: "" });
    fetchDashboardData();
  };

  // useEffect(() => {
  //   api.meta().then(m => setMeta(m)).catch(() => { });
  // }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetchData(ADMIN_DASHBOARD);
      const rows = Array.isArray(res?.data) ? res.data : [];
      setAmData(rows);
      setDashboardData(aggregateAMRows(rows));
    } catch (error) {
      console.error("Dashboard API Error:", error);
      setAmData([]);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const amOptions = useMemo(
    () => Array.from(new Set(amData.map(r => r.AM))).filter(Boolean).sort(),
    [amData]
  );

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
      console.error("LOAD ERROR:", err);
      if (showToast) onToast("Error loading data");
    }
    setLoading(false);
  }, [month, week, fromDate, toDate]);

  useEffect(() => { load(); }, [load]);

  const sel = entries.filter(r => r.type === "selection");
  const ob = entries.filter(r => r.type === "onboarding");
  const off = entries.filter(r => r.type === "offboarding");
  const net = ob.length - off.length;

  const MONTHS_ORDER = ["Jan'25", "Feb'25", "Mar'25", "Apr'25", "May'25", "Jun'25", "Jul'25", "Aug'25", "Sep'25", "Oct'25", "Nov'25", "Dec'25", "Jan'26", "Feb'26", "Mar'26", "Apr'26", "May'26", "Jun'26", "Jul'26", "Aug'26", "Sep'26", "Oct'26", "Nov'26", "Dec'26"];

  return (
    <div className="page">
      <div className="tab-bar">
        {[["summary", "Summary"], ["my-records", "All Records"]].map(([id, label]) => (
          <button key={id} className={`tab ${tab === id ? "active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </div>

      {/* ── SUMMARY ── */}
      {tab === "summary" && (
        <div className="filters-page">
          <div className="filters-sidebar">
            <h3>Filters</h3>

            <div className="filter-group">
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#64748B",
                  display: "block",
                  marginBottom: "-1px",
                  letterSpacing: "0.5px",
                }}
              >
                CLIENT
              </label>
              <select
                className="chart-select"
                value={summaryFilters.client}
                onChange={(e) => handleSummaryFilterChange("client", e.target.value)}
              >
                <option value="">Select Client</option>
                {CLIENTS.map((client) => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#64748B",
                  display: "block",
                  marginBottom: "-1px",
                  letterSpacing: "0.5px",
                }}
              >
                VERTICAL
              </label>
              <select
                className="chart-select"
                value={summaryFilters.vertical}
                onChange={(e) => handleSummaryFilterChange("vertical", e.target.value)}
              >
                <option value="">Select Vertical</option>
                {VERTICALS.map((vertical) => (
                  <option key={vertical} value={vertical}>{vertical}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#64748B",
                  display: "block",
                  marginBottom: "-1px",
                  letterSpacing: "0.5px",
                }}
              >
                ACCOUNT MANAGER
              </label>
              <select
                className="chart-select"
                value={summaryFilters.am}
                onChange={(e) => handleSummaryFilterChange("am", e.target.value)}
              >
                <option value="">Select AM</option>
                {amOptions.map((am) => (
                  <option key={am} value={am}>{am}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#64748B",
                  display: "block",
                  marginBottom: "-1px",
                  letterSpacing: "0.5px",
                }}
              >
                SOURCE
              </label>
              <select
                className="chart-select"
                value={summaryFilters.source}
                onChange={(e) => handleSummaryFilterChange("source", e.target.value)}
              >
                <option value="">Select Source</option>
                <option value="Bench">Bench</option>
                <option value="Partner">Partner</option>
              </select>
            </div>

            <div className="filter-group">
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#64748B",
                  display: "block",
                  marginBottom: "-1px",
                  letterSpacing: "0.5px",
                }}
              >
                FROM DATE
              </label>
              <input
                type="date"
                className="chart-select"
                value={summaryFilters.from}
                onChange={(e) => handleSummaryFilterChange("from", e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label
                style={{
                  fontSize: "11px",
                  fontWeight: "600",
                  color: "#64748B",
                  display: "block",
                  marginBottom: "-1px",
                  letterSpacing: "0.5px",
                }}
              >
                TO DATE
              </label>
              <input
                type="date"
                className="chart-select"
                value={summaryFilters.to}
                onChange={(e) => handleSummaryFilterChange("to", e.target.value)}
              />
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "12px",
              }}
            >
              <button
                className="search-btn"
                style={{
                  flex: 1,
                  height: "42px",
                  border: "none",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #6366F1, #4F46E5)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.25)",
                }}
                onClick={handleSummarySearch}
              >
                {summaryLoading ? "Searching…" : "Search"}
              </button>

              <button
                className="search-btn"
                style={{
                  flex: 1,
                  height: "42px",
                  border: "none",
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #f00d0d, #f00d0d)",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(99,102,241,0.25)",
                }}
                onClick={resetSummaryFilters}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Right Graph Section */}
          <div className="filters-content">
            <div className="headcount-summary">
              <div className="summary-item" style={{ backgroundColor: "#EEF2FF" }}>
                <div className="summary-title">#DEMANDS</div>
                <div className="summary-value">{dashboardData.demands}</div>
                <div className="summary-bar" style={{ backgroundColor: "#6366F1" }}></div>
              </div>

              <div className="summary-item" style={{ backgroundColor: "#ECFDF5" }}>
                <div className="summary-title">#POSITIONS</div>
                <div className="summary-value">{dashboardData.positions}</div>
                <div className="summary-bar" style={{ backgroundColor: "#10B981" }}></div>
              </div>

              <div className="summary-item" style={{ backgroundColor: "#FFF7ED" }}>
                <div className="summary-title">#SELECTIONS</div>
                <div className="summary-value">{dashboardData.selections}</div>
                <div className="summary-bar" style={{ backgroundColor: "#F97316" }}></div>
              </div>

              <div className="summary-item" style={{ backgroundColor: "#EFF6FF" }}>
                <div className="summary-title">#ONBOARDED</div>
                <div className="summary-value">{dashboardData.onboardings}</div>
                <div className="summary-bar" style={{ backgroundColor: "#3B82F6" }}></div>
              </div>

              <div className="summary-item" style={{ backgroundColor: "#FEF2F2" }}>
                <div className="summary-title">#OFFBOARDED</div>
                <div className="summary-value">{dashboardData.offboardings}</div>
                <div className="summary-bar" style={{ backgroundColor: "#EF4444" }}></div>
              </div>

              <div className="summary-item" style={{ backgroundColor: "#F5F3FF" }}>
                <div className="summary-title">#NET ADDS</div>
                <div className="summary-value">{(dashboardData.net_adds > 0 ? "+" : "") + dashboardData.net_adds}</div>
                <div className="summary-bar" style={{ backgroundColor: "#8B5CF6" }}></div>
              </div>
            </div>

            <div className="individual-dashboard-grid">
              <div className="individual-chart-card">
                <div className="chart-header">
                  <h3>Selections — By Source</h3>
                </div>
                <div className="chart-wrapper">
                  <DynamicChart
                    type={selChart}
                    data={[
                      ["Source", "Count", { role: "annotation" }],
                      ...toChartRows(dashboardData.charts.selections_by_source),
                    ]}
                  />
                </div>
              </div>

              <div className="individual-chart-card">
                <div className="chart-header">
                  <h3>Onboardings — By Source</h3>
                </div>
                <div className="chart-wrapper">
                  <DynamicChart
                    type={obChart}
                    data={[
                      ["Source", "Count", { role: "annotation" }],
                      ...toChartRows(dashboardData.charts.onboardings_by_source),
                    ]}
                  />
                </div>
              </div>

              {/* Selections by Vertical */}
              <div className="individual-chart-card">
                <div className="chart-header">
                  <h3>Selections by Vertical</h3>
                </div>
                <div className="chart-wrapper">
                  <DynamicChart
                    type={vertChart}
                    data={[
                      ["Vertical", "Selections", { role: "annotation" }],
                      ...toChartRows(dashboardData.charts.selections_by_vertical),
                    ]}
                  />
                </div>
              </div>

              <div className="individual-chart-card">
                <div className="chart-header">
                  <h3>Onboardings by Vertical</h3>
                </div>
                <div className="chart-wrapper">
                  <DynamicChart
                    type={vertChart}
                    data={[
                      ["Vertical", "Onboardings", { role: "annotation" }],
                      ...toChartRows(dashboardData.charts.onboardings_by_vertical),
                    ]}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── AM RECORDS ── */}
      {tab === "my-records" && (
        <AMRecordsSection entries={entries} meta={meta} />
      )}

      {/* ── ROLLUP ── */}
      {tab === "rollup" && (
        <RollupSection entries={entries} allMonths={months.sort((a, b) => MONTHS_ORDER.indexOf(a) - MONTHS_ORDER.indexOf(b))} />
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