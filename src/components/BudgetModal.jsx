import { useState, useEffect } from "react";
import Modal from "./Modal";

export default function BudgetModal({ isOpen, onClose, currentBudget, onSave }) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAmount(currentBudget || "");
    }
  }, [isOpen, currentBudget]);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await onSave(Number(amount));
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Monthly Budget">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Monthly Limit ($)
          </label>
          <input
            type="number"
            min="0"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="e.g. 2000"
          />
          <p className="text-xs text-slate-500 mt-2">
            Set to 0 to disable budget tracking.
          </p>
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save Budget"}
          </button>
        </div>
      </form>
    </Modal>
  );
}