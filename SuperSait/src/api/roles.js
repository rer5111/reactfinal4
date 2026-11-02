const API_URL = 'http://localhost:3001/api/roles';
/*
    Круды ролей
  */
export async function getRoles() {
    const response = await fetch(API_URL);
    if (!response.ok) {
        throw new Error('Ошибка при получении ролей');
    }
    return await response.json();
}

export async function getRoleById(id) {
    const response = await fetch(`${API_URL}/${id}`);
    if (!response.ok) {
        throw new Error('Ошибка при получении роли');
    }
    return await response.json();
}

export async function createRole(roleData) {
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
    });
    if (!response.ok) {
        throw new Error('Ошибка при создании роли');
    }
    return await response.json();
}

export async function updateRole(id, roleData) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(roleData),
    });
    if (!response.ok) {
        throw new Error('Ошибка при обновлении роли');
    }
    return await response.json();
}

export async function deleteRole(id) {
    const response = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error('Ошибка при удалении роли');
    }
    return await response.json();
}
