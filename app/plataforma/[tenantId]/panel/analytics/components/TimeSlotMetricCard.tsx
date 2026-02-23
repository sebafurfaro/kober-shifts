
"use client";

import * as React from "react";
import { Card, CardBody } from "@heroui/react";
import { Clock, Sun, Sunset, Moon } from "lucide-react";
import dynamic from "next/dynamic";
import type { ApexOptions } from "apexcharts";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

export interface TimeSlotMetricCardProps {
    morning?: number;
    afternoon?: number;
    night?: number;
    mostConsumed?: string; // "Mañana" | "Tarde" | "Noche" | "N/A"
}

export function TimeSlotMetricCard({
    morning = 0,
    afternoon = 0,
    night = 0,
    mostConsumed = "N/A",
}: TimeSlotMetricCardProps) {

    const series = React.useMemo(() => {
        // If all are 0, return placeholder
        if (morning === 0 && afternoon === 0 && night === 0) return [1, 1, 1];
        return [morning, afternoon, night];
    }, [morning, afternoon, night]);

    const hasData = morning > 0 || afternoon > 0 || night > 0;

    const chartOptions: ApexOptions = React.useMemo(
        () => ({
            chart: {
                type: "donut",
                height: 80,
                sparkline: { enabled: true },
                animations: { enabled: true },
                fontFamily: "Inter, sans-serif",
            },
            colors: ["#fbbf24", "#f97316", "#312e81"], // Amber-400 (Morning), Orange-500 (Afternoon), Indigo-900 (Night)
            stroke: {
                show: false,
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: "65%",
                        labels: {
                            show: false,
                        },
                    },
                },
            },
            tooltip: {
                enabled: true,
                theme: "light",
                y: {
                    formatter: function (val) {
                        return hasData ? val.toString() : "0";
                    },
                },
            },
            labels: ["Mañana", "Tarde", "Noche"],
            dataLabels: { enabled: false },
            states: {
                hover: { filter: { type: "none" } },
                active: { filter: { type: "none" } },
            },
        }),
        [hasData]
    );

    // Determine icon and color based on most consumed
    let Icon = Clock;
    let colorClass = "bg-gray-100 text-gray-600";

    if (mostConsumed === "Mañana") {
        Icon = Sun;
        colorClass = "bg-amber-100 text-amber-600";
    } else if (mostConsumed === "Tarde") {
        Icon = Sunset;
        colorClass = "bg-orange-100 text-orange-600";
    } else if (mostConsumed === "Noche") {
        Icon = Moon;
        colorClass = "bg-indigo-100 text-indigo-600";
    }

    return (
        <Card className="bg-white shadow-sm border border-gray-100 h-fit">
            <CardBody className="p-6 flex flex-row items-end justify-between">
                {/* Left Side: Metric Info */}
                <div className="flex flex-col gap-1 w-1/2">
                    <p className="text-gray-500 font-medium text-sm">Horario más concurrido</p>

                    <div className="flex items-center gap-2 mt-1">
                        <div className={`p-1.5 rounded-md ${colorClass}`}>
                            <Icon className="w-5 h-5" />
                        </div>
                        <span className="text-2xl font-bold text-gray-800 truncate">
                            {mostConsumed}
                        </span>
                    </div>

                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-2">
                        <span>Mayor demanda del mes</span>
                    </div>
                </div>

                {/* Right Side: Donut Chart */}
                <div className="w-1/2 h-20 flex flex-col justify-end pl-4 relative">
                    <Chart
                        options={chartOptions}
                        series={series}
                        type="donut"
                        height={80}
                        width="100%"
                    />
                </div>
            </CardBody>
        </Card>
    );
}
