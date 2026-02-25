import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { TeamMember, ScrumTeam, Office } from "../types";
import { Users, Mail, Phone, Briefcase, Clock, MapPin, Github } from "lucide-react";
import { AnimatedContainer, StaggerContainer, StaggerItem } from "./ui/animated-container";
import { motion } from "motion/react";
import { Alert, AlertDescription } from "./ui/alert";

interface MemberTeamViewProps {
  member: TeamMember;
  team?: ScrumTeam;
  office?: Office;
  allMembers: TeamMember[];
}

export function MemberTeamView({ member, team, office, allMembers }: MemberTeamViewProps) {
  const teamMembers = team ? allMembers.filter(m => team.members.includes(m.id)) : [];
  
  const productOwner = teamMembers.find(m => m.role === 'Product Owner');
  const scrumMaster = teamMembers.find(m => m.role === 'Scrum Master');
  const developers = teamMembers.filter(m => 
    m.role.includes('Developer') || m.role.includes('Designer') || m.role === 'QA'
  );

  const MemberCard = ({ teamMember, index }: { teamMember: TeamMember; index: number }) => {
    const isCurrentUser = teamMember.id === member.id;
    
    return (
      <StaggerItem>
        <motion.div
          whileHover={{ scale: 1.03, y: -4 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className={`relative overflow-hidden ${isCurrentUser ? 'border-primary shadow-lg' : ''}`}>
            {isCurrentUser && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">
                Tú
              </div>
            )}
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{teamMember.name}</CardTitle>
                  <CardDescription>{teamMember.role}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{teamMember.specialty}</span>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground truncate">{teamMember.email}</span>
              </div>

              {teamMember.githubUsername && (
                <div className="flex items-center gap-2 text-sm">
                  <Github className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">@{teamMember.githubUsername}</span>
                </div>
              )}

              <Badge variant="outline" className="w-fit">
                {teamMember.employmentType}
              </Badge>
            </CardContent>
          </Card>
        </motion.div>
      </StaggerItem>
    );
  };

  return (
    <AnimatedContainer>
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Mi Equipo</h2>
          <p className="text-muted-foreground">
            Información sobre tu equipo de trabajo
          </p>
        </div>

        {!team ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-lg font-medium">No estás asignado a un equipo</p>
                <p className="text-sm text-muted-foreground">
                  Contacta con tu supervisor para ser asignado a un equipo Scrum
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <>
            {/* Información del Equipo */}
            <StaggerContainer className="grid gap-4 md:grid-cols-2">
              <StaggerItem>
                <motion.div whileHover={{ scale: 1.02 }}>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        {team.name}
                      </CardTitle>
                      <CardDescription>Información del equipo</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm text-muted-foreground">Miembros</p>
                        <p className="text-2xl font-bold">{teamMembers.length}</p>
                      </div>
                      {team.dailyTime && (
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span>Daily Meeting: {team.dailyTime}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </StaggerItem>

              {office && (
                <StaggerItem>
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <MapPin className="h-5 w-5 text-primary" />
                          Oficina
                        </CardTitle>
                        <CardDescription>Tu ubicación de trabajo</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-lg font-semibold">{office.name}</p>
                          <p className="text-sm text-muted-foreground">{office.location}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </StaggerItem>
              )}
            </StaggerContainer>

            {/* Roles Clave */}
            {(productOwner || scrumMaster) && (
              <AnimatedContainer delay={0.2}>
                <Card>
                  <CardHeader>
                    <CardTitle>Roles Clave</CardTitle>
                    <CardDescription>Contactos principales del equipo</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      {productOwner && (
                        <motion.div
                          whileHover={{ x: 4 }}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <p className="font-medium">{productOwner.name}</p>
                            <p className="text-sm text-muted-foreground">Product Owner</p>
                          </div>
                        </motion.div>
                      )}
                      {scrumMaster && (
                        <motion.div
                          whileHover={{ x: 4 }}
                          className="flex items-center gap-3 p-3 border rounded-lg"
                        >
                          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <p className="font-medium">{scrumMaster.name}</p>
                            <p className="text-sm text-muted-foreground">Scrum Master</p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </AnimatedContainer>
            )}

            {/* Miembros del Equipo */}
            <AnimatedContainer delay={0.3}>
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  Miembros del Equipo ({developers.length})
                </h3>
                <StaggerContainer className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {developers.map((teamMember, index) => (
                    <MemberCard key={teamMember.id} teamMember={teamMember} index={index} />
                  ))}
                </StaggerContainer>
              </div>
            </AnimatedContainer>

            {/* Información Adicional */}
            <AnimatedContainer delay={0.4}>
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Para coordinar con tu equipo o reportar problemas, contacta con tu Scrum Master.
                </AlertDescription>
              </Alert>
            </AnimatedContainer>
          </>
        )}
      </div>
    </AnimatedContainer>
  );
}
