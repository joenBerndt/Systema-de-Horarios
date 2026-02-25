# 🚀 Guía de Implementación para Tu Sistema
## Plan de Migración de Mock a Google OAuth Real

---

## Estado Actual de Tu Sistema

Tu sistema actualmente tiene:
- ✅ Simulador de Google login (componente `GoogleLoginSimulator`)
- ✅ Flujo de completar perfil obligatorio (`CompleteProfile`)
- ✅ Manejo de estado de autenticación
- ✅ Notificaciones visuales elegantes
- ❌ **NO** tiene validación real con Google OAuth

---

## Plan de Migración a Producción

### Fase 1: Configuración de Google Cloud (30 minutos)

#### 1.1 Crear Proyecto en Google Cloud Console

```bash
1. Ir a: https://console.cloud.google.com/
2. Click "Nuevo Proyecto"
3. Nombre: "sistema-gestion-equipos" (o el nombre de tu app)
4. Click "Crear"
```

#### 1.2 Habilitar APIs Necesarias

```bash
1. En el menú → "APIs y servicios" → "Biblioteca"
2. Buscar y habilitar:
   - Google+ API
   - Google Identity Toolkit API
3. Click "Habilitar" en cada una
```

#### 1.3 Configurar Pantalla de Consentimiento OAuth

```bash
1. APIs y servicios → Pantalla de consentimiento de OAuth
2. Tipo de usuario: "Externo"
3. Click "Crear"

Información de la aplicación:
  - Nombre: "Sistema de Gestión de Equipos"
  - Email de asistencia: tu-email@empresa.com
  - Logo: (opcional, 120x120px)
  
Dominios autorizados:
  - localhost (para desarrollo)
  - tu-dominio.com (para producción)
  
Ámbitos:
  - ✅ email
  - ✅ profile
  - ✅ openid
  
4. Click "Guardar y continuar"
```

#### 1.4 Crear Credenciales OAuth 2.0

```bash
1. APIs y servicios → Credenciales
2. Click "Crear credenciales" → "ID de cliente de OAuth 2.0"

Tipo de aplicación: Aplicación web

Orígenes de JavaScript autorizados:
  - http://localhost:5173 (Vite dev server)
  - http://localhost:3000 (si usas otro puerto)
  - https://tu-app.vercel.app (producción)
  
URIs de redireccionamiento autorizados:
  - http://localhost:5173
  - https://tu-app.vercel.app
  
3. Click "Crear"
4. GUARDAR:
   ✅ ID de cliente: 123456789-abc.apps.googleusercontent.com
   ✅ Secreto de cliente: GOCSPX-xxxxxxxxxx
```

### Fase 2: Configurar Frontend (1 hora)

#### 2.1 Instalar Dependencias

```bash
npm install @react-oauth/google
```

#### 2.2 Crear Archivo de Configuración de Entorno

```bash
# .env.local (en la raíz del proyecto)
VITE_GOOGLE_CLIENT_ID=tu-client-id-aqui.apps.googleusercontent.com
VITE_API_URL=http://localhost:3001 # Tu backend API
```

#### 2.3 Actualizar App.tsx con Provider

```typescript
// src/app/App.tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  // ... todo tu código existente ...

  // Envolver todo con GoogleOAuthProvider
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      {/* Tu código actual aquí */}
      {!currentUser && !currentMember && (
        <Login 
          onLogin={handleLogin}
          onMemberLogin={handleMemberLogin}
          onShowRegister={() => setShowRegister(true)}
          users={users}
          members={members}
          onGoogleLogin={handleGoogleLogin}
        />
      )}
    </GoogleOAuthProvider>
  );
}
```

#### 2.4 Reemplazar GoogleLoginSimulator con Real

```typescript
// src/components/Login.tsx
import { useGoogleLogin } from '@react-oauth/google';

// REEMPLAZAR la función handleGoogleLogin actual:
const handleGoogleLogin = () => {
  setShowGoogleSimulator(true); // ❌ REMOVER ESTO
};

// POR ESTO:
const googleLogin = useGoogleLogin({
  flow: 'auth-code', // ✅ Authorization Code Flow
  onSuccess: async (codeResponse) => {
    setIsLoading(true);
    try {
      // Enviar el code al backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: codeResponse.code,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al autenticar');
      }

      const data = await response.json();
      
      // Si el usuario es nuevo y necesita completar perfil
      if (data.needsProfileCompletion) {
        onGoogleLogin({
          email: data.email,
          name: data.name,
          picture: data.picture,
        });
      } else {
        // Usuario existente - login directo
        // Aquí manejas el token JWT que retorna tu backend
        localStorage.setItem('auth_token', data.token);
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  },
  onError: (error) => {
    console.error('Google Login Error:', error);
  },
});

// Y actualizar el botón para usar googleLogin:
<Button onClick={() => googleLogin()}>
  Continuar con Google
</Button>
```

