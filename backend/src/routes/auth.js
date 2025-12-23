const express = require("express");
const { readArray, writeArray, nextId } = require("../storage/jsonStore");
const { requireUser } = require("../middleware/auth");

const router = express.Router();

function maxNum(arr) {
  return arr.reduce((m, x) => {
    const n = Number(String(x.id || "").split("_")[1]) || 0;
    return Math.max(m, n);
  }, 0);
}

function publicUser(u) {
  return { id: u.id, email: u.email, role: u.role, banned: !!u.banned, createdAt: u.createdAt };
}

// POST /auth/register
router.post("/register", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email/password required" });

  const users = await readArray("users.json");
  if (users.some((u) => u.email === email)) return res.status(409).json({ error: "email exists" });

  const user = {
    id: nextId("usr", maxNum(users)),
    email,
    password,
    role: "buyer",
    banned: false,
    createdAt: new Date().toISOString(),
  };

  users.push(user);
  await writeArray("users.json", users);
  res.status(201).json({ userId: user.id, role: user.role });
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "email/password required" });

  const users = await readArray("users.json");
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ error: "bad credentials" });
  if (user.banned) return res.status(403).json({ error: "user banned" });

  res.json({ userId: user.id, role: user.role });
});

// GET /auth/me
router.get("/me", requireUser, async (req, res) => {
  const users = await readArray("users.json");
  const u = users.find((x) => x.id === req.userId);
  if (!u) return res.status(404).json({ error: "user not found" });
  res.json(publicUser(u));
});

module.exports = router;
