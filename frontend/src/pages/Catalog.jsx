import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { getUserId, isFavorite, toggleFavorite } from "../lib/favorites";

function rub(n) {
  if (n == null) return "-";
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1200&q=80";

function getPrice(p) {
  const v = Number(p?.minPrice);
  if (!Number.isNaN(v) && v > 0) return v;

  // если вдруг minPrice нет, попробуем из skus
  if (Array.isArray(p?.skus) && p.skus.length) {
    const prices = p.skus.map((s) => Number(s.price)).filter((x) => !Number.isNaN(x));
    if (prices.length) return Math.min(...prices);
  }
  return 0;
}

// Пытаемся вытащить рейтинг из разных форматов данных
function getRating(p) {
  const avg =
    Number(p?.ratingAvg) ||
    Number(p?.rating?.avg) ||
    Number(p?.rating?.value) ||
    Number(p?.avgRating) ||
    0;

  const count =
    Number(p?.ratingCount) ||
    Number(p?.rating?.count) ||
    Number(p?.rating?.votes) ||
    Number(p?.reviewsCount) ||
    (Array.isArray(p?.reviews) ? p.reviews.length : 0) ||
    0;

  const safeAvg = Math.max(0, Math.min(5, Number.isFinite(avg) ? avg : 0));
  const safeCount = Number.isFinite(count) ? count : 0;

  return { avg: safeAvg, count: safeCount };
}

export default function Catalog() {
  const [params] = useSearchParams();
  const q = (params.get("q") || "").trim().toLowerCase();

  const [products, setProducts] = useState([]);
  const [err, setErr] = useState("");
  const [, force] = useState(0); // чтобы перерисовать при изменении избранного

  // Фильтры: категории + цена
  const [catSelected, setCatSelected] = useState(() => new Set());
  const [draftFrom, setDraftFrom] = useState("");
  const [draftTo, setDraftTo] = useState("");
  const [priceFrom, setPriceFrom] = useState(null);
  const [priceTo, setPriceTo] = useState(null);

  useEffect(() => {
    api.products()
      .then(setProducts)
      .catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    const rerender = () => force((x) => x + 1);
    window.addEventListener("favorites:changed", rerender);
    window.addEventListener("auth:changed", rerender);
    return () => {
      window.removeEventListener("favorites:changed", rerender);
      window.removeEventListener("auth:changed", rerender);
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set();
    for (const p of products || []) {
      const c = (p.category || "").trim();
      if (c) set.add(c);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
  }, [products]);

  const filtered = useMemo(() => {
    const cats = catSelected;
    const hasCats = cats && cats.size > 0;

    return (products || []).filter((p) => {
      // search
      if (q) {
        const t = (p.title || "").toLowerCase();
        const c = (p.category || "").toLowerCase();
        if (!t.includes(q) && !c.includes(q)) return false;
      }

      // categories
      if (hasCats) {
        const c = (p.category || "").trim();
        if (!cats.has(c)) return false;
      }

      // price
      const price = getPrice(p);
      if (priceFrom != null && price < priceFrom) return false;
      if (priceTo != null && price > priceTo) return false;

      return true;
    });
  }, [products, q, catSelected, priceFrom, priceTo]);

  function onFav(e, productId) {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (!getUserId()) throw new Error("Сначала войди");
      toggleFavorite(productId);
      window.dispatchEvent(new Event("favorites:changed"));
    } catch (err2) {
      alert(String(err2.message || err2));
    }
  }

  function toggleCat(cat) {
    setCatSelected((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  function applyPrice() {
    const f = draftFrom.trim() ? Number(draftFrom) : null;
    const t = draftTo.trim() ? Number(draftTo) : null;
    setPriceFrom(Number.isFinite(f) ? f : null);
    setPriceTo(Number.isFinite(t) ? t : null);
  }

  function resetFilters() {
    setCatSelected(new Set());
    setDraftFrom("");
    setDraftTo("");
    setPriceFrom(null);
    setPriceTo(null);
  }

  return (
    <main className="container" style={{ marginTop: 30, marginBottom: 40 }}>
      <style>{`
        .layout{
          display:grid;
          grid-template-columns: 280px minmax(0, 1fr);
          gap: 18px;
          align-items:start;
        }
        @media (max-width: 980px){
          .layout{ grid-template-columns: 1fr; }
        }

        .sidebar{
          border: 1px solid #eee;
          border-radius: 14px;
          background:#fff;
          box-shadow: 0 10px 24px rgba(0,0,0,.05);
          padding: 16px;
          position: sticky;
          top: 16px;
        }
        @media (max-width: 980px){
          .sidebar{ position: static; }
        }

        .sTitle{ font-weight: 900; font-size: 18px; margin: 0 0 12px 0; }
        .sSection{ margin-top: 14px; }
        .sH{ font-weight: 800; margin: 0 0 10px 0; }
        .sList{ display:grid; gap: 10px; }
        .sRow{ display:flex; align-items:center; gap: 10px; font-size: 14px; }
        .sRow input{ width: 16px; height: 16px; }
        .sPrice{ display:grid; grid-template-columns: 1fr auto 1fr; gap: 10px; align-items:center; }
        .sPrice input{
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          outline: none;
          font-size: 14px;
        }
        .sPrice input:focus{ border-color: #93c5fd; box-shadow: 0 0 0 3px rgba(59,130,246,.12); }
        .sBtns{ display:grid; gap: 10px; margin-top: 14px; }
        .btnGhost{
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #111827;
        }

        .headRow{ display:flex; justify-content: space-between; align-items: end; gap: 12px; margin-bottom: 18px; }
        .subRow{ color:#6b7280; font-size: 13px; }

        .grid{
          display:grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 18px;
        }
        @media (max-width: 1100px){ .grid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 680px){ .grid{ grid-template-columns: 1fr; } }

        .card{
          position: relative;
          border: 1px solid #eee;
          border-radius: 14px;
          overflow:hidden;
          background:#fff;
          box-shadow: 0 10px 24px rgba(0,0,0,.05);
          text-decoration:none;
          color: inherit;
          display:flex;
          flex-direction: column;
        }
        .img{
          height: 190px;
          background:#f3f4f6;
          border-bottom: 1px solid #eee;
        }
        .img img{ width:100%; height:100%; object-fit:cover; display:block; }
        .body{ padding: 14px; display:grid; gap: 6px; }
        .title{ font-weight: 900; margin: 0; }
        .meta{ color:#6b7280; font-size: 13px; }

        .ratingRow{
          display:flex;
          align-items:center;
          justify-content: space-between;
          gap: 10px;
          margin-top: 2px;
        }
        .stars{
          --pct: 0%;
          font-size: 14px;
          letter-spacing: 1px;
          background: linear-gradient(90deg, #f59e0b var(--pct), #e5e7eb var(--pct));
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          user-select: none;
          line-height: 1;
        }
        .rMeta{
          color:#6b7280;
          font-size: 12px;
          white-space: nowrap;
        }

        .bottom{ display:flex; justify-content: space-between; align-items:center; gap: 12px; margin-top: 6px; }
        .price{ font-weight: 900; }

        .favBtn{
          position:absolute;
          top: 10px;
          right: 10px;
          border: 1px solid rgba(255,255,255,.65);
          background: rgba(255,255,255,.90);
          width: 42px;
          height: 42px;
          border-radius: 12px;
          cursor:pointer;
          display:flex;
          align-items:center;
          justify-content:center;
        }
        .favBtn:hover{ filter: brightness(.98); }
        .favIcon{ width: 22px; height: 22px; }
        .favIcon path{ fill:none; stroke:#4b5563; stroke-width:2; }
        .favOn path{ fill:#ef4444; stroke:#ef4444; }
      `}</style>

      <div className="headRow">
        <div>
          <h2 style={{ margin: 0 }}>Каталог</h2>
          <div className="subRow">
            Найдено: <b>{filtered.length}</b>
          </div>
        </div>
      </div>

      {err ? <p style={{ color: "red" }}>{err}</p> : null}

      <div className="layout">
        {/* LEFT FILTERS */}
        <aside className="sidebar">
          <div className="sTitle">Фильтры</div>

          <div className="sSection">
            <div className="sH">Категории</div>
            <div className="sList">
              {categories.length === 0 ? (
                <div style={{ color: "#6b7280", fontSize: 13 }}>Нет категорий</div>
              ) : (
                categories.map((c) => (
                  <label className="sRow" key={c}>
                    <input
                      type="checkbox"
                      checked={catSelected.has(c)}
                      onChange={() => toggleCat(c)}
                    />
                    <span>{c}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="sSection">
            <div className="sH">Цена, руб.</div>
            <div className="sPrice">
              <input
                inputMode="numeric"
                placeholder="От"
                value={draftFrom}
                onChange={(e) => setDraftFrom(e.target.value)}
              />
              <span style={{ color: "#9ca3af" }}>—</span>
              <input
                inputMode="numeric"
                placeholder="До"
                value={draftTo}
                onChange={(e) => setDraftTo(e.target.value)}
              />
            </div>

            <div className="sBtns">
              <button className="btn apply-filters" onClick={applyPrice}>
                Применить
              </button>
              <button className="btn btnGhost" onClick={resetFilters}>
                Сбросить
              </button>
            </div>
          </div>
        </aside>

        {/* GRID */}
        <section>
          <div className="grid">
            {filtered.map((p) => {
              const img =
                (Array.isArray(p.images) && p.images[0]) ||
                (Array.isArray(p.photos) && p.photos[0]) ||
                p.imageUrl ||
                FALLBACK_IMG;

              const fav = isFavorite(p.id);
              const price = getPrice(p);

              const { avg, count } = getRating(p);
              const pct = `${Math.round((avg / 5) * 100)}%`;

              return (
                <Link to={`/product/${p.id}`} className="card" key={p.id}>
                  <button
                    className="favBtn"
                    onClick={(e) => onFav(e, p.id)}
                    title={fav ? "Убрать из избранного" : "В избранное"}
                  >
                    <svg className={`favIcon ${fav ? "favOn" : ""}`} viewBox="0 0 24 24">
                      <path d="M12 21s-7-4.5-9.3-8.6C.9 9.3 2.2 6.6 4.7 5.6c1.7-.7 3.8-.2 5.2 1.2L12 9l2.1-2.2c1.4-1.4 3.5-1.9 5.2-1.2 2.5 1 3.8 3.7 2 6.8C19 16.5 12 21 12 21z" />
                    </svg>
                  </button>

                  <div className="img">
                    <img src={img} alt={p.title} />
                  </div>

                  <div className="body">
                    <p className="title">{p.title}</p>
                    <div className="meta">{p.category}</div>

                    <div className="ratingRow">
                      <span className="stars" style={{ "--pct": pct }} aria-label={`Рейтинг ${avg.toFixed(1)} из 5`}>
                        {"★★★★★"}
                      </span>
                      <span className="rMeta">
                        {count > 0 ? `${avg.toFixed(1)} (${count})` : "Нет оценок"}
                      </span>
                    </div>

                    <div className="bottom">
                      <div className="price">{rub(price)}</div>
                      <span className="btn" style={{ pointerEvents: "none" }}>Открыть</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
