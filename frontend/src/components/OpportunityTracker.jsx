import { useState, useRef, useCallback } from "react";
import { CLIENTS, BUS, MODES, TEAMS, LOCATIONS, START_DATE_OPTIONS, PRIORITIES, STATUS_COLORS, PRIORITY_COLORS } from "../constants/StringConstants.js";
import { CREATE_OPPORTUNITY, UPLOAD_JD, GET_OPPORTUNITY } from "../api/endpoints";
import { postFile } from "../api/clients";
import { useEffect } from "react";
// ─── Helpers ─────────────────────────────────────────────────────────────────

const emptyOpportunity = () => ({
    client: "",
    BU: "",
    mode: "",
    team: "",
    skill: "",
    month: "",
    reqdate: "",
    location: "",
    no_of_positions: 0,
    experience: "",
    start_date: "",
    technical_poc: "",
    priority: "",
    doable_headcount: 0,
    file_id: "",
    jdFileUrl: "",
    jdFileName: "",
    createdAt: new Date().toISOString(),
});

async function uploadToAWS(file) {
    try {
        const formData = new FormData();
        formData.append("file", file);
        const data = await postFile(UPLOAD_JD, formData);
        return data;
    } catch (error) {
        console.error("Upload error:", error);
        throw error;
    }
}

// ─── JD Upload Popup ──────────────────────────────────────────────────────────

