import React, { useState } from "react";
import { LOCATIONS, } from "../constants/StringConstants.js";



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

export default function OnboardingOffboardingForm({ onCancel, setActiveForm }) {

    const [form, setForm] = useState({
        engineerName: "",
        onboardingMonth: "",
        clientOnboardingDate: "",
        billingStartDate: "",
        empId: "",
        clientBuName: "",
        hmDetails: "",
        engineerSource: "",
        clientOnboardingLocation: "",
        onboardingType: "",
        revenueType: "",
        currency: "",
        rateAtOnboarding: "",
        rateType: "",
        clientSpoc: "",

        offboardingMonth: "",
        offboardingDate: "",
        clientOffboardingLocation: "",
        offboardingReason: "",
        revenueImpact: "",
        rollOver: "",
        comments: "",
    });

    const set = (key, value) => {
        setForm(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    return (
        <>
            <div className="ops-page-head">
                <div className="ops-title-row">
                    <span
                        className="ops-back-arrow"
                        onClick={() => setActiveForm(null)}
                    >
                        {"<"}
                    </span>

                    <h2 className="ops-page-title">
                        Onboarding Details
                    </h2>
                </div>
            </div>
            <div className="ops-section">
                <div className="ops-grid-2">

                    <Field label="Engineer Name">
                        <Input
                            value={form.engineerName}
                            onChange={v => set("engineerName", v)}
                            placeholder="Tag Engineer Name"
                        />
                    </Field>

                    <Field label="Onboarding Month">
                        <Input
                            type="month"
                            value={form.onboardingMonth}
                            onChange={v => set("onboardingMonth", v)}
                        />
                    </Field>

                    <Field label="Client Onboarding Date">
                        <Input
                            type="date"
                            value={form.clientOnboardingDate}
                            onChange={v => set("clientOnboardingDate", v)}
                        />
                    </Field>

                    <Field label="Billing Start Date">
                        <Input
                            type="date"
                            value={form.billingStartDate}
                            onChange={v => set("billingStartDate", v)}
                        />
                    </Field>

                    <Field label="Emp ID">
                        <Input
                            value={form.empId}
                            onChange={v => set("empId", v)}
                        />
                    </Field>

                    <Field label="Client & BU Name">
                        <Input
                            value={form.clientBuName}
                            onChange={v => set("clientBuName", v)}
                        />
                    </Field>

                    <Field label="Hiring Manager Details">
                        <Input
                            value={form.hmDetails}
                            onChange={v => set("hmDetails", v)}
                        />
                    </Field>

                    <Field label="Engineer Source">
                        <Input
                            value={form.engineerSource}
                            onChange={v => set("engineerSource", v)}
                        />
                    </Field>

                    <Field label="Client Onboarding Location">
                        <Select
                            value={form.clientOnboardingLocation}
                            onChange={v => set("clientOnboardingLocation", v)}
                            options={LOCATIONS}
                        />
                    </Field>

                    <Field label="Onboarding Type">
                        <Select
                            value={form.onboardingType}
                            onChange={v => set("onboardingType", v)}
                            options={["New", "Replacement"]}
                        />
                    </Field>

                    <Field label="Revenue Type">
                        <Select
                            value={form.revenueType}
                            onChange={v => set("revenueType", v)}
                            options={["T&M", "Fixed Cost", "ODC"]}
                        />
                    </Field>

                    <Field label="Currency">
                        <Select
                            value={form.currency}
                            onChange={v => set("currency", v)}
                            options={["INR", "USD", "EUR", "GBP"]}
                        />
                    </Field>

                    <Field label="Rate at Onboarding">
                        <Input
                            type="number"
                            value={form.rateAtOnboarding}
                            onChange={v => set("rateAtOnboarding", v)}
                        />
                    </Field>

                    <Field label="Rate Type">
                        <Select
                            value={form.rateType}
                            onChange={v => set("rateType", v)}
                            options={["Hourly", "Daily", "Monthly"]}
                        />
                    </Field>

                    <Field label="Client SPOC Contact Person">
                        <Input
                            value={form.clientSpoc}
                            onChange={v => set("clientSpoc", v)}
                        />
                    </Field>

                </div>
            </div>

            {/* ───────────── Offboarding ───────────── */}

            <div className="ops-section">
                <div className="ops-section-title">
                    Offboarding Tracker
                </div>

                <div className="ops-grid-2">

                    <Field label="Offboarding Month">
                        <Input
                            type="month"
                            value={form.offboardingMonth}
                            onChange={v => set("offboardingMonth", v)}
                        />
                    </Field>

                    <Field label="Offboarding Date">
                        <Input
                            type="date"
                            value={form.offboardingDate}
                            onChange={v => set("offboardingDate", v)}
                        />
                    </Field>

                    <Field label="Client Offboarding Location">
                        <Select
                            value={form.clientOffboardingLocation}
                            onChange={v => set("clientOffboardingLocation", v)}
                            options={LOCATIONS}
                        />
                    </Field>

                    <Field label="Reason">
                        <Input
                            value={form.offboardingReason}
                            onChange={v => set("offboardingReason", v)}
                        />
                    </Field>

                    <Field label="Revenue Impact">
                        <Select
                            value={form.revenueImpact}
                            onChange={v => set("revenueImpact", v)}
                            options={[
                                "Rev Loss",
                                "No Rev Loss",
                                "WIP",
                                "Working on Replacement",
                            ]}
                        />
                    </Field>

                    <Field label="Roll-Over">
                        <Select
                            value={form.rollOver}
                            onChange={v => set("rollOver", v)}
                            options={["Yes", "No"]}
                        />
                    </Field>

                    <div style={{ gridColumn: "1 / -1" }}>
                        <Field label="Comments">
                            <textarea
                                className="ops-textarea"
                                value={form.comments}
                                onChange={e => set("comments", e.target.value)}
                                rows={4}
                            />
                        </Field>
                    </div>

                </div>
            </div>
            <div className="ot-actions">
                <button
                    type="button"
                    className="btn-ghost"
                    onClick={onCancel}
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    className="btn-primary"
                >
                    Save Entry
                </button>
            </div>
        </>
    );
}