import React from "react";
import {
  Bar,
  Line,
  Doughnut,
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "react-chartjs-2";

// Register Chart.js components globally
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

/**
 * Utility hook to get color palette depending on the current theme.
 * Uses Tailwind dark mode class on html/body.
 */
function useChartTheme() {
  // Fallback: just use document.documentElement.classList for dark
  if (typeof window !== "undefined") {
    return document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";
  }
  return "light";
}

const themeColors = {
  dark: {
    primary: "#000000",
    accent: "#00BCD4",
    cyan: "#00BCD4",
    grid: "rgba(30,246,226,0.13)",
    text: "#E0FCFF",
    secondary: "#0a0a0a",
  },
  light: {
    primary: "#ffffff",
    accent: "#E91E63",
    pink: "#E91E63",
    grid: "rgba(226,31,112,0.13)",
    text: "#222222",
    secondary: "#f7f8fa",
  },
};

// PUBLIC_INTERFACE
/** Bar chart: Weekly User Activity */
export function WeeklyActivityChart() {
  const mode = useChartTheme();
  const colors = themeColors[mode];

  // Mock data
  const data = {
    labels: [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun"
    ],
    datasets: [
      {
        label: "Active Sessions",
        data: [8, 17, 16, 20, 11, 7, 13],
        backgroundColor: mode === "dark" ? colors.cyan : colors.pink,
        borderRadius: 6,
        barThickness: 28,
      },
    ],
  };
  const options = {
    plugins: {
      legend: { display: false },
      title: { display: false },
      tooltip: {
        backgroundColor: mode === "dark" ? colors.accent : colors.accent,
        titleColor: colors.primary,
        bodyColor: colors.primary,
        borderColor: mode === "dark" ? colors.accent : colors.pink,
        borderWidth: 1,
      },
    },
    responsive: true,
    scales: {
      x: {
        ticks: {
          color: colors.text,
          font: { size: 13, weight: 500 },
        },
        grid: {
          display: false,
        },
      },
      y: {
        ticks: {
          color: colors.text,
          stepSize: 5,
          font: { size: 12 },
        },
        grid: {
          color: colors.grid,
          borderDash: [4, 6],
        },
        min: 0,
        max: 24,
      },
    },
  };

  return (
    <div className="w-full h-64">
      <Bar data={data} options={options} />
    </div>
  );
}

// PUBLIC_INTERFACE
/** Line chart: Interview Performance Trend */
export function InterviewPerformanceChart() {
  const mode = useChartTheme();
  const colors = themeColors[mode];

  // Mock data
  const data = {
    labels: [
      "Week 1",
      "Week 2",
      "Week 3",
      "Week 4",
      "Week 5",
      "Week 6",
    ],
    datasets: [
      {
        label: "Score (%)",
        data: [60, 73, 68, 80, 75, 89],
        borderColor: mode === "dark" ? colors.cyan : colors.pink,
        backgroundColor:
          mode === "dark"
            ? "rgba(0,188,212,0.16)"
            : "rgba(233,30,99,0.11)",
        tension: 0.35,
        pointBackgroundColor: mode === "dark" ? colors.cyan : colors.pink,
        fill: true,
      },
    ],
  };
  const options = {
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: mode === "dark" ? colors.accent : colors.pink,
        bodyColor: colors.primary,
        borderColor: mode === "dark" ? colors.accent : colors.pink,
        borderWidth: 1,
      },
    },
    responsive: true,
    scales: {
      x: {
        ticks: { color: colors.text, font: { size: 13 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: colors.text, font: { size: 12 } },
        grid: { color: colors.grid, borderDash: [5, 6] },
        min: 50,
        max: 100,
      },
    },
  };

  return (
    <div className="w-full h-64">
      <Line data={data} options={options} />
    </div>
  );
}

// PUBLIC_INTERFACE
/** Doughnut chart: Resume/Cover Submissions */
export function SubmissionBreakdownChart() {
  const mode = useChartTheme();
  const colors = themeColors[mode];

  // Mock data
  const data = {
    labels: ["Resumes", "Cover Letters"],
    datasets: [
      {
        label: "Submissions",
        data: [12, 7],
        backgroundColor: [
          mode === "dark" ? colors.cyan : colors.pink,
          mode === "dark"
            ? "rgba(30,246,226,0.22)"
            : "rgba(233,30,99,0.23)",
        ],
        borderColor: [
          mode === "dark" ? colors.cyan : colors.pink,
          mode === "dark"
            ? colors.cyan
            : colors.pink,
        ],
        borderWidth: 2,
        hoverOffset: 8,
      },
    ],
  };
  const options = {
    cutout: "65%",
    plugins: {
      legend: {
        display: true,
        labels: { color: colors.text, boxWidth: 20, font: { weight: 600 } },
        position: "bottom",
      },
      tooltip: {
        backgroundColor: mode === "dark" ? colors.accent : colors.pink,
        bodyColor: colors.primary,
      },
    },
  };

  return (
    <div className="w-full h-48 flex flex-col items-center justify-center">
      <Doughnut data={data} options={options} />
    </div>
  );
}

// PUBLIC_INTERFACE
/** Line chart: AI Insights/Trends (mock example) */
export function AiInsightsChart() {
  const mode = useChartTheme();
  const colors = themeColors[mode];

  // Mock trend data: e.g., average recommendation score per week
  const data = {
    labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6"],
    datasets: [
      {
        label: "Insight Score",
        data: [6.5, 6.2, 7.1, 7.6, 8.6, 8.3],
        borderColor: mode === "dark" ? colors.cyan : colors.pink,
        backgroundColor:
          mode === "dark"
            ? "rgba(0,188,212,0.13)"
            : "rgba(233,30,99,0.11)",
        tension: 0.45,
        pointBackgroundColor: mode === "dark" ? colors.cyan : colors.pink,
        fill: true,
      },
    ],
  };
  const options = {
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: mode === "dark" ? colors.accent : colors.pink,
        bodyColor: colors.primary,
        borderColor: mode === "dark" ? colors.cyan : colors.pink,
        borderWidth: 1,
      },
    },
    responsive: true,
    scales: {
      x: {
        ticks: { color: colors.text, font: { size: 13 } },
        grid: { display: false },
      },
      y: {
        ticks: { color: colors.text, font: { size: 12 } },
        grid: { color: colors.grid, borderDash: [5, 6] },
        min: 4,
        max: 10,
      },
    },
  };

  return (
    <div className="w-full h-56">
      <Line data={data} options={options} />
    </div>
  );
}
