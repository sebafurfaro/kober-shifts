export type FinanzasPeriodKey = "month" | "3m" | "6m" | "year";

export type FinanzasMetric = {
  value: number;
  previous: number;
  changePercent: number | null;
};

export type FinanzasDashboardResponse = {
  period: { key: FinanzasPeriodKey; label: string };
  metrics: {
    ingresos: FinanzasMetric;
    egresos: FinanzasMetric;
    balance: FinanzasMetric;
  };
  chartSixMonths: {
    year: number;
    month: number;
    label: string;
    ingresos: number;
    egresos: number;
  }[];
  egresosByCategory: { category: string; amount: number; percent: number }[];
  movements: {
    kind: "income" | "expense";
    title: string;
    subtitle: string | null;
    amount: number;
    at: string;
  }[];
};
