import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { getUserId, getFavIds, removeFavorite } from "../lib/favorites";

function rub(n) {
  if (n == null) return "-";
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

const FALLBACK_IMG =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80";

export default function Favorites() {
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");
  const [uid, setUid] = useState(getUserId());
  const [favIds, setFavIds] = useState(getFavIds());

  useEffect(() => {
    const sync = () => {
      setUid(getUserId());
      setFavIds(getFavIds());
    };
    window.addEventListener("favorites:changed", sync);
    window.addEventListener("auth:changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("favorites:changed", sync);
      window.removeEventListener("auth:changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    api.products().then(setItems).catch((e) => setErr(e.message));
  }, []);

  const favProducts = useMemo(() => {
    const set = new Set(favIds);
    return (items || []).filter((p) => set.has(p.id));
  }, [items, favIds]);

  function remove(productId) {
    removeFavorite(productId);
    setFavIds(getFavIds());
  }

  return (
    <main className="container" style={{ marginTop: 30, marginBottom: 40 }}>
      <style>{`
        .favHead{ display:flex; justify-content:space-between; align-items:center; gap: 12px; margin-bottom: 18px; }
        .favGrid{ display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; }
        @media (max-width: 1000px){ .favGrid{ grid-template-columns: repeat(2, minmax(0, 1fr)); } }
        @media (max-width: 680px){ .favGrid{ grid-template-columns: 1fr; } }

        .favCard{ border:1px solid #eee; border-radius:14px; overflow:hidden; background:#fff; box-shadow:0 10px 24px rgba(0,0,0,.05); display:flex; flex-direction:column; position:relative; }
        .favImg{ height:170px; background:#f3f4f6; border-bottom:1px solid #eee; }
        .favImg img{ width:100%; height:100%; object-fit:cover; display:block; }
        .favBody{ padding:14px; display:grid; gap: 6px; }
        .favTitle{ font-weight:900; margin:0; }
        .favMeta{ color:#6b7280; font-size:13px; }
        .favBottom{ display:flex; justify-content:space-between; align-items:center; gap: 12px; margin-top: 6px; }
        .favPrice{ font-weight:900; }

        .favBtn{
          position:absolute; top:10px; right:10px;
          border:1px solid rgba(255,255,255,.65);
          background: rgba(255,255,255,.90);
          width:42px; height:42px; border-radius:12px;
          cursor:pointer; display:flex; align-items:center; justify-content:center;
        }
        .favBtn:hover{ filter: brightness(.98); }
      `}</style>

      <div className="favHead">
        <h2 style={{ margin: 0 }}>Избранное</h2>
        <Link to="/" className="btn" style={{ textDecoration: "none" }}>В каталог</Link>
      </div>

      {err ? <p style={{ color: "red" }}>{err}</p> : null}

      {!uid ? (
        <div className="product-card">
          <div className="product-info">
            <h4>Нужно войти</h4>
            <p className="product-desc">Избранное хранится отдельно для каждого пользователя.</p>
            <Link to="/auth" className="btn" style={{ textDecoration: "none", display: "inline-block" }}>
              Перейти к входу
            </Link>
          </div>
        </div>
      ) : favProducts.length === 0 ? (
        <div className="product-card">
          <div className="product-info">
            <h4>Пусто</h4>
            <p className="product-desc">Добавляй товары через сердечко.</p>
          </div>
        </div>
      ) : (
        <div className="favGrid">
          {favProducts.map((p) => {
            const img =
              (Array.isArray(p.images) && p.images[0]) ||
              (Array.isArray(p.photos) && p.photos[0]) ||
              p.imageUrl ||
              FALLBACK_IMG;

            return (
              <div className="favCard" key={p.id}>
                <button className="favBtn" onClick={() => remove(p.id)} title="Убрать из избранного">
                  ❤️
                </button>

                <Link to={`/product/${p.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="favImg">
                    <img src={img} alt={p.title} />
                  </div>

                  <div className="favBody">
                    <p className="favTitle">{p.title}</p>
                    <div className="favMeta">{p.category}</div>
                    <div className="favBottom">
                      <div className="favPrice">{rub(p.minPrice)}</div>
                      <span className="btn" style={{ pointerEvents: "none" }}>Открыть</span>
                    </div>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
