// src/pages/Analytics.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { apiFetch, getMonthlyOverview } from "../lib/api";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export default function Analytics() {
  const navigate = useNavigate();

  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState([]); // per-category data
  const [overview, setOverview] = useState(null); // totals / budget info
  const [error, setError] = useState(null);

  // Load analytics whenever month changes
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        // Same endpoints Dashboard uses:
        //  - /expenses/summary?month=...
        //  - /expenses/summary/overview?month=...
        const [sRes, oRes] = await Promise.all([
          apiFetch(`/expenses/summary?month=${month}`),
          getMonthlyOverview(month),
        ]);

        setSummary((sRes && sRes.summary) || []);
        setOverview(
          oRes || {
            total: 0,
            budget: 0,
            remaining: 0,
            percentage: 0,
            alert: null,
          }
        );
      } catch (e) {
        console.error("Failed to load analytics:", e);
        setError("Failed to load analytics for this month.");
        setSummary([]);
        setOverview(null);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [month]);

  const totalSpending =
    overview?.total ??
    summary.reduce((sum, item) => sum + Number(item.total || 0), 0);

  // Build chart data from summary
  const chartData = summary.map((item) => {
    const category = item.category || item._id || "Other";
    const amount = Number(item.total || 0);
    const percent =
      totalSpending > 0 ? (amount / totalSpending) * 100 : 0;

    return {
      name: category,
      value: amount,
      percent,
    };
  });

  const COLORS = [
    "#2563eb",
    "#16a34a",
    "#dc2626",
    "#f59e0b",
    "#7c3aed",
    "#0d9488",
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-blue-600 text-white">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">ExpenseFlow – Analytics</div>
            <div className="text-xs text-blue-100">
              Insights for your spending
            </div>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 px-3 py-1.5 border border-blue-300 rounded bg-blue-500 hover:bg-blue-400 text-sm"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Month selector */}
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">
            Month:
          </label>
          <input
            type="month"
            className="border rounded px-2 py-1 text-sm"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          />
        </div>

        {/* Analytics card */}
        <div className="border rounded-lg bg-white p-4 text-slate-600">
          {loading && <div>Loading analytics…</div>}

          {error && (
            <div className="text-red-500 text-sm">
              {error}
            </div>
          )}

          {!loading && !error && (
            <>
              <h2 className="text-lg font-semibold mb-3">
                Summary for {month}
              </h2>

              {(!summary || summary.length === 0) &&
              (!totalSpending || totalSpending === 0) ? (
                <div className="text-sm text-slate-500">
                  No spending data for this month yet.
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Total */}
                  <div className="text-slate-700">
                    <strong>Total spending:</strong>{" "}
                    ${Number(totalSpending || 0).toFixed(2)}
                  </div>

                  {/* Text list */}
                  <div>
                    <div className="font-medium text-sm mb-2">
                      Spending by category
                    </div>
                    <ul className="space-y-1">
                      {summary.map((item) => {
                        const category =
                          item.category || item._id || "Other";
                        const amount = Number(item.total || 0);
                        const percent =
                          totalSpending > 0
                            ? (amount / totalSpending) * 100
                            : 0;

                        return (
                          <li
                            key={category}
                            className="flex items-center justify-between text-sm"
                          >
                            <span>{category}</span>
                            <span>
                              ${amount.toFixed(2)}{" "}
                              <span className="text-xs text-slate-400">
                                ({percent.toFixed(1)}%)
                              </span>
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  {/* Charts row */}
                  {chartData.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                      {/* Pie chart */}
                      <div className="border rounded-lg p-3">
                        <div className="text-sm font-medium mb-2">
                          Category distribution (pie)
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer
                            width="100%"
                            height="100%"
                            minWidth={100}
                            minHeight={100}
                          >
                            <PieChart>
                              <Pie
                                data={chartData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius={90}
                                label={(entry) =>
                                  `${entry.name} (${entry.percent.toFixed(
                                    0
                                  )}%)`
                                }
                              >
                                {chartData.map((entry, index) => (
                                  <Cell
                                    key={`cell-${entry.name}`}
                                    fill={
                                      COLORS[index % COLORS.length]
                                    }
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                formatter={(value) =>
                                  `$${Number(value).toFixed(2)}`
                                }
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      {/* Bar chart */}
                      <div className="border rounded-lg p-3">
                        <div className="text-sm font-medium mb-2">
                          Spending by category (bar)
                        </div>
                        <div className="h-64">
                          <ResponsiveContainer
                            width="100%"
                            height="100%"
                            minWidth={100}
                            minHeight={100}
                          >
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip
                                formatter={(value) =>
                                  `$${Number(value).toFixed(2)}`
                                }
                              />
                              <Bar dataKey="value">
                                {chartData.map((entry, index) => (
                                  <Cell
                                    key={`bar-${entry.name}`}
                                    fill={
                                      COLORS[index % COLORS.length]
                                    }
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
