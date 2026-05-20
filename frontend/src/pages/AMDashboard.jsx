import { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";
import { MetricCard, Badge, Bar, Empty, Spinner } from "../components/UI";
import EntryForm from "../components/EntryForm";
import OpportunityTracker from "../components/OpportunityTracker";
import OnboardingOffboarding from "../components/OnBoardOffBoard";
import OpportunityStatusForm from "../components/OpportunityStatusForm";
import { CSVLink } from "react-csv";
import { GET_OPPORTUNITY, GET_OPPORTUNITY_BY_ID } from "../api/endpoints";
import { VERTICALS } from "../constants/StringConstants.js";


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
  const [showProfilePopup, setShowProfilePopup] = useState(false);
  const [opps, setOpps] = useState([]);

  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [opportunityDetails, setOpportunityDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsPage, setShowDetailsPage] = useState(false);
  // fetch meta once
  useEffect(() => {
    api.meta().then(m => setMeta(m)).catch(() => { });
  }, []);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);

      const url = `${GET_OPPORTUNITY}?limit=100&skip=0`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to fetch opportunities"
        );
      }

      setOpps(data.data.items || []);
    } catch (error) {
      console.error("Fetch opportunities error:", error);
    } finally {
      setLoading(false);
    }
  };



  const fetchOpportunityById = async (id) => {
    try {
      setLoading(true);

      const url = `${GET_OPPORTUNITY_BY_ID}/${id}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to fetch opportunity details"
        );
      }

      setSelectedOpportunity(data.data || null);

      // open details page
      setShowDetailsPage(true);

    } catch (error) {
      console.error("Fetch opportunity detail error:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (activeForm === "opportunity-status") {
      fetchOpportunities();
    }
  }, [activeForm]);


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

  const columns = [
    { label: "Client", key: "client" },
    { label: "BU", key: "BU" },
    { label: "Mode", key: "mode" },
    { label: "Team", key: "team" },
    { label: "Skill", key: "skill" },
    { label: "Month", key: "month" },
    { label: "Req Date", key: "reqdate" },
    { label: "Start Date", key: "start_date" },
    { label: "Location", key: "location" },
    { label: "Positions", key: "no_of_positions" },
    { label: "Experience", key: "experience" },
    { label: "Technical POC", key: "technical_poc" },
    { label: "Priority", key: "priority" },
    { label: "Doable HC", key: "doable_headcount" },
    { label: "Vertical", key: "vertical" },
  ];
  return (
    <div className="page">
      <div className="tab-bar">
        {[
          ["log", "Employee Lifecycle Tracker"]
        ].map(([id, label]) => (
          <button
            key={id}
            className={`tab ${tab === id ? "active" : ""}`}
            onClick={() => { setTab(id); if (id !== "log" && id !== "opps") load(); }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── EMPLOYEE LIFECYCLE TRACKER ── */}
      {tab === "log" && (
        <>
          {!activeForm && (
            <div className="log-cards">
              {[
                {
                  type: "opportunity",
                  color: "#1d4ed8",
                  bg: "#eff6ff",
                  border: "#bfdbfe",
                  title: "Opportunity",
                  sub: "New business opportunity identified",
                },
                {
                  type: "opportunity-status",
                  color: "#1d4ed8",
                  bg: "#eff6ff",
                  border: "#bfdbfe",
                  title: "Opportunity Status",
                  sub: "Update opportunity status",
                },
                {
                  type: "selection",
                  color: "#1d4ed8",
                  bg: "#eff6ff",
                  border: "#bfdbfe",
                  title: "Selection",
                  sub: "Engineer selected by client",
                },
                {
                  type: "on-off-boarding",
                  color: "#1d4ed8",
                  bg: "#eff6ff",
                  border: "#bfdbfe",
                  title: "On/Off-Boarding",
                  sub: "Update employee on/off-boarding status",
                }
              ].map(({ type, color, bg, border, title, sub }) => (
                <div
                  key={type}
                  className="log-card"
                  style={{ background: bg, borderColor: border }}
                  onClick={() => setActiveForm(type)}
                >
                  <p className="log-card-title" style={{ color }}>{title}</p>
                  <p className="log-card-sub">{sub}</p>
                </div>
              ))}
            </div>
          )}
          {/* ── Opportunity Status Section ── */}
          {activeForm === "opportunity-status" && (
            <div className="ops-container">

              {/* LIST PAGE */}
              <div
                className={`ops-page ${showDetailsPage ? "slide-left" : "slide-center"
                  }`}
              >
                <div className="ops-main-wrap">
                  <div className="ops-page-head">
                    <div className="ops-title-row">
                      <span
                        className="ops-back-arrow"
                        onClick={() => setActiveForm(null)}
                      >
                        {"<"}
                      </span>

                      <h2 className="ops-page-title">
                        Opportunity Status
                      </h2>
                    </div>
                  </div>

                  <div className="table-wrap">
                    <table className="opp-table">
                      <thead>
                        <tr>
                          <th>Client</th>
                          <th>BU</th>
                          <th>Mode</th>
                          <th>Team</th>
                          <th>Skill</th>
                          <th>Location</th>
                          <th>Priority</th>
                        </tr>
                      </thead>

                      <tbody>
                        {opps.map((opp) => (
                          <tr
                            key={opp.opportunity_id}
                            className="opp-row"
                            onClick={() =>
                              fetchOpportunityById(opp.opportunity_id)
                            }
                          >
                            <td>{opp.client}</td>
                            <td>{opp.BU}</td>
                            <td>{opp.mode}</td>
                            <td>{opp.team}</td>
                            <td>{opp.skill}</td>
                            <td>{opp.location}</td>
                            <td>{opp.priority}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* DETAILS PAGE */}
              <div
                className={`details-page ${showDetailsPage ? "details-show" : "details-hide"
                  }`}
              >
                {selectedOpportunity && (
                  <div className="details-content">

                    <div className="details-topbar">
                      <button
                        className="details-back-btn"
                        onClick={() => setShowDetailsPage(false)}
                      >
                        ← Back
                      </button>

                      <h2>Opportunity Details</h2>
                    </div>

                    <div className="details-table-wrap">
                      <table className="details-table">
                        <tbody>
                          <tr>
                            <th>Client</th>
                            <td>{selectedOpportunity.client || "—"}</td>

                            <th>BU</th>
                            <td>{selectedOpportunity.BU || "—"}</td>
                          </tr>

                          <tr>
                            <th>Mode</th>
                            <td>{selectedOpportunity.mode || "—"}</td>

                            <th>Team</th>
                            <td>{selectedOpportunity.team || "—"}</td>
                          </tr>

                          <tr>
                            <th>Skill</th>
                            <td>{selectedOpportunity.skill || "—"}</td>

                            <th>Month</th>
                            <td>{selectedOpportunity.month || "—"}</td>
                          </tr>

                          <tr>
                            <th>Req Date</th>
                            <td>{selectedOpportunity.reqdate || "—"}</td>

                            <th>Start Date</th>
                            <td>{selectedOpportunity.start_date || "—"}</td>
                          </tr>

                          <tr>
                            <th>Location</th>
                            <td>{selectedOpportunity.location || "—"}</td>

                            <th>Positions</th>
                            <td>{selectedOpportunity.no_of_positions || "—"}</td>
                          </tr>

                          <tr>
                            <th>Experience</th>
                            <td>{selectedOpportunity.experience || "—"}</td>

                            <th>Priority</th>
                            <td>{selectedOpportunity.priority || "—"}</td>
                          </tr>

                          <tr>
                            <th>Technical POC</th>
                            <td>{selectedOpportunity.technical_poc || "—"}</td>

                            <th>Headcount</th>
                            <td>{selectedOpportunity.doable_headcount || "—"}</td>
                          </tr>

                          <tr>
                            <th>Created At</th>
                            <td>{selectedOpportunity.created_at || "—"}</td>

                            <th>Updated At</th>
                            <td>{selectedOpportunity.updated_at || "—"}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Other Forms ── */}
          {activeForm &&
            activeForm !== "opportunity-status" && (
              activeForm === "on-off-boarding" ? (
                <OnboardingOffboarding
                  onSave={handleSave}
                  onCancel={() => setActiveForm(null)}
                  setActiveForm={setActiveForm}
                />
              ) : (
                <OpportunityTracker
                  type={activeForm}
                  onSave={handleSave}
                  onCancel={() => setActiveForm(null)}
                  setActiveForm={setActiveForm}
                />
              )
            )
          }

          {/* ── Opportunity Status Popup ── */}
          {showProfilePopup && (
            <div
              className="modal-overlay"
              onClick={() => setShowProfilePopup(false)}
            >
              <div
                className="modal"
                style={{
                  maxWidth: 950,
                  width: "95%",
                  maxHeight: "92vh",
                  overflowY: "auto",
                  padding: 0,
                  borderRadius: 18,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <OpportunityStatusForm
                  onSave={(data) => {
                    handleSave(data);
                    setShowProfilePopup(false);
                  }}
                  onCancel={() => setShowProfilePopup(false)}
                />
              </div>
            </div>
          )}

          {/* {activeForm && activeForm === "opportunity-status" ? (
            <OpportunityStatusForm
              onSave={handleSave}
              onCancel={() => setActiveForm(null)}
            />
          ) : activeForm ? (
            <OpportunityTracker
              type={activeForm}
              onSave={handleSave}
              onCancel={() => setActiveForm(null)}
            />
          ) : null} */}
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
    </div>
  );
}

/* ── MY RECORDS SECTION ── */
function MyRecordsSection({ entries: initialEntries, setEntries: setParentEntries, meta, loading, onToast }) {
  const [entries, setEntries] = useState(initialEntries);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => { setEntries(initialEntries); }, [initialEntries]);

  const sync = (updated) => {
    setEntries(updated);
    setParentEntries(updated);
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

  const startEdit = (r) => setEditingEntry(r);
  const cancelEdit = () => setEditingEntry(null);
  const handleEditSave = (updated) => {
    sync(entries.map(r => r.id === updated.id ? { ...r, ...updated } : r));
    setEditingEntry(null);
    onToast("Entry updated ✓");
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

  return (
    <div style={{ position: "relative", paddingTop: 40 }}>
      <div style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
        <CSVLink
          data={csvData}
          headers={headers}
          filename={`entries_${new Date().toISOString().split("T")[0]}.csv`}
          className="no-underline"
        >
          <button disabled={!csvData.length} className="btn-export">⬇️ Export CSV</button>
        </CSVLink>
      </div>

      {editingEntry && (
        <div className="modal-overlay" onClick={cancelEdit}>
          <div
            className="modal"
            style={{ maxWidth: 640, width: "100%", padding: 0, maxHeight: "90vh", overflowY: "auto", borderRadius: "var(--border-radius-lg)" }}
            onClick={e => e.stopPropagation()}
          >
            <EntryForm
              type={editingEntry.type}
              entryId={editingEntry.id}
              initialData={{
                date: editingEntry.date ?? "",
                onboardingDate: editingEntry.onboardingDate ?? "",
                offboardingDate: editingEntry.offboardingDate ?? "",
                client: editingEntry.client ?? "",
                vertical: editingEntry.vertical ?? "",
                source: editingEntry.source ?? "",
                empType: editingEntry.empType ?? "",
                candidateName: editingEntry.candidateName ?? "",
                managerName: editingEntry.managerName ?? "",
                remarks: editingEntry.remarks ?? "",
              }}
              onSave={handleEditSave}
              onCancel={cancelEdit}
            />
          </div>
        </div>
      )}

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
                  {/* <th style={{ minWidth: 80 }}>Actions</th> */}
                </tr>
              </thead>
              <tbody>
                {entries.filter(r => r.type === type).length === 0
                  ? <tr><td colSpan="8" className="empty-cell">No entries yet</td></tr>
                  : entries.filter(r => r.type === type).map(r => (
                    <tr key={r.id}>
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