const API_URL = 'http://localhost:3001/api/users';

/*
    Круды пользователей.
  */
export async function getUsers() {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Ошибка при получении списка пользователей');
    }
    return await response.json();
}

export async function getUserById(id) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
        if (response.status === 404) throw new Error('Пользователь не найден');
        throw new Error('Ошибка при получении профиля пользователя');
    }
    return await response.json();
}

export async function getUserByEmail(email) {
    const response = await fetch(`${API_URL}/email/${email}`);
    if (!response.ok) {
        if (response.status === 404) throw new Error('Пользователь не найден');
        throw new Error('Ошибка при получении профиля пользователя');
    }
    return await response.json();
}

export async function tryChangePass(email, pass) {
    console.log(email, pass)
    const response = await fetch(`${API_URL}/passchange/attempt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, pass: pass })
    });
    if (!response.ok) {
        if (response.status === 404) throw new Error('Пользователь не найден');
        throw new Error('Ошибка при получении профиля пользователя');
    }
}

export async function attemptLogin(login, password) {
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ login: login, password: password })
    });
    if (!response.ok) {
        throw new Error('Ошибка при попытке входа в систему');
    }
    return await response.json();
}

export async function createUser(userData) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fullName: userData.fullName,
            email: userData.email,
            pass: userData.pass,
            phone: userData.phone,
            roleID: userData.roleID
        }),
    });
    
    if (!response.ok) {
        const res = await response.json();
        // Исправлен краш повторного чтения потока ответов сервера
        if (res.error && res.error.includes("users_email_key")) {
            return { error: "Пользователь с такой почтой уже зарегистрирован" };
        }
        return { error: `Неудачная попытка регистрации: ${res.error || response.statusText}` };
    }
    return await response.json();
}

export async function updateUser(id, userData) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            fullName: userData.fullName,
            email: userData.email,
            pass: userData.pass,
            phone: userData.phone,
            roleID: userData.roleID
        }),
    });
    if (!response.ok) {
        throw new Error('Ошибка при сохранении обновлений профиля пользователя');
    }
    return await response.json();
}

export async function deleteUser(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Ошибка при удалении учетной записи пользователя');
    }
    return await response.json();
}
