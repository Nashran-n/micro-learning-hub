import { motion } from "framer-motion";

export default function LessonCard({ lesson, onStartQuiz }) {
  return (
    <motion.div
      className="p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
      whileHover={{ scale: 1.05 }}
      initial={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ duration: 0.3 }}
    >
      <h3 className="text-lg font-bold text-gray-900 mb-2">{lesson.title}</h3>
      <p className="text-gray-700 text-sm mb-2">Category: {lesson.category}</p>
      <p className="text-gray-700 text-sm">Duration: {lesson.duration} min</p>
      <button
        className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
        onClick={() => onStartQuiz(lesson)}
      >
        Start Lesson
      </button>
    </motion.div>
  );
}