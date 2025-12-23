const express = require("express");
const { readArray, writeArray, nextId } = require("../storage/jsonStore");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

// POST /shipments { orderId }
router.post("/", requireUser, async (req, res) => {
  const { orderId } = req.body || {};
  if (!orderId) return res.status(400).json({ error: "orderId required" });

  const orders = await readArray("orders.json");
  const order = orders.find((o) => o.id === orderId && o.userId === req.userId);
  if (!order) return res.status(404).json({ error: "order not found" });
  if (order.status !== "paid") return res.status(409).json({ error: "order must be paid" });

  const shipments = await readArray("shipments.json");
  const maxN = shipments.reduce((m, s) => Math.max(m, Number(String(s.id).split("_")[1]) || 0), 0);

  const shipment = {
    id: nextId("shp", maxN),
    orderId,
    carrier: "mock-delivery",
    status: "created",
    trackingNumber: `TRK-${Math.floor(Math.random() * 1e9)}`,
    createdAt: new Date().toISOString()
  };

  shipments.push(shipment);
  order.status = "shipped";

  await writeArray("shipments.json", shipments);
  await writeArray("orders.json", orders);

  res.status(201).json({ shipment, order });
});

// POST /shipments/:id/status { status }
router.post("/:id/status", requireUser, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  if (!status) return res.status(400).json({ error: "status required" });

  const shipments = await readArray("shipments.json");
  const shipment = shipments.find((s) => s.id === id);
  if (!shipment) return res.status(404).json({ error: "shipment not found" });

  const orders = await readArray("orders.json");
  const order = orders.find((o) => o.id === shipment.orderId && o.userId === req.userId);
  if (!order) return res.status(404).json({ error: "order not found" });

  shipment.status = status;
  shipment.updatedAt = new Date().toISOString();

  if (status === "delivered") order.status = "delivered";

  await writeArray("shipments.json", shipments);
  await writeArray("orders.json", orders);

  res.json({ shipment, order });
});

module.exports = router;
