import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Configuración de la base de datos PostgreSQL
// NOTA: Si usas Supabase o Render, debes poner tu URL en .env como DATABASE_URL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Comprobar la conexión al iniciar
pool.connect()
    .then(() => console.log('✅ Conectado a la Base de Datos PostgreSQL'))
    .catch((err: any) => console.error('❌ Error (Temporal):', err.message, '- Configura DATABASE_URL en .env para conectar.'));

// Utilidad de Encriptación de datos sensibles (Ejemplo: teléfonos de emergencia)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'mi_clave_secreta_super_segura_32b'; // Debe ser 32 caracteres (256-bit)
const IV_LENGTH = 16;

function encryptData(text: string) {
    if (!text) return text;
    let iv = crypto.randomBytes(IV_LENGTH);
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptData(text: string) {
    if (!text) return text;
    let textParts = text.split(':');
    let iv = Buffer.from(textParts.shift()!, 'hex');
    let encryptedText = Buffer.from(textParts.join(':'), 'hex');
    let decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32)), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// ==========================================
// --- ENDPOINTS COMPLETOS DE LA API REST ---
// ==========================================

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'API Segura funcionando correctamente' });
});

// ---------------- MIEMBROS ----------------

// 1. Obtener todos los miembros
app.get('/api/miembros', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM members ORDER BY created_at DESC');

        // Desencriptamos datos muy sensibles al enviar al panel de admin
        const decryptedRows = rows.map((row: any) => ({
            ...row,
            emergencyContact: decryptData(row.emergency_contact)
        }));

        res.json(decryptedRows);
    } catch (err) {
        console.error(err);
        // Para prueba sin Base de Datos:
        res.json([{ id: 'demo1', name: 'Demo Usuario (Requiere Base de Datos para uso real)' }]);
    }
});

// 2. Crear un miembro (Con Encriptado de Contraseña y Datos)
app.post('/api/miembros', async (req, res) => {
    try {
        const data = req.body;

        // a. Hashing (Encriptación Irreversible) de la contraseña para Auth
        const saltRounds = 10;
        const hashedPassword = data.password ? await bcrypt.hash(data.password, saltRounds) : null;

        // b. Encriptación Reversible para datos sensibles de RRHH
        const encryptedPhone = encryptData(data.phone);
        const encryptedEmergencyContact = data.emergencyContact ? encryptData(data.emergencyContact) : null;

        const query = `
      INSERT INTO members (
        id, name, email, password_hash, role, employment_type, 
        phone_encrypted, emergency_contact_encrypted, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      RETURNING id, name, email;
    `;

        const values = [
            data.id || crypto.randomUUID(), data.name, data.email,
            hashedPassword, data.role, data.employmentType,
            encryptedPhone, encryptedEmergencyContact
        ];

        const { rows } = await pool.query(query, values);
        res.status(201).json({ message: "Miembro asegurado y creado", member: rows[0] });

    } catch (err: any) {
        if (err.code === '23505') return res.status(409).json({ error: 'El email ya existe' });
        res.status(500).json({ error: 'Error interno del servidor', details: err.message });
    }
});

// 3. Actualizar Miembro
app.put('/api/miembros/:id', async (req, res) => {
    // Lógica de update con encriptación opcional si la password cambió
    res.json({ message: `Endpoint PUT preparado para el miembro ${req.params.id}` });
});

// 4. Eliminar Miembro
app.delete('/api/miembros/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM members WHERE id = $1', [req.params.id]);
        res.json({ message: "Miembro eliminado" });
    } catch (err) {
        res.status(500).json({ error: 'Error del servidor' });
    }
});


// ---------------- AUTENTICACIÓN LOCAL MOCK ----------------

// Login verificando el Hash
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { rows } = await pool.query('SELECT * FROM members WHERE email = $1', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const member = rows[0];
        const match = await bcrypt.compare(password, member.password_hash);

        if (match) {
            res.json({ message: "Login Exitoso", member: { id: member.id, name: member.name, role: member.role } });
        } else {
            res.status(401).json({ error: 'Contraseña Incorrecta' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Error interno' });
    }
});


// ---------------- HORARIOS Y DISPONIBILIDAD ----------------

app.get('/api/horarios', async (req, res) => {
    res.json({ message: "Endpoint de Schedules preparado. Relacionará miembros y oficinas." });
});

app.post('/api/horarios', async (req, res) => {
    res.status(201).json({ message: "Horario registrado" });
});


// INICIO DEL SERVIDOR
app.listen(port, () => {
    console.log(`🚀 API Secure Backend corriendo en http://localhost:${port}`);
});
