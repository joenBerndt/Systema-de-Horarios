// src/api/client.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Función genérica para interactuar con tu propia API en Render
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
    try {
        const url = `${API_URL}${endpoint}`;

        // Por defecto, asumimos que siempre enviaremos/recibiremos JSON
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        const response = await fetch(url, { ...options, headers });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Error HTTP: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`❌ Error en llamada al API (${endpoint}):`, error);
        throw error;
    }
};

// --- SERVICIOS ESPECÍFICOS ---

export const memberService = {
    // Obtener la verdadera lista de miembros desde PostgreSQL en la nube
    getAll: () => apiFetch('/api/miembros'),

    // Guardar de forma segura en Postgres
    create: (memberData: any) => apiFetch('/api/miembros', {
        method: 'POST',
        body: JSON.stringify(memberData)
    }),

    delete: (id: string) => apiFetch(`/api/miembros/${id}`, {
        method: 'DELETE'
    })
};

export const officeService = {
    getAll: () => apiFetch('/api/oficinas'),

    create: (officeData: any) => apiFetch('/api/oficinas', {
        method: 'POST',
        body: JSON.stringify(officeData)
    }),

    update: (id: string, officeData: any) => apiFetch(`/api/oficinas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(officeData)
    }),

    delete: (id: string) => apiFetch(`/api/oficinas/${id}`, {
        method: 'DELETE'
    })
};

export const authService = {
    // Verificar acceso real contra la base de datos
    login: (credentials: any) => apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
    })
};
