import { fetchWithAuth } from '../utils/fetchWithAuth';

export const API_URL = import.meta.env.VITE_REACT_APP_API_URL;

export async function login(email, password, recaptchaToken = null) {
    const body = { email, password };

    if (recaptchaToken) {
        body.recaptchaToken = recaptchaToken;
    }

    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'Erro ao fazer login');
    }

    // ✅ Garante que twoFactorEnabled esteja presente
    if (data.user && typeof data.user.twoFactorEnabled === 'undefined') {
        data.user.twoFactorEnabled = false;
    }

    return data;
}

export async function register(name, email, password) {
    const response = await fetch(`${API_URL}/auth/cadastro-direto`, {
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

export async function getLabs() {
    const response = await fetchWithAuth(`${API_URL}/labs`);
    if (!response.ok) throw new Error('Erro ao buscar laboratórios');
    return response.json();
}

export async function createReservation(token, labId, start, end) {
    const response = await fetch(`${API_URL}/reservations`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ labId, start, end }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao solicitar reserva');
    }

    return response.json();
}

export async function getMyReservations() {
    const response = await fetchWithAuth(`${API_URL}/reservations/user`);
    if (!response.ok) throw new Error('Erro ao buscar suas reservas');
    return response.json();
}

export async function getReservationsByModerator() {
    const response = await fetchWithAuth(`${API_URL}/coordenador/reservations`);
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao buscar reservas do moderador');
    }
    return response.json();
}

export async function updateReservationStatus(id, status) {
    const response = await fetchWithAuth(`${API_URL}/reservations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao atualizar reserva');
    }

    return response.json();
}

export async function cadastrarUsuario(userData) {
    const response = await fetchWithAuth(`${API_URL}/auth/register-user`, {
        method: 'POST',
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

export async function deletarUsuario(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/admin/users/${id}`, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao excluir usuário');
    }

    return response.json();
}

export async function cadastrarLaboratorioComImagem(formData) {
    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/labs`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
        },
        body: formData,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Erro ao criar laboratório');
    }

    return response.json();
}

export async function deletarLaboratorio(labId) {
    const response = await fetchWithAuth(`${API_URL}/labs/${labId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao excluir laboratório');
    }

    return response.json();
}

export async function listarUsuarios() {
    const response = await fetchWithAuth(`${API_URL}/admin/users`);
    if (!response.ok) throw new Error('Erro ao buscar usuários');
    return response.json();
}

export async function getMyLabs() {
    const response = await fetchWithAuth(`${API_URL}/moderador/meus-laboratorios`);
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao buscar laboratórios do moderador');
    }
    return response.json();
}

export async function atribuirUsuarioAoLab(labId, userId) {
    const response = await fetchWithAuth(`${API_URL}/labs/${labId}/usuarios`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao vincular usuário');
    }

    return response.json();
}

export async function removerUsuarioDoLab(labId, userId) {
    const response = await fetchWithAuth(`${API_URL}/labs/${labId}/usuarios/${userId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao desvincular usuário');
    }

    return response.json();
}

export async function listarUsuariosPermitidosParaCoordenador() {
    const response = await fetchWithAuth(`${API_URL}/coordenador/usuarios-permitidos`);
    if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erro ao buscar usuários permitidos');
    }
    return response.json();
}

export function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}
