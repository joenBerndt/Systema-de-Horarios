import { motion, AnimatePresence } from "motion/react";
import { Button } from "./button";
import { AlertTriangle, CheckCircle, Info, XCircle, LogOut } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { useState } from "react";

interface ConfirmationDialogProps {
  isOpen?: boolean;
  onClose?: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "destructive" | "warning" | "success" | "info";
  icon?: "alert" | "check" | "info" | "error" | "logout";
  children?: React.ReactNode;
}

export function ConfirmationDialog({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "destructive",
  icon = "alert",
  children
}: ConfirmationDialogProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  
  // Si se pasa isOpen, se usa modo controlado; si no, se usa modo interno (wrapper)
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const onClose = controlledOnClose || (() => setInternalIsOpen(false));
  
  const iconMap = {
    alert: AlertTriangle,
    check: CheckCircle,
    info: Info,
    error: XCircle,
    logout: LogOut
  };

  const colorMap = {
    default: {
      bg: "bg-blue-500",
      text: "text-blue-500",
      buttonBg: "bg-blue-500 hover:bg-blue-600"
    },
    destructive: {
      bg: "bg-red-500",
      text: "text-red-500",
      buttonBg: "bg-red-500 hover:bg-red-600"
    },
    warning: {
      bg: "bg-yellow-500",
      text: "text-yellow-500",
      buttonBg: "bg-yellow-500 hover:bg-yellow-600"
    },
    success: {
      bg: "bg-green-500",
      text: "text-green-500",
      buttonBg: "bg-green-500 hover:bg-green-600"
    },
    info: {
      bg: "bg-blue-500",
      text: "text-blue-500",
      buttonBg: "bg-blue-500 hover:bg-blue-600"
    }
  };

  const Icon = iconMap[icon];
  const colors = colorMap[variant];

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  // Modo wrapper: renderiza el children con onClick
  if (children) {
    return (
      <>
        <div onClick={() => setInternalIsOpen(true)}>
          {children}
        </div>
        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={onClose}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              >
                {/* Dialog */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full max-w-md"
                >
                  <Card className="shadow-2xl border-2">
                    <CardHeader className="text-center pb-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className={`mx-auto w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center mb-4`}
                      >
                        <Icon className="h-8 w-8 text-white" />
                      </motion.div>
                      <CardTitle className="text-2xl">{title}</CardTitle>
                      <CardDescription className="text-base mt-2">
                        {description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={onClose}
                          className="flex-1"
                          size="lg"
                        >
                          {cancelText}
                        </Button>
                        <Button
                          onClick={handleConfirm}
                          className={`flex-1 ${colors.buttonBg} text-white`}
                          size="lg"
                        >
                          {confirmText}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Modo controlado: solo renderiza el dialog
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md"
            >
              <Card className="shadow-2xl border-2">
                <CardHeader className="text-center pb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                    className={`mx-auto w-16 h-16 ${colors.bg} rounded-full flex items-center justify-center mb-4`}
                  >
                    <Icon className="h-8 w-8 text-white" />
                  </motion.div>
                  <CardTitle className="text-2xl">{title}</CardTitle>
                  <CardDescription className="text-base mt-2">
                    {description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={onClose}
                      className="flex-1"
                      size="lg"
                    >
                      {cancelText}
                    </Button>
                    <Button
                      onClick={handleConfirm}
                      className={`flex-1 ${colors.buttonBg} text-white`}
                      size="lg"
                    >
                      {confirmText}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}