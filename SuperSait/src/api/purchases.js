const API_URL = 'http://localhost:3001/api/purchases';
/*
    Круды покупок
  */
export async function getPurchases() {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Ошибка при получении покупок');
    }
    return await response.json();
}

export async function getPurchasesByOwnerId(id) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
        throw new Error('Ошибка при получении покупок');
    }
    return await response.json();
}

export async function createPurchase(purchaseData) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
    });
    if (!response.ok) {
        throw new Error('Ошибка при создании покупки');
    }
    return await response.json();
}

export async function updatePurchase(id, purchaseData) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(purchaseData),
    });
    if (!response.ok) {
        throw new Error('Ошибка при обновлении покупки');
    }
    return await response.json();
}

export async function deletePurchase(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Ошибка при удалении покупки');
    }
    return await response.json();
}
