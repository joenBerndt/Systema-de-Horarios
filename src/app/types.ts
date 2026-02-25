export type RoleType = 
  | 'Frontend Developer' 
  | 'Backend Developer' 
  | 'QA' 
  | 'Designer' 
  | 'Mobile Developer'
  | 'Frontend Lead'
  | 'Backend Lead'
  | 'QA Lead'
  | 'Design Lead'
  | 'Scrum Master'
  | 'Product Owner';

export type UserRole = 'admin-master' | 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  password: string;
  role: UserRole;
  name: string;
  email: string;
  createdAt: string;
}

export type EmploymentType = 
  | 'Practicante'
  | 'Tesista'
  | 'Servicios Varios'
  | 'Voluntario'
  | 'Empleado Full-time'
  | 'Empleado Part-time'
  | 'Contratista';

export type Specialty = 
  | 'React/Next.js'
  | 'Vue.js'
  | 'Angular'
  | 'Node.js'
  | 'Python/Django'
  | 'Java/Spring'
  | '.NET'
  | 'PHP/Laravel'
  | 'Mobile iOS'
  | 'Mobile Android'
  | 'React Native'
  | 'Flutter'
  | 'UI/UX Design'
  | 'Graphic Design'
  | 'Automation Testing'
  | 'Manual Testing'
  | 'DevOps'
  | 'Cloud Architecture';

export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type AvailabilityStatus = 'available' | 'in-class' | 'busy' | 'unavailable';

export interface TimeRange {
  start: string; // HH:mm format
  end: string;   // HH:mm format
  status: AvailabilityStatus;
  details?: string; // Para "en clases" puede especificar la universidad/institución
}

export interface DayAvailability {
  day: DayOfWeek;
  isAvailable: boolean;
  timeRanges: TimeRange[];
}

export interface MemberAvailability {
  memberId: string;
  availability: DayAvailability[];
  updatedAt: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: RoleType;
  employmentType: EmploymentType;
  
  // Credenciales de acceso
  username?: string;
  password?: string;
  hasAccess?: boolean;
  
  // Contacto
  email: string;
  phone: string;
  githubEmail?: string;
  githubUsername?: string;
  
  // Personal
  birthDate: string;
  age: number;
  address: string;
  city: string;
  
  // Profesional
  specialty: Specialty;
  officeId?: string;
  teamId?: string;
  
  // Metadata
  joinDate: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

export interface Office {
  id: string;
  name: string;
  capacity: number;
  currentOccupancy: number;
  location: string;
}

export interface ScrumTeam {
  id: string;
  name: string;
  members: string[]; // IDs de los miembros
  scrumMaster?: string;
  productOwner?: string;
  dailyTime?: string;
}

export interface Schedule {
  id: string;
  memberId: string;
  officeId: string;
  date: string;
  startTime: string;
  endTime: string;
  weekNumber: number;
  workMode?: 'presencial' | 'remoto'; // Modo de trabajo
  shift?: string; // Turno asignado (A, B, C, etc.)
}

export interface DailyMeeting {
  id: string;
  teamId: string;
  date: string;
  time: string;
  duration: number; // in minutes
  attendees: string[];
}

export type ProjectStatus = 'planning' | 'in-progress' | 'on-hold' | 'completed' | 'cancelled';

export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  officeId: string;
  assignedMembers: string[]; // IDs de miembros
  teamId?: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  technologies: string[];
  createdAt: string;
  createdBy: string;
}