"use client";

import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";

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
    switch (type) {
      case "error":
        return <ErrorIcon sx={{ fontSize: 48, color: "error.main" }} />;
      case "success":
        return <CheckCircleIcon sx={{ fontSize: 48, color: "success.main" }} />;
      case "info":
        return <InfoIcon sx={{ fontSize: 48, color: "info.main" }} />;
      case "warning":
      default:
        return <WarningIcon sx={{ fontSize: 48, color: "warning.main" }} />;
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        {title || "Confirmar acción"}
      </DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
            py: 2,
          }}
        >
          {getIcon()}
          <Typography variant="body1" align="center" sx={{ mt: 1 }}>
            {message}
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          color="error"
          sx={{
            borderColor: "error.main",
            "&:hover": {
              borderColor: "error.dark",
              backgroundColor: "error.light",
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          color="success"
          sx={{
            backgroundColor: "success.main",
            "&:hover": {
              backgroundColor: "success.dark",
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
