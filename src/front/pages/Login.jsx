import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

export default function Login() {
  const navigate = useNavigate();
  const { store, dispatch } = useGlobalReducer();

  const [email, setEmail] = useState("usuario1@example.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const resp = await fetch(`${store.backendUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.error || "Login incorrecto");

      dispatch({
        type: "login_success",
        payload: { token: data.access_token, user: data.user },
      });

      // cargar carrito
      const cart = await fetch(`${store.backendUrl}/api/cart-items`, {
        headers: { Authorization: `Bearer ${data.access_token}` },
      }).then(r => r.json());
      dispatch({ type: "set_cart", payload: cart });

      navigate("/products");
    } catch (err) {
      setError(err.message || "Error de login");
    }
  };

  return (
    <div className="container" style={{ maxWidth: 480 }}>
      <h2 className="mb-3">Login</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={submit} className="card p-3">
        <div className="mb-3">
          <label className="form-label">Email</label>
          <input className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>

        <div className="mb-3">
          <label className="form-label">Contraseña</label>
          <input className="form-control" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>

        <button className="btn btn-primary" type="submit">Entrar</button>
      </form>
    </div>
  );
}
