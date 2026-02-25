# 🔐 Arquitectura de Autenticación OAuth 2.0 con Google
## Guía Completa para Implementación en Producción

---

## 📋 Índice

1. [Flujo Completo de Autenticación](#flujo-completo)
2. [Diagrama de Arquitectura](#diagrama-de-arquitectura)
3. [Estructura de Base de Datos](#estructura-de-base-de-datos)
4. [Implementación Frontend](#implementación-frontend)
5. [Implementación Backend](#implementación-backend)
6. [Seguridad y Buenas Prácticas](#seguridad-y-buenas-prácticas)
7. [Errores Comunes](#errores-comunes)
8. [Checklist de Producción](#checklist-de-producción)

---

## 1. Flujo Completo de Autenticación {#flujo-completo}

### Paso 1: Configuración Inicial en Google Cloud Console

```
1. Ir a https://console.cloud.google.com/
2. Crear un nuevo proyecto (ej: "mi-app-produccion")
3. Habilitar Google+ API y Google Identity
4. Ir a "Credenciales" → "Crear credenciales" → "ID de cliente de OAuth 2.0"
5. Configurar pantalla de consentimiento OAuth:
   - Tipo: Externo (para usuarios fuera de tu organización)
   - Nombre de la aplicación
   - Email de soporte
   - Logo (opcional)
   - Ámbitos: email, profile, openid
   
6. Crear credenciales OAuth 2.0:
   - Tipo de aplicación: Aplicación web
   - Orígenes autorizados de JavaScript:
     * http://localhost:3000 (desarrollo)
     * https://tu-dominio.com (producción)
   - URI de redireccionamiento autorizados:
     * http://localhost:3000/auth/google/callback (desarrollo)
     * https://tu-dominio.com/auth/google/callback (producción)
   
7. Guardar:
   - CLIENT_ID: Usar en frontend (público)
   - CLIENT_SECRET: Usar SOLO en backend (privado)
```

### Paso 2: Flujo de Autenticación (Authorization Code Flow)

**Este es el flujo MÁS SEGURO para aplicaciones web:**

```
┌─────────────┐                                    ┌──────────────┐
│   Usuario   │                                    │   Frontend   │
└──────┬──────┘                                    └──────┬───────┘
       │                                                  │
       │ 1. Click "Iniciar sesión con Google"           │
       │─────────────────────────────────────────────────>│
       │                                                  │
       │                                                  │ 2. Redirige a Google
       │                                                  │    con CLIENT_ID y scope
       │<─────────────────────────────────────────────────│
       │                                                  │
       │         ┌──────────────────────────┐            │
       │────────>│  Google Auth Server      │            │
       │         │  (accounts.google.com)   │            │
       │         └──────────┬───────────────┘            │
       │                    │                             │
       │ 3. Usuario acepta permisos                      │
       │<───────────────────┘                             │
       │                                                  │
       │ 4. Redirect con authorization_code              │
       │─────────────────────────────────────────────────>│
       │                                                  │
       │                                                  │ 5. Envía code al backend
       │                                                  │
       │                                    ┌─────────────▼────────┐
       │                                    │      Backend         │
       │                                    │   (Tu servidor)      │
       │                                    └─────────┬────────────┘
       │                                              │
       │                                              │ 6. Intercambia code
       │                                              │    por tokens (POST)
       │                                              │    usando CLIENT_SECRET
       │                       ┌──────────────────────▼─────────┐
       │                       │   Google Token Endpoint        │
       │                       │   oauth2.googleapis.com/token  │
       │                       └──────────────┬─────────────────┘
       │                                      │
       │                                      │ 7. Retorna tokens:
       │                                      │    - access_token
       │                                      │    - id_token (JWT)
       │                                      │    - refresh_token
       │                       ┌──────────────▼─────────────┐
       │                       │    Backend (Validación)    │
       │                       │                            │
       │                       │ 8. Valida id_token:        │
       │                       │    - Firma (RS256)         │
       │                       │    - Audiencia (CLIENT_ID) │
       │                       │    - Emisor (Google)       │
       │                       │    - Expiración           │
       │                       └──────────────┬─────────────┘
       │                                      │
       │                                      │ 9. Extrae payload:
       │                                      │    {
       │                                      │      "sub": "109234...",
       │                                      │      "email": "...",
       │                                      │      "name": "...",
       │                                      │      "picture": "..."
       │                                      │    }
       │                       ┌──────────────▼─────────────┐
       │                       │    Base de Datos           │
       │                       │                            │
       │                       │ 10. Busca usuario por:     │
       │                       │     google_id = sub        │
       │                       │                            │
       │                       │ 11. Si NO existe:          │
       │                       │     - Crear usuario        │
       │                       │     - Guardar google_id    │
       │                       │                            │
       │                       │ 12. Si existe:             │
       │                       │     - Actualizar last_login│
       │                       └──────────────┬─────────────┘
       │                                      │
       │                                      │ 13. Genera JWT propio
       │                                      │     del sistema
       │                       ┌──────────────▼─────────────┐
       │<──────────────────────│  Retorna al Frontend:      │
       │                       │  {                          │
       │                       │    "token": "eyJhbG...",   │
       │                       │    "user": {...}           │
       │                       │  }                          │
       │                       └────────────────────────────┘
       │
       │ 14. Guarda token en:
       │     - httpOnly cookie (MÁS SEGURO)
       │     - localStorage (menos seguro)
       │
```

---

## 2. Diagrama de Arquitectura {#diagrama-de-arquitectura}

### Arquitectura de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│  ┌────────────────────────────────────────────────────┐     │
│  │  Google Sign-In Button                              │     │
│  │  - Usa @react-oauth/google o gsi client            │     │
│  │  - Solo maneja UI y obtiene authorization_code     │     │
│  └────────────────────┬───────────────────────────────┘     │
│                       │                                      │
│                       │ POST /api/auth/google                │
│                       │ { code: "4/0AY0..." }               │
└───────────────────────┼──────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (API)                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Endpoint: POST /api/auth/google                     │   │
│  │                                                       │   │
│  │  1. Recibe authorization_code                        │   │
│  │  2. Intercambia por tokens con Google                │   │
│  │  3. Valida id_token                                  │   │
│  │  4. Extrae datos del usuario                         │   │
│  │  5. Crea/actualiza usuario en DB                     │   │
│  │  6. Genera JWT propio del sistema                    │   │
│  │  7. Retorna token + usuario                          │   │
│  └───────────────────┬──────────────────────────────────┘   │
│                      │                                       │
│                      │ Librería: google-auth-library        │
│                      │ o jsonwebtoken + jwks-rsa            │
└──────────────────────┼───────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   BASE DE DATOS                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Tabla: users                                         │   │
│  │                                                       │   │
│  │  - id (UUID, PRIMARY KEY)                            │   │
│  │  - google_id (VARCHAR, UNIQUE, INDEXED) ⚡ KEY       │   │
│  │  - email (VARCHAR, UNIQUE)                           │   │
│  │  - email_verified (BOOLEAN)                          │   │
│  │  - name (VARCHAR)                                    │   │
│  │  - picture (TEXT)                                    │   │
│  │  - locale (VARCHAR)                                  │   │
│  │  - created_at (TIMESTAMP)                            │   │
│  │  - updated_at (TIMESTAMP)                            │   │
│  │  - last_login (TIMESTAMP)                            │   │
│  │  - auth_provider (VARCHAR) // 'google', 'github'    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│              SERVICIOS EXTERNOS                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Google OAuth 2.0 Endpoints                          │   │
│  │                                                       │   │
│  │  - Authorization: accounts.google.com/o/oauth2/v2/   │   │
│  │    auth                                              │   │
│  │                                                       │   │
│  │  - Token Exchange: oauth2.googleapis.com/token       │   │
│  │                                                       │   │
│  │  - UserInfo: openidconnect.googleapis.com/v1/        │   │
│  │    userinfo                                          │   │
│  │                                                       │   │
│  │  - JWKS (Public Keys): www.googleapis.com/oauth2/    │   │
│  │    v3/certs                                          │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Estructura de Base de Datos {#estructura-de-base-de-datos}

### PostgreSQL (Recomendado para producción)

```sql
-- Tabla principal de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Identificador ÚNICO de Google (campo CRÍTICO)
    google_id VARCHAR(255) UNIQUE,
    
    -- Información básica
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    name VARCHAR(255),
    given_name VARCHAR(255),
    family_name VARCHAR(255),
    picture TEXT,
    locale VARCHAR(10),
    
    -- Proveedor de autenticación
    auth_provider VARCHAR(50) DEFAULT 'google',
    
    -- Información del perfil (tu app)
    age INTEGER,
    city VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100),
    specialty VARCHAR(255),
    employment_type VARCHAR(100),
    office_id UUID REFERENCES offices(id),
    github_username VARCHAR(100),
    
    -- Acceso y permisos
    has_access BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Índices para búsqueda rápida
    CONSTRAINT check_auth_provider CHECK (auth_provider IN ('google', 'github', 'email'))
);

-- Índices para optimizar consultas
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_provider ON users(auth_provider);
CREATE INDEX idx_users_last_login ON users(last_login DESC);

-- Trigger para actualizar updated_at automáticamente
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

-- Tabla opcional: tokens de refresh
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_revoked BOOLEAN DEFAULT FALSE,
    
    -- Un usuario puede tener múltiples tokens (diferentes dispositivos)
    CONSTRAINT unique_token_hash UNIQUE (token_hash)
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
```

### Supabase (SQL similar)

```sql
-- En Supabase, usar el mismo esquema pero aprovechar Row Level Security

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver su propio perfil
CREATE POLICY "Users can view own profile"
    ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Política: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile"
    ON users
    FOR UPDATE
    USING (auth.uid() = id);
```

---

## 4. Implementación Frontend {#implementación-frontend}

### Opción A: Usando @react-oauth/google (Recomendado)

**Instalación:**

```bash
npm install @react-oauth/google
```

**Configuración del Provider:**

```tsx
// src/App.tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {/* Tu app aquí */}
    </GoogleOAuthProvider>
  );
}
```

**Componente de Login:**

```tsx
// src/components/GoogleLoginButton.tsx
import { useGoogleLogin } from '@react-oauth/google';
import { useState } from 'react';

export function GoogleLoginButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useGoogleLogin({
    // IMPORTANTE: Usar 'code' para Authorization Code Flow (más seguro)
    flow: 'auth-code',
    
    onSuccess: async (codeResponse) => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Enviar el authorization_code al backend
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: codeResponse.code,
          }),
        });

        if (!response.ok) {
          throw new Error('Error al autenticar con Google');
        }

        const data = await response.json();
        
        // Guardar el token JWT de tu sistema
        // OPCIÓN 1: Cookie httpOnly (backend lo hace automáticamente)
        // OPCIÓN 2: localStorage (menos seguro pero funciona)
        localStorage.setItem('auth_token', data.token);
        
        // Actualizar el estado de la app
        window.location.href = '/dashboard';
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setIsLoading(false);
      }
    },
    
    onError: (error) => {
      console.error('Login Failed:', error);
      setError('Error al iniciar sesión con Google');
    },
    
    // Scopes que necesitas
    scope: 'openid email profile',
  });

  return (
    <div>
      <button
        onClick={() => login()}
        disabled={isLoading}
        className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          {/* Logo de Google */}
        </svg>
        {isLoading ? 'Iniciando sesión...' : 'Continuar con Google'}
      </button>
      
      {error && (
        <div className="mt-2 text-red-600 text-sm">{error}</div>
      )}
    </div>
  );
}
```

### Opción B: Usando Google Identity Services (GSI) - Nativo

```html
<!-- Cargar el script de Google -->
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

```tsx
// src/components/GoogleLoginNative.tsx
import { useEffect, useRef } from 'react';

declare global {
  interface Window {
    google: any;
  }
}

export function GoogleLoginNative() {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Esperar a que el script de Google cargue
    const initializeGoogleSignIn = () => {
      if (window.google && buttonRef.current) {
        window.google.accounts.id.initialize({
          client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
          
          // IMPORTANTE: Usar callback para manejar la respuesta
          callback: handleCredentialResponse,
          
          // Configuración adicional
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Renderizar el botón
        window.google.accounts.id.renderButton(
          buttonRef.current,
          {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left',
          }
        );
      }
    };

    // Intentar inicializar inmediatamente o esperar
    if (window.google) {
      initializeGoogleSignIn();
    } else {
      window.addEventListener('load', initializeGoogleSignIn);
      return () => window.removeEventListener('load', initializeGoogleSignIn);
    }
  }, []);

  const handleCredentialResponse = async (response: any) => {
    try {
      // response.credential es el id_token JWT
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credential: response.credential, // id_token
        }),
      });

      if (!res.ok) throw new Error('Error de autenticación');

      const data = await res.json();
      localStorage.setItem('auth_token', data.token);
      window.location.href = '/dashboard';
      
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return <div ref={buttonRef}></div>;
}
```

---

## 5. Implementación Backend {#implementación-backend}

### Node.js + Express + TypeScript

**Instalación de dependencias:**

```bash
npm install express google-auth-library jsonwebtoken bcrypt
npm install -D @types/express @types/jsonwebtoken @types/bcrypt
```

**Variables de entorno (.env):**

```env
# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-tu-client-secret

# JWT de tu sistema
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion
JWT_EXPIRES_IN=7d

# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Entorno
NODE_ENV=production
```

**Código del endpoint:**

```typescript
// src/routes/auth.ts
import express, { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { db } from '../db'; // Tu conexión a la base de datos

const router = express.Router();

// Inicializar el cliente de Google
const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: process.env.GOOGLE_REDIRECT_URI, // Solo si usas authorization code
});

// Tipos
interface GooglePayload {
  sub: string;           // ID único de Google (USAR ESTE)
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}

// MÉTODO 1: Verificar id_token (cuando usas GSI nativo)
router.post('/auth/google', async (req: Request, res: Response) => {
  try {
    const { credential } = req.body; // id_token JWT

    if (!credential) {
      return res.status(400).json({ error: 'Falta el credential' });
    }

    // 1. Verificar el id_token con Google
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    // 2. Validaciones adicionales
    if (!payload.email_verified) {
      return res.status(401).json({ error: 'Email no verificado' });
    }

    // 3. Extraer datos importantes
    const googleId = payload.sub; // ID ÚNICO de Google
    const email = payload.email;
    const name = payload.name;
    const picture = payload.picture;

    // 4. Buscar o crear usuario en la base de datos
    let user = await db.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    if (user.rows.length === 0) {
      // Usuario NO existe - Crear nuevo
      const result = await db.query(
        `INSERT INTO users (
          google_id, email, email_verified, name, picture, auth_provider, last_login
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
        RETURNING *`,
        [googleId, email, true, name, picture, 'google']
      );
      user = result;
    } else {
      // Usuario existe - Actualizar last_login
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE google_id = $1',
        [googleId]
      );
    }

    const userData = user.rows[0];

    // 5. Generar JWT de tu sistema
    const token = jwt.sign(
      {
        userId: userData.id,
        email: userData.email,
        role: userData.is_admin ? 'admin' : 'user',
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'tu-app',
        subject: userData.id,
      }
    );

    // 6. Configurar cookie httpOnly (MÁS SEGURO)
    res.cookie('auth_token', token, {
      httpOnly: true,      // No accesible desde JavaScript
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict',  // Protección CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    // 7. Retornar datos al frontend
    return res.status(200).json({
      success: true,
      token, // También enviar token para apps móviles
      user: {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        isAdmin: userData.is_admin,
      },
    });

  } catch (error) {
    console.error('Error en Google Auth:', error);
    return res.status(500).json({
      error: 'Error al autenticar con Google',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// MÉTODO 2: Intercambiar authorization_code por tokens
router.post('/auth/google/callback', async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ error: 'Falta el authorization code' });
    }

    // 1. Intercambiar code por tokens
    const { tokens } = await googleClient.getToken(code);
    
    if (!tokens.id_token) {
      return res.status(401).json({ error: 'No se recibió id_token' });
    }

    // 2. Verificar el id_token
    const ticket = await googleClient.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // ... resto igual que el método 1 (desde el paso 2)
    // ... (código repetido omitido para brevedad)

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: 'Error de autenticación' });
  }
});

export default router;
```

### Python + FastAPI

```python
# requirements.txt
fastapi
uvicorn
google-auth
python-jose[cryptography]
python-multipart
sqlalchemy
psycopg2-binary

# main.py
from fastapi import FastAPI, HTTPException, Response
from google.auth.transport import requests
from google.oauth2 import id_token
import jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from database import SessionLocal, User
import os

app = FastAPI()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = "HS256"

@app.post("/auth/google")
async def google_auth(credential: str, response: Response):
    try:
        # 1. Verificar el id_token
        idinfo = id_token.verify_oauth2_token(
            credential, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        # 2. Validar el emisor
        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            raise ValueError('Wrong issuer.')

        # 3. Extraer datos
        google_id = idinfo['sub']
        email = idinfo['email']
        name = idinfo.get('name', '')
        picture = idinfo.get('picture', '')

        # 4. Base de datos
        db: Session = SessionLocal()
        
        user = db.query(User).filter(User.google_id == google_id).first()
        
        if not user:
            user = User(
                google_id=google_id,
                email=email,
                name=name,
                picture=picture,
                auth_provider='google',
                last_login=datetime.utcnow()
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user.last_login = datetime.utcnow()
            db.commit()

        # 5. Generar JWT
        token_data = {
            "user_id": str(user.id),
            "email": user.email,
            "exp": datetime.utcnow() + timedelta(days=7)
        }
        token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)

        # 6. Configurar cookie
        response.set_cookie(
            key="auth_token",
            value=token,
            httponly=True,
            secure=True,
            samesite="strict",
            max_age=7 * 24 * 60 * 60
        )

        return {
            "success": True,
            "token": token,
            "user": {
                "id": str(user.id),
                "email": user.email,
                "name": user.name,
                "picture": user.picture
            }
        }

    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

---

## 6. Seguridad y Buenas Prácticas {#seguridad-y-buenas-prácticas}

### ✅ HACER (DO)

1. **✅ SIEMPRE validar el id_token en el backend**
   ```typescript
   // CORRECTO ✅
   const ticket = await googleClient.verifyIdToken({
     idToken: credential,
     audience: process.env.GOOGLE_CLIENT_ID,
   });
   ```

2. **✅ Usar google_id (sub) como identificador único**
   ```sql
   -- CORRECTO ✅
   google_id VARCHAR(255) UNIQUE NOT NULL
   ```

3. **✅ Verificar que el email esté verificado**
   ```typescript
   if (!payload.email_verified) {
     throw new Error('Email not verified');
   }
   ```

4. **✅ Usar cookies httpOnly para tokens**
   ```typescript
   res.cookie('auth_token', token, {
     httpOnly: true,  // ✅ Previene XSS
     secure: true,    // ✅ Solo HTTPS
     sameSite: 'strict' // ✅ Previene CSRF
   });
   ```

5. **✅ Validar audience (CLIENT_ID)**
   ```typescript
   if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
     throw new Error('Invalid audience');
   }
   ```

6. **✅ Validar issuer (Google)**
   ```typescript
   const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
   if (!validIssuers.includes(payload.iss)) {
     throw new Error('Invalid issuer');
   }
   ```

7. **✅ Usar HTTPS en producción**
   ```nginx
   # NGINX config
   server {
     listen 443 ssl;
     ssl_certificate /path/to/cert.pem;
     ssl_certificate_key /path/to/key.pem;
   }
   ```

8. **✅ Implementar rate limiting**
   ```typescript
   import rateLimit from 'express-rate-limit';

   const authLimiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutos
     max: 5, // 5 intentos máximo
     message: 'Demasiados intentos de login'
   });

   app.use('/auth/google', authLimiter);
   ```

9. **✅ Logging de eventos de autenticación**
   ```typescript
   logger.info('User logged in', {
     userId: user.id,
     email: user.email,
     ip: req.ip,
     userAgent: req.headers['user-agent']
   });
   ```

10. **✅ Manejar tokens expirados**
    ```typescript
    try {
      const ticket = await googleClient.verifyIdToken({...});
    } catch (error) {
      if (error.message.includes('expired')) {
        return res.status(401).json({ error: 'Token expirado' });
      }
      throw error;
    }
    ```

### ❌ NO HACER (DON'T)

1. **❌ NUNCA confiar en el frontend solamente**
   ```typescript
   // INSEGURO ❌
   // Frontend
   const userInfo = parseJwt(googleToken);
   // Backend acepta sin verificar
   ```

2. **❌ NUNCA exponer CLIENT_SECRET en frontend**
   ```javascript
   // INSEGURO ❌
   const clientSecret = "GOCSPX-xxxxx"; // ❌ NUNCA
   ```

3. **❌ NUNCA usar solo email como identificador**
   ```sql
   -- INSEGURO ❌
   SELECT * FROM users WHERE email = $1;
   -- El email puede cambiar o ser compartido
   ```

4. **❌ NUNCA guardar tokens en localStorage sin encriptar**
   ```javascript
   // MENOS SEGURO ❌
   localStorage.setItem('google_token', token);
   // Vulnerable a XSS
   ```

5. **❌ NUNCA saltarse la verificación de firma**
   ```typescript
   // INSEGURO ❌
   const payload = jwt.decode(credential); // Sin verificar
   ```

6. **❌ NUNCA permitir credenciales no verificadas**
   ```typescript
   // INSEGURO ❌
   if (payload.email) {
     createUser(payload.email); // Sin verificar email_verified
   }
   ```

7. **❌ NUNCA loggear información sensible**
   ```typescript
   // INSEGURO ❌
   console.log('Token:', credential); // ❌
   console.log('Password:', password); // ❌
   ```

---

## 7. Errores Comunes {#errores-comunes}

### Error 1: "Invalid audience"

**Causa:** El CLIENT_ID del frontend no coincide con el del backend

**Solución:**
```typescript
// Asegurarse de usar el mismo CLIENT_ID
// Frontend
const CLIENT_ID = "123456-abc.apps.googleusercontent.com";

// Backend .env
GOOGLE_CLIENT_ID=123456-abc.apps.googleusercontent.com
```

### Error 2: "Redirect URI mismatch"

**Causa:** El URI de redirección no está autorizado en Google Console

**Solución:**
1. Ir a Google Cloud Console → Credenciales
2. Editar el OAuth 2.0 Client ID
3. Agregar EXACTAMENTE el URI que usas:
   ```
   http://localhost:3000/auth/callback
   https://tu-dominio.com/auth/callback
   ```

### Error 3: "Token expired"

**Causa:** El id_token tiene una vida corta (1 hora típicamente)

**Solución:**
```typescript
// Implementar refresh token
if (error.message.includes('expired')) {
  // Usar refresh_token para obtener nuevo access_token
  const newTokens = await googleClient.refreshToken(refreshToken);
}
```

### Error 4: "Email not verified"

**Causa:** El usuario no ha verificado su email en Google

**Solución:**
```typescript
if (!payload.email_verified) {
  return res.status(401).json({
    error: 'Por favor verifica tu email en Google primero'
  });
}
```

### Error 5: CORS errors

**Causa:** Configuración incorrecta de CORS

**Solución:**
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true, // Permitir cookies
}));
```

### Error 6: "User already exists"

**Causa:** Intentar crear usuario con email duplicado

**Solución:**
```typescript
// Usar UPSERT o verificar existencia
const result = await db.query(`
  INSERT INTO users (google_id, email, name)
  VALUES ($1, $2, $3)
  ON CONFLICT (google_id) DO UPDATE
  SET last_login = NOW()
  RETURNING *
`, [googleId, email, name]);
```

---

## 8. Checklist de Producción {#checklist-de-producción}

### Backend

- [ ] ✅ Validar id_token con google-auth-library
- [ ] ✅ Verificar audience, issuer, expiration
- [ ] ✅ Verificar que email_verified = true
- [ ] ✅ Usar google_id (sub) como identificador único
- [ ] ✅ CLIENT_SECRET solo en variables de entorno
- [ ] ✅ Generar JWT propio del sistema
- [ ] ✅ Configurar cookies httpOnly
- [ ] ✅ Usar HTTPS en producción
- [ ] ✅ Implementar rate limiting
- [ ] ✅ Logging de eventos de autenticación
- [ ] ✅ Manejo de errores robusto
- [ ] ✅ Validar CORS correctamente
- [ ] ✅ Índices en google_id en la base de datos

### Frontend

- [ ] ✅ No exponer CLIENT_SECRET
- [ ] ✅ Usar authorization code flow (no implicit flow)
- [ ] ✅ Manejar errores de autenticación
- [ ] ✅ Mostrar estados de carga
- [ ] ✅ Redirigir correctamente después de login
- [ ] ✅ Limpiar tokens al cerrar sesión
- [ ] ✅ Configurar URIs de redirección en Google Console

### Base de Datos

- [ ] ✅ Campo google_id UNIQUE y NOT NULL
- [ ] ✅ Campo email_verified
- [ ] ✅ Índices en google_id y email
- [ ] ✅ Campo auth_provider para multi-provider
- [ ] ✅ Timestamps (created_at, updated_at, last_login)
- [ ] ✅ Restricciones de integridad

### Seguridad

- [ ] ✅ HTTPS habilitado
- [ ] ✅ Tokens en httpOnly cookies
- [ ] ✅ CORS configurado correctamente
- [ ] ✅ Rate limiting en endpoints de auth
- [ ] ✅ Logging sin exponer datos sensibles
- [ ] ✅ Validación de todos los campos del payload
- [ ] ✅ Manejo seguro de errores (sin leak de info)

### Testing

- [ ] ✅ Probar con cuenta de Google real
- [ ] ✅ Probar en diferentes navegadores
- [ ] ✅ Probar en móvil
- [ ] ✅ Probar redirecciones
- [ ] ✅ Probar manejo de errores
- [ ] ✅ Probar con emails no verificados
- [ ] ✅ Probar logout

---

## 9. Recursos Adicionales

### Documentación Oficial

- [Google Identity - Get Started](https://developers.google.com/identity/gsi/web/guides/overview)
- [OAuth 2.0 for Web Apps](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Verify Google ID Token](https://developers.google.com/identity/sign-in/web/backend-auth)

### Librerías Recomendadas

**Node.js:**
- `google-auth-library` - Oficial de Google
- `@react-oauth/google` - React oficial
- `jsonwebtoken` - Para JWT propios
- `express-rate-limit` - Rate limiting

**Python:**
- `google-auth` - Oficial de Google
- `python-jose` - Para JWT
- `fastapi` - Framework moderno

### Herramientas de Testing

- [JWT.io](https://jwt.io/) - Decodificar y verificar JWT
- [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground/) - Probar flujos
- Postman - Probar endpoints

---

## 10. Conclusión

### Resumen del Flujo Seguro

```
1. Frontend → Click botón Google
2. Google → Usuario autentica y otorga permisos
3. Google → Retorna authorization_code (o id_token)
4. Frontend → Envía code al Backend
5. Backend → Intercambia code por tokens con Google
6. Backend → VALIDA id_token (firma, audience, issuer, exp)
7. Backend → Extrae google_id (sub) del payload
8. Backend → Busca/crea usuario en DB usando google_id
9. Backend → Genera JWT propio del sistema
10. Backend → Retorna JWT en httpOnly cookie
11. Frontend → Guarda sesión y redirecciona
```

### Principios Clave

1. **Nunca confiar en el frontend** - Toda validación crítica en backend
2. **Usar google_id (sub)** - No usar email como identificador único
3. **Validar siempre** - Verificar firma, audience, issuer, expiración
4. **HTTPS en producción** - Obligatorio para OAuth 2.0
5. **httpOnly cookies** - Más seguro que localStorage
6. **Rate limiting** - Prevenir ataques de fuerza bruta
7. **Logging sin exponer secretos** - Auditoría sin comprometer seguridad

---

**Autor:** Arquitecto de Software Senior
**Fecha:** 2026
**Versión:** 1.0.0
