import { TeamMember, MemberAvailability as MemberAvailabilityType } from "../types";
import { AvailabilityManager } from "./AvailabilityManager";
import { motion } from "motion/react";
import { Clock } from "lucide-react";

interface MemberAvailabilityProps {
  member: TeamMember;
  currentAvailability?: MemberAvailabilityType;
  onSaveAvailability: (availability: MemberAvailabilityType) => void;
}

export function MemberAvailability({ 
  member, 
  currentAvailability, 
  onSaveAvailability 
}: MemberAvailabilityProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Mi Disponibilidad</h1>
          <p className="text-muted-foreground">
            Gestiona tu disponibilidad horaria semanal
          </p>
        </div>
      </div>

      {/* Availability Manager */}
      <AvailabilityManager
        memberId={member.id}
        currentAvailability={currentAvailability}
        onSave={onSaveAvailability}
        readOnly={false}
      />
    </motion.div>
  );
}