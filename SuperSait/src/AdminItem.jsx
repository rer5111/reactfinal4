import React, { useState, useEffect, useContext } from "react";
import { ThemeContext } from "./ThemeContext";
import { UserContext } from "./UserContext"; 
import { updateProduct, deleteProduct } from "./api/products"; 
import { updateDiscount, createDiscount } from "./api/discounts";

export default function AdminItem(props) {
    /*
    Элемент для отображения предметов в меню администратора. У администратора есть возможность добавить скидку
    */
    const currentId = props.product.id;
    const data = props.product;
    const users = props.users || [];
    
    const [discounts, setDiscounts] = useState(props.discounts || []);
    const [discountInputValue, setDiscountInputValue] = useState("");
    const [calculatedDiscount, setCalculatedDiscount] = useState(0);
    const [categories, setCategories] = useState(props.categories || []);
    
    const [selectedUserId, setSelectedUserId] = useState("");
    const [selectedCategoryName, setSelectedCategoryName] = useState(props.product.category || "");
    const [localUserDiscountText, setLocalUserDiscountText] = useState("0%");

    const { theme } = useContext(ThemeContext);
    const { user } = useContext(UserContext); 

    const [deleteError, setDeleteError] = useState(null);

    useEffect(() => {
        setDiscounts(props.discounts || []);
    }, [props.discounts]);

    useEffect(() => {
        setCategories(props.categories || []);
    }, [props.categories]);

    useEffect(() => {
        setSelectedCategoryName(props.product.category || "");
    }, [props.product.category]);

    useEffect(() => {
        if (users.length > 0 && !selectedUserId) {
            setSelectedUserId(users[0].id);
        }
    }, [users, selectedUserId]);

    useEffect(() => {
        if (!selectedUserId) {
            setLocalUserDiscountText("0%");
            return;
        }
        const match = discounts.find(
            (d) => Number(d.owner_id) === Number(selectedUserId) && Number(d.product_id) === Number(props.product.id)
        );
        if (match) {
            setLocalUserDiscountText(`${parseInt(match.discount * 100)}%`);
        } else {
            setLocalUserDiscountText("0%");
        }
    }, [selectedUserId, discounts, props.product.id]);

    const handleDiscountInputChange = (val) => {
        let numericVal = parseFloat(val);
        if (isNaN(numericVal)) {
            setDiscountInputValue("");
            setCalculatedDiscount(0);
            return;
        }

        if (numericVal > 100) {
            numericVal = 100;
        } else if (numericVal < 0) {
            numericVal = 0;
        }

        setDiscountInputValue(numericVal);
        setCalculatedDiscount(numericVal / 100);
    };

    async function addGlobal() {
        const payload = {
            title: props.product.title,
            cost: props.product.cost,
            category: selectedCategoryName,
            globalDiscount: calculatedDiscount,
            img: props.product.img
        };
        try {
            await updateProduct(props.product.id, payload, user?.id); 
            props.update();
        } catch (e) {
            console.error(e);
        }
    }

    async function addLocal() {
        if (!selectedUserId) return;

        const payload = {
            ownerId: Number(selectedUserId),
            productId: Number(props.product.id),
            discount: calculatedDiscount
        };

        try {
            const existingDiscount = discounts.find(
                (disc) => Number(disc.owner_id) === Number(payload.ownerId) && Number(disc.product_id) === Number(payload.productId)
            );

            if (existingDiscount) {
                await updateDiscount(existingDiscount.id, payload);
            } else {
                await createDiscount(payload);
            }
            props.update();
        } catch (e) {
            console.error(e);
        }
    }

    async function editCategory() {
        if (!selectedCategoryName) return;

        const payload = {
            title: props.product.title,
            cost: props.product.cost,
            category: selectedCategoryName,
            globalDiscount: props.product.global_discount,
            img: props.product.img
        };

        try {
            await updateProduct(props.product.id, payload, user?.id); 
            props.update();
        } catch (e) {
            console.error(e);
        }
    }

    async function handleProductDelete() {
        setDeleteError(null);

        if (!user || !user.id) {
            setDeleteError("Ошибка прав доступа. Вы не авторизованы.");
            return;
        }

        if (!window.confirm(`Вы уверены, что хотите полностью удалить товар "${data.title || currentId}"?`)) {
            return; 
        }

        try {
            await deleteProduct(props.product.id, user.id);
            props.update(); 
        } catch (err) {
            setDeleteError(err.message);
        }
    }

    return (
        <div style={{
            backgroundColor: theme === "dark" ? "#6b6375" : "#c2baba",
            borderRadius: "5px",
            borderColor: theme === "dark" ? "darkblue" : "lightblue",
            borderWidth: "10px",
            borderStyle: "solid",
            margin: "10px",
            padding: "15px",
            textAlign: "center"
        }}>
            <h1>{data.title || `Товар с id: ${currentId}`}</h1>
            
            {Number(data.global_discount) !== 0 ? (
                <div>
                    <div style={{ display: "flex", flexDirection: "row", justifyContent: "center", alignItems: "center" }}>
                        <h2 style={{ textDecoration: "line-through", marginRight: "20px" }}>{data.cost}$</h2>
                        <h2 style={{ color: "crimson", marginLeft: "10px" }}>-{parseInt(props.product.global_discount * 100)}%</h2>
                    </div>
                    <h2 style={{ color: "crimson" }}>{(data.cost * (1 - props.product.global_discount)).toFixed(2)}$</h2>
                </div>
            ) : (
                <h2>{data.cost}$</h2>
            )}
            <p>{data.description}</p>
            <h3>Категория: {data.category}</h3>
            
            <div className="center" style={{ margin: "10px 0" }}>
                <img src={data.img} alt={data.title} style={{ maxWidth: "150px", height: "auto" }} />
            </div>

            <div className="center">
                <p>Текущая глобальная скидка: <strong>{parseInt(props.product.global_discount * 100)}%</strong></p>
            </div>

            <div className="center">
                <p>Скидка выбранного пользователя: <strong>{localUserDiscountText}</strong></p>
            </div>

            <div className="center" style={{ marginBottom: "15px" }}>
                <input 
                    type="number" 
                    placeholder="Скидка (0-100)" 
                    key={`discount-input-${props.product.id}`}
                    value={discountInputValue} 
                    onChange={(e) => handleDiscountInputChange(e.target.value)}
                    style={{ padding: "6px", width: "120px", textAlign: "center" }}
                />
            </div>

            <div className="center" style={{ marginBottom: "15px" }}>
                <button onClick={addGlobal} style={{ padding: "6px 12px", cursor: "pointer" }}>Сделать общей</button>
            </div>

            <div className="center" style={{ marginBottom: "15px", display: "flex", gap: "10px", justifyContent: "center" }}>
                <select 
                    key={`user-select-${props.product.id}`}
                    value={selectedUserId} 
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    style={{ padding: "6px" }}
                >
                    {users.map((user) => (
                        <option value={user.id} key={`usr-opt-${user.id}`}>
                            {user.email}
                        </option>
                    ))}
                </select>
                <button onClick={addLocal} style={{ padding: "6px 12px", cursor: "pointer" }}>Дать пользователю скидку</button>
            </div>

            <div className="center" style={{ display: "flex", gap: "10px", justifyContent: "center", marginBottom: "15px" }}>
                <select 
                    key={`cat-select-${props.product.id}`}
                    value={selectedCategoryName} 
                    onChange={(e) => setSelectedCategoryName(e.target.value)}
                    style={{ padding: "6px" }}
                >
                    {categories.map((cat) => (
                        <option value={cat.title} key={`cat-opt-${cat.title}`}>
                            {cat.title}
                        </option>
                    ))}
                </select>
                <button onClick={editCategory} style={{ padding: "6px 12px", cursor: "pointer" }}>Изменить категорию</button>
            </div>

            {deleteError && (
                <div style={{ color: "red", background: "rgba(255,0,0,0.1)", padding: "8px", margin: "10px 0", fontSize: "12px", borderRadius: "4px" }}>
                    ⚠️ {deleteError}
                </div>
            )}

            <div style={{ marginTop: "15px", paddingTop: "10px", borderTop: "1px dashed rgba(0,0,0,0.2)" }}>
                <button 
                    onClick={handleProductDelete} 
                    style={{ 
                        padding: "8px 16px", 
                        background: "#dc3545", 
                        color: "#fff", 
                        border: "none", 
                        borderRadius: "4px", 
                        cursor: "pointer", 
                        fontWeight: "bold",
                        width: "100%" 
                    }}
                >
                    🗑️ Удалить товар
                </button>
            </div>
        </div>
    );
}
