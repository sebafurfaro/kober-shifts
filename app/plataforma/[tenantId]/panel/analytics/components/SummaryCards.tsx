import * as React from "react";
import { Card, CardBody } from "@heroui/react";
import { BarChart3, Users, Calendar } from "lucide-react";
import type { AnalyticsStats } from "./types";

interface SummaryCardsProps {
  stats: AnalyticsStats | null;
}

export function SummaryCards({ stats }: SummaryCardsProps) {
  const totalAppointmentsLast30Days = React.useMemo(() => {
    return stats?.daily.reduce((sum, d) => sum + d.count, 0) || 0;
  }, [stats?.daily]);

  const averageDaily = React.useMemo(() => {
    if (!stats?.daily.length) return 0;
    return Math.round(
      stats.daily.reduce((sum, d) => sum + d.count, 0) / stats.daily.length
    );
  }, [stats?.daily]);

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="bg-linear-to-r from-[#00C9FF] to-[#0099ff] text-white">
        <CardBody className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100/30 backdrop-blur-sm rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2 w-full justify-between md:justify-start md:flex-col md:items-start">
              <p className="text-lg font-semibold">Pacientes Totales</p>
              <p className="text-2xl font-bold">
                {stats?.totalPatients || 0}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-linear-to-r from-[#ed8e28] to-[#ffcc5d] text-white">
        <CardBody className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100/30 backdrop-blur-sm rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2 w-full justify-between md:justify-start md:flex-col md:items-start">
              <p className="text-lg font-semibold">Turnos (Últimos 30 días)</p>
              <p className="text-2xl font-bold">
                {totalAppointmentsLast30Days}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      <Card className="bg-linear-to-r from-green-700 to-green-500 text-white">
        <CardBody className="p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-100/30 backdrop-blur-sm rounded-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex items-center gap-2 w-full justify-between md:justify-start md:flex-col md:items-start">
              <p className="text-lg font-semibold">Promedio Diario</p>
              <p className="text-2xl font-bold">
                {averageDaily}
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
