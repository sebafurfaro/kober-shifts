"use client";

import { Box, Breadcrumbs, Typography, Button, ButtonProps, Divider, Paper } from "@mui/material";
import Link from "next/link";
import { ReactNode } from "react";
import { useParams } from "next/navigation";

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps["variant"];
    color?: ButtonProps["color"];
    startIcon?: ReactNode;
    disabled?: boolean;
  };
  showBreadcrumbs?: boolean;
}

export function PanelHeader({ title, subtitle, action, showBreadcrumbs = false }: PanelHeaderProps) {
  const params = useParams();
  const tenantId = params.tenantId as string;

  return (
    <>
      <Paper className="p-6 my-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-200">
        <Box>
          {showBreadcrumbs && (
            <Breadcrumbs className="mb-2">
              <Link 
                href={`/plataforma/${tenantId}/panel`}
                className="text-gray-600 hover:text-blue-600 transition-colors duration-150"
              >
                Calendario
              </Link>
            </Breadcrumbs>
          )}
          <Box className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <Box>
              <Typography variant="h6" fontWeight={600} className="text-xl text-gray-800 mb-1">
                {title}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" className="text-gray-600">
                  {subtitle}
                </Typography>
              )}
            </Box>
            {action && (
              <Button
                variant={action.variant || "contained"}
                color={action.color || "primary"}
                onClick={action.onClick}
                startIcon={action.startIcon}
                disabled={action.disabled}
                className="w-full md:w-auto hover:shadow-md transition-all duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {action.label}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </>
  );
}


