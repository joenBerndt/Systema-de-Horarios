import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { FolderKanban, Search, Eye, Clock, Users, Calendar, AlertCircle } from "lucide-react";
import { Project, TeamMember, Office, ScrumTeam } from "../types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { AnimatedContainer, StaggerContainer, StaggerItem, AnimatePresence } from "./ui/animated-container";
import { LoadingSpinner } from "./ui/loading";
import { Alert, AlertDescription } from "./ui/alert";
import { motion } from "motion/react";

interface MemberProjectsProps {
  projects: Project[];
  member: TeamMember;
  offices: Office[];
  teams: ScrumTeam[];
  allMembers: TeamMember[];
}

export function MemberProjects({ projects, member, offices, teams, allMembers }: MemberProjectsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingProject, setViewingProject] = useState<Project | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const memberProjects = projects.filter(p => p.assignedMembers.includes(member.id));
  
  const filteredProjects = memberProjects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeProjects = filteredProjects.filter(p => p.status === 'in-progress' || p.status === 'planning');
  const completedProjects = filteredProjects.filter(p => p.status === 'completed');
  const onHoldProjects = filteredProjects.filter(p => p.status === 'on-hold');

  const handleViewProject = async (project: Project) => {
    setIsLoading(true);
    // Simular carga de datos
    await new Promise(resolve => setTimeout(resolve, 500));
    setViewingProject(project);
    setIsViewDialogOpen(true);
    setIsLoading(false);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'planning': { label: 'Planificación', color: 'bg-gray-500' },
      'in-progress': { label: 'En Progreso', color: 'bg-blue-500' },
      'on-hold': { label: 'En Pausa', color: 'bg-yellow-500' },
      'completed': { label: 'Completado', color: 'bg-green-500' },
      'cancelled': { label: 'Cancelado', color: 'bg-red-500' },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge variant="secondary" className={`${config?.color} text-white`}>
        {config?.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: 'Baja', color: 'bg-gray-500' },
      medium: { label: 'Media', color: 'bg-blue-500' },
      high: { label: 'Alta', color: 'bg-orange-500' },
      critical: { label: 'Crítica', color: 'bg-red-500' }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig];
    return (
      <Badge variant="secondary" className={`${config?.color} text-white`}>
        {config?.label}
      </Badge>
    );
  };

  const getOfficeById = (id: string) => offices.find(o => o.id === id);
  const getTeamById = (id?: string) => teams.find(t => t.id === id);
  const getMemberById = (id: string) => allMembers.find(m => m.id === id);

  const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
    const office = getOfficeById(project.officeId);
    const team = getTeamById(project.teamId);
    
    return (
      <StaggerItem>
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => handleViewProject(project)}>
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-primary" />
                    {project.name}
                  </CardTitle>
                  <CardDescription className="mt-2 line-clamp-2">
                    {project.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  {getStatusBadge(project.status)}
                  {getPriorityBadge(project.priority)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>{project.assignedMembers.length} miembros</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{new Date(project.startDate).toLocaleDateString()}</span>
                  </div>
                </div>

                {office && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Oficina: </span>
                    <span className="font-medium">{office.name}</span>
                  </div>
                )}

                {team && (
                  <Badge variant="outline" className="w-fit">
                    {team.name}
                  </Badge>
                )}

                {project.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {project.technologies.slice(0, 4).map(tech => (
                      <Badge key={tech} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                    {project.technologies.length > 4 && (
                      <Badge variant="secondary" className="text-xs">
                        +{project.technologies.length - 4}
                      </Badge>
                    )}
                  </div>
                )}

                <Button variant="ghost" className="w-full mt-2" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Ver Detalles
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </StaggerItem>
    );
  };

  return (
    <AnimatedContainer>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mis Proyectos</h2>
          <p className="text-muted-foreground">
            Proyectos en los que participas activamente
          </p>
        </div>

        {/* Estadísticas */}
        <StaggerContainer className="grid gap-4 md:grid-cols-3">
          <StaggerItem>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    Proyectos Activos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeProjects.length}</div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    Completados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{completedProjects.length}</div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    En Pausa
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{onHoldProjects.length}</div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>

        {/* Búsqueda */}
        <AnimatedContainer delay={0.2}>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar proyectos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </AnimatedContainer>

        {/* Lista de Proyectos */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex justify-center py-12"
            >
              <LoadingSpinner size="lg" text="Cargando proyectos..." />
            </motion.div>
          ) : filteredProjects.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <FolderKanban className="h-16 w-16 text-muted-foreground/50 mb-4" />
                  <p className="text-lg font-medium">No hay proyectos</p>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm ? 'No se encontraron proyectos con ese término' : 'Aún no estás asignado a ningún proyecto'}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
              {filteredProjects.map((project, index) => (
                <ProjectCard key={project.id} project={project} index={index} />
              ))}
            </StaggerContainer>
          )}
        </AnimatePresence>

        {/* Dialog de Detalles */}
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalles del Proyecto</DialogTitle>
              <DialogDescription>
                Información completa del proyecto
              </DialogDescription>
            </DialogHeader>
            <AnimatePresence mode="wait">
              {viewingProject && (
                <motion.div
                  key="content"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div>
                    <h3 className="text-2xl font-bold mb-2">{viewingProject.name}</h3>
                    <div className="flex items-center gap-2 mb-4">
                      {getStatusBadge(viewingProject.status)}
                      {getPriorityBadge(viewingProject.priority)}
                    </div>
                    <p className="text-muted-foreground">{viewingProject.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
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
                      </dl>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Equipo
                      </h4>
                      <p className="text-sm text-muted-foreground mb-2">
                        {viewingProject.assignedMembers.length} miembros
                      </p>
                      {getTeamById(viewingProject.teamId) && (
                        <Badge variant="outline">
                          {getTeamById(viewingProject.teamId)?.name}
                        </Badge>
                      )}
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

                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Para más información o cambios en el proyecto, contacta con tu líder de equipo.
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </div>
    </AnimatedContainer>
  );
}
