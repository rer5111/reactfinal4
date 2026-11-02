import { useContext, useEffect, useState } from "react";
import { UserContext } from "./UserContext";
import { getProducts, createProduct} from "./api/products";
import { createCategory, deleteCategory, getCategories } from "./api/categories";
import { getDiscounts } from "./api/discounts";
import AdminItem from "./AdminItem";
import { getUsers, updateUser } from "./api/users";
import { getUserOrders } from "./api/orders";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  /*
    Дешборд, здесь находится дешборд пользователя и администратора, возможность изменения персональных данных для пользователя
    и данных товаров для администратора.
  */
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createSuccess, setCreateSuccess] = useState(null);
  const [newProductData, setNewProductData] = useState({
    title: "", description: "", duration: "0", price: "", category_name: "Ноутбуки", img: ""
  });

  const [searchTerm, setSearchTerm] = useState(""); 
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [selectedCategoryToDelete, setSelectedCategoryToDelete] = useState("");
  const [tempError, setTempError] = useState(null);
  const [tempSuccess, setTempSuccess] = useState(null);

  const [profileForm, setProfileForm] = useState({
    fullName: user?.full_name || "",
    email: user?.email || "",
    phone: user?.phone || ""
  });
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: ""
  });

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data_products = await getProducts();
      const data_categories = await getCategories();
      const data_discounts = await getDiscounts();
      
      setProducts(data_products || []);
      setCategories(data_categories || []);
      setDiscounts(data_discounts || []);

      if (user) {
        if (user.roleid == 1) {
          const data_users = await getUsers();
          setUsers((data_users || []).filter((u) => u.roleid != 1));
        } else if (user.roleid == 2) {
          const data_orders = await getUserOrders(user.id);
          setOrders(data_orders || []);
        }
      }

      if (data_categories && data_categories.length > 0) {
        setSelectedCategoryToDelete(JSON.stringify(data_categories[0]));
      }
    }
    catch (err) {
      if (err.message === "Failed to fetch") {
        setError("На данный момент сервер недоступен. Попробуйте позже.");
      } else {
        setError(`Ошибка при загрузке данных: ${err.message}`);
      }
      console.error(err);
    }
    finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.full_name || "",
        email: user.email || "",
        phone: user.phone || ""
      });
    }
  }, [user]);

  useEffect(() => {
    const filtered = products.filter((product) => 
      product.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

  useEffect(() => {
    if (user == null) {
      navigate("/login", { state: { redirect: "/dashboard" } });
    } else {
      loadData();
    }
  }, [user]);
  
  function handleRefresh() {
    loadData();
  }

  function handleSearch(e) {
    setSearchTerm(e.target.value);
  }

const handleCreateProductSubmit = async (e) => {
  console.log(newProductData)
  e.preventDefault();
  setCreateError(null);
  setCreateSuccess(null);

  if (!newProductData.title.trim() || !newProductData.price || !newProductData.category_name.trim()) {
      setCreateError("Поля Название, Цена и Категория обязательны для заполнения.");
      return;
  }
  const parsedPrice = parseFloat(newProductData.price);
  if (isNaN(parsedPrice) || parsedPrice <= 0) {
      setCreateError("Цена должна быть положительным числом.");
      return;
  }

  try {
      await createProduct(newProductData, user.id);
      
      setCreateSuccess("Товар успешно создан и добавлен в каталог!");
      
      setNewProductData({ 
        title: "", 
        description: "", 
        duration: "0", 
        price: "", 
        category_name: newProductData.category_name, 
        img: "" 
      });
      
      await loadData(); 
  } catch (err) {
      setCreateError(err.message);
  }
};


  async function addCategory(e) {
    e.preventDefault();
    setTempError(null);
    setTempSuccess(null);

    if (!newCategoryTitle.trim()) {
      setTempError("Название категории не может быть пустым.");
      return;
    }

    try {
      await createCategory({ title: newCategoryTitle.trim() });
      setNewCategoryTitle("");
      setTempSuccess("Категория успешно добавлена!");
      loadData();
    }
    catch (err) {
      if (err.message === "Failed to fetch") {
        setTempError("На данный момент сервер недоступен. Попробуйте позже.");
      } else {
        setTempError("Данная категория уже существует!");
      }
    }
  }

  async function removeCategory(e) {
    e.preventDefault();
    setTempError(null);
    setTempSuccess(null);

    if (!selectedCategoryToDelete) {
      setTempError("Выберите категорию для удаления.");
      return;
    }

    try {
      const cat = JSON.parse(selectedCategoryToDelete);
      await deleteCategory(cat.id);
      setTempSuccess("Категория успешно удалена.");
      loadData();
    } catch (err) {
      if (err.message === "Failed to fetch") {
        setTempError("На данный момент сервер недоступен. Попробуйте позже.");
      } else {
        setTempError("Данная категория еще используется товарами!");
      }
    }
  }

  const handleProfileFormChange = (e) => {
    setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setTempError(null);
    setTempSuccess(null);

    if (!profileForm.fullName.trim() || !profileForm.email.trim() || !profileForm.phone.trim()) {
      setTempError("Все поля профиля обязательны для заполнения!");
      return;
    }

    try {
      const updatedData = await updateUser(user.id, {
        fullName: profileForm.fullName.trim(),
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
        pass: user.pass,
        roleID: user.roleid
      });

      setTempSuccess("Личная информация успешно обновлена!");
      if (setUser) {
        setUser({ 
          ...user, 
          full_name: updatedData.full_name || profileForm.fullName, 
          email: updatedData.email || profileForm.email, 
          phone: updatedData.phone || profileForm.phone 
        });
      }
    } catch (err) {
      setTempError(err.message);
    }
  };

   const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setTempError(null);
    setTempSuccess(null);

    if (!passwordForm.oldPassword || !passwordForm.newPassword) {
      setTempError("Заполните поля старого и нового паролей.");
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setTempError("Новый пароль должен содержать от 8 символов.");
      return;
    }

    try {
      const loginCheck = await attemptLogin(user.email, passwordForm.oldPassword);
      
      if (loginCheck && loginCheck.message) {
        setTempError("Неверный текущий пароль.");
        return;
      }

      await updateUser(user.id, {
        fullName: user.full_name,
        email: user.email,
        phone: user.phone,
        pass: passwordForm.newPassword,
        roleID: user.roleid
      });

      setTempSuccess("Пароль изменен успешно!");
      
      if (setUser) {
        setUser({ ...user, pass: passwordForm.newPassword });
      }
      setPasswordForm({ oldPassword: "", newPassword: "" });
    } catch (err) {
      setTempError(err.message === "Failed to fetch" 
        ? "На данный момент сервер недоступен. Попробуйте позже." 
        : "Неверный текущий пароль или ошибка сервера."
      );
    }
  };

  if (user == null) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <h1>Сначала войдите в аккаунт!</h1>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "40px" }}>
        <div>Загрузка данных панели...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ color: "red", padding: "20px", textAlign: "center" }}>
        <div>Ошибка: {error}</div>
        <button 
          onClick={handleRefresh}
          style={{ 
            marginTop: "10px", 
            padding: "8px 16px", 
            backgroundColor: "#007bff", 
            color: "white", 
            border: "none", 
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (user.roleid == 2) {
    return (
      <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
        <h2 style={{ textAlign: "center" }}>Личный кабинет</h2>
        <p style={{ textAlign: "center", color: "#666" }}>Добро пожаловать, {user.full_name}!</p>
        
        {tempError && <div style={{ color: "red", margin: "10px 0", fontWeight: "bold", textAlign: "center" }}>{tempError}</div>}
        {tempSuccess && <div style={{ color: "green", margin: "10px 0", fontWeight: "bold", textAlign: "center" }}>{tempSuccess}</div>}

        <div style={{ display: "flex", gap: "40px", flexWrap: "wrap", marginTop: "30px" }}>
          
          <div style={{ flex: "1", minWidth: "300px" }}>
            <form onSubmit={handleProfileSubmit} style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px", marginBottom: "30px" }}>
              <h3>Редактировать личную информацию</h3>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>ФИО:</label>
                <input 
                  type="text" 
                  name="fullName"
                  key="usr-edit-fullname"
                  value={profileForm.fullName} 
                  onChange={handleProfileFormChange}
                  style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>Email:</label>
                <input 
                  type="email" 
                  name="email"
                  key="usr-edit-email"
                  value={profileForm.email} 
                  onChange={handleProfileFormChange}
                  style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                />
               </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>Телефон:</label>
                <input 
                  type="text" 
                  name="phone"
                  key="usr-edit-phone"
                  value={profileForm.phone} 
                  onChange={handleProfileFormChange}
                  style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                />
              </div>
              <button type="submit" style={{ padding: "8px 16px", cursor: "pointer", backgroundColor: "#28a745", color: "#fff", border: "none", borderRadius: "4px" }}>
                Сохранить изменения
              </button>
            </form>

            <form onSubmit={handlePasswordSubmit} style={{ border: "1px solid #ddd", padding: "20px", borderRadius: "8px" }}>
              <h3>Изменение пароля</h3>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>Текущий пароль:</label>
                <input 
                  type="password" 
                  key="usr-edit-oldpass"
                  value={passwordForm.oldPassword} 
                  onChange={(e) => setPasswordForm({ ...passwordForm, oldPassword: e.target.value })}
                  style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                />
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "4px" }}>Новый пароль:</label>
                <input 
                  type="password" 
                  key="usr-edit-newpass"
                  value={passwordForm.newPassword} 
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  style={{ width: "100%", padding: "8px", boxSizing: "border-box" }}
                />
              </div>
              <button type="submit" style={{ padding: "8px 16px", cursor: "pointer", backgroundColor: "#007bff", color: "#fff", border: "none", borderRadius: "4px" }}>
                Обновить пароль
              </button>
            </form>
          </div>

          <div style={{ flex: "2", minWidth: "450px" }}>
            <h3>История сделанных заказов</h3>
            {orders.length === 0 ? (
              <p style={{ color: "#666", fontStyle: "italic" }}>Вы еще не совершали покупок.</p>
            ) : (
              <div style={{ border: "1px solid #ddd", borderRadius: "8px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Дата оформления</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Адрес доставки</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Товар и количество</th>
                      <th style={{ padding: "12px", borderBottom: "2px solid #dee2e6" }}>Статус заказа</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const groupedOrdersMap = orders.reduce((acc, currentItem) => {
                        const orderKey = currentItem.order_id || `${currentItem.created_at}-${currentItem.delivery_address || currentItem.adress}`;
                        
                        if (!acc[orderKey]) {
                          acc[orderKey] = {
                            orderId: currentItem.order_id,
                            createdAt: currentItem.created_at || currentItem.creation_date,
                            address: currentItem.delivery_address || currentItem.adress,
                            status: currentItem.order_status || currentItem.status,
                            products: []
                          };
                        }
                        
                        if (currentItem.product_title || currentItem.title) {
                          acc[orderKey].products.push({
                            title: currentItem.product_title || currentItem.title || "Товар",
                            quantity: currentItem.quantity || currentItem.amount || currentItem.amnt || 1
                          });
                        }
                        
                        return acc;
                      }, {});

                      const uniqueOrders = Object.values(groupedOrdersMap);

                      if (uniqueOrders.length === 0) {
                        return (
                          <tr>
                            <td colSpan="4" style={{ padding: "20px", textAlign: "center", fontStyle: "italic", color: "#666" }}>
                              У вас пока нет оформленных заказов.
                            </td>
                          </tr>
                        );
                      }

                      return uniqueOrders.map((order, index) => (
                        <tr key={`user-grouped-order-${order.orderId || index}`}>
                          <td style={{ padding: "12px", borderBottom: "1px solid #dee2e6", verticalAlign: "top" }}>
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "Не указана"}
                          </td>
                          
                          <td style={{ padding: "12px", borderBottom: "1px solid #dee2e6", verticalAlign: "top" }}>
                            {order.address || "Не указан"}
                          </td>
                          
                          <td style={{ padding: "12px", borderBottom: "1px solid #dee2e6", verticalAlign: "top" }}>
                            {order.products.length === 0 ? (
                              <span style={{ fontStyle: "italic", color: "#999" }}>Состав не указан</span>
                            ) : (
                              <ul style={{ margin: 0, paddingLeft: "15px", listStyleType: "square" }}>
                                {order.products.map((p, pIdx) => (
                                  <li key={pIdx} style={{ marginBottom: "4px" }}>
                                    <strong>{p.title}</strong> — {p.quantity} шт.
                                  </li>
                                ))}
                              </ul>
                            )}
                          </td>
                          
                          <td style={{ padding: "12px", borderBottom: "1px solid #dee2e6", verticalAlign: "top" }}>
                            <span style={{
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "0.9rem",
                              fontWeight: "bold",
                              display: "inline-block",
                              backgroundColor: order.status === "Доставлен" || order.status === "Delivered" ? "#d4edda" : "#fff3cd",
                              color: order.status === "Доставлен" || order.status === "Delivered" ? "#155724" : "#856404"
                            }}>
                              {order.status || "В обработке"}
                            </span>
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  if (user.roleid == 1) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h2>Панель администратора</h2>
        <button onClick={()=>{navigate("/userpanel")}}>Администрация пользователей и заказов</button>
        {tempError && <div style={{ color: "red", margin: "10px 0" }}>{tempError}</div>}
        {tempSuccess && <div style={{ color: "green", margin: "10px 0" }}>{tempSuccess}</div>}

        <div style={{ display: "flex", gap: "20px", justifyContent: "center", alignItems: "flex-start", margin: "20px", flexWrap: "wrap" }}>
          
          <form onSubmit={addCategory} style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "6px" }}>
            <h3>Создание категорий</h3>
            <input 
              type="text" 
              placeholder="Название" 
              key="adm-add-cat-input"
              value={newCategoryTitle}
              onChange={(e) => setNewCategoryTitle(e.target.value)}
              style={{ padding: "6px", marginRight: "6px" }}
            />
            <button type="submit">Создать</button>
          </form>

          <form onSubmit={removeCategory} style={{ border: "1px solid #ccc", padding: "15px", borderRadius: "6px" }}>
            <h3>Удаление категорий</h3>
            <select 
              key="adm-del-cat-select"
              value={selectedCategoryToDelete} 
              onChange={(e) => setSelectedCategoryToDelete(e.target.value)}
              style={{ padding: "6px", marginRight: "6px" }}
            >
              {categories.map((cat) => (
                <option key={`delete-cat-opt-${cat.id}`} value={JSON.stringify(cat)}>
                  {cat.title}
                </option>
              ))}
            </select>
            <button type="submit">Удалить</button>
          </form>
        </div>
        <div style={{ margin: "20px auto", maxWidth: "600px", textAlign: "center" }}>
            <button 
                onClick={() => setShowCreateForm(!showCreateForm)}
                style={{
                    padding: "10px 20px",
                    background: showCreateForm ? "#6c757d" : "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontWeight: "bold"
                }}
            >
                {showCreateForm ? "✖ Закрыть форму" : "➕ Добавить новый товар в каталог"}
            </button>

            {showCreateForm && (
                <form onSubmit={handleCreateProductSubmit} style={{ marginTop: "15px", background: "#2a2438", padding: "20px", borderRadius: "6px", border: "1px solid #443c53", textAlign: "left" }}>
                  {createError && <div style={{ color: "#ff4d4d", marginBottom: "10px" }}>⚠️ {createError}</div>}
                  {createSuccess && <div style={{ color: "#4caf50", marginBottom: "10px" }}>✅ {createSuccess}</div>}
                  
                  <input 
                      type="text" placeholder="Название товара" name="title" value={newProductData.title}
                      onChange={(e) => setNewProductData({...newProductData, title: e.target.value})}
                      style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #555", background: "#1f1a24", color: "#fff" }}
                  />
                  <textarea 
                      placeholder="Описание" name="description" value={newProductData.description}
                      onChange={(e) => setNewProductData({...newProductData, description: e.target.value})}
                      style={{ width: "100%", padding: "8px", marginBottom: "10px", borderRadius: "4px", border: "1px solid #555", background: "#1f1a24", color: "#fff", minHeight: "60px" }}
                  />
                  <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                      <input 
                          type="number" step="0.01" placeholder="Цена ($)" name="price" value={newProductData.price}
                          onChange={(e) => setNewProductData({...newProductData, price: e.target.value})}
                          style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #555", background: "#1f1a24", color: "#fff" }}
                      />
                      
                      <select 
                          name="category_name" 
                          value={newProductData.category_name}
                          onChange={(e) => setNewProductData({...newProductData, category_name: e.target.value})}
                          style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #555", background: "#1f1a24", color: "#fff", cursor: "pointer" }}
                      >
                          {categories.map((cat, index) => (
                              <option key={cat.id || index} value={cat.title}>
                                  {cat.title}
                              </option>
                          ))}
                      </select>
                  </div>
                  <input 
                      type="text" placeholder="Ссылка на картинку (URL). Для добавления картинки напишите нам: dev@gmail.com" name="img" value={newProductData.img}
                      onChange={(e) => setNewProductData({...newProductData, img: e.target.value})}
                      style={{ width: "100%", padding: "8px", marginBottom: "15px", borderRadius: "4px", border: "1px solid #555", background: "#1f1a24", color: "#fff" }}
                  />
                  <button type="submit" style={{ width: "100%", padding: "10px", background: "#4caf50", color: "#fff", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                      Сохранить и опубликовать
                  </button>
              </form>
            )}
        </div>
        <div style={{ margin: "20px 0" }}>
          <input 
            type="text" 
            placeholder="Поиск товаров..." 
            key="adm-search-field"
            value={searchTerm} 
            onChange={handleSearch}
            style={{ padding: "8px", width: "300px", borderRadius: "4px", border: "1px solid #ccc" }}
          />
        </div>

        <div className="CardHolder" style={{ marginTop: "20px" }}>
          {filteredProducts.map((product) => {
            console.log(product)
            return (
              <AdminItem 
                product={product} 
                users={users} 
                discounts={discounts} 
                key={`admin-prod-${product.id}`} 
                update={loadData} 
                categories={categories}
              />
            );
          })}
        </div>
      </div>
    );
  }

  return null;
}