import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import styles from './styles/ProductDetail.module.css';

function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [wbProduct, setWbProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [wbLoading, setWbLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("wb"); // По умолчанию показываем WB вкладку

  useEffect(() => {
    async function fetchProduct() {
      try {
        setLoading(true);
        setError(null);

        if (!id || isNaN(id)) {
          throw new Error("Неверный ID товара");
        }

        const response = await fetch(`my-telegram-app-production.up.railway.app/api/local/raw/nmInfo?nmId=${id}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Ошибка сервера');
        }

        const apiData = await response.json();
        console.log("Данные от локального API:", apiData);

        const productData = apiData.value || apiData;
        
        // Если данные пустые или нет основных полей, считаем что товар не найден
        if (!productData || (!productData.nmId && !productData.price)) {
          console.log("Локальные данные не найдены, но продолжаем работу");
          setProduct(null);
        } else {
          setProduct(productData);
        }

      } catch (err) {
        console.error("Ошибка загрузки локальных данных:", err);
        setProduct(null); // Сбрасываем локальные данные
        // Не устанавливаем ошибку, чтобы можно было показать WB данные
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [id]);

  // Функция для загрузки WB товара
  const fetchWbProduct = async () => {
    try {
      setWbLoading(true);
      const response = await fetch(`my-telegram-app-production.up.railway.app/api/wb/product?nmId=${id}`);
      
      if (!response.ok) {
        throw new Error('Ошибка загрузки данных с Wildberries');
      }

      const data = await response.json();
      setWbProduct(data.product);
    } catch (err) {
      console.error("Ошибка загрузки WB товара:", err);
      setWbProduct(null);
    } finally {
      setWbLoading(false);
    }
  };

  // Загружаем WB товар при монтировании компонента
  useEffect(() => {
    fetchWbProduct();
  }, [id]);

  const formatNumber = (num) => {
    if (num !== undefined && num !== null) {
      return num.toLocaleString();
    }
    return "0";
  };

  const formatPrice = (price) => {
    if (price !== undefined && price !== null) {
      return price.toLocaleString();
    }
    return "0";
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <p className={styles.loadingText}>🔄 Загружаем информацию о товаре...</p>
      </div>
    );
  }

  // Если нет вообще никаких данных (ни локальных, ни WB)
  if (!product && !wbProduct && !wbLoading) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorText}>
          ❌ Товар с ID {id} не найден
        </p>
        <div className={styles.errorSuggestions}>
          <p>Возможные причины:</p>
          <ul>
            <li>Товар не существует в локальной базе данных</li>
            <li>Товар не найден на Wildberries</li>
            <li>Проверьте правильность ID товара</li>
            <li>Сервер может быть временно недоступен</li>
          </ul>
        </div>
        <Link to="/" className={styles.backLink}>
          <button className={styles.secondaryButton}>
            ← Назад к поиску
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Табы для переключения между разделами - показываем вкладки в зависимости от доступных данных */}
      <div className={styles.tabContainer}>
        {/* Вкладка WB всегда доступна если есть WB данные */}
        {(wbProduct || wbLoading) && (
          <button
            onClick={() => setActiveTab("wb")}
            className={`${styles.tabButton} ${activeTab === "wb" ? styles.tabButtonActive : styles.tabButtonInactive}`}
          >
            WB Инфо
          </button>
        )}
        
        {/* Локальные вкладки показываем только если есть локальные данные */}
        {product && (
          <>
            <button
              onClick={() => setActiveTab("main")}
              className={`${styles.tabButton} ${activeTab === "main" ? styles.tabButtonActive : styles.tabButtonInactive}`}
            >
              Основное
            </button>
            <button
              onClick={() => setActiveTab("stocks")}
              className={`${styles.tabButton} ${activeTab === "stocks" ? styles.tabButtonActive : styles.tabButtonInactive}`}
            >
              Склады
            </button>
            <button
              onClick={() => setActiveTab("financial")}
              className={`${styles.tabButton} ${activeTab === "financial" ? styles.tabButtonActive : styles.tabButtonInactive}`}
            >
              Финансы
            </button>
          </>
        )}
      </div>

      <div className={styles.content}>
        
        {/* Основная информация (только если есть локальные данные) */}
        {activeTab === "main" && product && (
          <div>
            <div className={styles.card}>
              <h2 className={styles.sectionTitle}>Основная информация</h2>
              
              <div className={styles.gridContainer}>
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
              <div className={styles.card}>
                <h3 className={styles.subtitle}>Штрихкоды</h3>
                <div className={styles.barcodeContainer}>
                  {product.barcode.map((barcode, index) => (
                    <span key={index} className={styles.barcode}>
                      {barcode}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Остатки */}
            <div className={styles.card}>
              <h3 className={styles.subtitle}>Остатки</h3>
              <div className={styles.gridTwoColumns}>
                <InfoRow label="Екатеринбург" value={formatNumber(product.stocksEkb)} />
                <InfoRow label="Москва" value={formatNumber(product.stocksMsc)} />
                <InfoRow label="FBO" value={formatNumber(product.stocksFbo)} />
                <InfoRow label="FBS" value={formatNumber(product.stocksFbs)} />
              </div>
            </div>

            {/* Заказы */}
            <div className={styles.card}>
              <h3 className={styles.subtitle}>Заказы</h3>
              <div className={styles.gridTwoColumns}>
                <InfoRow label="Текущие заказы" value={formatNumber(product.currentOrdersCount)} />
                <InfoRow label="Предыдущие заказы" value={formatNumber(product.previousOrdersCount)} />
              </div>
            </div>
          </div>
        )}

        {/* Информация о складах (только если есть локальные данные) */}
        {activeTab === "stocks" && product && product.warehouses && (
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Склады ({product.warehouses.length})</h2>
            <div className={styles.warehouseList}>
              {product.warehouses.map((warehouse, index) => (
                <div 
                  key={index} 
                  className={`${styles.warehouseItem} ${index % 2 === 0 ? styles.warehouseItemEven : styles.warehouseItemOdd}`}
                >
                  <div className={styles.warehouseName}>{warehouse.warehouse}</div>
                  <div className={styles.warehouseDetails}>
                    <span>ID: {warehouse.warehouseId}</span>
                    <span>Остаток: <strong>{warehouse.stock}</strong></span>
                    <span className={styles.warehouseBarcode}>
                      Штрихкод: {warehouse.barcode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Финансовая информация (только если есть локальные данные) */}
        {activeTab === "financial" && product && (
          <div className={styles.card}>
            <h2 className={styles.sectionTitle}>Финансовая информация</h2>
            <div className={styles.gridContainer}>
              <InfoRow label="KP" value={formatNumber(product.kp)} />
              <InfoRow label="DU" value={formatNumber(product.du)} />
              <InfoRow label="KP Fact" value={formatNumber(product.kpFact)} />
              <InfoRow label="KP No Tax Expenses" value={formatNumber(product.kpNoTaxExpeses)} />
            </div>

            {/* Дубликаты */}
            {product.duplicates && product.duplicates.length > 0 && (
              <div className={styles.duplicatesSection}>
                <h3 className={styles.subtitle}>Дубликаты</h3>
                {product.duplicates.map((duplicate, index) => (
                  <div key={index} className={styles.duplicateItem}>
                    nmId: {duplicate.nmId} - {duplicate.cabinet}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* WB Информация - показываем всегда если есть WB данные или идет загрузка */}
        {activeTab === "wb" && (
          <div>
            {wbLoading ? (
              <div className={styles.loadingContainer}>
                <p className={styles.loadingText}>🔄 Загружаем информацию с Wildberries...</p>
              </div>
            ) : wbProduct ? (
              <div>
                {/* Карточка с основной информацией */}
                <div className={styles.card}>
                  <h2 className={styles.sectionTitle}>Информация с Wildberries</h2>
                  
                  <div className={styles.wbHeader}>
                    <div className={styles.wbBrandInfo}>
                      <div className={styles.wbBrand}>{wbProduct.brand}</div>
                      <div className={styles.wbName}>{wbProduct.name}</div>
                      <div className={styles.wbSubject}>{wbProduct.subject}</div>
                    </div>
                    
                    {/* Цена и скидка */}
                    <div className={styles.wbPriceSection}>
                      {wbProduct.discount > 0 ? (
                        <>
                          <div className={styles.wbOldPrice}>
                            {formatPrice(wbProduct.basicPrice)} ₽
                          </div>
                          <div className={styles.wbCurrentPrice}>
                            {formatPrice(wbProduct.productPrice)} ₽
                          </div>
                          {/* <div className={styles.wbDiscount}>
                            -{wbProduct.discount}% ({formatPrice(wbProduct.discountAmount)} ₽)
                          </div> */}
                        </>
                      ) : (
                        <div className={styles.wbCurrentPrice}>
                          {formatPrice(wbProduct.productPrice)} ₽
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Рейтинги и отзывы */}
                  <div className={styles.wbRatings}>
                    <div className={styles.gridTwoColumns}>
                      <InfoRow label="Рейтинг товара" value={`${wbProduct.rating}`} />
                      <InfoRow label="Рейтинг отзывов" value={wbProduct.reviewRating} />
                      <InfoRow label="Кол-во отзывов" value={formatNumber(wbProduct.feedbacks)} />
                      <InfoRow label="Рейтинг поставщика" value={`${wbProduct.supplierRating}`} />
                    </div>
                  </div>

                  {/* Дополнительная информация */}
                  <div className={styles.gridTwoColumns}>
                    <InfoRow label="Поставщик" value={wbProduct.supplier} />
                    {/* <InfoRow label="Изображений" value={wbProduct.pics} /> */}
                    <InfoRow label="Объем" value={wbProduct.volume ? `${wbProduct.volume} см³` : "—"} />
                    <InfoRow label="Вес" value={wbProduct.weight ? `${wbProduct.weight} кг` : "—"} />
                    {/* <InfoRow label="Доставка" value={wbProduct.time1 ? `${wbProduct.time1}-${wbProduct.time2} дн.` : "—"} /> */}
                    <InfoRow label="Остаток" value={formatNumber(wbProduct.totalQuantity)} />
                  </div>
                </div>

                {/* Склады WB */}
                {wbProduct.warehouses && wbProduct.warehouses.length > 0 && (
                  <div className={styles.card}>
                    <h3 className={styles.subtitle}>Склады Wildberries ({wbProduct.warehouses.length})</h3>
                    <div className={styles.warehouseList}>
                      {wbProduct.warehouses.map((warehouse, index) => (
                        <div 
                          key={index} 
                          className={`${styles.warehouseItem} ${index % 2 === 0 ? styles.warehouseItemEven : styles.warehouseItemOdd}`}
                        >
                          <div className={styles.warehouseDetails}>
                            <span>Склад ID: {warehouse.warehouse_id}</span>
                            <span>Остаток: <strong>{warehouse.quantity}</strong></span>
                            {/* {warehouse.time1 && (
                              <span className={styles.deliveryTime}>
                                Доставка: {warehouse.time1}-{warehouse.time2} дн.
                              </span>
                            )} */}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Акции */}
                {/* {wbProduct.promotions && wbProduct.promotions.length > 0 && (
                  <div className={styles.card}>
                    <h3 className={styles.subtitle}>Акции ({wbProduct.promotions.length})</h3>
                    <div className={styles.promotionsInfo}>
                      Участвует в {wbProduct.promotions.length} акциях
                    </div>
                  </div>
                )} */}
              </div>
            ) : (
              <div className={styles.card}>
                <div className={styles.errorContainer}>
                  <p className={styles.errorText}>
                    Не удалось загрузить информацию с Wildberries
                  </p>
                  <button 
                    onClick={fetchWbProduct}
                    className={styles.retryButton}
                  >
                    Попробовать снова
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Кнопки действий */}
        <div className={styles.actions}>
          <button 
            onClick={() => {
              const wbUrl = `https://www.wildberries.ru/catalog/${id}/detail.aspx`;
              if (window.Telegram?.WebApp) {
                window.Telegram.WebApp.openLink(wbUrl);
              } else {
                window.open(wbUrl, '_blank');
              }
            }}
            className={styles.primaryButton}
          >
            Перейти на Wildberries
          </button>

          <Link to="/" className={styles.backLink}>
            <button className={styles.secondaryButton}>
              ← Назад к поиску
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoRowLabel}>{label}:</span>
      <span className={styles.infoRowValue}>{value || "—"}</span>
    </div>
  );
}

export default ProductDetail;