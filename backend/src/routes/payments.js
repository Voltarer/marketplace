const express = require("express");
const { readArray, writeArray, nextId } = require("../storage/jsonStore");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

// POST /payments/intents { orderId }
router.post("/intents", requireUser, async (req, res) => {
  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ error: "orderId required" });

  const orders = await readArray("orders.json");
  const order = orders.find((o) => o.id === orderId && o.userId === req.userId);
  if (!order) return res.status(404).json({ error: "order not found" });

  const payments = await readArray("payments.json");
  const maxN = payments.reduce((m, p) => Math.max(m, Number(String(p.id).split("_")[1]) || 0), 0);

  const intent = {
    id: nextId("pay", maxN),
    orderId,
    provider: "mock",
    status: "created",
    createdAt: new Date().toISOString()
  };

  payments.push(intent);
  await writeArray("payments.json", payments);

  res.status(201).json(intent);
});

// POST /payments/intents/:id/confirm  -> succeeded + order paid
router.post("/intents/:id/confirm", requireUser, async (req, res) => {
  const { id } = req.params;

  const payments = await readArray("payments.json");
  const intent = payments.find((p) => p.id === id);
  if (!intent) return res.status(404).json({ error: "payment intent not found" });

  const orders = await readArray("orders.json");
  const order = orders.find((o) => o.id === intent.orderId && o.userId === req.userId);
  if (!order) return res.status(404).json({ error: "order not found" });

  intent.status = "succeeded";
  intent.confirmedAt = new Date().toISOString();

  order.status = "paid";

  await writeArray("payments.json", payments);
  await writeArray("orders.json", orders);

  res.json({ intent, order });
});

module.exports = router;
