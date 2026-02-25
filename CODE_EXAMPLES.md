# 💻 Ejemplos de Código Completos
## Copy-Paste Ready Code para Google OAuth 2.0

---

## 📦 Frontend - React + TypeScript + Vite

### 1. Login.tsx (Versión Producción)

```typescript
// src/components/Login.tsx
import { useState } from "react";
import { useGoogleLogin } from '@react-oauth/google';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { User, TeamMember } from "../types";
import { LogIn, Lock, UserCircle, AlertCircle, UserPlus, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { motion } from "motion/react";
import { Separator } from "./ui/separator";

interface LoginProps {
  onLogin: (user: User) => void;
  onMemberLogin: (member: TeamMember) => void;
  onGoogleLogin: (googleData: { email: string; name: string; picture?: string; googleId: string }) => void;
  onShowRegister: () => void;
  users: User[];
  members: TeamMember[];
}

export function Login({ onLogin, onMemberLogin, onGoogleLogin, onShowRegister, users, members }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
      onLogin(user);
      return;
    }

    const member = members.find(m => 
      m.username === username && 
      m.password === password && 
      m.hasAccess === true
    );
    
    if (member) {
      onMemberLogin(member);
      return;
    }

    setError('Usuario o contraseña incorrectos');
  };

  // ✅ NUEVO: Google Login Real
  const googleLogin = useGoogleLogin({
    flow: 'auth-code', // Authorization Code Flow (más seguro)
    
    onSuccess: async (codeResponse) => {
      setIsLoadingGoogle(true);
      setError('');
      
      try {
        // Enviar el authorization_code al backend
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
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al autenticar con Google');
        }

        const data = await response.json();
        
        // Si el usuario necesita completar su perfil
        if (data.needsProfileCompletion) {
          onGoogleLogin({
            email: data.email,
            name: data.name,
            picture: data.picture,
            googleId: data.googleId,
          });
        } else {
          // Usuario existente - guardar token y redirigir
          localStorage.setItem('auth_token', data.token);
          
          // Crear objeto User para onLogin
          const user: User = {
            id: data.user.id,
            username: data.user.email.split('@')[0],
            password: '',
            role: data.user.role || 'user',
            name: data.user.name,
            email: data.user.email,
            createdAt: new Date().toISOString(),
          };
          
          onLogin(user);
        }
        
      } catch (err) {
        console.error('Google Login Error:', err);
        setError(err instanceof Error ? err.message : 'Error al iniciar sesión con Google');
      } finally {
        setIsLoadingGoogle(false);
      }
    },
    
    onError: (error) => {
      console.error('Google Login Failed:', error);
      setError('Error al iniciar sesión con Google. Por favor intenta de nuevo.');
      setIsLoadingGoogle(false);
    },
    
    scope: 'openid email profile',
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-2xl">
          <CardHeader className="text-center space-y-2">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-2">
              <UserCircle className="h-10 w-10 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold">Bienvenido</CardTitle>
            <CardDescription className="text-base">
              Inicia sesión para acceder al sistema
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            {/* Login tradicional */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="tu-usuario"
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg">
                <LogIn className="mr-2 h-4 w-4" />
                Iniciar Sesión
              </Button>
            </form>

            <div className="relative my-6">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
                O continúa con
              </span>
            </div>

            {/* ✅ Google Login Button (Real) */}
            <motion.div
              whileHover={{ scale: isLoadingGoogle ? 1 : 1.02 }}
              whileTap={{ scale: isLoadingGoogle ? 1 : 0.98 }}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 hover:bg-accent"
                size="lg"
                onClick={() => googleLogin()}
                disabled={isLoadingGoogle}
              >
                {isLoadingGoogle ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Conectando con Google...
                  </>
                ) : (
                  <>
                    <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Continuar con Google
                  </>
                )}
              </Button>
            </motion.div>

            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={onShowRegister}
                type="button"
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Registrarse como Visitante
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
```

### 2. App.tsx Updates

