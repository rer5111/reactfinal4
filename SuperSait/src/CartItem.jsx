import { useContext, useState, useEffect } from "react"
import { ThemeContext } from "./ThemeContext"
import { deleteCart, updateCart } from "./api/carts"

export default function CartItem(props) {
  /*
    Предмет из корзины, загружается из Cart.jsx
  */
  const { theme } = useContext(ThemeContext)
  const [amnt, setAmnt] = useState(props.item.amnt)

  const product = props.product;

  const userDiscountValue = props.discount && typeof props.discount.discount !== 'undefined' 
    ? parseFloat(props.discount.discount) 
    : 0;

  const globalDiscountValue = product && typeof product.global_discount !== 'undefined'
    ? parseFloat(product.global_discount)
    : 0;

  useEffect(() => {
    setAmnt(props.item.amnt);
  }, [props.item.amnt]);

  const calculateSingleUnitCost = () => {
    return product.cost * (1 - globalDiscountValue) * (1 - userDiscountValue);
  };

  async function addAmnt() {
    try {
      const nextAmount = amnt + 1;
      await updateCart(props.item.id, { 
        productId: product.id, 
        ownerId: props.userId, 
        amnt: nextAmount 
      });
      
      setAmnt(nextAmount);
      props.changeTotal(1);
      props.changeCost(calculateSingleUnitCost());
    } catch (err) {
      if (err.message === "Failed to fetch") {
        props.setError("На данный момент сервер недоступен. Попробуйте позже.")
      } else {
        props.setError(err.message)
      }
    }
  }

  async function removeAmnt() {
    if (amnt <= 1) return;
    try {
      const nextAmount = amnt - 1;
      await updateCart(props.item.id, { 
        productId: product.id, 
        ownerId: props.userId, 
        amnt: nextAmount 
      });
      
      setAmnt(nextAmount);
      props.changeTotal(-1);
      props.changeCost(-1 * calculateSingleUnitCost());
    } catch (err) {
      if (err.message === "Failed to fetch") {
        props.setError("На данный момент сервер недоступен. Попробуйте позже.")
      } else {
        props.setError(err.message)
      }
    }
  }

  async function removeFromCart() {
    try {
      await deleteCart(props.item.id);
      props.update();
    } catch (err) {
      if (err.message === "Failed to fetch") {
        props.setError("На данный момент сервер недоступен. Попробуйте позже.")
      } else {
        props.setError(err.message)
      }
    }
  }

  if (!product) {
    return <li style={{ padding: '10px 0', color: 'gray' }}>Загрузка элемента...</li>;
  }

  return (
    <li
      style={{ 
        borderBottom: '1px solid #ccc', 
        padding: '10px 0', 
        display: 'flex', 
        justifyContent: 'space-between',
        alignItems: 'center'
      }}
    >
      <span style={{ fontWeight: 'bold' }}>{product.title}</span>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ fontWeight: 'bold' }}>
          {(calculateSingleUnitCost() * amnt).toFixed(2)}$
        </span> 
        <button 
          style={{
            backgroundColor: theme === "dark" ? "#303030" : "#a7a7a7", 
            borderColor: theme === "dark" ? "#a8a8a8" : "#686868",
            color: theme === "dark" ? "#fff" : "#000",
            padding: '4px 8px',
            cursor: 'pointer'
          }}
          onClick={removeFromCart}
        >
          Удалить
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <button 
          style={{
            backgroundColor: theme === "dark" ? "#303030" : "#a7a7a7", 
            borderColor: theme === "dark" ? "#a8a8a8" : "#686868",
            color: theme === "dark" ? "#fff" : "#000",
            width: '25px',
            cursor: 'pointer'
          }}
          onClick={addAmnt}
        >
          +
        </button>
        <span>{amnt}</span>
        <button 
          style={{
            backgroundColor: theme === "dark" ? "#303030" : "#a7a7a7", 
            borderColor: theme === "dark" ? "#a8a8a8" : "#686868",
            color: theme === "dark" ? "#fff" : "#000",
            width: '25px',
            cursor: 'pointer'
          }}
          disabled={amnt <= 1}
          onClick={removeAmnt}
        >
          -
        </button>
      </div>
    </li>
  )
}
