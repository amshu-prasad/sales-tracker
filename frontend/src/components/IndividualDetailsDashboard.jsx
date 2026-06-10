import { useState } from "react";
import { Chart } from "react-google-charts";
import { MONTHS, CLIENTS, VERTICALS } from "../constants/StringConstants";

function DynamicChart({ type, data }) {
    return (
        <Chart
            chartType={type}
            width="100%"
            height="180px"
            data={data}
            options={{
                legend: "none",
                chartArea: {
                    width: "80%",
                    height: "70%",
                    top: 20,
                    bottom: 80,
                },
                hAxis: {
                    slantedText: true,
                    slantedTextAngle: 35,
                    textStyle: {
                        fontSize: 12,
                    },
                },
                vAxis: {
                    minValue: 0,
                    textPosition: "none",
                },
                annotations: {
                    alwaysOutside: true,
                    stem: {
                        color: "transparent",
                    },
                    textStyle: {
                        fontSize: 14,
                        bold: true,
                        color: "#000",
                    },
                },
                bar: {
                    groupWidth: "15%",
                },
            }}
        />
    );
}

export default function IndividualDetailsDashboard() {

    const selectionVsSourceData = [
        ["Source", "Count"],
        ["Bench", 2],
        ["Partner", 1],
    ];

    const onboardingVsSourceData = [
        ["Source", "Count"],
        ["Bench", 1],
        ["Partner", 1],
    ];

    // const verticalData = [
    //     ["Vertical", "Count"],
    //     ["Embedded", 2],
    //     ["VLSI", 1],
    // ];
    const verticalData = [
        ["Vertical", "Count", { role: "annotation" }],
        ["Embedded", 2, "2"],
        ["RTL", 2, "2"],
        ["DFT", 12, "12"],
        ["VLSI", 10, "10"],
        ["DV", 6, "6"],
        ["AD", 5, "5"],
        ["AL", 16, "16"],
        ["PSV", 26, "26"],
        ["Emulation & Verification", 19, "19"],
    ];

    const [activeTab, setActiveTab] = useState("Individual Details");

    const employees = [
        {
            emp_id: "SS001",
            engineer: "Rahul Sharma",
            client: "Cisco",
            vertical: "Embedded",
            source: "Bench",
            status: "Onboarded",
            date: "10-Jun-2025",
        },
        {
            emp_id: "SS001",
            engineer: "Rahul Sharma",
            client: "Cisco",
            vertical: "Embedded",
            source: "Bench",
            status: "Onboarded",
            date: "10-Jun-2025",
        },
        {
            emp_id: "SS002",
            engineer: "Priya Nair",
            client: "Qualcomm",
            vertical: "VLSI",
            source: "Partner",
            status: "Selected",
            date: "12-Jun-2025",
        },
        {
            emp_id: "SS003",
            engineer: "Arun Kumar",
            client: "Bosch",
            vertical: "Embedded",
            source: "Bench",
            status: "Offboarded",
            date: "15-Jun-2025",
        },
    ];

    const onboarded = employees.filter(
        (e) => e.status === "Onboarded"
    ).length;

    const offboarded = employees.filter(
        (e) => e.status === "Offboarded"
    ).length;

    const selected = employees.filter(
        (e) => e.status === "Selected"
    ).length;

    const [filters, setFilters] = useState({
        client: "",
        month: "",
        week: "",
        from: "",
        to: "",
    });

    const [appliedFilters, setAppliedFilters] = useState({});

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSearch = () => {
        const payload = Object.fromEntries(
            Object.entries(filters).filter(
                ([_, value]) => value !== ""
            )
        );

        setAppliedFilters(payload);

        console.log(payload);
    };

    return (
        <div className="individual-dashboard">
            <div className="headcount-summary">
                <div
                    className="summary-item selections"
                    style={{ backgroundColor: "#ecfdf5" }}
                >
                    <div className="summary-title">TOTAL SELECTIONS</div>
                    <div className="summary-value">{selected}</div>
                    <div className="summary-bar green"></div>
                </div>

                <div
                    className="summary-item onboarded"
                    style={{ backgroundColor: "#eff6ff" }}
                >
                    <div className="summary-title">TOTAL ONBOARDED</div>
                    <div className="summary-value">{onboarded}</div>
                    <div className="summary-bar blue"></div>
                </div>

                <div
                    className="summary-item offboarded"
                    style={{ backgroundColor: "#fef2f2" }}
                >
                    <div className="summary-title">TOTAL OFFBOARDED</div>
                    <div className="summary-value">{offboarded}</div>
                    <div className="summary-bar red"></div>
                </div>

                <div
                    className="summary-item net"
                    style={{ backgroundColor: "#f0fdf4" }}
                >
                    <div className="summary-title">NET ADDS</div>
                    <div className="summary-value">{onboarded - offboarded}</div>
                    <div className="summary-bar green"></div>
                </div>
            </div>

            <div className="individual-chart-grid">
                <div className="individual-chart-card full-width">
                    <div className="chart-header">
                        <h3>Selections by Vertical</h3>
                    </div>
                    <DynamicChart
                        type="ColumnChart"
                        data={verticalData}
                    />
                </div>
                <div className="individual-chart-card full-width">
                    <div className="chart-header">
                        <h3>Onboarding by Vertical</h3>
                    </div>
                    <DynamicChart
                        type="ColumnChart"
                        data={verticalData}
                    />
                </div>
            </div>
        </div>
    );
}