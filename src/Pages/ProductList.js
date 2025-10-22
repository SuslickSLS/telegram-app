// pages/ProductList.jsx
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

function ProductList() {
  const [searchId, setSearchId] = useState("");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Для демо - заглушка с товарами
  useEffect(() => {
    const demoProducts = [
      { id: 12345678, name: "Смартфон Xiaomi", price: 25999 },
      { id: 87654321, name: "Наушники Sony", price: 12999 },
      { id: 11223344, name: "Часы Apple Watch", price: 45999 },
    ];
    setProducts(demoProducts);
  }, []);

  const handleSearch = () => {
    if (searchId.trim()) {
      if (isNaN(searchId)) {
        // Показываем alert в стиле Telegram
        if (window.Telegram?.WebApp) {
          window.Telegram.WebApp.showAlert("Пожалуйста, введите числовой ID");
        } else {
          alert("Пожалуйста, введите числовой ID");
        }
        return;
      }
      window.location.href = `/product/${searchId}`;
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div>
      <h1 style={{ 
        color: "var(--tg-theme-text-color, #000000)",
        marginBottom: "20px"
      }}>
        📦 Список товаров
      </h1>
      
      {/* Блок поиска по ID */}
      <div style={{ 
        marginBottom: "20px",
        padding: "15px",
        backgroundColor: "var(--tg-theme-secondary-bg-color, #f0f0f0)",
        borderRadius: "10px"
      }}>
        <input
          type="text"
          placeholder="Введите ID товара WB"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          onKeyPress={handleKeyPress}
          style={{
            padding: "12px",
            width: "100%",
            border: "1px solid var(--tg-theme-hint-color, #999999)",
            borderRadius: "8px",
            backgroundColor: "var(--tg-theme-bg-color, #ffffff)",
            color: "var(--tg-theme-text-color, #000000)",
            marginBottom: "10px"
          }}
        />
        <button 
          onClick={handleSearch}
          style={{
            padding: "12px 20px",
            width: "100%",
            backgroundColor: "var(--tg-theme-button-color, #2481cc)",
            color: "var(--tg-theme-button-text-color, #ffffff)",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "16px",
            fontWeight: "bold"
          }}
        >
          🔍 Найти товар
        </button>
      </div>

      {/* Демо товары */}
      <div>
        <h3 style={{ color: "var(--tg-theme-text-color, #000000)" }}>
          Примеры товаров:
        </h3>
        <ul style={{ listStyle: "none", padding: 0 }}>
          {products.map((item) => (
            <li key={item.id} style={{ 
              marginBottom: "15px",
              padding: "15px",
              backgroundColor: "var(--tg-theme-secondary-bg-color, #f0f0f0)",
              borderRadius: "10px"
            }}>
              <strong style={{ color: "var(--tg-theme-text-color, #000000)" }}>
                {item.name}
              </strong> 
              <br />
              <span style={{ color: "var(--tg-theme-hint-color, #666666)" }}>
                Цена: {item.price.toLocaleString()} ₽
              </span>
              <br />
              <span style={{ color: "var(--tg-theme-hint-color, #666666)" }}>
                ID: {item.id}
              </span>
              <br />
              <Link to={`/product/${item.id}`}>
                <button style={{
                  padding: "8px 16px",
                  backgroundColor: "var(--tg-theme-button-color, #2481cc)",
                  color: "var(--tg-theme-button-text-color, #ffffff)",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  marginTop: "8px"
                }}>
                  📋 Подробнее
                </button>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default ProductList;