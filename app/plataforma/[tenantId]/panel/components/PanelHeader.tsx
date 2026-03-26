"use client";

import { Button, ButtonProps, Breadcrumbs, BreadcrumbItem, Card, Tooltip } from "@heroui/react";
import Link from "next/link";
import { ReactNode } from "react";
import { useParams } from "next/navigation";
import { PlusIcon } from "lucide-react";

interface PanelHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonProps["variant"];
    color?: ButtonProps["color"];
    disabled?: boolean;
    startContent?: ReactNode;
    startIcon?: ReactNode;
  };
  showBreadcrumbs?: boolean;
}

export function PanelHeader({ title, subtitle, action, showBreadcrumbs = false }: PanelHeaderProps) {
  const params = useParams();
  const tenantId = params.tenantId as string;

  return (
    <div className="relative p-0 md:p-4 mt-2 mb-4 md:my-4">
      <div className="absolute -inset-1 rounded-sm md:rounded-xl gradient-nodo opacity-20 blur-md"></div>
      <Card className="p-6 rounded-sm md:rounded-xl border border-gray-200 duration-200 bg-white relative z-0">
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
          <div className="flex flex-row justify-between items-center gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-1">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-600 hidden md:block">
                  {subtitle}
                </p>
              )}
            </div>
            {action && (
              <div className="flex items-center justify-center w-[50px] h-[50px]">
                <Tooltip content={action.label} placement="top">
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
                    isDisabled={action.disabled}
                    startContent={action.startContent ?? action.startIcon}
                    style={{width: "48px", height: "48px", minWidth: "48px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "7rem" }}
                  >
                    {action.startContent ?? action.startIcon ?? <PlusIcon className="w-4 h-4" />}
                  </Button>
                </Tooltip>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}


