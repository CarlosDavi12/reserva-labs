export async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');

    // Se não houver token, redireciona imediatamente
    if (!token) {
        localStorage.removeItem('user');
        window.location.href = '/login';
        return null;
    }

    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        // Se o token estiver expirado ou inválido
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return null;
        }

        return response;
    } catch (error) {
        console.error('Erro ao fazer requisição autenticada:', error);
        throw new Error('Erro de conexão com o servidor.');
    }
}
