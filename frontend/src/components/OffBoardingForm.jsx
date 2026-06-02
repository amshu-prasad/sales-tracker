import { useState } from "react";
import { postData } from "../api/clients";
import { CREATE_OFFBOARDING_PROFILE } from "../api/endpoints";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const REASONS = [
  "Resignation", "End of contract", "Client request",
  "Performance", "Redundancy", "Retirement", "Other",
];

const initialState = {
  informedDate: "",
  type: "",
  offboardingMonth: "",
  offboardingDate: "",
  empId: "",
  name: "",
  department: "",
  verticalHead: "",
  empType: "",
  accountManager: "",
  clientName: "",
  clientLocation: "",
  reason: "",
  revenueImpact: "",
};

const requiredFields = [
  "offboardingMonth", "offboardingDate", "empId", "name",
  "department", "verticalHead", "accountManager",
  "clientName", "clientLocation", "reason",
];

function OpsField({ label, optional, required, error, children, fullWidth }) {
  return (
    <div
      className={`ops-field${error ? " ops-field-error" : ""}`}
      style={fullWidth ? { gridColumn: "1 / -1" } : {}}
    >
      <label className="ops-label">
        {label}
        {required && <span className="ops-req">*</span>}
        {optional && <span className="ops-hint">(optional)</span>}
      </label>
      {children}
      {error && (
        <p style={{ color: "var(--red)", fontSize: 11, marginTop: 4, fontFamily: "var(--font)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function ChipToggle({ options, value, onChange }) {
  return (
    <div className="chip-group">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={`chip${value === opt.value ? " chip-active" : ""}`}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({ icon, title }) {
  return (
    <div className="ot-section-header">
      <span className="ot-section-icon">{icon}</span>
      <span className="ot-section-title">{title}</span>
    </div>
  );
}

export default function OffBoardingForm({ onSave, onCancel,opportunityId }) {
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (key) => (e) => {
    const val = e && e.target ? e.target.value : e;
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const validate = () => {
    const errs = {};
    requiredFields.forEach((f) => {
      if (!form[f]) errs[f] = "Required";
    });
    return errs;
  };

  console.log(opportunityId);
  const handleSubmit = async () => {
    const errs = validate();

    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    try {
      setSaving(true);
      const payload = {
        opportunity_id: opportunityId,

        informed_date: form.informedDate || null,
        type: form.type,
        offboarding_month: form.offboardingMonth,
        offboarding_date: form.offboardingDate,

        emp_id: form.empId,
        engg_name: form.name,
        department: form.department,
        vertical_head: form.verticalHead,

        acc_manager: form.accountManager,
        client_name: form.clientName,
        client_offboarding_loc: form.clientLocation,

        reason: form.reason,
        revenu_impact_comments: form.revenueImpact || null,
      };

      const response = await postData(
        CREATE_OFFBOARDING_PROFILE,
        payload
      );

      console.log("Created:", response);

      setSubmitted(true);

      if (onSave) {
        onSave(response);
      }
    } catch (error) {
      console.error("Failed to create offboarding profile:", error);
      alert("Failed to submit offboarding profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    setForm(initialState);
    setErrors({});
    setSubmitted(false);
  };

  /* ── Success state ── */
  if (submitted) {
    return (
      <div className="ot-form-wrap">
        <div className="ot-form-topbar">
          <h2 className="ot-form-heading">Employee Offboarding{opportunityId}</h2>
          {onCancel && (
            <button className="ot-close-btn" onClick={onCancel}>✕</button>
          )}
        </div>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          gap: 16, padding: "3rem 2rem", textAlign: "center",
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: "var(--green-light)",
            border: "1px solid #bbf7d0",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>
          <p style={{ fontSize: 16, fontWeight: 700, color: "var(--text)", margin: 0 }}>
            Offboarding submitted
          </p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0 }}>
            Record for <strong>{form.name}</strong> has been submitted successfully.
          </p>
          <button
            className="btn-ghost-ops"
            onClick={handleClear}
            style={{ marginTop: 8 }}
          >
            Submit another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ot-form-wrap">

      {/* ── Sticky Topbar ── */}
      <div className="ot-form-topbar">
        <h2 className="ot-form-heading">Employee Offboarding</h2>
        {onCancel && (
          <button className="ot-close-btn" onClick={onCancel} title="Close">✕</button>
        )}
      </div>

      {/* ── Form Body ── */}
      <div className="ot-form-body">

        {/* General Info */}
        <div>
          <SectionHeader icon="📋" title="General Info" />
          <div className="ot-grid-2" style={{ marginTop: 14 }}>
            <OpsField label="Informed Date" optional>
              <input
                type="date"
                className="ops-input"
                value={form.informedDate}
                onChange={set("informedDate")}
              />
            </OpsField>
            <OpsField label="Type" required>
              <ChipToggle
                options={[
                  { label: "Domestic", value: "domestic" },
                  { label: "Global", value: "global" },
                ]}
                value={form.type}
                onChange={set("type")}
              />
            </OpsField>
          </div>
        </div>

        {/* Offboarding Schedule */}
        <div>
          <SectionHeader icon="📅" title="Offboarding Schedule" />
          <div className="ot-grid-2" style={{ marginTop: 14 }}>
            <OpsField label="Offboarding Month" required error={errors.offboardingMonth}>
              <select
                className="ops-select"
                value={form.offboardingMonth}
                onChange={set("offboardingMonth")}
              >
                <option value="">Select month</option>
                {MONTHS.map((m) => <option key={m}>{m}</option>)}
              </select>
            </OpsField>
            <OpsField label="Offboarding Date" required error={errors.offboardingDate}>
              <input
                type="date"
                className="ops-input"
                value={form.offboardingDate}
                onChange={set("offboardingDate")}
              />
            </OpsField>
          </div>
        </div>

        {/* Employee Details */}
        <div>
          <SectionHeader icon="👤" title="Employee Details" />
          <div className="ot-grid-2" style={{ marginTop: 14 }}>
            <OpsField label="Emp ID" required error={errors.empId}>
              <input
                type="text"
                className="ops-input"
                placeholder="e.g. EMP-00123"
                value={form.empId}
                onChange={set("empId")}
              />
            </OpsField>
            <OpsField label="Name" required error={errors.name}>
              <input
                type="text"
                className="ops-input"
                placeholder="Full name"
                value={form.name}
                onChange={set("name")}
              />
            </OpsField>
            <OpsField label="Department" required error={errors.department}>
              <input
                type="text"
                className="ops-input"
                placeholder="e.g. Engineering"
                value={form.department}
                onChange={set("department")}
              />
            </OpsField>
            <OpsField label="Vertical Head" required error={errors.verticalHead}>
              <input
                type="text"
                className="ops-input"
                placeholder="Name of vertical head"
                value={form.verticalHead}
                onChange={set("verticalHead")}
              />
            </OpsField>
            <OpsField label="Direct / Subcon" required>
              <ChipToggle
                options={[
                  { label: "Direct", value: "direct" },
                  { label: "Subcon", value: "subcon" },
                ]}
                value={form.empType}
                onChange={set("empType")}
              />
            </OpsField>
          </div>
        </div>

        {/* Client & Account Info */}
        <div>
          <SectionHeader icon="🏢" title="Client & Account Info" />
          <div className="ot-grid-2" style={{ marginTop: 14 }}>
            <OpsField label="Account Manager" required error={errors.accountManager}>
              <input
                type="text"
                className="ops-input"
                placeholder="Name of account manager"
                value={form.accountManager}
                onChange={set("accountManager")}
              />
            </OpsField>
            <OpsField label="Client Name" required error={errors.clientName}>
              <input
                type="text"
                className="ops-input"
                placeholder="Client or account name"
                value={form.clientName}
                onChange={set("clientName")}
              />
            </OpsField>
            <OpsField label="Client Offboarding Location" required error={errors.clientLocation} fullWidth>
              <input
                type="text"
                className="ops-input"
                placeholder="City, Country"
                value={form.clientLocation}
                onChange={set("clientLocation")}
              />
            </OpsField>
          </div>
        </div>

        {/* Reason & Impact */}
        <div>
          <SectionHeader icon="📝" title="Reason & Impact" />
          <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 14 }}>
            <OpsField label="Reason" required error={errors.reason}>
              <select
                className="ops-select"
                value={form.reason}
                onChange={set("reason")}
              >
                <option value="">Select a reason</option>
                {REASONS.map((r) => <option key={r}>{r}</option>)}
              </select>
            </OpsField>
            <OpsField label="Revenue Impact & Comments" optional>
              <textarea
                className="ot-textarea"
                placeholder="Describe any revenue impact or add relevant comments…"
                value={form.revenueImpact}
                onChange={set("revenueImpact")}
                rows={3}
              />
            </OpsField>
          </div>
        </div>

      </div>

      {/* ── Sticky Footer ── */}
      <div className="ot-form-footer">
        <button
          type="button"
          className="btn-ghost-ops"
          onClick={handleClear}
          disabled={saving}
        >
          Clear
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn-cancel"
            onClick={onCancel}
            disabled={saving}
          >
            Cancel
          </button>
        )}
        <button
          type="button"
          className="ot-save-btn"
          onClick={handleSubmit}
          disabled={saving}
          style={{
            minWidth: 110,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {saving ? (
            <>
              <span
                className="spinner-sm"
                style={{ borderColor: "rgba(255,255,255,.35)", borderTopColor: "#fff" }}
              />
              Saving…
            </>
          ) : (
            "Submit"
          )}
        </button>
      </div>

    </div>
  );
}