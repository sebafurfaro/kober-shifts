"use client";

import { Button, ButtonProps, Breadcrumbs, BreadcrumbItem, Card } from "@heroui/react";
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
    <div className="relative p-4 my-4">
      <div className="absolute -inset-1 rounded-xl gradient-nodo opacity-20 blur-md"></div>
      <Card className="p-6 rounded-xl border border-gray-200 duration-200 bg-white relative z-0">
        <div>
          {showBreadcrumbs && (
            <Breadcrumbs className="mb-2">
              <BreadcrumbItem>
                <Link 
                  href={`/plataforma/${tenantId}/panel`}
                  className="button button-primary"
                >
                  Calendario
                </Link>
              </BreadcrumbItem>
            </Breadcrumbs>
          )}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-600">
                  {subtitle}
                </p>
              )}
            </div>
            {action && (
              <Button
                variant={
                  (action.variant as string) === "outlined" 
                    ? "bordered" 
                    : (action.variant as string) === "text" 
                    ? "light" 
                    : action.variant || "solid"
                }
                color={action.color || "primary"}
                onPress={action.onClick}
                startContent={action.startIcon}
                isDisabled={action.disabled}
                className="button button-primary"
              >
                {action.label}
              </Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}


