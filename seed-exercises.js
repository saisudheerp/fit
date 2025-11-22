// Seed Exercises to Firebase
// Run this ONCE in browser console after signing in

import { collection, addDoc } from "firebase/firestore";
import { db } from "./src/lib/firebase";

const exercises = [
  // CHEST (18)
  {
    name: "Barbell Bench Press",
    category: "chest",
    muscles: {
      primary: ["pectoralis major"],
      secondary: ["anterior deltoid", "triceps"],
    },
    met_value: 6.0,
    volume_coefficient: 0.0012,
  },
  {
    name: "Incline Barbell Bench Press",
    category: "chest",
    muscles: {
      primary: ["upper pectoralis"],
      secondary: ["anterior deltoid", "triceps"],
    },
    met_value: 6.0,
    volume_coefficient: 0.0012,
  },
  {
    name: "Decline Barbell Bench Press",
    category: "chest",
    muscles: { primary: ["lower pectoralis"], secondary: ["triceps"] },
    met_value: 6.0,
    volume_coefficient: 0.0011,
  },
  {
    name: "Dumbbell Bench Press",
    category: "chest",
    muscles: {
      primary: ["pectoralis major"],
      secondary: ["anterior deltoid", "triceps"],
    },
    met_value: 6.0,
    volume_coefficient: 0.0011,
  },
  {
    name: "Incline Dumbbell Press",
    category: "chest",
    muscles: {
      primary: ["upper pectoralis"],
      secondary: ["anterior deltoid", "triceps"],
    },
    met_value: 6.0,
    volume_coefficient: 0.0011,
  },
  {
    name: "Decline Dumbbell Press",
    category: "chest",
    muscles: { primary: ["lower pectoralis"], secondary: ["triceps"] },
    met_value: 6.0,
    volume_coefficient: 0.001,
  },
  {
    name: "Dumbbell Flyes",
    category: "chest",
    muscles: { primary: ["pectoralis major"], secondary: [] },
    met_value: 5.0,
    volume_coefficient: 0.0008,
  },
  {
    name: "Incline Dumbbell Flyes",
    category: "chest",
    muscles: { primary: ["upper pectoralis"], secondary: [] },
    met_value: 5.0,
    volume_coefficient: 0.0008,
  },
  {
    name: "Cable Flyes",
    category: "chest",
    muscles: { primary: ["pectoralis major"], secondary: [] },
    met_value: 4.5,
    volume_coefficient: 0.0007,
  },
  {
    name: "Chest Dips",
    category: "chest",
    muscles: { primary: ["lower pectoralis"], secondary: ["triceps"] },
    met_value: 8.0,
    volume_coefficient: 0.0015,
  },
  {
    name: "Push-ups",
    category: "chest",
    muscles: {
      primary: ["pectoralis major"],
      secondary: ["anterior deltoid", "triceps"],
    },
    met_value: 8.0,
    volume_coefficient: 0.0001,
  },
  {
    name: "Incline Push-ups",
    category: "chest",
    muscles: { primary: ["lower pectoralis"], secondary: ["triceps"] },
    met_value: 6.0,
    volume_coefficient: 0.0001,
  },
  {
    name: "Decline Push-ups",
    category: "chest",
    muscles: {
      primary: ["upper pectoralis"],
      secondary: ["anterior deltoid", "triceps"],
    },
    met_value: 10.0,
    volume_coefficient: 0.0001,
  },
  {
    name: "Machine Chest Press",
    category: "chest",
    muscles: {
      primary: ["pectoralis major"],
      secondary: ["anterior deltoid", "triceps"],
    },
    met_value: 5.5,
    volume_coefficient: 0.001,
  },
  {
    name: "Pec Deck Machine",
    category: "chest",
    muscles: { primary: ["pectoralis major"], secondary: [] },
    met_value: 4.5,
    volume_coefficient: 0.0008,
  },
  {
    name: "Landmine Press",
    category: "chest",
    muscles: {
      primary: ["pectoralis major"],
      secondary: ["anterior deltoid", "triceps"],
    },
    met_value: 6.0,
    volume_coefficient: 0.0011,
  },
  {
    name: "Svend Press",
    category: "chest",
    muscles: { primary: ["inner pectoralis"], secondary: ["anterior deltoid"] },
    met_value: 5.0,
    volume_coefficient: 0.0009,
  },
  {
    name: "Cable Crossover",
    category: "chest",
    muscles: { primary: ["pectoralis major"], secondary: [] },
    met_value: 4.5,
    volume_coefficient: 0.0007,
  },

  // BACK (15)
  {
    name: "Deadlift",
    category: "back",
    muscles: {
      primary: ["erector spinae", "latissimus dorsi"],
      secondary: ["trapezius", "glutes", "hamstrings"],
    },
    met_value: 8.0,
    volume_coefficient: 0.0015,
  },
  {
    name: "Barbell Row",
    category: "back",
    muscles: {
      primary: ["latissimus dorsi", "rhomboids"],
      secondary: ["trapezius", "biceps"],
    },
    met_value: 6.5,
    volume_coefficient: 0.0012,
  },
  {
    name: "T-Bar Row",
    category: "back",
    muscles: {
      primary: ["latissimus dorsi", "rhomboids"],
      secondary: ["trapezius", "biceps"],
    },
    met_value: 6.5,
    volume_coefficient: 0.0012,
  },
  {
    name: "Dumbbell Row",
    category: "back",
    muscles: {
      primary: ["latissimus dorsi", "rhomboids"],
      secondary: ["trapezius", "biceps"],
    },
    met_value: 6.0,
    volume_coefficient: 0.0011,
  },
  {
    name: "Pull-ups",
    category: "back",
    muscles: {
      primary: ["latissimus dorsi"],
      secondary: ["biceps", "trapezius"],
    },
    met_value: 8.0,
    volume_coefficient: 0.0002,
  },
  {
    name: "Chin-ups",
    category: "back",
    muscles: { primary: ["latissimus dorsi"], secondary: ["biceps"] },
    met_value: 8.0,
    volume_coefficient: 0.0002,
  },
  {
    name: "Lat Pulldown",
    category: "back",
    muscles: {
      primary: ["latissimus dorsi"],
      secondary: ["biceps", "trapezius"],
    },
    met_value: 5.5,
    volume_coefficient: 0.001,
  },
  {
    name: "Seated Cable Row",
    category: "back",
    muscles: {
      primary: ["latissimus dorsi", "rhomboids"],
      secondary: ["biceps"],
    },
    met_value: 5.5,
    volume_coefficient: 0.001,
  },
  {
    name: "Face Pulls",
    category: "back",
    muscles: {
      primary: ["rear deltoid", "trapezius"],
      secondary: ["rhomboids"],
    },
    met_value: 4.5,
    volume_coefficient: 0.0008,
  },
  {
    name: "Shrugs",
    category: "back",
    muscles: { primary: ["trapezius"], secondary: [] },
    met_value: 5.0,
    volume_coefficient: 0.001,
  },
  {
    name: "Hyperextensions",
    category: "back",
    muscles: {
      primary: ["erector spinae"],
      secondary: ["glutes", "hamstrings"],
    },
    met_value: 5.5,
    volume_coefficient: 0.0001,
  },
  {
    name: "Rack Pulls",
    category: "back",
    muscles: {
      primary: ["erector spinae", "trapezius"],
      secondary: ["latissimus dorsi"],
    },
    met_value: 7.5,
    volume_coefficient: 0.0014,
  },
  {
    name: "Pendlay Row",
    category: "back",
    muscles: {
      primary: ["latissimus dorsi", "rhomboids"],
      secondary: ["trapezius"],
    },
    met_value: 6.5,
    volume_coefficient: 0.0012,
  },
  {
    name: "Inverted Row",
    category: "back",
    muscles: {
      primary: ["latissimus dorsi", "rhomboids"],
      secondary: ["biceps"],
    },
    met_value: 6.0,
    volume_coefficient: 0.0001,
  },
  {
    name: "Good Mornings",
    category: "back",
    muscles: {
      primary: ["erector spinae"],
      secondary: ["glutes", "hamstrings"],
    },
    met_value: 6.0,
    volume_coefficient: 0.0011,
  },

  // Add more categories...
];

async function seedExercises() {
  console.log("Starting to seed exercises...");

  for (const exercise of exercises) {
    try {
      await addDoc(collection(db, "exercises"), exercise);
      console.log(`Added: ${exercise.name}`);
    } catch (error) {
      console.error(`Error adding ${exercise.name}:`, error);
    }
  }

  console.log("Finished seeding exercises!");
}

// Run this function
seedExercises();