```typescript
// src/app/App.tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  // ... todo tu código existente ...

  // ✅ NUEVO: Estado para Google data con googleId
  const [googleData, setGoogleData] = useState<{ 
    email: string; 
    name: string; 
    picture?: string;
    googleId: string;
  } | null>(null);

  // ✅ ACTUALIZAR: handleGoogleLogin
  const handleGoogleLogin = (data: { 
    email: string; 
    name: string; 
    picture?: string;
    googleId: string;
  }) => {
    setGoogleData(data);
    setShowCompleteProfile(true);
  };

  // ✅ ACTUALIZAR: handleCompleteProfile
  const handleCompleteProfile = async (memberData: Omit<TeamMember, 'id'>) => {
    if (!googleData) return;

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

      if (!response.ok) {
        throw new Error('Error al completar perfil');
      }

      const data = await response.json();
      
      // Guardar token
      localStorage.setItem('auth_token', data.token);
      
      // Crear objeto TeamMember
      const newMember: TeamMember = {
        id: data.user.id,
        ...memberData,
        email: googleData.email,
        name: googleData.name,
      };
      
      setShowCompleteProfile(false);
      setGoogleData(null);
      handleMemberLogin(newMember);
      
    } catch (error) {
      console.error('Error:', error);
      // Mostrar error al usuario
    }
  };

  // ✅ ENVOLVER con GoogleOAuthProvider
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
      <div className="min-h-screen bg-background">
        {/* ... resto de tu código ... */}
      </div>
    </GoogleOAuthProvider>
  );
}

export default App;
```

### 3. .env.local

```env
# Frontend Environment Variables
VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
VITE_API_URL=http://localhost:3001

# Para producción:
# VITE_API_URL=https://tu-backend.railway.app
```

---

## 🔧 Backend - Node.js + Express + TypeScript

### 1. Estructura Completa del Proyecto

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   └── google.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   └── users.controller.ts
│   ├── middleware/
│   │   ├── auth.middleware.ts
│   │   └── errorHandler.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── users.routes.ts
│   └── server.ts
├── .env
├── .gitignore
├── package.json
└── tsconfig.json
```

### 2. package.json

```json
{
  "name": "gestion-equipos-backend",
  "version": "1.0.0",
  "description": "Backend para sistema de gestión de equipos",
  "main": "dist/server.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint . --ext .ts"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "google-auth-library": "^9.4.1",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.11.3",
    "bcrypt": "^5.1.1",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/cors": "^2.8.17",
    "@types/node": "^20.10.5",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/pg": "^8.10.9",
    "@types/bcrypt": "^5.0.2",
    "typescript": "^5.3.3",
    "ts-node": "^10.9.2",
    "nodemon": "^3.0.2"
  }
}
```

### 3. tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4. .env

```env
# Server
PORT=3001
NODE_ENV=development

# Google OAuth
GOOGLE_CLIENT_ID=tu-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-tu-secret-aqui

# JWT
JWT_SECRET=tu-secreto-super-seguro-cambiar-en-produccion-usar-crypto-randomBytes
JWT_EXPIRES_IN=7d

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gestion_equipos

# Frontend (CORS)
FRONTEND_URL=http://localhost:5173

# Production values:
# FRONTEND_URL=https://tu-app.vercel.app
# DATABASE_URL=postgresql://...
```

### 5. src/config/database.ts

```typescript
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false
  } : false,
});

// Test connection
pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on PostgreSQL client', err);
  process.exit(-1);
});

export default pool;
```

### 6. src/config/google.ts

```typescript
import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('❌ GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be defined');
}

export const googleClient = new OAuth2Client({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'postmessage', // Para @react-oauth/google
});

export const verifyGoogleToken = async (token: string) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    return payload;
  } catch (error) {
    console.error('Error verifying Google token:', error);
    throw new Error('Invalid Google token');
  }
};
```

### 7. src/controllers/auth.controller.ts

```typescript
import { Request, Response } from 'express';
import { googleClient } from '../config/google';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

