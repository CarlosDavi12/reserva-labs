export async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');

    // 🔒 Redireciona se não houver token
    if (!token) {
        limparSessao();
        return null;
    }

    // 🧠 Monta headers com segurança
    const headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
    };

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        // 🚫 Se token expirou ou for inválido
        if (response.status === 401 || response.status === 403) {
            limparSessao();
            return null;
        }

        return response;
    } catch (error) {
        console.error('Erro ao fazer requisição autenticada:', error);
        throw new Error('Erro de conexão com o servidor.');
    }
}

// 🧼 Função utilitária para limpar sessão e redirecionar
function limparSessao() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}
