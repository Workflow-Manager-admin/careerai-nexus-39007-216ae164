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
    pink: "#E91E63",
  },
  light: {
    primary: "#ffffff",
    accent: "#E91E63",
    pink: "#E91E63",
    grid: "rgba(226,31,112,0.13)",
    text: "#222222",
    secondary: "#f7f8fa",
    cyan: "#00BCD4",
  },
};

// PUBLIC_INTERFACE
/** Bar chart: Weekly User Activity (uses dynamic labels/data if provided) */
export function WeeklyActivityChart({ inputLabels, inputData, loading }) {
  const mode = useChartTheme();
  const colors = themeColors[mode];

  // Fall back if not enough data or loading
  const fallbackLabels = [
    "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"
  ];
  const fallbackData = [0, 0, 0, 0, 0, 0, 0];

  const displayedLabels = inputLabels?.length ? inputLabels : fallbackLabels;
  const displayedData =
    inputData && inputData.length === displayedLabels.length
      ? inputData
      : fallbackData;

  const data = {
    labels: displayedLabels,
    datasets: [
      {
        label: "Active Sessions",
        data: displayedData,
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
    <div className="w-full h-64 relative">
      {loading && <div className="text-center pt-24 text-sm text-gray-500 opacity-80">Loading...</div>}
      <Bar data={data} options={options} />
    </div>
  );
}

// PUBLIC_INTERFACE
/** Line chart: Interview Performance Trend (uses dynamic data if provided) */
export function InterviewPerformanceChart({ inputLabels, inputScores, loading }) {
  const mode = useChartTheme();
  const colors = themeColors[mode];

  const defaultLabels = [
    "Week 1", "Week 2", "Week 3", "Week 4", "Week 5", "Week 6"
  ];
  const defaultData = [0, 0, 0, 0, 0, 0];

  const labels = inputLabels?.length ? inputLabels : defaultLabels;
  const scores =
    inputScores && inputScores.length === labels.length
      ? inputScores
      : defaultData;

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Score (%)",
        data: scores,
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
        min: 0,
        max: 100,
      },
    },
  };

  return (
    <div className="w-full h-64 relative">
      {loading && (
        <div className="text-center pt-24 text-sm text-gray-500 opacity-80">
          Loading...
        </div>
      )}
      <Line data={data} options={options} />
    </div>
  );
}

// PUBLIC_INTERFACE
/** Doughnut chart: Resume/Cover Submissions (uses dynamic values if provided) */
export function SubmissionBreakdownChart({ resumeCount, coverCount, loading }) {
  const mode = useChartTheme();
  const colors = themeColors[mode];

  const resCount = resumeCount !== undefined ? resumeCount : 0;
  const covCount = coverCount !== undefined ? coverCount : 0;

  const data = {
    labels: ["Resumes", "Cover Letters"],
    datasets: [
      {
        label: "Submissions",
        data: [resCount, covCount],
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
    <div className="w-full h-48 flex flex-col items-center justify-center relative">
      {loading && (
        <div className="absolute left-0 top-0 right-0 bottom-0 flex items-center justify-center text-gray-500 opacity-80">
          Loading...
        </div>
      )}
      <Doughnut data={data} options={options} />
    </div>
  );
}

// PUBLIC_INTERFACE
/** Line chart: AI Insights/Trends (uses dynamic values if provided) */
export function AiInsightsChart({ insightLabels, insightScores, loading }) {
  const mode = useChartTheme();
  const colors = themeColors[mode];

  const baseLabels = ["Wk 1", "Wk 2", "Wk 3", "Wk 4", "Wk 5", "Wk 6"];
  const baseData = [0, 0, 0, 0, 0, 0];

  const labels = insightLabels?.length ? insightLabels : baseLabels;
  const scores =
    insightScores && insightScores.length === labels.length
      ? insightScores
      : baseData;

  const data = {
    labels: labels,
    datasets: [
      {
        label: "Insight Score",
        data: scores,
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
        min: 0,
        max: 10,
      },
    },
  };

  return (
    <div className="w-full h-56 relative">
      {loading && (
        <div className="text-center pt-20 text-sm text-gray-500 opacity-80">
          Loading...
        </div>
      )}
      <Line data={data} options={options} />
    </div>
  );
}
