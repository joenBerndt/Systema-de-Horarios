import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, XCircle, AlertCircle, Info, LogIn, LogOut, UserPlus } from "lucide-react";
import { useEffect } from "react";

interface NotificationToastProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  variant?: "success" | "error" | "warning" | "info" | "login" | "logout" | "register";
  duration?: number;
}

export function NotificationToast({
  isOpen,
  onClose,
  title,
  description,
  variant = "info",
  duration = 3000
}: NotificationToastProps) {
  useEffect(() => {
    if (isOpen && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  const variantConfig = {
    success: {
      icon: CheckCircle,
      bgGradient: "from-green-500 to-emerald-600",
      iconBg: "bg-white/20"
    },
    error: {
      icon: XCircle,
      bgGradient: "from-red-500 to-rose-600",
      iconBg: "bg-white/20"
    },
    warning: {
      icon: AlertCircle,
      bgGradient: "from-yellow-500 to-orange-600",
      iconBg: "bg-white/20"
    },
    info: {
      icon: Info,
      bgGradient: "from-blue-500 to-cyan-600",
      iconBg: "bg-white/20"
    },
    login: {
      icon: LogIn,
      bgGradient: "from-blue-600 to-indigo-700",
      iconBg: "bg-white/20"
    },
    logout: {
      icon: LogOut,
      bgGradient: "from-gray-600 to-slate-700",
      iconBg: "bg-white/20"
    },
    register: {
      icon: UserPlus,
      bgGradient: "from-green-600 to-teal-700",
      iconBg: "bg-white/20"
    }
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-start justify-center pt-20">
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.4 }}
            className="pointer-events-auto"
          >
            <div className={`bg-gradient-to-r ${config.bgGradient} text-white rounded-2xl shadow-2xl p-5 min-w-[350px] max-w-md border border-white/20`}>
              <div className="flex items-start gap-4">
                <motion.div
                  initial={{ rotate: -180, scale: 0 }}
                  animate={{ rotate: 0, scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                  className={`${config.iconBg} rounded-full p-3 flex-shrink-0`}
                >
                  <Icon className="h-6 w-6" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <motion.h3
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="font-bold text-lg mb-1"
                  >
                    {title}
                  </motion.h3>
                  {description && (
                    <motion.p
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-white/90 text-sm"
                    >
                      {description}
                    </motion.p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors flex-shrink-0"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
              {/* Progress bar */}
              {duration > 0 && (
                <motion.div
                  initial={{ scaleX: 1 }}
                  animate={{ scaleX: 0 }}
                  transition={{ duration: duration / 1000, ease: "linear" }}
                  className="h-1 bg-white/30 mt-4 rounded-full origin-left"
                />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
