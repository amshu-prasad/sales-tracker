import { useState, useRef } from "react";
import { CLIENTS, BUS, MODES, TEAMS, LOCATIONS, START_DATE_OPTIONS, PRIORITIES, STATUS_COLORS, PRIORITY_COLORS } from "../constants/StringConstants.js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyOpportunity = () => ({
    id: crypto.randomUUID(),
    client: "",
    bu: "",
    mode: "",
    team: "",
    skill: "",
    month: "",
    reqDate: "",
    jdFile: null,
    jdFileName: "",
    location: "",
    noOfPositions: "",
    experience: "",
    expectedStartDate: "",
    technicalPoc: "",
    priority: "",
    doableHeadCount: "",
    vertical: "",
    accountManager: "",
    status: "",
    description: "",
    internalProfilesShared: "",
    partnerProfilesShared: "",
    namesProfilesShared: "",
    namesProfilesInterviewed: "",
    screeningFeedback: "",
    interviewFeedback: "",
    createdAt: new Date().toISOString(),
});

function Field({ label, required, children }) {
    return (
        <div className="ot-field">
            <label className="ot-label">
                {label}{required && <span className="ot-required">*</span>}
            </label>
            {children}
        </div>
    );
}

function Select({ value, onChange, options, placeholder }) {
    return (
        <select className="ot-input" value={value} onChange={e => onChange(e.target.value)}>
            <option value="">{placeholder || "Select…"}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    );
}

function Input({ value, onChange, placeholder, type = "text" }) {
    return (
        <input
            className="ot-input"
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || ""}
        />
    );
}

function Textarea({ value, onChange, placeholder, rows = 3 }) {
    return (
        <textarea
            className="ot-input ot-textarea"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || ""}
            rows={rows}
        />
    );
}

// ─── Opportunity Form ─────────────────────────────────────────────────────────

