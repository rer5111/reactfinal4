const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Pool } = require('pg');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Подключение к PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

// Проверка подключения
pool.on('connect', () => {
    console.log('Подключение к PostgreSQL установлено');
});

pool.on('error', (err) => {
    console.error('Ошибка подключения к PostgreSQL:', err);
});

// Простой тестовый endpoint
app.get('/api/test', (req, res) => {
    res.json({ message: 'API работает!', timestamp: new Date() });
});

// Простой запрос к БД без JOIN
app.get('/api/test-db', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW() as current_time');
        res.json({ 
            message: 'Подключение к БД работает!',
            current_time: result.rows[0].current_time
        });
    } catch (error) {
        console.error('Ошибка теста БД:', error);
        res.status(500).json({ error: error.message });
    }
});

// CREATE
app.post('/api/roles', async (req, res) => {
    try {
        const { title } = req.body;
        console.log(`Создание роли: ${title}`);
        const result = await pool.query(
            'INSERT INTO roles (title) VALUES ($1) RETURNING *',
            [title]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка создания роли:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ (ALL)
app.get('/api/roles', async (req, res) => {
    try {
        console.log('Запрос всех ролей...');
        const result = await pool.query('SELECT * FROM roles ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения ролей:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ (BY ID)
app.get('/api/roles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Запрос роли с id: ${id}`);
        const result = await pool.query('SELECT * FROM roles WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Роль не найдена' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка получения роли:', error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE
app.put('/api/roles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        console.log(`Обновление роли id: ${id} -> ${title}`);
        const result = await pool.query(
            'UPDATE roles SET title = $1 WHERE id = $2 RETURNING *',
            [title, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Роль не найдена' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка обновления роли:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE
app.delete('/api/roles/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Удаление роли id: ${id}`);
        const result = await pool.query('DELETE FROM roles WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Роль не найдена' });
        res.json({ message: 'Роль успешно удалена', deleted: result.rows[0] });
    } catch (error) {
        console.error('Ошибка удаления роли:', error);
        res.status(500).json({ error: error.message });
    }
});

// CREATE
app.post('/api/users', async (req, res) => {
    try {
        const { fullName, email, pass, phone, roleID } = req.body;
        console.log(`Создание пользователя: ${email}`);
        const result = await pool.query(
            'INSERT INTO users (full_name, email, pass, phone, roleID) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [fullName, email, pass, phone, roleID]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка создания пользователя:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ
app.get('/api/users', async (req, res) => {
    try {
        console.log('Запрос всех пользователей...');
        const result = await pool.query(`
            SELECT u.id, u.full_name, u.email, u.pass, u.phone, u.roleID, r.title as role_title 
            FROM users u
            JOIN roles r ON u.roleID = r.id
            ORDER BY u.id ASC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения пользователей:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ ORDERS BY USER ID (Strict JOIN Implementation)
app.get('/api/users/:id/orders', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Запрос истории заказов для пользователя с id: ${id}`);
        
        const query = `
            SELECT 
                o.id AS order_id,
                o.adress,
                o.status AS order_status,
                o.creation_date AS created_at,
                p.amnt AS quantity,
                prod.title AS product_title,
                prod.cost AS unit_cost
            FROM orders o
            JOIN order_info oi ON o.id = oi.order_id
            JOIN purchases p ON oi.purcahse_id = p.id
            JOIN products prod ON p.product_id = prod.id
            WHERE p.owner_id = $1
            ORDER BY o.creation_date DESC, o.id DESC;
        `;
        
        const result = await pool.query(query, [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения заказов пользователя:', error);
        res.status(500).json({ error: 'Ошибка сервера при получении истории заказов' });
    }
});


// READ (BY ID)
app.get('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Запрос пользователя с id: ${id}`);
        const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка получения пользователя:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ (LOGIN)
app.post('/api/users/login', async (req, res) => {
    try {
        const { login, password } = req.body;
        console.log(`Попытка войти в аккаунт ${login}`);
        const result = await pool.query('SELECT * FROM users WHERE email = $1 AND pass = $2', [login, password]);
        if (result.rows.length === 0) return res.json({ message: 'Неправильный логин или пароль.' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка попытки входа: ', error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE
app.put('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, email, pass, phone, roleID } = req.body;
        console.log(`Обновление пользователя id: ${id}`);
        
        let result;
        
        if (pass !== undefined && pass !== null) {
            result = await pool.query(
                'UPDATE users SET full_name = $1, email = $2, pass = $3, phone = $4, roleID = $5 WHERE id = $6 RETURNING *',
                [fullName, email, pass, phone, roleID, id]
            );
        } else {
            result = await pool.query(
                'UPDATE users SET full_name = $1, email = $2, phone = $3, roleID = $4 WHERE id = $5 RETURNING *',
                [fullName, email, phone, roleID, id]
            );
        }
        
        if (result.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка обновления пользователя:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE
app.delete('/api/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Удаление пользователя id: ${id}`);
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Пользователь не найден' });
        res.json({ message: 'Пользователь успешно удален', deleted: result.rows[0] });
    } catch (error) {
        console.error('Ошибка удаления пользователя:', error);
        res.status(500).json({ error: error.message });
    }
});
// CREATE
app.post('/api/categories', async (req, res) => {
    try {
        const { title } = req.body;
        console.log(`Создание категории: ${title}`);
        const result = await pool.query(
            'INSERT INTO categories (title) VALUES ($1) RETURNING *',
            [title]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка создания категории:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ
app.get('/api/categories', async (req, res) => {
    try {
        console.log('Запрос всех категорий...');
        const result = await pool.query('SELECT * FROM categories ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения категорий:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ (BY ID)
app.get('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Запрос категории с id: ${id}`);
        const result = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Категория не найдена' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка получения категории:', error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE
app.put('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        console.log(`Обновление категории id: ${id}`);
        const result = await pool.query(
            'UPDATE categories SET title = $1 WHERE id = $2 RETURNING *',
            [title, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Категория не найдена' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка обновления категории:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE
app.delete('/api/categories/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Удаление категории id: ${id}`);
        const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Категория не найдена' });
        res.json({ message: 'Категория успешно удалена', deleted: result.rows[0] });
    } catch (error) {
        console.error('Ошибка удаления категории:', error);
        res.status(500).json({ error: error.message });
    }
});

// CREATE
app.post('/api/products', async (req, res) => {
    try {
        const { title, description, price, category_name, img } = req.body;
        console.log(`Создание товара: ${title}`);

        if (!title || !title.trim() || !price || !category_name || !category_name.trim()) {
            return res.status(400).json({ error: 'Поля Название, Цена и Категория обязательны для заполнения.' });
        }

        const parsedCost = parseFloat(price);
        if (isNaN(parsedCost) || parsedCost <= 0) {
            return res.status(400).json({ error: 'Цена должна быть положительным числом.' });
        }

        const result = await pool.query(
            `INSERT INTO products (title, cost, category_id, global_discount, img, description) 
             VALUES (
                 $1, 
                 $2, 
                 (SELECT id FROM categories WHERE title = $3), 
                 $4, 
                 $5,
                 $6
             ) 
             RETURNING *`,
            [
                title.trim(), 
                parsedCost, 
                category_name.trim(), 
                0, 
                img || '', 
                description ? description.trim() : 'Описание товара отсутствует'
            ]
        );

        if (result.rows.length === 0 || result.rows[0].category_id === null) {
            return res.status(400).json({ error: 'Указанная категория не найдена в базе данных.' });
        }

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка создания товара:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ
app.get('/api/products', async (req, res) => {
    try {
        console.log('Запрос всех товаров...');
        const queryText = `
            SELECT 
                p.id, p.title, p.cost, p.global_discount, p.img, p.description,
                c.title as category,
                COALESCE(d.discount, 0) as local_discount
            FROM products p
            JOIN categories c ON p.category_id = c.id
            LEFT JOIN discount_info d ON p.id = d.product_id
            ORDER BY p.id ASC
        `;
        const result = await pool.query(queryText);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения каталога товаров:', error);
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/products/:productId/reviews', async (req, res) => {
    const { productId } = req.params;

    try {
        const queryText = `
            SELECT 
                r.id AS id,
                r.review AS comment,
                r.rating AS rating,
                r.creation_date AS creation_date,
                u.full_name AS author_name,
                u.email AS author_email
            FROM review_info ri
            JOIN reviews r ON ri.review_id = r.id
            JOIN users u ON r.owner_id = u.id
            WHERE ri.product_id = $1
            ORDER BY r.id DESC;
        `;

        const result = await pool.query(queryText, [productId]);
        const processedRows = result.rows.map(row => ({
            id: row.id,
            comment: row.comment,
            rating: row.rating,
            creation_date: row.creation_date,
            author_name: row.author_name,
            author_email: row.author_email
        }));

        res.json(processedRows);
    } catch (error) {
        console.error('Ошибка при получении отзывов товара через JOIN:', error);
        res.status(500).json({ error: 'Не удалось получить отзывы для этого товара.' });
    }
});

app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, cost, category, globalDiscount, img } = req.body;
        console.log(`Обновление товара с id: ${id}, категория: ${category}`);

        if (!category) {
            return res.status(400).json({ error: 'Название категории обязательно для заполнения' });
        }
        const result = await pool.query(
            `UPDATE products 
             SET title = $1, 
                 cost = $2, 
                 category_id = (SELECT id FROM categories WHERE title = $3), 
                 global_discount = $4, 
                 img = $5 
             WHERE id = $6 
             RETURNING *`,
            [title, cost, category, globalDiscount, img, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Товар не найден' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка обновления товара:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Удаление товара с id: ${id}`);
        const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Ботинок не найден' });
        res.json({ message: 'Ботинок успешно удален', deleted: result.rows[0] });
    } catch (error) {
        console.error('Ошибка удаления товара:', error);
        res.status(500).json({ error: error.message });
    }
});


// READ (BY ID)
app.get('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Запрос одного товара с id: ${id}`);
        
        const queryText = `
            SELECT 
                p.id, p.title, p.cost, p.global_discount, p.img, p.description,
                c.title as category,
                COALESCE(d.discount, 0) as local_discount
            FROM products p
            JOIN categories c ON p.category_id = c.id
            LEFT JOIN discount_info d ON p.id = d.product_id
            WHERE p.id = $1
        `;
        
        const result = await pool.query(queryText, [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Товар не найден' });
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка получения товара:', error);
        res.status(500).json({ error: error.message });
    }
});

// CREATE
app.post('/api/discounts', async (req, res) => {
    try {
        const { ownerId, productId, discount} = req.body;
        console.log(`Создание скидки на товар с id ${productId} пользователю с id ${ownerId}}`);
        const result = await pool.query(
            'INSERT INTO discount_info (owner_id, product_id, discount) VALUES ($1, $2, $3) RETURNING *',
            [ownerId, productId, discount]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка создания скидки:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ
app.get('/api/discounts', async (req, res) => {
    try {
        console.log('Запрос всех скидок...');
        const result = await pool.query('SELECT * FROM discount_info ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения скидок:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ (BY owner_id)
app.get('/api/discounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Запрос скидок с owner_id: ${id}`);
        const result = await pool.query('SELECT * FROM discount_info WHERE owner_id = $1', [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения скидок:', error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE
app.put('/api/discounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ownerId, productId, discount} = req.body;
        console.log(`Обновление скидки с id: ${id}`);
        const result = await pool.query(
            'UPDATE discount_info SET owner_id = $1, product_id = $2, discount = $3 WHERE id = $4 RETURNING *',
            [ownerId, productId, discount, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Скидка не найдена' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка обновления скидки:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE
app.delete('/api/discounts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Удаление скидки с id: ${id}`);
        const result = await pool.query('DELETE FROM discount_info WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Скидка не найдена' });
        res.json({ message: 'Скидка успешно удалена', deleted: result.rows[0] });
    } catch (error) {
        console.error('Ошибка удаления скидки:', error);
        res.status(500).json({ error: error.message });
    }
});

// CREATE
app.post('/api/carts', async (req, res) => {
    try {
        const { ownerId, productId, amnt} = req.body;
        console.log(`Создание предмета в корзине с товаром с id ${productId} пользователю с id ${ownerId}}`);
        const result = await pool.query(
            'INSERT INTO carts (owner_id, product_id, amnt) VALUES ($1, $2, $3) RETURNING *',
            [ownerId, productId, amnt]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка создания предмета:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ
app.get('/api/carts', async (req, res) => {
    try {
        console.log('Запрос всех предметов в корзине...');
        const result = await pool.query('SELECT * FROM carts ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения предметов:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ (BY owner_id)
app.get('/api/carts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Запрос предметов с owner_id: ${id}`);
        const result = await pool.query('SELECT * FROM carts WHERE owner_id = $1 ORDER BY id ASC', [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения предметов:', error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE
app.put('/api/carts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ownerId, productId, amnt} = req.body;
        console.log(`Обновление предмета в корзине с id: ${id}`);
        const result = await pool.query(
            'UPDATE carts SET owner_id = $1, product_id = $2, amnt = $3 WHERE id = $4 RETURNING *',
            [ownerId, productId, amnt, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Предмет не найдена' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка обновления предмета:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE
app.delete('/api/carts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Удаление предмета в корзине с id: ${id}`);
        const result = await pool.query('DELETE FROM carts WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Предмет не найден' });
        res.json({ message: 'Корзина успешно удалена', deleted: result.rows[0] });
    } catch (error) {
        console.error('Ошибка удаления предмета:', error);
        res.status(500).json({ error: error.message });
    }
});

// CREATE
app.post('/api/purchases', async (req, res) => {
    try {
        const { ownerId, productId, amnt} = req.body;
        console.log(`Создание покупки товара с id ${productId} пользователю с id ${ownerId}}`);
        const result = await pool.query(
            'INSERT INTO purchases (owner_id, product_id, amnt) VALUES ($1, $2, $3) RETURNING *',
            [ownerId, productId, amnt]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка создания покупки:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ
app.get('/api/purchases', async (req, res) => {
    try {
        console.log('Запрос всех покупок...');
        const result = await pool.query('SELECT * FROM purchases ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения покупок:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ (BY owner_id)
app.get('/api/purchases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Запрос покупок с owner_id: ${id}`);
        const result = await pool.query('SELECT * FROM purchases WHERE owner_id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Покупки не найдены' });
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения покупок:', error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE
app.put('/api/purchases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { ownerId, productId, amnt} = req.body;
        console.log(`Обновление покупки в корзине с id: ${id}`);
        const result = await pool.query(
            'UPDATE purchases SET owner_id = $1, product_id = $2, amnt = $3 WHERE id = $4 RETURNING *',
            [ownerId, productId, amnt, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Покупка не найдена' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка обновления покупки:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE
app.delete('/api/purchases/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Удаление покупки с id: ${id}`);
        const result = await pool.query('DELETE FROM purchases WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Покупка не найдена' });
        res.json({ message: 'Покупка успешно удалена', deleted: result.rows[0] });
    } catch (error) {
        console.error('Ошибка удаления покупки:', error);
        res.status(500).json({ error: error.message });
    }
});
// CREATE
app.post('/api/orders', async (req, res) => {
    try {
        const { adress, status, creationDate } = req.body;
        console.log(`Создание заказа по адресу: ${adress}`);
        const result = await pool.query(
            'INSERT INTO orders (adress, status, creation_date) VALUES ($1, $2, $3) RETURNING *',
            [adress, status, creationDate]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка создания заказа:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ
app.get('/api/orders', async (req, res) => {
    try {
        const queryText = `
            SELECT 
                o.id,
                o.status,
                o.adress,
                o.creation_date AS "deliveryDate",
                u.full_name AS "customerName",
                u.email AS "customerEmail",
                json_agg(
                    json_build_object(
                        'title', prod.title,
                        'amount', p.amnt,
                        'cost', prod.cost
                    )
                ) AS items
            FROM orders o
            JOIN order_info oi ON o.id = oi.order_id
            JOIN purchases p ON oi.purcahse_id = p.id
            JOIN users u ON p.owner_id = u.id
            JOIN products prod ON p.product_id = prod.id
            GROUP BY o.id, o.status, o.adress, o.creation_date, u.full_name, u.email
            ORDER BY o.id DESC;
        `;
        const result = await pool.query(queryText);
        res.status(200).json(result.rows);
    } catch (error) {
        console.error('Ошибка GET /api/orders при сборке товаров:', error);
        res.status(500).json({ error: 'Ошибка сервера при сборке состава заказов.' });
    }
});

// READ (BY ID)
app.get('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Запрос заказа с id: ${id}`);
        const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Заказ не найден' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка получения заказа:', error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE
app.put('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { adress, status, creationDate } = req.body;
        console.log(`Обновление заказа id: ${id}`);
        const result = await pool.query(
            'UPDATE orders SET adress = $1, status = $2, creation_date = $3 WHERE id = $4 RETURNING *',
            [adress, status, creationDate, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Заказ не найден' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка обновления заказа:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE
app.delete('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Удаление заказа id: ${id}`);
        const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Заказ не найден' });
        res.json({ message: 'Заказ успешно удален', deleted: result.rows[0] });
    } catch (error) {
        console.error('Ошибка удаления заказа:', error);
        res.status(500).json({ error: error.message });
    }
});

// CREATE
app.post('/api/order-info', async (req, res) => {
    try {
        const { purchaseId, orderId } = req.body;
        console.log(`Привязка покупки id ${purchaseId} к заказу id ${orderId}`);
        const result = await pool.query(
            'INSERT INTO order_info (purcahse_id, order_id) VALUES ($1, $2) RETURNING *',
            [purchaseId, orderId]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка создания информации о заказе:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ
app.get('/api/order-info', async (req, res) => {
    try {
        console.log('Запрос всей информации по заказам...');
        const result = await pool.query('SELECT * FROM order_info ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения информации по заказам:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ (BY order_id)
app.get('/api/order-info/order/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Запрос информации для order_id: ${id}`);
        const result = await pool.query('SELECT * FROM order_info WHERE order_id = $1 ORDER BY id ASC', [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения информации о заказе:', error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE
app.put('/api/order-info/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { purchaseId, orderId } = req.body;
        console.log(`Обновление информации о заказе с id: ${id}`);
        const result = await pool.query(
            'UPDATE order_info SET purcahse_id = $1, order_id = $2 WHERE id = $3 RETURNING *',
            [purchaseId, orderId, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Информация о заказе не найдена' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка обновления информации о заказе:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE
app.delete('/api/order-info/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Удаление связи в информации о заказе с id: ${id}`);
        const result = await pool.query('DELETE FROM order_info WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Информация о заказе не найдена' });
        res.json({ message: 'Связь в информации о заказе успешно удалена', deleted: result.rows[0] });
    } catch (error) {
        console.error('Ошибка удаления информации о заказе:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// REVIEWS ENDPOINTS
// ==========================================

// CREATE
app.post('/api/reviews', async (req, res) => {
    const { userEmail, creationDate, review, rating, productId } = req.body;

    if (!userEmail || !productId || !review || review.trim() === '') {
        return res.status(400).json({ error: 'Missing mandatory review fields or product association.' });
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ error: 'Rating score must be a valid integer between 1 and 5.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        const userCheck = await client.query('SELECT id FROM users WHERE email = $1', [userEmail]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Пользователь не найден в системе.' });
        }
        const ownerId = userCheck.rows[0].id;

        const existingReviewCheck = await client.query(
            `SELECT r.id 
             FROM reviews r
             JOIN review_info ri ON r.id = ri.review_id
             WHERE r.owner_id = $1 AND ri.product_id = $2`,
            [ownerId, productId]
        );

        if (existingReviewCheck.rows.length > 0) {
            return res.status(400).json({ error: 'Вы уже оставили отзыв на этот товар.' });
        }

        const reviewResult = await client.query(
            `INSERT INTO reviews (owner_id, creation_date, review, rating) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id`,
            [ownerId, creationDate || new Date().toISOString().split('T')[0], review, parsedRating]
        );

        const generatedReviewId = reviewResult.rows[0].id;

        await client.query(
            'INSERT INTO review_info (review_id, product_id) VALUES ($1, $2)',
            [generatedReviewId, productId]
        );

        await client.query('COMMIT');
        res.status(201).json({ success: true, message: 'Отзыв опубликован.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ошибка создания отзыва:', error);
        res.status(500).json({ error: 'Не удалось опубликовать отзыв. Ошибка сервера БД.' });
    } finally {
        client.release();
    }
});

// READ (BY owner_id)
app.get('/api/reviews/user/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Запрос отзывов с owner_id: ${id}`);
        const result = await pool.query('SELECT * FROM reviews WHERE owner_id = $1 ORDER BY id ASC', [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения отзывов пользователя:', error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE
app.put('/api/reviews/:id', async (req, res) => {
    const reviewId = req.params.id;
    const { userEmail, authorEmail, review, rating } = req.body;

    if (!userEmail || !authorEmail || !review || review.trim() === '') {
        return res.status(400).json({ error: 'Неполные данные для редактирования отзыва.' });
    }

    const parsedRating = parseInt(rating, 10);
    if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
        return res.status(400).json({ error: 'Рейтинг должен быть числом от 1 до 5.' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const identityCheck = await client.query(
            'SELECT roleid FROM users WHERE email = $1',
            [userEmail]
        );

        if (identityCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Пользователь сессии не найден в системе.' });
        }

        const requestingUser = identityCheck.rows[0];
        const isAuthor = userEmail.toLowerCase() === authorEmail.toLowerCase();
        const isAdmin = requestingUser && Number(requestingUser.roleid) === 1;

        if (!isAuthor && !isAdmin) {
            return res.status(403).json({ error: 'У вас нет прав на редактирование этого отзыва.' });
        }

        let updateResult;

        if (isAdmin) {
            updateResult = await client.query(
                `UPDATE reviews 
                 SET review = $1, rating = $2 
                 WHERE id = $3 
                 RETURNING *`,
                [review, parsedRating, reviewId]
            );
        } else {
            updateResult = await client.query(
                `UPDATE reviews 
                 SET review = $1, rating = $2 
                 WHERE id = $3 AND owner_id = (SELECT id FROM users WHERE email = $4)
                 RETURNING *`,
                [review, parsedRating, reviewId, authorEmail]
            );
        }

        if (updateResult.rows.length === 0) {
            throw new Error('ReviewNotFound');
        }

        await client.query('COMMIT');
        res.status(200).json({ success: true, message: 'Отзыв успешно обновлен.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Ошибка при обновлении отзыва:', error);
        const errorMsg = error.message === 'ReviewNotFound' ? 'Отзыв не найден или нарушены права доступа.' : 'Ошибка базы данных.';
        res.status(error.message === 'ReviewNotFound' ? 404 : 500).json({ error: errorMsg });
    } finally {
        client.release();
    }
});


// DELETE
app.delete('/api/reviews/:id', async (req, res) => {
    const { id } = req.params;
    const { userEmail } = req.body; 

    if (!userEmail) {
        return res.status(401).json({ error: 'Пользователь не авторизован.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const findOwnerQuery = `
            SELECT r.id, u.email 
            FROM reviews r
            JOIN users u ON r.owner_id = u.id
            WHERE r.id = $1
        `;
        const checkResult = await client.query(findOwnerQuery, [id]);

        if (checkResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Запись отзыва не найдена.' });
        }

        await client.query('DELETE FROM review_info WHERE review_id = $1', [id]);
        await client.query('DELETE FROM reviews WHERE id = $1', [id]);

        await client.query('COMMIT');
        res.json({ message: 'Отзыв успешно удален.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ error: 'Ошибка сервера при удалении.' });
    } finally {
        client.release();
    }
});


// ==========================================
// REVIEW INFO ENDPOINTS
// ==========================================

// CREATE
app.post('/api/review-info', async (req, res) => {
    try {
        const { reviewId, productId } = req.body;
        console.log(`Привязка отзыва id ${reviewId} к товару id ${productId}`);
        const result = await pool.query(
            'INSERT INTO review_info (review_id, product_id) VALUES ($1, $2) RETURNING *',
            [reviewId, productId]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка создания информации об отзыве:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ
app.get('/api/review-info', async (req, res) => {
    try {
        console.log('Запрос всей информации по отзывам...');
        const result = await pool.query('SELECT * FROM review_info ORDER BY id ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения информации по отзывам:', error);
        res.status(500).json({ error: error.message });
    }
});

// READ (BY product_id)
app.get('/api/review-info/product/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Запрос информации об отзывах для product_id: ${id}`);
        const result = await pool.query('SELECT * FROM review_info WHERE product_id = $1 ORDER BY id ASC', [id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Ошибка получения отзывов для товара:', error);
        res.status(500).json({ error: error.message });
    }
});

// UPDATE
app.put('/api/review-info/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { reviewId, productId } = req.body;
        console.log(`Обновление информации об отзыве с id: ${id}`);
        const result = await pool.query(
            'UPDATE review_info SET review_id = $1, product_id = $2 WHERE id = $3 RETURNING *',
            [reviewId, productId, id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Информация об отзыве не найдена' });
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Ошибка обновления информации об отзыве:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE
app.delete('/api/review-info/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Удаление связи в информации об отзыве с id: ${id}`);
        const result = await pool.query('DELETE FROM review_info WHERE id = $1 RETURNING *', [id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Информация об отзыве не найдена' });
        res.json({ message: 'Связь в информации об отзыве успешно удалена', deleted: result.rows[0] });
    } catch (error) {
        console.error('Ошибка удаления информации об отзыве:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reviews', async (req, res) => {
    try {
        const { ownerId, creationDate, review, rating, productId } = req.body;
        console.log(`Создание отзыва с оценкой ${rating} на товар id ${productId}`);

        // 1. Вставка в основную таблицу отзывов
        const reviewResult = await pool.query(
            'INSERT INTO reviews (owner_id, creation_date, review, rating) VALUES ($1, $2, $3, $4) RETURNING id',
            [ownerId, creationDate, review, rating]
        );
        const newReviewId = reviewResult.rows[0].id;

        // 2. Привязка отзыва к товару через связующую таблицу review_info
        await pool.query(
            'INSERT INTO review_info (review_id, product_id) VALUES ($1, $2)',
            [newReviewId, productId]
        );

        res.status(201).json({ success: true, message: 'Отзыв успешно добавлен' });
    } catch (error) {
        console.error('Ошибка создания отзыва:', error);
        res.status(500).json({ error: error.message });
    }
});


// POST /api/orders/checkout
app.post('/api/orders/checkout', async (req, res) => {
    try {
        const { ownerId, adress, deliveryDate } = req.body;
        
        console.log(`Получен запрос на оформление заказа для пользователя: ${ownerId}`);

        const orderResult = await pool.query(
            "INSERT INTO orders (adress, status, creation_date) VALUES ($1, 'Обрабатывается', $2) RETURNING id",
            [adress, deliveryDate]
        );
        const newOrderId = orderResult.rows[0].id;

        const cartItems = await pool.query(
            "SELECT product_id, amnt FROM carts WHERE owner_id = $1",
            [ownerId]
        );

        if (cartItems.rows.length === 0) {
            return res.status(400).json({ error: 'Корзина пуста. Нечего оформлять.' });
        }

        for (const item of cartItems.rows) {
            const purchaseResult = await pool.query(
                "INSERT INTO purchases (owner_id, product_id, amnt) VALUES ($1, $2, $3) RETURNING id",
                [ownerId, item.product_id, item.amnt]
            );
            const purchaseId = purchaseResult.rows[0].id;

            await pool.query(
                "INSERT INTO order_info (purcahse_id, order_id) VALUES ($1, $2)",
                [purchaseId, newOrderId]
            );
        }

        await pool.query("DELETE FROM carts WHERE owner_id = $1", [ownerId]);

        res.status(201).json({ success: true, message: 'Заказ успешно оформлен', orderId: newOrderId });
    } catch (error) {
        console.error('Ошибка на бэкенде при оформлении заказа:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера при сохранении заказа.' });
    }
});


// Запуск сервера
app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log('Тестовые endpoints:');
    console.log(`1) http://localhost:${PORT}/api/test`);
    console.log(`2) http://localhost:${PORT}/api/test-db`);
    console.log(`3) http://localhost:${PORT}/api/roles/1`);
    console.log(`4) http://localhost:${PORT}/api/users`);
});