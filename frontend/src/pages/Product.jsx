import { useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useParams, Link } from "react-router-dom";
import { getUserId, isFavorite, toggleFavorite } from "../lib/favorites";

function rub(n) {
  if (n == null) return "-";
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}
function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}
function stars(avg) {
  const v = clamp(Number(avg) || 0, 0, 5);
  const full = Math.floor(v);
  const half = v - full >= 0.5 ? 1 : 0;
  const empty = 5 - full - half;
  return "★".repeat(full) + (half ? "☆" : "") + "✩".repeat(empty);
}

export default function Product() {
  const { id } = useParams();
  const [p, setP] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");

  const [imgIdx, setImgIdx] = useState(0);
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    api.product(id)
      .then((data) => {
        setP(data);
        setImgIdx(0);
      })
      .catch((e) => setErr(e.message));
  }, [id]);

  useEffect(() => {
    if (!p) return;
    setIsFav(isFavorite(p.id));
  }, [p]);

  useEffect(() => {
    const sync = () => {
      if (!p) return;
      setIsFav(isFavorite(p.id));
    };
    window.addEventListener("favorites:changed", sync);
    window.addEventListener("auth:changed", sync);
    return () => {
      window.removeEventListener("favorites:changed", sync);
      window.removeEventListener("auth:changed", sync);
    };
  }, [p]);

  const images = useMemo(() => {
    if (!p) return [];
    const arr = (Array.isArray(p.images) && p.images) || (Array.isArray(p.photos) && p.photos) || [];
    const fromSingle = p.imageUrl ? [p.imageUrl] : [];
    const merged = [...arr, ...fromSingle].filter(Boolean);

    if (merged.length === 0) {
      merged.push("https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=80");
    }
    return Array.from(new Set(merged));
  }, [p]);

  useEffect(() => {
    if (imgIdx > images.length - 1) setImgIdx(0);
  }, [images, imgIdx]);

  const ratingInfo = useMemo(() => {
    if (!p) return { avg: 0, count: 0 };
    let avg =
      (typeof p.ratingAvg === "number" && p.ratingAvg) ||
      (typeof p.avgRating === "number" && p.avgRating) ||
      (typeof p.rating === "number" && p.rating) ||
      0;

    let count =
      (typeof p.ratingCount === "number" && p.ratingCount) ||
      (typeof p.reviewsCount === "number" && p.reviewsCount) ||
      (p.rating && typeof p.rating === "object" && Number(p.rating.count)) ||
      0;

    if (p.rating && typeof p.rating === "object") {
      avg = Number(p.rating.avg ?? p.rating.value ?? avg) || avg;
      count = Number(p.rating.count ?? p.rating.total ?? count) || count;
    }

    avg = clamp(Number(avg) || 0, 0, 5);
    count = Math.max(0, Number(count) || 0);
    return { avg, count };
  }, [p]);

  const seller = useMemo(() => {
    if (!p) return "—";
    const s = p.sellerName || p.sellerEmail || p.sellerLogin || p.seller || p.sellerId || p.ownerId || "";
    return s ? String(s) : "—";
  }, [p]);

  const description = useMemo(() => {
    if (!p) return "";
    const d = (p.description ?? p.desc ?? "").toString().trim();
    if (d) return d;
    return `Товар из категории «${p.category}». Подходит для ежедневного использования. Ниже доступны варианты (SKU) с ценой и остатком.`;
  }, [p]);

  async function add(skuId) {
    setMsg("");
    try {
      if (!localStorage.getItem("userId")) throw new Error("Сначала зайди (Вход в шапке)");
      await api.addToCart(skuId, 1);
      setMsg("Добавлено в корзину");
    } catch (e) {
      setMsg(e.message);
    }
  }

  function prevImg() {
    setImgIdx((v) => (v - 1 + images.length) % images.length);
  }
  function nextImg() {
    setImgIdx((v) => (v + 1) % images.length);
  }

  function onFav() {
    setMsg("");
    try {
      if (!getUserId()) throw new Error("Сначала войди");
      const now = toggleFavorite(p.id);
      setIsFav(now);
    } catch (e) {
      setMsg(e.message);
    }
  }

  if (err) return <main className="container" style={{ marginTop: 30 }}><p style={{ color: "red" }}>{err}</p></main>;
  if (!p) return <main className="container" style={{ marginTop: 30 }}><p>Loading...</p></main>;

  const currentImg = images[imgIdx];

  return (
    <main className="container" style={{ marginTop: 30, marginBottom: 40 }}>
      <style>{`
        .p-top{ display:flex; justify-content:flex-end; margin-bottom: 18px; }
        .p-grid{ display:grid; grid-template-columns: 1.05fr 1fr; gap: 18px; align-items:start; }
        @media (max-width: 980px){ .p-grid{ grid-template-columns: 1fr; } }
        .p-card{ border:1px solid #eee; border-radius:14px; background:#fff; overflow:hidden; box-shadow:0 10px 24px rgba(0,0,0,.05); }

        .p-media{ padding:12px; }
        .p-view{ position:relative; border-radius:12px; overflow:hidden; border:1px solid #eee; height:360px; background:#f3f4f6; }
        .p-view img{ width:100%; height:100%; object-fit:cover; display:block; }
        .p-navBtn{ position:absolute; top:50%; transform:translateY(-50%); border:0; background:rgba(17,24,39,.45); color:#fff; width:38px; height:38px; border-radius:999px; cursor:pointer; font-weight:900; }
        .p-navBtn.left{ left:10px; } .p-navBtn.right{ right:10px; }
        .p-dots{ display:flex; gap:8px; justify-content:center; padding:10px 0 0; }
        .p-dot{ width:8px; height:8px; border-radius:999px; border:0; cursor:pointer; background:rgba(17,24,39,.20); }
        .p-dot.active{ background:#4f46e5; }
        .p-thumbs{ display:flex; gap:10px; overflow:auto; padding:12px 2px 0; }
        .p-thumb{ width:76px; height:56px; border-radius:10px; overflow:hidden; border:2px solid transparent; cursor:pointer; flex:0 0 auto; background:#f3f4f6; }
        .p-thumb img{ width:100%; height:100%; object-fit:cover; display:block; }
        .p-thumb.active{ border-color:#4f46e5; }

        .p-info{ padding:16px 16px 18px; }
        .p-titleRow{ display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
        .p-title{ margin:0 0 6px; font-size:22px; font-weight:900; }
        .p-meta{ display:flex; gap:10px; flex-wrap:wrap; color:#6b7280; font-size:14px; margin-bottom:10px; }

        .favBtn{
          border: 1px solid #e5e7eb;
          background: #fff;
          border-radius: 12px;
          width: 44px;
          height: 44px;
          display:flex;
          align-items:center;
          justify-content:center;
          cursor:pointer;
        }
        .favBtn:hover{ filter: brightness(.98); }
        .favIcon{ width: 22px; height: 22px; }
        .favIcon path{ fill:none; stroke:#4b5563; stroke-width:2; }
        .favOn path{ fill:#ef4444; stroke:#ef4444; }

        .p-rating{ display:flex; align-items:center; gap:10px; margin:6px 0 14px; padding:10px 12px; border-radius:12px; border:1px solid #eee; background:#fafafa; }
        .p-ratingStars{ font-size:16px; }
        .p-ratingText{ color:#374151; font-weight:800; }
        .p-ratingCount{ color:#6b7280; font-size:13px; }

        .p-skus{ display:grid; gap:12px; margin-top:6px; }
        .p-sku{ border:1px solid #eee; border-radius:12px; padding:12px; display:flex; align-items:center; justify-content:space-between; gap:12px; }
        .p-skuLeft .v{ font-weight:900; }
        .p-skuLeft .s{ color:#6b7280; font-size:13px; margin-top:2px; }
        .p-skuRight{ display:flex; align-items:center; gap:12px; }
        .p-price{ font-weight:900; font-size:18px; }

        .p-seller{ margin-top:14px; padding:12px; border-radius:12px; border:1px solid #eee; background:#fff; }
        .p-seller .h{ font-weight:900; margin-bottom:6px; }
        .p-seller .v{ color:#374151; }

        .p-msg{ margin-top:12px; padding:12px; border:1px solid #eee; border-radius:12px; background:#fff; }

        .p-desc{ margin-top:18px; padding:16px; }
        .p-desc h3{ margin:0 0 8px; font-size:18px; font-weight:900; }
        .p-desc p{ margin:0; color:#4b5563; line-height:1.65; }
      `}</style>

      <div className="p-top">
        <Link to="/" className="btn" style={{ textDecoration: "none" }}>Назад</Link>
      </div>

      <div className="p-card">
        <div className="p-grid">
          <div className="p-media">
            <div className="p-view">
              <img src={currentImg} alt={p.title} />
              {images.length > 1 ? (
                <>
                  <button className="p-navBtn left" onClick={prevImg} aria-label="prev">‹</button>
                  <button className="p-navBtn right" onClick={nextImg} aria-label="next">›</button>
                </>
              ) : null}
            </div>

            {images.length > 1 ? (
              <>
                <div className="p-dots">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      className={`p-dot ${i === imgIdx ? "active" : ""}`}
                      onClick={() => setImgIdx(i)}
                    />
                  ))}
                </div>

                <div className="p-thumbs">
                  {images.map((src, i) => (
                    <div
                      key={src + i}
                      className={`p-thumb ${i === imgIdx ? "active" : ""}`}
                      onClick={() => setImgIdx(i)}
                    >
                      <img src={src} alt={`thumb-${i}`} />
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>

          <div className="p-info">
            <div className="p-titleRow">
              <h1 className="p-title">{p.title}</h1>

              <button
                className="favBtn"
                onClick={onFav}
                title={isFav ? "Убрать из избранного" : "В избранное"}
              >
                <svg className={`favIcon ${isFav ? "favOn" : ""}`} viewBox="0 0 24 24">
                  <path d="M12 21s-7-4.5-9.3-8.6C.9 9.3 2.2 6.6 4.7 5.6c1.7-.7 3.8-.2 5.2 1.2L12 9l2.1-2.2c1.4-1.4 3.5-1.9 5.2-1.2 2.5 1 3.8 3.7 2 6.8C19 16.5 12 21 12 21z" />
                </svg>
              </button>
            </div>

            <div className="p-meta">
              <span>Категория: <b>{p.category}</b></span>
              {p.status ? <span>Статус: <b>{p.status}</b></span> : null}
            </div>

            <div className="p-rating">
              <div className="p-ratingStars">{stars(ratingInfo.avg)}</div>
              <div>
                <div className="p-ratingText">{ratingInfo.avg.toFixed(1)} / 5.0</div>
                <div className="p-ratingCount">
                  {ratingInfo.count}{" "}
                  {ratingInfo.count === 1 ? "оценка" : ratingInfo.count < 5 ? "оценки" : "оценок"}
                </div>
              </div>
            </div>

            <div style={{ fontWeight: 900, marginBottom: 8 }}>Варианты (SKU)</div>
            <div className="p-skus">
              {p.skus.map((s) => (
                <div className="p-sku" key={s.id}>
                  <div className="p-skuLeft">
                    <div className="v">{s.variant}</div>
                    <div className="s">Остаток: {s.stock}</div>
                  </div>
                  <div className="p-skuRight">
                    <div className="p-price">{rub(s.price)}</div>
                    <button className="btn" onClick={() => add(s.id)}>В корзину</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-seller">
              <div className="h">Продавец</div>
              <div className="v">{seller}</div>
            </div>

            {msg ? <div className="p-msg">{msg}</div> : null}
          </div>
        </div>
      </div>

      <div className="p-card p-desc">
        <h3>Описание</h3>
        <p>{description}</p>
      </div>
    </main>
  );
}
