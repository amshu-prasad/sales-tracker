export const CLIENTS = [
    "ADI",
    "Aion Semi",
    "Alphawave",
    "Amazon",
    "AMD Bangalore",
    "AMD Hyderabad",
    "Auradine",
    "Axiado",
    "Baya Systems",
    "Big endian",
    "Broadcom",
    "Cadence",
    "Cerebras System",
    "CEVA",
    "Cisco",
    "EU Client",
    "Google",
    "Green PMU",
    "GUC",
    "HydWyr",
    "Microchip",
    "Micron",
    "NextSilicon",
    "Nokia",
    "NXP",
    "Omni",
    "Qualcomm",
    "Samsung",
    "Sandisk",
    "SemiDynamics",
    "Sifive",
    "Silicon Labs",
    "Synopsys",
    "Tenstorrent",
    "TI",
    "Xilinx",
];

export const LOCATIONS = [
    "Bangalore",
    "Hyderabad",
    "Noida",
    "Pune",
    "Hubli",
    "Chennai",
    "Global",
    "Others",
];

export const VERTICALS = [
    "AD",
    "AL",
    "DFT",
    "DV",
    "Emulation & Validation",
    "Emulation & Verification",
    "PD",
    "PSV",
    "RTL",
    "Embedded",
    "System Design",
];

export const AMS = [
    "Jaibhima",
    "Sangita",
    "Sathvik",
    "Shalini",
    "Shantaveeresh",
    "Shubha",
    "Subhashini",
    "Sweatha M",
];

export const BUS = ["VLSI", "Embedded", "PES", "AI"];

export const MODES = ["T&M", "ODC"];

export const TEAMS = ["Indie Business", "Others", "Global"];

export const START_DATE_OPTIONS = [
    "Immediate",
    "15",
    "30",
    "30+",
];

export const PRIORITIES = ["High", "Medium", "Low"];

export const STATUSES = [
    "Open",
    "Closed by SS",
    "Closed by Others",
];

export const SOURCES = ["Bench", "Partner", "TA", "Employee Referral", "Pass Through"];

export const PROFILE_STATUSES = [
    "Profile Shortlist",
    "Profile Reject",
    "Interview to be Scheduled",
    "Interview in Progress",
    "Interview Happend",
    "Interview Hold",
    "Interview Select",
    "Interview Reject",
    "Final Selection",
    "Final Rejection",
];

export const OPEN_STATUSES = ["Open", "Closed by SS", "Closed by Others", "Client Hold","Low Priority by SS", "Low Priority by Client"];


export const STATUS_COLORS = {
    "Open": { bg: "#dcfce7", color: "#15803d", dot: "#16a34a" },
    "Closed by SS": { bg: "#dbeafe", color: "#1d4ed8", dot: "#2563eb" },
    "Closed by Others": { bg: "#fee2e2", color: "#b91c1c", dot: "#dc2626" },
};

export const PRIORITY_COLORS = {
    "High": { bg: "#fef3c7", color: "#92400e", dot: "#d97706" },
    "Medium": { bg: "#e0f2fe", color: "#075985", dot: "#0284c7" },
    "Low": { bg: "#f3f4f6", color: "#374151", dot: "#6b7280" },
};

export const MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December"
];

export const HEADERS = [
    { label: "Date", key: "Date" },
    { label: "Type", key: "Type" },
    { label: "Client", key: "Client" },
    { label: "Vertical", key: "Vertical" },
    { label: "Source", key: "Source" },
    { label: "Emp Type", key: "Emp Type" },
    { label: "Candidate", key: "Candidate" },
    { label: "Remarks", key: "Remarks" },
];

export const REVENUE_TYPE_OPTIONS = ["T&M", "Milestone", "Fixed"];
export const ONBOARDING_TYPE_OPTIONS = ["New", "Replacement"];
export const CURRENCY_OPTIONS = ["INR", "USD", "EUR", "GBP"];
export const RATE_TYPE_OPTIONS = ["Monthly", "Daily", "Hourly"];
export const ROLL_OVER_OPTIONS = ["Yes", "No"];



export const ONBOARDING_REQUIRED_FIELDS = [
    { key: "onboarding_month", label: "Onboarding Month" },
    { key: "client_onboarding_date", label: "Client Onboarding Date" },
    { key: "billing_start_date", label: "Billing Start Date" },
    { key: "reporting_manager_name", label: "Reporting Manager Name" },
    { key: "reporting_manager_email", label: "Reporting Manager Email" },
    { key: "client_onboarding_location", label: "Client Onboarding Location" },
    { key: "onboarding_type", label: "Onboarding Type" },
    { key: "revenue_type", label: "Revenue Type" },
    { key: "currency", label: "Currency" },
    { key: "rate_at_onboarding", label: "Rate at Onboarding" },
    { key: "rate_type", label: "Rate Type" },
    { key: "client_spoc", label: "Client SPOC Contact Person" },
];


// ─── Required fields config ───────────────────────────────────────────────────
export const REQUIRED_FIELDS = [
    { key: "client",                 label: "Client" },
    { key: "BU",                     label: "BU" },
    { key: "mode",                   label: "Mode" },
    { key: "team",                   label: "Team" },
    { key: "skill",                  label: "Skill" },
    { key: "month",                  label: "Month" },
    { key: "reqdate",                label: "Req Date" },
    { key: "location",               label: "Location" },
    { key: "no_of_positions",        label: "No of Positions" },
    { key: "experience",             label: "Experience" },
    { key: "expected_start_date",    label: "Expected Start Date" },
    { key: "technical_poc",          label: "SS Technical POC" },
    { key: "priority",               label: "Priority" },
    { key: "doable_headcount",       label: "Doable Head Count" },
    { key: "expected_closure_date",  label: "Expected Closure Date" },
    { key: "vertical",               label: "Vertical" },
    // { key: "jdFileName",             label: "JD Upload" },
    { key: "open_status",            label: "Status" },
    { key: "hiring_manager_name",    label: "Hiring Manager Name" },
    { key: "hiring_manager_email",   label: "Hiring Manager Email ID" },
    { key: "hiring_manager_phno",    label: "Hiring Manager Phone Number" },
    { key: "hiring_location",        label: "Hiring Manager Location" },
];