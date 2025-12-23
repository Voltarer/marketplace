export default function SidebarFilters({
  categories,
  selected,
  setSelected,
  priceFrom,
  setPriceFrom,
  priceTo,
  setPriceTo,
  onApply
}) {
  function toggle(cat) {
    if (selected.includes(cat)) setSelected(selected.filter((c) => c !== cat));
    else setSelected([...selected, cat]);
  }

  return (
    <aside className="sidebar">
      <h3>Фильтры</h3>

      <div className="filter-section">
        <h4>Категории</h4>
        {categories.length === 0 ? (
          <div style={{ color: "#777" }}>Нет категорий</div>
        ) : (
          categories.map((c) => (
            <label key={c}>
              <input
                type="checkbox"
                checked={selected.includes(c)}
                onChange={() => toggle(c)}
              />
              {c}
            </label>
          ))
        )}
      </div>

      <div className="filter-section">
        <h4>Цена, руб.</h4>
        <div className="price-range">
          <input
            type="number"
            placeholder="От"
            min="0"
            value={priceFrom}
            onChange={(e) => setPriceFrom(e.target.value)}
          />
          <span>—</span>
          <input
            type="number"
            placeholder="До"
            min="0"
            value={priceTo}
            onChange={(e) => setPriceTo(e.target.value)}
          />
        </div>
      </div>

      <button className="btn apply-filters" onClick={onApply}>Применить</button>
    </aside>
  );
}
