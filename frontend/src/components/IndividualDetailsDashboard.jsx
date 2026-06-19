import { useState, useEffect } from "react";
import { Chart } from "react-google-charts";
import { MONTHS, CLIENTS, VERTICALS } from "../constants/StringConstants";
import { fetchData } from "../api/clients";
import { DASHBOARD } from "../api/endpoints";

// Converts [{name: "RTL", count: 10}, ...] → Google Charts rows
function toChartData(label, apiArray) {
    if (!apiArray || apiArray.length === 0) return null;
    const rows = apiArray.map((item) => [item.name, item.count, String(item.count)]);
    return [[label, "Count", { role: "annotation" }], ...rows];
}

function DynamicChart({ type, data }) {
    if (!data || data.length <= 1) {
        return (
            <div style={{ textAlign: "center", color: "#94a3b8", padding: "40px 0", fontSize: 13 }}>
                No data
            </div>
        );
    }
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
    const [loading, setLoading] = useState(false);

    const [dashboardData, setDashboardData] = useState({
        demands: 0,
        positions: 0,
        selections: 0,
        onboardings: 0,
        offboardings: 0,
        net_adds: 0,
        charts: {
            selections_by_vertical: [],
            onboardings_by_vertical: [],
            selections_by_source: [],
            onboardings_by_source: [],
        },
    });

    const [filters, setFilters] = useState({
        client: "",
        month: "",
        week: "",
        from: "",
        to: "",
    });

    const [appliedFilters, setAppliedFilters] = useState({});

    useEffect(() => {
        getDashboardData();
    }, []);

    const getDashboardData = async () => {
        try {
            setLoading(true);
            const res = await fetchData(DASHBOARD);
            const data = res.data || res;

            setDashboardData({
                demands: data.demands || 0,
                positions: data.positions || 0,
                selections: data.selections || 0,
                onboardings: data.onboardings || 0,
                offboardings: data.offboardings || 0,
                net_adds: data.net_adds || 0,
                charts: {
                    selections_by_vertical: data.charts?.selections_by_vertical || [],
                    onboardings_by_vertical: data.charts?.onboardings_by_vertical || [],
                    selections_by_source: data.charts?.selections_by_source || [],
                    onboardings_by_source: data.charts?.onboardings_by_source || [],
                },
            });
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters((prev) => ({
            ...prev,
            [key]: value,
        }));
    };

    const handleSearch = async () => {
        try {
            const params = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params.append(key, value);
            });

            const url = `${DASHBOARD}?${params.toString()}`;
            const res = await fetchData(url);
            const data = res.data || res;

            setDashboardData({
                demands: data.demands || 0,
                positions: data.positions || 0,
                selections: data.selections || 0,
                onboardings: data.onboardings || 0,
                offboardings: data.offboardings || 0,
                net_adds: data.net_adds || 0,
                charts: {
                    selections_by_vertical: data.charts?.selections_by_vertical || [],
                    onboardings_by_vertical: data.charts?.onboardings_by_vertical || [],
                    selections_by_source: data.charts?.selections_by_source || [],
                    onboardings_by_source: data.charts?.onboardings_by_source || [],
                },
            });

            setAppliedFilters(filters);
        } catch (error) {
            console.error("Failed to fetch filtered dashboard data:", error);
        }
    };

    const handleReset = () => {
        setFilters({ client: "", month: "", week: "", from: "", to: "" });
        setAppliedFilters({});
        getDashboardData();
    };

    return (
        <div className="individual-dashboard">
            {loading && (
                <div className="page-loader">
                    <div className="loader-content">
                        <div className="spinner"></div>
                        <p>Loading...</p>
                    </div>
                </div>
            )}
            <div className="headcount-summary">
                <div className="summary-item" style={{ backgroundColor: "#EEF2FF" }}>
                    <div className="summary-title">#DEMANDS</div>
                    <div className="summary-value">{dashboardData.demands}</div>
                    <div className="summary-bar" style={{ backgroundColor: "#6366F1" }}></div>
                </div>

                <div className="summary-item" style={{ backgroundColor: "#ECFDF5" }}>
                    <div className="summary-title">#POSITIONS</div>
                    <div className="summary-value">{dashboardData.positions}</div>
                    <div className="summary-bar" style={{ backgroundColor: "#10B981" }}></div>
                </div>

                <div className="summary-item" style={{ backgroundColor: "#FFF7ED" }}>
                    <div className="summary-title">#SELECTIONS</div>
                    <div className="summary-value">{dashboardData.selections}</div>
                    <div className="summary-bar" style={{ backgroundColor: "#F97316" }}></div>
                </div>

                <div className="summary-item" style={{ backgroundColor: "#EFF6FF" }}>
                    <div className="summary-title">#ONBOARDED</div>
                    <div className="summary-value">{dashboardData.onboardings}</div>
                    <div className="summary-bar" style={{ backgroundColor: "#3B82F6" }}></div>
                </div>

                <div className="summary-item" style={{ backgroundColor: "#FEF2F2" }}>
                    <div className="summary-title">#OFFBOARDED</div>
                    <div className="summary-value">{dashboardData.offboardings}</div>
                    <div className="summary-bar" style={{ backgroundColor: "#EF4444" }}></div>
                </div>

                <div className="summary-item" style={{ backgroundColor: "#F5F3FF" }}>
                    <div className="summary-title">#NET ADDS</div>
                    <div className="summary-value">{dashboardData.net_adds}</div>
                    <div className="summary-bar" style={{ backgroundColor: "#8B5CF6" }}></div>
                </div>
            </div>

            <div className="individual-chart-grid">
                <div className="individual-chart-card full-width">
                    <div className="chart-header">
                        <h3>Selections by Vertical</h3>
                    </div>
                    <DynamicChart
                        type="ColumnChart"
                        data={toChartData("Vertical", dashboardData.charts.selections_by_vertical)}
                    />
                </div>

                <div className="individual-chart-card full-width">
                    <div className="chart-header">
                        <h3>Onboarding by Vertical</h3>
                    </div>
                    <DynamicChart
                        type="ColumnChart"
                        data={toChartData("Vertical", dashboardData.charts.onboardings_by_vertical)}
                    />
                </div>
            </div>
        </div>
    );
}