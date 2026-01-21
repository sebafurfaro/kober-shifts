"use client";

import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export type AlertDialogType = "error" | "info" | "success" | "warning";

interface AlertDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  type?: AlertDialogType;
  buttonText?: string;
}

export function AlertDialog({
  open,
  onClose,
  title,
  message,
  type = "info",
  buttonText = "Aceptar",
}: AlertDialogProps) {

  const getIcon = () => {
    const iconClass = "w-12 h-12";
    switch (type) {
      case "error":
        return <AlertCircle className={`${iconClass} text-danger`} />;
      case "success":
        return <CheckCircle2 className={`${iconClass} text-success`} />;
      case "warning":
        return <AlertTriangle className={`${iconClass} text-warning`} />;
      case "info":
      default:
        return <Info className={`${iconClass} text-primary`} />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case "error":
        return "Error";
      case "success":
        return "Éxito";
      case "warning":
        return "Advertencia";
      case "info":
      default:
        return "Información";
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "error":
        return "danger";
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "info":
      default:
        return "primary";
    }
  };

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      size="md"
      placement="center"
      isDismissable={true}
      isKeyboardDismissDisabled={false}
      classNames={{
        base: "rounded-xl",
        header: "text-slate-800",
        body: "text-slate-800",
        footer: "text-slate-800",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-2 text-slate-800">
          {getTitle()}
        </ModalHeader>
        <ModalBody className="text-slate-800">
          <div className="flex flex-col items-center gap-4 py-2">
            {getIcon()}
            <p className="text-center text-base">{message}</p>
          </div>
        </ModalBody>
        <ModalFooter className="justify-center pt-2 text-slate-800">
          <Button
            color={getButtonColor()}
            onPress={onClose}
            className="min-w-24"
          >
            {buttonText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
