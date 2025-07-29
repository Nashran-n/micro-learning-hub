import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";

export async function getPersonalizedLessons(lessons, userPreferences, schedule = [], showAllLessons = false) {
  const currentTime = new Date();
  const currentDay = currentTime.toLocaleString("en-US", { weekday: "long" });
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();

  // Fetch feedback for ratings
  const feedbackSnapshot = await getDocs(collection(db, "feedback"));
  const lessonRatings = {};
  feedbackSnapshot.forEach((doc) => {
    const { lessonId, rating } = doc.data();
    if (!lessonRatings[lessonId]) {
      lessonRatings[lessonId] = { total: 0, count: 0 };
    }
    lessonRatings[lessonId].total += rating;
    lessonRatings[lessonId].count += 1;
  });

  // Check if current time falls within a scheduled slot
  const isAvailableTime = schedule.some((slot) => {
    if (slot.day !== currentDay) return false;
    const [startHours, startMinutes] = slot.start.split(":").map(Number);
    const [endHours, endMinutes] = slot.end.split(":").map(Number);
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    return currentMinutes >= startTotalMinutes && currentMinutes < endTotalMinutes;
  });

  return lessons
    .filter(
      (lesson) =>
        userPreferences.categories.includes(lesson.category) &&
        lesson.duration === 5.0 &&
        (showAllLessons || isAvailableTime)
    )
    .sort((a, b) => {
      const aRating = lessonRatings[a.id]
        ? lessonRatings[a.id].total / lessonRatings[a.id].count
        : 0;
      const bRating = lessonRatings[b.id]
        ? lessonRatings[b.id].total / lessonRatings[b.id].count
        : 0;
      if (aRating !== bRating) return bRating - aRating;
      const aPriority = userPreferences.categories.indexOf(a.category);
      const bPriority = userPreferences.categories.indexOf(b.category);
      return aPriority - bPriority;
    });
}