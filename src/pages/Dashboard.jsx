import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { apiFetch, getMonthlyOverview,updateUser } from "../lib/api";
import { clearToken, clearUser, getUser } from "../lib/storage";
import { Pencil, Trash2, LogOut, Calendar, Plus, Settings } from "lucide-react";

import EditExpenseModal from "../components/EditExpenseModal"; 
import BudgetModal from "../components/BudgetModal";

export default function Dashboard() {
  const navigate = useNavigate();
  const user = getUser();

  const [month, setMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);

  //for edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // State for Budget Overview
  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false);
  const [overview, setOverview] = useState({ 
    total: 0, 
    budget: 0, 
    remaining: 0, 
    percentage: 0, 
    alert: null 
  });
  

  function handleEdit(expense) {
    setEditingExpense(expense);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingExpense(null);
  }

  async function handleSaveSuccess() {
    await load(); //reload data after save
  }

  const total = useMemo(
    () => expenses.reduce((s, e) => s + Number(e.amount || 0), 0),
    [expenses]
  );

  useEffect(() => { load(); }, [month]);

  async function load() {
    setLoading(true);
    try {
      const [eRes, sRes, oRes] = await Promise.all([
        apiFetch(`/expenses?month=${month}`),
        apiFetch(`/expenses/summary?month=${month}`),
        getMonthlyOverview(month), //
      ]);
      const mapped = (eRes.expenses || []).map(x => ({
        id: x._id || x.id,
        category: x.category,
        amount: x.amount,
        note: x.note,
        occurredOn: x.occurredOn,
      }));
      setExpenses(mapped);
      setSummary(sRes.summary || []);
      setOverview(oRes); //Store overview
    } catch (e) {
      console.error(e);
    } finally { setLoading(false); }
  }

  function logout() {
    clearToken(); clearUser(); navigate("/login");
  }

  async function addExpense(e) {
    e.preventDefault();

  const formEl = e.currentTarget;           
  const form = new FormData(formEl);

    const payload = {
      category: form.get("category"),
      amount: parseFloat(form.get("amount")),
      occurredOn: form.get("date"),
      note: form.get("note") || undefined,
    };

    await apiFetch("/expenses", { method: "POST", body: payload });

  formEl.reset();                            
    await load();
  }

  async function remove(id) {
    if (!confirm("Delete this expense?")) return;
    await apiFetch(`/expenses/${id}`, { method: "DELETE" });
    await load();
  }


  // Handle saving the budget
  async function handleSaveBudget(newAmount) {
    await updateUser({ monthlyBudget: newAmount });
    await load(); // Reload to recalculate numbers
  }

  // Helper for progress bar color
  const getProgressColor = () => {
    if (overview.alert === "OVERLIMIT") return "bg-red-500";
    if (overview.alert === "WARNING") return "bg-orange-500";
    return "bg-blue-600";
  };



  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="text-lg font-semibold">ExpenseFlow</div>
            <div className="text-xs text-slate-500">{user?.email}</div>
          </div>
          <button onClick={logout} className="inline-flex items-center gap-2 px-3 py-1.5 border rounded hover:bg-slate-50">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
        {/* Toolbar */}
        <div className="bg-blue-600">
          <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-3">
            <Calendar className="h-4 w-4 text-white/90" />
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="bg-white rounded px-2 py-1 text-sm"
            />
            <div className="flex-1" />
            <a href="#add" className="inline-flex items-center gap-2 bg-white text-blue-700 rounded px-3 py-1.5 font-medium">
              <Plus className="h-4 w-4" /> Add Expense
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 space-y-6">
        {/* KPI cards */}
        <section className="grid md:grid-cols-2 gap-4">

        {/* Total Spent / Budget Card */}
          <div className="bg-white border rounded-lg p-4 relative">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-sm text-slate-500">Total Spent</div>
                <div className="text-3xl font-semibold mt-2">
                  ${overview.total.toFixed(2)}
                </div>
              </div>
              <button 
                onClick={() => setBudgetModalOpen(true)}
                className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600"
                title="Edit Budget"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>

          {/* Budget Progress Bar */}
            {overview.budget > 0 ? (
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>
                    {overview.percentage}% of ${overview.budget} budget
                  </span>
                  <span className={overview.remaining < 0 ? "text-red-600 font-medium" : ""}>
                    {overview.remaining < 0 ? "Over by " : "Left: "} 
                    ${Math.abs(overview.remaining).toFixed(2)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div 
                    className={`h-2.5 rounded-full transition-all duration-500 ${getProgressColor()}`} 
                    style={{ width: `${Math.min(overview.percentage, 100)}%` }} 
                  />
                </div>
              </div>
            ) : (
              <div className="mt-4 text-xs text-slate-400 italic">
                No budget set. Click settings to track limits.
              </div>
            )}
          </div>

          <div className="bg-white border rounded-lg p-4">
            <div className="text-sm text-slate-500">Transactions</div>
            <div className="text-3xl font-semibold mt-2">{expenses.length}</div>
            <div className="text-xs text-slate-500 mt-1">
              {expenses.length === 1 ? "expense recorded" : "expenses recorded"}
            </div>
          </div>

        </section>

        {/* Category breakdown */}
        <section className="bg-white border rounded-lg">
          <div className="p-4 border-b">
            <div className="font-semibold">Category Breakdown</div>
            <div className="text-sm text-slate-500">Spending by category</div>
          </div>
          <div className="p-4 space-y-4">
            {loading && <div className="text-slate-500">Loading...</div>}
            {!loading && summary.length === 0 && (
              <div className="text-slate-500">No data for this month</div>
            )}
            {summary.map((row) => {
              const pct = total > 0 ? (row.total / total) * 100 : 0;
              return (
                <div key={row.category} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{row.category}</span>
                    <span className="text-slate-500">
                      ${row.total.toFixed(2)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-2 bg-blue-600" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Add expense */}
        <section id="add" className="bg-white border rounded-lg">
          <div className="p-4 border-b font-semibold">Add Expense</div>
          <form onSubmit={addExpense} className="p-4 grid gap-3 md:grid-cols-4">
            <select name="category" required className="border rounded px-3 py-2">
              <option value="">Category</option>
              {["Food","Transport","Bills","Shopping","Health","Entertainment","Other"].map(c =>
                <option key={c} value={c}>{c}</option>
              )}
            </select>
            <input name="amount" type="number" step="0.01" min="0" required placeholder="Amount"
                   className="border rounded px-3 py-2"/>
            <input name="date" type="date" required defaultValue={format(new Date(), "yyyy-MM-dd")}
                   className="border rounded px-3 py-2"/>
            <input name="note" placeholder="Note (optional)" className="border rounded px-3 py-2 md:col-span-3"/>
            <div className="md:col-span-1">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded px-3 py-2 font-medium">
                Save
              </button>
            </div>
          </form>
        </section>

        {/* Recent expenses table */}
        <section className="bg-white border rounded-lg">
          <div className="p-4 border-b">
            <div className="font-semibold">Recent Expenses</div>
            <div className="text-sm text-slate-500">{expenses.length} transaction(s) this month</div>
          </div>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="py-2">Date</th>
                  <th>Category</th>
                  <th className="hidden md:table-cell">Note</th>
                  <th className="text-right">Amount</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t">
                    <td className="py-2">{format(new Date(e.occurredOn), "MMM dd")}</td>
                    <td><span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">{e.category}</span></td>
                    <td className="hidden md:table-cell text-slate-600">{e.note || "—"}</td>
                    <td className="text-right font-medium">${Number(e.amount).toFixed(2)}</td>
                    <td className="text-right">

                      <button title="Edit" onClick={() => handleEdit(e)}
                              className="p-1.5 rounded hover:bg-slate-100 inline-flex">
                        <Pencil className="h-4 w-4" />

                      </button>
                      <button title="Delete" onClick={() => remove(e.id)}
                              className="p-1.5 rounded hover:bg-red-50 text-red-600 inline-flex">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && !loading && (
                  <tr><td className="py-6 text-slate-500" colSpan={5}>No expenses found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Budget Modal */}
      <BudgetModal 
        isOpen={isBudgetModalOpen}
        onClose={() => setBudgetModalOpen(false)}
        currentBudget={overview.budget}
        onSave={handleSaveBudget}
      />
      
      {/* edit expense modal */}
      <EditExpenseModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        expense={editingExpense}
        onSave={handleSaveSuccess}
      />
    </div>
  );
}
