import { useState } from "react";
import { VERTICALS, SOURCES, PROFILE_STATUSES, OPEN_STATUSES, BUS } from "../constants/StringConstants.js";
import { CREATE_PROFILE, UPDATE_PROFILE } from "../api/endpoints";
import { postData, putData } from "../api/clients";

// ── Helpers ────────────────────────────────────────────────────────────────
function Field({ label, required, children, hint }) {
    return (
        <div className="ops-field">
            <label className="ops-label">
                {label}
                {required && <span className="ops-req">*</span>}
                {hint && <span className="ops-hint">{hint}</span>}
            </label>
            {children}
        </div>
    );
}

function Select({ value, onChange, options, placeholder }) {
    return (
        <select className="ops-select" value={value} onChange={e => onChange(e.target.value)}>
            <option value="">{placeholder || "Select…"}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
    );
}

function Input({ value, onChange, placeholder, type = "text" }) {
    return (
        <input
            className="ops-input"
            type={type}
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || ""}
        />
    );
}

// ── Engineer Row ───────────────────────────────────────────────────────────
function EngineerRow({ eng, idx, onChange, onRemove }) {
    return (
        <div className="eng-row">
            <div className="eng-fields ops-grid-3">
                <Input
                    value={eng.name}
                    onChange={v => onChange(idx, "name", v)}
                    placeholder="Engineer name"
                />
                <Input
                    value={eng.ssId}
                    onChange={v => onChange(idx, "ssId", v)}
                    placeholder="SS ID"
                />
                <Input
                    value={eng.projectedExp}
                    onChange={v => onChange(idx, "projectedExp", v)}
                    placeholder="Projected Exp (yrs)"
                />
            </div>
        </div>
    );
}



function profileToForm(p) {
    return {
        source: p.source || "",
        engineers: [{ name: p.engg_name || "", ssId: p.ss_id || "", projectedExp: p.projected_experience || "" }],
        profileStatuses: p.profile_status || "",
        selectionDate: p.selection_date || "",
        open_status: p.open_status ? [p.open_status] : [],
        buName: p.BU_name || "",
        hmName: p.hiring_manager_name || "",
        hmEmail: p.hiring_manager_email || "",
        hmLocation: p.hiring_location || "",
    };
}

// ── Main Form ──────────────────────────────────────────────────────────────
export default function OpportunityStatusForm({ onSave, onCancel, selectedOpportunity, initialData = null, mode = "create" }) {
    const blank = () => ({ name: "", ssId: "", projectedExp: "" });
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState(() =>
        mode === "edit" && initialData
            ? profileToForm(initialData)
            : {
                source: "",
                engineers: [blank()],
                profileStatuses: "",
                selectionDate: "",
                open_status: [],
                buName: "",
                // hmName: "",
                // hmEmail: "",
                // hmLocation: "",
            }
    );


    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    // Engineer helpers
    const updateEng = (idx, key, val) => {
        const engs = [...form.engineers];
        engs[idx] = { ...engs[idx], [key]: val };
        set("engineers", engs);
    };
    const addEng = () => set("engineers", [...form.engineers, blank()]);
    const removeEng = (idx) => set("engineers", form.engineers.filter((_, i) => i !== idx));
    
    const handleSubmit = async () => {
        setLoading(true);
        try {
            const engineer = form.engineers?.[0] || {};

            const raw = {
                opportunity_id: selectedOpportunity?.opportunity_id,
                source: form.source,
                engg_name: engineer.name,
                ss_id: engineer.ssId || null,
                projected_experience: engineer.projectedExp,
                profile_status: form.profileStatuses,
                selection_date: form.selectionDate || null,
                open_status: form.open_status?.[0] || null,
                BU_name: form.buName || null,
                hiring_manager_name: form.hmName || null,
                hiring_manager_email: form.hmEmail || null,
                hiring_location: form.hmLocation || null,
            };

            const payload = Object.fromEntries(
                Object.entries(raw).filter(([_, v]) => v !== "" && v !== undefined)
            );

            const isEdit = mode === "edit" && initialData?.profile_id;

            let result;

            if (isEdit) {
                const data = await putData(`${UPDATE_PROFILE}/${initialData.profile_id}`, payload);
                result = { ...initialData, ...payload, ...(data.data || {}), profile_id: initialData.profile_id };
            } else {
                const data = await postData(CREATE_PROFILE, payload);
                result = data.data || data;
            }

            onSave?.(result);
        } catch (error) {
            console.error("Save profile error:", error);
            alert(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div className="ops-form">
                {/* Header */}
                <div>
                    <div className="ops-header-title">
                        {mode === "edit" ? "Edit Profile" : "Opportunity Status"}
                    </div>
                    {mode === "edit" && initialData?.engg_name && (
                        <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>
                            {initialData.engg_name} · {initialData.ss_id}
                        </div>
                    )}
                </div>
                {/* <div className="ops-header">
                    <div className="ops-header-icon">📋</div>
                    <div>
                        <div className="ops-header-title">Opportunity Status</div>
                    </div>
                    <button
                        className="ot-close-btn"
                        onClick={onCancel}
                        style={{ marginLeft: "auto" }}
                    >
                        ✕
                    </button>
                </div> */}

                {/* ── Section 1: Core Details ── */}
                <div className="ops-section">
                    <div className="ops-grid-2">

                    </div>
                </div>

                {/* ── Section 2: Engineer Details ── */}
                <div className="ops-section">
                    <div className="ops-section-title">Engineer Details</div>

                    <div className="ops-grid-2">
                        <Field label="Source" required>
                            <Select
                                value={form.source}
                                onChange={v => set("source", v)}
                                options={SOURCES}
                                placeholder="Select source…"
                            />
                        </Field>

                        <Field label="Engineer Name">
                            <Input
                                value={form.engineers?.[0]?.name}
                                onChange={v => updateEng(0, "name", v)}
                                placeholder="Engineer name"
                            />
                        </Field>

                        <Field label="SS ID">
                            <Input
                                value={form.engineers?.[0]?.ssId}
                                onChange={v => updateEng(0, "ssId", v)}
                                placeholder="SS ID"
                            />
                        </Field>

                        <Field label="Projected Exp (yrs)">
                            <Input
                                value={form.engineers?.[0]?.projectedExp}
                                onChange={v => updateEng(0, "projectedExp", v)}
                                placeholder="Projected Exp (yrs)"
                            />
                        </Field>
                    </div>
                </div>

                {/* ── Section 3: Profile Status ── */}
                <div className="ops-section">
                    <div className="ops-section-title">Profile Status</div>

                    <Field label="Interview / Profile Stage">
                        <Select
                            value={form.profileStatuses}
                            onChange={v => set("profileStatuses", v)}
                            options={PROFILE_STATUSES}
                            placeholder="Select profile status..."
                        />
                    </Field>

                    <div style={{ marginTop: 14 }}>
                        <Field label="Selection Date">
                            <Input
                                type="date"
                                value={form.selectionDate}
                                onChange={v => set("selectionDate", v)}
                            />
                        </Field>
                    </div>
                </div>

                {/* Footer */}
                <div className="ops-footer">
                    <button className="btn-ghost-ops" onClick={onCancel}>Cancel</button>
                    <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? "Saving…" : mode === "edit" ? "Update Profile" : "Save Opportunity Status"}
                    </button>
                    {/* <button className="btn-primary" onClick={handleSubmit}>Save Opportunity Status</button> */}
                </div>
            </div>
        </>
    );
}