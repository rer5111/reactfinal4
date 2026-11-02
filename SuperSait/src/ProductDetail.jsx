import { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ThemeContext } from "./ThemeContext";
import { UserContext } from "./UserContext";
import { getProductById } from "./api/products";
import { getReviewsByProductId, createReview, deleteReview, updateReview } from "./api/reviews";

export default function ProductDetail() {
    /*
    Страница отдельного товара. Здесь можно увидеть отзывы о товаре.
  */
    const { id } = useParams();
    const { theme } = useContext(ThemeContext);
    const { user } = useContext(UserContext); 

    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [newComment, setNewComment] = useState("");
    const [newRating, setNewRating] = useState(5);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState(null);

    const [editingReviewId, setEditingReviewId] = useState(null);
    const [editComment, setEditComment] = useState("");
    const [editRating, setEditRating] = useState(5);

    const loadProductAndReviews = async () => {
        try {
            setLoading(true);
            setError(null);

            const productData = await getProductById(id);
            setProduct(productData);

            const reviewsData = await getReviewsByProductId(id);
            setReviews(reviewsData);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadProductAndReviews();
    }, [id]);

    const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!user) {
        setFormError("Вы должны авторизоваться, чтобы оставить отзыв.");
        return;
    }

    if (!newComment.trim()) {
        setFormError("Пожалуйста, введите текст отзыва.");
        return;
    }

    try {
        setSubmitting(true);
        
        await createReview({
            userEmail: user.email, 
            creationDate: new Date().toISOString().split('T')[0], 
            review: newComment,
            rating: Number(newRating),
            productId: Number(id)
        });

        setNewComment("");
        setNewRating(5);
        await loadProductAndReviews();

    } catch (err) {
        setFormError(err.message);
    } finally {
        setSubmitting(false);
    }
};


    const handleStartEdit = (rev) => {
        setFormError(null);
        setEditingReviewId(rev.id);
        setEditComment(rev.comment);
        setEditRating(rev.rating);
    };

    const handleCancelEdit = () => {
        setEditingReviewId(null);
        setEditComment("");
        setEditRating(5);
    };

