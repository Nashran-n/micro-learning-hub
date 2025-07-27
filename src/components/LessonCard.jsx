import React from "react";

const LessonCard = ({ lesson, progress, onStartQuiz, isCompleted, isSaved, onRestart }) => {
  const getCardClass = () => {
    if (isCompleted) {
      return "bg-green-100 border-2 border-green-500"; // Completed style
    } else if (isSaved) {
      return "bg-yellow-100 border-2 border-yellow-500 border-dashed"; // Saved and in-progress style
    }
    return "bg-white border-2 border-gray-300"; // Default style
  };

  return (
    <div
      className={`p-4 rounded-lg shadow-md transition-shadow ${getCardClass()}`}
    >
      <h3 className="text-lg font-semibold text-gray-800">{lesson.title}</h3>
      <p className="text-gray-600 text-sm mt-2">{lesson.description || `${lesson.category} basics`}</p>
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-gray-600 text-xs mt-1">Progress: {progress}%</p>
      </div>
      {isCompleted ? (
        <button
          className="mt-2 bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering any outer onClick
            onRestart();
          }}
        >
          Restart Lesson
        </button>
      ) : (
        <button
          className="mt-2 bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
          onClick={(e) => {
            e.stopPropagation(); // Prevent triggering any outer onClick
            onStartQuiz();
          }}
        >
          Start Lesson
        </button>
      )}
      {isCompleted && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-2">
          Completed
        </span>
      )}
      {isSaved && !isCompleted && (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 mt-2">
          In Progress (Saved)
        </span>
      )}
    </div>
  );
};

export default LessonCard;
