import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { getDoc, doc } from "firebase/firestore";
import { db, auth } from "../firebase";

export default function QuizModal({ lesson, onClose, onComplete, onSaveProgress, latestAttempt, initialAttempts, onHintUsed }) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(lesson.savedProgress?.currentIndex || 0);
  const [selectedOptions, setSelectedOptions] = useState(lesson.savedProgress?.selectedOptions || {});
  const [isComplete, setIsComplete] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [attempts, setAttempts] = useState(() => Array.isArray(initialAttempts) ? [...initialAttempts] : []);
  const [feedback, setFeedback] = useState(null);
  const [showHint, setShowHint] = useState(false);
  const [saveConfirmation, setSaveConfirmation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(lesson.savedProgress?.timeRemaining || 60); // 1 minute
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const fetchAttempts = async () => {
      const currentUser = auth.currentUser;
      if (lesson && lesson.id && currentUser) {
        try {
          const docRef = doc(db, "progress", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const userAttempts = docSnap.data().attempts || [];
            const lessonAttempts = userAttempts.filter((a) => a && a.lessonId === lesson.id);
            setAttempts((prev) => [...(Array.isArray(prev) ? prev.filter((a) => a && a.lessonId !== lesson.id) : []), ...lessonAttempts]);
            setRetryCount(lessonAttempts.length - 1); // -1 because initial attempt isn't a retry
          }
        } catch (error) {
          console.error("Error fetching attempts:", error);
        }
      }
    };
    fetchAttempts();
    if (latestAttempt && latestAttempt.lessonId === lesson.id) {
      setAttempts((prev) => [...(Array.isArray(prev) ? prev.filter((a) => a && a.lessonId !== lesson.id) : []), latestAttempt]);
    }

    let timer;
    if (!isComplete && !showReview && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleTimeOut();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [lesson.id, auth.currentUser, latestAttempt, isComplete, showReview, timeLeft]);

  const handleTimeOut = () => {
    const totalQuestions = lesson.quiz.questions.length;
    const correctAnswers = Object.entries(selectedOptions).filter(
      ([index, option]) => option === lesson.quiz.questions[index].correct
    ).length;
    const score = Math.round((correctAnswers / totalQuestions) * 100 * (retryCount > 0 ? 0.9 : 1)); // 90% cap after first retry
    setIsComplete(true);
    onComplete(lesson.id, score, true);
    setFeedback({ isCorrect: false, explanation: "Time's up! Quiz ended." });
  };

  const handleAnswer = () => {
    if (currentQuestionIndex < lesson.quiz.questions.length - 1) {
      const currentQuestion = lesson.quiz.questions[currentQuestionIndex];
      const isCorrect = selectedOptions[currentQuestionIndex] === currentQuestion.correct;
      setFeedback({
        isCorrect,
        explanation: isCorrect ? "Great job!" : currentQuestion.explanation || "Try again to learn more!",
      });
      setTimeout(() => {
        setFeedback(null);
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }, 2000);
    } else {
      const totalQuestions = lesson.quiz.questions.length;
      const correctAnswers = Object.entries(selectedOptions).filter(
        ([index, option]) => option === lesson.quiz.questions[index].correct
      ).length;
      const score = Math.round((correctAnswers / totalQuestions) * 100 * (retryCount > 0 ? 0.9 : 1)); // 90% cap after first retry
      setIsComplete(true);
      onComplete(lesson.id, score);
    }
  };

  const handleOptionSelect = (option) => {
    setSelectedOptions({ ...selectedOptions, [currentQuestionIndex]: option });
  };

  const handleRetry = () => {
    setCurrentQuestionIndex(0);
    setSelectedOptions({});
    setIsComplete(false);
    setShowReview(false);
    setFeedback(null);
    setShowHint(false);
    setTimeLeft(60);
    setRetryCount((prev) => prev + 1);
  };

  const handleSaveAndExit = () => {
    setSaveConfirmation(true);
    setTimeout(() => {
      onSaveProgress(lesson.id, currentQuestionIndex, selectedOptions, timeLeft);
      setSaveConfirmation(false);
      onClose();
    }, 1000);
  };

  const toggleReview = () => {
    setShowReview(!showReview);
  };

  const currentQuestion = lesson.quiz.questions[currentQuestionIndex];
  const hint = currentQuestion.hint || "No hint available.";
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const handleClose = () => {
    setCurrentQuestionIndex(0);
    setSelectedOptions({});
    setTimeLeft(60);
    onClose();
  };

  const handleHintClick = () => {
    setShowHint(true);
    onHintUsed();
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
        {!isComplete && !showReview && (
          <>
            <p className="mb-4 text-gray-800">
              Time Left: {minutes}:{seconds < 10 ? `0${seconds}` : seconds}
            </p>
            <p className="mb-4 text-gray-800">
              Question {currentQuestionIndex + 1} of {lesson.quiz.questions.length}: {currentQuestion.question}
            </p>
            <div className="space-y-3">
              {currentQuestion.options.map((option, index) => (
                <button
                  key={index}
                  className={`block w-full p-3 rounded-lg ${
                    selectedOptions[currentQuestionIndex] === index ? "bg-blue-200" : "bg-gray-100"
                  } text-gray-900 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200`}
                  onClick={() => handleOptionSelect(index)}
                  disabled={feedback !== null || timeLeft <= 0}
                >
                  {option}
                </button>
              ))}
            </div>
            {feedback && (
              <motion.p
                className={feedback.isCorrect ? "text-green-600" : "text-red-600"}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {feedback.explanation}
              </motion.p>
            )}
            <button
              className="mt-2 w-full bg-yellow-500 text-white py-2 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 transition duration-200"
              onClick={handleHintClick}
              disabled={feedback !== null || timeLeft <= 0 || showHint}
            >
              Hint
            </button>
            {showHint && (
              <motion.p
                className="mt-2 text-gray-600"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                Hint: {hint}
              </motion.p>
            )}
            <button
              className="mt-2 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              onClick={handleAnswer}
              disabled={selectedOptions[currentQuestionIndex] === undefined || feedback !== null || timeLeft <= 0}
            >
              {currentQuestionIndex < lesson.quiz.questions.length - 1 ? "Next" : "Submit"}
            </button>
            <button
              className="mt-2 w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
              onClick={handleSaveAndExit}
              disabled={feedback !== null || timeLeft <= 0}
            >
              Save & Exit
            </button>
            {saveConfirmation && (
              <motion.p
                className="mt-2 text-green-600 text-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                Progress saved!
              </motion.p>
            )}
          </>
        )}
        {isComplete && !showReview && (
          <div className="mt-4 text-center">
            <motion.p
              className="text-green-600 mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              Quiz Complete! Final Score: {latestAttempt?.score || 0}%
              {retryCount > 0 && <span className="block text-red-600"> (Max 90% due to retry penalty)</span>}
            </motion.p>
            <button
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 mb-2"
              onClick={handleRetry}
            >
              Retry
            </button>
            <button
              className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
              onClick={toggleReview}
            >
              Review Answers
            </button>
          </div>
        )}
        {showReview && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Answers</h3>
            {lesson.quiz.questions.map((question, index) => (
              <div key={index} className="mb-4">
                <p className="text-gray-800">
                  {index + 1}. {question.question}
                </p>
                <p className="text-gray-600">
                  Your Answer: {selectedOptions[index] !== undefined ? question.options[selectedOptions[index]] : "Not answered"}
                </p>
                <p className="text-gray-600">
                  Correct Answer: {question.options[question.correct]}
                </p>
                <p className="text-gray-600">Explanation: {question.explanation || "No explanation available"}</p>
              </div>
            ))}
            <button
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
              onClick={toggleReview}
            >
              Back to Results
            </button>
          </div>
        )}
        {attempts.length > 0 && (
          <div className="mt-6">
            <h3 className="text-md font-semibold text-gray-900 mb-2">Attempt History</h3>
            <ul className="text-gray-700 space-y-1">
              {attempts.map((attempt, index) => (
                <li key={index}>
                  {attempt.timestamp && attempt.timestamp.seconds
                    ? new Date(attempt.timestamp.seconds * 1000).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Invalid Timestamp"}
                  - Score: {attempt.score}%
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="mt-6 flex justify-end space-x-3">
          <button
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
            onClick={handleClose}
            disabled={false}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}