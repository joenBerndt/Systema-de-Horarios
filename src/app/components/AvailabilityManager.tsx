import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { MemberAvailability, DayOfWeek, AvailabilityStatus } from "../types";
import { Clock, Save, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { motion } from "motion/react";
import { cn } from "./ui/utils";

interface AvailabilityManagerProps {
  memberId: string;
  currentAvailability?: MemberAvailability;
  onSave: (availability: MemberAvailability) => void;
  readOnly?: boolean;
}

// Horarios de trabajo (9 AM a 6 PM)
const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00'
];

const WEEKDAYS: { key: DayOfWeek; label: string }[] = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' }
];

const STATUS_CONFIG: Record<AvailabilityStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
}> = {
  available: {
    label: 'Disponible',
    color: 'bg-green-500',
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-300 dark:border-green-700',
    textColor: 'text-green-700 dark:text-green-300'
  },
  'in-class': {
    label: 'En Clases',
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-300 dark:border-blue-700',
    textColor: 'text-blue-700 dark:text-blue-300'
  },
  busy: {
    label: 'Ocupado',
    color: 'bg-yellow-500',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-300 dark:border-yellow-700',
    textColor: 'text-yellow-700 dark:text-yellow-300'
  },
  unavailable: {
    label: 'No Disponible',
    color: 'bg-red-500',
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-300 dark:border-red-700',
    textColor: 'text-red-700 dark:text-red-300'
  }
};

type CellStatus = AvailabilityStatus | null;

