const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json"); // Replace with your service account key path

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function setupDatabase() {
  // Users collection
  await db.collection("users").doc("3ByMt6YHmsYBrqPLtU9XoOKFQEr2").set({
    email: "testuser1@xai.com",
    createdAt: Timestamp.fromDate(new Date("2025-07-23T00:00:00Z")),
    preferences: { categories: ["Language", "Mindfulness"] },
  });
  await db.collection("users").doc("KlVn5nAuCtW9USu1dliMzzxP7lR2").set({
    email: "testuser2@xai.com",
    createdAt: Timestamp.fromDate(new Date("2025-07-23T00:30:00Z")),
    preferences: { categories: ["Mindfulness", "Science"] },
  });

  // Lessons collection
  await db.collection("lessons").doc("1").set({
    title: "Lesson 1: Introduction",
    category: "Language",
    duration: 1.0, // 1 minute
    quiz: {
      questions: [
        {
          question: "What is 2 + 2?",
          options: ["3", "4", "5", "6"],
          correct: 1,
          explanation: "2 + 2 equals 4, a basic addition fact.",
          hint: "Think about adding two pairs.",
        },
        {
          question: "What is 3 + 3?",
          options: ["5", "6", "7", "8"],
          correct: 1,
          explanation: "3 + 3 equals 6, another fundamental addition rule.",
          hint: "Consider doubling a number.",
        },
      ],
    },
  });
  await db.collection("lessons").doc("2").set({
    title: "Lesson 2: Basics",
    category: "Mindfulness",
    duration: 1.0, // 1 minute
    quiz: {
      questions: [
        {
          question: "What is mindfulness?",
          options: ["Focus", "Relaxation", "Stress", "Exercise"],
          correct: 0,
          explanation: "Mindfulness is about maintaining focus on the present moment.",
          hint: "It involves being fully aware of the now.",
        },
        {
          question: "What reduces stress?",
          options: ["Noise", "Meditation", "Work", "Chaos"],
          correct: 1,
          explanation: "Meditation is a proven technique to reduce stress levels.",
          hint: "Think of a calming practice.",
        },
      ],
    },
  });
  await db.collection("lessons").doc("3").set({
    title: "Lesson 3: Basics of Science",
    category: "Science",
    duration: 1.0, // 1 minute
    quiz: {
      questions: [
        {
          question: "What is the boiling point of water?",
          options: ["90°C", "100°C", "110°C", "120°C"],
          correct: 1,
          explanation: "The boiling point of water is 100°C at standard pressure.",
          hint: "It’s a common temperature for cooking.",
        },
      ],
    },
  });

  // Progress collection
  await db.collection("progress").doc("3ByMt6YHmsYBrqPLtU9XoOKFQEr2").set({
    completedLessons: [],
    attempts: [],
    inProgressLessons: [],
    savedQuizzes: {},
  });
  await db.collection("progress").doc("KlVn5nAuCtW9USu1dliMzzxP7lR2").set({
    completedLessons: [],
    attempts: [],
    inProgressLessons: [],
    savedQuizzes: {},
  });

  console.log("Database setup complete!");
}

setupDatabase().catch(console.error);