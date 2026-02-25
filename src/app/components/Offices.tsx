import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Plus, Building2, Users, MapPin, Edit, Trash2, AlertCircle } from "lucide-react";
import { Office, TeamMember } from "../types";
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";

interface OfficesProps {
  offices: Office[];
  members: TeamMember[];
  onAddOffice: (office: Omit<Office, 'id' | 'currentOccupancy'>) => void;
  onUpdateOffice: (id: string, office: Partial<Office>) => void;
  onDeleteOffice: (id: string) => void;
}

export function Offices({ offices, members, onAddOffice, onUpdateOffice, onDeleteOffice }: OfficesProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOffice, setEditingOffice] = useState<Office | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    capacity: 0,
    location: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOffice) {
      onUpdateOffice(editingOffice.id, formData);
    } else {
      onAddOffice(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', capacity: 0, location: '' });
    setEditingOffice(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (office: Office) => {
    setEditingOffice(office);
    setFormData({
      name: office.name,
      capacity: office.capacity,
      location: office.location
    });
    setIsDialogOpen(true);
  };

  const getMembersInOffice = (officeId: string) => {
    return members.filter(m => m.officeId === officeId);
  };

  const getOccupancyColor = (occupancy: number, capacity: number) => {
    const percentage = capacity > 0 ? (occupancy / capacity) * 100 : 0;
    if (percentage > 100) return 'text-red-600';
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const officesOverCapacity = offices.filter(o => o.currentOccupancy > o.capacity);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestión de Oficinas</h2>
          <p className="text-muted-foreground">
            Administra los espacios disponibles y sus aforos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingOffice(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Agregar Oficina
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingOffice ? 'Editar Oficina' : 'Agregar Nueva Oficina'}</DialogTitle>
              <DialogDescription>
                {editingOffice ? 'Actualiza la información de la oficina' : 'Define un nuevo espacio de trabajo'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre de la oficina</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Oficina Principal - Piso 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Ej: Edificio A, Piso 1"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacidad (aforo)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) || 0 })}
                  placeholder="Ej: 15"
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingOffice ? 'Actualizar' : 'Agregar'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {officesOverCapacity.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>{officesOverCapacity.length} oficina(s) sobrepasan su capacidad:</strong>
            {officesOverCapacity.map(office => (
              <div key={office.id} className="mt-1">
                • {office.name}: {office.currentOccupancy}/{office.capacity} personas
              </div>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {offices.map((office) => {
          const officeMembers = getMembersInOffice(office.id);
          const occupancyPercentage = office.capacity > 0 
            ? Math.round((office.currentOccupancy / office.capacity) * 100) 
            : 0;

          return (
            <Card key={office.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{office.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(office)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteOffice(office.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {office.location}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      Ocupación
                    </span>
                    <span className={getOccupancyColor(office.currentOccupancy, office.capacity)}>
                      {office.currentOccupancy}/{office.capacity}
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ width: `${occupancyPercentage}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {occupancyPercentage}% de capacidad utilizada
                  </p>
                </div>

                {officeMembers.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Miembros asignados:</p>
                    <div className="flex flex-wrap gap-1">
                      {officeMembers.slice(0, 5).map(member => (
                        <Badge key={member.id} variant="secondary" className="text-xs">
                          {member.name}
                        </Badge>
                      ))}
                      {officeMembers.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{officeMembers.length - 5} más
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Espacios disponibles</span>
                    <span className="font-medium">
                      {office.capacity - office.currentOccupancy}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {offices.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No hay oficinas registradas. Agrega la primera oficina para comenzar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}