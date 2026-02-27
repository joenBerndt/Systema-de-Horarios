import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Plus, Video, Clock, Users, Trash2 } from "lucide-react";
import { DailyMeeting, ScrumTeam } from "../types";
import { Badge } from "./ui/badge";

interface DailyCalendarProps {
  dailies: DailyMeeting[];
  teams: ScrumTeam[];
  onAddDaily: (daily: Omit<DailyMeeting, 'id'>) => void;
  onDeleteDaily: (id: string) => void;
}

export function DailyCalendar({ dailies, teams, onAddDaily, onDeleteDaily }: DailyCalendarProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    teamId: '',
    date: '',
    time: '09:00',
    duration: 15,
    attendees: [] as string[]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddDaily(formData);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      teamId: '',
      date: '',
      time: '09:00',
      duration: 15,
      attendees: []
    });
    setIsDialogOpen(false);
  };

  const handleTeamChange = (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    setFormData({
      ...formData,
      teamId,
      time: team?.dailyTime || '09:00',
      attendees: team?.members || []
    });
  };

  const getDailiesByDate = () => {
    const dailiesByDate = new Map<string, DailyMeeting[]>();
    dailies.forEach(daily => {
      if (!dailiesByDate.has(daily.date)) {
        dailiesByDate.set(daily.date, []);
      }
      dailiesByDate.get(daily.date)?.push(daily);
    });

    return Array.from(dailiesByDate.entries()).sort((a, b) =>
      new Date(a[0]).getTime() - new Date(b[0]).getTime()
    );
  };

  const getUpcomingDailies = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dailies
      .filter(daily => new Date(daily.date) >= today)
      .sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return a.time.localeCompare(b.time);
      });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const getTeamById = (id: string) => teams.find(t => t.id === id);

  const generateWeeklyDailies = () => {
    const newDailies: Omit<DailyMeeting, 'id'>[] = [];
    const today = new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));

    teams.forEach(team => {
      for (let day = 0; day < 5; day++) {
        const currentDate = new Date(monday);
        currentDate.setDate(monday.getDate() + day);
        const dateStr = currentDate.toISOString().split('T')[0];

        newDailies.push({
          teamId: team.id,
          date: dateStr,
          time: team.dailyTime || '09:00',
          duration: 15,
          attendees: team.members
        });
      }
    });

    newDailies.forEach(daily => onAddDaily(daily));
  };

  const upcomingDailies = getUpcomingDailies();
  const dailiesByDate = getDailiesByDate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Calendario de Dailies</h2>
          <p className="text-muted-foreground">
            Programa y gestiona las reuniones diarias de los equipos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateWeeklyDailies}>
            <Clock className="mr-2 h-4 w-4" />
            Generar Semana
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Agendar Daily
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar Daily Meeting</DialogTitle>
                <DialogDescription>
                  Programa una reunión diaria para un equipo
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team">Equipo</Label>
                  <Select
                    value={formData.teamId}
                    onValueChange={handleTeamChange}
                  >
                    <SelectTrigger id="team">
                      <SelectValue placeholder="Selecciona un equipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(team => (
                        <SelectItem key={team.id} value={team.id}>
                          {team.name} ({team.members.length} miembros)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Fecha</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="time">Hora</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duración (min)</Label>
                    <Select
                      value={formData.duration.toString()}
                      onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
                    >
                      <SelectTrigger id="duration">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutos</SelectItem>
                        <SelectItem value="30">30 minutos</SelectItem>
                        <SelectItem value="45">45 minutos</SelectItem>
                        <SelectItem value="60">60 minutos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Agendar
                  </Button>
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Próximas Reuniones
            </CardTitle>
            <CardDescription>
              {upcomingDailies.length} dailies programadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingDailies.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay dailies próximas programadas
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingDailies.slice(0, 5).map(daily => {
                  const team = getTeamById(daily.teamId);
                  return (
                    <div key={daily.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium text-sm">{team?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(daily.date)}
                        </p>
                        <div className="flex items-center gap-2 text-xs">
                          <Clock className="h-3 w-3" />
                          <span>{daily.time} ({daily.duration} min)</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <Users className="h-3 w-3" />
                          <span>{daily.attendees.length} participantes</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteDaily(daily.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Calendario de Dailies</CardTitle>
            <CardDescription>
              Vista cronológica de todas las reuniones
            </CardDescription>
          </CardHeader>
          <CardContent>
            {dailiesByDate.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay dailies programadas
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {dailiesByDate.map(([date, dayDailies]) => (
                  <div key={date} className="space-y-2">
                    <div className="font-medium text-sm border-b pb-1">
                      {formatDate(date)}
                    </div>
                    <div className="space-y-2">
                      {dayDailies.map(daily => {
                        const team = getTeamById(daily.teamId);
                        return (
                          <div key={daily.id} className="flex items-center justify-between p-2 bg-secondary/50 rounded">
                            <div>
                              <p className="text-sm font-medium">{team?.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {daily.time} - {daily.duration}min
                              </p>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {daily.attendees.length} asistentes
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {teams.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Configuración de Equipos</CardTitle>
            <CardDescription>
              Horarios predeterminados de daily por equipo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {teams.map(team => (
                <div key={team.id} className="border rounded-lg p-4 space-y-2">
                  <p className="font-medium">{team.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Daily a las {team.dailyTime || 'No definido'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{team.members.length} miembros</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
