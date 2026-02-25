import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { TeamMember, Office, ScrumTeam, Schedule, DailyMeeting, Project } from "../types";
import { Badge } from "./ui/badge";
import { User, Mail, Phone, Github, MapPin, Calendar, Briefcase, Users, Clock, FolderKanban, TrendingUp } from "lucide-react";
import { AnimatedContainer, StaggerContainer, StaggerItem } from "./ui/animated-container";
import { motion } from "motion/react";
import { Alert, AlertDescription } from "./ui/alert";

interface MemberDashboardProps {
  member: TeamMember;
  office?: Office;
  team?: ScrumTeam;
  schedules: Schedule[];
  dailies: DailyMeeting[];
  projects: Project[];
  allMembers: TeamMember[];
}

export function MemberDashboard({ member, office, team, schedules, dailies, projects }: MemberDashboardProps) {
  const memberSchedules = schedules.filter(s => s.memberId === member.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingSchedules = memberSchedules
    .filter(s => new Date(s.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
  
  const teamDailies = team ? dailies.filter(d => d.teamId === team.id) : [];
  const upcomingDailies = teamDailies
    .filter(d => new Date(d.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
  
  const memberProjects = projects.filter(p => p.assignedMembers.includes(member.id));
  const activeProjects = memberProjects.filter(p => p.status === 'in-progress' || p.status === 'planning');

  const todaySchedule = memberSchedules.find(s => {
    const scheduleDate = new Date(s.date);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate.getTime() === today.getTime();
  });

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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bienvenido, {member.name.split(' ')[0]} 👋</h2>
          <p className="text-muted-foreground">
            Aquí está tu resumen del día
          </p>
        </div>

        {/* Alerta de Hoy */}
        {todaySchedule && (
          <AnimatedContainer delay={0.1}>
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <Alert className={todaySchedule.workMode === 'presencial' ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' : 'border-green-500 bg-green-50 dark:bg-green-950'}>
                <Clock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Hoy:</strong> {todaySchedule.workMode === 'presencial' ? `Trabajo presencial en ${office?.name}` : 'Trabajo remoto'} ({todaySchedule.startTime} - {todaySchedule.endTime})
                </AlertDescription>
              </Alert>
            </motion.div>
          </AnimatedContainer>
        )}

        {/* Estadísticas Rápidas */}
        <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StaggerItem>
            <motion.div whileHover={{ scale: 1.05, y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-blue-700 dark:text-blue-300">
                    <FolderKanban className="h-4 w-4" />
                    Proyectos Activos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">{activeProjects.length}</div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div whileHover={{ scale: 1.05, y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-300">
                    <Calendar className="h-4 w-4" />
                    Próximos Horarios
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">{upcomingSchedules.length}</div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div whileHover={{ scale: 1.05, y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Users className="h-4 w-4" />
                    Mi Equipo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">{team?.members.length || 0}</div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div whileHover={{ scale: 1.05, y: -4 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2 text-orange-700 dark:text-orange-300">
                    <Clock className="h-4 w-4" />
                    Dailies
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">{upcomingDailies.length}</div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>

        {/* Información Personal y Profesional */}
        <StaggerContainer className="grid gap-4 md:grid-cols-3">
          <StaggerItem>
            <motion.div whileHover={{ scale: 1.02 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    Perfil
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Nombre</p>
                    <p className="font-medium">{member.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Edad</p>
                    <p className="font-medium">{member.age} años</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ciudad</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {member.city}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div whileHover={{ scale: 1.02 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Rol
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Posición</p>
                    <Badge variant="secondary" className="mt-1">{member.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Tipo</p>
                    <Badge variant={getEmploymentBadgeVariant(member.employmentType)} className="mt-1">
                      {member.employmentType}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Especialidad</p>
                    <p className="font-medium">{member.specialty}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div whileHover={{ scale: 1.02 }}>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Contacto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium text-sm truncate">{member.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teléfono</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {member.phone}
                    </p>
                  </div>
                  {member.githubUsername && (
                    <div>
                      <p className="text-sm text-muted-foreground">GitHub</p>
                      <p className="font-medium flex items-center gap-1">
                        <Github className="h-3 w-3" />
                        @{member.githubUsername}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>

        {/* Proyectos Recientes y Horarios */}
        <div className="grid gap-4 md:grid-cols-2">
          <AnimatedContainer delay={0.3}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderKanban className="h-5 w-5" />
                  Proyectos Recientes
                </CardTitle>
                <CardDescription>Tus últimos proyectos activos</CardDescription>
              </CardHeader>
              <CardContent>
                {activeProjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FolderKanban className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No tienes proyectos activos</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {activeProjects.slice(0, 3).map((project, index) => (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 4 }}
                        className="border rounded-lg p-3"
                      >
                        <p className="font-medium">{project.name}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant={project.status === 'in-progress' ? 'default' : 'secondary'} className="text-xs">
                            {project.status === 'in-progress' ? 'En Progreso' : 'Planificación'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {project.technologies.length} tecnologías
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedContainer>

          <AnimatedContainer delay={0.4}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Próximos Horarios
                </CardTitle>
                <CardDescription>Tus próximas asignaciones</CardDescription>
              </CardHeader>
              <CardContent>
                {upcomingSchedules.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No hay horarios programados</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingSchedules.map((schedule, index) => (
                      <motion.div
                        key={schedule.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ x: 4 }}
                        className="border rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{new Date(schedule.date).toLocaleDateString()}</p>
                          <Badge variant={schedule.workMode === 'presencial' ? 'default' : 'secondary'} className="text-xs">
                            {schedule.workMode === 'presencial' ? 'Presencial' : 'Remoto'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {schedule.startTime} - {schedule.endTime}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </AnimatedContainer>
        </div>

        {/* Información de Equipo y Oficina */}
        {(team || office) && (
          <StaggerContainer className="grid gap-4 md:grid-cols-2">
            {team && (
              <StaggerItem>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Mi Equipo
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <p className="text-2xl font-bold">{team.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{team.members.length} miembros</p>
                      </div>
                      {team.dailyTime && (
                        <div className="flex items-center gap-2 text-sm mt-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Daily a las {team.dailyTime}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            )}

            {office && (
              <StaggerItem>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Mi Oficina
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <p className="text-2xl font-bold">{office.name}</p>
                        <p className="text-sm text-muted-foreground mt-1">{office.location}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>
            )}
          </StaggerContainer>
        )}
      </div>
    </AnimatedContainer>
  );
}
