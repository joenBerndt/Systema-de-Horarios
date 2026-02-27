import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { TeamMember, Schedule, Office } from "../types";
import { Calendar, Clock, MapPin, Home, Building2, Info } from "lucide-react";
import { AnimatedContainer, StaggerContainer, StaggerItem, AnimatePresence } from "./ui/animated-container";
import { motion } from "motion/react";
import { Alert, AlertDescription } from "./ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

interface MemberScheduleViewProps {
  member: TeamMember;
  schedules: Schedule[];
  office?: Office;
}

export function MemberScheduleView({ member, schedules, office }: MemberScheduleViewProps) {
  const memberSchedules = schedules.filter(s => s.memberId === member.id);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingSchedules = memberSchedules
    .filter(s => new Date(s.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastSchedules = memberSchedules
    .filter(s => new Date(s.date) < today)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

  const currentWeekSchedules = upcomingSchedules.filter(s => {
    const scheduleDate = new Date(s.date);
    const weekFromNow = new Date(today);
    weekFromNow.setDate(weekFromNow.getDate() + 7);
    return scheduleDate <= weekFromNow;
  });

  const presencialCount = upcomingSchedules.filter(s => s.workMode === 'presencial').length;
  const remoteCount = upcomingSchedules.filter(s => s.workMode === 'remoto').length;

  const getDayOfWeek = (date: string) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[new Date(date).getDay()];
  };

  const isToday = (date: string) => {
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate.getTime() === today.getTime();
  };

  const isTomorrow = (date: string) => {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const scheduleDate = new Date(date);
    scheduleDate.setHours(0, 0, 0, 0);
    return scheduleDate.getTime() === tomorrow.getTime();
  };

  const ScheduleCard = ({ schedule }: { schedule: Schedule }) => {
    const isPresencial = schedule.workMode === 'presencial';
    const isTodaySchedule = isToday(schedule.date);
    const isTomorrowSchedule = isTomorrow(schedule.date);

    return (
      <StaggerItem>
        <motion.div
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className={`${isTodaySchedule ? 'border-primary shadow-lg' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    {getDayOfWeek(schedule.date)}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {new Date(schedule.date).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </CardDescription>
                </div>
                <div className="flex flex-col gap-2">
                  {isTodaySchedule && (
                    <Badge variant="default" className="bg-green-500">
                      Hoy
                    </Badge>
                  )}
                  {isTomorrowSchedule && (
                    <Badge variant="default" className="bg-blue-500">
                      Mañana
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{schedule.startTime} - {schedule.endTime}</span>
              </div>

              <div className="flex items-center gap-2">
                {isPresencial ? (
                  <>
                    <Building2 className="h-4 w-4 text-blue-500" />
                    <Badge variant="default" className="bg-blue-500">
                      Presencial
                    </Badge>
                  </>
                ) : (
                  <>
                    <Home className="h-4 w-4 text-green-500" />
                    <Badge variant="default" className="bg-green-500">
                      Remoto
                    </Badge>
                  </>
                )}
              </div>

              {schedule.shift && (
                <div className="pt-2 border-t">
                  <Badge variant="outline">
                    Turno {schedule.shift}
                  </Badge>
                </div>
              )}

              {isTodaySchedule && (
                <Alert className="bg-primary/5 border-primary">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">
                    {isPresencial
                      ? `Debes asistir hoy a la oficina ${office?.name || ''}`
                      : 'Puedes trabajar desde casa hoy'
                    }
                  </AlertDescription>
                </Alert>
              )}
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
          <h2 className="text-3xl font-bold tracking-tight">Mis Horarios</h2>
          <p className="text-muted-foreground">
            Tu calendario de trabajo programado
          </p>
        </div>

        {/* Estadísticas */}
        <StaggerContainer className="grid gap-4 md:grid-cols-4">
          <StaggerItem>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Esta Semana
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{currentWeekSchedules.length}</div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Próximos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{upcomingSchedules.length}</div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-500" />
                    Presencial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{presencialCount}</div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>

          <StaggerItem>
            <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Home className="h-4 w-4 text-green-500" />
                    Remoto
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{remoteCount}</div>
                </CardContent>
              </Card>
            </motion.div>
          </StaggerItem>
        </StaggerContainer>

        {/* Tabs para ver próximos/pasados */}
        <AnimatedContainer delay={0.2}>
          <Tabs defaultValue="upcoming">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">Próximos</TabsTrigger>
              <TabsTrigger value="past">Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-4 mt-6">
              <AnimatePresence mode="wait">
                {upcomingSchedules.length === 0 ? (
                  <motion.div
                    key="empty-upcoming"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium">No hay horarios próximos</p>
                        <p className="text-sm text-muted-foreground">
                          Tus próximos horarios aparecerán aquí
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {upcomingSchedules.map((schedule) => (
                      <ScheduleCard key={schedule.id} schedule={schedule} />
                    ))}
                  </StaggerContainer>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="past" className="space-y-4 mt-6">
              <AnimatePresence mode="wait">
                {pastSchedules.length === 0 ? (
                  <motion.div
                    key="empty-past"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                  >
                    <Card className="border-dashed">
                      <CardContent className="flex flex-col items-center justify-center py-12">
                        <Calendar className="h-16 w-16 text-muted-foreground/50 mb-4" />
                        <p className="text-lg font-medium">No hay historial</p>
                        <p className="text-sm text-muted-foreground">
                          Tus horarios pasados aparecerán aquí
                        </p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ) : (
                  <motion.div
                    key="past-table"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card>
                      <CardContent className="p-0 overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Fecha</TableHead>
                              <TableHead>Día</TableHead>
                              <TableHead>Horario</TableHead>
                              <TableHead>Modo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pastSchedules.map((schedule) => (
                              <motion.tr
                                key={schedule.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                              >
                                <TableCell>
                                  {new Date(schedule.date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>{getDayOfWeek(schedule.date)}</TableCell>
                                <TableCell>
                                  {schedule.startTime} - {schedule.endTime}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    variant={schedule.workMode === 'presencial' ? 'default' : 'secondary'}
                                    className={schedule.workMode === 'presencial' ? 'bg-blue-500' : 'bg-green-500'}
                                  >
                                    {schedule.workMode === 'presencial' ? 'Presencial' : 'Remoto'}
                                  </Badge>
                                </TableCell>
                              </motion.tr>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </AnimatedContainer>

        {/* Información de Oficina */}
        {office && (
          <AnimatedContainer delay={0.3}>
            <Alert>
              <MapPin className="h-4 w-4" />
              <AlertDescription>
                <strong>Tu oficina asignada:</strong> {office.name} - {office.location}
              </AlertDescription>
            </Alert>
          </AnimatedContainer>
        )}
      </div>
    </AnimatedContainer>
  );
}
