const express = require("express");
const { readArray, writeArray, nextId } = require("../storage/jsonStore");
const { requireUser, requireRole } = require("../middleware/auth");

const router = express.Router();

router.use(requireUser, requireRole("seller", "admin"));

function maxNum(arr) {
  return arr.reduce((m, x) => {
    const n = Number(String(x.id || "").split("_")[1]) || 0;
    return Math.max(m, n);
  }, 0);
}

function ownOrAdmin(req, product) {
  return req.user.role === "admin" || product.sellerId === req.userId;
}

// GET /seller/products (только свои, admin видит все)
router.get("/products", async (req, res) => {
  const products = await readArray("products.json");
  const list = req.user.role === "admin" ? products : products.filter((p) => p.sellerId === req.userId);
  res.json(list);
});

// POST /seller/products
// body: {title,category,description,images:[...], skus:[{variant,price,stock},...]}
router.post("/products", async (req, res) => {
  const { title, category, description, images, skus } = req.body || {};
  if (!title || !category) return res.status(400).json({ error: "title/category required" });

  const products = await readArray("products.json");
  const allSkus = await readArray("skus.json");

  const product = {
    id: nextId("prd", maxNum(products)),
    title,
    category,
    description: description || "",
    images: Array.isArray(images) ? images.filter(Boolean) : [],
    imageUrl: Array.isArray(images) && images[0] ? images[0] : undefined,
    status: "active",
    sellerId: req.userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  products.push(product);

  const skuArr = Array.isArray(skus) ? skus : [];
  let maxSku = maxNum(allSkus);

  const createdSkus = skuArr.map((s) => {
    maxSku += 1;
    return {
      id: `sku_${String(maxSku).padStart(6, "0")}`,
      productId: product.id,
      variant: String(s.variant || "Default"),
      price: Number(s.price || 0),
      stock: Number(s.stock || 0),
    };
  });

  allSkus.push(...createdSkus);

  await writeArray("products.json", products);
  await writeArray("skus.json", allSkus);

  res.status(201).json({ ...product, skus: createdSkus });
});

// PUT /seller/products/:id (редактировать свои)
router.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const patch = req.body || {};

  const products = await readArray("products.json");
  const allSkus = await readArray("skus.json");

  const p = products.find((x) => x.id === id);
  if (!p) return res.status(404).json({ error: "product not found" });
  if (!ownOrAdmin(req, p)) return res.status(403).json({ error: "forbidden" });

  const allow = ["title", "category", "description", "status", "images", "imageUrl"];
  for (const k of allow) {
    if (patch[k] !== undefined) p[k] = patch[k];
  }
  if (Array.isArray(p.images) && p.images[0]) p.imageUrl = p.imageUrl || p.images[0];
  p.updatedAt = new Date().toISOString();

  // skus: можно добавлять/обновлять
  if (Array.isArray(patch.skus)) {
    // patch.skus: [{id?, variant, price, stock}]
    let maxSku = allSkus.reduce((m, x) => Math.max(m, Number(String(x.id).split("_")[1]) || 0), 0);

    for (const s of patch.skus) {
      if (s.id) {
        const exist = allSkus.find((x) => x.id === s.id && x.productId === p.id);
        if (exist) {
          if (s.variant !== undefined) exist.variant = String(s.variant);
          if (s.price !== undefined) exist.price = Number(s.price);
          if (s.stock !== undefined) exist.stock = Number(s.stock);
        }
      } else {
        maxSku += 1;
        allSkus.push({
          id: `sku_${String(maxSku).padStart(6, "0")}`,
          productId: p.id,
          variant: String(s.variant || "Default"),
          price: Number(s.price || 0),
          stock: Number(s.stock || 0),
        });
      }
    }
  }

  await writeArray("products.json", products);
  await writeArray("skus.json", allSkus);

  const ps = allSkus.filter((x) => x.productId === p.id);
  res.json({ ...p, skus: ps });
});

// DELETE /seller/products/:id
router.delete("/products/:id", async (req, res) => {
  const { id } = req.params;

  const products = await readArray("products.json");
  const skus = await readArray("skus.json");

  const p = products.find((x) => x.id === id);
  if (!p) return res.status(404).json({ error: "product not found" });
  if (!ownOrAdmin(req, p)) return res.status(403).json({ error: "forbidden" });

  await writeArray("products.json", products.filter((x) => x.id !== id));
  await writeArray("skus.json", skus.filter((s) => s.productId !== id));

  res.json({ ok: true });
});

module.exports = router;
