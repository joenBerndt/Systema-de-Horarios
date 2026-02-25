import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { User, TeamMember } from "../types";
import { LogIn, Lock, UserCircle, AlertCircle, UserPlus } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { motion } from "motion/react";
import { Separator } from "./ui/separator";
import { useGoogleLogin } from '@react-oauth/google';

interface LoginProps {
  onLogin: (user: User) => void;
  onMemberLogin: (member: TeamMember) => void;
  onGoogleLogin: (googleData: { email: string; name: string; picture?: string }) => void;
  onShowRegister: () => void;
  users: User[];
  members: TeamMember[];
}

export function Login({ onLogin, onMemberLogin, onGoogleLogin, onShowRegister, users, members }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Por favor completa todos los campos');
      return;
    }

    // Primero buscar en usuarios administradores
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
      onLogin(user);
      return;
    }

    // Luego buscar en miembros con acceso
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
    setPassword('');
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setIsLoading(true);
      try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const userInfo = await response.json();

        onGoogleLogin({
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        });
      } catch (err) {
        console.error('Error fetching Google user info:', err);
        setError('Error al obtener la información de Google');
      } finally {
        setIsLoading(false);
      }
    },
    onError: (error) => {
      console.error('Google Login Error:', error);
      setError('Fallo al iniciar sesión con Google');
    }
  });

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="space-y-3 text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold">Sistema de Gestión</CardTitle>
            <CardDescription className="text-base">
              Ingresa tus credenciales para acceder
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Usuario</Label>
                <div className="relative">
                  <UserCircle className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    className="pl-10"
                    autoComplete="username"
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
                    placeholder="Ingresa tu contraseña"
                    className="pl-10"
                    autoComplete="current-password"
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

            {/* Google Login Button */}
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                type="button"
                variant="outline"
                className="w-full border-2 hover:bg-accent"
                size="lg"
                onClick={() => googleLogin()}
                disabled={isLoading}
              >
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
                {isLoading ? 'Conectando...' : 'Continuar con Google'}
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

            <div className="mt-6 pt-6 border-t">
              <p className="text-sm font-medium text-center mb-3">Usuarios de prueba:</p>
              <div className="space-y-2 text-xs">
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-semibold text-red-600">Admin Master</p>
                  <p className="text-muted-foreground">Usuario: <span className="font-mono">admin-master</span></p>
                  <p className="text-muted-foreground">Contraseña: <span className="font-mono">master123</span></p>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-semibold text-blue-600">Admin</p>
                  <p className="text-muted-foreground">Usuario: <span className="font-mono">admin</span></p>
                  <p className="text-muted-foreground">Contraseña: <span className="font-mono">admin123</span></p>
                </div>
                <div className="bg-muted p-3 rounded-md">
                  <p className="font-semibold text-green-600">Miembro (ejemplo)</p>
                  <p className="text-muted-foreground">Usuario: <span className="font-mono">cmendoza</span></p>
                  <p className="text-muted-foreground">Contraseña: <span className="font-mono">frontend123</span></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}