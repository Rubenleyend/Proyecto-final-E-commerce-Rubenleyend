import { useEffect } from "react";
import useGlobalReducer from "../hooks/useGlobalReducer";

export default function Cart() {
  const { store, dispatch } = useGlobalReducer();

  const load = async () => {
    const res = await fetch(`${store.backendUrl}/api/cart-items`, {
      headers: { Authorization: `Bearer ${store.token}` },
    });

    const items = await res.json();
    dispatch({ type: "set_cart", payload: items });
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setQty = async (itemId, qty) => {
    // ✅ SI LLEGA A 0 (o menos) -> BORRAR
    if (qty <= 0) {
      await fetch(`${store.backendUrl}/api/cart-items/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${store.token}` },
      });
      await load();
      return;
    }

    // ✅ SI ES 1 O MÁS -> ACTUALIZAR
    await fetch(`${store.backendUrl}/api/cart-items/${itemId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${store.token}`,
      },
      body: JSON.stringify({ quantity: qty }),
    });

    await load();
  };

  const remove = async (itemId) => {
    await fetch(`${store.backendUrl}/api/cart-items/${itemId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${store.token}` },
    });
    await load();
  };

  const total = store.cartItems.reduce(
    (acc, it) => acc + ((it.product?.price_cents || 0) * it.quantity) / 100,
    0
  );

  return (
    <div>
      <h2 className="mb-3">Carrito</h2>

      {store.cartItems.length === 0 ? (
        <div className="alert alert-secondary">Carrito vacío</div>
      ) : (
        <div className="card p-3">
          {store.cartItems.map((it) => (
            <div
              key={it.id}
              className="d-flex justify-content-between align-items-center border-bottom py-2"
            >
              <div>
                <div className="fw-semibold">{it.product?.title}</div>
                <div className="text-muted small">
                  {(it.product?.price_cents || 0) / 100}€ / unidad
                </div>
              </div>

              <div className="d-flex align-items-center gap-2">
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setQty(it.id, it.quantity - 1)}
                >
                  –
                </button>

                <span className="fw-semibold">{it.quantity}</span>

                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setQty(it.id, it.quantity + 1)}
                >
                  +
                </button>

                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => remove(it.id)}
                >
                  🗑
                </button>
              </div>
            </div>
          ))}

          <div className="d-flex justify-content-between mt-3">
            <strong>Total</strong>
            <strong>{total.toFixed(2)}€</strong>
          </div>

          <button className="btn btn-primary w-100 mt-3">
            Pagar
          </button>
        </div>
      )}
    </div>
  );
}