function JDUploadPopup({ onClose, onUploadComplete }) {
    const [dragOver, setDragOver] = useState(false);
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploadedUrl, setUploadedUrl] = useState("");
    const [error, setError] = useState("");
    const inputRef = useRef();
    const [uploadedData, setUploadedData] = useState(null);

    const handleFile = (f) => {
        if (!f) return;
        setFile(f);
        setUploadedUrl("");
        setError("");
        setProgress(0);
    };

    const handleDrop = useCallback((e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f) handleFile(f);
    }, []);

    const handleUpload = async () => {
        if (!file) return;
        setUploading(true);
        setError("");
        const ticker = setInterval(() => {
            setProgress((p) => Math.min(p + Math.random() * 25, 90));
        }, 400);

        try {
            const response = await uploadToAWS(file);
            clearInterval(ticker);
            setProgress(100);
            // backend actual payload
            const uploaded = response.data;
            setUploadedUrl(uploaded.s3_url || "");
            setUploadedData(uploaded);
        } catch (err) {
            clearInterval(ticker);
            setError(
                err.message || "Upload failed. Please try again."
            );
        } finally {
            setUploading(false);
        }
    };
    const handleConfirm = () => {
        if (uploadedData) {

            onUploadComplete({
                fileName: uploadedData.file_name,
                fileId: uploadedData.file_id,
                fileUrl: uploadedData.s3_url,
            });

            onClose();
        }
    };

    return (
        <div className="jd-overlay" onClick={onClose}>
            <div className="jd-popup" onClick={(e) => e.stopPropagation()}>
                <div className="jd-popup-header">
                    <span className="jd-popup-title">📎 Upload JD File</span>
                    <button className="jd-close" onClick={onClose}>✕</button>
                </div>

                <div className="jd-popup-body">
                    <div
                        className={`jd-dropzone ${dragOver ? "jd-dropzone-active" : ""} ${file ? "jd-dropzone-filled" : ""}`}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleDrop}
                        onClick={() => !file && inputRef.current.click()}
                    >
                        <input
                            ref={inputRef}
                            type="file"
                            style={{ display: "none" }}
                            onChange={(e) => handleFile(e.target.files[0])}
                        />
                        {file ? (
                            <div className="jd-file-chosen">
                                <span className="jd-file-icon">📄</span>
                                <div>
                                    <div className="jd-file-name">{file.name}</div>
                                    <div className="jd-file-size">{(file.size / 1024).toFixed(1)} KB</div>
                                </div>
                                {!uploading && !uploadedUrl && (
                                    <button className="jd-remove-file" onClick={(e) => { e.stopPropagation(); setFile(null); setProgress(0); }}>✕</button>
                                )}
                            </div>
                        ) : (
                            <div className="jd-drop-hint">
                                <div className="jd-drop-icon">☁️</div>
                                <div className="jd-drop-text">Drag & drop or <span className="jd-browse-link">browse</span></div>
                                <div className="jd-drop-sub">PDF, Word, or any format</div>
                            </div>
                        )}
                    </div>

                    {(uploading || progress > 0) && (
                        <div className="jd-progress-wrap">
                            <div className="jd-progress-bar">
                                <div className="jd-progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                            <span className="jd-progress-label">
                                {progress < 100 ? `Uploading… ${Math.round(progress)}%` : "✅ Upload complete"}
                            </span>
                        </div>
                    )}

                    {error && <div className="jd-error">{error}</div>}
                </div>

                <div className="jd-popup-footer">
                    <button className="btn-ghost" onClick={onClose}>Cancel</button>
                    {!uploadedUrl ? (
                        <button className="jd-upload-btn" onClick={handleUpload} disabled={!file || uploading}>
                            {uploading ? "Uploading…" : "Upload"}
                        </button>
                    ) : (
                        <button className="ot-save-btn" onClick={handleConfirm}>✓ Use This File</button>
                    )}
                </div>
            </div>

            <style>{`
                .jd-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;backdrop-filter:blur(2px); }
                .jd-popup { background:#fff;border-radius:14px;width:min(480px,94vw);box-shadow:0 24px 60px rgba(0,0,0,0.22);overflow:hidden;animation:jdSlideIn 0.2s ease; }
                @keyframes jdSlideIn { from{opacity:0;transform:translateY(16px) scale(0.97)} to{opacity:1;transform:translateY(0) scale(1)} }
                .jd-popup-header { display:flex;align-items:center;justify-content:space-between;padding:18px 22px 14px;border-bottom:1px solid #f0f0f0; }
                .jd-popup-title { font-weight:700;font-size:15px;color:#111; }
                .jd-close { background:none;border:none;cursor:pointer;font-size:16px;color:#6b7280;padding:2px 6px;border-radius:6px;transition:background 0.15s; }
                .jd-close:hover { background:#f3f4f6; }
                .jd-popup-body { padding:20px 22px;display:flex;flex-direction:column;gap:14px; }
                .jd-dropzone { border:2px dashed #d1d5db;border-radius:10px;padding:32px 20px;text-align:center;cursor:pointer;transition:border-color 0.2s,background 0.2s;background:#fafafa; }
                .jd-dropzone:hover { border-color:#6366f1;background:#f5f3ff; }
                .jd-dropzone-active { border-color:#6366f1;background:#eef2ff; }
                .jd-dropzone-filled { cursor:default;background:#f9fafb; }
                .jd-drop-icon { font-size:32px;margin-bottom:8px; }
                .jd-drop-text { font-size:14px;color:#374151;margin-bottom:4px; }
                .jd-browse-link { color:#6366f1;font-weight:600;text-decoration:underline;cursor:pointer; }
                .jd-drop-sub { font-size:12px;color:#9ca3af; }
                .jd-file-chosen { display:flex;align-items:center;gap:12px;text-align:left; }
                .jd-file-icon { font-size:28px; }
                .jd-file-name { font-size:13px;font-weight:600;color:#111;word-break:break-all; }
                .jd-file-size { font-size:11px;color:#9ca3af;margin-top:2px; }
                .jd-remove-file { margin-left:auto;background:none;border:none;font-size:13px;color:#9ca3af;cursor:pointer;padding:4px 8px;border-radius:6px; }
                .jd-remove-file:hover { background:#fee2e2;color:#dc2626; }
                .jd-progress-wrap { display:flex;flex-direction:column;gap:6px; }
                .jd-progress-bar { width:100%;height:6px;background:#e5e7eb;border-radius:99px;overflow:hidden; }
                .jd-progress-fill { height:100%;background:linear-gradient(90deg,#6366f1,#8b5cf6);border-radius:99px;transition:width 0.3s ease; }
                .jd-progress-label { font-size:12px;color:#6b7280; }
                .jd-url-box { background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:10px 14px;display:flex;flex-direction:column;gap:4px; }
                .jd-url-label { font-size:11px;font-weight:700;color:#15803d;text-transform:uppercase;letter-spacing:0.05em; }
                .jd-url-value { font-size:12px;color:#166534;word-break:break-all;font-family:monospace; }
                .jd-error { background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:10px 14px;font-size:13px;color:#dc2626; }
                .jd-popup-footer { display:flex;justify-content:flex-end;gap:10px;padding:14px 22px 18px;border-top:1px solid #f0f0f0; }
                .jd-upload-btn { background:#6366f1;color:#fff;border:none;border-radius:8px;padding:8px 20px;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.15s; }
                .jd-upload-btn:hover:not(:disabled) { background:#4f46e5; }
                .jd-upload-btn:disabled { opacity:0.55;cursor:not-allowed; }
            `}</style>
        </div>
    );
}

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

