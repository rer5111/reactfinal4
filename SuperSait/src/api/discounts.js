const API_URL = 'http://localhost:3001/api/discounts';
/*
    Круды скидок
  */
export async function getDiscounts() {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Ошибка при получении скидок');
    }
    return await response.json();
}

export async function getDiscountByOwnerId(id) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
        throw new Error('Ошибка при получении скидки');
    }
    return await response.json();
}

export async function createDiscount(discountData) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(discountData),
    });
    if (!response.ok) {
        throw new Error('Ошибка при создании скидки');
    }
    return await response.json();
}

export async function updateDiscount(id, discountData) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(discountData),
    });
    if (!response.ok) {
        throw new Error('Ошибка при обновлении скидки');
    }
    return await response.json();
}

export async function deleteDiscount(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Ошибка при удалении скидки');
    }
    return await response.json();
}
