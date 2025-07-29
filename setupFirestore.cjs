const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, Timestamp } = require("firebase-admin/firestore");

const serviceAccount = require("./serviceAccountKey.json");

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function setupDatabase() {
  // Users collection
  await db.collection("users").doc("3ByMt6YHmsYBrqPLtU9XoOKFQEr2").set({
    email: "testuser1@xai.com",
    createdAt: Timestamp.fromDate(new Date("2025-07-23T00:00:00Z")),
    preferences: { categories: ["Mindfulness", "Science", "Math", "History"] },
    notificationEnabled: true,
  });
  await db.collection("users").doc("KlVn5nAuCtW9USu1dliMzzxP7lR2").set({
    email: "testuser2@xai.com",
    createdAt: Timestamp.fromDate(new Date("2025-07-23T00:30:00Z")),
    preferences: { categories: ["Mindfulness", "Science"] },
    notificationEnabled: true,
  });

  // Lessons collection
  await db.collection("lessons").doc("1").set({
    title: "Lesson 1: Introduction",
    category: "Language",
    duration: 5.0,
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
    duration: 5.0,
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
    duration: 5.0,
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
  await db.collection("lessons").doc("4").set({
    title: "Lesson 4: Vocabulary Building",
    category: "Language",
    duration: 5.0,
    quiz: {
      questions: [
        {
          question: "What is a synonym for 'big'?",
          options: ["Small", "Large", "Tiny", "Short"],
          correct: 1,
          explanation: "Large is a synonym for big, meaning similar in size.",
          hint: "Think of a word meaning the same as big.",
        },
        {
          question: "What is an antonym for 'fast'?",
          options: ["Quick", "Rapid", "Slow", "Swift"],
          correct: 2,
          explanation: "Slow is an antonym for fast, meaning the opposite.",
          hint: "Think of the opposite of quick movement.",
        },
      ],
    },
  });
  await db.collection("lessons").doc("5").set({
    title: "Lesson 5: Grammar Essentials",
    category: "Language",
    duration: 5.0,
    quiz: {
      questions: [
        {
          question: "Which is a correct sentence?",
          options: [
            "She run fast.",
            "She runs fast.",
            "She running fast.",
            "She runs fastly.",
          ],
          correct: 1,
          explanation: "'She runs fast.' is grammatically correct with proper verb conjugation.",
          hint: "Check for subject-verb agreement.",
        },
      ],
    },
  });
  await db.collection("lessons").doc("6").set({
    title: "Lesson 6: Meditation Techniques",
    category: "Mindfulness",
    duration: 5.0,
    quiz: {
      questions: [
        {
          question: "What is a common meditation focus?",
          options: ["TV", "Breath", "Noise", "Work"],
          correct: 1,
          explanation: "Breath is a common focus in meditation to maintain awareness.",
          hint: "Think of something you can control and observe.",
        },
      ],
    },
  });
  await db.collection("lessons").doc("7").set({
    title: "Lesson 7: Stress Management",
    category: "Mindfulness",
    duration: 5.0,
    quiz: {
      questions: [
        {
          question: "Which practice helps manage stress?",
          options: ["Yelling", "Deep breathing", "Multitasking", "Ignoring"],
          correct: 1,
          explanation: "Deep breathing is a proven technique to reduce stress.",
          hint: "Think of a calming activity.",
        },
      ],
    },
  });
  await db.collection("lessons").doc("8").set({
    title: "Lesson 8: Physics Fundamentals",
    category: "Science",
    duration: 5.0,
    quiz: {
      questions: [
        {
          question: "What is Newton's First Law?",
          options: [
            "F=ma",
            "Objects at rest stay at rest",
            "For every action, there is an equal reaction",
            "Energy is conserved",
          ],
          correct: 1,
          explanation: "Newton's First Law states that objects at rest stay at rest unless acted upon.",
          hint: "Think about inertia.",
        },
      ],
    },
  });
  await db.collection("lessons").doc("9").set({
    title: "Lesson 9: Algebra Basics",
    category: "Math",
    duration: 5.0,
    quiz: {
      questions: [
        {
          question: "Solve for x: 2x + 3 = 7",
          options: ["1", "2", "3", "4"],
          correct: 1,
          explanation: "Subtract 3 from both sides: 2x = 4, then divide by 2: x = 2.",
          hint: "Isolate x step by step.",
        },
      ],
    },
  });
  await db.collection("lessons").doc("10").set({
    title: "Lesson 10: Geometry Introduction",
    category: "Math",
    duration: 5.0,
    quiz: {
      questions: [
        {
          question: "What is the sum of angles in a triangle?",
          options: ["90°", "180°", "360°", "270°"],
          correct: 1,
          explanation: "The sum of angles in a triangle is always 180°.",
          hint: "Think about a basic shape property.",
        },
      ],
    },
  });
  await db.collection("lessons").doc("11").set({
    title: "Lesson 11: Ancient Civilizations",
    category: "History",
    duration: 5.0,
    quiz: {
      questions: [
        {
          question: "Which civilization built the pyramids?",
          options: ["Roman", "Greek", "Egyptian", "Mayan"],
          correct: 2,
          explanation: "The Egyptian civilization is famous for building the pyramids.",
          hint: "Think of a civilization near the Nile.",
        },
      ],
    },
  });
  await db.collection("lessons").doc("12").set({
    title: "Lesson 12: World War I Overview",
    category: "History",
    duration: 5.0,
    quiz: {
      questions: [
        {
          question: "When did World War I begin?",
          options: ["1914", "1939", "1900", "1920"],
          correct: 0,
          explanation: "World War I began in 1914.",
          hint: "Think of the early 20th century.",
        },
      ],
    },
  });

  // Progress collection
  await db.collection("progress").doc("3ByMt6YHmsYBrqPLtU9XoOKFQEr2").set({
    completedLessons: [
      {
        userId: "3ByMt6YHmsYBrqPLtU9XoOKFQEr2",
        lessonId: "2",
        completed: true,
        score: 100,
        progress: 100,
        timestamp: Timestamp.fromDate(new Date("2025-07-29T19:00:00Z")),
      },
    ],
    attempts: [
      {
        lessonId: "2",
        timestamp: Timestamp.fromDate(new Date("2025-07-29T19:00:00Z")),
        score: 100,
      },
    ],
    inProgressLessons: [],
    savedQuizzes: {},
  });
  await db.collection("progress").doc("KlVn5nAuCtW9USu1dliMzzxP7lR2").set({
    completedLessons: [],
    attempts: [],
    inProgressLessons: [],
    savedQuizzes: {},
  });

  // Schedules collection
  await db.collection("schedules").doc("3ByMt6YHmsYBrqPLtU9XoOKFQEr2").set({
    slots: [
      { day: "Tuesday", start: "21:00", end: "21:05", duration: 5 }, // Updated for current time
    ],
    updatedAt: Timestamp.fromDate(new Date("2025-07-29T20:50:00Z")),
  });
  await db.collection("schedules").doc("KlVn5nAuCtW9USu1dliMzzxP7lR2").set({
    slots: [
      { day: "Tuesday", start: "10:00", end: "10:05", duration: 5 },
      { day: "Friday", start: "15:00", end: "15:05", duration: 5 },
    ],
    updatedAt: Timestamp.fromDate(new Date("2025-07-23T00:30:00Z")),
  });

  // Feedback collection
  await db.collection("feedback").doc("3ByMt6YHmsYBrqPLtU9XoOKFQEr2_lesson1").set({
    userId: "3ByMt6YHmsYBrqPLtU9XoOKFQEr2",
    lessonId: "1",
    rating: 4,
    comment: "Great intro to language basics!",
    timestamp: Timestamp.fromDate(new Date("2025-07-23T01:30:00Z")),
  });
  await db.collection("feedback").doc("3ByMt6YHmsYBrqPLtU9XoOKFQEr2_lesson2").set({
    userId: "3ByMt6YHmsYBrqPLtU9XoOKFQEr2",
    lessonId: "2",
    rating: 3,
    comment: "Mindfulness questions were a bit tricky.",
    timestamp: Timestamp.fromDate(new Date("2025-07-29T19:00:00Z")),
  });

  console.log("Database setup complete!");
}

setupDatabase().catch(console.error);