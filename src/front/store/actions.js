const authHeaders = (token) => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${token}`,
});

export const fetchProducts = async (store, dispatch) => {
  const resp = await fetch(`${store.backendUrl}/api/products`);
  const data = await resp.json();
  dispatch({ type: "set_products", payload: data });
};

export const fetchMe = async (store, dispatch) => {
  if (!store.token) return;

  const resp = await fetch(`${store.backendUrl}/api/me`, {
    headers: authHeaders(store.token),
  });

  if (!resp.ok) {
    // token inválido → logout limpio
    localStorage.removeItem("token");
    dispatch({ type: "logout" });
    return;
  }

  const data = await resp.json();
  dispatch({ type: "login", payload: { user: data, token: store.token } });
};

export const fetchCart = async (store, dispatch) => {
  if (!store.token) {
    dispatch({ type: "set_cart", payload: [] });
    return;
  }

  const resp = await fetch(`${store.backendUrl}/api/cart-items`, {
    headers: authHeaders(store.token),
  });

  if (!resp.ok) {
    dispatch({ type: "set_cart", payload: [] });
    return;
  }

  const data = await resp.json();
  dispatch({ type: "set_cart", payload: data });
};

export const addToCart = async (store, dispatch, productId, quantity = 1) => {
  const resp = await fetch(`${store.backendUrl}/api/cart-items`, {
    method: "POST",
    headers: authHeaders(store.token),
    body: JSON.stringify({ product_id: productId, quantity }),
  });

  if (!resp.ok) throw new Error("No se pudo añadir al carrito");
  await fetchCart(store, dispatch);
};

export const updateCartItemQty = async (store, dispatch, itemId, newQty) => {
  const resp = await fetch(`${store.backendUrl}/api/cart-items/${itemId}`, {
    method: "PUT",
    headers: authHeaders(store.token),
    body: JSON.stringify({ quantity: newQty }),
  });

  if (!resp.ok) throw new Error("No se pudo actualizar cantidad");
  await fetchCart(store, dispatch);
};

export const deleteCartItem = async (store, dispatch, itemId) => {
  const resp = await fetch(`${store.backendUrl}/api/cart-items/${itemId}`, {
    method: "DELETE",
    headers: authHeaders(store.token),
  });

  if (!resp.ok) throw new Error("No se pudo borrar item");
  await fetchCart(store, dispatch);
};