// ─── Opportunity Form ─────────────────────────────────────────────────────────

function OppForm({ initial, onSave, onCancel }) {
    const [form, setForm] = useState(initial || emptyOpportunity());
    const [showClientDropdown, setShowClientDropdown] = useState(false);
    const [showUploadPopup, setShowUploadPopup] = useState(false);
    const [loading, setLoading] = useState(false);

    const set = (key) => (val) =>
        setForm((p) => ({ ...p, [key]: val }));

    // ─── Upload Complete ─────────────────────────────
    const handleUploadComplete = ({
        fileName,
        fileId,
        fileUrl,
    }) => {
        setForm((p) => ({
            ...p,
            jdFileName: fileName,
            file_id: fileId,
            jdFileUrl: fileUrl,
        }));
    };
    // ─── Submit ──────────────────────────────────────
    const handleSubmit = async () => {
        try {
            setLoading(true);
            const response = await fetch(CREATE_OPPORTUNITY, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(form),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(
                    data?.message || "Failed to create opportunity"
                );
            }
            onSave?.(data);
        } catch (error) {
            console.error("Error:", error.message);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    const Section = ({ title, icon }) => (
        <div className="ot-section-header">
            <span className="ot-section-icon">{icon}</span>
            <span className="ot-section-title">{title}</span>
        </div>
    );

    return (
        <>
            {showUploadPopup && (
                <JDUploadPopup
                    onClose={() => setShowUploadPopup(false)}
                    onUploadComplete={handleUploadComplete}
                />
            )}

            <div className="ot-form-wrap">

                {/* ─── Header ───────────────────────── */}
                <div className="ot-form-topbar">
                    <h2 className="ot-form-heading">
                        {initial?.client
                            ? `Edit — ${initial.client}`
                            : "New Opportunity"}
                    </h2>

                    <button
                        className="ot-close-btn"
                        onClick={onCancel}
                    >
                        ✕
                    </button>
                </div>

                <div className="ot-form-body">

                    {/* ─── Engagement Details ───────────────── */}
                    <Section title="Engagement Details" icon="📋" />

                    <div className="ot-grid-2">

                        {/* Client */}
                        <Field label="Client" required>
                            <div className="search-select">

                                <input
                                    type="text"
                                    value={form.client}
                                    onChange={(e) => {
                                        const value = e.target.value;

                                        set("client")(value);

                                        setShowClientDropdown(
                                            value.length >= 3
                                        );
                                    }}
                                    placeholder="Type at least 3 letters..."
                                    className="search-input"
                                />

                                {showClientDropdown && (
                                    <div className="search-dropdown">

                                        {CLIENTS
                                            .filter((client) =>
                                                client
                                                    .toLowerCase()
                                                    .includes(
                                                        form.client.toLowerCase()
                                                    )
                                            )
                                            .map((client) => (
                                                <div
                                                    key={client}
                                                    className="search-option"
                                                    onClick={() => {
                                                        set("client")(client);
                                                        setShowClientDropdown(false);
                                                    }}
                                                >
                                                    {client}
                                                </div>
                                            ))}
                                    </div>
                                )}
                            </div>
                        </Field>

                        {/* BU */}
                        <Field label="BU">
                            <Select
                                value={form.BU}
                                onChange={set("BU")}
                                options={BUS}
                            />
                        </Field>

                        {/* Mode */}
                        <Field label="Mode">
                            <Select
                                value={form.mode}
                                onChange={set("mode")}
                                options={MODES}
                            />
                        </Field>

                        {/* Team */}
                        <Field label="Team">
                            <Select
                                value={form.team}
                                onChange={set("team")}
                                options={TEAMS}
                            />
                        </Field>
                    </div>

                    {/* ─── Requisition ───────────────────────── */}
                    <Section title="Requisition" icon="🏢" />

                    <div className="ot-grid-2">

                        {/* Skill */}
                        <Field label="Skill" required>
                            <Input
                                value={form.skill}
                                onChange={set("skill")}
                                placeholder="e.g. RTL Design, DFT…"
                            />
                        </Field>

                        {/* Month */}
                        <Field label="Month">
                            <Input
                                value={form.month}
                                onChange={set("month")}
                                placeholder="e.g. January"
                            />
                        </Field>

                        {/* Req Date */}
                        <Field label="Req Date">
                            <Input
                                type="date"
                                value={form.reqdate}
                                onChange={set("reqdate")}
                            />
                        </Field>

                        {/* Location */}
                        <Field label="Location">
                            <Select
                                value={form.location}
                                onChange={set("location")}
                                options={LOCATIONS}
                            />
                        </Field>

                        {/* No of Positions */}
                        <Field label="No of Positions">
                            <Input
                                type="number"
                                value={form.no_of_positions}
                                onChange={set("no_of_positions")}
                                placeholder="e.g. 5"
                            />
                        </Field>

                        {/* Experience */}
                        <Field label="Experience">
                            <Input
                                value={form.experience}
                                onChange={set("experience")}
                                placeholder="e.g. 3–5 years"
                            />
                        </Field>

                        {/* Start Date */}
                        <Field label="Expected Start Date">
                            <Input
                                type="date"
                                value={form.start_date}
                                onChange={set("start_date")}
                            />
                        </Field>

                        {/* Technical POC */}
                        <Field label="Technical POC">
                            <Input
                                value={form.technical_poc}
                                onChange={set("technical_poc")}
                                placeholder="Name of technical point of contact"
                            />
                        </Field>

                        {/* Priority */}
                        <Field label="Priority">
                            <Select
                                value={form.priority}
                                onChange={set("priority")}
                                options={PRIORITIES}
                            />
                        </Field>

                        {/* Doable Head Count */}
                        <Field label="Doable Head Count">
                            <Input
                                type="number"
                                value={form.doable_headcount}
                                onChange={set("doable_headcount")}
                                placeholder="e.g. 3"
                            />
                        </Field>

                        {/* JD Upload */}
                        <Field label="JD Upload (PDF / Word / any format)">
                            <div className="ot-file-row">

                                <button
                                    type="button"
                                    className="ot-upload-btn"
                                    onClick={() =>
                                        setShowUploadPopup(true)
                                    }
                                >
                                    📎 {
                                        form.jdFileName
                                            ? form.jdFileName
                                            : "Choose file…"
                                    }
                                </button>

                                {form.jdFileName && (
                                    <button
                                        type="button"
                                        className="ot-remove-file"
                                        onClick={() =>
                                            setForm((p) => ({
                                                ...p,
                                                jdFileName: "",
                                                file_id: "",
                                            }))
                                        }
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </Field>
                    </div>
                </div>

                {/* ─── Footer ───────────────────────── */}
                <div className="ot-form-footer">

                    <button
                        className="btn-ghost"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <button
                        className="ot-save-btn"
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading
                            ? "Saving..."
                            : initial?.client
                                ? "Update Opportunity"
                                : "Save Opportunity"}
                    </button>
                </div>
            </div>
        </>
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
                            <a href={opp.file_id} target="_blank" rel="noreferrer" className="ot-jd-link">
                                {/* <a href={opp.jdFileUrl} download={opp.jdFileName} className="ot-jd-link"> */}
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
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchOpportunities = async () => {
            try {
                setLoading(true);
                const response = await fetch(GET_OPPORTUNITY);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || `Failed to fetch opportunities`);
                }

                setOpps(data.data.items);
            } catch (error) {
                console.error("Fetch opportunities error:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchOpportunities();
    }, []);

    const handleSave = (apiResponse) => {
        if (editingOpp) {
            const updated = apiResponse.data;
            setOpps(p => p.map(o => o.opportunity_id === updated.opportunity_id ? updated : o));
            onToast?.("Opportunity updated ✓");
        } else {
            const created = apiResponse.data;
            setOpps(p => [created, ...p]);
            onToast?.("Opportunity saved ✓");
        }
        setShowForm(false);
        setEditingOpp(null);
    };

    // const handleSave = (opp) => {
    //     if (editingOpp) {
    //         setOpps(p => p.map(o => o.opportunity_id === opp.opportunity_id ? opp : o));
    //         onToast?.("Opportunity updated ✓");
    //     } else {
    //         setOpps(p => [opp, ...p]);
    //         onToast?.("Opportunity saved ✓");
    //     }
    //     setShowForm(false);
    //     setEditingOpp(null);
    // };

    const startEdit = (opp) => { setEditingOpp(opp); setShowForm(true); };
    const doDelete = (id) => { setOpps(p => p.filter(o => o.opportunity_id !== id)); setDeletingId(null); onToast?.("Deleted ✓"); };

    const filtered = opps.filter(o => {
        if (filters.status && o.status !== filters.status) return false;
        if (filters.priority && o.priority !== filters.priority) return false;
        if (filters.client && o.client !== filters.client) return false;
        if (filters.search) {
            const q = filters.search.toLowerCase();
            if (![o.client, o.skill, o.technical_poc, o.BU].some(v => (v || "").toLowerCase().includes(q))) return false;
        }
        return true;
    });

    return (
        <>
            <div className="ot-page-header">
                <div className="ot-title-row">
                    <span className="ot-back-arrow" onClick={() => setActiveForm(null)}>{"<"}</span>
                    <h1 className="ot-page-title">SmartSocs Opportunity Tracker</h1>
                </div>
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

            {/* Action bar */}
            <div className="ot-action-bar">
                <FiltersBar filters={filters} setFilters={setFilters} opps={opps} />
                <button className="ot-new-btn" onClick={() => { setEditingOpp(null); setShowForm(true); }}>
                    + New Opportunity
                </button>
            </div>

            {/* List */}
            {loading ? (
                <div className="empty">Loading opportunities…</div>
            ) : filtered.length === 0 ? (
                <div className="empty">
                    {opps.length === 0
                        ? "No opportunities yet. Click \"+ New Opportunity\" to add one."
                        : "No opportunities match the current filters."}
                </div>
            ) : (
                <div className="ot-list">
                    {filtered.map(o => (
                        <OppCard key={o.opportunity_id} opp={o} onEdit={startEdit} onDelete={(id) => setDeletingId(id)} />
                    ))}
                </div>
            )}
        </>
    );
}