<<<<<<< HEAD
CREATE TABLE roles(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
title VARCHAR(30) UNIQUE NOT NULL);

CREATE TABLE users(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
full_name VARCHAR(50) NOT NULL,
email VARCHAR(50) UNIQUE NOT NULL,
pass VARCHAR(50) NOT NULL,
phone VARCHAR(30) NOT NULL,
roleID INT NOT NULL REFERENCES roles(id));

CREATE TABLE categories(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
title VARCHAR(30) NOT NULL UNIQUE);

CREATE TABLE products(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
title VARCHAR(30) NOT NULL,
cost DECIMAL(10, 2) NOT NULL,
category_id INT NOT NULL REFERENCES categories(id),
global_discount DECIMAL(3, 2),
description VARCHAR(500),y
img VARCHAR(50) NOT NULL);

CREATE TABLE discount_info(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
owner_id INT REFERENCES users(id) NOT NULL,
product_id INT REFERENCES products(id) NOT NULL,
UNIQUE(owner_id, product_id),
discount DECIMAL(3, 2));

CREATE TABLE carts(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
owner_id INT REFERENCES users(id) NOT NULL,
product_id INT REFERENCES products(id) NOT NULL,
amnt INT NOT NULL);

CREATE TABLE purchases(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
owner_id INT REFERENCES users(id) NOT NULL,
product_id INT REFERENCES products(id) NOT NULL,
amnt INT NOT NULL);

CREATE TABLE orders(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
adress VARCHAR(200),
status VARCHAR(50),
creation_date date
);

CREATE TABLE order_info(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
purcahse_id INT REFERENCES purchases(id) NOT NULL,
order_id INT REFERENCES orders(id) NOT NULL
);

CREATE TABLE reviews(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
owner_id INT REFERENCES users(id) NOT NULL,
creation_date date,
review VARCHAR(300),
rating INT CHECK (rating >= 1 AND rating <= 5)
);

CREATE TABlE review_info(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
review_id INT REFERENCES reviews(id) NOT NULL,
product_id INT REFERENCES products(id) NOT NULL
);

-- TRUNCATE TABLE 
--     order_info, 
--     review_info, 
--     discount_info, 
--     carts, 
--     purchases, 
--     reviews, 
--     orders, 
--     products, 
--     categories, 
--     users, 
--     roles 
-- RESTART IDENTITY CASCADE;

INSERT INTO roles (title) VALUES 
('Администратор'),
('Пользователь');

INSERT INTO categories (title) VALUES 
('Ноутбуки'),
('Телефоны'),
('Бытовая техника');

INSERT INTO products (title, cost, category_id, global_discount, img, description) VALUES 
(
 'Asus tuf gaming f15', 
 250, 
 (SELECT id FROM categories WHERE title = 'Ноутбуки'), 
 0.10, 
 'src/assets/asus.png', 
 'Самый крутой ноутбук'
),
(
 'Iphone 17 Pro max', 
 2000, 
 (SELECT id FROM categories WHERE title = 'Телефоны'), 
 0.00, 
 'src/assets/iphone.jpg', 
 'Самый телефон'
),
(
 'Чайник', 
 200, 
 (SELECT id FROM categories WHERE title = 'Бытовая техника'), 
 0.05, 
 'src/assets/chainik.webp', 
 'Кипятит воду очень быстро без других функций.'
);

INSERT INTO users (full_name, email, pass, phone, roleID) VALUES 
(
 'Тестовый Админ', 
 'a@a.com', 
 '0', 
 '+7 (911) 111-11-11', 
 (SELECT id FROM roles WHERE title = 'Администратор')
),
(
 'Дмитрий Петров', 
 'u@u.com', 
 '0', 
 '+7 (900) 555-35-35', 
 (SELECT id FROM roles WHERE title = 'Пользователь')
);
=======
CREATE TABLE roles(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
title VARCHAR(30) UNIQUE NOT NULL);

CREATE TABLE users(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
full_name VARCHAR(50) NOT NULL,
email VARCHAR(50) UNIQUE NOT NULL,
pass VARCHAR(50) NOT NULL,
phone VARCHAR(30) NOT NULL,
roleID INT NOT NULL REFERENCES roles(id));

CREATE TABLE categories(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
title VARCHAR(30) NOT NULL UNIQUE);

CREATE TABLE products(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
title VARCHAR(30) NOT NULL,
cost DECIMAL(10, 2) NOT NULL,
category_id INT NOT NULL REFERENCES categories(id),
global_discount DECIMAL(3, 2),
description VARCHAR(500),y
img VARCHAR(50) NOT NULL);

CREATE TABLE discount_info(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
owner_id INT REFERENCES users(id) NOT NULL,
product_id INT REFERENCES products(id) NOT NULL,
UNIQUE(owner_id, product_id),
discount DECIMAL(3, 2));

CREATE TABLE carts(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
owner_id INT REFERENCES users(id) NOT NULL,
product_id INT REFERENCES products(id) NOT NULL,
amnt INT NOT NULL);

CREATE TABLE purchases(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
owner_id INT REFERENCES users(id) NOT NULL,
product_id INT REFERENCES products(id) NOT NULL,
amnt INT NOT NULL);

CREATE TABLE orders(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
adress VARCHAR(200),
status VARCHAR(50),
creation_date date
);

CREATE TABLE order_info(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
purcahse_id INT REFERENCES purchases(id) NOT NULL,
order_id INT REFERENCES orders(id) NOT NULL
);

CREATE TABLE reviews(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
owner_id INT REFERENCES users(id) NOT NULL,
creation_date date,
review VARCHAR(300),
rating INT CHECK (rating >= 1 AND rating <= 5)
);

CREATE TABlE review_info(
id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY (START WITH 1 INCREMENT BY 1),
review_id INT REFERENCES reviews(id) NOT NULL,
product_id INT REFERENCES products(id) NOT NULL
);

-- TRUNCATE TABLE 
--     order_info, 
--     review_info, 
--     discount_info, 
--     carts, 
--     purchases, 
--     reviews, 
--     orders, 
--     products, 
--     categories, 
--     users, 
--     roles 
-- RESTART IDENTITY CASCADE;

INSERT INTO roles (title) VALUES 
('Администратор'),
('Пользователь');

INSERT INTO categories (title) VALUES 
('Ноутбуки'),
('Телефоны'),
('Бытовая техника');

INSERT INTO products (title, cost, category_id, global_discount, img, description) VALUES 
(
 'Asus tuf gaming f15', 
 250, 
 (SELECT id FROM categories WHERE title = 'Ноутбуки'), 
 0.10, 
 'src/assets/asus.png', 
 'Самый крутой ноутбук'
),
(
 'Iphone 17 Pro max', 
 2000, 
 (SELECT id FROM categories WHERE title = 'Телефоны'), 
 0.00, 
 'src/assets/iphone.jpg', 
 'Самый телефон'
),
(
 'Чайник', 
 200, 
 (SELECT id FROM categories WHERE title = 'Бытовая техника'), 
 0.05, 
 'src/assets/chainik.webp', 
 'Кипятит воду очень быстро без других функций.'
);

INSERT INTO users (full_name, email, pass, phone, roleID) VALUES 
(
 'Тестовый Админ', 
 'a@a.com', 
 '0', 
 '+7 (911) 111-11-11', 
 (SELECT id FROM roles WHERE title = 'Администратор')
),
(
 'Дмитрий Петров', 
 'u@u.com', 
 '0', 
 '+7 (900) 555-35-35', 
 (SELECT id FROM roles WHERE title = 'Пользователь')
);
>>>>>>> f6def9c2df17600705ea44ff44266302082f831d
