import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, clearSession, getUser } from "../api.js";
import StudentForm from "../components/StudentForm.jsx";

export default function Home() {
  const nav = useNavigate();
  const user = getUser();

  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async (q = "") => {
    setLoading(true);
    setPageError("");
    try {
      const data = await api("/api/students" + (q ? "?q=" + encodeURIComponent(q) : ""));
      setStudents(data);
    } catch (err) {
      setPageError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // initial load + debounced search
  useEffect(() => {
    const t = setTimeout(() => load(search), 300);
    return () => clearTimeout(t);
  }, [search, load]);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };

  const openAdd = () => {
    setEditing(null);
    setFormError("");
    setModal(true);
  };
  const openEdit = (s) => {
    setEditing(s);
    setFormError("");
    setModal(true);
  };

  const save = async (form) => {
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        await api("/api/students/" + editing._id, { method: "PUT", body: form });
        flash("Student updated");
      } else {
        await api("/api/students", { method: "POST", body: form });
        flash("Student added");
      }
      setModal(false);
      load(search);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm("Delete " + s.name + "?")) return;
    try {
      await api("/api/students/" + s._id, { method: "DELETE" });
      flash("Student deleted");
      load(search);
    } catch (err) {
      setPageError(err.message);
    }
  };

  const logout = () => {
    clearSession();
    nav("/login", { replace: true });
  };

  const courses = new Set(students.map((s) => s.course)).size;

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">🎓 Student Portal</div>
        <div className="user">
          <span className="hello">Hi, {user?.name || "User"}</span>
          <button className="btn" onClick={logout}>
            Logout
          </button>
        </div>
      </header>

      <main className="content">
        <section className="stats">
          <div className="stat">
            <span>{students.length}</span>
            <small>Students listed</small>
          </div>
          <div className="stat">
            <span>{courses}</span>
            <small>Courses</small>
          </div>
        </section>

        <section className="toolbar">
          <input
            className="search"
            placeholder="Search by name, PRN, email or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button className="btn primary" onClick={openAdd}>
            + Add student
          </button>
        </section>

        {pageError && <div className="alert error">{pageError}</div>}

        {loading ? (
          <p className="muted center">Loading students...</p>
        ) : students.length === 0 ? (
          <div className="empty">
            <p>No students found.</p>
            <button className="btn primary" onClick={openAdd}>
              Add the first student
            </button>
          </div>
        ) : (
          <div className="cards">
            {students.map((s) => (
              <article className="card" key={s._id}>
                <div className="avatar">{s.name.charAt(0).toUpperCase()}</div>
                <div className="info">
                  <h4>{s.name}</h4>
                  <p className="prn">PRN: {s.prn}</p>
                  <p>{s.email}</p>
                  <p>
                    {s.course}
                    {s.year ? " • Year " + s.year : ""}
                    {s.division ? " • Div " + s.division : ""}
                  </p>
                  {s.phone && <p>📞 {s.phone}</p>}
                </div>
                <div className="card-actions">
                  <button className="btn small" onClick={() => openEdit(s)}>
                    Edit
                  </button>
                  <button className="btn small danger" onClick={() => remove(s)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      {modal && (
        <StudentForm
          initial={editing}
          saving={saving}
          error={formError}
          onSave={save}
          onCancel={() => setModal(false)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
