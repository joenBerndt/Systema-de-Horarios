import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Plus, Users, UserCircle, Crown, Trash2, Edit } from "lucide-react";
import { ScrumTeam, TeamMember } from "../types";
import { Badge } from "./ui/badge";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface ScrumTeamsProps {
  teams: ScrumTeam[];
  members: TeamMember[];
  onAddTeam: (team: Omit<ScrumTeam, 'id'>) => void;
  onUpdateTeam: (id: string, team: Partial<ScrumTeam>) => void;
  onDeleteTeam: (id: string) => void;
}

export function ScrumTeams({ teams, members, onAddTeam, onUpdateTeam, onDeleteTeam }: ScrumTeamsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<ScrumTeam | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    members: [] as string[],
    scrumMaster: '',
    productOwner: '',
    dailyTime: '09:00'
  });

  const scrumMasters = members.filter(m => m.role === 'Scrum Master');
  const productOwners = members.filter(m => m.role === 'Product Owner');
  const availableMembers = members.filter(m => 
    m.role !== 'Scrum Master' && m.role !== 'Product Owner'
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTeam) {
      onUpdateTeam(editingTeam.id, formData);
    } else {
      onAddTeam(formData);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      members: [], 
      scrumMaster: '', 
      productOwner: '', 
      dailyTime: '09:00' 
    });
    setEditingTeam(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (team: ScrumTeam) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      members: team.members,
      scrumMaster: team.scrumMaster || '',
      productOwner: team.productOwner || '',
      dailyTime: team.dailyTime || '09:00'
    });
    setIsDialogOpen(true);
  };

  const toggleMember = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      members: prev.members.includes(memberId)
        ? prev.members.filter(id => id !== memberId)
        : [...prev.members, memberId]
    }));
  };

  const getMemberById = (id: string) => members.find(m => m.id === id);

  const getTeamRoleDistribution = (team: ScrumTeam) => {
    const distribution: Record<string, number> = {};
    team.members.forEach(memberId => {
      const member = getMemberById(memberId);
      if (member) {
        distribution[member.role] = (distribution[member.role] || 0) + 1;
      }
    });
    return distribution;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Equipos Scrum</h2>
          <p className="text-muted-foreground">
            Crea y administra equipos de desarrollo ágil
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingTeam(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Crear Equipo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTeam ? 'Editar Equipo' : 'Crear Nuevo Equipo Scrum'}</DialogTitle>
              <DialogDescription>
                {editingTeam ? 'Actualiza la configuración del equipo' : 'Configura un nuevo equipo de desarrollo'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Nombre del equipo</Label>
                <Input
                  id="team-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ej: Equipo Alpha"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="scrum-master">Scrum Master</Label>
                <Select 
                  value={formData.scrumMaster} 
                  onValueChange={(value) => setFormData({ ...formData, scrumMaster: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un Scrum Master" />
                  </SelectTrigger>
                  <SelectContent>
                    {scrumMasters.map(sm => (
                      <SelectItem key={sm.id} value={sm.id}>{sm.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-owner">Product Owner</Label>
                <Select 
                  value={formData.productOwner} 
                  onValueChange={(value) => setFormData({ ...formData, productOwner: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un Product Owner" />
                  </SelectTrigger>
                  <SelectContent>
                    {productOwners.map(po => (
                      <SelectItem key={po.id} value={po.id}>{po.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="daily-time">Hora del Daily</Label>
                <Input
                  id="daily-time"
                  type="time"
                  value={formData.dailyTime}
                  onChange={(e) => setFormData({ ...formData, dailyTime: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Miembros del equipo ({formData.members.length} seleccionados)</Label>
                <div className="border rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
                  {availableMembers.map(member => (
                    <div key={member.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`member-${member.id}`}
                        checked={formData.members.includes(member.id)}
                        onCheckedChange={() => toggleMember(member.id)}
                      />
                      <label
                        htmlFor={`member-${member.id}`}
                        className="flex-1 text-sm cursor-pointer flex items-center justify-between"
                      >
                        <span>{member.name}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {member.role}
                        </Badge>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingTeam ? 'Actualizar' : 'Crear Equipo'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {teams.map((team) => {
          const scrumMaster = team.scrumMaster ? getMemberById(team.scrumMaster) : null;
          const productOwner = team.productOwner ? getMemberById(team.productOwner) : null;
          const roleDistribution = getTeamRoleDistribution(team);

          return (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{team.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(team)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteTeam(team.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  {team.members.length} miembros • Daily a las {team.dailyTime || 'No definido'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {scrumMaster && (
                  <div className="flex items-center gap-2 text-sm">
                    <Crown className="h-4 w-4 text-yellow-600" />
                    <span className="text-muted-foreground">Scrum Master:</span>
                    <span className="font-medium">{scrumMaster.name}</span>
                  </div>
                )}

                {productOwner && (
                  <div className="flex items-center gap-2 text-sm">
                    <UserCircle className="h-4 w-4 text-blue-600" />
                    <span className="text-muted-foreground">Product Owner:</span>
                    <span className="font-medium">{productOwner.name}</span>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Distribución de roles:</p>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(roleDistribution).map(([role, count]) => (
                      <Badge key={role} variant="outline" className="text-xs">
                        {role}: {count}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Miembros:</p>
                  <div className="flex flex-wrap gap-1">
                    {team.members.slice(0, 8).map(memberId => {
                      const member = getMemberById(memberId);
                      return member ? (
                        <Badge key={member.id} variant="secondary" className="text-xs">
                          {member.name}
                        </Badge>
                      ) : null;
                    })}
                    {team.members.length > 8 && (
                      <Badge variant="outline" className="text-xs">
                        +{team.members.length - 8} más
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {teams.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">
              No hay equipos creados. Crea el primer equipo Scrum para comenzar.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
