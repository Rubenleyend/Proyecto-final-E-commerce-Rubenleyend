import { useEffect, useState } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

export default function Home() {
  const { store, dispatch } = useGlobalReducer();
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setError("");
        const resp = await fetch(`${store.backendUrl}/api/products`);
        const data = await resp.json();
        dispatch({ type: "set_products", payload: data });
      } catch (e) {
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
    // refrescar carrito
    const items = await fetch(`${store.backendUrl}/api/cart-items`, {
      headers: { Authorization: `Bearer ${store.token}` },
    }).then(r => r.json());
    dispatch({ type: "set_cart", payload: items });
  };

  return (
    <div>
      <h2 className="mb-3">Productos</h2>
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3">
        {store.products.map((p) => (
          <div className="col-12 col-md-6 col-lg-4" key={p.id}>
            <div className="card h-100">
              {p.image_url && (
                <img src={p.image_url} className="card-img-top" style={{ height: 180, objectFit: "cover" }} />
              )}
              <div className="card-body">
                <h5 className="card-title">{p.title}</h5>
                <p className="card-text text-muted">{p.description}</p>
                <div className="d-flex justify-content-between align-items-center">
                  <strong>{(p.price_cents / 100).toFixed(2)}€</strong>
                  <button className="btn btn-primary btn-sm" onClick={() => add(p.id)}>
                    Añadir
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {store.products.length === 0 && <div className="text-muted">No hay productos</div>}
      </div>
    </div>
  );
}
