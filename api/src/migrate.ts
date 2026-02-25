import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const createTablesQuery = `
  -- Habilitar extensión para generar UUIDs aleatorios
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

  -- Tabla de Miembros / Usuarios
  CREATE TABLE IF NOT EXISTS members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(50) NOT NULL,
    employment_type VARCHAR(100) NOT NULL,
    phone_encrypted VARCHAR(255),
    emergency_contact_encrypted VARCHAR(255),
    github_email VARCHAR(255),
    github_username VARCHAR(255),
    birth_date DATE,
    address TEXT,
    city VARCHAR(100),
    office_id UUID,          -- Relación futura a Oficinas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabla de Oficinas (Locations)
  CREATE TABLE IF NOT EXISTS offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    capacity INTEGER NOT NULL,
    address TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabla de Disponibilidad por Miembro
  CREATE TABLE IF NOT EXISTS availabilities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    day_of_week VARCHAR(20) NOT NULL,
    is_available BOOLEAN DEFAULT true,
    time_ranges JSONB NOT NULL DEFAULT '[]', -- Usaremos JSONB para guardar rangos flexiblente [{start, end, status}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member_id, day_of_week)
  );

  -- Tabla de Horarios (Schedules)
  CREATE TABLE IF NOT EXISTS schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID REFERENCES members(id) ON DELETE CASCADE,
    office_id UUID REFERENCES offices(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(50) DEFAULT 'assigned', -- 'assigned', 'attended', 'missed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
  );
`;

async function runMigration() {
    console.log("⏳ Iniciando migración de la Base de Datos...");

    if (!process.env.DATABASE_URL) {
        console.error("❌ ERROR CRÍTICO: No se encontró DATABASE_URL en el archivo .env de la API.");
        console.error("👉 Por favor, crea un archivo .env en la carpeta /api y pega tu URL de Postgres.");
        process.exit(1);
    }

    try {
        const client = await pool.connect();
        console.log("✅ Conectado exitosamente a PostgreSQL en la nube.");

        console.log("🔨 Creando tablas...");
        await client.query(createTablesQuery);

        console.log("🎉 ¡Migración exitosa! Todas las tablas están listas para recibir datos.");
        client.release();
    } catch (error) {
        console.error("❌ Error ejecutando la migración:", error);
    } finally {
        pool.end();
    }
}

runMigration();
