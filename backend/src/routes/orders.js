const express = require("express");
const { readArray, writeArray, nextId } = require("../storage/jsonStore");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

function maxN(arr, prefix) {
  return arr.reduce((m, x) => {
    const id = String(x.id || "");
    if (!id.startsWith(prefix + "_")) return m;
    const n = Number(id.split("_")[1]) || 0;
    return Math.max(m, n);
  }, 0);
}

// GET /orders
router.get("/", requireUser, async (req, res) => {
  const orders = await readArray("orders.json");
  res.json((orders || []).filter((o) => o.userId === req.userId));
});

// POST /orders (создать из корзины)
router.post("/", requireUser, async (req, res) => {
  const carts = await readArray("carts.json");   // <<< важно: carts.json
  const orders = await readArray("orders.json");

  const cart = (carts || []).find((c) => c.userId === req.userId);
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return res.status(400).json({ error: "cart empty" });
  }

  const orderId = nextId("ord", maxN(orders || [], "ord"));

  const items = cart.items.map((it, idx) => ({
    orderItemId: nextId("oit", idx), // локально внутри заказа
    skuId: it.skuId,
    qty: it.qty,
    price: it.price,
    subtotal: it.subtotal,
  }));

  const total = items.reduce((s, x) => s + (Number(x.subtotal) || 0), 0);

  const order = {
    id: orderId,
    userId: req.userId,
    status: "created",
    items,
    total,
    createdAt: new Date().toISOString(),
  };

  orders.push(order);

  // очистить корзину
  cart.items = [];
  cart.total = 0;

  await writeArray("orders.json", orders);
  await writeArray("carts.json", carts);

  res.status(201).json(order);
});

module.exports = router;
