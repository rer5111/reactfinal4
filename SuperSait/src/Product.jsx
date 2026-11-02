import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ThemeContext } from "./ThemeContext";
import { createCart } from "./api/carts";
import { UserContext } from "./UserContext";

export default function Product({ product, setError }) {
    /*
    Отдельный элемент товара, отображаемый на странице товаров.
  */
    const { theme } = useContext(ThemeContext);
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    async function handleAdd() {
        if (!user) {
            navigate("/login", { state: { redirect: "/" } });
            return;
        }
        try {
            await createCart({ 
                productId: product.id,
                ownerId: user.id,
                amnt: 1
            });
            navigate("/cart");
        } catch (e) {
            setError(e.message);
        }
    }

    function handleOpenNewTab() {
        window.open(`/products/${product.id}`, "_blank");
    }

    const hasGlobal = (product.global_discount || 0) > 0;
    const hasLocal = (product.local_discount || 0) > 0;
    const finalPrice = (product.cost * (1 - (product.global_discount || 0)) * (1 - (product.local_discount || 0))).toFixed(2);

    return (
        <div style={{
            backgroundColor: theme === "dark" ? "#6b6375" : "#c2baba",
            borderRadius: "5px",
            border: `10px solid ${theme === "dark" ? "darkblue" : "lightblue"}`,
            margin: "10px",
            padding: "15px",
            textAlign: "center"
        }}>
            <h2>{product.title}</h2>
            <p style={{ fontSize: '14px', color: '#444', minHeight: '40px' }}>{product.description}</p>
            
            {hasGlobal || hasLocal ? (
                <div>
                    <h4 style={{ textDecoration: "line-through", color: "gray", margin: 0 }}>{product.cost}$</h4>
                    <div style={{ display: "flex", gap: "10px", justifyContent: "center", margin: "5px 0" }}>
                        {hasGlobal && (
                            <span style={{ color: "crimson", fontSize: "14px", fontWeight: "bold" }}>
                                Глобальная скидка: -{Math.round(product.global_discount * 100)}%
                            </span>
                        )}
                        {hasLocal && (
                            <span style={{ color: "crimson", fontSize: "14px", fontWeight: "bold" }}>
                                Личная скидка: -{Math.round(product.local_discount * 100)}%
                            </span>
                        )}
                    </div>
                    <h3 style={{ color: "crimson", margin: "5px 0" }}>Итого: {finalPrice}$</h3>
                </div>
            ) : (
                <h3>Цена: {product.cost}$</h3>
            )}
            
            <span style={{ fontSize: "12px", background: "#eee", padding: "2px 6px", borderRadius: "3px", color: "#333" }}>
                {product.category}
            </span>
            
            <div className="center" style={{ margin: "10px 0" }}>
                <img src={product.img} alt={product.title} style={{ maxWidth: "100%", height: "120px", objectFit: "contain" }} />
            </div>
            
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                <button onClick={handleAdd}>В корзину</button>
                <button onClick={handleOpenNewTab}>Отзывы</button>
            </div>
        </div>
    );
}
