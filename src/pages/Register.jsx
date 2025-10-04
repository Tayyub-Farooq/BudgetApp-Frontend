import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiFetch } from "../lib/api";
import { setToken, setUser } from "../lib/storage";

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    try {
      const data = await apiFetch("/auth/register", { method: "POST", body: { email, password } });
      setToken(data.token);
      setUser(data.user);
      nav("/dashboard");
    } catch (e) { setErr(e.message); } finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow border">
        <div className="px-6 py-10">
          <h1 className="text-center text-2xl font-semibold">Create account</h1>
          <p className="text-center text-slate-500 mt-1">Start tracking your expenses</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-4 max-w-2xl mx-auto">
            {err && <div className="bg-red-50 text-red-700 border border-red-200 rounded p-3">{err}</div>}
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                     type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required/>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input className="w-full rounded border px-3 py-2 focus:outline-none focus:ring focus:ring-blue-200"
                     type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required minLength={6}/>
            </div>
            <button disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded py-2.5 font-medium disabled:opacity-60">
              {loading ? "Creating..." : "Create account"}
            </button>
            <p className="text-center text-sm text-slate-500">
              Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign in</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
