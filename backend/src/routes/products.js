const express = require("express");
const { readArray, writeArray } = require("../storage/jsonStore");
const { requireUser, requireRole } = require("../middleware/auth");

const router = express.Router();

function ratingStats(ratings, productId) {
  const rs = ratings.filter((r) => r.productId === productId);
  const count = rs.length;
  const avg = count ? rs.reduce((s, r) => s + (Number(r.value) || 0), 0) / count : 0;
  return { ratingAvg: Number(avg.toFixed(2)), ratingCount: count };
}

// GET /products (покупателям только active)
router.get("/", async (req, res) => {
  const products = await readArray("products.json");
  const skus = await readArray("skus.json");
  const ratings = await readArray("ratings.json");

  const out = products
    .filter((p) => p.status === "active")
    .map((p) => {
      const ps = skus.filter((s) => s.productId === p.id);
      const minPrice = ps.length ? Math.min(...ps.map((x) => Number(x.price) || 0)) : null;
      return { ...p, minPrice, ...ratingStats(ratings, p.id) };
    });

  res.json(out);
});

// GET /products/:id
router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const products = await readArray("products.json");
  const skus = await readArray("skus.json");
  const ratings = await readArray("ratings.json");

  const p = products.find((x) => x.id === id);
  if (!p) return res.status(404).json({ error: "product not found" });

  const ps = skus.filter((s) => s.productId === id);
  res.json({ ...p, skus: ps, ...ratingStats(ratings, id) });
});

// POST /products/:id/ratings  body: {value:1..5}
router.post("/:id/ratings", requireUser, requireRole("buyer", "admin"), async (req, res) => {
  const { id: productId } = req.params;
  const value = Number(req.body?.value);

  if (!Number.isFinite(value) || value < 1 || value > 5) {
    return res.status(400).json({ error: "value must be 1..5" });
  }

  // проверка: пользователь покупал товар
  const orders = await readArray("orders.json");
  const skus = await readArray("skus.json");
  const skuToProduct = new Map(skus.map((s) => [s.id, s.productId]));

  const bought = orders
    .filter((o) => o.userId === req.userId && o.status !== "cancelled")
    .some((o) => (o.items || []).some((it) => skuToProduct.get(it.skuId) === productId));

  if (!bought && req.user.role !== "admin") {
    return res.status(403).json({ error: "you can rate only purchased products" });
  }

  const ratings = await readArray("ratings.json");
  const exist = ratings.find((r) => r.productId === productId && r.userId === req.userId);

  if (exist) {
    exist.value = value;
    exist.updatedAt = new Date().toISOString();
  } else {
    ratings.push({
      id: `rate_${Date.now()}`,
      productId,
      userId: req.userId,
      value,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  await writeArray("ratings.json", ratings);
  res.json({ ok: true, ...ratingStats(ratings, productId) });
});

module.exports = router;
