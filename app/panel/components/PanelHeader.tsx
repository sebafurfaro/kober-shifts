import { Box, Breadcrumbs, Typography, Button, ButtonProps, Divider } from "@mui/material";
import Link from "next/link";
import { ReactNode } from "react";

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps["variant"];
    startIcon?: ReactNode;
    disabled?: boolean;
  };
  showBreadcrumbs?: boolean;
}

export function PanelHeader({ title, subtitle, action, showBreadcrumbs = false }: PanelHeaderProps) {
  return (
    <Box sx={{ mb: 3 }}>
      {showBreadcrumbs && (
        <Breadcrumbs sx={{ mb: 1 }}>
          <Link href="/panel">Calendario</Link>
        </Breadcrumbs>
      )}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={700}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action && (
          <Button
            variant={action.variant || "contained"}
            onClick={action.onClick}
            startIcon={action.startIcon}
            disabled={action.disabled}
          >
            {action.label}
          </Button>
        )}
      </Box>
      <Divider sx={{ my: 2 }} />
    </Box>
  );
}


