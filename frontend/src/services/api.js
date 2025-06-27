const API_URL = 'http://localhost:3333';

export async function login(email, password) {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao fazer login');
    }

    return response.json();
}

export async function register(name, email, password) {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao cadastrar usuário');
    }

    return response.json();
}

export async function getLabs(token) {
    const response = await fetch(`${API_URL}/labs`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar laboratórios');
    }

    return response.json();
}

export async function createReservation(token, labId, date) {
    const response = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ labId, date }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao solicitar reserva');
    }

    return response.json();
}

export async function getMyReservations(token) {
    const response = await fetch(`${API_URL}/reservations/user`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar suas reservas');
    }

    return response.json();
}

export async function getAllReservations(token) {
    const response = await fetch(`${API_URL}/reservations`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar todas as reservas');
    }

    return response.json();
}

export async function updateReservationStatus(token, id, status) {
    const response = await fetch(`${API_URL}/reservations/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar reserva');
    }

    return response.json();
}

export async function cadastrarUsuario(token, userData) {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
    });

    if (!response.ok) {
        const data = await response.json().catch(() => {
            throw new Error('Erro inesperado do servidor');
        });
        throw new Error(data.error || 'Erro ao cadastrar usuário');
    }

    return response.json();
}

export async function associarModerador(token, userId, labId) {
    const response = await fetch(`${API_URL}/moderator-labs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, labId }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao associar moderador');
    }

    return response.json();
}

export async function cadastrarLaboratorio(token, name, description) {
    const response = await fetch('http://localhost:3333/labs', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao criar laboratório');
    }

    return response.json();
}

export async function deletarLaboratorio(token, labId) {
    const response = await fetch(`http://localhost:3333/labs/${labId}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao excluir laboratório');
    }

    return response.json();
}

export async function listarAssociacoes(token) {
    const response = await fetch(`${API_URL}/moderator-labs`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao listar associações');
    }

    return response.json();
}

export async function removerAssociacao(token, associacaoId) {
    const response = await fetch(`http://localhost:3333/moderator-labs/${associacaoId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao remover associação');
    }

    return response.json();
}

export async function listarUsuarios(token) {
    const response = await fetch('http://localhost:3333/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
        throw new Error('Erro ao buscar usuários');
    }

    return response.json();
}

export function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}
