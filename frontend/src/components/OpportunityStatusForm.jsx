import { useState } from "react";
import { VERTICALS, SOURCES, PROFILE_STATUSES, OPEN_STATUSES, BUS } from "../constants/StringConstants.js";
import { CREATE_PROFILE } from "../api/endpoints";
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

// ── Multi-Select Chips ─────────────────────────────────────────────────────
function MultiChips({ options, selected, onChange }) {
    const toggle = (opt) => {
        onChange(
            selected.includes(opt) ? selected.filter(s => s !== opt) : [...selected, opt]
        );
    };
    return (
        <div className="chip-group">
            {options.map(opt => (
                <button
                    key={opt}
                    type="button"
                    className={`chip ${selected.includes(opt) ? "chip-active" : ""}`}
                    onClick={() => toggle(opt)}
                >
                    {opt}
                </button>
            ))}
        </div>
    );
}

// ── Main Form ──────────────────────────────────────────────────────────────
export default function OpportunityStatusForm({ onSave, onCancel, selectedOpportunity }) {
    const blank = () => ({ name: "", ssId: "", projectedExp: "" });
    const [loading, setLoading] = useState(false);

    const [form, setForm] = useState({
        resumeCount: "",
        source: "",
        vertical: "",
        engineers: [blank()],
        profileStatuses: "",
        selectionDate: "",
        openStatuses: [],
        buName: "",
        hmName: "",
        hmEmail: "",
        hmLocation: "",
    });

    const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

    // Engineer helpers
    const updateEng = (idx, key, val) => {
        const engs = [...form.engineers];
        engs[idx] = { ...engs[idx], [key]: val };
        set("engineers", engs);
    };
    const addEng = () => set("engineers", [...form.engineers, blank()]);
    const removeEng = (idx) => set("engineers", form.engineers.filter((_, i) => i !== idx));
    console.log("Submitting with engineer:", selectedOpportunity?.opportunity_id);

    const handleSubmit = async () => {
        try {
            const engineer = form.engineers?.[0] || {};
            const payload = {
                opportunity_id: selectedOpportunity?.opportunity_id,
                source: form.source,
                engg_name: engineer.name || "",
                ss_id: engineer.ssId || "",
                projected_experience: engineer.projectedExp || "",
                profile_status: form.profileStatuses,
                selection_date: form.selectionDate,
                open_status: form.openStatuses?.[0] || "",
                BU_name: form.buName,
                hiring_manager_name: form.hmName,
                hiring_manager_email: form.hmEmail,
                hiring_location: form.hmLocation,
            };

            const response = await fetch(CREATE_PROFILE, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "Failed to create profile");
            }
            onSave?.(data);
        } catch (error) {
            console.error("Create profile error:", error);
            alert(error.message);
        }
    };

    return (
        <>
            <div className="ops-form">
                {/* Header */}
                <div className="ops-header">
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
                </div>

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

                {/* ── Section 4: Open / Closure Status ── */}
                <div className="ops-section">
                    <div className="ops-section-title">Open / Closure Status</div>
                    <Field label="Status" hint="(multiple selections allowed)">
                        <MultiChips
                            options={OPEN_STATUSES}
                            selected={form.openStatuses}
                            onChange={v => set("openStatuses", v)}
                        />
                    </Field>
                </div>

                {/* ── Section 5: Hiring Manager ── */}
                <div className="ops-section">
                    <div className="ops-section-title">Hiring Manager Details</div>
                    <div className="hm-card">
                        <div className="ops-grid-2" style={{ gap: 12 }}>
                            <Field label="BU (Business Unit)">
                                <Select
                                    value={form.buName}
                                    onChange={v => set("buName", v)}
                                    options={BUS}
                                    placeholder="Select BU…"
                                />
                            </Field>
                            <Field label="HM Name">
                                <Input
                                    value={form.hmName}
                                    onChange={v => set("hmName", v)}
                                    placeholder="Hiring Manager name"
                                />
                            </Field>
                            <Field label="HM Email ID">
                                <Input
                                    type="email"
                                    value={form.hmEmail}
                                    onChange={v => set("hmEmail", v)}
                                    placeholder="hm@company.com"
                                />
                            </Field>
                            <Field label="HM Location">
                                <Input
                                    value={form.hmLocation}
                                    onChange={v => set("hmLocation", v)}
                                    placeholder="City / Office"
                                />
                            </Field>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="ops-footer">
                    <button className="btn-ghost-ops" onClick={onCancel}>Cancel</button>
                    <button className="btn-primary" onClick={handleSubmit}>Save Opportunity Status</button>
                </div>
            </div>
        </>
    );
}