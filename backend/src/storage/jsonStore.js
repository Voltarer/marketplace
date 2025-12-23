const fs = require("fs").promises;
const path = require("path");

function resolvePath(file) {
  // если уже абсолютный путь — не добавляем data/
  if (path.isAbsolute(file)) return file;
  return path.join(process.cwd(), "data", file);
}

async function readArray(file) {
  const p = resolvePath(file);
  try {
    let raw = await fs.readFile(p, "utf8");
    raw = raw.replace(/^\uFEFF/, "").trim(); // BOM + пробелы
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error(`[jsonStore] Ошибка чтения ${p}: ${e.message}`);
    return [];
  }
}

async function writeArray(file, data) {
  const p = resolvePath(file);
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(p, json, "utf8");
}

// nextId("crt", 0) -> "crt_000001"
function nextId(prefix, maxN, pad = 6) {
  const n = (Number(maxN) || 0) + 1;
  return `${prefix}_${String(n).padStart(pad, "0")}`;
}

module.exports = {
  readArray,
  writeArray,
  nextId,
};
