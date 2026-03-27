"use client";

import { Button } from "@heroui/react";
import { HelpCircle } from "lucide-react";

interface TourButtonProps {
  onClick: () => void;
  className?: string;
}

export function TourButton({ onClick, className = "" }: TourButtonProps) {
  return (
    <Button
      isIconOnly
      variant="flat"
      color="primary"
      size="sm"
      className={`rounded-full shadow-md z-10 ${className}`}
      onPress={onClick}
      title="Ver tour de la página"
      aria-label="Ver tour"
    >
      <HelpCircle className="w-5 h-5" />
    </Button>
  );
}
