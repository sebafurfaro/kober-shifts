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
import ErrorIcon from "@mui/icons-material/Error";
import InfoIcon from "@mui/icons-material/Info";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";

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
    switch (type) {
      case "error":
        return <ErrorIcon sx={{ fontSize: 48, color: "error.main" }} />;
      case "success":
        return <CheckCircleIcon sx={{ fontSize: 48, color: "success.main" }} />;
      case "warning":
        return <WarningIcon sx={{ fontSize: 48, color: "warning.main" }} />;
      case "info":
      default:
        return <InfoIcon sx={{ fontSize: 48, color: "info.main" }} />;
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
      <DialogTitle sx={{ pb: 1 }}>{getTitle()}</DialogTitle>
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
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: "center" }}>
        <Button
          variant="contained"
          onClick={onClose}
          color={type === "error" ? "error" : type === "success" ? "success" : "primary"}
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
