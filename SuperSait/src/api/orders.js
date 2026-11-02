const API_URL = 'http://localhost:3001/api/orders';
/*
    Круды заказов
  */
export async function createOrder(checkoutData) {
    const response = await fetch(`${API_URL}/checkout`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ownerId: checkoutData.ownerId,
            adress: checkoutData.adress, // В вашей схеме колонка пишется как 'adress'
            deliveryDate: checkoutData.deliveryDate
        }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при оформлении заказа');
    }
    return await response.json();
}
export async function getUserOrders(userId) {
    const response = await fetch(`http://localhost:3001/api/users/${userId}/orders`);
    if (!response.ok) {
        throw new Error('Ошибка при получении истории заказов пользователя');
    }
    return await response.json();
}

export async function getAllOrders() {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Ошибка при получении полного списка заказов');
    }
    return await response.json();
}

export async function updateOrderStatus(orderId, status) {
    const response = await fetch(`${API_URL}/${orderId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
    });
    if (!response.ok) {
        throw new Error('Ошибка при обновлении статуса заказа');
    }
    return await response.json();
}

export async function deleteOrder(orderId) {
    const response = await fetch(`${API_URL}/${orderId}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Ошибка при удалении заказа');
    }
    return await response.json();
}
