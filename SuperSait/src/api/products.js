const API_URL = 'http://localhost:3001/api/products';
/*
    Круды товаров
  */
export async function getProducts() {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Ошибка при получении каталога товаров');
    }
    return await response.json();
}

export async function getProductById(id) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
        if (response.status === 404) throw new Error('Товар не найден');
        throw new Error('Ошибка при получении информации о товаре');
    }
    return await response.json();
}

export async function createProduct(productData, userId) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'user-id': userId
        },
        body: JSON.stringify(productData),
    });
    if (!response.ok) {
        throw new Error('Ошибка при создании товара на сервере');
    }
    return await response.json();
}

export async function updateProduct(id, productData, userId) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'user-id': userId
        },
        body: JSON.stringify(productData),
    });
    if (!response.ok) {
        throw new Error('Ошибка при обновлении параметров товара');
    }
    return await response.json();
}

export async function deleteProduct(id, userId) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
        headers: {
            'user-id': userId
        }
    });
    if (!response.ok) {
        throw new Error('Ошибка при удалении товара, если товар уже был куплен, его нельзя удалить!');
    }
    return await response.json();
}
