const express = require("express");
const { readArray, writeArray, nextId } = require("../storage/jsonStore");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

// helper: get/create cart
async function getOrCreateCart(userId) {
  const carts = await readArray("carts.json");
  let cart = carts.find((c) => c.userId === userId);
  if (!cart) {
    const maxN = carts.reduce((m, c) => Math.max(m, Number(String(c.id).split("_")[1]) || 0), 0);
    cart = { id: nextId("crt", maxN), userId, items: [], total: 0 };
    carts.push(cart);
    await writeArray("carts.json", carts);
  }
  return cart;
}

function recalc(cart) {
  cart.total = cart.items.reduce((sum, it) => sum + it.subtotal, 0);
}

// GET /cart
router.get("/", requireUser, async (req, res) => {
  const cart = await getOrCreateCart(req.userId);
  res.json(cart);
});

// POST /cart/items { skuId, qty }
router.post("/items", requireUser, async (req, res) => {
  const { skuId, qty } = req.body || {};
  if (!skuId || !qty || qty < 1) return res.status(400).json({ error: "skuId, qty >= 1 required" });

  const skus = await readArray("skus.json");
  const sku = skus.find((s) => s.id === skuId);
  if (!sku) return res.status(404).json({ error: "sku not found" });

  const carts = await readArray("carts.json");
  let cart = carts.find((c) => c.userId === req.userId);
  if (!cart) {
    const maxN = carts.reduce((m, c) => Math.max(m, Number(String(c.id).split("_")[1]) || 0), 0);
    cart = { id: nextId("crt", maxN), userId: req.userId, items: [], total: 0 };
    carts.push(cart);
  }

  const existing = cart.items.find((i) => i.skuId === skuId);
  if (existing) {
    existing.qty += qty;
    existing.subtotal = existing.qty * existing.price;
  } else {
    const maxItem = cart.items.reduce((m, it) => Math.max(m, Number(String(it.itemId).split("_")[1]) || 0), 0);
    cart.items.push({
      itemId: nextId("cit", maxItem),
      skuId,
      qty,
      price: sku.price,
      subtotal: sku.price * qty
    });
  }

  recalc(cart);
  await writeArray("carts.json", carts);
  res.status(201).json(cart);
});

// DELETE /cart/items/:itemId
router.delete("/items/:itemId", requireUser, async (req, res) => {
  const { itemId } = req.params;
  const carts = await readArray("carts.json");
  const cart = carts.find((c) => c.userId === req.userId);
  if (!cart) return res.status(404).json({ error: "cart not found" });

  const before = cart.items.length;
  cart.items = cart.items.filter((x) => x.itemId !== itemId);
  if (cart.items.length === before) return res.status(404).json({ error: "item not found" });

  recalc(cart);
  await writeArray("carts.json", carts);
  res.json(cart);
});

module.exports = router;
