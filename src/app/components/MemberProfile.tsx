import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { TeamMember, Office } from "../types";
import { User, Mail, Phone, Github, MapPin, Calendar, Briefcase, Edit, Save, X } from "lucide-react";
import { Badge } from "./ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { AnimatedContainer, StaggerContainer, StaggerItem } from "./ui/animated-container";

interface MemberProfileProps {
  member: TeamMember;
  office?: Office;
  onUpdateMember: (id: string, data: Partial<TeamMember>) => void;
}

export function MemberProfile({ member, office, onUpdateMember }: MemberProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    email: member.email,
    phone: member.phone || '',
    github: member.github || '',
    emergencyContact: member.emergencyContact || '',
    emergencyPhone: member.emergencyPhone || ''
  });

  const handleSave = () => {
    onUpdateMember(member.id, formData);
    setIsEditing(false);
    toast.success("Perfil actualizado", {
      description: "Tus datos han sido actualizados correctamente"
    });
  };

  const handleCancel = () => {
    setFormData({
      email: member.email,
      phone: member.phone || '',
      github: member.github || '',
      emergencyContact: member.emergencyContact || '',
      emergencyPhone: member.emergencyPhone || ''
    });
    setIsEditing(false);
  };

  const getEmploymentBadgeVariant = (type: string) => {
    switch(type) {
      case 'Empleado Full-time': return 'default';
      case 'Empleado Part-time': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <AnimatedContainer>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Mi Perfil</h2>
            <p className="text-muted-foreground">
              Administra tu información personal
            </p>
          </div>
          
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Perfil
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Guardar Cambios
              </Button>
            </div>
          )}
        </div>

        <StaggerContainer className="grid gap-6 md:grid-cols-2">
          {/* Información Personal */}
          <StaggerItem>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información Personal
                  </CardTitle>
                  <CardDescription>Datos básicos de tu perfil</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Nombre Completo</Label>
                    <p className="font-medium">{member.name}</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Rol</Label>
                    <Badge variant="secondary">{member.role}</Badge>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Tipo de Empleo</Label>
                    <Badge variant={getEmploymentBadgeVariant(member.employmentType)}>
                      {member.employmentType}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 inline mr-1" />
                      Fecha de Ingreso
                    </Label>
                    <p className="text-sm">
                      {new Date(member.joinDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  {member.specialty && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground">
                        <Briefcase className="h-3 w-3 inline mr-1" />
                        Especialidad
                      </Label>
                      <Badge variant="outline">{member.specialty}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          {/* Información de Contacto */}
          <StaggerItem>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Información de Contacto
                  </CardTitle>
                  <CardDescription>
                    {isEditing ? 'Actualiza tu información de contacto' : 'Tus datos de contacto'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div
                        key="editing"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="email">
                            <Mail className="h-3 w-3 inline mr-1" />
                            Correo Electrónico
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">
                            <Phone className="h-3 w-3 inline mr-1" />
                            Teléfono
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+51 999 999 999"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="github">
                            <Github className="h-3 w-3 inline mr-1" />
                            GitHub Username
                          </Label>
                          <Input
                            id="github"
                            value={formData.github}
                            onChange={(e) => setFormData({ ...formData, github: e.target.value })}
                            placeholder="@username"
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="viewing"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label className="text-xs text-muted-foreground">
                            <Mail className="h-3 w-3 inline mr-1" />
                            Correo Electrónico
                          </Label>
                          <p className="font-medium">{member.email}</p>
                        </div>

                        {member.phone && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              <Phone className="h-3 w-3 inline mr-1" />
                              Teléfono
                            </Label>
                            <p className="font-medium">{member.phone}</p>
                          </div>
                        )}

                        {member.github && (
                          <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                              <Github className="h-3 w-3 inline mr-1" />
                              GitHub
                            </Label>
                            <p className="font-medium">{member.github}</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          {/* Información de Ubicación */}
          <StaggerItem>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Ubicación de Trabajo
                  </CardTitle>
                  <CardDescription>Oficina asignada</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {office ? (
                    <>
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">Oficina</Label>
                        <p className="font-medium">{office.name}</p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          Dirección
                        </Label>
                        <p className="text-sm">{office.location}</p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No tienes una oficina asignada
                    </p>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          {/* Contacto de Emergencia */}
          <StaggerItem>
            <motion.div
              whileHover={{ scale: 1.02 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Contacto de Emergencia
                  </CardTitle>
                  <CardDescription>
                    {isEditing ? 'Actualiza tu contacto de emergencia' : 'Información de emergencia'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AnimatePresence mode="wait">
                    {isEditing ? (
                      <motion.div
                        key="editing"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className="space-y-4"
                      >
                        <div className="space-y-2">
                          <Label htmlFor="emergencyContact">
                            <User className="h-3 w-3 inline mr-1" />
                            Nombre del Contacto
                          </Label>
                          <Input
                            id="emergencyContact"
                            value={formData.emergencyContact}
                            onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                            placeholder="Nombre completo"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="emergencyPhone">
                            <Phone className="h-3 w-3 inline mr-1" />
                            Teléfono de Emergencia
                          </Label>
                          <Input
                            id="emergencyPhone"
                            type="tel"
                            value={formData.emergencyPhone}
                            onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                            placeholder="+51 999 999 999"
                          />
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="viewing"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                      >
                        {member.emergencyContact ? (
                          <>
                            <div className="space-y-2">
                              <Label className="text-xs text-muted-foreground">
                                <User className="h-3 w-3 inline mr-1" />
                                Nombre del Contacto
                              </Label>
                              <p className="font-medium">{member.emergencyContact}</p>
                            </div>

                            {member.emergencyPhone && (
                              <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                  <Phone className="h-3 w-3 inline mr-1" />
                                  Teléfono de Emergencia
                                </Label>
                                <p className="font-medium">{member.emergencyPhone}</p>
                              </div>
                            )}
                          </>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            No has configurado un contacto de emergencia
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>
      </div>
    </AnimatedContainer>
  );
}
