import { useState, useEffect } from "react";
import { api } from "../utils/api";

export default function EntryForm({ type, onSave, onCancel, initialData, entryId }) {
  const today = new Date().toISOString().slice(0, 10);
  const isEdit = !!entryId;

  const [form, setForm] = useState({
    date: today,
    onboardingDate: "",
    offboardingDate: "",
    client: "",
    vertical: "",
    source: "",
    empType: "",
    remarks: "",
    candidateName: "",
    managerName: "",

    // New Fields
    hiringManagerName: "",
    hiringManagerEmail: "",
    clientOnboardingLocation: "",
    city: "",
    projectedExperience: "",
    buName: "",
    empId: "",
    verticalHead: "",

    ...initialData,
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [verticals, setVerticals] = useState([]);

  useEffect(() => {
    api.meta()
      .then(m => {
        setClients(m.clients);
        setVerticals(m.verticals);
      })
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const typeColor = {
    selection: "#1d4ed8"
    // ,
    // onboarding: "#065f46",
    // offboarding: "#991b1b",
  }[type] || "#1d4ed8";

  const title = isEdit
    ? `Edit ${type ?? "entry"}`
    : {
        selection: "Employee Lifecycle Tracker"
        // ,
        // onboarding: "Log Onboarding",
        // offboarding: "Log Offboarding",
      }[type] ?? "Employee Lifecycle Tracker";

  const dateLabel = {
    selection: "Selection Date"
    // ,
    // onboarding: "Onboarding Date",
    // offboarding: "Offboarding Date",
  }[type] ?? "Date";

  const submit = async () => {
    if (
      !isEdit &&
      (
        !form.date ||
        !form.client ||
        !form.vertical ||
        !form.source ||
        !form.empType ||
        !form.candidateName ||
        !form.managerName
      )
    ) {
      setError("Please fill all required fields (*)");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const payload = {
        ...form,
        type,
      };

      const entry = isEdit
        ? await api.updateEntry(entryId, payload)
        : await api.createEntry(payload);

      onSave(entry);
    } catch {
      setError("Error saving — check connection");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="entry-form-card">
      <div
        className="entry-form-header"
        style={{ borderLeftColor: typeColor }}
      >
        <h3 style={{ color: typeColor }}>{title}</h3>
      </div>

      <div className="form-grid-2">

        {/* Selection Date */}
        <div className="field">
          <label>{dateLabel} *</label>
          <input
            type="date"
            value={form.date}
            onChange={e => set("date", e.target.value)}
          />
        </div>

        {/* Onboarding Date */}
        <div className="field">
          <label>Onboarding Date</label>
          <input
            type="date"
            value={form.onboardingDate}
            onChange={e => set("onboardingDate", e.target.value)}
          />
        </div>

        {/* Offboarding Date */}
        <div className="field">
          <label>Offboarding Date</label>
          <input
            type="date"
            value={form.offboardingDate}
            onChange={e => set("offboardingDate", e.target.value)}
          />
        </div>

        {/* Client */}
        <div className="field">
          <label>Client *</label>
          <select
            value={form.client}
            onChange={e => set("client", e.target.value)}
          >
            <option value="">Select client</option>
            {clients.map(c => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Vertical */}
        <div className="field">
          <label>Vertical *</label>
          <select
            value={form.vertical}
            onChange={e => set("vertical", e.target.value)}
          >
            <option value="">Select vertical</option>
            {verticals.map(v => (
              <option key={v}>{v}</option>
            ))}
          </select>
        </div>

        {/* Source */}
        <div className="field">
          <label>Source *</label>
          <select
            value={form.source}
            onChange={e => set("source", e.target.value)}
          >
            <option value="">Select source</option>
            <option value="Bench">Bench (our direct employee)</option>
            <option value="Partner">Partner (subcon / external)</option>
          </select>
        </div>

        {/* Employment Type */}
        <div className="field">
          <label>Employment Type *</label>
          <select
            value={form.empType}
            onChange={e => set("empType", e.target.value)}
          >
            <option value="">Select type</option>
            <option value="T&M">T&M</option>
            <option value="ODC">ODC</option>
          </select>
        </div>

        {/* Candidate Name */}
        <div className="field">
          <label>Candidate Name *</label>
          <input
            type="text"
            value={form.candidateName}
            onChange={e => set("candidateName", e.target.value)}
            placeholder="Enter candidate name"
          />
        </div>

        {/* Hiring Manager Name */}
        <div className="field">
          <label>Hiring Manager Name</label>
          <input
            type="text"
            value={form.hiringManagerName}
            onChange={e => set("hiringManagerName", e.target.value)}
            placeholder="Enter hiring manager name"
          />
        </div>

        {/* Hiring Manager Email */}
        <div className="field">
          <label>Hiring Manager Email ID</label>
          <input
            type="email"
            value={form.hiringManagerEmail}
            onChange={e => set("hiringManagerEmail", e.target.value)}
            placeholder="Enter hiring manager email"
          />
        </div>

        {/* Client Onboarding Location */}
        <div className="field">
          <label>Client Onboarding Location</label>
          <input
            type="text"
            value={form.clientOnboardingLocation}
            onChange={e => set("clientOnboardingLocation", e.target.value)}
            placeholder="Enter onboarding location"
          />
        </div>

        {/* City */}
        <div className="field">
          <label>City</label>
          <input
            type="text"
            value={form.city}
            onChange={e => set("city", e.target.value)}
            placeholder="Enter city"
          />
        </div>

        {/* Projected Experience */}
        <div className="field">
          <label>Projected Experience</label>
          <input
            type="text"
            value={form.projectedExperience}
            onChange={e => set("projectedExperience", e.target.value)}
            placeholder="e.g. 5 Years"
          />
        </div>

        {/* BU Name */}
        <div className="field">
          <label>BU Name</label>
          <input
            type="text"
            value={form.buName}
            onChange={e => set("buName", e.target.value)}
            placeholder="Enter BU name"
          />
        </div>

        {/* Emp ID */}
        <div className="field">
          <label>Emp ID</label>
          <input
            type="text"
            value={form.empId}
            onChange={e => set("empId", e.target.value)}
            placeholder="Enter employee ID"
          />
        </div>

        {/* Vertical Head */}
        <div className="field">
          <label>Vertical Head</label>
          <input
            type="text"
            value={form.verticalHead}
            onChange={e => set("verticalHead", e.target.value)}
            placeholder="Enter vertical head"
          />
        </div>

      </div>

      {/* Remarks */}
      <div className="field" style={{ marginTop: 8 }}>
        <label>Remarks (optional)</label>
        <textarea
          value={form.remarks}
          onChange={e => set("remarks", e.target.value)}
          placeholder="Any notes..."
          rows={2}
        />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button
          className="btn btn-primary"
          onClick={submit}
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="spinner-sm" /> Saving…
            </>
          ) : isEdit ? (
            "Save changes"
          ) : (
            "Save Entry"
          )}
        </button>

        <button className="btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}