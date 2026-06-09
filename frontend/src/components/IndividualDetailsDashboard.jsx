import { useState } from "react";
import { Chart } from "react-google-charts";
import { MONTHS } from "../constants/StringConstants";

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

    const verticalData = [
        ["Vertical", "Count"],
        ["Embedded", 2],
        ["VLSI", 1],
    ];

    function DynamicChart({ type, data }) {
        return (
            <Chart
                chartType={type}
                width="100%"
                height="250px"
                data={data}
                options={{
                    legend: { position: "top" },
                    chartArea: { width: "80%", height: "70%" },
                    pieHole: type === "PieChart" ? 0.4 : undefined,
                }}
            />
        );
    }
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

    return (
        <div className="individual-dashboard">
            {/* Filters */}
            <div className="dashboard-filter-card">
                <label>MONTH</label>
                <select className="chart-select">
                    <option value="">All Months</option>
                    {MONTHS.map((month) => (
                        <option key={month} value={month}>
                            {month}
                        </option>
                    ))}
                </select>
                <label>WEEK</label>
                <select className="chart-select">
                    <option value="">All Weeks</option>
                    <option value="W1">W1</option>
                    <option value="W2">W2</option>
                    <option value="W3">W3</option>
                    <option value="W4">W4</option>
                </select>
                <label>FROM</label>
                <input type="date" />
                <label>TO</label>
                <input type="date" />
                <button>↻ Refresh</button>
            </div>

            {/* Metrics */}
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



            {/* Individual Details */}
            {/* <div className="dashboard-card">
                <div className="dashboard-card-title">
                    Individual Details
                </div>

                <div className="table-wrap">
                    <table className="dashboard-table">
                        <thead>
                            <tr>
                                <th>Employee ID</th>
                                <th>Engineer</th>
                                <th>Client</th>
                                <th>Vertical</th>
                                <th>Source</th>
                                <th>Status</th>
                                <th>Date</th>
                            </tr>
                        </thead>

                        <tbody>
                            {employees.map((emp) => (
                                <tr key={emp.emp_id}>
                                    <td>{emp.emp_id}</td>
                                    <td>{emp.engineer}</td>
                                    <td>{emp.client}</td>
                                    <td>{emp.vertical}</td>
                                    <td>{emp.source}</td>
                                    <td>{emp.status}</td>
                                    <td>{emp.date}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div> */}
        </div>
    );
}