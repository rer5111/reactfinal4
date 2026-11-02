const API_URL = 'http://localhost:3001/api/carts';
/*
    Круды корзины
  */
export async function getCarts() {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Ошибка при получении предметов корзины');
    }
    return await response.json();
}

export async function getCartByOwnerId(id) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
        throw new Error('Ошибка при получении предметов корзины');
    }
    return await response.json();
}

export async function createCart(cartData) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ownerId: cartData.ownerId,
            productId: cartData.productId,
            amnt: cartData.amnt
        }),
    });
    if (!response.ok) {
        throw new Error('Ошибка при создании предмета в корзине');
    }
    return await response.json();
}

export async function updateCart(id, cartData) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ownerId: cartData.ownerId,
            productId: cartData.productId,
            amnt: cartData.amnt
        }),
    });
    if (!response.ok) {
        throw new Error('Ошибка при обновлении предмета в корзине');
    }
    return await response.json();
}

export async function deleteCart(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Ошибка при удалении предмета в корзине');
    }
    return await response.json();
}
