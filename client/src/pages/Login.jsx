import { useState } from "react";
import { Link, useLocation, useNavigate, Navigate } from "react-router-dom";
import { api, getToken, saveSession } from "../api.js";

export default function Login() {
  const nav = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (getToken()) return <Navigate to="/home" replace />;

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api("/api/auth/login", { method: "POST", body: form });
      saveSession(data.token, data.user);
      nav("/home", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="brand">🎓 Student Portal</div>
        <h2>Welcome back</h2>
        <p className="muted">Login to continue.</p>
        {location.state?.msg && <div className="alert success">{location.state.msg}</div>}
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit}>
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={change} placeholder="you@example.com" required />
          <label>Password</label>
          <input type="password" name="password" value={form.password} onChange={change} placeholder="Your password" required />
          <button className="btn primary full" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
        <p className="switch">
          New here? <Link to="/signup">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
