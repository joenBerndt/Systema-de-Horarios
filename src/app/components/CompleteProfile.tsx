import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { TeamMember, Office } from "../types";
import { User, Briefcase, Phone, MapPin, Github, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Alert, AlertDescription } from "./ui/alert";
import { Progress } from "./ui/progress";

interface CompleteProfileProps {
  googleData: {
    email: string;
    name: string;
    picture?: string;
  };
  offices: Office[];
  onComplete: (memberData: Omit<TeamMember, 'id'>) => void;
}

export function CompleteProfile({ googleData, offices, onComplete }: CompleteProfileProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 2;

  // Formulario data
  const [birthDate, setBirthDate] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [officeId, setOfficeId] = useState('');
  const [githubUsername, setGithubUsername] = useState('');

  // Default office to Gescon if available
  useEffect(() => {
    if (!officeId && offices.length > 0) {
      const gesconOffice = offices.find(o => o.name.toLowerCase().includes('gescon'));
      if (gesconOffice) {
        setOfficeId(gesconOffice.id);
      } else {
        setOfficeId(offices[0].id); // Fallback to first
      }
    }
  }, [offices, officeId]);

  const roles = [
    'Frontend Developer',
    'Backend Developer',
    'Full Stack Developer',
    'UI/UX Designer',
    'QA Engineer',
    'DevOps Engineer',
    'Scrum Master',
    'Product Owner',
    'Tech Lead'
  ];

  const employmentTypes = [
    'Empleado Full-time',
    'Empleado Part-time',
    'Freelancer',
    'Contractor',
    'Visitante Externo'
  ];

  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = () => {
    // Calcular edad real
    let calculatedAge = 0;
    if (birthDate) {
      const today = new Date();
      const birth = new Date(birthDate);
      calculatedAge = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        calculatedAge--;
      }
    }

    const memberData: Omit<TeamMember, 'id'> = {
      name: googleData.name,
      email: googleData.email,
      age: calculatedAge,
      city,
      phone,
      role: role as TeamMember['role'],
      specialty: specialty as TeamMember['specialty'],
      employmentType: employmentType as TeamMember['employmentType'],
      officeId: officeId || undefined,
      githubUsername: githubUsername || undefined,
      birthDate: birthDate,
      address: '',
      joinDate: new Date().toISOString().split('T')[0],
      hasAccess: true,
      username: googleData.email.split('@')[0],
      password: Math.random().toString(36).slice(-8), // Contraseña temporal
    };
    onComplete(memberData);
  };

  const canProceedStep1 = birthDate && city && phone;
  const canProceedStep2 = role && specialty && employmentType && officeId;
  const canComplete = canProceedStep1 && canProceedStep2;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="w-full max-w-2xl relative my-auto z-[101]"
      >
        <Card className="shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="mx-auto"
            >
              {googleData.picture ? (
                <img
                  src={googleData.picture}
                  alt={googleData.name}
                  className="w-20 h-20 rounded-full border-4 border-primary mx-auto"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center mx-auto">
                  <User className="h-10 w-10 text-primary-foreground" />
                </div>
              )}
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-bold">¡Bienvenido, {googleData.name.split(' ')[0]}!</CardTitle>
              <CardDescription className="text-base mt-2">
                Completa tu perfil para acceder al sistema
              </CardDescription>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Paso {step} de {totalSteps}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                Hemos sincronizado tus datos de Google. Completa los campos restantes para finalizar.
              </AlertDescription>
            </Alert>

            <AnimatePresence mode="wait">
              {/* Step 1: Información Personal */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Información Personal
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre (Desde Google)</Label>
                      <Input id="name" type="text" value={googleData.name} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email (Desde Google)</Label>
                      <Input id="email" type="email" value={googleData.email} disabled className="bg-muted" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="birthDate">Fecha de Nacimiento *</Label>
                      <Input
                        id="birthDate"
                        type="date"
                        value={birthDate}
                        onChange={(e) => setBirthDate(e.target.value)}
                        max={new Date().toISOString().split("T")[0]}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">Ciudad *</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="city"
                          type="text"
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          placeholder="Ciudad de México"
                          className="pl-10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Teléfono *</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+52 55 1234 5678"
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Step 2: Información Profesional */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Información Profesional y Empleo
                  </h3>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="role">Rol / Posición *</Label>
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tu rol" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="specialty">Especialidad *</Label>
                      <Input
                        id="specialty"
                        type="text"
                        value={specialty}
                        onChange={(e) => setSpecialty(e.target.value)}
                        placeholder="Ej: React, UI/UX..."
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="employmentType">Tipo de Empleo *</Label>
                      <Select value={employmentType} onValueChange={setEmploymentType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona tipo" />
                        </SelectTrigger>
                        <SelectContent>
                          {employmentTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="office">Oficina Asignada *</Label>
                      <Select value={officeId} onValueChange={setOfficeId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona sede" />
                        </SelectTrigger>
                        <SelectContent>
                          {offices.map((office) => (
                            <SelectItem key={office.id} value={office.id}>
                              {office.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="github">Usuario de GitHub (opcional)</Label>
                    <div className="relative">
                      <Github className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="github"
                        type="text"
                        value={githubUsername}
                        onChange={(e) => setGithubUsername(e.target.value)}
                        placeholder="tu-usuario"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation Buttons */}
            <div className="flex gap-3 pt-4">
              {step > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                >
                  Atrás
                </Button>
              )}
              {step < totalSteps ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1"
                  disabled={step === 1 && !canProceedStep1}
                >
                  Siguiente
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!canComplete}
                >
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Completar Perfil
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
