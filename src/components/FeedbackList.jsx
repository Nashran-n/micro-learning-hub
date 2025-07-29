import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db, auth } from "../firebase";

const FeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const q = query(
        collection(db, "feedback"),
        where("userId", "==", user.uid)
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const feedbackData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setFeedbacks(feedbackData.sort((a, b) => b.timestamp.toDate() - a.timestamp.toDate()));
        },
        (err) => {
          setError("Failed to fetch feedback: " + err.message);
        }
      );
      return () => unsubscribe();
    } else {
      setFeedbacks([]);
    }
  }, []);

  return (
    <div className="mb-8 p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Your Feedback</h2>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {feedbacks.length === 0 ? (
        <p className="text-gray-600">No feedback submitted yet.</p>
      ) : (
        <ul className="space-y-4">
          {feedbacks.map((feedback) => (
            <li key={feedback.id} className="border-b pb-2">
              <p className="text-gray-900">
                <strong>Lesson ID: {feedback.lessonId}</strong>
              </p>
              <p className="text-gray-700">Rating: {feedback.rating}/5</p>
              <p className="text-gray-700">Comment: {feedback.comment}</p>
              <p className="text-gray-500 text-sm">
                Submitted: {feedback.timestamp.toDate().toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default FeedbackList;