#### 2.5 Mantener CompleteProfile

```typescript
// ✅ MANTENER CompleteProfile.tsx tal como está
// Solo necesitas actualizar el onComplete para enviar los datos al backend:

const handleCompleteProfile = async (memberData: Omit<TeamMember, 'id'>) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/complete-profile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        googleData,
        profileData: memberData,
      }),
    });

    if (!response.ok) throw new Error('Error al completar perfil');

    const data = await response.json();
    
    // Guardar token y hacer login
    localStorage.setItem('auth_token', data.token);
    handleMemberLogin(data.user);
    
  } catch (error) {
    console.error('Error:', error);
  }
};
```

### Fase 3: Implementar Backend (2-3 horas)

#### 3.1 Crear Proyecto Backend (Node.js + Express)

```bash
mkdir backend
cd backend
npm init -y

# Instalar dependencias
npm install express cors dotenv google-auth-library jsonwebtoken bcrypt pg
npm install -D typescript @types/express @types/node @types/jsonwebtoken ts-node nodemon

# Crear tsconfig.json
npx tsc --init
```

#### 3.2 Estructura de Carpetas

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── google.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── users.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── users.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── errorHandler.ts
│   ├── models/
│   │   └── user.model.ts
│   └── server.ts
├── .env
├── package.json
└── tsconfig.json
```

#### 3.3 Configurar Variables de Entorno

```bash
# backend/.env
PORT=3001
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-tu-secret

# JWT
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gestion_equipos

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5173
```

#### 3.4 Código del Backend

**server.ts:**

```typescript
// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
```

**auth.controller.ts:**

```typescript
// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database';

const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'postmessage', // Para @react-oauth/google
});

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Código de autorización requerido' });
    }

    // 1. Intercambiar code por tokens
    const { tokens } = await googleClient.getToken(code);
    
    if (!tokens.id_token) {
      return res.status(401).json({ error: 'No se recibió id_token' });
    }

    // 2. Verificar id_token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // 3. Validar email verificado
    if (!payload.email_verified) {
      return res.status(401).json({ 
        error: 'Email no verificado. Por favor verifica tu email en Google.' 
      });
    }

    // 4. Extraer datos
    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || '';
    const picture = payload.picture || '';

    // 5. Buscar usuario en BD
    const userResult = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    let user = userResult.rows[0];

    if (!user) {
      // Usuario nuevo - necesita completar perfil
      return res.status(200).json({
        needsProfileCompletion: true,
        email,
        name,
        picture,
        googleId,
      });
    }

    // 6. Usuario existente - actualizar last_login
    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE google_id = $1',
      [googleId]
    );

    // 7. Generar JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.is_admin ? 'admin' : 'user',
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // 8. Configurar cookie httpOnly
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // 9. Retornar respuesta
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Google Auth Error:', error);
    return res.status(500).json({ 
      error: 'Error al autenticar con Google',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
```

**users.controller.ts:**

```typescript
// src/controllers/users.controller.ts
import { Request, Response } from 'express';
import { pool } from '../config/database';
import jwt from 'jsonwebtoken';

export const completeProfile = async (req: Request, res: Response) => {
  try {
    const { googleData, profileData } = req.body;

    // Validar datos requeridos
    if (!googleData?.googleId || !profileData) {
      return res.status(400).json({ error: 'Datos incompletos' });
    }

    // Verificar que el usuario no exista
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleData.googleId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'Usuario ya existe' });
    }

    // Crear usuario con perfil completo
    const result = await pool.query(
      `INSERT INTO users (
        google_id, email, email_verified, name, picture, 
        age, city, phone, role, specialty, employment_type,
        office_id, github_username, auth_provider, 
        has_access, last_login, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW(), NOW())
      RETURNING *`,
      [
        googleData.googleId,
        googleData.email,
        true,
        googleData.name,
        googleData.picture,
        profileData.age,
        profileData.city,
        profileData.phone,
        profileData.role,
        profileData.specialty,
        profileData.employmentType,
        profileData.officeId,
        profileData.githubUsername,
        'google',
        true,
      ]
    );

    const user = result.rows[0];

    // Generar JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Cookie httpOnly
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Complete Profile Error:', error);
    return res.status(500).json({ 
      error: 'Error al completar perfil',
      message: error instanceof Error ? error.message : 'Error desconocido',
    });
  }
};
```

### Fase 4: Base de Datos (30 minutos)

#### 4.1 Crear Base de Datos PostgreSQL

```bash
# Instalar PostgreSQL (si no está instalado)
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql

