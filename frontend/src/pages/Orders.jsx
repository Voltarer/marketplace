import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { Link } from "react-router-dom";

function rub(n) {
  if (n == null) return "-";
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso || "-";
    return d.toLocaleString("ru-RU");
  } catch {
    return iso || "-";
  }
}

function orderNumber(orderId) {
  const m = String(orderId || "").match(/(\d{3,})$/);
  return m ? m[1] : String(orderId || "-");
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=70";

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [skuIndex, setSkuIndex] = useState({});
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function load() {
    setErr("");
    setMsg("");
    setLoading(true);
    try {
      const [orderList, products, skus] = await Promise.all([
        api.orders(),
        api.products(),
        api.skus(),
      ]);

      const productById = {};
      for (const p of products || []) productById[p.id] = p;

      // skuId -> { productId, title, variant, image }
      const idx = {};
      for (const s of skus || []) {
        const p = productById[s.productId];
        idx[String(s.id)] = {
          productId: s.productId,
          title: p?.title || `SKU: ${s.id}`,
          variant: s.variant || "",
          image: p?.imageUrl || FALLBACK_IMG,
        };
      }

      setOrders(orderList || []);
      setSkuIndex(idx);
    } catch (e) {
      setErr(String(e?.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function pay(orderId) {
    setMsg("");
    setErr("");
    try {
      const intent = await api.createPaymentIntent(orderId);
      await api.confirmPayment(intent.id);
      setMsg(`Оплачено: ${orderId}`);
      await load();
    } catch (e) {
      setErr(String(e?.message || e));
    }
  }

  const hasOrders = useMemo(() => orders && orders.length > 0, [orders]);

  return (
    <main className="container" style={{ marginTop: 30, marginBottom: 40 }}>
      <style>{`
        .o-top{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:18px;}
        .o-grid{display:grid;gap:14px;}
        .o-card{border:1px solid #eee;border-radius:14px;background:#fff;box-shadow:0 10px 24px rgba(0,0,0,.05);padding:16px;}
        .o-head{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;margin-bottom:10px;}
        .o-title{font-weight:900;font-size:18px;margin:0;}
        .o-sub{color:#6b7280;font-size:13px;margin-top:4px;display:grid;gap:2px;}
        .o-status{padding:6px 10px;border-radius:999px;font-weight:800;font-size:12px;border:1px solid rgba(2,6,23,.10);background:rgba(2,6,23,.04);color:#111827;white-space:nowrap;}
        .o-totalRow{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-top:6px;margin-bottom:12px;}
        .o-total{font-weight:900;font-size:20px;}
        .o-actions{display:flex;gap:10px;flex-wrap:wrap;align-items:center;justify-content:flex-end;}

        .o-items{display:grid;gap:10px;margin-top:10px;padding-top:12px;border-top:1px solid #f0f0f0;}
        .o-item{display:grid;grid-template-columns:56px 1fr auto;gap:12px;align-items:center;border:1px solid #f0f0f0;border-radius:12px;padding:10px;background:#fff;}
        .o-itemImg{width:56px;height:44px;border-radius:10px;overflow:hidden;border:1px solid #eee;background:#f3f4f6;}
        .o-itemImg img{width:100%;height:100%;object-fit:cover;display:block;}
        .o-itemTitle{font-weight:900;margin:0;line-height:1.2;}
        .o-itemMeta{color:#6b7280;font-size:13px;margin-top:4px;}
        .o-itemRight{text-align:right;display:grid;gap:2px;white-space:nowrap;}
        .o-itemSum{font-weight:900;}
      `}</style>

      <div className="o-top">
        <h2 style={{ margin: 0 }}>Заказы</h2>
        <Link to="/cart" className="btn" style={{ textDecoration: "none" }}>
          В корзину
        </Link>
      </div>

      {loading ? <p>Loading...</p> : null}
      {err ? <p style={{ color: "red" }}>{err}</p> : null}
      {msg ? <p>{msg}</p> : null}

      {!hasOrders ? (
        <div className="o-card">Заказов нет</div>
      ) : (
        <div className="o-grid">
          {orders.map((o) => {
            const items = o.items || [];
            const status = String(o.status || "");
            const canPay = status === "created";

            return (
              <div className="o-card" key={o.id}>
                <div className="o-head">
                  <div>
                    <div className="o-title">Заказ №{orderNumber(o.id)}</div>
                    <div className="o-sub">
                      <div>Статус: <b>{status}</b></div>
                      <div>Позиции: <b>{items.length}</b></div>
                      <div>Создан: <b>{fmtDate(o.createdAt)}</b></div>
                    </div>
                  </div>
                  <div className="o-status">{status}</div>
                </div>

                <div className="o-totalRow">
                  <div className="o-total">{rub(o.total)}</div>

                  <div className="o-actions">
                    <button className="btn" onClick={() => pay(o.id)} disabled={!canPay}>
                      Оплатить
                    </button>
                  </div>
                </div>

                <div className="o-items">
                  {items.map((it) => {
                    const skuId = String(it.skuId || "");
                    const info = skuIndex[skuId];

                    const title = info?.title || `SKU: ${skuId}`;
                    const variant = info?.variant ? ` • ${info.variant}` : "";
                    const img = info?.image || FALLBACK_IMG;

                    const qty = Number(it.qty || 1);
                    const price = Number(it.price || 0);
                    const subtotal = Number(it.subtotal || qty * price);

                    return (
                      <div className="o-item" key={it.orderItemId || `${o.id}-${skuId}`}>
                        <div className="o-itemImg">
                          <img src={img} alt={title} />
                        </div>

                        <div>
                          <div className="o-itemTitle">{title}{variant}</div>
                          <div className="o-itemMeta">Количество: {qty} × {rub(price)}</div>
                        </div>

                        <div className="o-itemRight">
                          <div className="o-itemSum">{rub(subtotal)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
