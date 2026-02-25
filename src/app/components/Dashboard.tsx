import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Users, Building2, Calendar, UserCircle, AlertCircle } from "lucide-react";
import { TeamMember, Office, ScrumTeam } from "../types";
import { Alert, AlertDescription } from "./ui/alert";

interface DashboardProps {
  members: TeamMember[];
  offices: Office[];
  teams: ScrumTeam[];
}

export function Dashboard({ members, offices, teams }: DashboardProps) {
  const totalCapacity = offices.reduce((sum, office) => sum + office.capacity, 0);
  const totalOccupancy = offices.reduce((sum, office) => sum + office.currentOccupancy, 0);
  const membersWithoutOffice = members.filter(m => !m.officeId);
  const officesOverCapacity = offices.filter(o => o.currentOccupancy > o.capacity);

  const roleStats = members.reduce((acc, member) => {
    acc[member.role] = (acc[member.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const employmentStats = members.reduce((acc, member) => {
    acc[member.employmentType] = (acc[member.employmentType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const specialtyStats = members.reduce((acc, member) => {
    acc[member.specialty] = (acc[member.specialty] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgAge = members.length > 0
    ? Math.round(members.reduce((sum, m) => sum + m.age, 0) / members.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Vista general del sistema de gestión de horarios y equipos
        </p>
      </div>

      {membersWithoutOffice.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>¡Atención!</strong> Hay {membersWithoutOffice.length} miembro(s) sin oficina asignada.
            Asígnalos en la sección de Miembros para poder generar horarios.
          </AlertDescription>
        </Alert>
      )}

      {officesOverCapacity.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>¡Sobrecapacidad!</strong> {officesOverCapacity.length} oficina(s) exceden su aforo máximo.
            El sistema generará automáticamente turnos rotativos.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm hover:shadow-md transition-shadow duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Miembros
            </CardTitle>
            <div className="p-2 bg-primary/10 rounded-xl">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{members.length}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {Object.keys(roleStats).length} roles diferentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Oficinas
            </CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-xl">
              <Building2 className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{offices.length}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {totalCapacity} espacios totales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Equipos Scrum
            </CardTitle>
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <UserCircle className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{teams.length}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              Equipos activos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ocupación
            </CardTitle>
            <div className="p-2 bg-amber-500/10 rounded-xl">
              <Calendar className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{totalOccupancy}/{totalCapacity}</div>
            <p className="text-[10px] md:text-xs text-muted-foreground">
              {totalCapacity > 0 ? Math.round((totalOccupancy / totalCapacity) * 100) : 0}% de capacidad
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Rol</CardTitle>
            <CardDescription>
              Cantidad de miembros por cada rol profesional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(roleStats).map(([role, count]) => (
                <div key={role} className="flex items-center justify-between">
                  <span className="text-sm">{role}</span>
                  <span className="font-medium">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Oficinas</CardTitle>
            <CardDescription>
              Capacidad y ocupación actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {offices.map(office => {
                const percentage = office.capacity > 0 ? (office.currentOccupancy / office.capacity) * 100 : 0;
                const isOverCapacity = office.currentOccupancy > office.capacity;
                return (
                  <div key={office.id} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{office.name}</span>
                      <span className={isOverCapacity ? "text-red-600 font-semibold" : "text-muted-foreground"}>
                        {office.currentOccupancy}/{office.capacity}
                      </span>
                    </div>
                    <div className="h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${isOverCapacity ? 'bg-red-600' : 'bg-primary'}`}
                        style={{
                          width: `${Math.min(percentage, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tipos de Empleo</CardTitle>
            <CardDescription>
              Distribución por tipo de contratación
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(employmentStats)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="text-sm">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Especialidades Técnicas</CardTitle>
            <CardDescription>
              Tecnologías y áreas de especialización
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(specialtyStats)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([specialty, count]) => (
                  <div key={specialty} className="flex items-center justify-between">
                    <span className="text-sm">{specialty}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 md:gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Edad Promedio</CardTitle>
            <CardDescription>
              Promedio de edad del equipo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-4xl font-bold">{avgAge} años</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Miembros con GitHub</CardTitle>
            <CardDescription>
              Usuarios con cuenta registrada
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-4xl font-bold">
              {members.filter(m => m.githubUsername).length}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              {members.length > 0 ? Math.round((members.filter(m => m.githubUsername).length / members.length) * 100) : 0}% del equipo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Contactos de Emergencia</CardTitle>
            <CardDescription>
              Miembros con contacto registrado
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-4xl font-bold">
              {members.filter(m => m.emergencyContact).length}
            </div>
            <p className="text-[10px] md:text-xs text-muted-foreground mt-1">
              {members.length > 0 ? Math.round((members.filter(m => m.emergencyContact).length / members.length) * 100) : 0}% del equipo
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}