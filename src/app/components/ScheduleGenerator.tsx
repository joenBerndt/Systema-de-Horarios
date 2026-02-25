import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Calendar, Download, RefreshCw, AlertCircle, Home, Building, Bell, UserX } from "lucide-react";
import { TeamMember, Office, Schedule, MemberAvailability, DayOfWeek } from "../types";
import { Badge } from "./ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Alert, AlertDescription } from "./ui/alert";
import { toast } from "sonner";
import { cn } from "./ui/utils";

interface ScheduleGeneratorProps {
  members: TeamMember[];
  offices: Office[];
  schedules: Schedule[];
  memberAvailabilities: MemberAvailability[];
  onGenerateSchedule: (schedules: Omit<Schedule, 'id'>[]) => void;
}

export function ScheduleGenerator({ members: allMembers, offices, schedules, memberAvailabilities, onGenerateSchedule }: ScheduleGeneratorProps) {
  // Excluimos explícitamente al administrador maestro de la lista para la generación de horarios
  const members = allMembers.filter(m =>
    m.username?.toLowerCase() !== 'admin-master' &&
    !m.name.toLowerCase().includes('administrador') &&
    m.email !== 'superadmin@company.com'
  );

  const [selectedWeeks, setSelectedWeeks] = useState<number>(1);
  const [selectedOffice, setSelectedOffice] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'calendar' | 'list' | 'shifts'>('shifts');

  // Función para obtener el día de la semana de una fecha
  const getDayOfWeek = (date: Date): DayOfWeek => {
    const days: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[date.getDay()];
  };

  // Función para verificar si un miembro está disponible en una fecha y hora
  const isMemberAvailable = (memberId: string, date: Date, startTime: string, endTime: string): boolean => {
    const availability = memberAvailabilities.find(a => a.memberId === memberId);

    // Si no tiene disponibilidad configurada, asumimos que no está disponible
    if (!availability) return false;

    const dayOfWeek = getDayOfWeek(date);
    const dayAvailability = availability.availability.find(d => d.day === dayOfWeek);

    // Si el día no está marcado como disponible
    if (!dayAvailability || !dayAvailability.isAvailable) return false;

    // Verificar si hay algún rango horario que cubra el horario requerido
    const isAvailableInTimeRange = dayAvailability.timeRanges.some(range => {
      // Solo consideramos rangos con estado "available"
      if (range.status !== 'available') return false;

      // Convertir tiempos a minutos para comparar
      const parseTime = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const rangeStart = parseTime(range.start);
      const rangeEnd = parseTime(range.end);
      const scheduleStart = parseTime(startTime);
      const scheduleEnd = parseTime(endTime);

      // El rango debe cubrir completamente el horario requerido
      return rangeStart <= scheduleStart && rangeEnd >= scheduleEnd;
    });

    return isAvailableInTimeRange;
  };

  // Obtener miembros sin disponibilidad configurada
  const getMembersWithoutAvailability = () => {
    return members.filter(member => {
      const availability = memberAvailabilities.find(a => a.memberId === member.id);
      return !availability;
    });
  };



  // Función para notificar a un miembro
  const notifyMember = (member: TeamMember) => {
    toast.info("Notificación enviada", {
      description: `Se ha enviado un recordatorio a ${member.name} para configurar su disponibilidad`,
      duration: 3000
    });
  };

  // Función para notificar a todos los miembros sin disponibilidad
  const notifyAllWithoutAvailability = () => {
    const membersWithoutAvailability = getMembersWithoutAvailability();
    if (membersWithoutAvailability.length === 0) {
      toast.success("Todos actualizados", {
        description: "Todos los miembros tienen su disponibilidad configurada"
      });
      return;
    }

    toast.success("Notificaciones enviadas", {
      description: `Se han enviado recordatorios a ${membersWithoutAvailability.length} miembro(s)`,
      duration: 3000
    });
  };

  const generateSchedulesWithRotation = () => {
    const newSchedules: Omit<Schedule, 'id'>[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

    // Verificar que todos los miembros tengan oficina asignada
    const membersWithoutOffice = members.filter(m => !m.officeId);
    if (membersWithoutOffice.length > 0) {
      toast.error("No se puede generar el horario", {
        description: "Todos los miembros deben tener una oficina asignada"
      });
      return;
    }

    // Verificar que haya al menos un miembro con oficina
    const membersWithOffice = members.filter(m => m.officeId);
    if (membersWithOffice.length === 0) {
      toast.error("No se puede generar el horario", {
        description: "No hay miembros con oficina asignada"
      });
      return;
    }

    // Agrupar miembros por oficina
    const membersByOffice = new Map<string, TeamMember[]>();
    members.forEach(member => {
      if (member.officeId) {
        if (!membersByOffice.has(member.officeId)) {
          membersByOffice.set(member.officeId, []);
        }
        membersByOffice.get(member.officeId)?.push(member);
      }
    });

    let totalSchedulesGenerated = 0;

    // Procesar cada oficina
    membersByOffice.forEach((officeMembers, officeId) => {
      const office = offices.find(o => o.id === officeId);
      if (!office) return;

      const totalMembers = officeMembers.length;
      const capacity = office.capacity;

      // Si la oficina está sobrepasada, usar sistema de rotación
      if (totalMembers > capacity) {
        // Calcular número de turnos necesarios
        const shiftsNeeded = Math.ceil(totalMembers / capacity);
        const useMorningAfternoon = shiftsNeeded === 2;
        const shiftLabels = useMorningAfternoon ? ['Mañana (09:00 - 13:00)', 'Tarde (14:00 - 18:00)'] : ['A', 'B', 'C', 'D', 'E', 'F'];

        // Dividir miembros en turnos equitativamente
        const shifts: { label: string; members: TeamMember[]; isMorning: boolean; isAfternoon: boolean }[] = [];
        for (let i = 0; i < shiftsNeeded; i++) {
          shifts.push({
            label: shiftLabels[i] || `Turno ${i + 1}`,
            members: [],
            isMorning: useMorningAfternoon && i === 0,
            isAfternoon: useMorningAfternoon && i === 1
          });
        }

        // Distribuir miembros en turnos de forma equitativa
        officeMembers.forEach((member, index) => {
          const shiftIndex = index % shiftsNeeded;
          shifts[shiftIndex].members.push(member);
        });

        // Generar horarios rotativos
        for (let week = 0; week < selectedWeeks; week++) {
          for (let day = 0; day < 5; day++) {
            const currentDate = new Date(monday);
            currentDate.setDate(monday.getDate() + (week * 7) + day);
            const dateStr = currentDate.toISOString().split('T')[0];

            // Rotar turnos: cada turno trabaja días alternos, a menos de que sea régimen Mañana/Tarde
            shifts.forEach((shift, shiftIndex) => {
              // Patrón de rotación: cada turno trabaja presencial en días específicos, pero si es mañana/tarde vienen todos los días medio día
              const workPresential = useMorningAfternoon ? true : (day + week * 5) % shiftsNeeded === shiftIndex;
              let startTime = '09:00';
              let endTime = '18:00';

              if (useMorningAfternoon) {
                startTime = shift.isMorning ? '09:00' : '14:00';
                endTime = shift.isMorning ? '13:00' : '18:00';
              }

              shift.members.forEach(member => {
                // Verificar disponibilidad del miembro
                if (!isMemberAvailable(member.id, currentDate, startTime, endTime)) {
                  // Si no está disponible, no se agrega al horario
                  return;
                }

                newSchedules.push({
                  memberId: member.id,
                  officeId: office.id,
                  date: dateStr,
                  startTime: '09:00',
                  endTime: '18:00',
                  weekNumber: week + 1,
                  workMode: workPresential ? 'presencial' : 'remoto',
                  shift: shift.label
                });
                totalSchedulesGenerated++;
              });
            });
          }
        }

        toast.success("Horarios con rotación generados", {
          description: `${shiftsNeeded} turnos creados para ${office.name} (${totalMembers} personas / ${capacity} espacios)`
        });

      } else {
        // Si la oficina no está sobrepasada, todos trabajan presencial
        // Esto aplica incluso si es un solo miembro
        for (let week = 0; week < selectedWeeks; week++) {
          for (let day = 0; day < 5; day++) {
            const currentDate = new Date(monday);
            currentDate.setDate(monday.getDate() + (week * 7) + day);
            const dateStr = currentDate.toISOString().split('T')[0];

            officeMembers.forEach(member => {
              // Verificar disponibilidad del miembro
              if (!isMemberAvailable(member.id, currentDate, '09:00', '18:00')) {
                // Si no está disponible, no se agrega al horario
                return;
              }

              newSchedules.push({
                memberId: member.id,
                officeId: office.id,
                date: dateStr,
                startTime: '09:00',
                endTime: '18:00',
                weekNumber: week + 1,
                workMode: 'presencial',
                shift: 'Único'
              });
              totalSchedulesGenerated++;
            });
          }
        }
      }
    });

    if (totalSchedulesGenerated === 0) {
      toast.error("No se pudieron generar horarios", {
        description: "Ningún miembro tiene disponibilidad configurada en el horario laboral (9:00-18:00)",
        duration: 5000
      });
      return;
    }

    onGenerateSchedule(newSchedules);

    // Contarmos cuántos miembros no fueron asignados
    const assignedMemberIds = new Set(newSchedules.map(s => s.memberId));
    const unassignedMembers = members.filter(m => m.officeId && !assignedMemberIds.has(m.id));

    if (unassignedMembers.length > 0) {
      toast.warning("Algunos miembros no fueron asignados", {
        description: `${unassignedMembers.length} miembro(s) no tienen disponibilidad configurada o no están disponibles en los horarios requeridos`,
        duration: 5000
      });
    } else {
      toast.success("Horarios generados exitosamente", {
        description: `Se generaron ${totalSchedulesGenerated} asignaciones para ${assignedMemberIds.size} miembro(s)`,
        duration: 4000
      });
    }
  };

  const getSchedulesByDate = () => {
    const schedulesByDate = new Map<string, Schedule[]>();
    const filteredSchedules = selectedOffice === 'all'
      ? schedules
      : schedules.filter(s => s.officeId === selectedOffice);

    filteredSchedules.forEach(schedule => {
      if (!schedulesByDate.has(schedule.date)) {
        schedulesByDate.set(schedule.date, []);
      }
      schedulesByDate.get(schedule.date)?.push(schedule);
    });

    return Array.from(schedulesByDate.entries()).sort((a, b) =>
      new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
  };

  const getOfficeStats = () => {
    const stats = new Map<string, {
      office: Office;
      memberCount: number;
      members: TeamMember[];
      needsRotation: boolean;
      shiftsNeeded: number;
    }>();

    members.forEach(member => {
      if (member.officeId) {
        const office = offices.find(o => o.id === member.officeId);
        if (office) {
          if (!stats.has(office.id)) {
            stats.set(office.id, {
              office,
              memberCount: 0,
              members: [],
              needsRotation: false,
              shiftsNeeded: 1
            });
          }
          const stat = stats.get(office.id)!;
          stat.memberCount++;
          stat.members.push(member);
          stat.needsRotation = stat.memberCount > office.capacity;
          stat.shiftsNeeded = Math.ceil(stat.memberCount / office.capacity);
        }
      }
    });

    return Array.from(stats.values());
  };

  const getShiftDistribution = () => {
    const officeStats = getOfficeStats();
    const distribution: {
      office: Office;
      shifts: { label: string; members: TeamMember[]; days: string[] }[];
      needsRotation: boolean;
    }[] = [];

    officeStats.forEach(stat => {
      if (stat.needsRotation) {
        const shiftsNeeded = stat.shiftsNeeded;
        const useMorningAfternoon = shiftsNeeded === 2;
        const shiftLabels = useMorningAfternoon ? ['Mañana', 'Tarde'] : ['A', 'B', 'C', 'D', 'E', 'F'];
        const shifts: { label: string; members: TeamMember[]; days: string[] }[] = [];

        for (let i = 0; i < shiftsNeeded; i++) {
          shifts.push({
            label: shiftLabels[i] || `Turno ${i + 1}`,
            members: [],
            days: []
          });
        }

        // Distribuir miembros
        stat.members.forEach((member, index) => {
          const shiftIndex = index % shiftsNeeded;
          shifts[shiftIndex].members.push(member);
        });

        // Calcular días de trabajo presencial
        const dayNames = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie'];
        shifts.forEach((shift, index) => {
          for (let day = 0; day < 5; day++) {
            if (useMorningAfternoon) {
              shift.days.push(`${dayNames[day]} (${shift.label})`);
            } else if (day % shiftsNeeded === index) {
              shift.days.push(dayNames[day]);
            }
          }
        });

        distribution.push({
          office: stat.office,
          shifts,
          needsRotation: true
        });
      } else {
        distribution.push({
          office: stat.office,
          shifts: [{
            label: 'Único',
            members: stat.members,
            days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie']
          }],
          needsRotation: false
        });
      }
    });

    return distribution;
  };

  const formatDate = (dateStr: string) => {
    // Soluciona el problema de Timezone (UTC-5): un string ISO "YYYY-MM-DD" se vuelve el día anterior en zona local
    const [year, month, day] = dateStr.split('-');
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
  };

  const getMemberById = (id: string) => members.find(m => m.id === id);
  const getOfficeById = (id: string) => offices.find(o => o.id === id);

  const exportSchedule = () => {
    const schedulesByDate = getSchedulesByDate();
    let csvContent = "Fecha,Miembro,Rol,Oficina,Ubicación,Modo,Turno,Hora Inicio,Hora Fin\n";

    schedulesByDate.forEach(([date, daySchedules]) => {
      daySchedules.forEach(schedule => {
        const member = getMemberById(schedule.memberId);
        const office = getOfficeById(schedule.officeId);
        csvContent += `${date},${member?.name},${member?.role},${office?.name},${office?.location},${schedule.workMode || 'presencial'},${schedule.shift || 'N/A'},${schedule.startTime},${schedule.endTime}\n`;
      });
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `horarios_rotacion_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Exportación completada");
  };

  const schedulesByDate = getSchedulesByDate();
  const officeStats = getOfficeStats();
  const shiftDistribution = getShiftDistribution();
  const membersWithoutOffice = members.filter(m => !m.officeId);
  const officesOverCapacity = officeStats.filter(s => s.needsRotation);
  const membersWithoutAvailability = getMembersWithoutAvailability();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Generador de Horarios con Rotación</h2>
        <p className="text-muted-foreground">
          Sistema inteligente de turnos para gestionar aforos sobrepasados
        </p>
      </div>

      {membersWithoutOffice.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Hay {membersWithoutOffice.length} miembro(s) sin oficina asignada.
          </AlertDescription>
        </Alert>
      )}

      {membersWithoutAvailability.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-orange-200 bg-orange-50 dark:bg-orange-950 dark:border-orange-800">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UserX className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  <CardTitle className="text-lg text-orange-900 dark:text-orange-100">
                    Miembros sin disponibilidad configurada
                  </CardTitle>
                </div>
                <Badge variant="outline" className="border-orange-300 text-orange-700 dark:text-orange-300">
                  {membersWithoutAvailability.length} {membersWithoutAvailability.length === 1 ? 'miembro' : 'miembros'}
                </Badge>
              </div>
              <CardDescription className="text-orange-700 dark:text-orange-300">
                Los siguientes miembros no podrán ser asignados a horarios hasta que configuren su disponibilidad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence>
                  {membersWithoutAvailability.map((member, index) => (
                    <motion.div
                      key={member.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-900 rounded-lg border border-orange-200 dark:border-orange-800"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-gray-900 dark:text-gray-100">
                          {member.name}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {member.role}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => notifyMember(member)}
                        className="ml-2 text-orange-600 hover:text-orange-700 hover:bg-orange-100 dark:hover:bg-orange-900"
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-orange-200 dark:border-orange-800">
                <Button
                  onClick={notifyAllWithoutAvailability}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-900"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notificar a todos
                </Button>
                <p className="text-xs text-muted-foreground">
                  Se enviará un recordatorio para que configuren su disponibilidad horaria
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {officesOverCapacity.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Sistema de rotación activado:</strong> {officesOverCapacity.length} oficina(s) requieren turnos rotativos.
            {officesOverCapacity.map(stat => (
              <div key={stat.office.id} className="mt-1">
                • {stat.office.name}: {stat.memberCount} personas → {stat.shiftsNeeded} turnos necesarios
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Turnos</CardTitle>
            <CardDescription>
              Sistema automático de rotación por aforo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {officeStats.map(stat => {
              const percentage = stat.office.capacity > 0 ? (stat.memberCount / stat.office.capacity) * 100 : 0;

              return (
                <div key={stat.office.id} className="space-y-2 pb-3 border-b last:border-0">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{stat.office.name}</span>
                    <div className="flex items-center gap-2">
                      {stat.needsRotation && (
                        <Badge variant="default" className="text-xs">
                          {stat.shiftsNeeded} Turnos
                        </Badge>
                      )}
                      <Badge variant={stat.needsRotation ? "destructive" : "secondary"}>
                        {stat.memberCount}/{stat.office.capacity}
                      </Badge>
                    </div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${stat.needsRotation ? 'bg-orange-500' : 'bg-primary'}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  {stat.needsRotation && (
                    <p className="text-xs text-muted-foreground">
                      Rotación requerida: {Math.ceil(stat.memberCount / stat.shiftsNeeded)} personas por turno
                    </p>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Generador de Horarios</CardTitle>
            <CardDescription>
              Crea horarios con turnos automáticos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="weeks">Número de semanas</Label>
              <Select
                value={selectedWeeks.toString()}
                onValueChange={(value) => setSelectedWeeks(parseInt(value))}
              >
                <SelectTrigger id="weeks">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 semana</SelectItem>
                  <SelectItem value="2">2 semanas</SelectItem>
                  <SelectItem value="3">3 semanas</SelectItem>
                  <SelectItem value="4">4 semanas</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="office-filter">Filtrar por oficina</Label>
              <Select value={selectedOffice} onValueChange={setSelectedOffice}>
                <SelectTrigger id="office-filter">
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="view-mode">Vista</Label>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger id="view-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shifts">Vista por turnos</SelectItem>
                  <SelectItem value="calendar">Vista calendario</SelectItem>
                  <SelectItem value="list">Vista lista</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                onClick={generateSchedulesWithRotation}
                className="flex-1"
                disabled={membersWithoutOffice.length > 0}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Generar con Rotación
              </Button>
              {schedules.length > 0 && (
                <Button variant="outline" onClick={exportSchedule}>
                  <Download className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {schedules.length > 0 && viewMode === 'shifts' && (
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Turnos</CardTitle>
            <CardDescription>
              Organización de equipos y días de trabajo presencial
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {shiftDistribution.map(({ office, shifts, needsRotation }) => (
              <div key={office.id} className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h3 className="font-semibold text-lg">{office.name}</h3>
                  {needsRotation ? (
                    <Badge variant="default">Sistema de rotación activo</Badge>
                  ) : (
                    <Badge variant="secondary">Sin rotación necesaria</Badge>
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {shifts.map(shift => (
                    <Card key={shift.label}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">Turno {shift.label}</CardTitle>
                          <Badge variant="outline">{shift.members.length} personas</Badge>
                        </div>
                        <CardDescription className="text-xs">
                          Días presenciales: {shift.days.join(', ')}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {shift.members.map(member => (
                          <div key={member.id} className="flex items-center justify-between text-sm border-b pb-1 last:border-0">
                            <span className="truncate">{member.name.split(' ')[0]} {member.name.split(' ')[1]?.[0]}.</span>
                            <Badge variant="secondary" className="text-xs">
                              {member.role.split(' ')[0]}
                            </Badge>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {schedules.length > 0 && viewMode === 'calendar' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Horario Semanal
            </CardTitle>
            <CardDescription>
              Vista de cuadrícula con la asignación por colaborador y día
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              {Array.from(new Set(schedules.map(s => s.weekNumber))).sort().map(weekNumber => {
                const weekSchedules = schedules.filter(s => s.weekNumber === weekNumber);
                const weekDates = Array.from(new Set(weekSchedules.map(s => s.date))).sort();
                const weekMemberIds = Array.from(new Set(weekSchedules.map(s => s.memberId)));

                return (
                  <div key={weekNumber} className="mb-8 last:mb-0">
                    <div className="bg-muted/30 border-b px-4 py-3 flex items-center justify-between">
                      <h3 className="font-semibold text-lg">Semana {weekNumber}</h3>
                    </div>
                    <div className="overflow-x-auto pb-4">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent">
                            <TableHead className="min-w-[200px] border-r bg-muted/10 sticky left-0 z-20">Colaborador</TableHead>
                            {weekDates.map(date => (
                              <TableHead key={date} className="text-center min-w-[150px] border-r last:border-0 font-bold bg-muted/10">
                                {formatDate(date)}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {weekMemberIds.map(memberId => {
                            const member = getMemberById(memberId);
                            if (!member) return null;
                            return (
                              <TableRow key={memberId} className="hover:bg-accent/5">
                                <TableCell className="border-r bg-background/50 font-medium sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                  <div className="truncate">{member.name}</div>
                                  <div className="text-[11px] text-muted-foreground font-normal truncate">{member.role}</div>
                                </TableCell>
                                {weekDates.map(date => {
                                  const daySchedule = weekSchedules.find(s => s.date === date && s.memberId === memberId);
                                  return (
                                    <TableCell key={date} className="text-center border-r last:border-0 p-2 align-top transition-colors hover:bg-muted/10">
                                      {daySchedule ? (
                                        <div className={cn(
                                          "flex flex-col items-center justify-center p-2 rounded-lg h-full gap-1.5 border shadow-sm transition-transform hover:scale-[1.02]",
                                          daySchedule.workMode === 'presencial' ? "bg-blue-50/80 border-blue-200 dark:bg-blue-950/40 dark:border-blue-900" : "bg-emerald-50/80 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900"
                                        )}>
                                          <Badge variant={daySchedule.workMode === 'presencial' ? 'default' : 'outline'} className={cn("text-[10px] w-full justify-center shadow-none", daySchedule.workMode === 'presencial' ? "bg-blue-500 hover:bg-blue-600" : "text-emerald-600 border-emerald-400 bg-emerald-50 hover:bg-emerald-100")}>
                                            {daySchedule.workMode === 'presencial' ? <Building className="w-3 h-3 mr-1" /> : <Home className="w-3 h-3 mr-1" />}
                                            {daySchedule.workMode === 'presencial' ? 'Oficina' : 'Remoto'}
                                          </Badge>
                                          <span className="text-[11px] font-bold tracking-tight text-foreground/80">{daySchedule.startTime} - {daySchedule.endTime}</span>
                                          <span className="text-[10px] text-muted-foreground font-medium bg-background px-2 py-0.5 rounded-full shadow-sm border border-border/50">
                                            {(daySchedule.shift || '').includes('Mañana') ? 'Mañana' : (daySchedule.shift || '').includes('Tarde') ? 'Tarde' : `Turno ${daySchedule.shift || 'N/A'}`}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center justify-center h-full min-h-[80px] text-muted-foreground/20 italic text-xs bg-muted/10 rounded-lg">
                                          Sin asignar
                                        </div>
                                      )}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {schedules.length > 0 && viewMode === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>Lista Completa de Asignaciones</CardTitle>
            <CardDescription>
              Todas las asignaciones con información detallada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Miembro</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Oficina</TableHead>
                    <TableHead>Modo</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Horario</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schedulesByDate.flatMap(([date, daySchedules]) =>
                    daySchedules.map((schedule, idx) => {
                      const member = getMemberById(schedule.memberId);
                      const office = getOfficeById(schedule.officeId);
                      return (
                        <TableRow key={`${date}-${idx}`}>
                          <TableCell>{formatDate(date)}</TableCell>
                          <TableCell className="font-medium">{member?.name}</TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {member?.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{office?.name}</TableCell>
                          <TableCell>
                            {schedule.workMode === 'presencial' ? (
                              <Badge variant="default" className="gap-1 text-xs">
                                <Building className="h-3 w-3" />
                                Presencial
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                <Home className="h-3 w-3" />
                                Remoto
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {schedule.shift}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {schedule.startTime} - {schedule.endTime}
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
      )}

      {schedules.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-2">
              No hay horarios generados.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              El sistema creará automáticamente turnos rotativos para oficinas sobrepasadas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}