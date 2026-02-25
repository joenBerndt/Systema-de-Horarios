import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la base de datos PostgreSQL (Neon/Render/Supabase)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Comprobar la conexión al iniciar
pool.connect()
    .then(() => console.log('✅ Conectado a la Base de Datos PostgreSQL'))
    .catch(err => console.error('❌ Error conectando a la base de datos:', err));

// --- RUTAS BÁSICAS ---

// Ruta de prueba
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API del Sistema de Horarios funcionando correctamente' });
});

// Obtener todos los miembros
app.get('/api/miembros', async (req, res) => {
    try {
        // Cuando tengas la tabla creada en Postgres:
        // const { rows } = await pool.query('SELECT * FROM members');
        // res.json(rows);
        res.json({ message: "Aquí devolveremos los miembros desde Postgres pronto" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Guardar un nuevo miembro
app.post('/api/miembros', async (req, res) => {
    try {
        const data = req.body;
        // Lógica futura de inserción en DB aquí
        res.status(201).json({ message: "Miembro creado recibido con éxito", data });
    } catch (err) {
        res.status(500).json({ error: 'Error del servidor' });
    }
});

app.listen(port, () => {
    console.log(`🚀 Servidor API corriendo en http://localhost:${port}`);
});
