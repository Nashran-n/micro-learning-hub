import React, { useState, useEffect, useRef } from "react";
import { memo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

const ProgressDashboard = memo(({ progress, userId, inProgressLessons }) => {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const [chartType, setChartType] = useState("line");
  const [lessonsMeta, setLessonsMeta] = useState({});
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Fetch lesson metadata
  useEffect(() => {
    const fetchLessonsMeta = async () => {
      const querySnapshot = await getDocs(collection(db, "lessons"));
      const meta = {};
      querySnapshot.forEach((doc) => {
        meta[doc.id] = { title: doc.data().title, category: doc.data().category };
      });
      setLessonsMeta(meta);
    };
    fetchLessonsMeta();
  }, []);

  // Update data loaded state
  useEffect(() => {
    setIsDataLoaded(true); // Always attempt to render chart
    setRenderKey((prev) => prev + 1);
  }, [progress, inProgressLessons]);

  const getLessonProgress = (lessonId) => {
    const completed = progress.find((p) => p && p.lessonId === lessonId);
    const inProgress = inProgressLessons.find((p) => p && p.lessonId === lessonId);
    return completed ? completed.progress || 100 : inProgress ? inProgress.progress : 0;
  };

  const lessonIds = ["1", "2", "3"];
  const lessonData = lessonIds.map((id) => ({
    lessonId: id,
    label: lessonsMeta[id]?.title || `Lesson ${id}`,
    category: lessonsMeta[id]?.category || "Unknown",
    progress: getLessonProgress(id),
    timestamp:
      progress.find((p) => p && p.lessonId === id)?.timestamp ||
      inProgressLessons.find((p) => p && p.lessonId === id)?.timestamp ||
      new Date(),
  }));

  // Render chart
  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d");
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
      if (window.Chart) {
        chartInstance.current = new window.Chart(ctx, {
          type: chartType,
          data: {
            labels: lessonData.map((data) =>
              data.timestamp instanceof Date
                ? data.timestamp.toLocaleDateString()
                : "Unknown Date"
            ),
            datasets: [
              {
                label: "Progress (%)",
                data: lessonData.map((data) => data.progress),
                backgroundColor:
                  chartType === "line"
                    ? "rgba(75, 94, 170, 0.2)"
                    : lessonData.map((_, i) =>
                        ["#4B5EAA", "#48BB78", "#ECC94B"][i % 3]
                      ),
                borderColor:
                  chartType === "line"
                    ? "#4B5EAA"
                    : lessonData.map((_, i) =>
                        ["#2C3E50", "#2F855A", "#B7791F"][i % 3]
                      ),
                borderWidth: 2,
                fill: chartType === "line",
                pointRadius: chartType === "line" ? 4 : 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: "Progress (%)",
                },
              },
              x: {
                title: {
                  display: true,
                  text: "Date",
                },
              },
            },
            plugins: {
              legend: {
                display: true,
                position: "top",
              },
              tooltip: {
                callbacks: {
                  title: (tooltipItems) =>
                    lessonData[tooltipItems[0].dataIndex].label,
                  label: (tooltipItem) =>
                    `Progress: ${tooltipItem.raw}% | Category: ${
                      lessonData[tooltipItem.dataIndex].category
                    }`,
                  afterLabel: (tooltipItem) =>
                    `Date: ${
                      lessonData[tooltipItem.dataIndex].timestamp instanceof Date
                        ? lessonData[tooltipItem.dataIndex].timestamp.toLocaleDateString()
                        : "Unknown"
                    }`,
                },
              },
            },
          },
        });
      } else {
        console.error("Chart.js is not loaded.");
      }
    }
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [isDataLoaded, lessonData, chartType]);

  return (
    <div className="mb-8 p-4 bg-white rounded-lg shadow" key={renderKey}>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900">Progress Dashboard</h2>
        <select
          className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={chartType}
          onChange={(e) => setChartType(e.target.value)}
        >
          <option value="line">Line Chart</option>
          <option value="bar">Bar Chart</option>
        </select>
      </div>
      {lessonData.every((data) => data.progress === 0) ? (
        <p className="text-gray-600">No progress data available yet.</p>
      ) : (
        <div className="w-full h-64 sm:h-80 md:h-96">
          <canvas ref={chartRef}></canvas>
        </div>
      )}
      <p className="text-gray-600 mt-4">User ID: {userId}</p>
    </div>
  );
});

export default ProgressDashboard;