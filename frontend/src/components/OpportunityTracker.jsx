import { useState, useRef } from "react";

// ─── Constants ───────────────────────────────────────────────────────────────

const CLIENTS = [
    "ADI", "Aion Semi", "Alphawave", "Amazon", "AMD Bangalore", "AMD Hyderabad",
    "Auradine", "Axiado", "Baya Systems", "Big endian", "Broadcom", "Cadence",
    "Cerebras System", "CEVA", "Cisco", "EU Client", "Google", "Green PMU", "GUC",
    "HydWyr", "Microchip", "Micron", "NextSilicon", "Nokia", "NXP", "Omni",
    "Qualcomm", "Samsung", "Sandisk", "SemiDynamics", "Sifive", "Silicon Labs",
    "Synopsys", "Tenstorrent", "TI", "Xilinx",
];

const LOCATIONS = ["Bangalore", "Hyderabad", "Noida", "Pune", "Hubli", "Chennai", "Global"];

const VERTICALS = ["AD", "AL", "DFT", "DV", "Emulation & Validation", "Emulation & Verification", "PD", "PSV", "RTL"];

const AMS = ["Jaibhima", "Sangita", "Sathvik", "Shalini", "Shantaveeresh", "Shubha", "Subhashini", "Sweatha M"];

const STATUS_COLORS = {
    "Open": { bg: "#dcfce7", color: "#15803d", dot: "#16a34a" },
    "Closed by SS": { bg: "#dbeafe", color: "#1d4ed8", dot: "#2563eb" },
    "Closed by Others": { bg: "#fee2e2", color: "#b91c1c", dot: "#dc2626" },
};

