"use client";

import * as React from "react";
import {
    Button,
    Select,
    SelectItem,
} from "@heroui/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { PlusIcon } from "lucide-react";

type ViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay";

interface ToolbarProps {
    currentDate: Date;
    onToday: () => void;
    onPrev: () => void;
    onNext: () => void;
    currentView: ViewType;
    onViewChange: (view: ViewType) => void;
    timezone: string;
    onTimezoneChange: (timezone: string) => void;
    onCreateEvent: () => void;
}

export function Toolbar({
    currentDate,
    onToday,
    onPrev,
    onNext,
    currentView,
    onViewChange,
    timezone,
    onTimezoneChange,
    onCreateEvent,
}: ToolbarProps) {
    return (
        <div className="p-4 mb-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
                <div className="flex items-center gap-2">
                    <Button
                        onPress={onToday}
                        className="font-bold tracking-wide"
                    >
                        Hoy
                    </Button>
                    <div className="flex items-center gap-1">
                        <Button
                            color="primary"
                            onPress={onPrev}
                            className="font-bold tracking-wide rounded-lg min-w-10"
                        >
                            ‹
                        </Button>
                        <Button
                            color="primary"
                            onPress={onNext}
                            className="font-bold tracking-wide rounded-lg min-w-10"
                        >
                            ›
                        </Button>
                    </div>
                </div>
                <h2 className="text-lg font-semibold flex-1 capitalize text-center">
                    {format(currentDate, "MMMM yyyy", { locale: es })}
                </h2>

                <div className="inline-flex bg-gray-200 rounded-lg p-1 gap-1">
                    <Button
                        onPress={() => onViewChange("dayGridMonth")}
                        className={`px-4 py-1.5 font-medium min-w-auto rounded-xl ${
                            currentView === "dayGridMonth"
                                ? "bg-white text-gray-900"
                                : "bg-transparent text-gray-500"
                        }`}
                        variant="light"
                    >
                        Mes
                    </Button>
                    <Button
                        onPress={() => onViewChange("timeGridWeek")}
                        className={`px-4 py-1.5 font-medium min-w-auto rounded-xl ${
                            currentView === "timeGridWeek"
                                ? "bg-white text-gray-900"
                                : "bg-transparent text-gray-500"
                        }`}
                        variant="light"
                    >
                        Semana
                    </Button>
                    <Button
                        onPress={() => onViewChange("timeGridDay")}
                        className={`px-4 py-1.5 font-medium min-w-auto rounded-xl ${
                            currentView === "timeGridDay"
                                ? "bg-white text-gray-900"
                                : "bg-transparent text-gray-500"
                        }`}
                        variant="light"
                    >
                        Diaria
                    </Button>
                </div>

                <Button
                    color="primary"
                    onPress={onCreateEvent}
                    className="font-bold rounded-full w-10 h-10 flex items-center justify-center p-2"
                >
                    <PlusIcon className="w-4 h-4" />
                </Button>

                <Select
                    size="sm"
                    aria-label="Zona horaria"
                    selectedKeys={[timezone]}
                    onSelectionChange={(keys) => {
                        const selected = Array.from(keys)[0] as string;
                        onTimezoneChange(selected);
                    }}
                    className="min-w-[200px] hidden"
                >
                    <SelectItem key="America/Argentina/Buenos_Aires" textValue="America/Argentina/Buenos_Aires">
                        Buenos Aires (GMT-3)
                    </SelectItem>
                </Select>
            </div>
        </div>
    );
}
