const API_URL = 'http://localhost:3001/api';
/*
    Круды отзывов
  */
export async function getReviewsByProductId(productId) {
    const response = await fetch(`${API_URL}/products/${productId}/reviews`);
    if (!response.ok) {
        throw new Error('Ошибка при получении отзывов для данного товара');
    }
    return await response.json();
}

export async function createReview(reviewData) {
    const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userEmail: reviewData.userEmail,
            creationDate: reviewData.creationDate,
            review: reviewData.review,
            rating: reviewData.rating,
            productId: reviewData.productId
        }),
    });
    if (!response.ok) {
        throw new Error('Ошибка при публикации отзыва');
    }
    return await response.json();
}

export async function updateReview(reviewId, updateData) {
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            userEmail: updateData.userEmail,      
            authorEmail: updateData.authorEmail,  
            review: updateData.review,
            rating: updateData.rating,
            creationDate: updateData.creationDate // Передается на бэкенд
        }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при изменении отзыва');
    }
    return await response.json();
}

export async function deleteReview(reviewId, userEmail) {
    const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userEmail }),
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка при удалении отзыва');
    }
    return await response.json();
}
