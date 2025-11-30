import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  createRoutine,
  getExercises,
  createActiveProgram,
} from "../lib/firebase-database";
import { useNavigate } from "react-router-dom";
import { useToast } from "../contexts/ToastContext";

export default function AutoRoutineBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [goal, setGoal] = useState("muscle_gain");
  const [experience, setExperience] = useState("intermediate");
  const [daysPerWeek, setDaysPerWeek] = useState(4);
  const [sessionDuration, setSessionDuration] = useState(60);
  const [equipment, setEquipment] = useState("full_gym");
  const [focusAreas, setFocusAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [generatedRoutine, setGeneratedRoutine] = useState(null);
  const [saveOption, setSaveOption] = useState("separate"); // "separate" or "program"

  const goals = [
    {
      id: "muscle_gain",
      name: "Muscle Gain",
      icon: "fitness_center",
      description: "Build muscle mass with hypertrophy-focused training",
      color: "#FF6B6B",
    },
    {
      id: "strength",
      name: "Strength",
      icon: "sports_martial_arts",
      description: "Increase maximal strength with heavy compound lifts",
      color: "#4ECDC4",
    },
    {
      id: "endurance",
      name: "Endurance",
      icon: "directions_run",
      description: "Improve muscular endurance and conditioning",
      color: "#FFD93D",
    },
    {
      id: "fat_loss",
      name: "Fat Loss",
      icon: "local_fire_department",
      description: "High-volume training to maximize calorie burn",
      color: "#A8E6CF",
    },
    {
      id: "athletic",
      name: "Athletic Performance",
      icon: "sports_gymnastics",
      description: "Functional training for speed, power, and agility",
      color: "#667eea",
    },
  ];

  const focusOptions = [
    { id: "chest", name: "Chest", icon: "favorite" },
    { id: "back", name: "Back", icon: "accessibility" },
    { id: "shoulders", name: "Shoulders", icon: "pan_tool" },
    { id: "arms", name: "Arms", icon: "sports_martial_arts" },
    { id: "legs", name: "Legs", icon: "directions_walk" },
    { id: "abs", name: "Core", icon: "album" },
  ];

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const data = await getExercises();
      setExercises(data);
    } catch (error) {
      console.error("Error loading exercises:", error);
    }
  };

  const toggleFocusArea = (areaId) => {
    setFocusAreas((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId]
    );
  };

  const generateRoutine = () => {
    setLoading(true);

    // Filter exercises based on equipment
    let availableExercises = filterExercisesByEquipment(exercises);

    // Build daily routines based on goal and frequency
    const routines = buildDailyRoutines(availableExercises);

    setGeneratedRoutine(routines);
    setLoading(false);
  };

  const filterExercisesByEquipment = (allExercises) => {
    if (equipment === "bodyweight") {
      return allExercises.filter(
        (ex) => ex.type === "bodyweight" || ex.category === "cardio"
      );
    } else if (equipment === "home_dumbbells") {
      return allExercises.filter(
        (ex) =>
          ex.type === "bodyweight" ||
          ex.category === "cardio" ||
          ex.name.includes("Dumbbell") ||
          ex.name.includes("Push-up") ||
          ex.name.includes("Pull-up")
      );
    }
    return allExercises; // full_gym - all exercises
  };

  const buildDailyRoutines = (availableExercises) => {
    // STEP 1: Determine training parameters based on goal
    let sets, reps, rest, trainingStyle;

    switch (goal) {
      case "muscle_gain":
        sets = 4;
        reps = 12;
        rest = 90;
        trainingStyle = "hypertrophy";
        break;
      case "strength":
        sets = 5;
        reps = 6;
        rest = 180;
        trainingStyle = "strength";
        break;
      case "endurance":
        sets = 3;
        reps = 20;
        rest = 45;
        trainingStyle = "endurance";
        break;
      case "fat_loss":
        sets = 3;
        reps = 15;
        rest = 30;
        trainingStyle = "fat_loss";
        break;
      case "athletic":
        sets = 4;
        reps = 10;
        rest = 60;
        trainingStyle = "athletic";
        break;
      default:
        sets = 4;
        reps = 12;
        rest = 90;
        trainingStyle = "hypertrophy";
    }

    // STEP 2: Determine session exercise count based on duration
    let exercisesPerSession;
    switch (sessionDuration) {
      case 30:
        exercisesPerSession = 4;
        break;
      case 45:
        exercisesPerSession = 5;
        break;
      case 60:
        exercisesPerSession = 6;
        break;
      case 90:
        exercisesPerSession = 7;
        break;
      default:
        exercisesPerSession = 6;
    }

    // STEP 3: Determine split type based on days per week and goal
    let dailyRoutines = [];

    if (daysPerWeek >= 6) {
      // 6-day split
      if (trainingStyle === "endurance" || trainingStyle === "fat_loss") {
        dailyRoutines = createFullBodyEnduranceSplit(
          availableExercises,
          sets,
          reps,
          rest,
          exercisesPerSession,
          6
        );
      } else {
        // Standard PPL × 2
        dailyRoutines = createPushPullLegsSplit(
          availableExercises,
          sets,
          reps,
          rest,
          exercisesPerSession,
          true
        );
      }
    } else if (daysPerWeek === 5) {
      // 5-day split
      if (trainingStyle === "endurance" || trainingStyle === "fat_loss") {
        dailyRoutines = createFiveDayEnduranceSplit(
          availableExercises,
          sets,
          reps,
          rest,
          exercisesPerSession
        );
      } else {
        dailyRoutines = createFiveDayBodyPartSplit(
          availableExercises,
          sets,
          reps,
          rest,
          exercisesPerSession
        );
      }
    } else if (daysPerWeek === 4) {
      // 4-day: Upper/Lower/Upper/Lower
      dailyRoutines = createUpperLowerSplit(
        availableExercises,
        sets,
        reps,
        rest,
        exercisesPerSession,
        true
      );
    } else if (daysPerWeek === 3) {
      // 3-day: Full Body or Push/Pull/Legs
      if (trainingStyle === "endurance" || trainingStyle === "fat_loss") {
        dailyRoutines = createFullBodyEnduranceSplit(
          availableExercises,
          sets,
          reps,
          rest,
          exercisesPerSession,
          3
        );
      } else {
        dailyRoutines = createPushPullLegsSplit(
          availableExercises,
          sets,
          reps,
          rest,
          exercisesPerSession,
          false
        );
      }
    } else {
      // 2-day: Full Body A/B
      dailyRoutines = createFullBodySplit(
        availableExercises,
        sets,
        reps,
        rest,
        exercisesPerSession
      );
    }

    return dailyRoutines;
  };

  const createPushPullLegsSplit = (
    exercises,
    sets,
    reps,
    rest,
    exercisesPerSession,
    repeat
  ) => {
    const routines = [];
    const usedExerciseIds = [];

    // Day 1: Push (Chest, Shoulders, Triceps)
    const pushExercises = selectExercisesByCategoriesAdvanced(
      exercises,
      {
        chest: 0.5,
        shoulders: 0.3,
        triceps: 0.2,
      },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    usedExerciseIds.push(...pushExercises.map((e) => e.id));
    routines.push(
      createDayRoutine(
        "Push Day",
        pushExercises,
        sets,
        reps,
        rest,
        "Chest, Shoulders, Triceps"
      )
    );

    // Day 2: Pull (Back, Biceps)
    const pullExercises = selectExercisesByCategoriesAdvanced(
      exercises,
      {
        back: 0.7,
        biceps: 0.3,
      },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    usedExerciseIds.push(...pullExercises.map((e) => e.id));
    routines.push(
      createDayRoutine(
        "Pull Day",
        pullExercises,
        sets,
        reps,
        rest,
        "Back, Biceps"
      )
    );

    // Day 3: Legs
    const legExercises = selectExercisesByCategoriesAdvanced(
      exercises,
      {
        legs: 1.0,
      },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    usedExerciseIds.push(...legExercises.map((e) => e.id));
    routines.push(
      createDayRoutine(
        "Legs Day",
        legExercises,
        sets,
        reps,
        rest,
        "Legs, Glutes, Calves"
      )
    );

    if (repeat) {
      // Day 4: Push (different exercises)
      const pushExercises2 = selectExercisesByCategoriesAdvanced(
        exercises,
        {
          chest: 0.5,
          shoulders: 0.3,
          triceps: 0.2,
        },
        exercisesPerSession,
        usedExerciseIds,
        goal
      );
      usedExerciseIds.push(...pushExercises2.map((e) => e.id));
      routines.push(
        createDayRoutine(
          "Push Day 2",
          pushExercises2,
          sets,
          reps,
          rest,
          "Chest, Shoulders, Triceps"
        )
      );

      // Day 5: Pull (different exercises)
      const pullExercises2 = selectExercisesByCategoriesAdvanced(
        exercises,
        {
          back: 0.7,
          biceps: 0.3,
        },
        exercisesPerSession,
        usedExerciseIds,
        goal
      );
      usedExerciseIds.push(...pullExercises2.map((e) => e.id));
      routines.push(
        createDayRoutine(
          "Pull Day 2",
          pullExercises2,
          sets,
          reps,
          rest,
          "Back, Biceps"
        )
      );

      // Day 6: Legs (different exercises)
      const legExercises2 = selectExercisesByCategoriesAdvanced(
        exercises,
        {
          legs: 1.0,
        },
        exercisesPerSession,
        usedExerciseIds,
        goal
      );
      routines.push(
        createDayRoutine(
          "Legs Day 2",
          legExercises2,
          sets,
          reps,
          rest,
          "Legs, Glutes, Calves"
        )
      );
    }

    return routines;
  };

  const createUpperLowerSplit = (
    exercises,
    sets,
    reps,
    rest,
    exercisesPerSession,
    repeat
  ) => {
    const routines = [];
    const usedExerciseIds = [];

    // Day 1: Upper (Chest, Back, Shoulders, Arms)
    const upperExercises = selectExercisesByCategoriesAdvanced(
      exercises,
      {
        chest: 0.3,
        back: 0.3,
        shoulders: 0.2,
        biceps: 0.1,
        triceps: 0.1,
      },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    usedExerciseIds.push(...upperExercises.map((e) => e.id));
    routines.push(
      createDayRoutine(
        "Upper Body",
        upperExercises,
        sets,
        reps,
        rest,
        "Chest, Back, Shoulders, Arms"
      )
    );

    // Day 2: Lower (Legs)
    const lowerExercises = selectExercisesByCategoriesAdvanced(
      exercises,
      {
        legs: 1.0,
      },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    usedExerciseIds.push(...lowerExercises.map((e) => e.id));
    routines.push(
      createDayRoutine(
        "Lower Body",
        lowerExercises,
        sets,
        reps,
        rest,
        "Legs, Glutes, Calves"
      )
    );

    if (repeat) {
      // Day 3: Upper (different exercises)
      const upperExercises2 = selectExercisesByCategoriesAdvanced(
        exercises,
        {
          chest: 0.3,
          back: 0.3,
          shoulders: 0.2,
          biceps: 0.1,
          triceps: 0.1,
        },
        exercisesPerSession,
        usedExerciseIds,
        goal
      );
      usedExerciseIds.push(...upperExercises2.map((e) => e.id));
      routines.push(
        createDayRoutine(
          "Upper Body 2",
          upperExercises2,
          sets,
          reps,
          rest,
          "Chest, Back, Shoulders, Arms"
        )
      );

      // Day 4: Lower (different exercises)
      const lowerExercises2 = selectExercisesByCategoriesAdvanced(
        exercises,
        {
          legs: 1.0,
        },
        exercisesPerSession,
        usedExerciseIds,
        goal
      );
      routines.push(
        createDayRoutine(
          "Lower Body 2",
          lowerExercises2,
          sets,
          reps,
          rest,
          "Legs, Glutes, Calves"
        )
      );
    }

    return routines;
  };

  const createFiveDayBodyPartSplit = (
    exercises,
    sets,
    reps,
    rest,
    exercisesPerSession
  ) => {
    const routines = [];
    const usedExerciseIds = [];

    // Day 1: Chest
    const chestExercises = selectExercisesByCategoriesAdvanced(
      exercises,
      { chest: 1.0 },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    usedExerciseIds.push(...chestExercises.map((e) => e.id));
    routines.push(
      createDayRoutine("Chest Day", chestExercises, sets, reps, rest, "Chest")
    );

    // Day 2: Back
    const backExercises = selectExercisesByCategoriesAdvanced(
      exercises,
      { back: 1.0 },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    usedExerciseIds.push(...backExercises.map((e) => e.id));
    routines.push(
      createDayRoutine("Back Day", backExercises, sets, reps, rest, "Back")
    );

    // Day 3: Legs
    const legExercises = selectExercisesByCategoriesAdvanced(
      exercises,
      { legs: 1.0 },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    usedExerciseIds.push(...legExercises.map((e) => e.id));
    routines.push(
      createDayRoutine("Legs Day", legExercises, sets, reps, rest, "Legs")
    );

    // Day 4: Shoulders & Arms
    const shoulderArmExercises = selectExercisesByCategoriesAdvanced(
      exercises,
      {
        shoulders: 0.5,
        biceps: 0.25,
        triceps: 0.25,
      },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    usedExerciseIds.push(...shoulderArmExercises.map((e) => e.id));
    routines.push(
      createDayRoutine(
        "Shoulders & Arms",
        shoulderArmExercises,
        sets,
        reps,
        rest,
        "Shoulders, Arms"
      )
    );

    // Day 5: Full Body
    const fullBodyExercises = selectExercisesByCategoriesAdvanced(
      exercises,
      {
        chest: 0.2,
        back: 0.2,
        legs: 0.3,
        shoulders: 0.15,
        core: 0.15,
      },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    routines.push(
      createDayRoutine(
        "Full Body",
        fullBodyExercises,
        sets,
        reps,
        rest,
        "Full Body"
      )
    );

    return routines;
  };

  const createFiveDayEnduranceSplit = (
    exercises,
    sets,
    reps,
    rest,
    exercisesPerSession
  ) => {
    const routines = [];
    const usedExerciseIds = [];

    // 3 days full body + 2 days cardio/core
    for (let i = 0; i < 3; i++) {
      const fullBodyExercises = selectExercisesByCategoriesAdvanced(
        exercises,
        {
          chest: 0.2,
          back: 0.2,
          legs: 0.3,
          shoulders: 0.15,
          core: 0.15,
        },
        exercisesPerSession,
        usedExerciseIds,
        goal
      );
      usedExerciseIds.push(...fullBodyExercises.map((e) => e.id));
      routines.push(
        createDayRoutine(
          `Full Body ${i + 1}`,
          fullBodyExercises,
          sets,
          reps,
          rest,
          "Full Body"
        )
      );
    }

    // Day 4: Cardio + Core
    const cardioCore1 = selectExercisesByCategoriesAdvanced(
      exercises,
      {
        cardio: 0.6,
        core: 0.4,
      },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    usedExerciseIds.push(...cardioCore1.map((e) => e.id));
    routines.push(
      createDayRoutine(
        "Cardio & Core 1",
        cardioCore1,
        sets,
        reps,
        rest,
        "Cardio, Core"
      )
    );

    // Day 5: Cardio + Core
    const cardioCore2 = selectExercisesByCategoriesAdvanced(
      exercises,
      {
        cardio: 0.6,
        core: 0.4,
      },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    routines.push(
      createDayRoutine(
        "Cardio & Core 2",
        cardioCore2,
        sets,
        reps,
        rest,
        "Cardio, Core"
      )
    );

    return routines;
  };

  const createFullBodySplit = (
    exercises,
    sets,
    reps,
    rest,
    exercisesPerSession
  ) => {
    const routines = [];
    const usedExerciseIds = [];

    // Day 1: Full Body A
    const fullBodyA = selectExercisesByCategoriesAdvanced(
      exercises,
      {
        chest: 0.2,
        back: 0.2,
        legs: 0.3,
        shoulders: 0.15,
        core: 0.15,
      },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    usedExerciseIds.push(...fullBodyA.map((e) => e.id));
    routines.push(
      createDayRoutine("Full Body A", fullBodyA, sets, reps, rest, "Full Body")
    );

    // Day 2: Full Body B (different exercises)
    const fullBodyB = selectExercisesByCategoriesAdvanced(
      exercises,
      {
        chest: 0.2,
        back: 0.2,
        legs: 0.3,
        shoulders: 0.15,
        core: 0.15,
      },
      exercisesPerSession,
      usedExerciseIds,
      goal
    );
    routines.push(
      createDayRoutine("Full Body B", fullBodyB, sets, reps, rest, "Full Body")
    );

    return routines;
  };

  const createFullBodyEnduranceSplit = (
    exercises,
    sets,
    reps,
    rest,
    exercisesPerSession,
    days
  ) => {
    const routines = [];
    const usedExerciseIds = [];

    for (let i = 0; i < days; i++) {
      const fullBodyExercises = selectExercisesByCategoriesAdvanced(
        exercises,
        {
          chest: 0.15,
          back: 0.15,
          legs: 0.25,
          shoulders: 0.1,
          core: 0.15,
          cardio: 0.2,
        },
        exercisesPerSession,
        usedExerciseIds,
        goal
      );
      usedExerciseIds.push(...fullBodyExercises.map((e) => e.id));
      routines.push(
        createDayRoutine(
          `Full Body ${i + 1}`,
          fullBodyExercises,
          sets,
          reps,
          rest,
          "Full Body"
        )
      );
    }

    return routines;
  };

  const selectExercisesByCategories = (
    exercises,
    categories,
    count,
    excludeIds = []
  ) => {
    const categoryExercises = exercises.filter(
      (ex) => categories.includes(ex.category) && !excludeIds.includes(ex.id)
    );

    // Prioritize compound movements
    const compounds = categoryExercises.filter(
      (ex) =>
        ex.name.includes("Squat") ||
        ex.name.includes("Deadlift") ||
        ex.name.includes("Bench Press") ||
        ex.name.includes("Pull-up") ||
        ex.name.includes("Row") ||
        ex.name.includes("Press") ||
        ex.name.includes("Dip")
    );

    const isolation = categoryExercises.filter((ex) => !compounds.includes(ex));

    // Select 60% compounds, 40% isolation
    const compoundCount = Math.ceil(count * 0.6);
    const isolationCount = count - compoundCount;

    const selectedCompounds = compounds
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(compoundCount, compounds.length));

    const selectedIsolation = isolation
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.min(isolationCount, isolation.length));

    const selected = [...selectedCompounds, ...selectedIsolation];

    // If we don't have enough, fill with any remaining
    if (selected.length < count) {
      const remaining = categoryExercises
        .filter((ex) => !selected.includes(ex))
        .sort(() => 0.5 - Math.random())
        .slice(0, count - selected.length);
      selected.push(...remaining);
    }

    return selected.slice(0, count);
  };

  // Advanced exercise selection with category distribution
  const selectExercisesByCategoriesAdvanced = (
    exercises,
    categoryRatios,
    totalCount,
    excludeIds,
    trainingGoal
  ) => {
    const selected = [];
    const categories = Object.keys(categoryRatios);

    // Define compound movement patterns
    const compoundPatterns = [
      "Squat",
      "Deadlift",
      "Bench Press",
      "Press",
      "Pull-up",
      "Chin-up",
      "Row",
      "Dip",
      "Lunge",
      "Hip Thrust",
    ];

    // Define explosive/athletic movements
    const explosivePatterns = [
      "Jump",
      "Box",
      "Battle",
      "Burpees",
      "Power",
      "Snatch",
      "Clean",
    ];

    // Step 1: Calculate how many exercises per category
    const categoryCount = {};
    for (const [category, ratio] of Object.entries(categoryRatios)) {
      categoryCount[category] = Math.max(1, Math.round(totalCount * ratio));
    }

    // Step 2: For each category, select exercises
    for (const category of categories) {
      const count = categoryCount[category];
      const categoryExercises = exercises.filter(
        (ex) => ex.category === category && !excludeIds.includes(ex.id)
      );

      if (categoryExercises.length === 0) continue;

      // Separate compounds and isolation
      const compounds = categoryExercises.filter((ex) =>
        compoundPatterns.some((pattern) => ex.name.includes(pattern))
      );

      const explosive = categoryExercises.filter((ex) =>
        explosivePatterns.some((pattern) => ex.name.includes(pattern))
      );

      const isolation = categoryExercises.filter(
        (ex) => !compounds.includes(ex) && !explosive.includes(ex)
      );

      // Select based on goal
      let categorySelected = [];

      if (trainingGoal === "strength") {
        // Strength: Prioritize compounds heavily
        const compoundCount = Math.max(1, Math.ceil(count * 0.8));
        categorySelected = [
          ...compounds.sort(() => 0.5 - Math.random()).slice(0, compoundCount),
          ...isolation
            .sort(() => 0.5 - Math.random())
            .slice(0, count - compoundCount),
        ];
      } else if (trainingGoal === "athletic") {
        // Athletic: Mix explosive + compounds
        const explosiveCount = Math.ceil(count * 0.4);
        const compoundCount = Math.ceil(count * 0.4);
        categorySelected = [
          ...explosive.sort(() => 0.5 - Math.random()).slice(0, explosiveCount),
          ...compounds.sort(() => 0.5 - Math.random()).slice(0, compoundCount),
          ...isolation
            .sort(() => 0.5 - Math.random())
            .slice(0, count - explosiveCount - compoundCount),
        ];
      } else if (trainingGoal === "endurance" || trainingGoal === "fat_loss") {
        // Endurance/Fat Loss: Balanced with more variety
        categorySelected = [
          ...compounds.sort(() => 0.5 - Math.random()).slice(0, count / 2),
          ...isolation.sort(() => 0.5 - Math.random()).slice(0, count / 2),
        ];
      } else {
        // Muscle Gain (Hypertrophy): 60% compounds, 40% isolation
        const compoundCount = Math.ceil(count * 0.6);
        categorySelected = [
          ...compounds.sort(() => 0.5 - Math.random()).slice(0, compoundCount),
          ...isolation
            .sort(() => 0.5 - Math.random())
            .slice(0, count - compoundCount),
        ];
      }

      // Fill if needed
      if (categorySelected.length < count) {
        const remaining = categoryExercises
          .filter((ex) => !categorySelected.includes(ex))
          .sort(() => 0.5 - Math.random())
          .slice(0, count - categorySelected.length);
        categorySelected.push(...remaining);
      }

      selected.push(...categorySelected.slice(0, count));
    }

    // Step 3: Apply focus area boost
    if (focusAreas.length > 0) {
      const focusCategoryMap = {
        chest: "chest",
        back: "back",
        shoulders: "shoulders",
        arms: ["biceps", "triceps"],
        legs: "legs",
        abs: "core",
      };

      for (const focusArea of focusAreas) {
        const focusCategories = Array.isArray(focusCategoryMap[focusArea])
          ? focusCategoryMap[focusArea]
          : [focusCategoryMap[focusArea]];

        for (const focusCategory of focusCategories) {
          // Add 1 extra isolation exercise for focus area
          const focusExercises = exercises.filter(
            (ex) =>
              ex.category === focusCategory &&
              !excludeIds.includes(ex.id) &&
              !selected.some((s) => s.id === ex.id)
          );

          if (focusExercises.length > 0) {
            const isolation = focusExercises.filter(
              (ex) =>
                !compoundPatterns.some((pattern) => ex.name.includes(pattern))
            );

            if (isolation.length > 0) {
              const extraExercise =
                isolation[Math.floor(Math.random() * isolation.length)];
              selected.push(extraExercise);
            }
          }
        }
      }
    }

    // Step 4: Limit to total count and shuffle for variety
    return selected.slice(0, totalCount).sort(() => 0.5 - Math.random());
  };

  const createDayRoutine = (
    dayName,
    selectedExercises,
    sets,
    reps,
    rest,
    muscleGroups
  ) => {
    const routineExercises = selectedExercises.map((ex) => {
      // Adjust sets for focus areas
      let adjustedSets = sets;
      const focusCategoryMap = {
        chest: "chest",
        back: "back",
        shoulders: "shoulders",
        arms: ["biceps", "triceps"],
        legs: "legs",
        abs: "core",
      };

      for (const focusArea of focusAreas) {
        const focusCategories = Array.isArray(focusCategoryMap[focusArea])
          ? focusCategoryMap[focusArea]
          : [focusCategoryMap[focusArea]];

        if (focusCategories.includes(ex.category)) {
          adjustedSets = sets + 1; // Add 1 extra set for focus areas
          break;
        }
      }

      return {
        id: ex.id,
        name: ex.name,
        sets: adjustedSets,
        reps: reps,
        restSeconds: rest,
        weight: 0,
        notes: "",
        exerciseId: ex.id,
        muscleGroup: ex.muscleGroup || ex.category,
        category: ex.category,
        exerciseData: {
          id: ex.id,
          name: ex.name,
          muscleGroup: ex.muscleGroup || ex.category,
          category: ex.category,
          body_part: ex.muscleGroup || ex.category,
          type: ex.category === "cardio" ? "cardio" : "strength",
          met: ex.met || 8.0,
          volume_coefficient: ex.volume_coefficient || 1.0,
        },
      };
    });

    return {
      name: dayName,
      exercises: routineExercises,
      muscleGroups: muscleGroups,
    };
  };

  const saveRoutine = async () => {
    if (!generatedRoutine || generatedRoutine.length === 0) return;

    try {
      setLoading(true);

      if (saveOption === "program") {
        // Save as active program (day-by-day progression)
        const goalName = goals.find((g) => g.id === goal).name;
        await createActiveProgram(user.uid, {
          programName: `${goalName} Program`,
          goal: goalName,
          totalDays: generatedRoutine.length,
          allRoutines: generatedRoutine,
        });

        showToast(
          "Active program created! Start your Day 1 workout.",
          "success"
        );
        navigate("/routines");
      } else {
        // Save each day as a separate routine
        for (let i = 0; i < generatedRoutine.length; i++) {
          const dayRoutine = generatedRoutine[i];
          await createRoutine(user.uid, {
            name: `${goals.find((g) => g.id === goal).name} - ${
              dayRoutine.name
            }`,
            exercises: dayRoutine.exercises,
          });
        }

        showToast(
          `${generatedRoutine.length} routines saved successfully!`,
          "success"
        );
        navigate("/routines");
      }
    } catch (error) {
      console.error("Error saving routine:", error);
      showToast("Error saving routine. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 24px" }}>
      <style>{`
        @media (max-width: 768px) {
          .builder-header h2 {
            font-size: 36px !important;
          }
          .goals-grid {
            grid-template-columns: 1fr !important;
          }
          .builder-form {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Header */}
      <div
        className="builder-header"
        style={{ marginBottom: "48px", animation: "fadeIn 0.5s ease-out" }}
      >
        <h2
          style={{
            fontFamily: "Bebas Neue, Impact, sans-serif",
            fontSize: "64px",
            letterSpacing: "0.05em",
            marginBottom: "8px",
            background:
              "linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          AUTO ROUTINE BUILDER
        </h2>
        <p
          style={{
            color: "#999",
            fontSize: "16px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            className="material-icons"
            style={{ fontSize: "20px", color: "#667eea" }}
          >
            auto_awesome
          </span>
          Create personalized workout routines based on your goals
        </p>
      </div>

      {!generatedRoutine ? (
        <>
          {/* Goal Selection */}
          <div style={{ marginBottom: "40px" }}>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "20px",
                color: "#fff",
                fontFamily: "Bebas Neue",
                letterSpacing: "0.05em",
              }}
            >
              SELECT YOUR GOAL
            </h3>
            <div
              className="goals-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              {goals.map((g) => (
                <div
                  key={g.id}
                  onClick={() => setGoal(g.id)}
                  style={{
                    background:
                      goal === g.id
                        ? `linear-gradient(135deg, ${g.color}20 0%, ${g.color}10 100%)`
                        : "#0a0a0a",
                    border: `2px solid ${goal === g.id ? g.color : "#2a2a2a"}`,
                    borderRadius: "16px",
                    padding: "24px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    textAlign: "center",
                  }}
                  onMouseEnter={(e) => {
                    if (goal !== g.id) {
                      e.currentTarget.style.borderColor = g.color + "50";
                      e.currentTarget.style.transform = "translateY(-4px)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (goal !== g.id) {
                      e.currentTarget.style.borderColor = "#2a2a2a";
                      e.currentTarget.style.transform = "translateY(0)";
                    }
                  }}
                >
                  <span
                    className="material-icons"
                    style={{
                      fontSize: "48px",
                      color: g.color,
                      marginBottom: "12px",
                    }}
                  >
                    {g.icon}
                  </span>
                  <h4
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: goal === g.id ? g.color : "#fff",
                      marginBottom: "8px",
                    }}
                  >
                    {g.name}
                  </h4>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#999",
                      lineHeight: "1.5",
                    }}
                  >
                    {g.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Configuration Form */}
          <div
            className="builder-form"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "24px",
              marginBottom: "40px",
              background: "#0a0a0a",
              border: "2px solid #2a2a2a",
              borderRadius: "16px",
              padding: "32px",
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Experience Level
              </label>
              <select
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#121212",
                  border: "2px solid #2a2a2a",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px",
                }}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Days Per Week
              </label>
              <select
                value={daysPerWeek}
                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#121212",
                  border: "2px solid #2a2a2a",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px",
                }}
              >
                <option value="2">2 Days</option>
                <option value="3">3 Days</option>
                <option value="4">4 Days</option>
                <option value="5">5 Days</option>
                <option value="6">6 Days</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Session Duration (minutes)
              </label>
              <select
                value={sessionDuration}
                onChange={(e) => setSessionDuration(Number(e.target.value))}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#121212",
                  border: "2px solid #2a2a2a",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px",
                }}
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#fff",
                  marginBottom: "12px",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Available Equipment
              </label>
              <select
                value={equipment}
                onChange={(e) => setEquipment(e.target.value)}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  background: "#121212",
                  border: "2px solid #2a2a2a",
                  borderRadius: "8px",
                  color: "#fff",
                  fontSize: "14px",
                }}
              >
                <option value="full_gym">Full Gym</option>
                <option value="home_dumbbells">Home (Dumbbells)</option>
                <option value="bodyweight">Bodyweight Only</option>
              </select>
            </div>
          </div>

          {/* Focus Areas */}
          <div style={{ marginBottom: "40px" }}>
            <h3
              style={{
                fontSize: "20px",
                fontWeight: 700,
                marginBottom: "20px",
                color: "#fff",
                fontFamily: "Bebas Neue",
                letterSpacing: "0.05em",
              }}
            >
              FOCUS AREAS (OPTIONAL)
            </h3>
            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {focusOptions.map((area) => (
                <button
                  key={area.id}
                  onClick={() => toggleFocusArea(area.id)}
                  style={{
                    padding: "12px 24px",
                    background: focusAreas.includes(area.id)
                      ? "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                      : "#0a0a0a",
                    border: `2px solid ${
                      focusAreas.includes(area.id) ? "#667eea" : "#2a2a2a"
                    }`,
                    borderRadius: "12px",
                    color: "#fff",
                    fontSize: "14px",
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span className="material-icons" style={{ fontSize: "20px" }}>
                    {area.icon}
                  </span>
                  {area.name}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={generateRoutine}
            disabled={loading}
            style={{
              width: "100%",
              padding: "20px",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              border: "none",
              borderRadius: "16px",
              color: "#fff",
              fontSize: "18px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "12px",
              opacity: loading ? 0.6 : 1,
            }}
          >
            <span className="material-icons" style={{ fontSize: "24px" }}>
              auto_awesome
            </span>
            {loading ? "Generating..." : "Generate Routine"}
          </button>
        </>
      ) : (
        // Generated Routine Display
        <div>
          <div
            style={{
              background: "#0a0a0a",
              border: "2px solid #667eea",
              borderRadius: "16px",
              padding: "32px",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "28px",
                fontWeight: 700,
                marginBottom: "16px",
                color: "#667eea",
                fontFamily: "Bebas Neue",
                letterSpacing: "0.05em",
              }}
            >
              {goals.find((g) => g.id === goal).name} - {daysPerWeek} Day Split
            </h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                gap: "16px",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  textAlign: "center",
                  padding: "16px",
                  background: "#121212",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#4ECDC4",
                    fontFamily: "Bebas Neue",
                  }}
                >
                  {generatedRoutine.length}
                </div>
                <div style={{ fontSize: "12px", color: "#999" }}>Days</div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  padding: "16px",
                  background: "#121212",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#FFD93D",
                    fontFamily: "Bebas Neue",
                  }}
                >
                  {generatedRoutine[0]?.exercises[0]?.sets || 0} ×{" "}
                  {generatedRoutine[0]?.exercises[0]?.reps || 0}
                </div>
                <div style={{ fontSize: "12px", color: "#999" }}>
                  Sets × Reps
                </div>
              </div>
              <div
                style={{
                  textAlign: "center",
                  padding: "16px",
                  background: "#121212",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#FF6B6B",
                    fontFamily: "Bebas Neue",
                  }}
                >
                  {generatedRoutine[0]?.exercises[0]?.restSeconds || 0}s
                </div>
                <div style={{ fontSize: "12px", color: "#999" }}>Rest</div>
              </div>
            </div>

            {/* Daily Routines */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              {generatedRoutine.map((dayRoutine, dayIdx) => (
                <div
                  key={dayIdx}
                  style={{
                    background: "#121212",
                    border: "2px solid #2a2a2a",
                    borderRadius: "16px",
                    padding: "24px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: "16px",
                      paddingBottom: "16px",
                      borderBottom: "1px solid #2a2a2a",
                    }}
                  >
                    <div>
                      <h4
                        style={{
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#fff",
                          fontFamily: "Bebas Neue",
                          letterSpacing: "0.05em",
                          marginBottom: "4px",
                        }}
                      >
                        Day {dayIdx + 1}: {dayRoutine.name}
                      </h4>
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#999",
                        }}
                      >
                        {dayRoutine.muscleGroups} •{" "}
                        {dayRoutine.exercises.length} exercises
                      </p>
                    </div>
                    <span
                      className="material-icons"
                      style={{ color: "#667eea", fontSize: "32px" }}
                    >
                      fitness_center
                    </span>
                  </div>

                  {/* Exercise List for this day */}
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    }}
                  >
                    {dayRoutine.exercises.map((ex, exIdx) => (
                      <div
                        key={exIdx}
                        style={{
                          padding: "12px 16px",
                          background: "#0a0a0a",
                          border: "1px solid #1a1a1a",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: 600,
                              color: "#fff",
                              marginBottom: "4px",
                            }}
                          >
                            {exIdx + 1}. {ex.name}
                          </div>
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#666",
                              fontFamily: "Roboto Mono",
                            }}
                          >
                            {ex.sets} sets × {ex.reps} reps • {ex.restSeconds}s
                            rest
                          </div>
                        </div>
                        <span
                          className="material-icons"
                          style={{ color: "#4ECDC4", fontSize: "18px" }}
                        >
                          check_circle_outline
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Save Options */}
          <div
            style={{
              background: "#0a0a0a",
              border: "2px solid #2a2a2a",
              borderRadius: "16px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <h3
              style={{
                fontSize: "18px",
                fontWeight: 700,
                marginBottom: "16px",
                color: "#fff",
                fontFamily: "Bebas Neue",
                letterSpacing: "0.05em",
              }}
            >
              How do you want to save this routine?
            </h3>
            <div
              style={{ display: "flex", gap: "16px", flexDirection: "column" }}
            >
              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "16px",
                  background:
                    saveOption === "separate" ? "#667eea20" : "#121212",
                  border: `2px solid ${
                    saveOption === "separate" ? "#667eea" : "#2a2a2a"
                  }`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <input
                  type="radio"
                  name="saveOption"
                  value="separate"
                  checked={saveOption === "separate"}
                  onChange={(e) => setSaveOption(e.target.value)}
                  style={{
                    marginTop: "4px",
                    accentColor: "#667eea",
                    cursor: "pointer",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      className="material-icons"
                      style={{
                        fontSize: "18px",
                        verticalAlign: "middle",
                        marginRight: "8px",
                        color: "#4ECDC4",
                      }}
                    >
                      list_alt
                    </span>
                    Save as Separate Routines
                  </div>
                  <div style={{ fontSize: "13px", color: "#999" }}>
                    Each day will be saved as an individual routine. Choose any
                    routine anytime.
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                  padding: "16px",
                  background:
                    saveOption === "program" ? "#667eea20" : "#121212",
                  border: `2px solid ${
                    saveOption === "program" ? "#667eea" : "#2a2a2a"
                  }`,
                  borderRadius: "12px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                <input
                  type="radio"
                  name="saveOption"
                  value="program"
                  checked={saveOption === "program"}
                  onChange={(e) => setSaveOption(e.target.value)}
                  style={{
                    marginTop: "4px",
                    accentColor: "#667eea",
                    cursor: "pointer",
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: "4px",
                    }}
                  >
                    <span
                      className="material-icons"
                      style={{
                        fontSize: "18px",
                        verticalAlign: "middle",
                        marginRight: "8px",
                        color: "#FFD93D",
                      }}
                    >
                      calendar_today
                    </span>
                    Save as Active Program (Recommended)
                  </div>
                  <div style={{ fontSize: "13px", color: "#999" }}>
                    Day-by-day progression. Start with Day 1, complete it, then
                    Day 2 appears. Cycles automatically after all days are done.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "16px" }}>
            <button
              onClick={saveRoutine}
              disabled={loading}
              style={{
                flex: 1,
                padding: "16px",
                background: "linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)",
                border: "none",
                borderRadius: "12px",
                color: "#fff",
                fontSize: "16px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
              }}
            >
              <span
                className="material-icons"
                style={{
                  fontSize: "20px",
                  marginRight: "8px",
                  verticalAlign: "middle",
                }}
              >
                save
              </span>
              {saveOption === "program"
                ? "Start Active Program"
                : `Save All ${generatedRoutine.length} Routines`}
            </button>
            <button
              onClick={() => setGeneratedRoutine(null)}
              disabled={loading}
              style={{
                flex: 1,
                padding: "16px",
                background: "#0a0a0a",
                border: "2px solid #2a2a2a",
                borderRadius: "12px",
                color: "#999",
                fontSize: "16px",
                fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                transition: "all 0.3s ease",
              }}
            >
              <span
                className="material-icons"
                style={{
                  fontSize: "20px",
                  marginRight: "8px",
                  verticalAlign: "middle",
                }}
              >
                refresh
              </span>
              Generate New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
