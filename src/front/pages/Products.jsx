import { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

export default function Products() {
  const { store, dispatch } = useGlobalReducer();
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const resp = await fetch(`${store.backendUrl}/api/products`);
        const data = await resp.json();
        dispatch({ type: "set_products", payload: data });
      } catch {
        setError("No se pudieron cargar productos.");
      }
    };
    load();
  }, [store.backendUrl]);

  const add = async (productId) => {
    if (!store.token) return alert("Debes hacer login para añadir al carrito");
    await fetch(`${store.backendUrl}/api/cart-items`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${store.token}`,
      },
      body: JSON.stringify({ product_id: productId, quantity: 1 }),
    });

    const items = await fetch(`${store.backendUrl}/api/cart-items`, {
      headers: { Authorization: `Bearer ${store.token}` },
    }).then(r => r.json());
    dispatch({ type: "set_cart", payload: items });
  };

  return (
    <div>
      <h2 className="mb-3">Products</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <table className="table table-striped align-middle">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Precio</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {store.products.map((p) => (
            <tr key={p.id}>
              <td>
                <div className="d-flex align-items-center gap-2">
                  {p.image_url && <img src={p.image_url} style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 8 }} />}
                  <div>
                    <div className="fw-semibold">{p.title}</div>
                    <div className="small text-muted">{p.description}</div>
                  </div>
                </div>
              </td>
              <td><strong>{(p.price_cents / 100).toFixed(2)}€</strong></td>
              <td className="text-end">
                <button className="btn btn-primary btn-sm" onClick={() => add(p.id)}>
                  Añadir al carrito
                </button>
              </td>
            </tr>
          ))}
          {store.products.length === 0 && (
            <tr><td colSpan="3" className="text-muted">No hay productos</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
