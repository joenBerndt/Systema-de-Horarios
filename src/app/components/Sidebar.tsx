import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  UserCircle,
  LogOut,
  Menu,
  X,
  FolderKanban,
  Shield,
  ChevronRight,
  Clock
} from "lucide-react";
import { User } from "../types";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  currentUser: User;
}

export function Sidebar({ currentView, onNavigate, onLogout, currentUser }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true); // Default to true, update in useEffect for safety

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    };

    // Initial call
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: false, memberVisible: true },
    { id: 'profile', label: 'Mi Perfil', icon: UserCircle, adminOnly: false, memberVisible: true },
    { id: 'members', label: 'Miembros', icon: Users, adminOnly: true, memberVisible: false },
    { id: 'offices', label: 'Oficinas', icon: Building2, adminOnly: true, memberVisible: false },
    { id: 'teams', label: 'Mi Equipo', icon: UserCircle, adminOnly: false, memberVisible: true },
    { id: 'projects', label: 'Proyectos', icon: FolderKanban, adminOnly: false, memberVisible: true },
    { id: 'schedules', label: 'Horarios', icon: Calendar, adminOnly: false, memberVisible: true },
    { id: 'availability', label: 'Mi Disponibilidad', icon: Clock, adminOnly: false, memberVisible: true },
  ];

  const canAccess = (item: typeof menuItems[0]) => {
    // Si es un usuario miembro
    if (currentUser.role === 'user') {
      return item.memberVisible;
    }
    // Si es admin o admin-master
    if (!item.adminOnly) return true;
    return currentUser.role === 'admin' || currentUser.role === 'admin-master';
  };

  const getRoleBadge = () => {
    switch (currentUser.role) {
      case 'admin-master':
        return <Badge variant="destructive" className="text-xs">Master</Badge>;
      case 'admin':
        return <Badge variant="default" className="text-xs">Admin</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">Usuario</Badge>;
    }
  };

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b z-30 lg:hidden flex items-center justify-between px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm truncate">Sistema Gestión</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 h-[100dvh] bg-card border-r transform transition-transform duration-200 ease-in-out ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
          } lg:translate-x-0 lg:shadow-none`}
      >
        <div className="flex flex-col h-full min-h-0">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg">Sistema Gestión</h2>
                <p className="text-xs text-muted-foreground">v1.0.0</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b bg-muted/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{currentUser.name}</p>
                <p className="text-xs text-muted-foreground truncate">{currentUser.email}</p>
              </div>
            </div>
            <div className="mt-2">
              {getRoleBadge()}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto min-h-0">
            <div className="space-y-1">
              {menuItems.filter(canAccess).map((item) => {
                const Icon = item.icon;
                const isActive = currentView === item.id;

                return (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className={`w-full justify-start ${isActive ? 'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    onClick={() => {
                      onNavigate(item.id);
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                    {isActive && <ChevronRight className="ml-auto h-4 w-4" />}
                  </Button>
                );
              })}
            </div>

            {currentUser.role === 'admin-master' && (
              <>
                <Separator className="my-4" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground px-3 mb-2">
                    ADMINISTRACIÓN
                  </p>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start ${currentView === 'users-admin' ? 'bg-primary/15 text-primary font-semibold hover:bg-primary/20 hover:text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    onClick={() => {
                      onNavigate('users-admin');
                      if (window.innerWidth < 1024) setIsOpen(false);
                    }}
                  >
                    <Shield className="mr-3 h-4 w-4" />
                    Gestión de Usuarios
                  </Button>
                </div>
              </>
            )}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t">
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={onLogout}
            >
              <LogOut className="mr-3 h-4 w-4" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}