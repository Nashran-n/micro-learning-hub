import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../firebase";

const Leaderboard = ({ userId, preferences }) => {
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      const usersSnapshot = await getDocs(collection(db, "users"));
      const leaderboardData = await Promise.all(
        usersSnapshot.docs.map(async (userDoc) => {
          const userData = userDoc.data();
          const userPreferences = Array.isArray(userData.preferences) ? userData.preferences : (userData.preferences?.categories || []);
          const isMatch = JSON.stringify(userPreferences.sort()) === JSON.stringify(preferences.sort()) && userPreferences.length > 0;
          if (isMatch) {
            const progressRef = doc(db, "progress", userDoc.id);
            const progressSnap = await getDoc(progressRef);
            const progressData = progressSnap.exists() ? progressSnap.data() : { attempts: [] };
            const totalScore = progressData.attempts.reduce((sum, attempt) => sum + (attempt?.score || 0), 0);
            return {
              uid: userDoc.id,
              name: userData.name || "Anonymous",
              totalScore,
            };
          }
          return null;
        })
      );
      const filteredLeaderboard = leaderboardData.filter((entry) => entry !== null).sort((a, b) => b.totalScore - a.totalScore).slice(0, 5);
      setLeaderboard(filteredLeaderboard);
    };
    fetchLeaderboard();
  }, [userId, preferences]);

  const userRank = leaderboard.findIndex((entry) => entry.uid === userId) + 1;

  return (
    <div className="mb-8 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Leaderboard (Preferences: {preferences.join(", ")})</h2>
      {leaderboard.length > 0 ? (
        <ul className="space-y-2">
          {leaderboard.map((entry, index) => (
            <li key={entry.uid} className={`p-2 rounded ${entry.uid === userId ? "bg-blue-100" : "bg-gray-50"}`}>
              {index + 1}. {entry.name} - {entry.totalScore} points
              {entry.uid === userId && <span className="ml-2 text-blue-600">(You)</span>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-gray-600">No users with matching preferences found.</p>
      )}
      {userRank > 0 && (
        <p className="mt-2 text-gray-600">Your rank: #{userRank}</p>
      )}
    </div>
  );
};

export default Leaderboard;