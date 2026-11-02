import { useContext, useEffect, useState } from 'react'
import './App.css'
import { ThemeContext } from './ThemeContext';
import { UserContext } from './UserContext';
import { data, useNavigate } from 'react-router-dom';
import { getCartByOwnerId } from './api/carts';
import { getProducts } from './api/products';
import { getCategories } from './api/categories';
import CartItem from './CartItem';
import { getDiscountByOwnerId } from './api/discounts';
import { createOrder } from './api/orders';

export default function Cart() {
  /*
    Страница с предметами из корзины.
  */
  const {user} = useContext(UserContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [ cart, setCart] = useState([])
  const [ products, setProducts] = useState([])
  const [ categories, setCategories] = useState([])
  const [ discounts, setDiscounts] = useState([])
  const {theme} = useContext(ThemeContext);
  const [totalCost, setTotalCost] = useState(0);
  const [total, setTotal] = useState(0);

  const [isCheckout, setIsCheckout] = useState(false);
  const [address, setAddress] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);

  const loadData = async () => {
    try{
      setLoading(true);
      const data_products = await getProducts();
      const data_categories = await getCategories();
      const data_cart = await getCartByOwnerId(user.id);
      const data_discount = await getDiscountByOwnerId(user.id);
      setProducts(data_products);
      setCategories(data_categories);
      setCart(data_cart);
      setDiscounts(data_discount);
      setError(null);
      setTotalCost(data_cart.reduce((sum, item) => {
        const product = data_products.find(product=>product.id==item.product_id);
        return sum + product.cost*item.amnt*(1-product.global_discount)*(1-(data_discount.find(disc=> disc.product_id == product.id) ?? {discount:0}).discount)}, 0));
      setTotal(data_cart.reduce((len, item) => len + item.amnt, 0));
    }
    catch (err) {
      if (err.message === "Failed to fetch"){
        setError("На данный момент сервер недоступен. Попробуйте позже.")
      }
      else{
      setError(`Ошибка при загрузке данных: ${err.message}`);
      console.error(`Ошибка при загрузке данных: ${err.message}`);
      }
    }
    finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user == null){
      navigate("/login", {state: {redirect: "/cart"}})
    }
    loadData()
  }, [])

  const handleRefresh = () => {
    loadData()
  }

  function changeCost(amnt){
    setTotalCost(totalCost+amnt)
  }

  function changeTotal(amnt){
    setTotal(total+amnt)
  }

  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    setCheckoutError('');
    setCheckoutSuccess('');

    if (!address.trim() || !deliveryDate) {
      setCheckoutError('Пожалуйста, заполните адрес и дату доставки.');
      return;
    }

    const selectedDate = new Date(deliveryDate);
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < currentDate) {
      setCheckoutError('Дата доставки не может быть меньше текущей даты.');
      return;
    }

    try {
      setSubmittingOrder(true);
      
      await createOrder({
        ownerId: user.id,
        adress: address,
        deliveryDate: deliveryDate
      });

      setCheckoutSuccess('Заказ успешно оформлен!');
      setCart([]); 
      setTotal(0);
      setTotalCost(0);
      setIsCheckout(false);
    } catch (err) {
      setCheckoutError(`Ошибка при оформлении заказа: ${err.message}`);
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (user == null){
    return (<h1>Сначала войдите в аккаунт!</h1>)
  }
  if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
                <div>Загрузка корзины...</div>
            </div>
        );
    }

  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>
        <div>Ошибка: {error}</div>
        <button 
          onClick={handleRefresh}
          style={{ 
            marginTop: '10px', 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2>Корзина</h2>
      {checkoutSuccess && <div style={{ color: 'green', marginBottom: '15px', fontWeight: 'bold' }}>{checkoutSuccess}</div>}
      
      {cart.length === 0 ? (
        <p>Корзина пуста</p>
      ) : (
        <div>
          <ul style={{ listStyleType: 'none', padding: 0 }}>
            {cart.map((item) => {
              const product = products.find(p => Number(p.id) === Number(item.product_id));
              const matchingDiscount = discounts.find(disc => Number(disc.product_id) === Number(item.product_id)) ?? { discount: 0 };
              
              return (
                <CartItem 
                  product={product}
                  userId={user.id}
                  item={item}
                  discount={matchingDiscount}
                  update={loadData}
                  changeCost={changeCost}
                  changeTotal={changeTotal}
                  setError={setError}
                  key={`cart-item-node-${item.id}`}
                />
              );
            })}
          </ul>
          
          <div style={{ marginTop: '20px', paddingTop: '15px', borderTop: '2px solid #333', display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem' }}>
            <span>Всего товаров: <strong>{total}</strong></span>
            <span>Итого: <strong>{totalCost.toFixed(2)}$</strong></span>
          </div>

          {/* Кнопка переключения режима оформления заказа */}
          {!isCheckout ? (
            <button 
              onClick={() => setIsCheckout(true)}
              style={{
                marginTop: '20px',
                width: '100%',
                padding: '12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '1rem',
                cursor: 'pointer'
              }}
            >
              Оформить заказ
            </button>
          ) : (
            <form onSubmit={handleOrderSubmit} style={{ marginTop: '25px', padding: '15px', border: '1px solid #ccc', borderRadius: '6px' }}>
              <h3>Детали доставки</h3>
              {checkoutError && <div style={{ color: 'red', marginBottom: '10px' }}>{checkoutError}</div>}
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Адрес доставки:</label>
                <input 
                  type="text" 
                  value={address} 
                  onChange={(e) => setAddress(e.target.value)} 
                  disabled={submittingOrder}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                  placeholder="Город, улица, дом, квартира"
                />
              </div>

              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px' }}>Дата доставки:</label>
                <input 
                  type="date" 
                  value={deliveryDate} 
                  onChange={(e) => setDeliveryDate(e.target.value)} 
                  disabled={submittingOrder}
                  style={{ width: '100%', padding: '8px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="submit" 
                  disabled={submittingOrder}
                  style={{
                    flex: 1,
                    padding: '10px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {submittingOrder ? 'Подтверждение...' : 'Подтвердить заказ'}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setIsCheckout(false); setCheckoutError(''); }}
                  disabled={submittingOrder}
                  style={{
                    padding: '10px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Отмена
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