function OppForm({ initial, onSave, onCancel }) {
    const [form, setForm] = useState(initial || emptyOpportunity());
    const fileRef = useRef();

    const set = (key) => (val) => setForm(p => ({ ...p, [key]: val }));

    const handleFile = (e) => {
        const f = e.target.files[0];
        if (!f) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            setForm(p => ({ ...p, jdFile: ev.target.result, jdFileName: f.name }));
        };
        reader.readAsDataURL(f);
    };

    const handleSubmit = () => {
        console.log(form, "hehehehh")
        // if (!form.client || !form.status) {
        //     alert("Client and Status are required.");
        //     return;
        // }
        onSave(form);
    };

    const Section = ({ title, icon }) => (
        <div className="ot-section-header">
            <span className="ot-section-icon">{icon}</span>
            <span className="ot-section-title">{title}</span>
        </div>
    );

    return (
        <div className="ot-form-wrap">
            <div className="ot-form-topbar">
                <h2 className="ot-form-heading">
                    {initial?.client ? `Edit — ${initial.client}` : "New Opportunity"}
                </h2>
                <button className="ot-close-btn" onClick={onCancel}>✕</button>
            </div>

            <div className="ot-form-body">
                {/* ── Section 1: Engagement Details ── */}
                <Section title="Engagement Details" icon="📋" />
                <div className="ot-grid-2">
                    <Field label="Client" required>
                        <div className="search-select">
                            <input
                                type="text"
                                value={form.client}
                                onChange={(e) => set("client")(e.target.value)}
                                placeholder="Type at least 3 letters..."
                                className="search-input"
                            />

                            {form.client.length >= 3 && (
                                <div className="search-dropdown">
                                    {CLIENTS
                                        .filter(client =>
                                            client.toLowerCase().includes(form.client.toLowerCase())
                                        )
                                        .map(client => (
                                            <div
                                                key={client}
                                                className="search-option"
                                                onClick={() => set("client")(client)}
                                            >
                                                {client}
                                            </div>
                                        ))}
                                </div>
                            )}
                        </div>
                    </Field>
                    <Field label="BU">
                        <Select value={form.bu} onChange={set("bu")} options={BUS} />
                    </Field>
                    <Field label="Mode">
                        <Select value={form.mode} onChange={set("mode")} options={MODES} />
                    </Field>
                    <Field label="Team">
                        <Select value={form.team} onChange={set("team")} options={TEAMS} />
                    </Field>
                </div>

                {/* ── Section 2: Requisition ── */}
                <Section title="Requisition" icon="🏢" />
                <div className="ot-grid-2">
                    <Field label="Skill" required>
                        <Input value={form.skill} onChange={set("skill")} placeholder="e.g. RTL Design, DFT…" />
                    </Field>
                    <Field label="Month">
                        <Input value={form.month} onChange={set("month")} placeholder="e.g. January" />
                    </Field>
                    <Field label="Req Date">
                        <Input value={form.reqDate} onChange={set("reqDate")} placeholder="DD-MM-YYYY" />
                    </Field>
                    <Field label="Location">
                        <Select value={form.location} onChange={set("location")} options={LOCATIONS} />
                    </Field>
                    <Field label="No of Positions">
                        <Input value={form.noOfPositions} onChange={set("noOfPositions")} placeholder="e.g. 5" />
                    </Field>
                    <Field label="Experience">
                        <Input value={form.experience} onChange={set("experience")} placeholder="e.g. 3–5 years" />
                    </Field>
                    <Field label="Expected Start Date">
                        <Select value={form.expectedStartDate} onChange={set("expectedStartDate")} options={START_DATE_OPTIONS} />
                    </Field>
                    <Field label="Technical POC">
                        <Input value={form.technicalPoc} onChange={set("technicalPoc")} placeholder="Name of technical point of contact" />
                    </Field>
                    <Field label="Priority">
                        <Select value={form.priority} onChange={set("priority")} options={PRIORITIES} />
                    </Field>
                    <Field label="Doable Head Count">
                        <Input value={form.doableHeadCount} onChange={set("doableHeadCount")} placeholder="e.g. 3" />
                    </Field>
                    <Field label="JD Upload (PDF / Word / any format)">
                        <div className="ot-file-row">
                            <button type="button" className="ot-upload-btn" onClick={() => fileRef.current.click()}>
                                📎 {form.jdFileName ? form.jdFileName : "Choose file…"}
                            </button>
                            {form.jdFileName && (
                                <button type="button" className="ot-remove-file" onClick={() => setForm(p => ({ ...p, jdFile: null, jdFileName: "" }))}>✕</button>
                            )}
                            <input ref={fileRef} type="file" style={{ display: "none" }} onChange={handleFile} />
                        </div>
                    </Field>
                </div>
            </div>

            {/* ── Footer ── */}
            <div className="ot-form-footer">
                <button className="btn-ghost" onClick={onCancel}>Cancel</button>
                <button className="ot-save-btn" onClick={handleSubmit}>
                    {initial?.client ? "Update Opportunity" : "Save Opportunity"}
                </button>
            </div>
        </div>
    );
}

// ─── Status / Priority badges ─────────────────────────────────────────────────

