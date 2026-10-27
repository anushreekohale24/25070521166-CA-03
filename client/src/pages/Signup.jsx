import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";

export default function Signup() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api("/api/auth/signup", { method: "POST", body: form });
      nav("/login", { state: { msg: "Account created. Please login." } });
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
        <h2>Create your account</h2>
        <p className="muted">Sign up to manage student records.</p>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit}>
          <label>Full name</label>
          <input name="name" value={form.name} onChange={change} placeholder="Enter your full name
          " required />
          <label>Email</label>
          <input type="email" name="email" value={form.email} onChange={change} placeholder="you@example.com" required />
          <label>Password</label>
          <input type="password" name="password" value={form.password} onChange={change} placeholder="Minimum 6 characters" minLength={6} required />
          <button className="btn primary full" disabled={loading}>
            {loading ? "Creating..." : "Sign up"}
          </button>
        </form>
        <p className="switch">
          Already registered? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}
