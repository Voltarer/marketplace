import { useEffect, useState } from "react";
import { api } from "../api";
import { rub } from "../utils";

export default function SellerPanel() {
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    title: "",
    category: "",
    description: "",
    images: [""],
    skus: [{ variant: "", price: "", stock: "" }],
  });
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const data = await api.sellerProducts();
      setProducts(data);
    } catch (e) {
      setErr(String(e.message));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function createProduct() {
    setMsg("");
    try {
      const payload = {
        ...form,
        images: form.images.filter(Boolean),
        skus: form.skus.filter((s) => s.price),
      };
      await api.sellerCreateProduct(payload);
      setMsg("Товар создан");
      setForm({
        title: "",
        category: "",
        description: "",
        images: [""],
        skus: [{ variant: "", price: "", stock: "" }],
      });
      await load();
    } catch (e) {
      setErr(String(e.message));
    }
  }

  async function del(id) {
    if (!window.confirm("Удалить товар?")) return;
    await api.sellerDeleteProduct(id);
    await load();
  }

  function handleSkuChange(i, field, val) {
    setForm((f) => {
      const next = { ...f };
      next.skus[i][field] = val;
      return { ...next };
    });
  }

  return (
    <main className="container" style={{ marginTop: 30, marginBottom: 40 }}>
      <h2>Панель продавца</h2>
      {err && <p style={{ color: "red" }}>{err}</p>}
      {msg && <p style={{ color: "green" }}>{msg}</p>}

      <section style={{ marginBottom: 30 }}>
        <h3>Добавить товар</h3>
        <div style={{ display: "grid", gap: 8, maxWidth: 600 }}>
          <input
            placeholder="Название"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            placeholder="Категория"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
          <textarea
            placeholder="Описание"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <input
            placeholder="Фото (URL)"
            value={form.images[0]}
            onChange={(e) =>
              setForm({ ...form, images: [e.target.value || ""] })
            }
          />

          <h4>Варианты (SKU)</h4>
          {form.skus.map((s, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 6,
              }}
            >
              <input
                placeholder="Вариант"
                value={s.variant}
                onChange={(e) =>
                  handleSkuChange(i, "variant", e.target.value)
                }
              />
              <input
                placeholder="Цена"
                value={s.price}
                onChange={(e) =>
                  handleSkuChange(i, "price", e.target.value)
                }
              />
              <input
                placeholder="Остаток"
                value={s.stock}
                onChange={(e) =>
                  handleSkuChange(i, "stock", e.target.value)
                }
              />
            </div>
          ))}

          <button
            className="btn"
            onClick={() =>
              setForm((f) => ({
                ...f,
                skus: [...f.skus, { variant: "", price: "", stock: "" }],
              }))
            }
          >
            + Вариант
          </button>
          <button className="btn" onClick={createProduct}>
            Создать
          </button>
        </div>
      </section>

      <section>
        <h3>Мои товары</h3>
        <div className="grid" style={{ display: "grid", gap: 16 }}>
          {products.map((p) => (
            <div
              key={p.id}
              style={{
                border: "1px solid #eee",
                borderRadius: 10,
                padding: 12,
                background: "#fff",
              }}
            >
              <div style={{ fontWeight: 900 }}>{p.title}</div>
              <div>{p.category}</div>
              <div>{rub(p.minPrice)} ₽</div>
              <button className="btn" onClick={() => del(p.id)}>
                Удалить
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
