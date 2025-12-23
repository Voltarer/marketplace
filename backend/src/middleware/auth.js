const { readArray } = require("../storage/jsonStore");

async function loadUser(userId) {
  const users = await readArray("users.json");
  return users.find((u) => u.id === userId) || null;
}

async function requireUser(req, res, next) {
  const userId = req.header("x-user-id") || "";
  if (!userId) return res.status(401).json({ error: "unauthorized" });

  const user = await loadUser(userId);
  if (!user) return res.status(401).json({ error: "user not found" });
  if (user.banned) return res.status(403).json({ error: "user banned" });

  req.userId = user.id;
  req.user = { id: user.id, email: user.email, role: user.role, banned: !!user.banned };
  next();
}

function requireRole(...roles) {
  const allow = new Set(roles);
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });
    if (!allow.has(req.user.role)) return res.status(403).json({ error: "forbidden" });
    next();
  };
}

module.exports = { requireUser, requireRole };
