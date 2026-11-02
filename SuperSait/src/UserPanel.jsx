import React, { useState, useEffect, useContext } from 'react';
import { ThemeContext } from './ThemeContext';
import { UserContext } from './UserContext';
import { getUsers, updateUser } from './api/users';
import { getAllOrders, updateOrderStatus } from './api/orders';

export default function AdminManagement() {
    /*
    Дополнительная страница администрации. Здесь можно изменять статусы заказов и роли пользователей.
  */
    const { theme } = useContext(ThemeContext);
    const { user: currentUser } = useContext(UserContext);

    const [users, setUsers] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    const [activeTab, setActiveTab] = useState('users');

    const loadAdminData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [usersData, ordersData] = await Promise.all([
                getUsers(),
                getAllOrders()
            ]);
            console.log(ordersData)

            setUsers(usersData);
            setOrders(ordersData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (currentUser && Number(currentUser.roleid) === 1) {
            loadAdminData();
        } else {
            setError("Доступ запрещен. Требуются права администратора.");
            setLoading(false);
        }
    }, [currentUser]);

    const handleRoleChange = async (targetUser, newRoleId) => {
        try {
            setActionLoading(true);
            setError(null);

            await updateUser(targetUser.id, {
                fullName: targetUser.full_name || targetUser.fullName,
                email: targetUser.email,
                phone: targetUser.phone,
                roleID: Number(newRoleId)
            });

            setUsers(prev => prev.map(u => u.id === targetUser.id ? { ...u, roleid: Number(newRoleId) } : u));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            setActionLoading(true);
            setError(null);

            await updateOrderStatus(orderId, newStatus);

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
        } catch (err) {
            setError(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'Не указана';
        if (typeof dateString === 'string') {
            return dateString.split('T')[0];
        }
        return String(dateString);
    };

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Загрузка панели управления...</div>;

    return (
        <div style={{
            padding: "20px",
            minHeight: "100vh"
        }}>
            <h2>Изменение пользователей и заказов</h2>

            {error && (
                <div style={{ color: "red", background: "#f8d7da", padding: "10px", marginBottom: "15px", borderRadius: "4px" }}>
                    ⚠️ {error}
                </div>
            )}

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button 
                    onClick={() => setActiveTab('users')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'users' ? '#4da6ff' : '#ccc',
                        color: activeTab === 'users' ? '#fff' : '#000',
                        border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}
                >
                    👥 Пользователи ({users.length})
                </button>
                <button 
                    onClick={() => setActiveTab('orders')}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: activeTab === 'orders' ? '#4da6ff' : '#ccc',
                        color: activeTab === 'orders' ? '#fff' : '#000',
                        border: 'none', borderRadius: '4px', cursor: 'pointer'
                    }}
                >
                    📦 Статусы заказов ({orders.length})
                </button>
            </div>

            {activeTab === 'users' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {users.map(u => (
                        <div key={u.id} style={{
                            border: "1px solid gray",
                            padding: "15px",
                            background: theme === "dark" ? "#3a3542" : "#f9f9f9",
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            <div>
                                <strong>Имя:</strong> {u.full_name || u.fullName} <br />
                                <strong>Email:</strong> {u.email} <br />
                                <strong>Телефон:</strong> {u.phone || 'Не указан'}
                            </div>
                            <div>
                                <label style={{ marginRight: '10px' }}><strong>Роль:</strong></label>
                                <select 
                                    value={u.roleid} 
                                    disabled={actionLoading || u.id === currentUser?.id}
                                    onChange={(e) => handleRoleChange(u, e.target.value)}
                                >
                                    <option value="1">Admin</option>
                                    <option value="2">User</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'orders' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {orders.length === 0 ? (
                        <p>Нет оформленных заказов в системе.</p>
                    ) : (
                        orders.map(o => (
                            <div key={o.id} style={{
                                border: "1px solid gray",
                                padding: "15px",
                                background: theme === "dark" ? "#3a3542" : "#f9f9f9",
                                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <strong>Заказ #{o.id}</strong> — <span style={{ color: '#4da6ff' }}>{o.status}</span><br />
                                    <strong>Покупатель:</strong> {o.customerName || 'Неизвестно'} ({o.customerEmail || 'Нет email'})<br />
                                    <strong>Адрес доставки:</strong> {o.adress || 'Адрес не указан'}<br />
                                    <strong>Дата доставки:</strong> {formatDate(o.deliveryDate)}
                                    
                                    {/* Блок вывода состава заказа */}
                                    <div style={{ marginTop: '10px', padding: '10px', background: theme === 'dark' ? '#2b2633' : '#eee', borderRadius: '4px' }}>
                                        <strong style={{ fontSize: '14px' }}>🛒 Состав заказа:</strong>
                                        <ul style={{ margin: '5px 0 0 0', paddingLeft: '20px', fontSize: '14px' }}>
                                            {o.items && o.items.map((item, idx) => (
                                                <li key={idx} style={{ marginBottom: '3px' }}>
                                                    {item.title} — {item.amount} шт. x {item.cost}$
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                                
                                <div style={{ marginLeft: '20px', shrink: 0 }}>
                                    <label style={{ marginRight: '10px' }}><strong>Статус:</strong></label>
                                    <select 
                                        value={o.status || 'Pending'} 
                                        disabled={actionLoading}
                                        onChange={(e) => handleStatusUpdate(o.id, e.target.value)}
                                        style={{ padding: '5px', borderRadius: '4px' }}
                                    >
                                        <option value="Pending">В обработке</option>
                                        <option value="Processing">Сборка заказа</option>
                                        <option value="Shipped">Отправлен</option>
                                        <option value="Delivered">Доставлен</option>
                                        <option value="Cancelled">Отменен</option>
                                    </select>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
