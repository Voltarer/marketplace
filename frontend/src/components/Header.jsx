import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { favCount, getUserId } from "../lib/favorites";

export default function Header() {
  const nav = useNavigate();
  const [params] = useSearchParams();

  const initial = useMemo(() => params.get("q") || "", [params]);
  const [q, setQ] = useState(initial);

  const [userId, setUserId] = useState(getUserId());
  const [role, setRole] = useState(localStorage.getItem("role") || "");
  const [favs, setFavs] = useState(favCount());

  useEffect(() => {
    const sync = () => {
      setUserId(getUserId());
      setRole(localStorage.getItem("role") || "");
      setFavs(favCount());
    };
    window.addEventListener("storage", sync);
    window.addEventListener("favorites:changed", sync);
    window.addEventListener("auth:changed", sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("favorites:changed", sync);
      window.removeEventListener("auth:changed", sync);
    };
  }, []);

  function submit(e) {
    e.preventDefault();
    const query = q.trim();
    nav(query ? `/?q=${encodeURIComponent(query)}` : "/");
  }

  function logout(e) {
    e.preventDefault();
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    localStorage.removeItem("lastOrderId");
    window.dispatchEvent(new Event("auth:changed"));
    nav("/auth");
  }

  return (
    <header className="header">
      <div className="container header-container">
        <Link to="/" className="logo">MARKETPLACE</Link>

        <form className="search-bar" onSubmit={submit}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Поиск товаров, категорий..."
          />
          <button type="submit">Найти</button>
        </form>

        <nav className="user-nav" style={{ display: "flex", gap: 18, alignItems: "center" }}>
          {(role === "buyer" || role === "seller") && (
          <Link to="/orders">Заказы</Link>
          )}
          {(role === "buyer") && ( <Link to="/cart">Корзина</Link> )}
          {(role === "buyer") && ( <Link to="/favorites" style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
            Избранное
            <span
              style={{
                minWidth: 22,
                height: 18,
                padding: "0 6px",
                borderRadius: 999,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 12,
                fontWeight: 800,
                border: "1px solid #e5e7eb",
                background: "#fff",
                color: "#111827",
              }}
            >
              {userId ? favs : 0}
            </span>
          </Link>
          )}
          {(role === "seller") && (
            <Link to="/seller">Мои товары</Link>
          )}
          {role === "admin" && (
            <Link to="/admin">Админ</Link>
          )}

          {!userId ? (
            <Link to="/auth">Вход</Link>
          ) : (
            <a href="#" onClick={logout} title={userId}>Выход</a>
          )}
        </nav>
      </div>
    </header>
  );
}
