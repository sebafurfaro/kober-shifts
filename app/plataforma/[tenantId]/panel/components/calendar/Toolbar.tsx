"use client";

import * as React from "react";
import {
    Button,
    Select,
    SelectItem,
} from "@heroui/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, PlusIcon } from "lucide-react";

type ViewType = "dayGridMonth" | "timeGridWeek" | "timeGridDay" | "listWeek";

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
        <div className="p-2 md:p-4 mb-4 bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="grid grid-cols-2 md:flex md:flex-row items-center justify-between gap-4 w-full">
                <h2 className="col-span-2 order-1 text-sm md:text-lg font-semibold capitalize text-center px-1 md:order-none md:flex-1">
                    {currentView === "dayGridMonth"
                        ? format(currentDate, "MMMM yyyy", { locale: es })
                        : currentView === "timeGridWeek" || currentView === "listWeek"
                        ? `Semana · ${format(currentDate, "d MMM yyyy", { locale: es })}`
                        : format(currentDate, "EEEE d MMMM yyyy", { locale: es })}
                </h2>
                <div className="order-3 flex items-center gap-2 md:order-none">
                    <Button onPress={onToday} className="font-bold tracking-wide text-xs md:text-base px-2 md:px-4 min-w-10 md:min-w-20 hidden md:inline-flex">
                        Hoy
                    </Button>
                    <div className="flex items-center gap-1">
                        <Button color="primary" onPress={onPrev} className="font-bold tracking-wide rounded-lg min-w-10">
                            ‹
                        </Button>
                        <Button onPress={onToday} className="font-bold tracking-wide text-xs md:text-base px-2 md:px-4 min-w-10 md:min-w-20 inline-flex md:hidden">
                            Hoy
                        </Button>
                        <Button color="primary" onPress={onNext} className="font-bold tracking-wide rounded-lg min-w-10">
                            ›
                        </Button>
                    </div>
                </div>

                
                <div className="order-2 col-span-2 flex justify-end md:order-none">
                    <Button
                        color="primary"
                        onPress={onCreateEvent}
                        className="font-semibold md:font-bold rounded-lg md:rounded-full w-full md:w-10 h-10 flex items-center justify-center p-2"
                    >
                        <Calendar className="w-4 h-4 block md:hidden" />
                        <span className="text-white md:hidden block font-semibold">Nuevo turno</span>
                        <PlusIcon className="w-4 h-4 hidden md:block" />
                    </Button>
                </div>


                <div className="order-3 inline-flex flex-wrap justify-center bg-gray-200 rounded-md md:rounded-lg p-1 md:gap-1 max-w-full md:order-none">
                    <Button
                        onPress={() => onViewChange("dayGridMonth")}
                        className={`px-1 md:px-4 py-1.5 font-medium min-w-auto rounded-lg md:rounded-xl text-xs md:text-base ${
                            currentView === "dayGridMonth" ? "bg-white text-gray-900" : "bg-transparent text-gray-500"
                        }`}
                        variant="light"
                    >
                        Mes
                    </Button>
                    <Button
                        onPress={() => onViewChange("timeGridWeek")}
                        className={`px-1 md:px-4 py-1.5 font-medium min-w-auto rounded-lg md:rounded-xl text-xs md:text-base ${
                            currentView === "timeGridWeek" ? "bg-white text-gray-900" : "bg-transparent text-gray-500"
                        }`}
                        variant="light"
                    >
                        Semana
                    </Button>
                    <Button
                        onPress={() => onViewChange("timeGridDay")}
                        className={`px-1 md:px-4 py-1.5 font-medium min-w-auto rounded-lg md:rounded-xl text-xs md:text-base ${
                            currentView === "timeGridDay" ? "bg-white text-gray-900" : "bg-transparent text-gray-500"
                        }`}
                        variant="light"
                    >
                        Diaria
                    </Button>
                </div>
            </div>
        </div>
    );
}