const PRIORITY_COLORS = {
    "High": { bg: "#fef3c7", color: "#92400e", dot: "#d97706" },
    "Medium": { bg: "#e0f2fe", color: "#075985", dot: "#0284c7" },
    "Low": { bg: "#f3f4f6", color: "#374151", dot: "#6b7280" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyOpportunity = () => ({
    id: crypto.randomUUID(),
    globalized: "",
    mode: "",
    ceipalId: "",
    statusCeipal: "",
    source: "",
    month: "",
    reqDate: "",
    locations: [],
    client: "",
    managerBU: "",
    skill: "",
    description: "",
    jdFile: null,
    jdFileName: "",
    vertical: "",
    technicalPoc: "",
    accountManager: "",
    experience: "",
    expRange: "",
    totalHeadCount: "",
    doableHeadCount: "",
    filledBySmartSoCs: "",
    pendingOpenPositions: "",
    passThrough: "",
    expectedStartDate: "",
    status: "",
    priority: "",
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

function MultiSelect({ selected, onChange, options }) {
    const toggle = (loc) => {
        onChange(selected.includes(loc)
            ? selected.filter(l => l !== loc)
            : [...selected, loc]);
    };
    return (
        <div className="ot-multiselect">
            {options.map(loc => (
                <button
                    key={loc}
                    type="button"
                    className={`ot-chip ${selected.includes(loc) ? "ot-chip-active" : ""}`}
                    onClick={() => toggle(loc)}
                >
                    {selected.includes(loc) && <span className="ot-chip-check">✓</span>}
                    {loc}
                </button>
            ))}
        </div>
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
        if (!form.client || !form.status) {
            alert("Client and Status are required.");
            return;
        }
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

                {/* ── Engagement Details ── */}
                <Section title="Engagement Details" icon="📋" />
                <div className="ot-grid-2">
                    <Field label="Globalized" required>
                        <Select value={form.globalized} onChange={set("globalized")} options={["Domestic", "Global"]} />
                    </Field>
                    <Field label="Mode">
                        <Select value={form.mode} onChange={set("mode")} options={["T&M", "ODC"]} />
                    </Field>
                    <Field label="Source">
                        <Select value={form.source} onChange={set("source")} options={["Procurement", "Sales"]} />
                    </Field>
                    <Field label="Month">
                        <Input value={form.month} onChange={set("month")} placeholder="e.g. January" />
                    </Field>
                    <Field label="Req Date">
                        <Input value={form.reqDate} onChange={set("reqDate")} placeholder="DD-MM-YYYY" />
                    </Field>
                    <Field label="Expected Start Date">
                        <Input type="date" value={form.expectedStartDate} onChange={set("expectedStartDate")} />
                    </Field>
                </div>

                {/* ── Client Info ── */}
                <Section title="Client Information" icon="🏢" />
                <div className="ot-grid-2">
                    <Field label="Client" required>
                        <Select value={form.client} onChange={set("client")} options={CLIENTS} />
                    </Field>
                    <Field label="Manager / BU @ Client">
                        <Input value={form.managerBU} onChange={set("managerBU")} placeholder="e.g. John Doe / Compute BU" />
                    </Field>
                    <Field label="Technical POC">
                        <Input value={form.technicalPoc} onChange={set("technicalPoc")} placeholder="Technical point of contact" />
                    </Field>
                    <Field label="Account Manager">
                        <Select value={form.accountManager} onChange={set("accountManager")} options={AMS} />
                    </Field>
                </div>

                <Field label="Location (multi-select)">
                    <MultiSelect selected={form.locations} onChange={set("locations")} options={LOCATIONS} />
                </Field>

                {/* ── Role Details ── */}
                <Section title="Role Details" icon="🔧" />
                <div className="ot-grid-2">
                    <Field label="Vertical">
                        <Select value={form.vertical} onChange={set("vertical")} options={VERTICALS} />
                    </Field>
                    <Field label="Skill">
                        <Input value={form.skill} onChange={set("skill")} placeholder="e.g. RTL Design, DFT, STA…" />
                    </Field>
                    <Field label="Experience">
                        <Input value={form.experience} onChange={set("experience")} placeholder="e.g. 5 years" />
                    </Field>
                    <Field label="Exp Range">
                        <Input value={form.expRange} onChange={set("expRange")} placeholder="e.g. 4–8 years" />
                    </Field>
                </div>
                <Field label="Description">
                    <Textarea value={form.description} onChange={set("description")} placeholder="Role description…" rows={3} />
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

                {/* ── Ceipal ── */}
                <Section title="Ceipal Details" icon="🗂️" />
                <div className="ot-grid-2">
                    <Field label="Ceipal ID">
                        <Input value={form.ceipalId} onChange={set("ceipalId")} placeholder="Ceipal ID" />
                    </Field>
                    <Field label="Status as per Ceipal">
                        <Input value={form.statusCeipal} onChange={set("statusCeipal")} placeholder="e.g. Active, On Hold…" />
                    </Field>
                </div>

                {/* ── Head Count ── */}
                <Section title="Head Count" icon="👥" />
                <div className="ot-grid-3">
                    <Field label="Total Head Count">
                        <Input value={form.totalHeadCount} onChange={set("totalHeadCount")} placeholder="0" />
                    </Field>
                    <Field label="Doable Head Count">
                        <Input value={form.doableHeadCount} onChange={set("doableHeadCount")} placeholder="0" />
                    </Field>
                    <Field label="Filled by SmartSoCs">
                        <Input value={form.filledBySmartSoCs} onChange={set("filledBySmartSoCs")} placeholder="0" />
                    </Field>
                    <Field label="Pending Open Positions">
                        <Input value={form.pendingOpenPositions} onChange={set("pendingOpenPositions")} placeholder="0" />
                    </Field>
                    <Field label="Pass Through">
                        <Input value={form.passThrough} onChange={set("passThrough")} placeholder="0" />
                    </Field>
                </div>

                {/* ── Status & Priority ── */}
                <Section title="Status & Priority" icon="🎯" />
                <div className="ot-grid-2">
                    <Field label="Status" required>
                        <Select value={form.status} onChange={set("status")} options={["Open", "Closed by SS", "Closed by Others"]} />
                    </Field>
                    <Field label="Priority">
                        <Select value={form.priority} onChange={set("priority")} options={["High", "Medium", "Low"]} />
                    </Field>
                </div>

                {/* ── Profiles & Feedback ── */}
                <Section title="Profiles & Feedback" icon="📝" />
                <div className="ot-grid-2">
                    <Field label="No. of Internal / Market Profiles Shared">
                        <Input value={form.internalProfilesShared} onChange={set("internalProfilesShared")} placeholder="0" />
                    </Field>
                    <Field label="No. of Partner Profiles Shared">
                        <Input value={form.partnerProfilesShared} onChange={set("partnerProfilesShared")} placeholder="0" />
                    </Field>
                </div>
                <Field label="Names of Profiles Shared">
                    <Textarea value={form.namesProfilesShared} onChange={set("namesProfilesShared")} placeholder="Comma-separated names…" rows={2} />
                </Field>
                <Field label="Names of Profiles Interviewed">
                    <Textarea value={form.namesProfilesInterviewed} onChange={set("namesProfilesInterviewed")} placeholder="Comma-separated names…" rows={2} />
                </Field>
                <Field label="Screening Feedback">
                    <Textarea value={form.screeningFeedback} onChange={set("screeningFeedback")} placeholder="Screening notes…" rows={3} />
                </Field>
                <Field label="Interview Feedback">
                    <Textarea value={form.interviewFeedback} onChange={set("interviewFeedback")} placeholder="Interview notes…" rows={3} />
                </Field>
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
                    {opp.locations?.length > 0 && (
                        <span className="ot-card-locs">{opp.locations.join(", ")}</span>
                    )}
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
                            ["Globalized", opp.globalized],
                            ["Mode", opp.mode],
                            ["Source", opp.source],
                            ["Month", opp.month],
                            ["Req Date", opp.reqDate],
                            ["Expected Start", opp.expectedStartDate],
                            ["Ceipal ID", opp.ceipalId],
                            ["Status (Ceipal)", opp.statusCeipal],
                            ["Manager / BU", opp.managerBU],
                            ["Technical POC", opp.technicalPoc],
                            ["Experience", opp.experience],
                            ["Exp Range", opp.expRange],
                            ["Total HC", opp.totalHeadCount],
                            ["Doable HC", opp.doableHeadCount],
                            ["Filled by SS", opp.filledBySmartSoCs],
                            ["Pending Open", opp.pendingOpenPositions],
                            ["Pass Through", opp.passThrough],
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
                            <a
                                href={opp.jdFile}
                                download={opp.jdFileName}
                                className="ot-jd-link"
                            >
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
    const clients = [...new Set(opps.map(o => o.client).filter(Boolean))].sort();
    const ams = [...new Set(opps.map(o => o.accountManager).filter(Boolean))].sort();

    return (
        <>
            <div className="ot-filters">
                {/* <input
                    className="ot-filter-search"
                    placeholder="🔍 Search client, skill, POC…"
                    value={filters.search}
                    onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                />
                <select className="ot-filter-select" value={filters.status} onChange={e => setFilters(p => ({ ...p, status: e.target.value }))}>
                    <option value="">All Statuses</option>
                    {["Open", "Closed by SS", "Closed by Others"].map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="ot-filter-select" value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
                    <option value="">All Priorities</option>
                    {["High", "Medium", "Low"].map(s => <option key={s}>{s}</option>)}
                </select>
                <select className="ot-filter-select" value={filters.client} onChange={e => setFilters(p => ({ ...p, client: e.target.value }))}>
                    <option value="">All Clients</option>
                    {clients.map(c => <option key={c}>{c}</option>)}
                </select>
                <select className="ot-filter-select" value={filters.am} onChange={e => setFilters(p => ({ ...p, am: e.target.value }))}>
                    <option value="">All AMs</option>
                    {ams.map(a => <option key={a}>{a}</option>)}
                </select> */}
            </div>
        </>
    );
}

// ─── Main OpportunityTracker ──────────────────────────────────────────────────

export default function OpportunityTracker({ onToast }) {
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
            if (![o.client, o.skill, o.technicalPoc, o.managerBU, o.description].some(v => (v || "").toLowerCase().includes(q))) return false;
        }
        return true;
    });

    // Metrics
    const open = opps.filter(o => o.status === "Open").length;
    const closedSS = opps.filter(o => o.status === "Closed by SS").length;
    const high = opps.filter(o => o.priority === "High").length;
    const totalHC = opps.reduce((s, o) => s + (parseInt(o.totalHeadCount) || 0), 0);

    return (
        <>
            <div className="ot-page-header">
                <h1 className="ot-page-title">SmartSocs Opportunity Tracker</h1>
                <p className="ot-page-subtitle">
                   Recruitment and business opportunity dashboard
                </p>
            </div>
            {/* Form slide-over */}
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
                <div className="metric-card neutral"><span className="metric-value">{totalHC}</span><span className="metric-label">Total Head Count</span></div>
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
                        <OppCard
                            key={o.id}
                            opp={o}
                            onEdit={startEdit}
                            onDelete={(id) => setDeletingId(id)}
                        />
                    ))}
                </div>
            )}
        </>
    );
}