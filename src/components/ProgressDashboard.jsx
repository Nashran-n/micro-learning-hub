import React, { useState, useEffect, useRef } from "react";
import { memo } from "react";

const ProgressDashboard = memo(({ progress, userId, inProgressLessons }) => {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [renderKey, setRenderKey] = useState(0);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  console.log("Progress data:", progress);
  console.log("InProgress data:", inProgressLessons);

  useEffect(() => {
    if (progress.length > 0 || inProgressLessons.length > 0) {
      setIsDataLoaded(true);
      setRenderKey((prev) => prev + 1); // Force re-render only on data change
    } else {
      setIsDataLoaded(false); // Reset if no data
    }
  }, [progress, inProgressLessons]);

  const getLessonProgress = (lessonId) => {
    const completed = progress.find((p) => p && p.lessonId === lessonId);
    const inProgress = inProgressLessons.find((p) => p && p.lessonId === lessonId);
    return completed ? completed.progress || 100 : (inProgress ? inProgress.progress : 0);
  };

  const lessonIds = ["1", "2", "3"]; // Matches setupFirestore.cjs
  const lessonData = lessonIds.map((id) => ({
    label: `Lesson ${id}`,
    progress: getLessonProgress(id),
    timestamp: progress.find((p) => p && p.lessonId === id)?.timestamp || inProgressLessons.find((p) => p && p.lessonId === id)?.timestamp || new Date(),
  }));
  console.log("Lesson data for chart:", lessonData);

  useEffect(() => {
    if (isDataLoaded && chartRef.current) {
      const ctx = chartRef.current.getContext("2d");
      if (chartInstance.current) {
        console.log("Destroying previous chart instance");
        chartInstance.current.destroy();
      }
      if (window.Chart) {
        console.log("Initializing new chart with data:", lessonData);
        chartInstance.current = new window.Chart(ctx, {
          type: "line",
          data: {
            labels: lessonData.map((data) => data.timestamp.toLocaleDateString()),
            datasets: [{
              label: "Progress (%)",
              data: lessonData.map((data) => data.progress),
              backgroundColor: "rgba(75, 94, 170, 0.2)",
              borderColor: "#4B5EAA",
              borderWidth: 2,
              fill: true,
            }]
          },
          options: {
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                title: {
                  display: true,
                  text: "Progress (%)"
                }
              },
              x: {
                title: {
                  display: true,
                  text: "Date"
                }
              }
            },
            plugins: {
              legend: {
                display: true,
                position: "top"
              }
            }
          }
        });
      } else {
        console.error("Chart.js is not loaded. Please include the Chart.js script.");
      }
    }
    return () => {
      if (chartInstance.current) {
        console.log("Cleaning up chart instance on unmount");
        chartInstance.current.destroy();
      }
    };
  }, [isDataLoaded, lessonData]);

  return (
    <div className="mb-8 p-4 bg-white rounded-lg shadow" key={renderKey}>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Progress Dashboard</h2>
      {isDataLoaded ? (
        lessonData.every((data) => data.progress === 0) ? (
          <p className="text-gray-600">No progress data available yet.</p>
        ) : (
          <div className="w-full h-64">
            <canvas ref={chartRef}></canvas>
          </div>
        )
      ) : (
        <p className="text-gray-600">Loading progress data...</p>
      )}
      <p className="text-gray-600 mt-4">User ID: {userId}</p>
    </div>
  );
});

export default ProgressDashboard;