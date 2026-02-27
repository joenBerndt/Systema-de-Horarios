import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Badge } from "./ui/badge";
import { Plus, Search, Trash2, Edit, Eye, FolderKanban, Users as UsersIcon, Building2, Calendar } from "lucide-react";
import { Project, ProjectStatus, ProjectPriority, TeamMember, Office, ScrumTeam, User } from "../types";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ScrollArea } from "./ui/scroll-area";
import { Checkbox } from "./ui/checkbox";
import { ConfirmationDialog } from "./ui/confirmation-dialog";

interface ProjectsProps {
  projects: Project[];
  members: TeamMember[];
  offices: Office[];
  teams: ScrumTeam[];
  currentUser: User | null;
  onAddProject: (project: Omit<Project, 'id'>) => void;
  onUpdateProject: (id: string, project: Partial<Project>) => void;
  onDeleteProject: (id: string) => void;
}

const statusOptions: { value: ProjectStatus; label: string; color: string }[] = [
  { value: 'planning', label: 'Planificación', color: 'bg-gray-500' },
  { value: 'in-progress', label: 'En Progreso', color: 'bg-blue-500' },
  { value: 'on-hold', label: 'En Pausa', color: 'bg-yellow-500' },
  { value: 'completed', label: 'Completado', color: 'bg-green-500' },
  { value: 'cancelled', label: 'Cancelado', color: 'bg-red-500' },
];

const priorityOptions: { value: ProjectPriority; label: string }[] = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'critical', label: 'Crítica' },
];

const techOptions = [
  'React', 'Next.js', 'Vue.js', 'Angular', 'Node.js', 'Python', 'Django',
  'Java', 'Spring', '.NET', 'PHP', 'Laravel', 'React Native', 'Flutter',
  'MongoDB', 'PostgreSQL', 'MySQL', 'Redis', 'Docker', 'Kubernetes', 'AWS', 'Azure'
];

