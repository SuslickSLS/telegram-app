import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);

        if (!id || isNaN(id)) {
          throw new Error("Неверный ID товара");
        }

        // Запрос к вашему Flask бэкенду
        const response = await fetch(`http://localhost:5000/api/product/${id}`);
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка сервера');
        }

        const productData = await response.json();
        console.log("Данные от Flask:", productData);

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

  const getProductPrice = () => {
    if (product?.price) {
      return (product.price / 100).toLocaleString();
    }
    return "0";
  };

  const getImageUrl = () => {
    if (!product?.id) return null;
    
    try {
      const volume = Math.floor(product.id / 100000);
      const part = Math.floor(product.id / 1000);
      return `https://basket-0${volume}.wbbasket.ru/vol${volume}/part${part}/${product.id}/images/c516x688/1.jpg`;
    } catch {
      return null;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center" }}>
        <p>🔄 Загружаем информацию о товаре...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px" }}>
        <p style={{ color: "red", textAlign: "center", padding: "20px" }}>
          ❌ {error}
        </p>
        <Link to="/" style={{ display: "block", textAlign: "center", marginTop: "20px" }}>
          <button style={{
            padding: "12px 24px",
            backgroundColor: "#2481cc",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}>
            ← Назад к поиску
          </button>
        </Link>
      </div>
    );
  }

  const imageUrl = getImageUrl();

  return (
    <div style={{ padding: "0", minHeight: "100vh" }}>
      {imageUrl && (
        <div style={{ width: "100%" }}>
          <img
            src={imageUrl}
            alt={product.name}
            style={{ 
              width: "100%",
              height: "300px",
              objectFit: "cover"
            }}
          />
        </div>
      )}
      
      <div style={{ padding: "20px" }}>
        <h1 style={{ fontSize: "20px", marginBottom: "15px" }}>
          {product.name}
        </h1>
        
        <div style={{ 
          backgroundColor: "#f8f9fa",
          padding: "15px",
          borderRadius: "10px",
          marginBottom: "20px"
        }}>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: "#2481cc" }}>
            {getProductPrice()} ₽
          </div>
          
          <div style={{ display: "grid", gap: "10px", color: "#666666" }}>
            <div><strong>Бренд:</strong> {product.brand || "Не указан"}</div>
            <div><strong>Артикул:</strong> {product.id}</div>
            <div><strong>Рейтинг:</strong> {product.rating || "Нет оценок"} ⭐</div>
            <div><strong>Отзывы:</strong> {product.feedbacks || 0} 📝</div>
          </div>
        </div>

        <button 
          onClick={() => {
            const wbUrl = `https://www.wildberries.ru/catalog/${product.id}/detail.aspx`;
            if (window.Telegram?.WebApp) {
              window.Telegram.WebApp.openLink(wbUrl);
            } else {
              window.open(wbUrl, '_blank');
            }
          }}
          style={{
            padding: "16px",
            width: "100%",
            backgroundColor: "#2481cc",
            color: "white",
            border: "none",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "18px",
            fontWeight: "bold",
            marginBottom: "15px"
          }}
        >
          🛒 Перейти к покупке
        </button>

        <Link to="/" style={{ display: "block", textDecoration: "none" }}>
          <button style={{
            padding: "12px",
            width: "100%",
            backgroundColor: "#f0f0f0",
            color: "#000000",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer"
          }}>
            ← Назад к поиску
          </button>
        </Link>
      </div>
    </div>
  );
}

export default ProductDetail;