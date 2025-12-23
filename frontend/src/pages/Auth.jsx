import { useMemo, useState } from "react";
import { api } from "../api";
import { Link, useNavigate } from "react-router-dom";

export default function Auth() {
  const nav = useNavigate();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("buyer@local");
  const [password, setPassword] = useState("buyer");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const session = useMemo(() => {
    const userId = localStorage.getItem("userId") || "";
    const role = localStorage.getItem("role") || "";
    return { userId, role };
  }, []);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");
    if (!email.trim() || !password.trim()) {
      setErr("Заполни email и пароль");
      return;
    }
    setLoading(true);
    try {
      const data =
        mode === "signup"
          ? await api.register(email.trim(), password)
          : await api.login(email.trim(), password);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("role", data.role);
      window.dispatchEvent(new Event("auth:changed"));
      setMsg(mode === "signup" ? "Аккаунт создан" : "Вход выполнен");
      setTimeout(() => nav("/"), 250);
    } catch (e2) {
      setErr(String(e2?.message || e2));
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    window.dispatchEvent(new Event("auth:changed"));
    setMsg("Выход выполнен");
  }

  const currentUserId = localStorage.getItem("userId") || "";
  const currentRole = localStorage.getItem("role") || "";

  return (
    <main className="container" style={{ marginTop: 30 }}>
      <div className="products-header" style={{ marginBottom: 14 }}>
        <h2>{mode === "signup" ? "Регистрация" : "Вход"}</h2>
        <Link to="/" className="btn" style={{ textDecoration: "none" }}>
          В каталог
        </Link>
      </div>
      <div className="authWrap" style={{ display: "flex", justifyContent: "center" }}>
        <div
          className="authCard"
          style={{
            width: "100%",
            maxWidth: 720,
            background: "#fff",
            border: "1px solid #eee",
            borderRadius: 16,
            boxShadow: "0 10px 30px rgba(0,0,0,.06)",
            padding: 22,
          }}
        >
          <div className="tabs" style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <button
              type="button"
              className={`tabBtn ${mode === "login" ? "active" : ""}`}
              onClick={() => { setMode("login"); setErr(""); setMsg(""); }}
            >
              Вход
            </button>
            <button
              type="button"
              className={`tabBtn ${mode === "signup" ? "active" : ""}`}
              onClick={() => { setMode("signup"); setErr(""); setMsg(""); }}
            >
              Регистрация
            </button>
          </div>

          <form className="form" onSubmit={submit} style={{ display: "grid", gap: 12 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
            />
            <div style={{ position: "relative" }}>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type={showPwd ? "text" : "password"}
                placeholder="Пароль"
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "1px solid #e5e7eb",
                  padding: "6px 10px",
                  borderRadius: 10,
                }}
              >
                {showPwd ? "Скрыть" : "Показать"}
              </button>
            </div>

            <button
              className="btn"
              type="submit"
              disabled={loading}
              style={{ background: "#4f46e5", color: "#fff", padding: 12, borderRadius: 12 }}
            >
              {loading ? "..." : mode === "signup" ? "Создать" : "Войти"}
            </button>
          </form>

          {err && <div style={{ color: "red", marginTop: 10 }}>{err}</div>}
          {msg && <div style={{ color: "green", marginTop: 10 }}>{msg}</div>}

          {currentUserId && (
            <div
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 12,
                border: "1px solid #eee",
                background: "#f8f9fa",
              }}
            >
              <div>Текущая сессия:</div>
              <div>
                <b>{currentUserId}</b> • {currentRole}
              </div>
              <button onClick={logout} className="btn" style={{ marginTop: 10 }}>
                Выйти
              </button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
