import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { db, auth } from "./firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import LessonCard from "./components/LessonCard";
import QuizModal from "./components/QuizModal";
import ProgressDashboard from "./components/ProgressDashboard";
import { getPersonalizedLessons } from "./utils/mockAI";
import Login from "./components/Login";

export default function App() {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [progress, setProgress] = useState([]);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser || !currentUser.email) {
        signOut(auth).catch(console.error);
        setUser(null);
      } else {
        setUser(currentUser);
        const fetchProgress = async () => {
          const docRef = doc(db, "progress", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProgress(docSnap.data().completedLessons || []);
          } else {
            setProgress([]);
          }
        };
        fetchProgress();
      }
    });
    return () => unsubscribe();
  }, []);

  const { data: lessons = [], isLoading, error } = useQuery({
    queryKey: ["lessons"],
    queryFn: async () => {
      const querySnapshot = await getDocs(collection(db, "lessons"));
      return querySnapshot.docs.map((doc) => doc.data());
    },
  });

  const userPreferences = { categories: ["Language", "Mindfulness"] };
  const personalizedLessons = getPersonalizedLessons(lessons, userPreferences);

  const handleStartQuiz = (lesson) => {
    setSelectedLesson(lesson);
  };

  const handleQuizComplete = async (lessonId, score, shouldClose = false) => {
    if (user) {
      const docRef = doc(db, "progress", user.uid);
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.exists() ? docSnap.data() : { completedLessons: [], attempts: [] };
      const newProgress = [
        ...currentData.completedLessons.filter((p) => p.lessonId !== lessonId),
        { userId: user.uid, lessonId, completed: score === 100, score },
      ];
      const newAttempt = {
        lessonId,
        timestamp: Timestamp.fromDate(new Date()),
        score,
      };
      setProgress(newProgress);
      await setDoc(
        docRef,
        {
          completedLessons: newProgress,
          attempts: [...(currentData.attempts || []), newAttempt],
        },
        { merge: true }
      );
    }
    if (shouldClose) setTimeout(() => setSelectedLesson(null), 1500);
  };

  const handleLogin = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-6">
        <h1 className="text-3xl font-bold max-w-8xl mx-auto">Micro-Learning Hub</h1>
      </header>
      <main className="p-6 max-w-8xl mx-auto">
        {isLoading && <p className="text-center text-gray-800">Loading lessons...</p>}
        {error && <p className="text-center text-red-600">Error loading lessons: {error.message}</p>}
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
            <ProgressDashboard progress={progress} userId={user.uid} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 mt-8">
              {personalizedLessons.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} onStartQuiz={handleStartQuiz} />
              ))}
            </div>
            {selectedLesson && (
              <QuizModal
                lesson={selectedLesson}
                onClose={() => setSelectedLesson(null)}
                onComplete={handleQuizComplete}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}