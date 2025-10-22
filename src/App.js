// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProductList from "./Pages/ProductList";
import ProductDetail from "./Pages/ProductDetail";
import { useEffect } from "react";

function App() {
  useEffect(() => {
    // Инициализация Telegram Web App
    const tg = window.Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand(); // Раскрываем на весь экран
    }
  }, []);

  return (
    <Router>
      <div style={{ 
        padding: "20px", 
        fontFamily: "Arial",
        backgroundColor: "var(--tg-theme-bg-color, #ffffff)",
        color: "var(--tg-theme-text-color, #000000)",
        minHeight: "100vh"
      }}>
        <Routes>
          <Route path="/" element={<ProductList />} />
          <Route path="/product/:id" element={<ProductDetail />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;