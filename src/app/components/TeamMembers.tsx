import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Badge } from "./ui/badge";
import { Plus, Search, Trash2, Edit, AlertCircle, Eye, Phone, Mail, Github, MapPin, Calendar as CalendarIcon, Briefcase } from "lucide-react";
import { TeamMember, RoleType, Office, EmploymentType, Specialty } from "../types";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { ConfirmationDialog } from "./ui/confirmation-dialog";

interface TeamMembersProps {
  members: TeamMember[];
  offices: Office[];
  onAddMember: (member: Omit<TeamMember, 'id'>) => void;
  onUpdateMember: (id: string, member: Partial<TeamMember>) => void;
  onDeleteMember: (id: string) => void;
}

const roles: RoleType[] = [
  'Frontend Developer',
  'Backend Developer',
  'QA',
  'Designer',
  'Mobile Developer',
  'Frontend Lead',
  'Backend Lead',
  'QA Lead',
  'Design Lead',
  'Scrum Master',
  'Product Owner'
];

const employmentTypes: EmploymentType[] = [
  'Empleado Full-time',
  'Empleado Part-time',
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

export function TeamMembers({ members, offices, onAddMember, onUpdateMember, onDeleteMember }: TeamMembersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [viewingMember, setViewingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '' as RoleType,
    employmentType: '' as EmploymentType,
    email: '',
    phone: '',
    githubEmail: '',
    githubUsername: '',
    birthDate: '',
    age: 0,
    address: '',
    city: 'Lima',
    specialty: '' as Specialty,
    officeId: '',
    joinDate: new Date().toISOString().split('T')[0],
    emergencyContact: '',
    emergencyPhone: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const filteredMembers = members.filter(member =>
    member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.employmentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.specialty.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validaciones requeridas
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
    if (formData.name.trim().length < 3) newErrors.name = "El nombre debe tener al menos 3 caracteres";

    if (!formData.role) newErrors.role = "El rol es requerido";
    if (!formData.employmentType) newErrors.employmentType = "El tipo de empleo es requerido";
    if (!formData.specialty) newErrors.specialty = "La especialidad es requerida";

    // Validación de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) {
      newErrors.email = "El email es requerido";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Email inválido";
    }

    // Validación de teléfono
    const phoneRegex = /^\+?51\s?\d{3}\s?\d{3}\s?\d{3}$/;
    if (!formData.phone) {
      newErrors.phone = "El teléfono es requerido";
    } else if (!phoneRegex.test(formData.phone)) {
      newErrors.phone = "Formato: +51 987 654 321";
    }

    // Validación de GitHub email (opcional pero con formato)
    if (formData.githubEmail && !emailRegex.test(formData.githubEmail)) {
      newErrors.githubEmail = "Email de GitHub inválido";
    }

    // Validación de GitHub username (opcional pero con formato)
    const usernameRegex = /^[a-zA-Z0-9-]+$/;
    if (formData.githubUsername && !usernameRegex.test(formData.githubUsername)) {
      newErrors.githubUsername = "Usuario de GitHub inválido (solo letras, números y guiones)";
    }

    // Validación de fecha de nacimiento
    if (!formData.birthDate) {
      newErrors.birthDate = "La fecha de nacimiento es requerida";
    } else {
      const birthDate = new Date(formData.birthDate);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 18) {
        newErrors.birthDate = "Debe ser mayor de 18 años";
      }
      if (age > 100) {
        newErrors.birthDate = "Fecha de nacimiento inválida";
      }
    }

    // Validación de dirección
    if (!formData.address.trim()) {
      newErrors.address = "La dirección es requerida";
    } else if (formData.address.trim().length < 10) {
      newErrors.address = "La dirección debe tener al menos 10 caracteres";
    }

    // Validación de ciudad
    if (!formData.city.trim()) newErrors.city = "La ciudad es requerida";

    // Validación de oficina
    if (!formData.officeId) newErrors.officeId = "La oficina es requerida";

    // Validación de contacto de emergencia
    if (formData.emergencyContact && formData.emergencyContact.trim().length < 3) {
      newErrors.emergencyContact = "Nombre de contacto muy corto";
    }

    // Validación de teléfono de emergencia
    if (formData.emergencyPhone && !phoneRegex.test(formData.emergencyPhone)) {
      newErrors.emergencyPhone = "Formato: +51 987 654 321";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Error en el formulario", {
        description: "Por favor corrige los errores antes de continuar"
      });
      return;
    }

    if (editingMember) {
      onUpdateMember(editingMember.id, formData);
      toast.success("Miembro actualizado", {
        description: `${formData.name} ha sido actualizado correctamente`
      });
    } else {
      onAddMember(formData);
      toast.success("Miembro registrado", {
        description: `${formData.name} ha sido agregado al equipo`
      });
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      role: '' as RoleType,
      employmentType: '' as EmploymentType,
      email: '',
      phone: '',
      githubEmail: '',
      githubUsername: '',
      birthDate: '',
      age: 0,
      address: '',
      city: 'Lima',
      specialty: '' as Specialty,
      officeId: '',
      joinDate: new Date().toISOString().split('T')[0],
      emergencyContact: '',
      emergencyPhone: ''
    });
    setErrors({});
    setEditingMember(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      role: member.role,
      employmentType: member.employmentType,
      email: member.email,
      phone: member.phone,
      githubEmail: member.githubEmail || '',
      githubUsername: member.githubUsername || '',
      birthDate: member.birthDate,
      age: member.age,
      address: member.address,
      city: member.city,
      specialty: member.specialty,
      officeId: member.officeId || '',
      joinDate: member.joinDate,
      emergencyContact: member.emergencyContact || '',
      emergencyPhone: member.emergencyPhone || ''
    });
    setIsDialogOpen(true);
  };

  const handleView = (member: TeamMember) => {
    setViewingMember(member);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const member = members.find(m => m.id === id);
    if (member) {
      onDeleteMember(id);
      toast.success("Miembro eliminado", {
        description: `${member.name} ha sido eliminado del equipo`
      });
    }
  };

  const getOfficeById = (id?: string) => offices.find(o => o.id === id);

  const getRoleBadgeVariant = (type: EmploymentType) => {
    switch (type) {
      case 'Empleado Full-time': return 'default';
      case 'Empleado Part-time': return 'secondary';
      case 'Practicante': return 'outline';
      case 'Tesista': return 'outline';
      case 'Contratista': return 'secondary';
      case 'Servicios Varios': return 'secondary';
      case 'Voluntario': return 'outline';
      default: return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Miembros</h2>
          <p className="text-muted-foreground">
            Administra la información completa del equipo
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Registrar Miembro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingMember ? 'Editar Miembro' : 'Registrar Nuevo Miembro'}
              </DialogTitle>
              <DialogDescription>
                Completa todos los campos requeridos con información válida
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="personal" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
                    <TabsTrigger value="personal">Personal</TabsTrigger>
                    <TabsTrigger value="contact">Contacto</TabsTrigger>
                    <TabsTrigger value="professional">Profesional</TabsTrigger>
                    <TabsTrigger value="emergency">Emergencia</TabsTrigger>
                  </TabsList>

                  {/* Tab Personal */}
                  <TabsContent value="personal" className="space-y-4 mt-4">
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  </TabsContent>

                  {/* Tab Contacto */}
                  <TabsContent value="contact" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Corporativo *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="nombre.apellido@company.com"
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
                          <SelectValue placeholder="Selecciona un rol" />
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
                      <Label htmlFor="office">Oficina Asignada *</Label>
                      <Select value={formData.officeId} onValueChange={(value) => setFormData({ ...formData, officeId: value })}>
                        <SelectTrigger className={errors.officeId ? 'border-red-500' : ''}>
                          <SelectValue placeholder="Selecciona una oficina" />
                        </SelectTrigger>
                        <SelectContent>
                          {offices.map(office => {
                            const available = office.capacity - office.currentOccupancy;
                            const canAssign = editingMember?.officeId === office.id || available > 0;
                            return (
                              <SelectItem
                                key={office.id}
                                value={office.id}
                                disabled={!canAssign}
                              >
                                {office.name} ({office.currentOccupancy}/{office.capacity})
                                {!canAssign && " - Lleno"}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                      {errors.officeId && <p className="text-xs text-red-500">{errors.officeId}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="joinDate">Fecha de Ingreso *</Label>
                      <Input
                        id="joinDate"
                        type="date"
                        value={formData.joinDate}
                        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                        max={new Date().toISOString().split('T')[0]}
                      />
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
                        className={errors.emergencyContact ? 'border-red-500' : ''}
                      />
                      {errors.emergencyContact && <p className="text-xs text-red-500">{errors.emergencyContact}</p>}
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

                    <div className="bg-muted p-4 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        <AlertCircle className="h-4 w-4 inline mr-2" />
                        La información de emergencia es opcional pero muy recomendable para la seguridad del equipo.
                      </p>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingMember ? 'Actualizar' : 'Registrar'}
                  </Button>
                </DialogFooter>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Miembros del Equipo</CardTitle>
              <CardDescription>
                {members.length} miembro(s) registrado(s)
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-[300px]"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Miembro</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Rol Profesional</TableHead>
                  <TableHead>Tipo Empleo</TableHead>
                  <TableHead>Especialidad</TableHead>
                  <TableHead>Oficina</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron miembros
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMembers.map((member) => {
                    const office = getOfficeById(member.officeId);
                    return (
                      <TableRow key={member.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.age} años</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1 text-xs">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{member.role}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(member.employmentType)}>
                            {member.employmentType}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{member.specialty}</span>
                        </TableCell>
                        <TableCell>
                          {office ? (
                            <div>
                              <p className="text-sm font-medium">{office.name}</p>
                              <p className="text-xs text-muted-foreground">{office.location}</p>
                            </div>
                          ) : (
                            <Badge variant="destructive">Sin asignar</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(member)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(member)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <ConfirmationDialog
                              title="Eliminar Miembro"
                              description={`¿Estás seguro de eliminar a ${member.name}?`}
                              onConfirm={() => handleDelete(member.id)}
                            >
                              <Button
                                variant="ghost"
                                size="sm"
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </ConfirmationDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para ver detalles completos */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Información Completa del Miembro</DialogTitle>
          </DialogHeader>
          {viewingMember && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Información Personal
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Nombre Completo</dt>
                        <dd className="font-medium">{viewingMember.name}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Fecha de Nacimiento</dt>
                        <dd>{new Date(viewingMember.birthDate).toLocaleDateString()}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Edad</dt>
                        <dd>{viewingMember.age} años</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Dirección</dt>
                        <dd>{viewingMember.address}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Ciudad</dt>
                        <dd>{viewingMember.city}</dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Información de Contacto
                    </h3>
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Email Corporativo</dt>
                        <dd className="font-medium">{viewingMember.email}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Teléfono</dt>
                        <dd>{viewingMember.phone}</dd>
                      </div>
                      {viewingMember.githubUsername && (
                        <div>
                          <dt className="text-muted-foreground">GitHub</dt>
                          <dd className="flex items-center gap-1">
                            <Github className="h-3 w-3" />
                            @{viewingMember.githubUsername}
                          </dd>
                        </div>
                      )}
                      {viewingMember.githubEmail && (
                        <div>
                          <dt className="text-muted-foreground">Email GitHub</dt>
                          <dd>{viewingMember.githubEmail}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    Información Profesional
                  </h3>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Rol</dt>
                      <dd>
                        <Badge variant="secondary">{viewingMember.role}</Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Tipo de Empleo</dt>
                      <dd>
                        <Badge variant={getRoleBadgeVariant(viewingMember.employmentType)}>
                          {viewingMember.employmentType}
                        </Badge>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Especialidad</dt>
                      <dd className="font-medium">{viewingMember.specialty}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Fecha de Ingreso</dt>
                      <dd>{new Date(viewingMember.joinDate).toLocaleDateString()}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Oficina</dt>
                      <dd className="font-medium">
                        {getOfficeById(viewingMember.officeId)?.name || 'Sin asignar'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Contacto de Emergencia
                  </h3>
                  {viewingMember.emergencyContact ? (
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Nombre</dt>
                        <dd className="font-medium">{viewingMember.emergencyContact}</dd>
                      </div>
                      {viewingMember.emergencyPhone && (
                        <div>
                          <dt className="text-muted-foreground">Teléfono</dt>
                          <dd>{viewingMember.emergencyPhone}</dd>
                        </div>
                      )}
                    </dl>
                  ) : (
                    <p className="text-sm text-muted-foreground">No registrado</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}