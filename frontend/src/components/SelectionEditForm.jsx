import { useState } from "react";
import { UPDATE_PROFILE, GET_FINAL_SELECTION_PROFILES } from "../api/endpoints";
import { SOURCES, PROFILE_STATUSES } from "../constants/StringConstants.js";
import { fetchData } from "../api/clients";


const ONBOARDING_TYPE_OPTIONS = ["New", "Replacement"];
const REVENUE_TYPE_OPTIONS = ["T&M", "Fixed", "Retainer"];
const CURRENCY_OPTIONS = ["INR", "USD", "EUR", "GBP"];
const RATE_TYPE_OPTIONS = ["Monthly", "Daily", "Hourly"];
const ROLL_OVER_OPTIONS = ["Yes", "No"];
const REVENUE_IMPACT_OPTIONS = ["Rev Loss", "No Rev Loss", "WIP", "Working on Replacement"];



export default function SelectionEditForm({ initialData, onSave, onCancel }) {

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const od = initialData?.opportunity_details || {};

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError(null);

            const payload = {
                ...initialData,
                ...form,
            };

            // Step 1: Update the profile
            const res = await fetch(
                `${UPDATE_PROFILE}/${initialData?.profile_id}`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data?.message || "Failed to update profile");
            }

            // Step 2: Fetch the final selection profiles list
            const finalRes = await fetchData(`${GET_FINAL_SELECTION_PROFILES}?limit=100&skip=0`);
            const items = finalData?.data?.items ?? [];

            // const finalData = await finalRes.json();

            // if (!finalRes.ok) {
            //     throw new Error(finalData?.message || "Failed to fetch final selection profile");
            // }

            // Step 3: Drill into data.items and find the matching profile
            const updated = items.find(p => p.profile_id === initialData?.profile_id);

            if (!updated) {
                throw new Error("Updated profile not found in response");
            }

            // Step 4: Sync local form state so UI reflects new values immediately
            setForm(prev => ({
                ...prev,
                source: updated.source || "",
                engg_name: updated.engg_name || "",
                ss_id: updated.ss_id || "",
                projected_experience: updated.projected_experience || "",
                profile_status: updated.profile_status || "",
                selection_date: updated.selection_date || "",
                onboarding_engg_name: updated.onboarding_engg_name || "",
                onboarding_month: updated.onboarding_month || "",
                client_onboarding_date: updated.client_onboarding_date || "",
                billing_start_date: updated.billing_start_date || "",
                emp_id: updated.emp_id || "",
                client_bu_name: updated.client_bu_name || "",
                hiring_manager_name: updated.hiring_manager_name || "",
                hiring_manager_email: updated.hiring_manager_email || "",
                engg_source: updated.engg_source || "",
                client_onboarding_location: updated.client_onboarding_location || "",
                onboarding_type: updated.onboarding_type || "",
                revenue_type: updated.revenue_type || "",
                currency: updated.currency || "",
                rate_at_onboarding: updated.rate_at_onboarding || "",
                rate_type: updated.rate_type || "",
                client_spoc: updated.client_spoc || "",
                offboarding_month: updated.offboarding_month || "",
                offboarding_date: updated.offboarding_date || "",
                offboard_emp_id: updated.offboard_emp_id || "",
                offboard_name: updated.offboard_name || "",
                department: updated.department || "",
                account_manager: updated.account_manager || "",
                client_name: updated.client_name || "",
                direct_subcon: updated.direct_subcon || "",
                offboard_revenue_type: updated.offboard_revenue_type || "",
                vertical_head: updated.vertical_head || "",
                client_offboarding_location: updated.client_offboarding_location || "",
                reason: updated.reason || "",
                revenue_impact: updated.revenue_impact || "",
                roll_over: updated.roll_over || "",
                comments: updated.comments || "",
            }));
            onSave(updated);
        } catch (err) {
            console.error(err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    const [form, setForm] = useState({
        // Engineer Details
        source: initialData?.source || "",
        engg_name: initialData?.engg_name || "",
        ss_id: initialData?.ss_id || "",
        projected_experience: initialData?.projected_experience || "",
        profile_status: initialData?.profile_status || "",
        selection_date: initialData?.selection_date || "",
        onboarding_engg_name: initialData?.onboarding_engg_name || "",
        onboarding_month: initialData?.onboarding_month || "",
        client_onboarding_date: initialData?.client_onboarding_date || "",
        billing_start_date: initialData?.billing_start_date || "",
        emp_id: initialData?.emp_id || "",
        client_bu_name: od?.client ? `${od.client} / ${od.BU}` : "",
        hiring_manager_name: initialData?.hiring_manager_name || "",
        hiring_manager_email: initialData?.hiring_manager_email || "",
        engg_source: initialData?.source || "",
        client_onboarding_location: initialData?.client_onboarding_location || "",
        onboarding_type: initialData?.onboarding_type || "",
        revenue_type: initialData?.revenue_type || "",
        currency: initialData?.currency || "",
        rate_at_onboarding: initialData?.rate_at_onboarding || "",
        rate_type: initialData?.rate_type || "",
        client_spoc: initialData?.client_spoc || "",
        offboarding_month: initialData?.offboarding_month || "",
        offboarding_date: initialData?.offboarding_date || "",
        offboard_emp_id: initialData?.offboard_emp_id || "",
        offboard_name: initialData?.offboard_name || "",
        department: initialData?.department || "",
        account_manager: initialData?.account_manager || "",
        client_name: od?.client || "",
        direct_subcon: initialData?.direct_subcon || "",
        offboard_revenue_type: initialData?.offboard_revenue_type || "",
        vertical_head: initialData?.vertical_head || "",
        client_offboarding_location: initialData?.client_offboarding_location || "",
        reason: initialData?.reason || "",
        revenue_impact: initialData?.revenue_impact || "",
        roll_over: initialData?.roll_over || "",
        comments: initialData?.comments || "",
    });

    const set = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

    return (
        <div style={{ padding: "28px 32px", fontFamily: "inherit" }}>

            {/* ── ENGINEER DETAILS ── */}
            <SectionHeader title="Engineer Details" />
            <div className="opp-form-grid">
                <Field label="Source *">
                    <select className="opp-input" value={form.source} onChange={e => set("source", e.target.value)}>
                        <option value="">Select</option>
                        {SOURCES.map(o => <option key={o}>{o}</option>)}
                    </select>
                </Field>
                <Field label="Engineer Name">
                    <input className="opp-input" value={form.engg_name} onChange={e => set("engg_name", e.target.value)} />
                </Field>
                <Field label="SS ID">
                    <input className="opp-input" value={form.ss_id} onChange={e => set("ss_id", e.target.value)} />
                </Field>
                <Field label="Projected Exp (Yrs)">
                    <input className="opp-input" type="number" value={form.projected_experience} onChange={e => set("projected_experience", e.target.value)} />
                </Field>
            </div>

            {/* ── PROFILE STATUS ── */}
            <SectionHeader title="Profile Status" />
            <div className="opp-form-grid">
                <Field label="Interview / Profile Stage" fullWidth>
                    <select className="opp-input" value={form.profile_status} onChange={e => set("profile_status", e.target.value)}>
                        <option value="">Select</option>
                        {PROFILE_STATUSES.map(o => <option key={o}>{o}</option>)}
                    </select>
                </Field>
                <Field label="Selection Date">
                    <input className="opp-input" type="date" value={form.selection_date} onChange={e => set("selection_date", e.target.value)} />
                </Field>
            </div>

            {/* ── ONBOARDING ── */}
            <SectionHeader title="Onboarding" />
            <div className="opp-form-grid">
                <Field label="Onboarding Month">
                    <input className="opp-input" type="month" value={form.onboarding_month} onChange={e => set("onboarding_month", e.target.value)} />
                </Field>
                <Field label="Client Onboarding Date">
                    <input className="opp-input" type="date" value={form.client_onboarding_date} onChange={e => set("client_onboarding_date", e.target.value)} />
                </Field>
                <Field label="Billing Start Date">
                    <input className="opp-input" type="date" value={form.billing_start_date} onChange={e => set("billing_start_date", e.target.value)} />
                </Field>
                <Field label="Reporting Manager Name">
                    <input className="opp-input" value={form.reporting_manager_name} onChange={e => set("reporting_manager_name", e.target.value)} />
                </Field>
                <Field label="Reporting Manager Email">
                    <input className="opp-input" type="email" value={form.reporting_manager_email} onChange={e => set("reporting_manager_email", e.target.value)} />
                </Field>
                <Field label="Client Onboarding Location">
                    <input className="opp-input" value={form.client_onboarding_location} onChange={e => set("client_onboarding_location", e.target.value)} />
                </Field>
                <Field label="Onboarding Type">
                    <select className="opp-input" value={form.onboarding_type} onChange={e => set("onboarding_type", e.target.value)}>
                        <option value="">Select</option>
                        {ONBOARDING_TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                </Field>
                <Field label="Revenue Type">
                    <select className="opp-input" value={form.revenue_type} onChange={e => set("revenue_type", e.target.value)}>
                        <option value="">Select</option>
                        {REVENUE_TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                </Field>
                <Field label="Currency">
                    <select className="opp-input" value={form.currency} onChange={e => set("currency", e.target.value)}>
                        <option value="">Select</option>
                        {CURRENCY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                </Field>
                <Field label="Rate at Onboarding">
                    <input className="opp-input" type="number" value={form.rate_at_onboarding} onChange={e => set("rate_at_onboarding", e.target.value)} />
                </Field>
                <Field label="Rate Type">
                    <select className="opp-input" value={form.rate_type} onChange={e => set("rate_type", e.target.value)}>
                        <option value="">Select</option>
                        {RATE_TYPE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                </Field>
                <Field label="Client SPOC Contact Person">
                    <input className="opp-input" value={form.client_spoc} onChange={e => set("client_spoc", e.target.value)} />
                </Field>
            </div>

            {/* ── OFFBOARDING TRACKER ── */}
            <SectionHeader title="Offboarding Tracker" />
            <div className="opp-form-grid">
                <Field label="Offboarding Month">
                    <input className="opp-input" type="month" value={form.offboarding_month} onChange={e => set("offboarding_month", e.target.value)} />
                </Field>
                <Field label="Offboarding Date">
                    <input className="opp-input" type="date" value={form.offboarding_date} onChange={e => set("offboarding_date", e.target.value)} />
                </Field>
                <Field label="Reason">
                    <input className="opp-input" value={form.reason} onChange={e => set("reason", e.target.value)} />
                </Field>
                <Field label="Revenue Impact">
                    <select className="opp-input" value={form.revenue_impact} onChange={e => set("revenue_impact", e.target.value)}>
                        <option value="">Select</option>
                        {REVENUE_IMPACT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                </Field>
                <Field label="Roll-Over">
                    <select className="opp-input" value={form.roll_over} onChange={e => set("roll_over", e.target.value)}>
                        <option value="">Select</option>
                        {ROLL_OVER_OPTIONS.map(o => <option key={o}>{o}</option>)}
                    </select>
                </Field>
                <Field label="Comments" fullWidth>
                    <textarea
                        className="opp-input"
                        rows={3}
                        style={{ resize: "vertical" }}
                        value={form.comments}
                        onChange={e => set("comments", e.target.value)}
                    />
                </Field>
            </div>

            {/* ── FOOTER ── */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 28 }}>
                <button className="btn-cancel" onClick={onCancel}>Cancel</button>
                <button
                    className="btn-primary"
                    onClick={handleSubmit}
                    disabled={loading}
                >
                    {loading ? "Updating..." : "Update Profile"}
                </button>
            </div>
        </div>
    );
}

// ── helpers ──────────────────────────────────────────────
function SectionHeader({ title }) {
    return (
        <div style={{
            color: "#1d4ed8",
            fontWeight: 700,
            fontSize: 13,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            borderBottom: "1.5px solid #bfdbfe",
            paddingBottom: 6,
            marginTop: 28,
            marginBottom: 16,
        }}>
            {title}
        </div>
    );
}

function Field({ label, children, fullWidth }) {
    return (
        <div style={{ gridColumn: fullWidth ? "1 / -1" : undefined, display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                {label}
            </label>
            {children}
        </div>
    );
}