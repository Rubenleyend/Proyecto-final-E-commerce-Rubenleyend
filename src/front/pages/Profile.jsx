import { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

function Field({ label, name, value, editing, onEdit, onChange }) {
  return (
    <div className="mb-3">
      <label className="form-label d-flex justify-content-between">
        <span>{label}</span>
        <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onEdit(name)}>
          ✏️
        </button>
      </label>
      <input
        className="form-control"
        name={name}
        value={value}
        onChange={onChange}
        disabled={!editing}
      />
    </div>
  );
}

export default function Profile() {
  const { store, dispatch } = useGlobalReducer();

  const [form, setForm] = useState({ name: "", lastname: "", address: "", email: "", password: "" });
  const [editing, setEditing] = useState({ name: false, lastname: false, address: false, email: false, password: false });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar usuario actual
  useEffect(() => {
    if (!store.user && store.token) {
      fetch(`${store.backendUrl}/api/me`, {
        headers: { Authorization: `Bearer ${store.token}` },
      })
        .then((r) => r.json())
        .then((me) => dispatch({ type: "set_me", payload: me }));
    }
  }, [store.token]);

  useEffect(() => {
    if (store.user) {
      setForm({
        name: store.user.name || "",
        lastname: store.user.lastname || "",
        address: store.user.address || "",
        email: store.user.email || "",
        password: "",
      });
    }
  }, [store.user]);

  const onEdit = (field) => {
    setEditing((prev) => ({ ...prev, [field]: true }));
    setMsg("");
  };

  const onChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const payload = {
        name: form.name,
        lastname: form.lastname,
        address: form.address,
        email: form.email,
      };
      if (form.password) payload.password = form.password;

      const resp = await fetch(`${store.backendUrl}/api/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${store.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "No se pudo guardar");

      dispatch({ type: "set_me", payload: data });
      setEditing({ name: false, lastname: false, address: false, email: false, password: false });
      setForm((p) => ({ ...p, password: "" }));
      setMsg("Guardado ✅");
    } catch (err) {
      setMsg(err.message || "Error ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 600 }}>
      <h2 className="mb-3">Mi perfil</h2>

      <form onSubmit={save} className="card p-3">
        <Field label="Nombre" name="name" value={form.name} editing={editing.name} onEdit={onEdit} onChange={onChange} />
        <Field label="Apellidos" name="lastname" value={form.lastname} editing={editing.lastname} onEdit={onEdit} onChange={onChange} />
        <Field label="Dirección" name="address" value={form.address} editing={editing.address} onEdit={onEdit} onChange={onChange} />
        <Field label="Email" name="email" value={form.email} editing={editing.email} onEdit={onEdit} onChange={onChange} />

        <div className="mb-3">
          <label className="form-label d-flex justify-content-between">
            <span>Nueva contraseña (opcional)</span>
            <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => onEdit("password")}>
              ✏️
            </button>
          </label>
          <input
            className="form-control"
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            disabled={!editing.password}
            placeholder="Deja vacío si no quieres cambiarla"
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>

        {msg && <div className="alert alert-info mt-3">{msg}</div>}
      </form>
    </div>
  );
}
