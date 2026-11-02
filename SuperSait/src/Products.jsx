import { useContext, useEffect, useState } from "react";
import Product from "./Product";
import { getProducts } from "./api/products";
import { getCategories } from "./api/categories";

export default function Products() {
  /*
    Страница товаров, здесь подгружаются все товары.
  */
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState([]);
  
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data_products = await getProducts();
      const data_categories = await getCategories();
      
      setProducts(data_products);
      setCategories(data_categories);
    } catch (err) {
      setError(err.message === "Failed to fetch" 
        ? "На данный момент сервер недоступен. Попробуйте позже." 
        : `Ошибка при загрузке данных: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (categoryTitle) => {
    setSelectedCategories(prev => 
        prev.includes(categoryTitle) ? prev.filter(c => c !== categoryTitle) : [...prev, categoryTitle]
    );
  };

  useEffect(() => { loadData(); }, []);

  const filteredProducts = products.filter(p => 
    selectedCategories.length === 0 || selectedCategories.includes(p.category)
  );

  if (loading) return <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка каталога товаров...</div>;
  if (error) return <div style={{ color: 'red', padding: '20px' }}>{error} <button onClick={loadData}>Повторить</button></div>;

  return (
    <div>
      <h1>Магазин товаров</h1>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <aside style={{ border: '1px solid black', padding: '15px', minWidth: '200px' }}>
          <h4>Категории:</h4>
          {categories.map(cat => (
              <label key={cat.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '5px 0', cursor: 'pointer' }}>
                  <input 
                      type="checkbox" 
                      checked={selectedCategories.includes(cat.title)}
                      onChange={() => handleCheckboxChange(cat.title)}
                  />
                  {cat.title}
              </label>
          ))}
        </aside>
        <div className="CardHolder" style={{ width: "100%", display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
          {filteredProducts.map((prod) => (
              <Product key={prod.id} product={prod} setError={setError} />
          ))}
        </div>
      </div>
    </div>
  );
}