function StatusBadge({ value, map }) {
    if (!value) return <span className="ot-badge-empty">—</span>;
    const s = map[value] || { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" };
    return (
        <span className="ot-badge" style={{ background: s.bg, color: s.color }}>
            <span className="ot-badge-dot" style={{ background: s.dot }} />
            {value}
        </span>
    );
}

// ─── Opportunity Card (list view) ─────────────────────────────────────────────

function OppCard({ opp, onEdit, onDelete }) {
    const [expanded, setExpanded] = useState(false);
    return (
        <div className={`ot-card ${expanded ? "ot-card-expanded" : ""}`}>
            <div className="ot-card-top" onClick={() => setExpanded(p => !p)}>
                <div className="ot-card-left">
                    <span className="ot-card-client">{opp.client || "—"}</span>
                    {opp.vertical && <span className="ot-card-vert">{opp.vertical}</span>}
                    {opp.skill && <span className="ot-card-skill">{opp.skill}</span>}
                    {opp.location && <span className="ot-card-locs">{opp.location}</span>}
                </div>
                <div className="ot-card-right">
                    <StatusBadge value={opp.status} map={STATUS_COLORS} />
                    <StatusBadge value={opp.priority} map={PRIORITY_COLORS} />
                    <span className="ot-card-am">{opp.accountManager || "—"}</span>
                    <span className="ot-expand-icon">{expanded ? "▲" : "▼"}</span>
                </div>
            </div>

            {expanded && (
                <div className="ot-card-body">
                    <div className="ot-detail-grid">
                        {[
                            ["BU", opp.bu],
                            ["Mode", opp.mode],
                            ["Team", opp.team],
                            ["Month", opp.month],
                            ["Req Date", opp.reqDate],
                            ["Expected Start", opp.expectedStartDate],
                            ["No of Positions", opp.noOfPositions],
                            ["Experience", opp.experience],
                            ["Doable HC", opp.doableHeadCount],
                            ["Technical POC", opp.technicalPoc],
                            ["Internal Profiles", opp.internalProfilesShared],
                            ["Partner Profiles", opp.partnerProfilesShared],
                        ].filter(([, v]) => v).map(([k, v]) => (
                            <div key={k} className="ot-detail-item">
                                <span className="ot-detail-key">{k}</span>
                                <span className="ot-detail-val">{v}</span>
                            </div>
                        ))}
                    </div>
                    {opp.description && (
                        <div className="ot-detail-block">
                            <span className="ot-detail-key">Description</span>
                            <p className="ot-detail-text">{opp.description}</p>
                        </div>
                    )}
                    {opp.namesProfilesShared && (
                        <div className="ot-detail-block">
                            <span className="ot-detail-key">Profiles Shared</span>
                            <p className="ot-detail-text">{opp.namesProfilesShared}</p>
                        </div>
                    )}
                    {opp.namesProfilesInterviewed && (
                        <div className="ot-detail-block">
                            <span className="ot-detail-key">Profiles Interviewed</span>
                            <p className="ot-detail-text">{opp.namesProfilesInterviewed}</p>
                        </div>
                    )}
                    {opp.screeningFeedback && (
                        <div className="ot-detail-block">
                            <span className="ot-detail-key">Screening Feedback</span>
                            <p className="ot-detail-text">{opp.screeningFeedback}</p>
                        </div>
                    )}
                    {opp.interviewFeedback && (
                        <div className="ot-detail-block">
                            <span className="ot-detail-key">Interview Feedback</span>
                            <p className="ot-detail-text">{opp.interviewFeedback}</p>
                        </div>
                    )}
                    {opp.jdFileName && (
                        <div className="ot-detail-block">
                            <span className="ot-detail-key">JD File</span>
                            <a href={opp.jdFile} download={opp.jdFileName} className="ot-jd-link">
                                📎 {opp.jdFileName}
                            </a>
                        </div>
                    )}
                    <div className="ot-card-actions">
                        <button className="btn-edit" onClick={() => onEdit(opp)}>✏️ Edit</button>
                        <button className="btn-danger" onClick={() => onDelete(opp.id)}>🗑️ Delete</button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Filters bar ──────────────────────────────────────────────────────────────

function FiltersBar({ filters, setFilters, opps }) {
    return (
        <div className="ot-filters">
            <input
                className="ot-filter-search"
                placeholder="🔍 Search client, skill, POC…"
                value={filters.search}
                onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
            />
        </div>
    );
}

// ─── Main OpportunityTracker ──────────────────────────────────────────────────

export default function OpportunityTracker({ onToast, setActiveForm }) {
    const [opps, setOpps] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingOpp, setEditingOpp] = useState(null);
    const [deletingId, setDeletingId] = useState(null);
    const [filters, setFilters] = useState({ status: "", priority: "", client: "", am: "", search: "" });

    const handleSave = (opp) => {
        if (editingOpp) {
            setOpps(p => p.map(o => o.id === opp.id ? opp : o));
            onToast?.("Opportunity updated ✓");
        } else {
            setOpps(p => [opp, ...p]);
            onToast?.("Opportunity saved ✓");
        }
        setShowForm(false);
        setEditingOpp(null);
    };

    const startEdit = (opp) => { setEditingOpp(opp); setShowForm(true); };
    const doDelete = (id) => { setOpps(p => p.filter(o => o.id !== id)); setDeletingId(null); onToast?.("Deleted ✓"); };

    const filtered = opps.filter(o => {
        if (filters.status && o.status !== filters.status) return false;
        if (filters.priority && o.priority !== filters.priority) return false;
        if (filters.client && o.client !== filters.client) return false;
        if (filters.am && o.accountManager !== filters.am) return false;
        if (filters.search) {
            const q = filters.search.toLowerCase();
            if (![o.client, o.skill, o.technicalPoc, o.bu, o.description].some(v => (v || "").toLowerCase().includes(q))) return false;
        }
        return true;
    });

    const open = opps.filter(o => o.status === "Open").length;
    const closedSS = opps.filter(o => o.status === "Closed by SS").length;
    const high = opps.filter(o => o.priority === "High").length;
    const totalPositions = opps.reduce((s, o) => s + (parseInt(o.noOfPositions) || 0), 0);

    return (
        <>
            <button
                className="btn-back"
                onClick={() => setActiveForm(null)}
            >
                ← Back
            </button>
            <div className="ot-page-header">
                <h1 className="ot-page-title">SmartSocs Opportunity Tracker</h1>
                <p className="ot-page-subtitle">Recruitment and business opportunity dashboard</p>
            </div>

            {/* Form modal */}
            {showForm && (
                <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingOpp(null); }}>
                    <div
                        className="modal"
                        style={{ maxWidth: 780, width: "100%", padding: 0, maxHeight: "92vh", overflowY: "auto", borderRadius: "var(--border-radius-lg, 12px)" }}
                        onClick={e => e.stopPropagation()}
                    >
                        <OppForm
                            initial={editingOpp}
                            onSave={handleSave}
                            onCancel={() => { setShowForm(false); setEditingOpp(null); }}
                        />
                    </div>
                </div>
            )}

            {/* Delete confirm */}
            {deletingId && (
                <div className="modal-overlay">
                    <div className="modal">
                        <p style={{ fontWeight: 600, marginBottom: 8 }}>Delete this opportunity?</p>
                        <p className="muted" style={{ marginBottom: 16 }}>This action cannot be undone.</p>
                        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                            <button className="btn-ghost" onClick={() => setDeletingId(null)}>Cancel</button>
                            <button className="btn-danger" onClick={() => doDelete(deletingId)}>Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Metrics */}
            <div className="metric-grid" style={{ marginBottom: 16 }}>
                <div className="metric-card blue"><span className="metric-value">{open}</span><span className="metric-label">Open</span></div>
                <div className="metric-card green"><span className="metric-value">{closedSS}</span><span className="metric-label">Closed by SS</span></div>
                <div className="metric-card amber"><span className="metric-value">{high}</span><span className="metric-label">High Priority</span></div>
                <div className="metric-card neutral"><span className="metric-value">{totalPositions}</span><span className="metric-label">Total Positions</span></div>
            </div>

            {/* Action bar */}
            <div className="ot-action-bar">
                <FiltersBar filters={filters} setFilters={setFilters} opps={opps} />
                <button className="ot-new-btn" onClick={() => { setEditingOpp(null); setShowForm(true); }}>
                    + New Opportunity
                </button>
            </div>

            {filtered.length === 0 ? (
                <div className="empty">
                    {opps.length === 0
                        ? "No opportunities yet. Click \"+ New Opportunity\" to add one."
                        : "No opportunities match the current filters."}
                </div>
            ) : (
                <div className="ot-list">
                    {filtered.map(o => (
                        <OppCard key={o.id} opp={o} onEdit={startEdit} onDelete={(id) => setDeletingId(id)} />
                    ))}
                </div>
            )}
        </>
    );
}