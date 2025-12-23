const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

// health-check
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`API on http://localhost:${PORT}`));

const authRoutes = require("./routes/auth");
app.use("/auth", authRoutes);

const productRoutes = require("./routes/products");
app.use("/products", productRoutes);

const cartRoutes = require("./routes/cart");
app.use("/cart", cartRoutes);

const orderRoutes = require("./routes/orders");
app.use("/orders", orderRoutes);

const paymentRoutes = require("./routes/payments");
app.use("/payments", paymentRoutes);

const shipmentRoutes = require("./routes/shipments");
app.use("/shipments", shipmentRoutes);

app.use("/skus", require("./routes/skus"));

app.use("/auth", require("./routes/auth"));
app.use("/admin", require("./routes/admin"));
app.use("/seller", require("./routes/seller"));
