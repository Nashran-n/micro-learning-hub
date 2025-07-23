export function getPersonalizedLessons(lessons, userPreferences) {
  return lessons.filter((lesson) => userPreferences.categories.includes(lesson.category));
}