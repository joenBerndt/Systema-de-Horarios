import { useState, useEffect } from 'react';
import { Dashboard } from './components/Dashboard';
import { TeamMembers } from './components/TeamMembers';
import { Offices } from './components/Offices';
import { ScrumTeams } from './components/ScrumTeams';
import { ScheduleGenerator } from './components/ScheduleGenerator';
import { DailyCalendar } from './components/DailyCalendar';
import { Projects } from './components/Projects';
import { Login } from './components/Login';
import { Register } from './components/Register';
import { CompleteProfile } from './components/CompleteProfile';
import { Sidebar } from './components/Sidebar';
import { UserManagement } from './components/UserManagement';
import { MemberDashboard } from './components/MemberDashboard';
import { MemberProfile } from './components/MemberProfile';
import { MemberProjects } from './components/MemberProjects';
import { MemberTeamView } from './components/MemberTeamView';
import { MemberScheduleView } from './components/MemberScheduleView';
import { MemberAvailability } from './components/MemberAvailability';
import { TeamMember, Office, ScrumTeam, Schedule, DailyMeeting, User, Project, MemberAvailability as MemberAvailabilityType } from './types';

import { initialUsers } from './data/initialUsers';
import { Toaster } from './components/ui/sonner';
import { AnimatePresence } from './components/ui/animated-container';

import { ConfirmationDialog } from './components/ui/confirmation-dialog';
import { NotificationToast } from './components/ui/notification-toast';
import { memberService, officeService } from '../api/client';

function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue];
}

