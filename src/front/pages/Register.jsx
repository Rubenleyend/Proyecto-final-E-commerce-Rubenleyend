import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export default function Register() {
  const { store } = useGlobalReducer();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    lastname: "",
    address: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setOk("");

    try {
      const resp = await fetch(`${store.backendUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "No se pudo registrar");

      setOk("Usuario creado ✅ Ahora haz login");
      setTimeout(() => navigate("/login"), 700);
    } catch (err) {
      setError(err.message || "Error");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 560 }}>
      <h2 className="mb-3">Crear cuenta</h2>

      {error && <div className="alert alert-danger">{error}</div>}
      {ok && <div className="alert alert-success">{ok}</div>}

      <form onSubmit={submit} className="card p-3">
        <div className="row g-2">
          <div className="col-md-6">
            <label className="form-label">Nombre</label>
            <input className="form-control" name="name" value={form.name} onChange={onChange} required />
          </div>
          <div className="col-md-6">
            <label className="form-label">Apellidos</label>
            <input className="form-control" name="lastname" value={form.lastname} onChange={onChange} required />
          </div>
        </div>

        <div className="mt-2">
          <label className="form-label">Dirección</label>
          <input className="form-control" name="address" value={form.address} onChange={onChange} required />
        </div>

        <div className="mt-2">
          <label className="form-label">Email</label>
          <input className="form-control" name="email" value={form.email} onChange={onChange} required />
        </div>

        <div className="mt-2">
          <label className="form-label">Contraseña</label>
          <input className="form-control" type="password" name="password" value={form.password} onChange={onChange} required />
        </div>

        <button className="btn btn-primary mt-3" type="submit">Crear cuenta</button>
      </form>
    </div>
  );
}
