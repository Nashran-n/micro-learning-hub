import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, doc, setDoc, getDoc, updateDoc, Timestamp, onSnapshot } from "firebase/firestore";
import { db, auth } from "./firebase";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import LessonCard from "./components/LessonCard";
import QuizModal from "./components/QuizModal";
import ProgressDashboard from "./components/ProgressDashboard";
import { getPersonalizedLessons } from "./utils/mockAI";
import Login from "./components/Login";
import UserProfile from "./components/UserProfile";
import Leaderboard from "./components/Leaderboard";
import ScheduleInput from "./components/ScheduleInput";
import FeedbackForm from "./components/FeedbackForm";
import FeedbackList from "./components/FeedbackList";

export default function App() {
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [completedLessons, setCompletedLessons] = useState([]);
  const [inProgressLessons, setInProgressLessons] = useState([]);
  const [user, setUser] = useState(null);
  const [latestAttempt, setLatestAttempt] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [savedQuizzes, setSavedQuizzes] = useState({});
  const [attemptsCache, setAttemptsCache] = useState({});
  const [chartRefresh, setChartRefresh] = useState(0);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackLesson, setFeedbackLesson] = useState(null);
  const [userProfile, setUserProfile] = useState({
    name: "",
    email: "",
    preferences: [],
    bio: "",
    avatarUrl: "",
    dateOfBirth: "",
    hintUsage: 0,
    achievements: [],
    notificationEnabled: true,
  });
  const [notifications, setNotifications] = useState([]);
  const [userSchedules, setUserSchedules] = useState([]);
  const [showAllLessons, setShowAllLessons] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setIsLoadingAuth(false);
      if (currentUser) {
        setUser(currentUser);
        const fetchInitialData = async () => {
          const userId = currentUser.uid;
          const docRef = doc(db, "progress", userId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setCompletedLessons(data.completedLessons || []);
            setInProgressLessons(data.inProgressLessons || []);
            setSavedQuizzes(data.savedQuizzes || {});
            setAttemptsCache(data.attempts ? { ...data.attempts } : {});
          } else {
            setCompletedLessons([]);
            setInProgressLessons([]);
            setSavedQuizzes({});
            setAttemptsCache({});
            await setDoc(docRef, { completedLessons: [], attempts: [], inProgressLessons: [], savedQuizzes: {} }, { merge: true });
          }
          // Load user profile
          const profileRef = doc(db, "users", userId);
          const profileSnap = await getDoc(profileRef);
          if (profileSnap.exists()) {
            const data = profileSnap.data();
            const preferences = data.preferences?.categories || [];
            setUserProfile({
              name: data.name || "",
              email: data.email || "",
              preferences: preferences,
              bio: data.bio || "",
              avatarUrl: data.avatarUrl || "",
              dateOfBirth: data.dateOfBirth || "",
              hintUsage: data.hintUsage || 0,
              achievements: data.achievements || [],
              notificationEnabled: data.notificationEnabled !== undefined ? data.notificationEnabled : true,
            });
          } else {
            await setDoc(profileRef, {
              email: currentUser.email || "",
              createdAt: Timestamp.fromDate(new Date()),
              preferences: { categories: ["Language", "Mindfulness", "Science"] },
              hintUsage: 0,
              achievements: [],
              notificationEnabled: true,
            }, { merge: true });
            setUserProfile({
              name: "",
              email: currentUser.email || "",
              preferences: ["Language", "Mindfulness", "Science"],
              bio: "",
              avatarUrl: "",
              dateOfBirth: "",
              hintUsage: 0,
              achievements: [],
              notificationEnabled: true,
            });
          }
          // Load user schedules with real-time listener
          const scheduleRef = doc(db, "schedules", userId);
          const unsubscribeSchedule = onSnapshot(scheduleRef, (docSnap) => {
            if (docSnap.exists()) {
              const slots = docSnap.data().slots || [];
              setUserSchedules(slots);
              console.log("Schedule updated:", slots); // Debug log
            } else {
              setUserSchedules([]);
              console.log("No schedule found, set to empty"); // Debug log
              setDoc(scheduleRef, { slots: [], updatedAt: Timestamp.fromDate(new Date()) }, { merge: true });
            }
          });
          return () => unsubscribeSchedule();
        };
        fetchInitialData();
      } else {
        setUser(null);
        setCompletedLessons([]);
        setInProgressLessons([]);
        setSavedQuizzes({});
        setAttemptsCache({});
        setUserProfile({
          name: "",
          email: "",
          preferences: [],
          bio: "",
          avatarUrl: "",
          dateOfBirth: "",
          hintUsage: 0,
          achievements: [],
          notificationEnabled: true,
        });
        setNotifications([]);
        setUserSchedules([]);
      }
    });
    return () => unsubscribe();
  }, []);

  const { data: lessons = [], isLoading, error } = useQuery({
    queryKey: ["lessons"],
    queryFn: async () => {
      const querySnapshot = await getDocs(collection(db, "lessons"));
      return querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    },
  });

  const userPreferences = userProfile.preferences.length > 0 ? userProfile.preferences : ["Language", "Mindfulness", "Science"];
  const [personalizedLessons, setPersonalizedLessons] = useState([]);
  useEffect(() => {
    const fetchPersonalizedLessons = async () => {
      const lessonsFiltered = await getPersonalizedLessons(lessons, { categories: userPreferences }, userSchedules, showAllLessons);
      // Renumber lessons for display
      const renumberedLessons = lessonsFiltered.map((lesson, index) => ({
        ...lesson,
        displayTitle: `Lesson ${index + 1}: ${lesson.title.split(": ")[1] || lesson.title}`,
      }));
      setPersonalizedLessons(renumberedLessons);
      console.log("Lessons fetched:", renumberedLessons, "Schedules:", userSchedules, "Show all:", showAllLessons); // Debug log
    };
    fetchPersonalizedLessons();
    // Poll every 10 seconds for time changes
    const interval = setInterval(fetchPersonalizedLessons, 10000);
    return () => clearInterval(interval);
  }, [lessons, userPreferences, userSchedules, showAllLessons]);

  const handleStartQuiz = (lesson) => {
    const savedProgress = savedQuizzes[lesson.id];
    const lessonAttemptsRaw = attemptsCache[lesson.id] || [];
    const lessonAttempts = Array.isArray(lessonAttemptsRaw)
      ? lessonAttemptsRaw.filter((a) => a && a.lessonId)
      : [];
    if (savedProgress) {
      setSelectedLesson({ ...lesson, savedProgress, initialAttempts: lessonAttempts });
    } else {
      setSelectedLesson({ ...lesson, savedProgress: null, initialAttempts: lessonAttempts });
    }
    const updateCache = async () => {
      if (user) {
        const docRef = doc(db, "progress", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSavedQuizzes(data.savedQuizzes || {});
          setAttemptsCache(data.attempts ? { ...data.attempts } : {});
        }
      }
    };
    updateCache();
  };

  const handleQuizComplete = async (lessonId, score, shouldClose = false) => {
    if (user) {
      const docRef = doc(db, "progress", user.uid);
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.exists()
        ? docSnap.data()
        : { completedLessons: [], attempts: [], inProgressLessons: [], savedQuizzes: {} };
      const newAttempt = {
        lessonId,
        timestamp: Timestamp.fromDate(new Date()),
        score,
      };
      const updatedAttempts = currentData.attempts
        ? currentData.attempts
            .filter((a) => a && a.lessonId !== lessonId)
            .concat(newAttempt)
        : [newAttempt];

      let newCompletedLessons = [...currentData.completedLessons];
      let newInProgressLessons = [...currentData.inProgressLessons];

      newCompletedLessons = newCompletedLessons.filter((p) => p.lessonId !== lessonId);

      if (score === 100) {
        newCompletedLessons.push({
          userId: user.uid,
          lessonId,
          completed: true,
          score,
          progress: 100,
        });
        if (newCompletedLessons.length === 1) {
          handleUpdateAchievement("First Quiz Completed");
          if (userProfile.notificationEnabled) {
            addNotification("Congratulations! You completed your first quiz!", "success");
          }
        }
        newInProgressLessons = newInProgressLessons.filter((p) => p.lessonId !== lessonId);
      } else {
        const existingProgressIndex = newInProgressLessons.findIndex(
          (p) => p.lessonId === lessonId
        );
        if (existingProgressIndex !== -1) {
          newInProgressLessons[existingProgressIndex].progress = score;
        } else {
          newInProgressLessons.push({ userId: user.uid, lessonId, progress: score });
        }
      }

      const updatedSavedQuizzes = { ...currentData.savedQuizzes };
      delete updatedSavedQuizzes[lessonId];

      setCompletedLessons(newCompletedLessons);
      setInProgressLessons(newInProgressLessons);
      setLatestAttempt(newAttempt);
      setSavedQuizzes(updatedSavedQuizzes);
      setAttemptsCache(updatedAttempts);
      await setDoc(
        docRef,
        {
          completedLessons: newCompletedLessons,
          attempts: updatedAttempts,
          inProgressLessons: newInProgressLessons,
          savedQuizzes: updatedSavedQuizzes,
        },
        { merge: true }
      );
      setChartRefresh((prev) => prev + 1);
      // Open feedback form
      const lesson = lessons.find((l) => l.id === lessonId);
      setFeedbackLesson({ id: lessonId, title: lesson?.title || "Lesson" });
      setIsFeedbackOpen(true);
    }
    if (shouldClose) setSelectedLesson(null);
  };

  const handleSaveQuizProgress = async (lessonId, currentIndex, selectedOptions, timeRemaining) => {
    if (user) {
      const docRef = doc(db, "progress", user.uid);
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.exists() ? docSnap.data() : { savedQuizzes: {} };
      const updatedSavedQuizzes = {
        ...currentData.savedQuizzes,
        [lessonId]: { currentIndex, selectedOptions, timeRemaining },
      };
      setSavedQuizzes(updatedSavedQuizzes);
      await updateDoc(docRef, { savedQuizzes: updatedSavedQuizzes });
    }
  };

  const handleRestartLesson = async (lessonId) => {
    if (user) {
      const docRef = doc(db, "progress", user.uid);
      const docSnap = await getDoc(docRef);
      const currentData = docSnap.exists()
        ? docSnap.data()
        : { completedLessons: [], inProgressLessons: [], savedQuizzes: {} };

      const newCompletedLessons = currentData.completedLessons.filter(
        (p) => p.lessonId !== lessonId
      );
      const updatedSavedQuizzes = { ...currentData.savedQuizzes };
      delete updatedSavedQuizzes[lessonId];
      const newInProgressLessons = currentData.inProgressLessons.filter(
        (p) => p.lessonId !== lessonId
      );
      newInProgressLessons.push({ userId: user.uid, lessonId, progress: 0 });

      setCompletedLessons(newCompletedLessons);
      setInProgressLessons(newInProgressLessons);
      setSavedQuizzes(updatedSavedQuizzes);
      await setDoc(
        docRef,
        {
          completedLessons: newCompletedLessons,
          inProgressLessons: newInProgressLessons,
          savedQuizzes: updatedSavedQuizzes,
        },
        { merge: true }
      );
      setChartRefresh((prev) => prev + 1);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      setIsLoadingAuth(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login error:", error.message);
      setIsLoadingAuth(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCompletedLessons([]);
    setInProgressLessons([]);
    setSavedQuizzes({});
    setAttemptsCache({});
    setChartRefresh(0);
    setUserProfile({
      name: "",
      email: "",
      preferences: [],
      bio: "",
      avatarUrl: "",
      dateOfBirth: "",
      hintUsage: 0,
      achievements: [],
      notificationEnabled: true,
    });
    setNotifications([]);
    setUserSchedules([]);
    setIsFeedbackOpen(false);
  };

  const handleUpdateProfile = async (updatedProfile) => {
    if (user) {
      const profileRef = doc(db, "users", user.uid);
      await setDoc(
        profileRef,
        {
          email: updatedProfile.email,
          name: updatedProfile.name,
          preferences: { categories: updatedProfile.preferences },
          bio: updatedProfile.bio,
          avatarUrl: updatedProfile.avatarUrl,
          dateOfBirth: updatedProfile.dateOfBirth,
          hintUsage: updatedProfile.hintUsage,
          achievements: updatedProfile.achievements,
          notificationEnabled: updatedProfile.notificationEnabled,
          createdAt: userProfile.createdAt || Timestamp.fromDate(new Date()),
        },
        { merge: true }
      );
      setUserProfile({ ...updatedProfile, email: updatedProfile.email });
    }
  };

  const handleUpdateAchievement = async (achievement) => {
    if (user && !userProfile.achievements.includes(achievement)) {
      const profileRef = doc(db, "users", user.uid);
      const updatedAchievements = [...userProfile.achievements, achievement];
      await setDoc(profileRef, { achievements: updatedAchievements }, { merge: true });
      setUserProfile((prev) => ({ ...prev, achievements: updatedAchievements }));
    }
  };

  const addNotification = (message, type = "success") => {
    if (user && userProfile.notificationEnabled) {
      const id = Date.now();
      setNotifications((prev) => [...prev, { id, message, type, timestamp: new Date() }]);
      setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 5000);
    }
  };

  const handleOpenProfile = () => setIsProfileOpen(true);
  const handleCloseProfile = () => setIsProfileOpen(false);

  const handleFeedbackSubmit = () => {
    if (userProfile.notificationEnabled) {
      addNotification("Thank you for your feedback!", "success");
    }
  };

  const handleUpdateSchedule = (updatedSchedules) => {
    setUserSchedules(updatedSchedules);
    console.log("handleUpdateSchedule:", updatedSchedules); // Debug log
    // Immediately fetch lessons after schedule update
    const fetchPersonalizedLessons = async () => {
      const lessonsFiltered = await getPersonalizedLessons(lessons, { categories: userPreferences }, updatedSchedules, showAllLessons);
      const renumberedLessons = lessonsFiltered.map((lesson, index) => ({
        ...lesson,
        displayTitle: `Lesson ${index + 1}: ${lesson.title.split(": ")[1] || lesson.title}`,
      }));
      setPersonalizedLessons(renumberedLessons);
      console.log("Lessons after schedule update:", renumberedLessons); // Debug log
    };
    fetchPersonalizedLessons();
  };

  const lessonProgress = personalizedLessons.reduce((acc, lesson) => {
    const completed = completedLessons.find((p) => p && p.lessonId === lesson.id);
    const inProgress = inProgressLessons.find((p) => p && p.lessonId === lesson.id);
    acc[lesson.id] = completed ? completed.progress || 100 : inProgress ? inProgress.progress : 0;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-6">
        <h1 className="text-3xl font-bold max-w-8xl mx-auto">Micro-Learning Hub</h1>
      </header>
      <main className="p-6 max-w-8xl mx-auto relative">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`fixed top-4 right-4 text-white p-3 rounded-lg shadow-lg z-50 ${
              notification.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {notification.message} ({notification.timestamp.toLocaleTimeString()})
          </div>
        ))}
        {isLoading && <p className="text-center text-gray-600">Loading lessons...</p>}
        {error && <p className="text-center text-red-600">Error loading lessons: {error.message}</p>}
        {!user ? (
          <Login onLogin={handleLogin} />
        ) : (
          <>
            <div className="flex justify-end mb-4 space-x-4">
              <button
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200"
                onClick={handleOpenProfile}
              >
                Profile
              </button>
              <button
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
            <ScheduleInput onUpdateSchedule={handleUpdateSchedule} onNotify={addNotification} />
            <FeedbackList />
            <div className="mb-4">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={showAllLessons}
                  onChange={(e) => setShowAllLessons(e.target.checked)}
                  className="form-checkbox h-5 w-5 text-blue-600"
                />
                <span className="text-gray-700">Show all lessons (ignore schedule)</span>
              </label>
            </div>
            <ProgressDashboard
              progress={completedLessons}
              userId={user.uid}
              inProgressLessons={inProgressLessons}
              key={chartRefresh}
            />
            <Leaderboard userId={user.uid} preferences={userPreferences} />
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-8 mt-8">
              {personalizedLessons.length === 0 ? (
                <p className="text-gray-600 text-center">
                  No lessons available. Try updating your preferences or schedule.
                </p>
              ) : (
                personalizedLessons.map((lesson) => (
                  <LessonCard
                    key={lesson.id}
                    lesson={{ ...lesson, title: lesson.displayTitle }}
                    progress={lessonProgress[lesson.id]}
                    isCompleted={!!completedLessons.find(
                      (p) => p.lessonId === lesson.id && p.progress === 100
                    )}
                    isSaved={!!savedQuizzes[lesson.id]}
                    onRestart={() => handleRestartLesson(lesson.id)}
                    onStartQuiz={() => handleStartQuiz(lesson)}
                  />
                ))
              )}
            </div>
            {selectedLesson && (
              <QuizModal
                lesson={selectedLesson}
                onClose={() => {
                  if (user) {
                    const updatedSavedQuizzes = { ...savedQuizzes };
                    delete updatedSavedQuizzes[selectedLesson.id];
                    setSavedQuizzes(updatedSavedQuizzes);
                    const docRef = doc(db, "progress", user.uid);
                    updateDoc(docRef, { savedQuizzes: updatedSavedQuizzes });
                  }
                  setSelectedLesson(null);
                }}
                onComplete={handleQuizComplete}
                onSaveProgress={handleSaveQuizProgress}
                latestAttempt={latestAttempt}
                initialAttempts={selectedLesson.initialAttempts}
                onHintUsed={() => {
                  if (user) {
                    const profileRef = doc(db, "users", user.uid);
                    const newHintUsage = userProfile.hintUsage + 1;
                    setDoc(profileRef, { hintUsage: newHintUsage }, { merge: true });
                    setUserProfile((prev) => ({ ...prev, hintUsage: newHintUsage }));
                  }
                }}
              />
            )}
            {isProfileOpen && (
              <UserProfile
                profile={userProfile}
                onUpdateProfile={handleUpdateProfile}
                onClose={handleCloseProfile}
              />
            )}
            {isFeedbackOpen && feedbackLesson && (
              <FeedbackForm
                lessonId={feedbackLesson.id}
                lessonTitle={feedbackLesson.title}
                onSubmit={handleFeedbackSubmit}
                onClose={() => setIsFeedbackOpen(false)}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}