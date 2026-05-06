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
    // Spread initialData last so it overrides defaults when editing
    ...initialData,
  });

  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [clients, setClients] = useState([]);
  const [verticals, setVerticals] = useState([]);

  useEffect(() => {
    api.meta()
      .then(m => { setClients(m.clients); setVerticals(m.verticals); })
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const typeColor = {
    selection: "#1d4ed8",
    onboarding: "#065f46",
    offboarding: "#991b1b",
  }[type] || "#1d4ed8";

  const title = isEdit
    ? `Edit ${type ?? "entry"}`
    : { selection: "Log Selection", onboarding: "Log Onboarding", offboarding: "Log Offboarding" }[type] ?? "Log Entry";

  const dateLabel = { selection: "Selection date", onboarding: "Onboarding date", offboarding: "Offboarding date" }[type] ?? "Date";

  const submit = async () => {
  if (
    !isEdit &&
    (!form.date || !form.client || !form.vertical || !form.source || !form.empType || !form.candidateName || !form.managerName)
  ) {
    setError("Please fill all required fields (*)");
    return;
  }

  setError("");
  setSaving(true);
  try {
    const entry = isEdit
      ? await api.updateEntry(entryId, { ...form, type })
      : await api.createEntry({ ...form, type });
    onSave(entry);
  } catch {
    setError("Error saving — check connection");
  } finally {
    setSaving(false);
  }
};

  // const submit = async () => {
  //   if (!form.date || !form.client || !form.vertical || !form.source || !form.empType || !form.candidateName || !form.managerName) {
  //     setError("Please fill all required fields (*)");
  //     return;
  //   }
  //   setError("");
  //   setSaving(true);
  //   try {
  //     const entry = isEdit
  //       ? await api.updateEntry(entryId, { ...form, type })
  //       : await api.createEntry({ ...form, type });
  //     onSave(entry);
  //   } catch {
  //     setError("Error saving — check connection");
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  return (
    <div className="entry-form-card">
      <div className="entry-form-header" style={{ borderLeftColor: typeColor }}>
        <h3 style={{ color: typeColor }}>{title}</h3>
      </div>

      <div className="form-grid-2">
        <div className="field">
          <label>{dateLabel} *</label>
          <input type="date" value={form.date} onChange={e => set("date", e.target.value)} />
        </div>
        <div className="field">
          <label>Onboarding Date</label>
          <input type="date" value={form.onboardingDate} onChange={e => set("onboardingDate", e.target.value)} />
        </div>
        <div className="field">
          <label>Offboarding Date</label>
          <input type="date" value={form.offboardingDate} onChange={e => set("offboardingDate", e.target.value)} />
        </div>
        <div className="field">
          <label>Client *</label>
          <select value={form.client} onChange={e => set("client", e.target.value)}>
            <option value="">Select client</option>
            {clients.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Vertical *</label>
          <select value={form.vertical} onChange={e => set("vertical", e.target.value)}>
            <option value="">Select vertical</option>
            {verticals.map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Source *</label>
          <select value={form.source} onChange={e => set("source", e.target.value)}>
            <option value="">Select source</option>
            <option value="Bench">Bench (our direct employee)</option>
            <option value="Partner">Partner (subcon / external)</option>
          </select>
        </div>
        <div className="field">
          <label>Employment Type *</label>
          <select value={form.empType} onChange={e => set("empType", e.target.value)}>
            <option value="">Select type</option>
            <option value="T&M">T&M</option>
            <option value="ODC">ODC</option>
          </select>
        </div>
        <div className="field">
          <label>Candidate Name *</label>
          <input type="text" value={form.candidateName} onChange={e => set("candidateName", e.target.value)} placeholder="Enter candidate name" />
        </div>
        <div className="field">
          <label>Manager Name *</label>
          <input type="text" value={form.managerName} onChange={e => set("managerName", e.target.value)} placeholder="Enter manager name" />
        </div>
      </div>

      <div className="field" style={{ marginTop: 8 }}>
        <label>Remarks (optional)</label>
        <textarea value={form.remarks} onChange={e => set("remarks", e.target.value)} placeholder="Any notes..." rows={2} />
      </div>

      {error && <p className="form-error">{error}</p>}

      <div className="form-actions">
        <button className="btn btn-primary" onClick={submit} disabled={saving}>
          {saving ? <><span className="spinner-sm" /> Saving…</> : isEdit ? "Save changes" : "Save Entry"}
        </button>
        <button className="btn" onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
}