const express = require("express");
const { readArray } = require("../storage/jsonStore");

const router = express.Router();

router.get("/", async (req, res) => {
  const skus = await readArray("skus.json"); // ✅ только имя файла
  res.json(skus);
});

router.get("/:id", async (req, res) => {
  const skus = await readArray("skus.json");
  const sku = skus.find((s) => s.id === req.params.id);
  if (!sku) return res.status(404).json({ message: "SKU not found" });
  res.json(sku);
});

module.exports = router;
