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
import { AlertTriangle, CheckCircle2, AlertCircle, Info } from "lucide-react";

export type ConfirmationDialogType = "warning" | "error" | "info" | "success";

interface ConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmationDialogType;
}

export function ConfirmationDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  type = "warning",
}: ConfirmationDialogProps) {
  const getIcon = () => {
    const iconClass = "w-12 h-12";
    switch (type) {
      case "error":
        return <AlertCircle className={`${iconClass} text-danger`} />;
      case "success":
        return <CheckCircle2 className={`${iconClass} text-success`} />;
      case "info":
        return <Info className={`${iconClass} text-primary`} />;
      case "warning":
      default:
        return <AlertTriangle className={`${iconClass} text-warning`} />;
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
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
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 pb-2 text-slate-800">
          {title || "Confirmar acción"}
        </ModalHeader>
        <ModalBody className="text-slate-800">
          <div className="flex flex-col items-center gap-4 py-2">
            {getIcon()}
            <p className="text-center text-base">{message}</p>
          </div>
        </ModalBody>
        <ModalFooter className="gap-2 pt-2 text-slate-800">
          <Button
            variant="light"
            color="danger"
            onPress={onClose}
            className="min-w-24"
          >
            {cancelText}
          </Button>
          <Button
            color={type === "error" ? "danger" : type === "success" ? "success" : "primary"}
            onPress={handleConfirm}
            className="min-w-24"
          >
            {confirmText}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
