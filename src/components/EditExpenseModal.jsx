import { useState, useEffect } from "react";
import { apiFetch } from "../lib/api";
import Modal from "./Modal";

export default function EditExpenseModal({ 
  isOpen, 
  onClose, 
  expense, 
  onSave 
}) {
  const [formData, setFormData] = useState({
    category: "",
    amount: "",
    occurredOn: "",
    note: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Reset form when modal opens or expense changes
  useEffect(() => {
    if (isOpen && expense) {
      setFormData({
        category: expense.category,
        amount: expense.amount.toString(),
        occurredOn: new Date(expense.occurredOn).toISOString().split('T')[0],
        note: expense.note || ""
      });
      setError("");
    }
  }, [isOpen, expense]);

  function handleChange(field, value) {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // form validation
      if (!formData.category || !formData.amount || !formData.occurredOn) {
        setError("Please fill in all required fields");
        return;
      }

      const amount = parseFloat(formData.amount);
      if (amount <= 0 || isNaN(amount)) {
        setError("Amount must be a positive number");
        return;
      }

      // Prepare payload
      const payload = {
        category: formData.category,
        amount: amount,
        occurredOn: formData.occurredOn,
        note: formData.note || undefined
      };

      // Call API
      await apiFetch(`/expenses/${expense.id}`, {
        method: "PATCH",
        body: payload
      });

      // Success callback
      onSave();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update expense");
    } finally {
      setLoading(false);
    }
  }

  const categories = ["Food", "Transport", "Bills", "Shopping", "Health", "Entertainment", "Other"];

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title="Edit Expense"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {/* Category selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>

        {/* Amount input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Amount *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => handleChange("amount", e.target.value)}
            placeholder="0.00"
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Date selection */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Date *
          </label>
          <input
            type="date"
            value={formData.occurredOn}
            onChange={(e) => handleChange("occurredOn", e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Note input */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Note (Optional)
          </label>
          <input
            type="text"
            value={formData.note}
            onChange={(e) => handleChange("note", e.target.value)}
            placeholder="Add a note..."
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </Modal>
  );
}