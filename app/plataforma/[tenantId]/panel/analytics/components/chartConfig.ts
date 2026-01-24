import type { ApexOptions } from "apexcharts";

export const baseChartOptions: ApexOptions = {
  chart: {
    type: "bar",
    toolbar: { show: false },
    fontFamily: "Inter, sans-serif",
  },
  plotOptions: {
    bar: {
      borderRadius: 4,
      columnWidth: "60%",
    },
  },
  dataLabels: {
    enabled: false,
  },
  xaxis: {
    labels: {
      style: {
        fontSize: "12px",
      },
    },
  },
  yaxis: {
    labels: {
      style: {
        fontSize: "12px",
      },
    },
  },
  colors: ["#0e5287"],
  grid: {
    borderColor: "#e5e7eb",
    strokeDashArray: 4,
  },
};