const handleSaveEdit = async (reviewId) => {
    setFormError(null);
    if (!editComment.trim()) {
        setFormError("Текст редактируемого отзыва не может быть пустым.");
        return;
    }

    const currentReview = reviews.find(rev => rev.id === reviewId);
    if (!currentReview) {
        setFormError("Отзыв не найден в локальном состоянии.");
        return;
    }

    const targetAuthorEmail = currentReview.author_email || currentReview.email || user.email;

    try {
        setSubmitting(true);
        await updateReview(reviewId, {
            userEmail: user.email,           
            authorEmail: targetAuthorEmail, 
            review: editComment,
            rating: Number(editRating),
            creationDate: currentReview.creation_date || new Date().toISOString().split('T')[0]
        });

        setReviews(prev => prev.map(rev => 
            rev.id === reviewId 
                ? { ...rev, comment: editComment, rating: Number(editRating) } 
                : rev
        ));
        handleCancelEdit();
    } catch (err) {
        setFormError(err.message);
    } finally {
        setSubmitting(false);
    }
};

    const handleDeleteReview = async (reviewId) => {
        setFormError(null); 
        
        try {
            setSubmitting(true);
            await deleteReview(reviewId, user.email); 
            setReviews(prev => prev.filter(rev => rev.id !== reviewId));
            if (editingReviewId === reviewId) handleCancelEdit();
        } catch (err) {
            setFormError(err.message); 
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '40px' }}>Загрузка...</div>;
    if (error) return <div style={{ color: 'red', padding: '20px', textAlign: 'center' }}>Ошибка: {error}</div>;
    if (!product) return <div style={{ textAlign: 'center', padding: '20px' }}>Товар не найден.</div>;

    const isAdmin = user && Number(user.roleid) === 1;

    return (
        <div style={{
            padding: "20px",
            minHeight: "100vh"
        }}>
            <section style={{ display: "flex", gap: "30px", borderBottom: "2px solid gray", paddingBottom: "30px" }}>
                <div>
                    {console.log(product.img)}
                    <img src={new URL(`./assets/${product.img.split('/').pop()}`, import.meta.url).href} alt={product.title} style={{ maxWidth: "200px" }} />
                </div>
                <div>
                    <h1>{product.title}</h1>
                    <p>{product.description}</p>
                    <h2>Цена: {product.cost}$</h2>
                </div>
            </section>

            <section style={{ marginTop: "30px" }}>
                <h2>Отзывы</h2>

                {formError && (
                    <div style={{ color: "red", padding: "10px", marginBottom: "15px", borderRadius: "4px" }}>
                        ⚠️ {formError}
                    </div>
                )}

                {user ? (
                    reviews.some(rev => rev.author_email === user.email || rev.email === user.email) ? (
                        <div style={{ 
                            padding: "15px", 
                            marginBottom: "20px",
                            borderRadius: "4px",
                            fontStyle: "italic"
                        }}>
                            ✨ Вы уже опубликовали отзыв на этот товар. При необходимости вы можете изменить его текст или оценку.
                        </div>
                    ) : (
                        <form onSubmit={handleReviewSubmit} style={{ marginBottom: "20px", padding: "15px", color: "#000" }}>
                            <select value={newRating} onChange={(e) => setNewRating(e.target.value)}>
                                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
                            </select>
                            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Ваш отзыв..." style={{ width: "100%", margin: "10px 0" }} />
                            <button type="submit" disabled={submitting}>Отправить</button>
                        </form>
                    )
                ) : (
                    <p style={{ fontStyle: "italic", color: theme === "dark" ? "#bbb" : "#666" }}>
                        Войдите, чтобы оставить отзыв.
                    </p>
                )}

                <div>
                    {reviews.map((rev, index) => {
                        const isEditing = editingReviewId === rev.id;
                        const isOwner = user && (user.email === rev.author_email || user.email === rev.email);
                        const canModify = isOwner || isAdmin;

                        return (
                            <div key={rev.id || index} style={{ border: "1px solid gray", padding: "10px", margin: "10px 0", position: "relative" }}>
                                <strong>{rev.author_name}</strong> — 
                                {isEditing ? (
                                    <div style={{ marginTop: "5px" }}>
                                        <select value={editRating} onChange={(e) => setEditRating(e.target.value)} style={{ marginRight: "10px" }}>
                                            {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
                                        </select>
                                        <textarea 
                                            value={editComment} 
                                            onChange={(e) => setEditComment(e.target.value)} 
                                            style={{ width: "100%", margin: "10px 0", display: "block", color: "#000" }} 
                                        />
                                        <button onClick={() => handleSaveEdit(rev.id)} disabled={submitting} style={{ marginRight: "5px" }}>💾 Сохранить</button>
                                        <button onClick={handleCancelEdit} disabled={submitting}>❌ Отмена</button>
                                    </div>
                                ) : (
                                    <>
                                        <span style={{ color: "gold", marginLeft: "5px" }}>{"★".repeat(rev.rating)}</span>
                                        <p>{rev.comment}</p>
                                    </>
                                                                )}
                                
                                {canModify && !isEditing && (
                                    <div style={{ position: "absolute", right: "10px", top: "10px", display: "flex", gap: "5px" }}>
                                        {isAdmin && (
                                            <button 
                                                onClick={() => handleStartEdit(rev)}
                                                disabled={submitting}
                                                style={{
                                                    background: "#4da6ff",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "5px 10px",
                                                    borderRadius: "4px",
                                                    cursor: "pointer"
                                                }}
                                            >
                                                ✏️ Редактировать
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDeleteReview(rev.id)}
                                            disabled={submitting}
                                            style={{
                                                background: "#ff4d4d",
                                                color: "white",
                                                border: "none",
                                                padding: "5px 10px",
                                                borderRadius: "4px",
                                                cursor: "pointer"
                                            }}
                                        >
                                            🗑️ Удалить
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </section>
        </div>
    );
}