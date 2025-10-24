// App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProductList from "./page/ProductList";
import ProductDetail from "./page/ProductDetail";
import AccessControl from "./components/AccessControl";

function App() {
  return (
    <AccessControl>
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
    </AccessControl>
  );
}

export default App;