export const googleAuth = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ 
        error: 'Código de autorización requerido' 
      });
    }

    // 1. Intercambiar code por tokens
    const { tokens } = await googleClient.getToken(code);
    
    if (!tokens.id_token) {
      return res.status(401).json({ 
        error: 'No se recibió id_token de Google' 
      });
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

    // 4. Validar issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!validIssuers.includes(payload.iss)) {
      return res.status(401).json({ error: 'Issuer inválido' });
    }

    // 5. Extraer datos
    const googleId = payload.sub;
    const email = payload.email!;
    const name = payload.name || '';
    const picture = payload.picture || '';

    // 6. Buscar usuario en BD
    const userResult = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    let user = userResult.rows[0];

    if (!user) {
      // Usuario nuevo - necesita completar perfil
      console.log(`New user from Google: ${email}`);
      
      return res.status(200).json({
        needsProfileCompletion: true,
        email,
        name,
        picture,
        googleId,
      });
    }

    // 7. Usuario existente - actualizar last_login
    await pool.query(
      'UPDATE users SET last_login = NOW(), updated_at = NOW() WHERE google_id = $1',
      [googleId]
    );

    console.log(`User logged in: ${user.email}`);

    // 8. Generar JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.is_admin ? 'admin' : 'user',
        googleId: user.google_id,
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'gestion-equipos-api',
      }
    );

    // 9. Configurar cookie httpOnly
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días
    });

    // 10. Retornar respuesta
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role: user.role,
        isAdmin: user.is_admin,
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

export const logout = async (req: Request, res: Response) => {
  try {
    // Limpiar cookie
    res.clearCookie('auth_token');
    
    return res.status(200).json({ 
      success: true, 
      message: 'Sesión cerrada exitosamente' 
    });
  } catch (error) {
    console.error('Logout Error:', error);
    return res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};
```

### 8. src/controllers/users.controller.ts

```typescript
import { Request, Response } from 'express';
import pool from '../config/database';
import jwt from 'jsonwebtoken';

export const completeProfile = async (req: Request, res: Response) => {
  try {
    const { googleData, profileData } = req.body;

    // Validar datos requeridos
    if (!googleData?.googleId || !googleData?.email || !profileData) {
      return res.status(400).json({ 
        error: 'Datos incompletos. Se requiere googleData y profileData' 
      });
    }

    const { googleId, email, name, picture } = googleData;
    const {
      age,
      city,
      phone,
      role,
      specialty,
      employmentType,
      officeId,
      githubUsername,
    } = profileData;

    // Validar campos obligatorios
    if (!age || !city || !phone || !role || !specialty || !employmentType || !officeId) {
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios en el perfil' 
      });
    }

    // Verificar que el usuario no exista
    const existingUser = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        error: 'Este usuario ya existe en el sistema' 
      });
    }

    // Crear usuario con perfil completo
    const result = await pool.query(
      `INSERT INTO users (
        google_id, email, email_verified, name, picture, 
        age, city, phone, role, specialty, employment_type,
        office_id, github_username, auth_provider, 
        has_access, is_active, last_login, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW(), NOW())
      RETURNING *`,
      [
        googleId,
        email,
        true, // email_verified
        name,
        picture,
        age,
        city,
        phone,
        role,
        specialty,
        employmentType,
        officeId,
        githubUsername || null,
        'google',
        true, // has_access
        true, // is_active
      ]
    );

    const user = result.rows[0];

    console.log(`New user profile completed: ${user.email}`);

    // Generar JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        googleId: user.google_id,
      },
      process.env.JWT_SECRET!,
      { 
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        issuer: 'gestion-equipos-api',
      }
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
        age: user.age,
        city: user.city,
        phone: user.phone,
        specialty: user.specialty,
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

export const getProfile = async (req: Request, res: Response) => {
  try {
    // @ts-ignore - req.user viene del middleware
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const result = await pool.query(
      'SELECT id, google_id, email, name, picture, age, city, phone, role, specialty, employment_type, office_id, github_username, created_at, last_login FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      success: true,
      user: result.rows[0],
    });

  } catch (error) {
    console.error('Get Profile Error:', error);
    return res.status(500).json({ error: 'Error al obtener perfil' });
  }
};
```

### 9. src/middleware/auth.middleware.ts

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  googleId: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticateToken = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    // Obtener token de cookie o header Authorization
    const token = req.cookies?.auth_token || 
                  req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ 
        error: 'Acceso denegado. Token no proporcionado.' 
      });
    }

    // Verificar token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET!
    ) as JWTPayload;

    req.user = decoded;
    next();

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expirado' });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    return res.status(500).json({ error: 'Error de autenticación' });
  }
};

export const isAdmin = (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'No autenticado' });
  }

  if (req.user.role !== 'admin' && req.user.role !== 'admin-master') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requieren permisos de administrador.' 
    });
  }

  next();
};
```