# Crear base de datos
createdb gestion_equipos

# O con psql:
psql
CREATE DATABASE gestion_equipos;
\c gestion_equipos
```

#### 4.2 Ejecutar Migraciones

```sql
-- migrations/001_create_users_table.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Google OAuth
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    name VARCHAR(255),
    picture TEXT,
    
    -- Perfil del usuario
    age INTEGER,
    city VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100),
    specialty VARCHAR(255),
    employment_type VARCHAR(100),
    office_id UUID,
    github_username VARCHAR(100),
    
    -- Sistema
    auth_provider VARCHAR(50) DEFAULT 'google',
    has_access BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_last_login ON users(last_login DESC);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Fase 5: Testing y Deploy (1-2 horas)

#### 5.1 Testing Local

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd ..
npm run dev

# Probar:
1. Click "Continuar con Google"
2. Seleccionar cuenta
3. Aceptar permisos
4. Completar perfil (si es nuevo)
5. Verificar login exitoso
```

#### 5.2 Deploy Backend (Railway/Render)

**Railway:**

```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Crear proyecto
railway init

# Agregar PostgreSQL
railway add

# Configurar variables de entorno en Railway dashboard:
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
JWT_SECRET=...
FRONTEND_URL=https://tu-app.vercel.app

# Deploy
railway up
```

**Render:**

1. Ir a render.com
2. Conectar repositorio de GitHub
3. Crear "Web Service"
4. Agregar variables de entorno
5. Deploy automático

#### 5.3 Deploy Frontend (Vercel)

```bash
# Instalar Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Configurar variables de entorno en Vercel dashboard:
VITE_GOOGLE_CLIENT_ID=tu-client-id
VITE_API_URL=https://tu-backend.railway.app
```

---

## Checklist Final

### Antes de Producción

- [ ] ✅ Google Cloud Console configurado
- [ ] ✅ Client ID y Secret guardados de forma segura
- [ ] ✅ URIs de redirección actualizados para producción
- [ ] ✅ Frontend usando @react-oauth/google
- [ ] ✅ Backend validando id_token correctamente
- [ ] ✅ Base de datos PostgreSQL en producción
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ HTTPS habilitado en producción
- [ ] ✅ CORS configurado correctamente
- [ ] ✅ Cookies httpOnly habilitadas
- [ ] ✅ Rate limiting implementado
- [ ] ✅ Logging configurado
- [ ] ✅ Manejo de errores robusto
- [ ] ✅ Testing completo realizado

---

## Diferencias con el Sistema Actual

### Lo que YA tienes (mantener):
- ✅ `CompleteProfile` component
- ✅ Flujo de obligar completar perfil
- ✅ Notificaciones visuales
- ✅ Manejo de estado

### Lo que necesitas CAMBIAR:
- ❌ Remover `GoogleLoginSimulator` (es solo mock)
- ✅ Agregar `@react-oauth/google`
- ✅ Crear backend real
- ✅ Crear base de datos PostgreSQL
- ✅ Validar tokens en backend

### Lo que necesitas AGREGAR:
- ✅ Endpoint `/api/auth/google` en backend
- ✅ Endpoint `/api/users/complete-profile` en backend
- ✅ Verificación de id_token con Google
- ✅ Generación de JWT propio

---

## Próximos Pasos Recomendados

1. **Semana 1:** Configurar Google Cloud + Backend básico
2. **Semana 2:** Integrar frontend con backend real
3. **Semana 3:** Testing exhaustivo
4. **Semana 4:** Deploy a producción

---

## Soporte y Recursos

- 📖 [Documentación completa en GOOGLE_AUTH_ARCHITECTURE.md](./GOOGLE_AUTH_ARCHITECTURE.md)
- 🔗 [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- 💬 [Stack Overflow - google-oauth](https://stackoverflow.com/questions/tagged/google-oauth)

---

**¡Éxito con la implementación!** 🚀
