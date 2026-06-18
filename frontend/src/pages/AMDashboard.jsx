import { useState, useEffect, useCallback } from "react";
import { api } from "../utils/api";
import { MetricCard, Badge, Bar, Empty, Spinner } from "../components/UI";
import EntryForm from "../components/EntryForm";
import OpportunityTracker from "../components/OpportunityTracker";
import OpportunityStatusForm from "../components/OpportunityStatusForm";
import SelectionEditForm from "../components/SelectionEditForm.jsx";
import { CSVLink } from "react-csv";
import { VERTICALS, HEADERS, CLIENTS } from "../constants/StringConstants.js";
import { GET_OPPORTUNITY, GET_OPPORTUNITY_BY_ID, GET_FINAL_SELECTION_PROFILES, GET_ON_BOARD_OFF_BOARD_PROFILES } from "../api/endpoints";
import { OppForm, emptyOpportunity } from "../components/OpportunityTracker";
import { fetchData } from "../api/clients";
import OffboardingForm from "../components/OffBoardingForm";
import IndividualDetailsDashboard from "../components/IndividualDetailsDashboard.jsx";
import { MONTHS } from "../constants/StringConstants";
import { Chart } from "react-google-charts";
import { DASHBOARD } from "../api/endpoints";


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
// Converts [{name: "Partner", count: 33}, ...] → Google Charts table rows
function toChartData(label, apiArray) {
  if (!apiArray || apiArray.length === 0) return null;
  const rows = apiArray.map((item) => [item.name, item.count, String(item.count)]);
  return [[label, "Count", { role: "annotation" }], ...rows];
}

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
  const [profiles, setProfiles] = useState([]);
  const [editingProfile, setEditingProfile] = useState(null);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState(null);
  const [opportunityDetails, setOpportunityDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [showDetailsPage, setShowDetailsPage] = useState(false);
  const [selectionProfiles, setSelectionProfiles] = useState([]);
  const [editingSelectionProfile, setEditingSelectionProfile] = useState(null);
  const [onboardProfiles, setOnboardProfiles] = useState([]);
  const [editingOnboardProfile, setEditingOnboardProfile] = useState(null);
  const userRole = localStorage.getItem("role");
  const [selectedBU, setSelectedBU] = useState("");
  const [slideLoading, setSlideLoading] = useState(false);
  const [showOffboardingForm, setShowOffboardingForm] = useState(false);
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
    },
  });

  const fetchDashboardData = async () => {
    try {
      const data = await fetchData(DASHBOARD);

      setDashboardData({
        demands: data.demands || 0,
        positions: data.positions || 0,
        selections: data.selections || 0,
        onboardings: data.onboardings || 0,
        offboardings: data.offboardings || 0,
        net_adds: data.net_adds || 0,
        charts: {
          selections_by_source: data.charts?.selections_by_source || [],
          onboardings_by_source: data.charts?.onboardings_by_source || [],
          selections_by_vertical: data.charts?.selections_by_vertical || [],
        },
      });
    } catch (error) {
      console.error("Dashboard API Error:", error);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (tab === "am-tracker" || tab === "by-filters") {
      fetchDashboardData();
    }
  }, [tab]);
  const employees = [
    {
      emp_id: "SS001",
      engineer: "Rahul Sharma",
      client: "Cisco",
      vertical: "Embedded",
      source: "Bench",
      status: "Onboarded",
      date: "10-Jun-2025",
    },
    {
      emp_id: "SS002",
      engineer: "Priya Nair",
      client: "Qualcomm",
      vertical: "VLSI",
      source: "Partner",
      status: "Selected",
      date: "12-Jun-2025",
    },
    {
      emp_id: "SS003",
      engineer: "Arun Kumar",
      client: "Bosch",
      vertical: "Embedded",
      source: "Bench",
      status: "Offboarded",
      date: "15-Jun-2025",
    },
  ];

  const fetchOnboardOffboardProfiles = async () => {
    try {
      setLoading(true);
      const url = `${GET_ON_BOARD_OFF_BOARD_PROFILES}?limit=100&skip=0`;
      const data = await fetchData(url);
      setOnboardProfiles(data.data.items || []);
    } catch (error) {
      console.error("Fetch onboard/offboard profiles error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeForm === "on-off-boarding") {
      fetchOnboardOffboardProfiles();
    }
  }, [activeForm]);

  const fetchFinalSelectionProfiles = async () => {
    try {
      setLoading(true);
      const url = `${GET_FINAL_SELECTION_PROFILES}?limit=100&skip=0`;
      const data = await fetchData(url);
      setSelectionProfiles(data.data.items || []);
    } catch (error) {
      console.error("Fetch selection profiles error:", error);
    } finally {
      setLoading(false);
    }
  };

  // Add this useEffect alongside the opportunity-status one
  useEffect(() => {
    if (activeForm === "selection") {
      fetchFinalSelectionProfiles();
    }
  }, [activeForm]);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const url = `${GET_OPPORTUNITY}?limit=100&skip=0`;
      const data = await fetchData(url);
      setOpps(data.data.items || []);
    } catch (error) {
      console.error("Fetch opportunities error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOpportunityById = async (id) => {
    setSlideLoading(true);
    setShowDetailsPage(true);        // slide starts immediately
    setSelectedOpportunity(null);    // clear stale data
    setProfiles([]);
    try {
      const url = `${GET_OPPORTUNITY_BY_ID}/${id}`;
      const data = await fetchData(url);
      setSelectedOpportunity(data.data || null);
      setProfiles(data.data?.profiles || []);
    } catch (error) {
      console.error("Fetch opportunity detail error:", error);
    } finally {
      setSlideLoading(false);
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

  const handleSaveOppProfile = async (entry) => {
    setEntries(prev => [entry, ...prev]);
    onToast("Entry saved ✓");
    await refreshOpportunityProfiles();
  };

  const refreshOpportunityProfiles = async () => {
    if (!selectedOpportunity?.opportunity_id) return;
    try {
      const url = `${GET_OPPORTUNITY_BY_ID}/${selectedOpportunity.opportunity_id}`;
      const data = await fetchData(url);
      setProfiles(data.data?.profiles || []);
    } catch (error) {
      console.error("Refresh profiles error:", error);
    }
  };


  const DUMMY_DATA = {
    vlsi: {
      proposals: { submitted: 8, underReview: 3, partlyApproved: 2 },
      status: { won: 5, lost: 3 },
      rows: [
        { client: "Qualcomm", proposal: "RTL Design Augmentation", submitted: "12 Jan '25", status: "Won", bu: "VLSI" },
        { client: "MediaTek", proposal: "Physical Design Support", submitted: "20 Feb '25", status: "Lost", bu: "VLSI" },
        { client: "Marvell", proposal: "DFT Staffing Q1", submitted: "05 Mar '25", status: "Won", bu: "VLSI" },
        { client: "Broadcom", proposal: "Analog Mixed Signal Eng", submitted: "18 Mar '25", status: "Under Review", bu: "VLSI" },
        { client: "NXP", proposal: "Verification Bench", submitted: "02 Apr '25", status: "Partly Approved", bu: "VLSI" },
      ],
    },
    embedded: {
      proposals: { submitted: 6, underReview: 1, partlyApproved: 3 },
      status: { won: 4, lost: 2 },
      rows: [
        { client: "Bosch", proposal: "Embedded Firmware Team", submitted: "08 Jan '25", status: "Won", bu: "Embedded" },
        { client: "Continental", proposal: "AUTOSAR Engineers", submitted: "15 Feb '25", status: "Partly Approved", bu: "Embedded" },
        { client: "Honeywell", proposal: "IoT Embedded Devs", submitted: "22 Feb '25", status: "Won", bu: "Embedded" },
        { client: "Siemens", proposal: "RTOS Staffing", submitted: "10 Mar '25", status: "Lost", bu: "Embedded" },
        { client: "ABB", proposal: "Firmware Engineers", submitted: "01 Apr '25", status: "Under Review", bu: "Embedded" },
      ],
    },
    ai: {
      proposals: { submitted: 5, underReview: 2, partlyApproved: 1 },
      status: { won: 3, lost: 2 },
      rows: [
        { client: "NVIDIA", proposal: "ML Infra Engineers", submitted: "10 Jan '25", status: "Won", bu: "AI" },
        { client: "Google", proposal: "LLM Research Eng", submitted: "18 Feb '25", status: "Under Review", bu: "AI" },
        { client: "Microsoft", proposal: "AI Platform Staffing", submitted: "05 Mar '25", status: "Won", bu: "AI" },
        { client: "Arm", proposal: "Edge AI Engineers", submitted: "20 Mar '25", status: "Lost", bu: "AI" },
        { client: "AMD", proposal: "AI Compiler Team", submitted: "08 Apr '25", status: "Partly Approved", bu: "AI" },
      ],
    },
    pes: {
      proposals: { submitted: 7, underReview: 2, partlyApproved: 2 },
      status: { won: 4, lost: 3 },
      rows: [
        { client: "TCS", proposal: "Power Electronics Staffing", submitted: "03 Jan '25", status: "Won", bu: "PES" },
        { client: "GE", proposal: "Energy Systems Engineers", submitted: "14 Feb '25", status: "Lost", bu: "PES" },
        { client: "Schneider", proposal: "Power Design Team", submitted: "25 Feb '25", status: "Won", bu: "PES" },
        { client: "Eaton", proposal: "Motor Drive Engineers", submitted: "12 Mar '25", status: "Under Review", bu: "PES" },
        { client: "ABB", proposal: "Grid Automation Devs", submitted: "28 Mar '25", status: "Partly Approved", bu: "PES" },
      ],
    },
  };

  function getDummyData(bu) {
    return DUMMY_DATA[bu] || null;
  }

  function statusClass(s) {
    const map = {
      "Won": "status-selected",
      "Lost": "status-rejected",
      "Under Review": "status-under-review",
      "Partly Approved": "status-partly-approved",
    };
    return map[s] || "";
  }
  const defaultFilters = {
    client: "",
    vertical: "",
    // account_manager: "",
    source: "",
    month: "",
    week: "",
    from: "",
    to: "",
  };

  const [tabFilters, setTabFilters] = useState({
    records: { ...defaultFilters },
    benchPartner: { ...defaultFilters },
    byFilters: { ...defaultFilters },
    byClient: { ...defaultFilters },
    byVertical: { ...defaultFilters },
    byAm: { ...defaultFilters },
    weekYear: { ...defaultFilters },
  });
  const [appliedFilters, setAppliedFilters] = useState({});

  const handleFilterChange = (tabName, key, value) => {
    setTabFilters((prev) => ({
      ...prev,
      [tabName]: {
        ...prev[tabName],
        [key]: value,
      },
    }));
  };

  const handleSearch = async (tabKey = "byFilters") => {
    try {
      setLoading(true);
      const currentFilters = tabFilters[tabKey] || {};

      const params = new URLSearchParams();

      if (currentFilters.client)
        params.append("client", currentFilters.client);

      if (currentFilters.vertical)
        params.append("vertical", currentFilters.vertical);

      // if (currentFilters.account_manager)
      //   params.append("account_manager", currentFilters.account_manager);

      if (currentFilters.source)
        params.append("source", currentFilters.source);

      if (currentFilters.month)
        params.append("month", currentFilters.month);

      if (currentFilters.week)
        params.append("week", currentFilters.week);

      if (currentFilters.from)
        params.append("from_date", currentFilters.from);

      if (currentFilters.to)
        params.append("to_date", currentFilters.to);

      const url = `${DASHBOARD}?${params.toString()}`;

      const data = await fetchData(url);

      setDashboardData({
        demands: data.demands || 0,
        positions: data.positions || 0,
        selections: data.selections || 0,
        onboardings: data.onboardings || 0,
        offboardings: data.offboardings || 0,
        net_adds: data.net_adds || 0,
        charts: {
          selections_by_source: data.charts?.selections_by_source || [],
          onboardings_by_source: data.charts?.onboardings_by_source || [],
          selections_by_vertical: data.charts?.selections_by_vertical || [],
        },
      });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // const handleReset = (tabKey = "byFilters") => {
  //   setTabFilters((prev) => ({
  //     ...prev,
  //     [tabKey]: { ...defaultFilters },
  //   }));
  //   fetchDashboardData();
  // };

  const handleReset = async (tabKey = "byFilters") => {
    try {
      setLoading(true);

      setTabFilters((prev) => ({
        ...prev,
        [tabKey]: { ...defaultFilters },
      }));

      await fetchDashboardData();
    } catch (error) {
      console.error("Reset Error:", error);
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="page">
      {userRole !== "Sb_Tracker_Admin" && (
        <div className="tab-bar">
          {[
            ["log", "Business Opportunity"],
            ["am-tracker", "Dashboard"],
            ["by-filters", "Filters"],
            ["records", "Records"],
          ].map(([id, label]) => (
            <button
              key={id}
              className={`tab ${tab === id ? "active" : ""}`}
              onClick={() => setTab(id)}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── EMPLOYEE LIFECYCLE TRACKER ── */}
      {tab === "log" && (
        <>
          {!activeForm && (
            userRole === "Sb_Tracker_Admin" ? (
              <div className="ops-container">
                <div className="ops-page slide-center">
                  <div className="ops-main-wrap">
                    <div className="ops-page-head">
                      <div className="ops-title-row">
                        <h2 className="ops-page-title">Sales Reviews</h2>
                      </div>
                    </div>

                    <select
                      value={selectedBU}
                      onChange={(e) => setSelectedBU(e.target.value)}
                    >
                      <option value="">Select BU</option>
                      <option value="vlsi">VLSI</option>
                      <option value="embedded">Embedded</option>
                      <option value="ai">AI</option>
                      <option value="pes">PES</option>
                    </select>

                    {selectedBU && (() => {
                      const data = getDummyData(selectedBU);
                      if (!data) return null;
                      return (
                        <>
                          {/* ── Metric Cards ── */}
                          <div className="metric-grid" style={{ marginTop: 14 }}>
                            <div className="metric-card">
                              <p className="metric-label">Submitted</p>
                              <p className="metric-value" style={{ color: "#1d4ed8" }}>{data.proposals.submitted}</p>
                            </div>
                            <div className="metric-card">
                              <p className="metric-label">Under Review</p>
                              <p className="metric-value" style={{ color: "#d97706" }}>{data.proposals.underReview}</p>
                            </div>
                            <div className="metric-card">
                              <p className="metric-label">Partly Approved</p>
                              <p className="metric-value" style={{ color: "#7c3aed" }}>{data.proposals.partlyApproved}</p>
                            </div>
                            <div className="metric-card">
                              <p className="metric-label">Won</p>
                              <p className="metric-value" style={{ color: "#16a34a" }}>{data.status.won}</p>
                            </div>
                            <div className="metric-card">
                              <p className="metric-label">Lost</p>
                              <p className="metric-value" style={{ color: "#dc2626" }}>{data.status.lost}</p>
                            </div>
                          </div>

                          {/* ── Proposals Table ── */}
                          <p className="section-title" style={{ marginTop: 28, marginBottom: 12 }}>
                            Proposals
                            <span className="profile-count-badge">{data.rows.length}</span>
                          </p>
                          <div className="table-wrap sales-review-table-wrap" style={{ width: "fit-content", margin: "0 auto" }}>                            <table className="opp-table" style={{ tableLayout: "auto", width: "auto", minWidth: "unset" }}>
                            <thead>
                              <tr>
                                <th style={{ padding: "20px 26px", fontSize: "16px" }}>Client</th>
                                <th style={{ padding: "20px 26px", fontSize: "16px" }}>Proposal</th>
                                <th style={{ padding: "20px 26px", fontSize: "16px" }}>BU</th>
                                <th style={{ padding: "20px 26px", fontSize: "16px" }}>Submitted Date</th>
                                <th style={{ padding: "20px 26px", fontSize: "16px" }}>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {data.rows.map((row, i) => (
                                <tr key={i}>
                                  <td style={{ padding: "20px 26px", fontSize: "13px" }}><strong>{row.client}</strong></td>
                                  <td style={{ padding: "20px 26px", fontSize: "13px" }}>{row.proposal}</td>
                                  <td style={{ padding: "20px 26px", fontSize: "13px" }}>{row.bu}</td>
                                  <td style={{ padding: "20px 26px", fontSize: "13px" }}>{row.submitted}</td>
                                  <td style={{ padding: "20px 26px", fontSize: "13px" }}>
                                    <span className={`status-pill ${statusClass(row.status)}`}>
                                      {row.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          </div>
                        </>
                      );
                    })()}

                  </div>
                </div>
              </div>

            ) : (
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
            )
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
                          <th>Global/Domestic</th>
                          <th>BU</th>
                          <th>Mode</th>
                          <th>Skill</th>
                          <th>Experience</th>
                          <th>Month</th>
                          <th>Request Date</th>
                          <th>Expected Start Date</th>
                          <th>Location</th>
                          <th>Priority</th>
                          <th>Technical POC</th>
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
                            <td>{opp.team}</td>
                            <td>{opp.BU}</td>
                            <td>{opp.mode}</td>
                            <td>{opp.skill}</td>
                            <td>{opp.experience}</td>
                            <td>{opp.month}</td>
                            <td>{opp.reqdate}</td>
                            <td>{opp.expected_start_date}</td>
                            <td>{opp.location}</td>
                            <td>{opp.priority}</td>
                            <td>{opp.technical_poc}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* DETAILS PAGE */}
              <div className={`details-page ${showDetailsPage ? "details-show" : "details-hide"}`}>
                {showDetailsPage && (
                  slideLoading ? (
                    <div className="details-slide-loader">
                      <div className="slide-spinner" />
                      <p>Loading details…</p>
                    </div>
                  ) : selectedOpportunity ? (
                    <div className="details-content">
                      <div className="details-topbar">
                        <button className="details-back-btn" onClick={() => setShowDetailsPage(false)}>
                          ← Back
                        </button>
                        <h2>Opportunity Details</h2>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            className="btn-edit"
                            onClick={() => setShowOffboardingForm(true)}
                            style={{
                              marginTop: "17px",
                              height: "36px",
                              padding: "0 14px",
                              fontSize: "13px",
                              display: "inline-flex",
                              alignItems: "center",
                              background: "#fff7ed",
                              borderColor: "#fed7aa",
                              color: "#ea580c",
                            }}
                          >
                            📋 Offboarding
                          </button>
                          <button
                            className="btn-edit"
                            onClick={() => setEditingOpportunity(selectedOpportunity)}
                            style={{
                              marginTop: "17px",
                              height: "36px",
                              padding: "0 14px",
                              fontSize: "13px",
                              display: "inline-flex",
                              alignItems: "center"
                            }}
                          >
                            ✏️ Edit Opportunity
                          </button>
                          <button className="add-profile-btn" onClick={() => setShowProfilePopup(true)}>
                            <span className="btn-plus">＋</span> Add Profile
                          </button>
                        </div>
                      </div>

                      {/* Opportunity info table — unchanged */}
                      <div className="details-table-wrap">
                        <table className="details-table">
                          <tbody>
                            <tr>
                              <th>Client</th><td>{selectedOpportunity.client || "—"}</td>
                              <th>BU</th><td>{selectedOpportunity.BU || "—"}</td>
                            </tr>
                            <tr>
                              <th>Mode</th><td>{selectedOpportunity.mode || "—"}</td>
                              <th>Team</th><td>{selectedOpportunity.team || "—"}</td>
                            </tr>
                            <tr>
                              <th>Skill</th><td>{selectedOpportunity.skill || "—"}</td>
                              <th>Month</th><td>{selectedOpportunity.month || "—"}</td>
                            </tr>
                            <tr>
                              <th>Req Date</th><td>{selectedOpportunity.reqdate || "—"}</td>
                              <th>Expected Start Date</th><td>{selectedOpportunity.expected_start_date || "—"}</td>
                            </tr>
                            <tr>
                              <th>Location</th><td>{selectedOpportunity.location || "—"}</td>
                              <th>Positions</th><td>{selectedOpportunity.no_of_positions || "—"}</td>
                            </tr>
                            <tr>
                              <th>Experience</th><td>{selectedOpportunity.experience || "—"}</td>
                              <th>Priority</th><td>{selectedOpportunity.priority || "—"}</td>
                            </tr>
                            <tr>
                              <th>Technical POC</th><td>{selectedOpportunity.technical_poc || "—"}</td>
                              <th>Headcount</th><td>{selectedOpportunity.doable_headcount || "—"}</td>
                            </tr>
                            <tr>
                              <th>No. Of Profiles Shared</th><td>{selectedOpportunity.no_of_profiles_shared || "—"}</td>
                              <th>Filled by SS</th><td>{selectedOpportunity.closed_by_ss_count || "—"}</td>
                            </tr>
                            <tr>
                              <th>Expected Closure Date</th><td>{selectedOpportunity.expected_closure_date || "—"}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* ── Profiles Section ── */}
                      <div className="profiles-section">
                        <p className="section-title" style={{ marginTop: 24, marginBottom: 10 }}>
                          Profiles
                          <span className="profile-count-badge">{profiles.length}</span>
                        </p>

                        {detailsLoading ? (
                          <Spinner />
                        ) : profiles.length === 0 ? (
                          <Empty message="No profiles added yet" />
                        ) : (
                          <div className="table-wrap">
                            <table className="opp-table">
                              <thead>
                                <tr>
                                  <th>Engineer Name</th>
                                  <th>SS ID</th>
                                  <th>Source</th>
                                  <th>Experience (yrs)</th>
                                  <th>Status</th>
                                  <th>Selection Date</th>
                                  <th>Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {profiles.map((p) => (
                                  <tr key={p.profile_id}>
                                    <td><strong>{p.engg_name || "—"}</strong></td>
                                    <td>{p.ss_id || "—"}</td>
                                    <td><Badge type={p.source} /></td>
                                    <td>{p.projected_experience || "—"}</td>
                                    <td>
                                      <span className={`status-pill status-${p.profile_status?.toLowerCase().replace(/\s+/g, "-")}`}>
                                        {p.profile_status || "—"}
                                      </span>
                                    </td>
                                    <td>{p.selection_date ? fmt(p.selection_date) : "—"}</td>
                                    <td>
                                      <button
                                        className="btn-edit"
                                        onClick={() => setEditingProfile(p)}
                                      >
                                        ✏️
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
          {activeForm && activeForm !== "opportunity-status" && (
            activeForm === "on-off-boarding" ? (
              <div className="ops-container">
                <div className="ops-page slide-center">
                  <div className="ops-main-wrap">
                    <div className="ops-page-head">
                      <div className="ops-title-row">
                        <span className="ops-back-arrow" onClick={() => setActiveForm(null)}>{"<"}</span>
                        <h2 className="ops-page-title">On / Off-Boarding</h2>
                      </div>
                    </div>
                    {loading ? (
                      <Spinner />
                    ) : onboardProfiles.length === 0 ? (
                      <Empty message="No onboarding / offboarding profiles found" />
                    ) : (
                      <div className="table-wrap">
                        <table className="opp-table">
                          <thead>
                            <tr>
                              <th>Engineer Name</th>
                              <th>SS ID</th>
                              <th>Client</th>
                              <th>Client/BU</th>
                              <th>Source</th>
                              <th>Status</th>
                              <th>Selection Date</th>
                              <th>Onboarding Month</th>
                              <th>Onboarding Date</th>
                              <th>Offboarding Date</th>
                              <th>Offboarding Month</th>
                              <th>Skill</th>
                              <th>Experience</th>
                              <th>Priority</th>
                              <th>Positions</th>
                              <th>Tech POC</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {onboardProfiles.map((p) => (
                              <tr key={p.profile_id}>
                                <td><strong>{p.engg_name || "—"}</strong></td>
                                <td>{p.ss_id || "—"}</td>
                                <td>{p.client_name || p.opportunity_details?.client || "—"}</td>
                                <td>{p.client_bu_name || p.opportunity_details?.BU || "—"}</td>
                                <td><Badge type={p.source} /></td>
                                <td>
                                  <span className={`status-pill status-${p.profile_status?.toLowerCase().replace(/\s+/g, "-")}`}>
                                    {p.profile_status || "—"}
                                  </span>
                                </td>
                                <td>{p.selection_date ? fmt(p.selection_date) : "—"}</td>
                                <td>{p.onboarding_month || "—"}</td>
                                <td>{p.client_onboarding_date ? fmt(p.client_onboarding_date) : "—"}</td>
                                <td>{p.offboarding_date ? fmt(p.offboarding_date) : "—"}</td>
                                <td>{p.offboarding_month || "—"}</td>
                                <td>{p.opportunity_details?.skill || "—"}</td>
                                <td>{p.opportunity_details?.experience || "—"}</td>
                                <td>{p.opportunity_details?.priority || "—"}</td>
                                <td>{p.opportunity_details?.no_of_positions ?? "—"}</td>
                                <td>{p.opportunity_details?.technical_poc || "—"}</td>
                                <td>
                                  <button className="btn-edit" onClick={() => setEditingOnboardProfile(p)}>✏️</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeForm === "selection" ? (
              <div className="ops-container">
                <div className="ops-page slide-center">
                  <div className="ops-main-wrap">
                    <div className="ops-page-head">
                      <div className="ops-title-row">
                        <span className="ops-back-arrow" onClick={() => setActiveForm(null)}>{"<"}</span>
                        <h2 className="ops-page-title">Selection</h2>
                      </div>
                    </div>
                    {loading ? (
                      <Spinner />
                    ) : selectionProfiles.length === 0 ? (
                      <Empty message="No selection profiles found" />
                    ) : (
                      <div className="table-wrap">
                        <table className="opp-table">
                          <thead>
                            <tr>
                              <th>Engineer Name</th>
                              <th>SS ID</th>
                              <th>Client</th>
                              <th>Client BU</th>
                              <th>Source</th>
                              <th>Status</th>
                              <th>Selection Date</th>
                              <th>Skill</th>
                              <th>Experience</th>
                              <th>Priority</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectionProfiles.map((p) => (
                              <tr key={p.profile_id}>
                                <td><strong>{p.engg_name || "—"}</strong></td>
                                <td>{p.ss_id || "—"}</td>
                                <td>{p.client_name || p.opportunity_details?.client || "—"}</td>
                                <td>{p.client_bu_name || p.opportunity_details?.BU || "—"}</td>
                                <td><Badge type={p.source} /></td>
                                <td>
                                  <span className={`status-pill status-${p.profile_status?.toLowerCase().replace(/\s+/g, "-")}`}>
                                    {p.profile_status || "—"}
                                  </span>
                                </td>
                                <td>{p.selection_date ? fmt(p.selection_date) : "—"}</td>
                                <td>{p.opportunity_details?.skill || "—"}</td>
                                <td>{p.opportunity_details?.experience || "—"}</td>
                                <td>{p.opportunity_details?.priority || "—"}</td>
                                <td>
                                  <button className="btn-edit" onClick={() => setEditingSelectionProfile(p)}>✏️</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : activeForm === "new-dashboard" && userRole === "Sb_Tracker_Admin" ? (
              <div className="ops-container">
                <div className="ops-page slide-center">
                  <div className="ops-main-wrap">
                    <div className="ops-page-head">
                      <div className="ops-title-row">
                        <span className="ops-back-arrow" onClick={() => setActiveForm(null)}>{"<"}</span>
                        <h2 className="ops-page-title">Sales Reviews</h2>
                      </div>
                    </div>
                    <div className="sales-reviews-field">
                      <label>BU</label>
                      <select
                        value={selectedBU}
                        onChange={(e) => setSelectedBU(e.target.value)}
                      >
                        <option value="" disabled>Select BU</option>
                        <option value="silicon">Silicon</option>
                        <option value="ai">AI</option>
                        <option value="rtl">RTL</option>
                        <option value="verification">Verification</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeForm === "individual-details" ? (
              <IndividualDetailsDashboard
                onBack={() => setActiveForm(null)}
              />
            ) : (
              <OpportunityTracker
                type={activeForm}
                onSave={handleSave}
                onCancel={() => setActiveForm(null)}
                setActiveForm={setActiveForm}
              />
            )
          )}

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
                  selectedOpportunity={selectedOpportunity}
                  onSave={(data) => {
                    handleSaveOppProfile(data);
                    setShowProfilePopup(false);
                  }}
                  onCancel={() => setShowProfilePopup(false)}
                />
              </div>
            </div>
          )}
          {editingProfile && (
            <div
              className="modal-overlay"
              onClick={() => setEditingProfile(null)}
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
                  mode="edit"
                  selectedOpportunity={selectedOpportunity}
                  initialData={editingProfile}
                  onSave={(updated) => {
                    setProfiles(prev =>
                      prev.map(p =>
                        p.profile_id === updated.profile_id ? updated : p
                      )
                    );
                    setEditingProfile(null);
                    onToast("Profile updated ✓");
                  }}
                  onCancel={() => setEditingProfile(null)}
                />
              </div>
            </div>
          )}

          {/* After the editingProfile modal */}
          {editingOpportunity && (
            <div
              className="modal-overlay"
              onClick={() => setEditingOpportunity(null)}
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
                <OppForm
                  initial={{
                    ...emptyOpportunity(),       // safe defaults
                    ...editingOpportunity,       // everything from API as-is
                    // API has no jdFileName, so show file_id as fallback indicator
                    jdFileName: editingOpportunity.jdFileName || "",
                    jdFileUrl: editingOpportunity.jdFileUrl || "",
                    open_status: editingOpportunity.open_status || [],
                    hiring_manager_name: editingOpportunity.hiring_manager_name || "",
                    hiring_manager_email: editingOpportunity.hiring_manager_email || "",
                    hiring_location: editingOpportunity.hiring_location || "",
                  }}
                  onSave={(updated) => {
                    setSelectedOpportunity((prev) => ({ ...prev, ...updated }));
                    setEditingOpportunity(null);
                    onToast("Opportunity updated ✓");
                  }}
                  onCancel={() => setEditingOpportunity(null)}
                />
              </div>
            </div>
          )}

          {editingSelectionProfile && (
            <div className="modal-overlay" onClick={() => setEditingSelectionProfile(null)}>
              <div
                className="modal"
                style={{ maxWidth: 950, width: "95%", maxHeight: "92vh", overflowY: "auto", padding: 0, borderRadius: 18 }}
                onClick={(e) => e.stopPropagation()}
              >
                <SelectionEditForm
                  initialData={editingSelectionProfile}
                  onSave={(updated) => {
                    setSelectionProfiles(prev =>
                      prev.map(p => p.profile_id === updated.profile_id ? { ...p, ...updated } : p)
                    );
                    setEditingSelectionProfile(null);
                    onToast("Profile updated ✓");
                  }}
                  onCancel={() => setEditingSelectionProfile(null)}
                />
              </div>
            </div>
          )}

          {editingOnboardProfile && (
            <div className="modal-overlay" onClick={() => setEditingOnboardProfile(null)}>
              <div
                className="modal"
                style={{ maxWidth: 950, width: "95%", maxHeight: "92vh", overflowY: "auto", padding: 0, borderRadius: 18 }}
                onClick={(e) => e.stopPropagation()}
              >
                <SelectionEditForm
                  initialData={editingOnboardProfile}
                  fetchEndpoint={`${GET_ON_BOARD_OFF_BOARD_PROFILES}?limit=100&skip=0`}
                  onSave={(updated) => {
                    setOnboardProfiles(prev =>
                      prev.map(p => p.profile_id === updated.profile_id ? { ...p, ...updated } : p)
                    );
                    setEditingOnboardProfile(null);
                    onToast("Profile updated ✓");
                  }}
                  onCancel={() => setEditingOnboardProfile(null)}
                />
              </div>
            </div>
          )}

          {showOffboardingForm && (
            <div className="modal-overlay" onClick={() => setShowOffboardingForm(false)}>
              <div
                className="modal"
                style={{
                  maxWidth: 720,
                  width: "95%",
                  maxHeight: "92vh",
                  overflowY: "auto",
                  padding: 0,
                  borderRadius: 18,
                  background: "#f8fafc",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div style={{ padding: "16px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span />
                  <button
                    onClick={() => setShowOffboardingForm(false)}
                    style={{
                      background: "none",
                      border: "none",
                      fontSize: 20,
                      cursor: "pointer",
                      color: "#64748b",
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
                <OffboardingForm opportunityId={selectedOpportunity?.opportunity_id} />
              </div>
            </div>
          )}
        </>
      )}
      {tab === "am-tracker" && (
        <div className="ops-container">
          <div className="ops-page slide-center">
            <div className="ops-main-wrap">
              <IndividualDetailsDashboard
                onBack={() => setTab("log")}
              />
            </div>
          </div>
        </div>
      )}
      {tab === "bench-partner" && (
        <div className="ops-container">
          <div className="ops-page slide-center">
            <div className="ops-main-wrap">
              {/* Filters */}
              <div
                className="dashboard-filter-card"
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "16px",
                  width: "100%",
                }}
              >
                <div>
                  <label>CLIENT</label>
                  <select
                    className="chart-select"
                    value={tabFilters.benchPartner.client}
                    onChange={(e) =>
                      handleFilterChange(
                        "benchPartner",
                        "client",
                        e.target.value
                      )
                    }
                  >
                    <option value="">All Clients</option>
                    {CLIENTS.map((client) => (
                      <option key={client} value={client}>
                        {client}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>VERTICAL</label>
                  <select
                    className="chart-select"
                    value={tabFilters.benchPartner.vertical}
                    onChange={(e) =>
                      handleFilterChange(
                        "benchPartner",
                        "vertical",
                        e.target.value
                      )
                    }
                  >
                    <option value="">All Verticals</option>
                    {VERTICALS.map((vertical) => (
                      <option key={vertical} value={vertical}>
                        {vertical}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label>MONTH</label>
                  <select
                    className="chart-select"
                    value={tabFilters.benchPartner.month}
                    onChange={(e) =>
                      handleFilterChange(
                        "benchPartner",
                        "month",
                        e.target.value
                      )
                    }
                  >
                    <option value="">All Months</option>
                    {MONTHS.map((month) => (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label>WEEK</label>
                  <select
                    className="chart-select"
                    value={tabFilters.benchPartner.week}
                    onChange={(e) =>
                      handleFilterChange(
                        "benchPartner",
                        "week",
                        e.target.value
                      )
                    }
                  >
                    <option value="">All Weeks</option>
                    <option value="W1">W1</option>
                    <option value="W2">W2</option>
                    <option value="W3">W3</option>
                    <option value="W4">W4</option>
                  </select>
                </div>

                <div>
                  <label>FROM</label>
                  <input
                    type="date"
                    className="chart-select"
                    value={tabFilters.benchPartner.from}
                    onChange={(e) =>
                      handleFilterChange(
                        "benchPartner",
                        "from",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div>
                  <label>TO</label>
                  <input
                    type="date"
                    className="chart-select"
                    value={tabFilters.benchPartner.to}
                    onChange={(e) =>
                      handleFilterChange(
                        "benchPartner",
                        "to",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div
                  style={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    justifyContent: "center",
                    marginTop: "10px",
                  }} >
                  <button
                    className="search-btn"
                    onClick={() => handleSearch("benchPartner")}
                  >
                    🔍 Search
                  </button>
                </div>
              </div>

              {/* Charts */}
              <div className="individual-dashboard-grid">
                <div className="individual-chart-card">
                  <div className="chart-header">
                    <h3>Selections — By Source</h3>
                  </div>

                  <div className="chart-wrapper">
                    <DynamicChart
                      type="ColumnChart"
                      data={toChartData("Source", dashboardData.charts.selections_by_source)}
                    />
                  </div>
                </div>

                <div className="individual-chart-card">
                  <div className="chart-header">
                    <h3>Onboardings — By Source</h3>
                  </div>

                  <div className="chart-wrapper">
                    <DynamicChart
                      type="ColumnChart"
                      data={toChartData("Source", dashboardData.charts.onboardings_by_source)}
                    />
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      {tab === "by-filters" && (
        <div className="filters-page">
          {loading && (
            <div className="page-loader">
              <div className="loader-content">
                <div className="spinner"></div>
                <p>Loading...</p>
              </div>
            </div>
          )}
          {/* Left Filter Panel */}
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
              <select className="chart-select"
                value={tabFilters.byFilters.client}
                onChange={(e) => handleFilterChange("byFilters", "client", e.target.value)}
              >
                <option value="">Select Client</option>
                {CLIENTS.map((client) => (
                  <option key={client}>{client}</option>
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
              <select className="chart-select"
                value={tabFilters.byFilters.vertical}
                onChange={(e) => handleFilterChange("byFilters", "vertical", e.target.value)}
              >
                <option value="">Select Vertical</option>
                {VERTICALS.map((vertical) => (
                  <option key={vertical}>{vertical}</option>
                ))}
              </select>
            </div>

            {/* <div className="filter-group" >
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
              <select className="chart-select"
                value={tabFilters.byFilters.account_manager}
                onChange={(e) => handleFilterChange("byFilters", "account_manager", e.target.value)}
              >
                <option value="">Select AM</option>
                <option>AM 1</option>
                <option>AM 2</option>
              </select>
            </div> */}

            <div className="filter-group" >
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
              <select className="chart-select"
                value={tabFilters.byFilters.source}
                onChange={(e) => handleFilterChange("byFilters", "source", e.target.value)}
              >
                <option value="">Select Source</option>
                <option>Bench</option>
                <option>Partner</option>
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
              <input type="date" className="chart-select"
                value={tabFilters.byFilters.from}
                onChange={(e) => handleFilterChange("byFilters", "from", e.target.value)}
              />
            </div>

            <div className="filter-group" >
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
              <input type="date" className="chart-select"
                value={tabFilters.byFilters.to}
                onChange={(e) => handleFilterChange("byFilters", "to", e.target.value)}
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
                  pointerEvents: loading ? "none" : "auto",
                  opacity: loading ? 0.7 : 1,

                }}
                onClick={() => handleSearch("byFilters")}
              >
                Search
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
                  cursor: loading ? "not-allowed" : "pointer",
                }}
                onClick={() => handleReset("byFilters")}
              >
                Reset
              </button>
            </div>
          </div>


          {/* Right Graph Section */}
          <div className="filters-content">
            {/* Summary Row */}
            <div className="headcount-summary">
              <div
                className="summary-item"
                style={{ backgroundColor: "#EEF2FF" }}
              >
                <div className="summary-title">#DEMANDS</div>
                <div className="summary-value">{dashboardData.demands}</div>
                <div
                  className="summary-bar"
                  style={{ backgroundColor: "#6366F1" }}
                ></div>
              </div>

              <div
                className="summary-item"
                style={{ backgroundColor: "#ECFDF5" }}
              >
                <div className="summary-title">#POSITIONS</div>
                <div className="summary-value">{dashboardData.positions}</div>
                <div
                  className="summary-bar"
                  style={{ backgroundColor: "#10B981" }}
                ></div>
              </div>

              <div
                className="summary-item"
                style={{ backgroundColor: "#FFF7ED" }}
              >
                <div className="summary-title">#SELECTIONS</div>
                <div className="summary-value">{dashboardData.selections}</div>
                <div
                  className="summary-bar"
                  style={{ backgroundColor: "#F97316" }}
                ></div>
              </div>

              <div
                className="summary-item"
                style={{ backgroundColor: "#EFF6FF" }}
              >
                <div className="summary-title">#ONBOARDED</div>
                <div className="summary-value">{dashboardData.onboardings}</div>
                <div
                  className="summary-bar"
                  style={{ backgroundColor: "#3B82F6" }}
                ></div>
              </div>

              <div
                className="summary-item"
                style={{ backgroundColor: "#FEF2F2" }}
              >
                <div className="summary-title">#OFFBOARDED</div>
                <div className="summary-value">{dashboardData.offboardings}</div>
                <div
                  className="summary-bar"
                  style={{ backgroundColor: "#EF4444" }}
                ></div>
              </div>

              <div
                className="summary-item"
                style={{ backgroundColor: "#F5F3FF" }}
              >
                <div className="summary-title">#NET ADDS</div>
                <div className="summary-value">{dashboardData.net_adds}</div>
                <div
                  className="summary-bar"
                  style={{ backgroundColor: "#8B5CF6" }}
                ></div>
              </div>
            </div>

            {/* Charts Row */}
            <div className="individual-dashboard-grid">
              <div className="individual-chart-card">
                <div className="chart-header">
                  <h3>Selections — By Source</h3>
                </div>

                <div className="chart-wrapper">
                  <DynamicChart
                    type="ColumnChart"
                    data={toChartData("Source", dashboardData.charts.selections_by_source)}
                  />
                </div>
              </div>

              <div className="individual-chart-card">
                <div className="chart-header">
                  <h3>Onboardings — By Source</h3>
                </div>

                <div className="chart-wrapper">
                  <DynamicChart
                    type="ColumnChart"
                    data={toChartData("Source", dashboardData.charts.onboardings_by_source)}
                  />
                </div>
              </div>

              <div className="individual-chart-card">
                <div className="chart-header">
                  <h3>Bench vs Partner</h3>
                </div>

                <div className="chart-wrapper">
                  <DynamicChart
                    type="PieChart"
                    data={toChartData("Source", dashboardData.charts.selections_by_source)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {tab === "records" && (
        <div className="ops-container">
          <div className="ops-page slide-center">
            <div className="ops-main-wrap">
              <div className="ops-main-wrap">
                {/* Filters */}
                <div
                  className="dashboard-filter-card"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "16px",
                    width: "100%",
                  }}
                >
                  <div>
                    <label>CLIENT</label>
                    <select
                      className="chart-select"
                      value={tabFilters.benchPartner.client}
                      onChange={(e) =>
                        handleFilterChange(
                          "benchPartner",
                          "client",
                          e.target.value
                        )
                      }
                    >
                      <option value="">All Clients</option>
                      {CLIENTS.map((client) => (
                        <option key={client} value={client}>
                          {client}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>VERTICAL</label>
                    <select
                      className="chart-select"
                      value={tabFilters.benchPartner.vertical}
                      onChange={(e) =>
                        handleFilterChange(
                          "benchPartner",
                          "vertical",
                          e.target.value
                        )
                      }
                    >
                      <option value="">All Verticals</option>
                      {VERTICALS.map((vertical) => (
                        <option key={vertical} value={vertical}>
                          {vertical}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label>MONTH</label>
                    <select
                      className="chart-select"
                      value={tabFilters.benchPartner.month}
                      onChange={(e) =>
                        handleFilterChange(
                          "benchPartner",
                          "month",
                          e.target.value
                        )
                      }
                    >
                      <option value="">All Months</option>
                      {MONTHS.map((month) => (
                        <option key={month} value={month}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label>WEEK</label>
                    <select
                      className="chart-select"
                      value={tabFilters.benchPartner.week}
                      onChange={(e) =>
                        handleFilterChange(
                          "benchPartner",
                          "week",
                          e.target.value
                        )
                      }
                    >
                      <option value="">All Weeks</option>
                      <option value="W1">W1</option>
                      <option value="W2">W2</option>
                      <option value="W3">W3</option>
                      <option value="W4">W4</option>
                    </select>
                  </div>

                  <div>
                    <label>FROM</label>
                    <input
                      type="date"
                      className="chart-select"
                      value={tabFilters.benchPartner.from}
                      onChange={(e) =>
                        handleFilterChange(
                          "benchPartner",
                          "from",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div>
                    <label>TO</label>
                    <input
                      type="date"
                      className="chart-select"
                      value={tabFilters.benchPartner.to}
                      onChange={(e) =>
                        handleFilterChange(
                          "benchPartner",
                          "to",
                          e.target.value
                        )
                      }
                    />
                  </div>

                  <div
                    style={{
                      gridColumn: "1 / -1",
                      display: "flex",
                      justifyContent: "center",
                      marginTop: "10px",
                    }} >
                    <button
                      className="search-btn"
                      onClick={() => handleSearch("benchPartner")}
                    >
                      🔍 Search
                    </button>
                  </div>
                </div>
              </div>

              <div className="dashboard-card">
                <div className="dashboard-card-title">
                  Individual Details
                </div>

                <div className="table-wrap">
                  <table className="dashboard-table">
                    <thead>
                      <tr>
                        <th>Employee ID</th>
                        <th>Engineer</th>
                        <th>Client</th>
                        <th>Vertical</th>
                        <th>Source</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>

                    <tbody>
                      {employees.map((emp) => (
                        <tr key={emp.emp_id}>
                          <td>{emp.emp_id}</td>
                          <td>{emp.engineer}</td>
                          <td>{emp.client}</td>
                          <td>{emp.vertical}</td>
                          <td>{emp.source}</td>
                          <td>{emp.status}</td>
                          <td>{emp.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>
        </div>
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
          headers={HEADERS}
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