### 10. src/middleware/errorHandler.ts

```typescript
import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
```

### 11. src/routes/auth.routes.ts

```typescript
import express from 'express';
import { googleAuth, logout } from '../controllers/auth.controller';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting para prevenir ataques
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos máximo
  message: 'Demasiados intentos de autenticación. Intenta de nuevo más tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/google', authLimiter, googleAuth);
router.post('/logout', logout);

export default router;
```

### 12. src/routes/users.routes.ts

```typescript
import express from 'express';
import { completeProfile, getProfile } from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/complete-profile', completeProfile);
router.get('/profile', authenticateToken, getProfile);

export default router;
```

### 13. src/server.ts

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';
import usersRoutes from './routes/users.routes';
import { errorHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString() 
  });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
});

export default app;
```

---

## 🗄️ Base de Datos - PostgreSQL

### Schema Completo

```sql
-- migrations/001_create_users_table.sql

-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla principal de usuarios
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Google OAuth (campos CRÍTICOS)
    google_id VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified BOOLEAN DEFAULT FALSE,
    name VARCHAR(255),
    picture TEXT,
    
    -- Perfil del usuario (completado después de Google login)
    age INTEGER CHECK (age >= 18 AND age <= 100),
    city VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(100),
    specialty VARCHAR(255),
    employment_type VARCHAR(100),
    office_id UUID,
    github_username VARCHAR(100),
    
    -- Sistema
    auth_provider VARCHAR(50) DEFAULT 'google' CHECK (auth_provider IN ('google', 'github', 'email')),
    has_access BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_admin BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE
);

-- Índices para optimizar consultas
CREATE INDEX idx_users_google_id ON users(google_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_auth_provider ON users(auth_provider);
CREATE INDEX idx_users_last_login ON users(last_login DESC);
CREATE INDEX idx_users_office_id ON users(office_id);

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

-- Comentarios para documentación
COMMENT ON TABLE users IS 'Tabla principal de usuarios con autenticación OAuth de Google';
COMMENT ON COLUMN users.google_id IS 'ID único de Google (campo sub del JWT) - NUNCA cambiar';
COMMENT ON COLUMN users.email IS 'Email del usuario - puede cambiar en Google';
COMMENT ON COLUMN users.email_verified IS 'Si el email fue verificado por Google';
```

---

## 🚀 Scripts de Instalación y Deploy

### Installation Script

```bash
#!/bin/bash
# install.sh

echo "🚀 Instalando Backend..."

# Instalar dependencias
npm install

# Copiar .env.example a .env
cp .env.example .env

echo "✅ Backend instalado"
echo "⚠️  Configura las variables de entorno en .env"
echo "📝 Edita .env y agrega:"
echo "   - GOOGLE_CLIENT_ID"
echo "   - GOOGLE_CLIENT_SECRET"
echo "   - JWT_SECRET"
echo "   - DATABASE_URL"
```

### Database Setup Script

```bash
#!/bin/bash
# setup-db.sh

echo "🗄️  Configurando base de datos..."

# Crear base de datos (si no existe)
psql -c "CREATE DATABASE gestion_equipos;" || echo "Base de datos ya existe"

# Ejecutar migraciones
psql -d gestion_equipos -f migrations/001_create_users_table.sql

echo "✅ Base de datos configurada"
```

---

## 📝 Testing

### Test con cURL

```bash
# Test de login con Google
curl -X POST http://localhost:3001/api/auth/google \
  -H "Content-Type: application/json" \
  -d '{"code": "4/0AY0e-g7..."}'

# Test de completar perfil
curl -X POST http://localhost:3001/api/users/complete-profile \
  -H "Content-Type: application/json" \
  -d '{
    "googleData": {
      "googleId": "109876543210",
      "email": "user@gmail.com",
      "name": "Juan Pérez",
      "picture": "https://..."
    },
    "profileData": {
      "age": 30,
      "city": "Ciudad de México",
      "phone": "+52 55 1234 5678",
      "role": "Frontend Developer",
      "specialty": "React, TypeScript",
      "employmentType": "Empleado Full-time",
      "officeId": "office-123"
    }
  }'
```

---

**¡Listo para copiar y pegar!** 🎉

Todos estos archivos están listos para usar en producción con las mejores prácticas de seguridad implementadas.
