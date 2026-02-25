import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Shield, Users, Mail, User as UserIcon, Trash2, Edit, Plus } from "lucide-react";
import { User, UserRole } from "../types";
import { Badge } from "./ui/badge";

interface UserManagementProps {
    users: User[];
    currentUser: User;
    onAddUser: (user: Omit<User, 'id' | 'createdAt'>) => void;
    onUpdateUser: (id: string, user: Partial<User>) => void;
    onDeleteUser: (id: string) => void;
}

export function UserManagement({ users, currentUser, onAddUser, onUpdateUser, onDeleteUser }: UserManagementProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'user' as UserRole
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingUser) {
            onUpdateUser(editingUser.id, formData);
        } else {
            onAddUser(formData);
        }
        resetForm();
    };

    const resetForm = () => {
        setFormData({ name: '', email: '', username: '', password: '', role: 'user' });
        setEditingUser(null);
        setIsDialogOpen(false);
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.email,
            username: user.username,
            password: user.password,
            role: user.role
        });
        setIsDialogOpen(true);
    };

    const getRoleBadge = (role: UserRole) => {
        switch (role) {
            case 'admin-master':
                return <Badge variant="destructive" className="text-xs">Master</Badge>;
            case 'admin':
                return <Badge variant="default" className="text-xs">Admin</Badge>;
            default:
                return <Badge variant="secondary" className="text-xs">Usuario</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Gestión de Usuarios</h2>
                    <p className="text-muted-foreground">
                        Administra las cuentas de acceso y sus niveles de permiso
                    </p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={() => setEditingUser(null)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Usuario
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
                            <DialogDescription>
                                {editingUser ? 'Modifica los permisos o datos de acceso' : 'Crea una cuenta para que un administrador o personal ingrese al sistema'}
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nombre Completo</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Juan Pérez"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">Correo Electrónico</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Ej: juan@empresa.com"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="username">Usuario (Login)</Label>
                                    <Input
                                        id="username"
                                        value={formData.username}
                                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                        placeholder="Ej: jperez"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="***"
                                        required={!editingUser}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="role">Nivel de Permiso (Rol)</Label>
                                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val as UserRole })}>
                                    <SelectTrigger className="z-[200]">
                                        <SelectValue placeholder="Selecciona un rol" />
                                    </SelectTrigger>
                                    <SelectContent className="z-[200]">
                                        <SelectItem value="user">Usuario (Mínimo acceso)</SelectItem>
                                        <SelectItem value="admin">Administrador (Acceso a gestión)</SelectItem>
                                        <SelectItem value="admin-master">Admin Master (Acceso completo)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" className="flex-1">
                                    {editingUser ? 'Actualizar' : 'Crear Cuenta'}
                                </Button>
                                <Button type="button" variant="outline" onClick={resetForm}>
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {users.map((user) => (
                    <Card key={user.id} className="relative overflow-hidden">
                        {user.id === currentUser.id && (
                            <div className="absolute top-0 right-0 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-bl-lg">
                                Tú
                            </div>
                        )}
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                        <UserIcon className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{user.name}</CardTitle>
                                        <CardDescription className="text-xs">@{user.username}</CardDescription>
                                    </div>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Mail className="h-4 w-4" />
                                    <span className="truncate">{user.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Shield className="h-4 w-4" />
                                    <span>Rol:</span>
                                    {getRoleBadge(user.role)}
                                </div>
                                <div className="pt-3 border-t flex justify-end gap-2 mt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleEdit(user)}
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Editar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="text-destructive hover:bg-destructive hover:text-white"
                                        disabled={user.role === 'admin-master' || user.id === currentUser.id}
                                        onClick={() => {
                                            if (window.confirm(`¿Estás seguro de eliminar a ${user.name}?`)) {
                                                onDeleteUser(user.id);
                                            }
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Eliminar
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
