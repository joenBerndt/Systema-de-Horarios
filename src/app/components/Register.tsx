import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { TeamMember, RoleType, EmploymentType, Specialty, Office } from "../types";
import { UserPlus, ArrowLeft, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";

interface RegisterProps {
  onRegister: (member: Omit<TeamMember, 'id'>) => void;
  onBack: () => void;
  offices: Office[];
  existingMembers: TeamMember[];
}

const roles: RoleType[] = [
  'Frontend Developer',
  'Backend Developer',
  'QA',
  'Designer',
  'Mobile Developer'
];

const employmentTypes: EmploymentType[] = [
  'Practicante',
  'Tesista',
  'Contratista',
  'Servicios Varios',
  'Voluntario'
];

const specialties: Specialty[] = [
  'React/Next.js',
  'Vue.js',
  'Angular',
  'Node.js',
  'Python/Django',
  'Java/Spring',
  '.NET',
  'PHP/Laravel',
  'Mobile iOS',
  'Mobile Android',
  'React Native',
  'Flutter',
  'UI/UX Design',
  'Graphic Design',
  'Automation Testing',
  'Manual Testing',
  'DevOps',
  'Cloud Architecture'
];

export function Register({ onRegister, onBack, offices, existingMembers }: RegisterProps) {
  const [formData, setFormData] = useState({
    name: '',
    role: '' as RoleType,
    employmentType: '' as EmploymentType,
    username: '',
    password: '',
    confirmPassword: '',
    email: '',
    phone: '',
    githubUsername: '',
    githubEmail: '',
    birthDate: '',
    age: 0,
    address: '',
    city: 'Lima',
    specialty: '' as Specialty,
    officeId: '',
    emergencyContact: '',
    emergencyPhone: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const calculateAge = (birthDate: string): number => {
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const handleBirthDateChange = (date: string) => {
    setFormData({ ...formData, birthDate: date, age: calculateAge(date) });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Información básica
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
    if (formData.name.trim().length < 3) newErrors.name = "El nombre debe tener al menos 3 caracteres";

    if (!formData.role) newErrors.role = "El rol es requerido";
    if (!formData.employmentType) newErrors.employmentType = "El tipo de empleo es requerido";
    if (!formData.specialty) newErrors.specialty = "La especialidad es requerida";

    // Credenciales
    if (!formData.username.trim()) {
      newErrors.username = "El usuario es requerido";
    } else if (formData.username.length < 4) {
      newErrors.username = "El usuario debe tener al menos 4 caracteres";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = "Solo letras, números y guiones bajos";
    } else if (existingMembers.some(m => m.username?.toLowerCase() === formData.username.toLowerCase())) {
      newErrors.username = "Este usuario ya está en uso";
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida";
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden";
    }

    // Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Email inválido";
    } else if (existingMembers.some(m => m.email.toLowerCase() === formData.email.toLowerCase())) {
      newErrors.email = "Este email ya está registrado";
    }

    // Teléfono
    const phoneRegex = /^\+?51\s?\d{3}\s?\d{3}\s?\d{3}$/;
    if (!formData.phone) {
      newErrors.phone = "El teléfono es requerido";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Formato: +51 987 654 321";
    }

    // GitHub email (opcional pero con formato)
    if (formData.githubEmail && !emailRegex.test(formData.githubEmail)) {
      newErrors.githubEmail = "Email de GitHub inválido";
    }

    // GitHub username (opcional pero con formato)
    const usernameRegex = /^[a-zA-Z0-9-]+$/;
    if (formData.githubUsername && !usernameRegex.test(formData.githubUsername)) {
      newErrors.githubUsername = "Usuario de GitHub inválido";
    }

    // Fecha de nacimiento
    if (!formData.birthDate) {
      newErrors.birthDate = "La fecha de nacimiento es requerida";
    } else {
      const age = calculateAge(formData.birthDate);
      if (age < 18) {
        newErrors.birthDate = "Debe ser mayor de 18 años";
      }
      if (age > 100) {
        newErrors.birthDate = "Fecha de nacimiento inválida";
      }
    }

    // Dirección
    if (!formData.address.trim()) {
      newErrors.address = "La dirección es requerida";
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "La dirección debe tener al menos 10 caracteres";
    }

    // Ciudad
    if (!formData.city.trim()) newErrors.city = "La ciudad es requerida";

    // Oficina
    if (!formData.officeId) newErrors.officeId = "La oficina es requerida";

    // Contacto de emergencia
    if (formData.emergencyPhone && !phoneRegex.test(formData.emergencyPhone)) {
      newErrors.emergencyPhone = "Formato: +51 987 654 321";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const newMember: Omit<TeamMember, 'id'> = {
      name: formData.name,
      role: formData.role,
      employmentType: formData.employmentType,
      username: formData.username,
      password: formData.password,
      hasAccess: true,
      email: formData.email,
      phone: formData.phone,
      githubEmail: formData.githubEmail || undefined,
      githubUsername: formData.githubUsername || undefined,
      birthDate: formData.birthDate,
      age: formData.age,
      address: formData.address,
      city: formData.city,
      specialty: formData.specialty,
      officeId: formData.officeId,
      joinDate: new Date().toISOString().split('T')[0],
      emergencyContact: formData.emergencyContact || undefined,
      emergencyPhone: formData.emergencyPhone || undefined
    };

    onRegister(newMember);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-3xl shadow-xl">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </div>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center mb-3">
              <UserPlus className="h-8 w-8 text-primary-foreground" />
            </div>
            <CardTitle className="text-3xl font-bold">Registro de Visitante</CardTitle>
            <CardDescription className="text-base">
              Completa el formulario para solicitar acceso al sistema
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Tu solicitud será revisada. Recibirás un correo cuando tu cuenta sea activada.
            </AlertDescription>
          </Alert>

          <ScrollArea className="max-h-[60vh]">
            <form onSubmit={handleSubmit} className="space-y-6 pr-4">
              <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="account">Cuenta</TabsTrigger>
                  <TabsTrigger value="personal">Personal</TabsTrigger>
                  <TabsTrigger value="professional">Profesional</TabsTrigger>
                  <TabsTrigger value="emergency">Emergencia</TabsTrigger>
                </TabsList>

                {/* Tab Cuenta */}
                <TabsContent value="account" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre Completo *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej: Juan Carlos Pérez García"
                      className={errors.name ? 'border-red-500' : ''}
                    />
                    {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="username">Usuario *</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="usuario123"
                      className={errors.username ? 'border-red-500' : ''}
                    />
                    {errors.username && <p className="text-xs text-red-500">{errors.username}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Contraseña *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                        className={errors.password ? 'border-red-500' : ''}
                      />
                      {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Contraseña *</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        placeholder="Repetir contraseña"
                        className={errors.confirmPassword ? 'border-red-500' : ''}
                      />
                      {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="usuario@ejemplo.com"
                      className={errors.email ? 'border-red-500' : ''}
                    />
                    {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+51 987 654 321"
                      className={errors.phone ? 'border-red-500' : ''}
                    />
                    {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
                  </div>
                </TabsContent>

                {/* Tab Personal */}
                <TabsContent value="personal" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => handleBirthDateChange(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className={errors.birthDate ? 'border-red-500' : ''}
                      />
                      {errors.birthDate && <p className="text-xs text-red-500">{errors.birthDate}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="age">Edad</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age || ''}
                        disabled
                        className="bg-muted"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Dirección Completa *</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Ej: Av. Arequipa 1234, Dpto 501"
                      className={errors.address ? 'border-red-500' : ''}
                    />
                    {errors.address && <p className="text-xs text-red-500">{errors.address}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Ciudad *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Ej: Lima"
                      className={errors.city ? 'border-red-500' : ''}
                    />
                    {errors.city && <p className="text-xs text-red-500">{errors.city}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="githubUsername">Usuario de GitHub</Label>
                    <Input
                      id="githubUsername"
                      value={formData.githubUsername}
                      onChange={(e) => setFormData({ ...formData, githubUsername: e.target.value })}
                      placeholder="usuario-github"
                      className={errors.githubUsername ? 'border-red-500' : ''}
                    />
                    {errors.githubUsername && <p className="text-xs text-red-500">{errors.githubUsername}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="githubEmail">Email de GitHub</Label>
                    <Input
                      id="githubEmail"
                      type="email"
                      value={formData.githubEmail}
                      onChange={(e) => setFormData({ ...formData, githubEmail: e.target.value })}
                      placeholder="usuario@github.com"
                      className={errors.githubEmail ? 'border-red-500' : ''}
                    />
                    {errors.githubEmail && <p className="text-xs text-red-500">{errors.githubEmail}</p>}
                  </div>
                </TabsContent>

                {/* Tab Profesional */}
                <TabsContent value="professional" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Rol *</Label>
                    <Select value={formData.role} onValueChange={(value: RoleType) => setFormData({ ...formData, role: value })}>
                      <SelectTrigger className={errors.role ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecciona tu rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.role && <p className="text-xs text-red-500">{errors.role}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="employmentType">Tipo de Empleo *</Label>
                    <Select value={formData.employmentType} onValueChange={(value: EmploymentType) => setFormData({ ...formData, employmentType: value })}>
                      <SelectTrigger className={errors.employmentType ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecciona tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {employmentTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.employmentType && <p className="text-xs text-red-500">{errors.employmentType}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="specialty">Especialidad *</Label>
                    <Select value={formData.specialty} onValueChange={(value: Specialty) => setFormData({ ...formData, specialty: value })}>
                      <SelectTrigger className={errors.specialty ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecciona especialidad" />
                      </SelectTrigger>
                      <SelectContent>
                        {specialties.map(spec => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.specialty && <p className="text-xs text-red-500">{errors.specialty}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="office">Oficina Preferida *</Label>
                    <Select value={formData.officeId} onValueChange={(value) => setFormData({ ...formData, officeId: value })}>
                      <SelectTrigger className={errors.officeId ? 'border-red-500' : ''}>
                        <SelectValue placeholder="Selecciona una oficina" />
                      </SelectTrigger>
                      <SelectContent>
                        {offices.map(office => (
                          <SelectItem key={office.id} value={office.id}>
                            {office.name} - {office.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.officeId && <p className="text-xs text-red-500">{errors.officeId}</p>}
                  </div>
                </TabsContent>

                {/* Tab Emergencia */}
                <TabsContent value="emergency" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergencyContact">Contacto de Emergencia</Label>
                    <Input
                      id="emergencyContact"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                      placeholder="Nombre del contacto"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="emergencyPhone">Teléfono de Emergencia</Label>
                    <Input
                      id="emergencyPhone"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                      placeholder="+51 987 654 321"
                      className={errors.emergencyPhone ? 'border-red-500' : ''}
                    />
                    {errors.emergencyPhone && <p className="text-xs text-red-500">{errors.emergencyPhone}</p>}
                  </div>

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      La información de emergencia es opcional pero muy recomendable para tu seguridad.
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>

              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                  Cancelar
                </Button>
                <Button type="submit" className="flex-1">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Registrarse
                </Button>
              </div>
            </form>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
