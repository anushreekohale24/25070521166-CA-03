import { useEffect, useState } from "react";

const EMPTY = { name: "", prn: "", email: "", course: "", year: "", division: "", phone: "" };

export default function StudentForm({ initial, onSave, onCancel, saving, error }) {
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    setForm(initial ? { ...EMPTY, ...initial } : EMPTY);
  }, [initial]);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="modal-back" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h3>{initial ? "Edit student" : "Add new student"}</h3>
        {error && <div className="alert error">{error}</div>}
        <form onSubmit={submit} className="grid-form">
          <div>
            <label>Full name *</label>
            <input name="name" value={form.name} onChange={change} required />
          </div>
          <div>
            <label>PRN *</label>
            <input name="prn" value={form.prn} onChange={change} required />
          </div>
          <div>
            <label>Email *</label>
            <input type="email" name="email" value={form.email} onChange={change} required />
          </div>
          <div>
            <label>Phone</label>
            <input name="phone" value={form.phone} onChange={change} />
          </div>
          <div>
            <label>Course *</label>
            <input name="course" value={form.course} onChange={change} placeholder="B.Tech CSE" required />
          </div>
          <div className="two">
            <div>
              <label>Year</label>
              <select name="year" value={form.year} onChange={change}>
                <option value="">Select</option>
                <option>1st</option>
                <option>2nd</option>
                <option>3rd</option>
                <option>4th</option>
              </select>
            </div>
            <div>
              <label>Division</label>
              <input name="division" value={form.division} onChange={change} placeholder="C" />
            </div>
          </div>
          <div className="actions">
            <button type="button" className="btn" onClick={onCancel}>
              Cancel
            </button>
            <button className="btn primary" disabled={saving}>
              {saving ? "Saving..." : initial ? "Update" : "Add student"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
