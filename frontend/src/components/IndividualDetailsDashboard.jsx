import { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import { MONTHS, CLIENTS, VERTICALS } from "../constants/StringConstants";
import { fetchData } from "../api/clients";
import { DASHBOARD } from "../api/endpoints";

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
    const [dashboardData, setDashboardData] = useState({
        demands: 0,
        positions: 0,
        selections: 0,
        onboardings: 0,
        offboardings: 0,
        net_adds: 0,
    });

    useEffect(() => {
        getDashboardData();
    }, []);

    const getDashboardData = async () => {
        try {
            const data = await fetchData(DASHBOARD);
            setDashboardData(data);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        }
    };

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
                    className="summary-item"
                    style={{ backgroundColor: "#EEF2FF" }}
                >
                    <div className="summary-title">#DEMANDS</div>
                    <div className="summary-value">
                        {dashboardData.demands}
                    </div>
                    <div
                        className="summary-bar"
                        style={{ backgroundColor: "#6366F1" }}
                    ></div>
                </div>

                <div
                    className="summary-item"
                    style={{ backgroundColor: "#ECFDF5" }}
                >
                    <div className="summary-title">#POSITIONS</div>
                    <div className="summary-value">
                        {dashboardData.positions}
                    </div>
                    <div
                        className="summary-bar"
                        style={{ backgroundColor: "#10B981" }}
                    ></div>
                </div>

                <div
                    className="summary-item"
                    style={{ backgroundColor: "#FFF7ED" }}
                >
                    <div className="summary-title">#SELECTIONS</div>
                    <div className="summary-value">
                        {dashboardData.selections}
                    </div>
                    <div
                        className="summary-bar"
                        style={{ backgroundColor: "#F97316" }}
                    ></div>
                </div>

                <div
                    className="summary-item"
                    style={{ backgroundColor: "#EFF6FF" }}
                >
                    <div className="summary-title">#ONBOARDED</div>
                    <div className="summary-value">
                        {dashboardData.onboardings}
                    </div>
                    <div
                        className="summary-bar"
                        style={{ backgroundColor: "#3B82F6" }}
                    ></div>
                </div>

                <div
                    className="summary-item"
                    style={{ backgroundColor: "#FEF2F2" }}
                >
                    <div className="summary-title">#OFFBOARDED</div>
                    <div className="summary-value">
                        {dashboardData.offboardings}
                    </div>
                    <div
                        className="summary-bar"
                        style={{ backgroundColor: "#EF4444" }}
                    ></div>
                </div>

                <div
                    className="summary-item"
                    style={{ backgroundColor: "#F5F3FF" }}
                >
                    <div className="summary-title">#NET ADDS</div>
                    <div className="summary-value">
                        {dashboardData.net_adds}
                    </div>
                    <div
                        className="summary-bar"
                        style={{ backgroundColor: "#8B5CF6" }}
                    ></div>
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