function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('app_currentUser', null);
  const [currentMember, setCurrentMember] = useLocalStorage<TeamMember | null>('app_currentMember', null);
  const [users, setUsers] = useLocalStorage<User[]>('app_users', initialUsers);
  const [showRegister, setShowRegister] = useState(false);

  // Notification states
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loginNotification, setLoginNotification] = useState<{
    show: boolean;
    name: string;
    type: 'admin' | 'member';
  }>({ show: false, name: '', type: 'admin' });
  const [logoutNotification, setLogoutNotification] = useState(false);
  const [registerNotification, setRegisterNotification] = useState(false);

  // Google login states
  const [googleData, setGoogleData] = useState<{ email: string; name: string; picture?: string } | null>(null);
  const [showCompleteProfile, setShowCompleteProfile] = useState(false);

  // Application state
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);

  // Real Database Fetching Effect
  useEffect(() => {
    const loadRealData = async () => {
      try {
        console.log("Fetching members and offices from Render PostgreSQL API...");
        const [apiMembers, apiOffices] = await Promise.all([
          memberService.getAll(),
          officeService.getAll()
        ]);

        if (Array.isArray(apiMembers)) {
          setMembers(apiMembers);
        } else {
          setMembers([]);
        }

        if (Array.isArray(apiOffices)) {
          // Calculamos de nuevo la ocupación basado en miembros asignados
          const officesWithOccupancy = apiOffices.map((office: Office) => {
            const currentOccupancy = Array.isArray(apiMembers) ? apiMembers.filter(m => m.officeId === office.id).length : 0;
            return { ...office, currentOccupancy };
          });
          setOffices(officesWithOccupancy);
        } else {
          setOffices([]);
        }
      } catch (error) {
        console.error("No se pudo conectar a la base de datos", error);
        setMembers([]);
        setOffices([]);
      }
    };
    loadRealData();
  }, []);

  const [teams, setTeams] = useLocalStorage<ScrumTeam[]>('app_teams', []);
  const [schedules, setSchedules] = useLocalStorage<Schedule[]>('app_schedules', []);
  const [dailies, setDailies] = useLocalStorage<DailyMeeting[]>('app_dailies', []);
  const [projects, setProjects] = useLocalStorage<Project[]>('app_projects', []);
  const [currentView, setCurrentView] = useState('dashboard');

  // Availability state
  const [memberAvailabilities, setMemberAvailabilities] = useLocalStorage<MemberAvailabilityType[]>('app_availabilities', []);

  // Auth handlers
  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setCurrentMember(null);
    setLoginNotification({ show: true, name: user.name, type: 'admin' });
  };

  const handleMemberLogin = (member: TeamMember) => {
    setCurrentMember(member);
    setCurrentUser(null);
    setLoginNotification({ show: true, name: member.name, type: 'member' });
  };

  const handleRegister = async (memberData: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: crypto.randomUUID()
    };

    // Guardar optimísticamente en UI
    setMembers([...members, newMember]);
    setShowRegister(false);
    setRegisterNotification(true);

    if (newMember.officeId) {
      updateOfficeOccupancy(newMember.officeId, 1);
    }

    // Enviar a la base de datos real (Supabase/Render API)
    try {
      await memberService.create(newMember);
    } catch (error) {
      console.error("Error al registrar en la base de datos:", error);
    }
  };

  const handleGoogleLogin = (data: { email: string; name: string; picture?: string }) => {
    // Check if member already exists by email
    const existingMember = members.find(m => m.email === data.email);

    if (existingMember) {
      if (!existingMember.hasAccess) {
        // You can add logic for denied access if you want, but sticking to standard access here
        alert("Tu cuenta ha sido desactivada. Contacta al administrador.");
        return;
      }
      handleMemberLogin(existingMember);
      return;
    }

    // New member -> Complete profile first
    setGoogleData(data);
    setShowCompleteProfile(true);
    // Temporary login to show the dashboard behind the modal
    const tempMember: TeamMember = {
      id: crypto.randomUUID(),
      name: data.name,
      email: data.email,
      role: 'Frontend Developer',
      employmentType: 'Voluntario',
      specialty: 'React/Next.js',
      birthDate: '',
      address: '',
      city: '',
      phone: '',
      age: 0,
      hasAccess: true,
      joinDate: new Date().toISOString().split('T')[0],
      username: data.email.split('@')[0],
      password: ''
    };
    setCurrentMember(tempMember);
  };

  const handleCompleteProfile = async (memberData: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: crypto.randomUUID()
    };

    setMembers([...members, newMember]);
    setShowCompleteProfile(false);
    setGoogleData(null);
    handleMemberLogin(newMember);

    if (newMember.officeId) {
      updateOfficeOccupancy(newMember.officeId, 1);
    }

    try {
      await memberService.create(newMember);
    } catch (error) {
      console.error("Error al completar perfil en BD:", error);
    }
  };

  const handleLogout = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = () => {
    setCurrentUser(null);
    setCurrentMember(null);
    setCurrentView('dashboard');
    setLogoutNotification(true);
  };

  // User handlers
  const handleAddUser = (userData: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setUsers([...users, newUser]);
  };

  const handleUpdateUser = (id: string, userData: Partial<User>) => {
    setUsers(users.map(u => u.id === id ? { ...u, ...userData } : u));
  };

  const handleDeleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  // Member handlers
  const handleAddMember = async (memberData: Omit<TeamMember, 'id'>) => {
    const newMember: TeamMember = {
      ...memberData,
      id: crypto.randomUUID()
    };
    setMembers([...members, newMember]);

    if (newMember.officeId) {
      updateOfficeOccupancy(newMember.officeId, 1);
    }

    try {
      await memberService.create(newMember);
    } catch (error) {
      console.error("Error al añadir miembro a BD:", error);
    }
  };

  const handleUpdateMember = (id: string, memberData: Partial<TeamMember>) => {
    const oldMember = members.find(m => m.id === id);
    setMembers(members.map(m => m.id === id ? { ...m, ...memberData } : m));

    if (oldMember?.officeId !== memberData.officeId) {
      if (oldMember?.officeId) {
        updateOfficeOccupancy(oldMember.officeId, -1);
      }
      if (memberData.officeId) {
        updateOfficeOccupancy(memberData.officeId, 1);
      }
    }
  };

  const handleDeleteMember = async (id: string) => {
    const member = members.find(m => m.id === id);
    setMembers(members.filter(m => m.id !== id));

    if (member?.officeId) {
      updateOfficeOccupancy(member.officeId, -1);
    }

    setTeams(teams.map(team => ({
      ...team,
      members: team.members.filter(memberId => memberId !== id)
    })));

    // Remove from projects
    setProjects(projects.map(project => ({
      ...project,
      assignedMembers: project.assignedMembers.filter(memberId => memberId !== id)
    })));

    // Call database API to delete member
    try {
      await memberService.delete(id);
    } catch (error) {
      console.error("Error al eliminar miembro en BD:", error);
    }
  };

  // Office handlers
  const handleAddOffice = async (officeData: Omit<Office, 'id' | 'currentOccupancy'>) => {
    const tempId = crypto.randomUUID();
    const newOffice: Office = {
      ...officeData,
      id: tempId,
      currentOccupancy: 0
    };
    setOffices([...offices, newOffice]);

    try {
      const savedOffice = await officeService.create(officeData);
      setOffices(prev => prev.map(o => o.id === tempId ? { ...savedOffice, currentOccupancy: 0 } : o));
    } catch (err) {
      console.error("Error creando oficina", err);
    }
  };

  const handleUpdateOffice = async (id: string, officeData: Partial<Office>) => {
    setOffices(offices.map(o => o.id === id ? { ...o, ...officeData } : o));
    try {
      await officeService.update(id, officeData);
    } catch (err) {
      console.error("Error actualizando oficina", err);
    }
  };

  const handleDeleteOffice = async (id: string) => {
    setOffices(offices.filter(o => o.id !== id));
    setMembers(members.map(m => m.officeId === id ? { ...m, officeId: undefined } : m));
    try {
      await officeService.delete(id);
    } catch (err) {
      console.error("Error eliminando oficina", err);
    }
  };

  const updateOfficeOccupancy = (officeId: string, change: number) => {
    setOffices(prevOffices => prevOffices.map(o =>
      o.id === officeId
        ? { ...o, currentOccupancy: Math.max(0, (o.currentOccupancy || 0) + change) }
        : o
    ));
  };

  // Team handlers
  const handleAddTeam = (teamData: Omit<ScrumTeam, 'id'>) => {
    const newTeam: ScrumTeam = {
      ...teamData,
      id: `team-${Date.now()}`
    };
    setTeams([...teams, newTeam]);

    setMembers(members.map(m =>
      teamData.members.includes(m.id) ? { ...m, teamId: newTeam.id } : m
    ));
  };

  const handleUpdateTeam = (id: string, teamData: Partial<ScrumTeam>) => {
    const oldTeam = teams.find(t => t.id === id);
    setTeams(teams.map(t => t.id === id ? { ...t, ...teamData } : t));

    if (teamData.members) {
      setMembers(members.map(m => {
        if (oldTeam?.members.includes(m.id) && !teamData.members?.includes(m.id)) {
          return { ...m, teamId: undefined };
        }
        if (teamData.members?.includes(m.id)) {
          return { ...m, teamId: id };
        }
        return m;
      }));
    }
  };

  const handleDeleteTeam = (id: string) => {
    setTeams(teams.filter(t => t.id !== id));
    setMembers(members.map(m => m.teamId === id ? { ...m, teamId: undefined } : m));
  };

  // Schedule handlers
  const handleGenerateSchedule = (newSchedules: Omit<Schedule, 'id'>[]) => {
    const schedulesWithIds = newSchedules.map(s => ({
      ...s,
      id: `schedule-${Date.now()}-${Math.random()}`
    }));
    setSchedules(schedulesWithIds);
  };

  // Daily handlers
  const handleAddDaily = (dailyData: Omit<DailyMeeting, 'id'>) => {
    const newDaily: DailyMeeting = {
      ...dailyData,
      id: `daily-${Date.now()}-${Math.random()}`
    };
    setDailies([...dailies, newDaily]);
  };

  const handleDeleteDaily = (id: string) => {
    setDailies(dailies.filter(d => d.id !== id));
  };

  // Project handlers
  const handleAddProject = (projectData: Omit<Project, 'id'>) => {
    const newProject: Project = {
      ...projectData,
      id: `project-${Date.now()}`
    };
    setProjects([...projects, newProject]);
  };

  const handleUpdateProject = (id: string, projectData: Partial<Project>) => {
    setProjects(projects.map(p => p.id === id ? { ...p, ...projectData } : p));
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  // Availability handlers
  const handleSaveAvailability = (availability: MemberAvailabilityType) => {
    setMemberAvailabilities(prev => {
      const existing = prev.findIndex(a => a.memberId === availability.memberId);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = availability;
        return updated;
      }
      return [...prev, availability];
    });
  };

  // If not logged in, show login screen
  if (!currentUser && !currentMember) {
    if (showRegister) {
      return (
        <Register
          onRegister={handleRegister}
          onBack={() => setShowRegister(false)}
          offices={offices}
          existingMembers={members}
        />
      );
    }
    return (
      <Login
        onLogin={handleLogin}
        onMemberLogin={handleMemberLogin}
        onShowRegister={() => setShowRegister(true)}
        users={users}
        members={members}
        onGoogleLogin={handleGoogleLogin}
      />
    );
  }

  // If logged in as member, show member dashboard
  if (currentMember) {
    const memberOffice = offices.find(o => o.id === currentMember.officeId);
    const memberTeam = teams.find(t => t.id === currentMember.teamId);
    const memberAvailability = memberAvailabilities.find(a => a.memberId === currentMember.id);

    // Create a mock User object for sidebar
    const memberAsUser: User = {
      id: currentMember.id,
      username: currentMember.username || '',
      password: '',
      role: 'user',
      name: currentMember.name,
      email: currentMember.email,
      createdAt: currentMember.joinDate
    };

    const renderMemberView = () => {
      switch (currentView) {
        case 'dashboard':
          return (
            <MemberDashboard
              member={currentMember}
              office={memberOffice}
              team={memberTeam}
              schedules={schedules}
              dailies={dailies}
              projects={projects}
              allMembers={members}
            />
          );
        case 'profile':
          return (
            <MemberProfile
              member={currentMember}
              office={memberOffice}
              onUpdateMember={handleUpdateMember}
            />
          );
        case 'projects':
          return (
            <MemberProjects
              projects={projects}
              member={currentMember}
              offices={offices}
              teams={teams}
              allMembers={members}
            />
          );
        case 'teams':
          return (
            <MemberTeamView
              member={currentMember}
              team={memberTeam}
              office={memberOffice}
              allMembers={members}
            />
          );
        case 'schedules':
          return (
            <MemberScheduleView
              member={currentMember}
              schedules={schedules}
              office={memberOffice}
            />
          );
        case 'availability':
          return (
            <MemberAvailability
              member={currentMember}
              currentAvailability={memberAvailability}
              onSaveAvailability={handleSaveAvailability}
            />
          );
        default:
          return (
            <MemberDashboard
              member={currentMember}
              office={memberOffice}
              team={memberTeam}
              schedules={schedules}
              dailies={dailies}
              projects={projects}
              allMembers={members}
            />
          );
      }
    };

    return (
      <div className="min-h-screen bg-slate-50/50 dark:bg-background text-foreground font-sans">
        <Toaster />

        {/* Logout Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showLogoutDialog}
          onClose={() => setShowLogoutDialog(false)}
          onConfirm={confirmLogout}
          title="¿Cerrar Sesión?"
          description="¿Estás seguro de que deseas cerrar sesión? Tendrás que ingresar nuevamente tus credenciales."
          confirmText="Sí, Cerrar Sesión"
          cancelText="Cancelar"
          variant="warning"
          icon="logout"
        />

        {/* Login Success Notification */}
        <NotificationToast
          isOpen={loginNotification.show}
          onClose={() => setLoginNotification({ ...loginNotification, show: false })}
          title="¡Bienvenido!"
          description={`Has iniciado sesión como ${loginNotification.name}`}
          variant={loginNotification.type === 'admin' ? 'login' : 'success'}
          duration={4000}
        />

        {/* Logout Success Notification */}
        <NotificationToast
          isOpen={logoutNotification}
          onClose={() => setLogoutNotification(false)}
          title="Sesión Cerrada"
          description="Has cerrado sesión exitosamente. ¡Hasta pronto!"
          variant="logout"
          duration={3000}
        />

        {/* Register Success Notification */}
        <NotificationToast
          isOpen={registerNotification}
          onClose={() => setRegisterNotification(false)}
          title="¡Registro Exitoso!"
          description="Tu cuenta ha sido creada. Ahora puedes iniciar sesión."
          variant="register"
          duration={4000}
        />

        {showCompleteProfile && googleData && (
          <CompleteProfile
            googleData={googleData}
            offices={offices}
            onComplete={handleCompleteProfile}
          />
        )}

        <Sidebar
          currentView={currentView}
          onNavigate={setCurrentView}
          onLogout={handleLogout}
          currentUser={memberAsUser}
        />
        <div className="lg:pl-64">
          <main className="container mx-auto px-4 pt-16 pb-6 lg:pt-6 lg:pb-6">
            <AnimatePresence mode="wait">
              {renderMemberView()}
            </AnimatePresence>
          </main>
        </div>
      </div>
    );
  }

  // Check permissions (only for admin users)
  const canAccessOffices = currentUser?.role === 'admin' || currentUser?.role === 'admin-master';

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard members={members} offices={offices} teams={teams} />;
      case 'members':
        return (
          <TeamMembers
            members={members}
            offices={offices}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
          />
        );
      case 'offices':
        if (!canAccessOffices) return <div className="text-center text-muted-foreground">No tienes permisos para acceder a esta sección</div>;
        return (
          <Offices
            offices={offices}
            members={members}
            onAddOffice={handleAddOffice}
            onUpdateOffice={handleUpdateOffice}
            onDeleteOffice={handleDeleteOffice}
          />
        );
      case 'teams':
        return (
          <ScrumTeams
            teams={teams}
            members={members}
            onAddTeam={handleAddTeam}
            onUpdateTeam={handleUpdateTeam}
            onDeleteTeam={handleDeleteTeam}
          />
        );
      case 'projects':
        return (
          <Projects
            projects={projects}
            members={members}
            offices={offices}
            teams={teams}
            currentUser={currentUser}
            onAddProject={handleAddProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
          />
        );
      case 'schedules':
        return (
          <ScheduleGenerator
            members={members}
            offices={offices}
            schedules={schedules}
            memberAvailabilities={memberAvailabilities}
            onGenerateSchedule={handleGenerateSchedule}
          />
        );
      case 'dailies':
        return (
          <DailyCalendar
            dailies={dailies}
            teams={teams}
            members={members}
            onAddDaily={handleAddDaily}
            onDeleteDaily={handleDeleteDaily}
          />
        );
      case 'users-admin':
        if (currentUser?.role !== 'admin-master') return <div className="text-center text-muted-foreground">Acceso denegado</div>;
        return (
          <UserManagement
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
          />
        );
      default:
        return <Dashboard members={members} offices={offices} teams={teams} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-background text-foreground font-sans">
      <Toaster />

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={confirmLogout}
        title="¿Cerrar Sesión?"
        description="¿Estás seguro de que deseas cerrar sesión? Tendrás que ingresar nuevamente tus credenciales."
        confirmText="Sí, Cerrar Sesión"
        cancelText="Cancelar"
        variant="warning"
        icon="logout"
      />

      {/* Login Success Notification */}
      <NotificationToast
        isOpen={loginNotification.show}
        onClose={() => setLoginNotification({ ...loginNotification, show: false })}
        title="¡Bienvenido!"
        description={`Has iniciado sesión como ${loginNotification.name}`}
        variant={loginNotification.type === 'admin' ? 'login' : 'success'}
        duration={4000}
      />

      {/* Logout Success Notification */}
      <NotificationToast
        isOpen={logoutNotification}
        onClose={() => setLogoutNotification(false)}
        title="Sesión Cerrada"
        description="Has cerrado sesión exitosamente. ¡Hasta pronto!"
        variant="logout"
        duration={3000}
      />

      {/* Register Success Notification */}
      <NotificationToast
        isOpen={registerNotification}
        onClose={() => setRegisterNotification(false)}
        title="¡Registro Exitoso!"
        description="Tu cuenta ha sido creada. Ahora puedes iniciar sesión."
        variant="register"
        duration={4000}
      />

      <Sidebar
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
        currentUser={currentUser as User}
      />
      <div className="lg:pl-64">
        <main className="container mx-auto px-4 pt-16 pb-6 lg:pt-6 lg:pb-6">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;