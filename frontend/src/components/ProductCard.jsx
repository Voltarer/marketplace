import { Link } from "react-router-dom";

function rub(n) {
  if (n == null) return "-";
  return new Intl.NumberFormat("ru-RU").format(n) + " ₽";
}

export default function ProductCard({ p }) {
  const img =
    p.imageUrl ||
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=80";

  return (
    <Link
      to={`/product/${p.id}`}
      className="product-card"
      style={{ textDecoration: "none", color: "inherit", display: "block" }}
      title="Открыть товар"
    >
      <div className="product-image">
        <img src={img} alt={p.title} />
      </div>

      <div className="product-info">
        <h4>{p.title}</h4>
        <p className="product-desc">{p.category}</p>

        {/* demo-надпись убрали */}
        <div className="rating">★★★★★</div>

        <div className="product-bottom">
          <div className="price">
            <span className="current-price">{rub(p.minPrice)}</span>
          </div>

          {/* вместо синего кружка — нормальная кнопка-лейбл (но кликабельна вся карточка) */}
          <span className="btn" style={{ pointerEvents: "none" }}>
            Подробнее
          </span>
        </div>
      </div>
    </Link>
  );
}
