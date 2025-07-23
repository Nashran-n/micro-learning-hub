import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function QuizModal({ lesson, onClose, onComplete }) {
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    const fetchAttempts = async () => {
      const currentUser = auth.currentUser;
      if (lesson && lesson.id && currentUser) {
        try {
          const docRef = doc(db, "progress", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userAttempts = docSnap.data().attempts || [];
            console.log("Fetched attempts:", userAttempts);
            userAttempts.forEach((attempt, index) => {
              console.log(`Attempt ${index} timestamp:`, 
                attempt.timestamp instanceof firebase.firestore.Timestamp 
                  ? attempt.timestamp.toDate().toLocaleString() 
                  : "Invalid Timestamp");
            });
            const lessonAttempts = userAttempts.filter((a) => a.lessonId === lesson.id);
            setAttempts(lessonAttempts);
          } else {
            setAttempts([]);
          }
        } catch (error) {
          console.error("Error fetching attempts:", error);
          setAttempts([]);
        }
      }
    };
    fetchAttempts();
  }, [lesson.id, auth.currentUser, isCorrect]);

  const handleAnswer = () => {
    
if (selectedOption !== null) {
      const correct = selectedOption === lesson.quiz.correct;
      setIsCorrect(correct);
      const score = correct ? 100 : 0;
      onComplete(lesson.id, score, correct);
    }
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setIsCorrect(null);
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.3 } }}
    >
      <motion.div
        className="bg-white p-6 rounded-lg max-w-md w-full sm:max-w-lg md:max-w-xl lg:max-w-2xl shadow-lg"
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <h2 className="text-xl font-bold text-gray-900 mb-4">{lesson.title} Quiz</h2>
        <p className="mb-4 text-gray-800">{lesson.quiz.question}</p>
        <div className="space-y-3">
          {lesson.quiz.options.map((option, index) => (
            <button
              key={index}
              className={`block w-full p-3 rounded-lg ${
                selectedOption === index ? "bg-blue-200" : "bg-gray-100"
              } text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200`}
              onClick={() => setSelectedOption(index)}
              disabled={isCorrect !== null}
            >
              {option}
            </button>
          ))}
        </div>
        {isCorrect !== null && (
          <div className="mt-4">
            <motion.p
              className={isCorrect ? "text-green-600" : "text-red-600"}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              {isCorrect ? "Correct!" : "Incorrect. Try again!"}
            </motion.p>
            {!isCorrect && (
              <button
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                onClick={handleRetry}
              >
                Retry
              </button>
            )}
          </div>
        )}
        {attempts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-2">Attempt History</h3>
            <ul className="text-gray-700 space-y-1">
              {attempts.map((attempt, index) => (
                <li key={index}>
                  {(attempt.timestamp instanceof firebase.firestore.Timestamp 
                    ? attempt.timestamp.toDate().toLocaleString() 
                    : "Invalid Timestamp")} - Score: {attempt.score}%
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
            onClick={onClose}
          >
            Close
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
            onClick={handleAnswer}
            disabled={selectedOption === null || isCorrect !== null}
          >
            Submit
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}