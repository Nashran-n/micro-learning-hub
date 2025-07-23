import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function ProgressDashboard({ progress, userId }) {
  const [averageScore, setAverageScore] = useState(0);
  const completedLessons = progress.filter((p) => p.completed).length;

  useEffect(() => {
    const fetchAttempts = async () => {
      if (userId) {
        const docRef = doc(db, "progress", userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const attempts = docSnap.data().attempts || [];
          console.log("ProgressDashboard attempts:", attempts);
          const totalScore = attempts.reduce((sum, a) => sum + a.score, 0);
          const avg = attempts.length > 0 ? (totalScore / attempts.length).toFixed(1) : 0;
          setAverageScore(Number(avg));
        } else {
          setAverageScore(0);
        }
      }
    };
    fetchAttempts();
  }, [userId, progress]);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Your Progress</h2>
      <p className="text-gray-700">Completed Lessons: {completedLessons}</p>
      <p className="text-gray-700">Average Score: {averageScore}%</p>
    </div>
  );
}