export function AvailabilityManager({
  memberId,
  currentAvailability,
  onSave,
  readOnly = false
}: AvailabilityManagerProps) {
  // Estado: día -> hora -> status
  const [schedule, setSchedule] = useState<Record<DayOfWeek, Record<string, CellStatus>>>(() => {
    const initial: Record<DayOfWeek, Record<string, CellStatus>> = {
      monday: {},
      tuesday: {},
      wednesday: {},
      thursday: {},
      friday: {},
      saturday: {},
      sunday: {}
    };

    // Cargar disponibilidad actual si existe
    if (currentAvailability) {
      currentAvailability.availability.forEach(dayData => {
        if (dayData.isAvailable && dayData.timeRanges) {
          dayData.timeRanges.forEach(range => {
            // Convertir cada rango en celdas de horario
            const startHour = parseInt(range.start.split(':')[0]);
            const endHour = parseInt(range.end.split(':')[0]);

            for (let hour = startHour; hour < endHour; hour++) {
              const timeKey = `${hour.toString().padStart(2, '0')}:00`;
              if (TIME_SLOTS.includes(timeKey)) {
                initial[dayData.day][timeKey] = range.status;
              }
            }
          });
        }
      });
    }

    return initial;
  });

  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus>('available');
  const [isDragging, setIsDragging] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Estados interactivos del tutorial
  const [tutStep, setTutStep] = useState(1);
  const [tutGrid, setTutGrid] = useState([false, false, false, false]);
  const [tutDragging, setTutDragging] = useState(false);
  const [liveTourStep, setLiveTourStep] = useState(0); // 0=off, 1=status, 2=table, 3=save

  const tutorialKey = `hasSeenAvailabilityTutorialV7_${memberId}`; // Force reset para el drag fluido

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeen = localStorage.getItem(tutorialKey) === 'true';
      if (!hasSeen) {
        setShowTutorial(true);
        setTutStep(1);
        setTutGrid([false, false, false, false]);
      } else {
        setShowTutorial(false);
      }
    }
  }, [memberId, currentAvailability, tutorialKey]);

  const getStatusStats = () => {
    const stats: Record<AvailabilityStatus, number> = {
      available: 0,
      'in-class': 0,
      busy: 0,
      unavailable: 0
    };

    WEEKDAYS.forEach(({ key }) => {
      Object.values(schedule[key]).forEach(status => {
        if (status) {
          stats[status]++;
        }
      });
    });

    return stats;
  };

  const stats = getStatusStats();
  const totalSlots = WEEKDAYS.length * TIME_SLOTS.length;
  const filledSlots = Object.values(stats).reduce((sum, count) => sum + count, 0);
  const fillPercentage = Math.round((filledSlots / totalSlots) * 100);

  useEffect(() => {
    // Si estamos en el paso 2, el usuario ha llenado al menos 3 bloques, y no está arrastrando en este instante, avanza al paso 3
    if (liveTourStep === 2 && filledSlots >= 3 && !isDragging) {
      setLiveTourStep(3);
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      toast.success("¡Muy bien hecho!", {
        description: "Has aprendido a marcar bloques. Ahora terminemos de guardar.",
        icon: "✨"
      });
    }
  }, [liveTourStep, filledSlots, isDragging]);

  const dismissTutorial = () => {
    localStorage.setItem(tutorialKey, 'true');
    setShowTutorial(false);
  };

  const handleCellClick = (day: DayOfWeek, time: string) => {
    if (readOnly) return;

    setSchedule(prev => {
      const newSchedule = { ...prev };
      const currentStatus = newSchedule[day][time];

      // Si ya tiene el estado seleccionado, limpiarlo
      if (currentStatus === selectedStatus) {
        delete newSchedule[day][time];
      } else {
        newSchedule[day][time] = selectedStatus;
      }

      return newSchedule;
    });
    setHasChanges(true);
  };

  const handleCellDragStart = (day: DayOfWeek, time: string) => {
    if (readOnly) return;
    setIsDragging(true);
    handleCellClick(day, time);
  };

  const handleCellDragEnter = (day: DayOfWeek, time: string) => {
    if (readOnly || !isDragging) return;

    setSchedule(prev => {
      const newSchedule = { ...prev };
      newSchedule[day][time] = selectedStatus;
      return newSchedule;
    });
    setHasChanges(true);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleReset = () => {
    setSchedule({
      monday: {},
      tuesday: {},
      wednesday: {},
      thursday: {},
      friday: {},
      saturday: {},
      sunday: {}
    });
    setHasChanges(true);
    toast.info("Horario limpiado", {
      description: "Se ha limpiado tu disponibilidad horaria"
    });
  };

  const handleSave = () => {
    // Convertir el estado de schedule a formato MemberAvailability
    const availability: MemberAvailability = {
      memberId,
      updatedAt: new Date().toISOString(),
      availability: WEEKDAYS.map(({ key }) => {
        const daySchedule = schedule[key];
        const hasAnySlot = Object.keys(daySchedule).length > 0;

        if (!hasAnySlot) {
          return {
            day: key,
            isAvailable: false,
            timeRanges: []
          };
        }

        // Agrupar horas consecutivas con el mismo estado en rangos
        const timeRanges: Array<{ start: string; end: string; status: AvailabilityStatus }> = [];
        const sortedTimes = TIME_SLOTS.filter(time => daySchedule[time]);

        let currentRange: { start: string; status: AvailabilityStatus } | null = null;

        sortedTimes.forEach((time, index) => {
          const status = daySchedule[time];
          if (!status) return;

          const hour = parseInt(time.split(':')[0]);
          const nextTime = sortedTimes[index + 1];
          const nextHour = nextTime ? parseInt(nextTime.split(':')[0]) : null;
          const nextStatus = nextTime ? daySchedule[nextTime] : null;

          if (!currentRange) {
            currentRange = { start: time, status };
          }

          // Si es la última hora O la siguiente hora no es consecutiva O cambia el estado
          if (!nextTime || nextHour !== hour + 1 || nextStatus !== status) {
            const endHour = hour + 1;
            timeRanges.push({
              start: currentRange.start,
              end: `${endHour.toString().padStart(2, '0')}:00`,
              status: currentRange.status
            });
            currentRange = null;
          }
        });

        return {
          day: key,
          isAvailable: true,
          timeRanges
        };
      })
    };

    onSave(availability);
    setHasChanges(false);

    // Si guardan por primera vez, el tutorial ya no debería salir
    localStorage.setItem(tutorialKey, 'true');
    setShowTutorial(false);
    if (liveTourStep === 3) setLiveTourStep(0);

    toast.success("Disponibilidad guardada", {
      description: "Tu horario ha sido actualizado correctamente"
    });
  };

  const getCellStatus = (day: DayOfWeek, time: string): CellStatus => {
    return schedule[day][time] || null;
  };

  return (
    <div className="space-y-6">
      {/* Info Card */}
      {/* Interactive Tutorial Modal Modal */}
      <Dialog open={!readOnly && showTutorial} onOpenChange={setShowTutorial}>
        <DialogContent className="max-w-2xl border-primary/20 shadow-2xl z-[200]">
          <DialogHeader>
            <DialogTitle className="text-3xl text-primary text-center font-bold">¡Aprende haciéndolo!</DialogTitle>
            <DialogDescription className="text-center text-lg pt-2 text-foreground/80">
              Práctica aquí mismo cómo llenar tu horario antes de empezar de verdad.
            </DialogDescription>
          </DialogHeader>

          <div className="my-2 p-6 bg-muted/20 rounded-2xl border border-border/50 shadow-inner">
            {/* Step 1: Click Status */}
            <div className="flex flex-col items-center mb-8">
              <h4 className={cn("text-lg font-medium mb-4 transition-colors flex items-center gap-2", tutStep === 1 ? "text-primary font-bold scale-105" : "text-muted-foreground opacity-60")}>
                <span className={cn("w-6 h-6 rounded-full text-sm flex items-center justify-center text-white", tutStep === 1 ? "bg-primary" : "bg-muted-foreground")}>1</span>
                Paso 1: Selecciona un estado
              </h4>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTutStep(2)}
                className={cn(
                  "px-6 py-3 rounded-lg border-2 flex items-center gap-3 transition-all",
                  tutStep === 1 ? "border-green-400 bg-green-50 shadow-md animate-pulse cursor-pointer" : "cursor-not-allowed",
                  tutStep >= 2 ? "border-green-500 bg-green-100 opacity-100" : (tutStep !== 1 ? "border-gray-200 bg-gray-100 opacity-50" : "")
                )}
                disabled={tutStep !== 1}
              >
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-sm" />
                <span className="font-semibold text-green-700">
                  {tutStep === 1 ? "¡Haz clic aquí!" : "Disponible (Seleccionado)"}
                </span>
              </motion.button>
            </div>

            {/* Step 2: Drag and Paint */}
            <div className="flex flex-col items-center mb-8">
              <h4 className={cn("text-lg font-medium mb-4 transition-colors flex items-center gap-2", tutStep === 2 ? "text-primary font-bold scale-105" : "text-muted-foreground opacity-60")}>
                <span className={cn("w-6 h-6 rounded-full text-sm flex items-center justify-center text-white", tutStep === 2 ? "bg-primary" : "bg-muted-foreground")}>2</span>
                Paso 2: Clic sostenido y arrastra
              </h4>
              <p className="text-sm text-foreground/70 mb-3 text-center">
                La magia está en pintar varios bloques a la vez. ¡Intenta pintar las 4 celdas arrastrando el ratón!
              </p>
              <div
                className={cn("flex gap-1 p-2 border rounded-xl shadow-inner transition-colors", tutStep === 2 ? "bg-card border-primary/30" : "bg-muted/50 border-transparent opacity-60")}
                onMouseLeave={() => setTutDragging(false)}
                onMouseUp={() => setTutDragging(false)}
              >
                {tutGrid.map((isPainted, idx) => (
                  <div
                    key={idx}
                    onMouseDown={() => {
                      if (tutStep >= 2) {
                        setTutDragging(true);
                        const newGrid = [...tutGrid];
                        newGrid[idx] = true;
                        setTutGrid(newGrid);
                        if (newGrid.every(v => v)) setTutStep(3);
                      }
                    }}
                    onMouseEnter={() => {
                      if (tutStep >= 2 && tutDragging) {
                        const newGrid = [...tutGrid];
                        newGrid[idx] = true;
                        setTutGrid(newGrid);
                        if (newGrid.every(v => v)) setTutStep(3);
                      }
                    }}
                    className={cn(
                      "w-16 h-14 rounded-lg cursor-pointer transition-all border-2",
                      isPainted ? "bg-green-50 border-green-400" : "bg-muted hover:bg-muted/80 border-transparent",
                      tutStep === 2 && !isPainted ? "animate-pulse border-primary/30" : ""
                    )}
                  >
                    {isPainted && (
                      <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="w-full h-full flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm" />
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Done */}
            <div className="flex flex-col items-center">
              <h4 className={cn("text-lg font-medium transition-colors flex items-center gap-2", tutStep === 3 ? "text-primary font-bold scale-105" : "text-muted-foreground opacity-60")}>
                <span className={cn("w-6 h-6 rounded-full text-sm flex items-center justify-center text-white", tutStep === 3 ? "bg-primary" : "bg-muted-foreground")}>3</span>
                Paso 3: ¡Listo! Ya eres un experto.
              </h4>
            </div>
          </div>

          <div className="flex flex-col items-center justify-center mt-2 pb-2 relative">
            <Button
              onClick={() => {
                dismissTutorial();
                setLiveTourStep(1);
                toast.info("¡Excelente! Ahora veamos cómo se hace en el formato real.", {
                  icon: "🎉",
                  duration: 5000
                });
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              size="lg"
              className={cn("w-full sm:w-3/4 md:w-2/3 h-14 text-lg font-bold shadow-lg transition-all", tutStep === 3 ? "hover:scale-105 bg-primary text-white animate-bounce" : "opacity-40")}
              disabled={tutStep !== 3}
            >
              ¡Entendido, ir al Sistema Real!
            </Button>
            {tutStep !== 3 && (
              <Button variant="ghost" size="sm" onClick={dismissTutorial} className="mt-4 text-muted-foreground hover:text-foreground underline">
                Prefiero saltar todo el tutorial
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Status Selector */}
      {!readOnly && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative"
        >
          {liveTourStep === 1 && (
            <div className="absolute -top-10 left-6 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold shadow-xl border-2 border-primary-foreground animate-bounce z-50 whitespace-nowrap">
              Paso 1 del tour: Haz clic en cualquier estado abajo ↓
            </div>
          )}
          <Card className={cn("transition-all duration-500", liveTourStep === 1 && "ring-4 ring-primary ring-offset-2")}>
            <CardHeader>
              <CardTitle className="text-lg">Selecciona tu Estado</CardTitle>
              <CardDescription>
                Elige el estado que deseas aplicar al horario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(Object.keys(STATUS_CONFIG) as AvailabilityStatus[]).map((status) => {
                  const config = STATUS_CONFIG[status];
                  const isSelected = selectedStatus === status;

                  return (
                    <motion.button
                      key={status}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedStatus(status);
                        if (liveTourStep === 1) {
                          setLiveTourStep(2);
                          // Scrolea suavemente hacia abajo para mostrar la tabla
                          window.scrollBy({ top: 300, behavior: 'smooth' });
                        }
                      }}
                      className={cn(
                        "p-4 rounded-lg border-2 transition-all text-left",
                        isSelected
                          ? `${config.borderColor} ${config.bgColor} shadow-md`
                          : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700"
                      )}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={cn("w-4 h-4 rounded", config.color)} />
                        <span className={cn(
                          "font-medium text-sm",
                          isSelected ? config.textColor : "text-foreground"
                        )}>
                          {config.label}
                        </span>
                      </div>
                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="text-xs text-muted-foreground"
                        >
                          {stats[status]} horas marcadas
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Schedule Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        {liveTourStep === 2 && (
          <div className="absolute -top-16 left-[10%] bg-primary text-primary-foreground px-6 py-4 rounded-xl font-bold shadow-2xl border-2 border-primary-foreground animate-bounce z-50 whitespace-nowrap flex flex-col items-center gap-2 pointer-events-none">
            <span className="text-xl">Paso 2 del tour: Pinta la tabla de colores</span>
            <span className="text-base font-normal bg-black/20 px-4 py-2 rounded-lg flex items-center gap-2">
              {filledSlots === 0 && !isDragging && (
                <>Haz clic <strong>sostenido</strong> encima de cualquier celda vacía ahora mismo ↓</>
              )}
              {filledSlots === 0 && isDragging && (
                <>¡Eso es! Ahora <strong>sin soltar el botón</strong>, mueve el ratón ↓</>
              )}
              {filledSlots > 0 && filledSlots < 3 && isDragging && (
                <>¡Excelente! Sigue arrastrando hacia los lados o abajo para pintar más <span className="font-mono bg-black/30 px-2 rounded ml-1">{filledSlots}/3</span></>
              )}
              {filledSlots > 0 && filledSlots < 3 && !isDragging && (
                <>No terminaste. Vuelve a hacer clic sostenido en una celda para continuar <span className="font-mono bg-black/30 px-2 rounded ml-1">{filledSlots}/3</span></>
              )}
              {filledSlots >= 3 && (
                <>¡Perfecto! Has dominado el arrastre. Suelta el ratón para seguir. <span className="font-mono bg-black/30 px-2 rounded text-xl">🎉</span></>
              )}
            </span>
          </div>
        )}
        <Card className={cn("transition-all duration-500", liveTourStep === 2 && "ring-4 ring-primary ring-offset-2")}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Horario Semanal
                </CardTitle>
                <CardDescription>
                  {readOnly
                    ? "Vista de solo lectura de tu disponibilidad"
                    : "Haz clic o arrastra para marcar tu disponibilidad"}
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-sm">
                {filledSlots}/{totalSlots} bloques ({fillPercentage}%)
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border border-border bg-muted/50 p-2 text-xs font-medium text-center sticky left-0 z-10">
                        Hora
                      </th>
                      {WEEKDAYS.map(({ key, label }) => (
                        <th
                          key={key}
                          className="border border-border bg-muted/50 p-2 text-xs font-medium min-w-[80px]"
                        >
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.map((time, timeIndex) => {
                      const nextTime = TIME_SLOTS[timeIndex + 1] || '18:00';

                      return (
                        <tr key={time}>
                          <td className="border border-border bg-muted/30 p-2 text-xs text-center font-medium sticky left-0 z-10">
                            {time} - {nextTime}
                          </td>
                          {WEEKDAYS.map(({ key }) => {
                            const cellStatus = getCellStatus(key, time);
                            const config = cellStatus ? STATUS_CONFIG[cellStatus] : null;

                            return (
                              <td
                                key={`${key}-${time}`}
                                className="border border-border p-0"
                              >
                                <motion.button
                                  whileHover={!readOnly ? { scale: 1.1 } : {}}
                                  whileTap={!readOnly ? { scale: 0.95 } : {}}
                                  onMouseDown={() => handleCellDragStart(key, time)}
                                  onMouseEnter={() => handleCellDragEnter(key, time)}
                                  onMouseUp={handleDragEnd}
                                  disabled={readOnly}
                                  className={cn(
                                    "w-full h-12 transition-all relative",
                                    cellStatus
                                      ? `${config?.bgColor} ${config?.borderColor} border-2`
                                      : "bg-background hover:bg-muted/50",
                                    !readOnly && "cursor-pointer"
                                  )}
                                >
                                  {cellStatus && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="absolute inset-0 flex items-center justify-center"
                                    >
                                      <div className={cn("w-2 h-2 rounded-full", config?.color)} />
                                    </motion.div>
                                  )}
                                </motion.button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Estadísticas de Disponibilidad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(Object.keys(STATUS_CONFIG) as AvailabilityStatus[]).map((status) => {
                const config = STATUS_CONFIG[status];
                const count = stats[status];
                const percentage = totalSlots > 0 ? Math.round((count / totalSlots) * 100) : 0;

                return (
                  <div key={status} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded", config.color)} />
                      <span className="text-sm font-medium">{config.label}</span>
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">{count}</p>
                      <p className="text-xs text-muted-foreground">
                        {percentage}% del total
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Actions */}
      {!readOnly && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex gap-3 relative mt-12"
        >
          {liveTourStep === 3 && (
            <div className="absolute -top-16 left-0 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold shadow-xl border-2 border-primary-foreground animate-bounce z-50">
              Paso 3 del tour: ¡Casi listo! Guarda tu horario aquí ↓
            </div>
          )}
          <Button
            onClick={handleSave}
            className={cn("flex-1 text-md h-12 transition-all duration-500", liveTourStep === 3 && "ring-4 ring-primary ring-offset-2 bg-green-600 hover:bg-green-700 animate-pulse")}
            disabled={!hasChanges && liveTourStep !== 3}
          >
            <Save className="h-5 w-5 mr-2" />
            Guardar Disponibilidad
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={filledSlots === 0}
            className="h-12"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpiar Todo
          </Button>
        </motion.div>
      )}
    </div>
  );
}