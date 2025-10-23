import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("main");

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);

        if (!id || isNaN(id)) {
          throw new Error("Неверный ID товара");
        }

        //https://my-telegram-app-production.up.railway.app/
        //const response = await fetch(`http://localhost:5000/api/local/raw/nmInfo?nmId=${id}`);
        const response = await fetch(`http://localhost:5000/api/local/raw/nmInfo?nmId=${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка сервера');
        }

        const apiData = await response.json();
        console.log("Данные от локального API:", apiData);

        const productData = apiData.value || apiData;
        setProduct(productData);

      } catch (err) {
        console.error("Ошибка:", err);
        setError(err.message || "Не удалось загрузить товар");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  const formatNumber = (num) => {
    if (num !== undefined && num !== null) {
      return num.toLocaleString();
    }
    return "0";
  };

  // Стили с использованием Telegram CSS переменных
  const styles = {
    container: {
      padding: "0",
      minHeight: "100vh",
      backgroundColor: "var(--tg-theme-bg-color, #ffffff)",
      color: "var(--tg-theme-text-color, #000000)"
    },
    tabContainer: {
      display: "flex", 
      borderBottom: "1px solid var(--tg-theme-hint-color, #dddddd)",
      backgroundColor: "var(--tg-theme-secondary-bg-color, #f8f9fa)"
    },
    tabButton: (isActive) => ({
      flex: 1,
      padding: "12px",
      border: "none",
      backgroundColor: isActive 
        ? "var(--tg-theme-button-color, #2481cc)" 
        : "var(--tg-theme-secondary-bg-color, #f8f9fa)",
      color: isActive 
        ? "var(--tg-theme-button-text-color, #ffffff)" 
        : "var(--tg-theme-text-color, #000000)",
      cursor: "pointer",
      fontSize: "14px"
    }),
    card: {
      backgroundColor: "var(--tg-theme-secondary-bg-color, #ffffff)",
      padding: "15px",
      borderRadius: "10px",
      marginBottom: "15px",
      border: "1px solid var(--tg-theme-hint-color, #e0e0e0)"
    },
    sectionTitle: {
      marginBottom: "15px",
      color: "var(--tg-theme-text-color, #000000)",
      fontSize: "18px",
      fontWeight: "600"
    },
    subtitle: {
      marginBottom: "10px",
      color: "var(--tg-theme-text-color, #000000)",
      fontSize: "16px",
      fontWeight: "500"
    },
    barcode: {
      padding: "4px 8px",
      backgroundColor: "var(--tg-theme-bg-color, #f0f0f0)",
      color: "var(--tg-theme-text-color, #000000)",
      borderRadius: "4px",
      fontSize: "12px",
      fontFamily: "monospace"
    },
    warehouseItem: (index) => ({
      padding: "12px",
      border: "1px solid var(--tg-theme-hint-color, #eeeeee)",
      borderRadius: "8px",
      marginBottom: "10px",
      backgroundColor: index % 2 === 0 
        ? "var(--tg-theme-bg-color, #f9f9f9)" 
        : "var(--tg-theme-secondary-bg-color, #ffffff)",
      color: "var(--tg-theme-text-color, #000000)"
    }),
    duplicateItem: {
      padding: "8px",
      backgroundColor: "var(--tg-theme-bg-color, #f0f0f0)",
      color: "var(--tg-theme-text-color, #000000)",
      borderRadius: "4px",
      marginBottom: "5px",
      fontSize: "14px"
    },
    primaryButton: {
      padding: "16px",
      width: "100%",
      backgroundColor: "var(--tg-theme-button-color, #2481cc)",
      color: "var(--tg-theme-button-text-color, #ffffff)",
      border: "none",
      borderRadius: "10px",
      cursor: "pointer",
      fontSize: "18px",
      fontWeight: "bold",
      marginBottom: "15px"
    },
    secondaryButton: {
      padding: "12px",
      width: "100%",
      backgroundColor: "var(--tg-theme-secondary-bg-color, #f0f0f0)",
      color: "var(--tg-theme-text-color, #000000)",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer"
    },
    errorText: {
      color: "var(--tg-theme-destructive-text-color, #ff0000)",
      textAlign: "center",
      padding: "20px"
    },
    loadingText: {
      color: "var(--tg-theme-text-color, #000000)",
      textAlign: "center"
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <p style={styles.loadingText}>🔄 Загружаем информацию о товаре...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <p style={styles.errorText}>
          ❌ {error}
        </p>
        <Link to="/" style={{ display: "block", textAlign: "center", marginTop: "20px" }}>
          <button style={styles.secondaryButton}>
            ← Назад к поиску
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Табы для переключения между разделами */}
      <div style={styles.tabContainer}>
        <button
          onClick={() => setActiveTab("main")}
          style={styles.tabButton(activeTab === "main")}
        >
          Основное
        </button>
        <button
          onClick={() => setActiveTab("stocks")}
          style={styles.tabButton(activeTab === "stocks")}
        >
          Склады
        </button>
        <button
          onClick={() => setActiveTab("financial")}
          style={styles.tabButton(activeTab === "financial")}
        >
          Финансы
        </button>
      </div>

      <div style={{ padding: "20px" }}>
        
        {/* Основная информация */}
        {activeTab === "main" && (
          <div>
            <div style={styles.card}>
              <h2 style={styles.sectionTitle}>Основная информация</h2>
              
              <div style={{ display: "grid", gap: "8px" }}>
                <InfoRow label="Артикул (nmId)" value={product.nmId} />
                <InfoRow label="Цена" value={`${product.price} ₽`} />
                <InfoRow label="Цена со скидкой" value={`${product.discountedPrice} ₽`} />
                <InfoRow label="Скидка" value={`${product.discount}%`} />
                <InfoRow label="SPP" value={`${product.spp}%`} />
                <InfoRow label="Код 1С" value={product.code1c} />
                <InfoRow label="Артикул 1С" value={product.article1c} />
                <InfoRow label="Вендор код" value={product.vendorCode} />
              </div>
            </div>

            {/* Штрихкоды */}
            {product.barcode && product.barcode.length > 0 && (
              <div style={styles.card}>
                <h3 style={styles.subtitle}>Штрихкоды</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {product.barcode.map((barcode, index) => (
                    <span key={index} style={styles.barcode}>
                      {barcode}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Остатки */}
            <div style={styles.card}>
              <h3 style={styles.subtitle}>Остатки</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <InfoRow label="Екатеринбург" value={formatNumber(product.stocksEkb)} />
                <InfoRow label="Москва" value={formatNumber(product.stocksMsc)} />
                <InfoRow label="FBO" value={formatNumber(product.stocksFbo)} />
                <InfoRow label="FBS" value={formatNumber(product.stocksFbs)} />
              </div>
            </div>

            {/* Заказы */}
            <div style={styles.card}>
              <h3 style={styles.subtitle}>Заказы</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <InfoRow label="Текущие заказы" value={formatNumber(product.currentOrdersCount)} />
                <InfoRow label="Предыдущие заказы" value={formatNumber(product.previousOrdersCount)} />
              </div>
            </div>
          </div>
        )}

        {/* Информация о складах */}
        {activeTab === "stocks" && product.warehouses && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Склады ({product.warehouses.length})</h2>
            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              {product.warehouses.map((warehouse, index) => (
                <div key={index} style={styles.warehouseItem(index)}>
                  <div style={{ fontWeight: "bold", marginBottom: "5px" }}>{warehouse.warehouse}</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", fontSize: "14px" }}>
                    <span>ID: {warehouse.warehouseId}</span>
                    <span>Остаток: <strong>{warehouse.stock}</strong></span>
                    <span style={{ gridColumn: "1 / -1", fontFamily: "monospace", fontSize: "12px" }}>
                      Штрихкод: {warehouse.barcode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Финансовая информация */}
        {activeTab === "financial" && (
          <div style={styles.card}>
            <h2 style={styles.sectionTitle}>Финансовая информация</h2>
            <div style={{ display: "grid", gap: "10px" }}>
              <InfoRow label="KP" value={formatNumber(product.kp)} />
              <InfoRow label="DU" value={formatNumber(product.du)} />
              <InfoRow label="KP Fact" value={formatNumber(product.kpFact)} />
              <InfoRow label="KP No Tax Expenses" value={formatNumber(product.kpNoTaxExpeses)} />
            </div>

            {/* Дубликаты */}
            {product.duplicates && product.duplicates.length > 0 && (
              <div style={{ marginTop: "15px" }}>
                <h3 style={styles.subtitle}>Дубликаты</h3>
                {product.duplicates.map((duplicate, index) => (
                  <div key={index} style={styles.duplicateItem}>
                    nmId: {duplicate.nmId} - {duplicate.cabinet}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Кнопки действий */}
        <div style={{ marginTop: "20px" }}>
          <button 
            onClick={() => {
              const wbUrl = `https://www.wildberries.ru/catalog/${id}/detail.aspx`;
              if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.openLink(wbUrl);
              } else {
                window.open(wbUrl, '_blank');
              }
            }}
            style={styles.primaryButton}
          >
            Перейти на Wildberries
          </button>

          <Link to="/" style={{ display: "block", textDecoration: "none" }}>
            <button style={styles.secondaryButton}>
              ← Назад к поиску
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

// Компонент для отображения строки информации
function InfoRow({ label, value }) {
  const rowStyle = {
    display: "flex", 
    justifyContent: "space-between",
    padding: "4px 0",
    borderBottom: "1px solid var(--tg-theme-hint-color, #f0f0f0)"
  };

  const labelStyle = {
    color: "var(--tg-theme-hint-color, #666666)"
  };

  const valueStyle = {
    fontWeight: "500",
    color: "var(--tg-theme-text-color, #000000)"
  };

  return (
    <div style={rowStyle}>
      <span style={labelStyle}>{label}:</span>
      <span style={valueStyle}>{value || "—"}</span>
    </div>
  );
}

export default ProductDetail;