export function Projects({ projects, members, offices, teams, currentUser, onAddProject, onUpdateProject, onDeleteProject }: ProjectsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOffice, setFilterOffice] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [viewingProject, setViewingProject] = useState<Project | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning' as ProjectStatus,
    priority: 'medium' as ProjectPriority,
    officeId: '',
    assignedMembers: [] as string[],
    teamId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: 0,
    technologies: [] as string[],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = "El nombre es requerido";
    if (formData.name.trim().length < 3) newErrors.name = "El nombre debe tener al menos 3 caracteres";

    if (!formData.description.trim()) newErrors.description = "La descripción es requerida";
    if (formData.description.trim().length < 10) newErrors.description = "La descripción debe tener al menos 10 caracteres";

    if (!formData.officeId) newErrors.officeId = "La oficina es requerida";
    if (formData.assignedMembers.length === 0) newErrors.assignedMembers = "Debes asignar al menos un miembro";

    if (formData.endDate && formData.endDate < formData.startDate) {
      newErrors.endDate = "La fecha de fin debe ser posterior a la fecha de inicio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Error en el formulario", {
        description: "Por favor corrige los errores antes de continuar"
      });
      return;
    }

    const projectData = {
      ...formData,
      teamId: formData.teamId === 'none' ? undefined : formData.teamId,
      technologies: selectedTechs,
      createdAt: editingProject?.createdAt || new Date().toISOString(),
      createdBy: editingProject?.createdBy || currentUser?.id || ''
    };

    if (editingProject) {
      onUpdateProject(editingProject.id, projectData);
      toast.success("Proyecto actualizado", {
        description: `${formData.name} ha sido actualizado correctamente`
      });
    } else {
      onAddProject(projectData);
      toast.success("Proyecto creado", {
        description: `${formData.name} ha sido creado correctamente`
      });
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      priority: 'medium',
      officeId: '',
      assignedMembers: [],
      teamId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      budget: 0,
      technologies: [],
    });
    setSelectedTechs([]);
    setErrors({});
    setEditingProject(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      officeId: project.officeId,
      assignedMembers: project.assignedMembers,
      teamId: project.teamId || '',
      startDate: project.startDate,
      endDate: project.endDate || '',
      budget: project.budget || 0,
      technologies: project.technologies,
    });
    setSelectedTechs(project.technologies);
    setIsDialogOpen(true);
  };

  const handleView = (project: Project) => {
    setViewingProject(project);
    setIsViewDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const project = projects.find(p => p.id === id);
    if (project) {
      onDeleteProject(id);
      toast.success("Proyecto eliminado", {
        description: `${project.name} ha sido eliminado`
      });
    }
  };

  const toggleMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedMembers: prev.assignedMembers.includes(memberId)
        ? prev.assignedMembers.filter(id => id !== memberId)
        : [...prev.assignedMembers, memberId]
    }));
  };

  const toggleTech = (tech: string) => {
    setSelectedTechs(prev =>
      prev.includes(tech)
        ? prev.filter(t => t !== tech)
        : [...prev, tech]
    );
  };

  const getStatusBadge = (status: ProjectStatus) => {
    const option = statusOptions.find(s => s.value === status);
    return (
      <Badge variant="secondary" className={`${option?.color} text-white`}>
        {option?.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: ProjectPriority) => {
    const colors = {
      low: 'bg-gray-500',
      medium: 'bg-blue-500',
      high: 'bg-orange-500',
      critical: 'bg-red-500'
    };
    const option = priorityOptions.find(p => p.value === priority);
    return (
      <Badge variant="secondary" className={`${colors[priority]} text-white`}>
        {option?.label}
      </Badge>
    );
  };

  const getOfficeById = (id: string) => offices.find(o => o.id === id);
  const getTeamById = (id?: string) => teams.find(t => t.id === id);
  const getMemberById = (id: string) => members.find(m => m.id === id);

  const officeMembers = formData.officeId
    ? members.filter(m => m.officeId === formData.officeId)
    : members;

  const projectsByOffice = offices.map(office => ({
    office,
    projects: projects.filter(p => p.officeId === office.id)
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Proyectos</h2>
          <p className="text-muted-foreground">
            Administra proyectos por oficina y asigna equipos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Proyecto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {editingProject ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
              </DialogTitle>
              <DialogDescription>
                Completa la información del proyecto
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[calc(90vh-180px)] pr-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="general" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="team">Equipo</TabsTrigger>
                    <TabsTrigger value="details">Detalles</TabsTrigger>
                  </TabsList>

                  {/* Tab General */}
                  <TabsContent value="general" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Proyecto *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ej: Sistema de Gestión de Inventario"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción *</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Describe los objetivos y alcance del proyecto..."
                        rows={4}
                        className={errors.description ? 'border-red-500' : ''}
                      />
                      {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="status">Estado *</Label>
                        <Select value={formData.status} onValueChange={(value: ProjectStatus) => setFormData({ ...formData, status: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="priority">Prioridad *</Label>
                        <Select value={formData.priority} onValueChange={(value: ProjectPriority) => setFormData({ ...formData, priority: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {priorityOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="office">Oficina *</Label>
                      <Select value={formData.officeId} onValueChange={(value) => setFormData({ ...formData, officeId: value, assignedMembers: [] })}>
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

                  {/* Tab Equipo */}
                  <TabsContent value="team" className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="team">Equipo Scrum (Opcional)</Label>
                      <Select value={formData.teamId} onValueChange={(value) => setFormData({ ...formData, teamId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un equipo" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sin equipo asignado</SelectItem>
                          {teams.map(team => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name} ({team.members.length} miembros)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Miembros Asignados * ({formData.assignedMembers.length} seleccionados)</Label>
                      {!formData.officeId ? (
                        <p className="text-sm text-muted-foreground">Primero selecciona una oficina</p>
                      ) : (
                        <ScrollArea className="h-[300px] border rounded-md p-4">
                          <div className="space-y-3">
                            {officeMembers.map(member => (
                              <div key={member.id} className="flex items-center space-x-3 p-2 hover:bg-muted rounded">
                                <Checkbox
                                  id={`member-${member.id}`}
                                  checked={formData.assignedMembers.includes(member.id)}
                                  onCheckedChange={() => toggleMember(member.id)}
                                />
                                <label
                                  htmlFor={`member-${member.id}`}
                                  className="flex-1 cursor-pointer"
                                >
                                  <p className="font-medium text-sm">{member.name}</p>
                                  <p className="text-xs text-muted-foreground">{member.role} - {member.specialty}</p>
                                </label>
                                <Badge variant="secondary" className="text-xs">
                                  {member.employmentType}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                      {errors.assignedMembers && <p className="text-xs text-red-500">{errors.assignedMembers}</p>}
                    </div>
                  </TabsContent>

                  {/* Tab Detalles */}
                  <TabsContent value="details" className="space-y-4 mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="startDate">Fecha de Inicio *</Label>
                        <Input
                          id="startDate"
                          type="date"
                          value={formData.startDate}
                          onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="endDate">Fecha de Fin</Label>
                        <Input
                          id="endDate"
                          type="date"
                          value={formData.endDate}
                          onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          min={formData.startDate}
                          className={errors.endDate ? 'border-red-500' : ''}
                        />
                        {errors.endDate && <p className="text-xs text-red-500">{errors.endDate}</p>}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="budget">Presupuesto (USD)</Label>
                      <Input
                        id="budget"
                        type="number"
                        value={formData.budget || ''}
                        onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                        placeholder="0"
                        min="0"
                        step="1000"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Tecnologías ({selectedTechs.length} seleccionadas)</Label>
                      <ScrollArea className="h-[200px] border rounded-md p-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {techOptions.map(tech => (
                            <div key={tech} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tech-${tech}`}
                                checked={selectedTechs.includes(tech)}
                                onCheckedChange={() => toggleTech(tech)}
                              />
                              <label
                                htmlFor={`tech-${tech}`}
                                className="text-sm cursor-pointer"
                              >
                                {tech}
                              </label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                </Tabs>

                <DialogFooter className="gap-2">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingProject ? 'Actualizar' : 'Crear Proyecto'}
                  </Button>
                </DialogFooter>
              </form>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar proyectos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={filterOffice} onValueChange={setFilterOffice}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las oficinas</SelectItem>
              {offices.map(office => (
                <SelectItem key={office.id} value={office.id}>
                  {office.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {statusOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Proyectos por Oficina */}
      <div className="space-y-4">
        {projectsByOffice.map(({ office, projects: officeProjects }) => {
          if (filterOffice !== 'all' && filterOffice !== office.id) return null;

          const filteredOfficeProjects = officeProjects.filter(project => {
            const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              project.description.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || project.status === filterStatus;
            return matchesSearch && matchesStatus;
          });

          if (filteredOfficeProjects.length === 0 && (searchTerm || filterStatus !== 'all')) return null;

          return (
            <Card key={office.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-primary" />
                    <div>
                      <CardTitle>{office.name}</CardTitle>
                      <CardDescription>{office.location}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {filteredOfficeProjects.length} proyecto(s)
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {filteredOfficeProjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderKanban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No hay proyectos en esta oficina</p>
                  </div>
                ) : (
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Proyecto</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Prioridad</TableHead>
                          <TableHead>Equipo</TableHead>
                          <TableHead>Fechas</TableHead>
                          <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredOfficeProjects.map(project => {
                          const team = getTeamById(project.teamId);
                          return (
                            <TableRow key={project.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{project.name}</p>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {project.description}
                                  </p>
                                </div>
                              </TableCell>
                              <TableCell>
                                {getStatusBadge(project.status)}
                              </TableCell>
                              <TableCell>
                                {getPriorityBadge(project.priority)}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                                  <span className="text-sm">{project.assignedMembers.length}</span>
                                  {team && (
                                    <Badge variant="outline" className="text-xs">
                                      {team.name}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="text-sm">
                                  <p>{new Date(project.startDate).toLocaleDateString()}</p>
                                  {project.endDate && (
                                    <p className="text-muted-foreground">
                                      {new Date(project.endDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleView(project)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(project)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <ConfirmationDialog
                                    title="Eliminar Proyecto"
                                    description={`¿Estás seguro de eliminar el proyecto "${project.name}"?`}
                                    onConfirm={() => handleDelete(project.id)}
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
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog de Vista */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Proyecto</DialogTitle>
          </DialogHeader>
          {viewingProject && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold mb-2">{viewingProject.name}</h3>
                <div className="flex items-center gap-2 mb-4">
                  {getStatusBadge(viewingProject.status)}
                  {getPriorityBadge(viewingProject.priority)}
                </div>
                <p className="text-muted-foreground">{viewingProject.description}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Información General
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Oficina</dt>
                      <dd className="font-medium">{getOfficeById(viewingProject.officeId)?.name}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Equipo Scrum</dt>
                      <dd className="font-medium">{getTeamById(viewingProject.teamId)?.name || 'Sin equipo'}</dd>
                    </div>
                    {viewingProject.budget && viewingProject.budget > 0 && (
                      <div>
                        <dt className="text-muted-foreground">Presupuesto</dt>
                        <dd className="font-medium">${viewingProject.budget.toLocaleString()}</dd>
                      </div>
                    )}
                  </dl>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Fechas
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Inicio</dt>
                      <dd className="font-medium">{new Date(viewingProject.startDate).toLocaleDateString()}</dd>
                    </div>
                    {viewingProject.endDate && (
                      <div>
                        <dt className="text-muted-foreground">Fin</dt>
                        <dd className="font-medium">{new Date(viewingProject.endDate).toLocaleDateString()}</dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted-foreground">Creado</dt>
                      <dd className="font-medium">{new Date(viewingProject.createdAt).toLocaleDateString()}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <UsersIcon className="h-4 w-4" />
                  Equipo ({viewingProject.assignedMembers.length} miembros)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {viewingProject.assignedMembers.map(memberId => {
                    const member = getMemberById(memberId);
                    return member ? (
                      <div key={memberId} className="border rounded p-2">
                        <p className="font-medium text-sm">{member.name}</p>
                        <p className="text-xs text-muted-foreground">{member.role}</p>
                      </div>
                    ) : null;
                  })}
                </div>
              </div>

              {viewingProject.technologies.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Tecnologías</h4>
                  <div className="flex flex-wrap gap-2">
                    {viewingProject.technologies.map(tech => (
                      <Badge key={tech} variant="outline">{tech}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}