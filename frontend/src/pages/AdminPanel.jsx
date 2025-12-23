import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { rub, fmtDate } from "../utils";

function badgeStyle(kind) {
  const map = {
    ok: { background: "#ecfdf3", border: "1px solid #a7f3d0", color: "#065f46" },
    warn: { background: "#fff7ed", border: "1px solid #fdba74", color: "#9a3412" },
    err: { background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b" },
    gray: { background: "#f3f4f6", border: "1px solid #e5e7eb", color: "#374151" },
  };
  return {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    ...map[kind],
  };
}

function statusBadge(s) {
  const st = String(s || "").toLowerCase();
  if (st === "active" || st === "delivered" || st === "succeeded") return ["ok", st];
  if (st === "paid" || st === "created") return ["gray", st];
  if (st === "cancelled" || st === "failed") return ["err", st];
  return ["gray", st || "—"];
}

export default function AdminPanel() {
  const role = localStorage.getItem("role") || "";
  const userId = localStorage.getItem("userId") || "";

  const [tab, setTab] = useState("users"); // users | orders | products
  const [q, setQ] = useState("");

  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const [editingId, setEditingId] = useState("");
  const [edit, setEdit] = useState({ title: "", category: "", status: "", description: "", imageUrl: "" });

  async function load() {
    setErr("");
    setMsg("");
    try {
      if (tab === "users") setUsers(await api.adminUsers());
      if (tab === "orders") setOrders(await api.adminOrders());
      if (tab === "products") setProducts(await api.adminProducts());
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    if (!userId) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const filteredUsers = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return users;
    return users.filter((u) =>
      `${u.email} ${u.id} ${u.role}`.toLowerCase().includes(s)
    );
  }, [users, q]);

  const filteredProducts = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;
    return products.filter((p) =>
      `${p.title} ${p.id} ${p.category} ${p.status}`.toLowerCase().includes(s)
    );
  }, [products, q]);

  const filteredOrders = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return orders;
    return orders.filter((o) =>
      `${o.id} ${o.userId} ${o.status}`.toLowerCase().includes(s)
    );
  }, [orders, q]);

  async function toggleBan(u) {
    setErr(""); setMsg("");
    try {
      await api.adminPatchUser(u.id, { banned: !u.banned });
      setMsg(!u.banned ? "Пользователь забанен" : "Пользователь разбанен");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function deleteOrder(orderId) {
    if (!confirm("Удалить заказ?")) return;
    setErr(""); setMsg("");
    try {
      await api.adminDeleteOrder(orderId);
      setMsg("Заказ удалён");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  function startEdit(p) {
    setEditingId(p.id);
    setEdit({
      title: p.title || "",
      category: p.category || "",
      status: p.status || "active",
      description: p.description || "",
      imageUrl: p.imageUrl || "",
    });
  }

  async function saveEdit(id) {
    setErr(""); setMsg("");
    try {
      const patch = {
        title: edit.title.trim(),
        category: edit.category.trim(),
        status: edit.status,
        description: edit.description,
        imageUrl: edit.imageUrl.trim(),
      };
      await api.adminPatchProduct(id, patch);
      setMsg("Товар обновлён");
      setEditingId("");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function deleteProduct(id) {
    if (!confirm("Удалить товар?")) return;
    setErr(""); setMsg("");
    try {
      await api.adminDeleteProduct(id);
      setMsg("Товар удалён");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  if (!userId) {
    return (
      <main className="container" style={{ marginTop: 30 }}>
        <h2>Админ панель</h2>
        <p>Нужно войти.</p>
      </main>
    );
  }

  if (role !== "admin") {
    return (
      <main className="container" style={{ marginTop: 30 }}>
        <h2>Админ панель</h2>
        <p>Доступ запрещён.</p>
      </main>
    );
  }

  return (
    <main className="container" style={{ marginTop: 30, marginBottom: 40 }}>
      <h2 style={{ marginBottom: 12 }}>Админ панель</h2>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
        <button className="btn" onClick={() => setTab("users")}>Пользователи</button>
        <button className="btn" onClick={() => setTab("orders")}>Заказы</button>
        <button className="btn" onClick={() => setTab("products")}>Товары</button>

        <div style={{ flex: 1 }} />
        <input
          style={{ minWidth: 260 }}
          placeholder="Поиск…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {err && <div style={{ color: "red", marginBottom: 10 }}>{err}</div>}
      {msg && <div style={{ color: "green", marginBottom: 10 }}>{msg}</div>}

      {/* USERS */}
      {tab === "users" && (
        <div style={{ display: "grid", gap: 10 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "2fr 1fr 1fr 140px",
              gap: 10,
              padding: "10px 12px",
              fontWeight: 800,
              color: "#111827",
            }}
          >
            <div>Email</div>
            <div>Роль</div>
            <div>Статус</div>
            <div></div>
          </div>

          {filteredUsers.map((u) => (
            <div
              key={u.id}
              style={{
                background: "#fff",
                border: "1px solid #eee",
                borderRadius: 14,
                padding: 12,
                display: "grid",
                gridTemplateColumns: "2fr 1fr 1fr 140px",
                gap: 10,
                alignItems: "center",
                boxShadow: "0 10px 30px rgba(0,0,0,.04)",
              }}
            >
              <div style={{ display: "grid", gap: 4 }}>
                <div style={{ fontWeight: 800 }}>{u.email}</div>
                <div style={{ fontSize: 12, color: "#6b7280" }}>{u.id}</div>
              </div>

              <div style={{ fontWeight: 700 }}>{u.role}</div>

              <div>
                {u.banned ? (
                  <span style={badgeStyle("err")}>banned</span>
                ) : (
                  <span style={badgeStyle("ok")}>active</span>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button className="btn" onClick={() => toggleBan(u)}>
                  {u.banned ? "Разбанить" : "Забанить"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ORDERS */}
      {tab === "orders" && (
        <div style={{ display: "grid", gap: 12 }}>
          {filteredOrders.map((o) => {
            const [kind, label] = statusBadge(o.status);
            const num = String(o.id || "").includes("_") ? String(o.id).split("_")[1] : o.id;

            return (
              <div
                key={o.id}
                style={{
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 10px 30px rgba(0,0,0,.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>
                    Заказ №{num}
                  </div>
                  <span style={badgeStyle(kind)}>{label}</span>
                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    <button className="btn" onClick={() => deleteOrder(o.id)}>
                      Удалить
                    </button>
                  </div>
                </div>

                <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
                  user: <b>{o.userId}</b> • создан: {fmtDate(o.createdAt)}
                </div>

                <div style={{ marginTop: 10, fontWeight: 900, fontSize: 20 }}>
                  {rub(o.total)} ₽
                </div>

                {Array.isArray(o.items) && o.items.length > 0 && (
                  <div style={{ marginTop: 10, display: "grid", gap: 8 }}>
                    {o.items.map((it, idx) => (
                      <div
                        key={it.orderItemId || it.itemId || idx}
                        style={{
                          border: "1px solid #f0f0f0",
                          borderRadius: 12,
                          padding: 10,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div style={{ display: "grid", gap: 2 }}>
                          <div style={{ fontWeight: 800 }}>
                            SKU: {it.skuId}
                          </div>
                          <div style={{ fontSize: 13, color: "#6b7280" }}>
                            qty: {it.qty} × {rub(it.price)} ₽
                          </div>
                        </div>
                        <div style={{ fontWeight: 900 }}>{rub(it.subtotal)} ₽</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PRODUCTS */}
      {tab === "products" && (
        <div style={{ display: "grid", gap: 12 }}>
          {filteredProducts.map((p) => {
            const [kind, label] = statusBadge(p.status);
            const isEditing = editingId === p.id;

            return (
              <div
                key={p.id}
                style={{
                  background: "#fff",
                  border: "1px solid #eee",
                  borderRadius: 14,
                  padding: 14,
                  boxShadow: "0 10px 30px rgba(0,0,0,.04)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ fontWeight: 900, fontSize: 18 }}>{p.title}</div>
                  <span style={badgeStyle(kind)}>{label}</span>

                  <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
                    {!isEditing ? (
                      <>
                        <button className="btn" onClick={() => startEdit(p)}>
                          Редактировать
                        </button>
                        <button className="btn" onClick={() => deleteProduct(p.id)}>
                          Удалить
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="btn" onClick={() => saveEdit(p.id)}>
                          Сохранить
                        </button>
                        <button className="btn" onClick={() => setEditingId("")}>
                          Отмена
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: 6, color: "#6b7280", fontSize: 13 }}>
                  id: <b>{p.id}</b> • category: <b>{p.category}</b> • seller: <b>{p.sellerId || "—"}</b>
                </div>

                {!isEditing ? (
                  <div style={{ marginTop: 10, color: "#111827" }}>
                    {p.description || <span style={{ color: "#9ca3af" }}>Без описания</span>}
                  </div>
                ) : (
                  <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    <input
                      value={edit.title}
                      onChange={(e) => setEdit((x) => ({ ...x, title: e.target.value }))}
                      placeholder="Название"
                    />
                    <input
                      value={edit.category}
                      onChange={(e) => setEdit((x) => ({ ...x, category: e.target.value }))}
                      placeholder="Категория"
                    />
                    <select
                      value={edit.status}
                      onChange={(e) => setEdit((x) => ({ ...x, status: e.target.value }))}
                    >
                      <option value="active">active</option>
                      <option value="draft">draft</option>
                      <option value="blocked">blocked</option>
                    </select>
                    <input
                      value={edit.imageUrl}
                      onChange={(e) => setEdit((x) => ({ ...x, imageUrl: e.target.value }))}
                      placeholder="imageUrl (ссылка)"
                    />
                    <textarea
                      value={edit.description}
                      onChange={(e) => setEdit((x) => ({ ...x, description: e.target.value }))}
                      placeholder="Описание"
                      rows={4}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
