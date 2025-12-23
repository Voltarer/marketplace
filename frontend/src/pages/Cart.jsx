import { useEffect, useState } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";

function rub(n) {
  if (n == null) return "-";
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=70";

export default function Cart() {
  const nav = useNavigate();
  const [cart, setCart] = useState(null);
  const [skuIndex, setSkuIndex] = useState({});
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  // следим за userId, чтобы при смене аккаунта корзина перезагрузилась
  const [sessionUserId, setSessionUserId] = useState(
    localStorage.getItem("userId") || ""
  );

  async function load() {
    setErr("");
    setMsg("");
    try {
      const [c, products, skus] = await Promise.all([
        api.cart(),
        api.products(),
        api.skus(),
      ]);

      const prodMap = {};
      for (const p of products || []) prodMap[p.id] = p;

      const skuMap = {};
      for (const s of skus || []) {
        const p = prodMap[s.productId];
        skuMap[s.id] = {
          productTitle: p?.title || `SKU: ${s.id}`,
          productImage: p?.imageUrl || FALLBACK_IMG,
          variant: s.variant || "",
        };
      }

      setCart(c);
      setSkuIndex(skuMap);
    } catch (e) {
      setErr(e.message);
      setCart(null);
    }
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onAuthChanged = () => {
      const uid = localStorage.getItem("userId") || "";
      setSessionUserId(uid);
    };
    const onStorage = (e) => {
      if (e.key === "userId") onAuthChanged();
    };

    window.addEventListener("auth:changed", onAuthChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("auth:changed", onAuthChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  useEffect(() => {
    // при смене userId перезагружаем корзину
    load();
  }, [sessionUserId]);

  async function del(itemId) {
    setMsg("");
    setErr("");
    try {
      await api.deleteCartItem(itemId);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function createOrder() {
    setMsg("");
    setErr("");
    try {
      const order = await api.createOrder();
      localStorage.setItem("lastOrderId", order.id);
      nav("/orders");
    } catch (e) {
      // чаще всего это как раз 400 cart empty при рассинхроне userId/cart
      setErr(e.message);
      await load();
    }
  }

  return (
    <main className="container" style={{ marginTop: 30 }}>
      <div className="products-header" style={{ marginBottom: 20 }}>
        <h2>Корзина</h2>
        <Link to="/" className="btn" style={{ textDecoration: "none" }}>
          В каталог
        </Link>
      </div>

      {err && <p style={{ color: "red" }}>{err}</p>}
      {msg && <p>{msg}</p>}

      {!cart ? (
        <p>Loading...</p>
      ) : (
        <div className="main-container" style={{ marginTop: 0 }}>
          <aside className="sidebar">
            <h3>Итог</h3>

            <div className="filter-section">
              <h4>Сумма</h4>
              <div style={{ fontSize: 22, fontWeight: 700 }}>
                {rub(cart.total)}
              </div>
            </div>

            <button
              className="btn apply-filters"
              onClick={createOrder}
              disabled={!cart.items || cart.items.length === 0}
              title={
                !cart.items || cart.items.length === 0
                  ? "Корзина пустая"
                  : "Создать заказ"
              }
            >
              Создать заказ
            </button>
          </aside>

          <section className="products">
            <div className="products-header">
              <h2>Товары</h2>
              <div style={{ color: "#777" }}>
                {(cart.items || []).length} шт.
              </div>
            </div>

            {!cart.items || cart.items.length === 0 ? (
              <div className="product-card">
                <div className="product-info">
                  <h4>Корзина пустая</h4>
                  <p className="product-desc">Добавь товары из каталога</p>
                  <Link
                    to="/"
                    className="btn"
                    style={{
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    Перейти в каталог
                  </Link>
                </div>
              </div>
            ) : (
              <div className="product-grid">
                {cart.items.map((it) => {
                  const sku = skuIndex[it.skuId] || {};
                  const title = sku.productTitle || `SKU: ${it.skuId}`;
                  const img = sku.productImage || FALLBACK_IMG;
                  const variant = sku.variant ? `(${sku.variant})` : "";

                  return (
                    <div className="product-card" key={it.itemId}>
                      <div
                        className="product-image"
                        style={{
                          height: 150,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          background: "#f8f8f8",
                        }}
                      >
                        <img
                          src={img}
                          alt={title}
                          style={{
                            maxHeight: "100%",
                            maxWidth: "100%",
                            objectFit: "cover",
                            borderRadius: 8,
                          }}
                        />
                      </div>

                      <div className="product-info">
                        <h4>{title}</h4>
                        <p className="product-desc">
                          {variant ? (
                            <>
                              {variant}
                              <br />
                            </>
                          ) : null}
                          Кол-во: {it.qty} × {rub(it.price)}
                        </p>

                        <div className="product-bottom">
                          <div className="price">
                            <span className="current-price">
                              {rub(it.subtotal)}
                            </span>
                          </div>

                          <button className="btn" onClick={() => del(it.itemId)}>
                            Удалить
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
