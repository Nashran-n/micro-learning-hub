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
  });
  await db.collection("users").doc("KlVn5nAuCtW9USu1dliMzzxP7lR2").set({
    email: "testuser2@xai.com",
    createdAt: Timestamp.fromDate(new Date("2025-07-23T00:30:00Z")),
  });

  // Lessons collection
  await db.collection("lessons").doc("1").set({
    title: "Lesson 1: Introduction",
    category: "Language",
    duration: 10,
    quiz: {
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      correct: 1,
    },
  });
  await db.collection("lessons").doc("2").set({
    title: "Lesson 2: Basics",
    category: "Mindfulness",
    duration: 15,
    quiz: {
      question: "What is mindfulness?",
      options: ["Focus", "Relaxation", "Stress", "Exercise"],
      correct: 1,
    },
  });

  // Progress collection (no initial attempts to ensure average starts at 0%)
  await db.collection("progress").doc("3ByMt6YHmsYBrqPLtU9XoOKFQEr2").set({
    completedLessons: [],
    attempts: [],
  });
  await db.collection("progress").doc("KlVn5nAuCtW9USu1dliMzzxP7lR2").set({
    completedLessons: [],
    attempts: [],
  });

  console.log("Database setup complete!");
}

setupDatabase().catch(console.error);