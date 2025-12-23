const express = require("express");
const { readArray, writeArray } = require("../storage/jsonStore");
const { requireUser, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireUser);
router.use(requireRole("admin"));

function safeUser(u) {
  const { password, ...rest } = u;
  return rest;
}

// ---------- USERS ----------
router.get("/users", async (req, res) => {
  const users = await readArray("users.json");
  res.json(users.map(safeUser));
});

router.patch("/users/:id", async (req, res) => {
  const { id } = req.params;
  const patch = req.body || {};

  const users = await readArray("users.json");
  const u = users.find((x) => x.id === id);
  if (!u) return res.status(404).json({ error: "user not found" });

  if (typeof patch.banned === "boolean") u.banned = patch.banned;

  await writeArray("users.json", users);
  res.json(safeUser(u));
});

// ---------- ORDERS ----------
router.get("/orders", async (req, res) => {
  const orders = await readArray("orders.json");
  res.json(orders);
});

router.delete("/orders/:id", async (req, res) => {
  const { id } = req.params;

  const orders = await readArray("orders.json");
  const before = orders.length;
  const next = orders.filter((o) => o.id !== id);

  if (next.length === before) return res.status(404).json({ error: "order not found" });

  await writeArray("orders.json", next);

  // опционально: подчистим связанные сущности, если есть
  const cleanup = async (file, key = "orderId") => {
    try {
      const arr = await readArray(file);
      const filtered = arr.filter((x) => x[key] !== id);
      await writeArray(file, filtered);
    } catch (_) {}
  };
  await cleanup("payments.json", "orderId");
  await cleanup("shipments.json", "orderId");
  await cleanup("returns.json", "orderId");

  res.json({ ok: true });
});

// ---------- PRODUCTS ----------
router.get("/products", async (req, res) => {
  const products = await readArray("products.json");
  res.json(products);
});

router.patch("/products/:id", async (req, res) => {
  const { id } = req.params;
  const patch = req.body || {};

  const products = await readArray("products.json");
  const p = products.find((x) => x.id === id);
  if (!p) return res.status(404).json({ error: "product not found" });

  // разрешаем редактировать эти поля
  const allowed = ["title", "category", "description", "status", "imageUrl"];
  for (const k of allowed) {
    if (patch[k] !== undefined) p[k] = patch[k];
  }

  await writeArray("products.json", products);
  res.json(p);
});

router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  const products = await readArray("products.json");
  const before = products.length;
  const next = products.filter((p) => p.id !== id);

  if (next.length === before) return res.status(404).json({ error: "product not found" });

  await writeArray("products.json", next);

  // подчистим SKU этого товара
  try {
    const skus = await readArray("skus.json");
    const skusNext = skus.filter((s) => s.productId !== id);
    await writeArray("skus.json", skusNext);
  } catch (_) {}

  res.json({ ok: true });
});

module.exports = router;
