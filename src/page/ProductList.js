import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

function ProductList() {
  const [searchId, setSearchId] = useState("");

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
            width: "98.8%",
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
    </div>
  );
}

export default ProductList;