export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-section">
            <h4>MARKETPLACE</h4>
            <p>Демо-маркетплейс для курсовой: каталог, корзина, заказ, оплата и доставка (mock).</p>
          </div>

          <div className="footer-section">
            <h4>Помощь</h4>
            <a href="#">Доставка и оплата</a>
            <a href="#">Возврат</a>
            {/* Контакты убрали */}
          </div>

          <div className="footer-section">
            <h4>Мы в соцсетях</h4>
            <div className="social-links" style={{ display: "flex", gap: 12 }}>
              <a href="#">VK</a>
              <a href="#">TG</a>
              <a href="#">YT</a>
            </div>
          </div>
        </div>

        <p className="copyright">© 2025 MARKETPLACE. Все права защищены.</p>
      </div>
    </footer>
  );
}
