import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";
import { aiModel } from "../lib/gemini";
import {
  getUserStats,
  getRecentLogs,
  getAllPRs,
  getActiveProgram,
  getRoutines,
  getWeeklyMuscleData,
  getMonthlyMuscleData,
  getExercises,
  createRoutine,
} from "../lib/firebase-database";
import warriorImg from "../assets/w.png";

const COACHES = {
  sai: {
    name: "Sai",
    icon: null,
    image: warriorImg,
    gradient: "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)",
    color: "#f43f5e",
    shadowColor: "rgba(244, 63, 94, 0.3)",
    subtitle: "Beast Mode Coach 🔥",
    personality: "high-energy, disciplined, competitive gym bro coach",
    greeting: (name, gender) =>
      `Hey ${
        name || "champ"
      }! 🔥 I'm **Sai** — your high-energy, no-excuses fitness coach.\n\nI bring the hype, the discipline, and the grind you need to level up. I got access to all your stats, PRs, and progress.\n\n• Push you to beat your yesterday\n• Track your gains and PRs\n• Keep you locked in and consistent\n• Real talk on your progress\n\nLet's get after it — what do you need?`,
  },
  daisy: {
    name: "Daisy",
    icon: "self_improvement",
    image: null,
    gradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
    color: "#10b981",
    shadowColor: "rgba(16, 185, 129, 0.3)",
    subtitle: "Your Supportive Coach",
    personality: "warm, caring, gentle and uplifting fitness guide",
    greeting: (name, gender) => {
      return `Hey ${
        name || "there"
      }! I'm **Daisy**, your wellness coach. I'm here to support you every step of the way.\n\nI can help with:\n• Tracking your progress and celebrating wins\n• Building balanced workout routines\n• Keeping you consistent without pressure\n• Answering any fitness questions\n\nHow can I help you today?`;
    },
  },
};

export default function Coach() {
  const { user, profile } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loadingData, setLoadingData] = useState(true); // Show loading while fetching data
  const [activeCoach, setActiveCoach] = useState("sai");
  const [savingRoutine, setSavingRoutine] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const messagesEndRef = useRef(null);

  const coach = COACHES[activeCoach];

  // Show greeting after data loads
  useEffect(() => {
    if (profile && dataLoaded && messages.length === 0) {
      setMessages([
        {
          role: "assistant",
          content: COACHES[activeCoach].greeting(
            profile?.name,
            profile?.gender
          ),
        },
      ]);
    }
  }, [profile, dataLoaded]);

  // Function to parse workout days from AI response
  const parseWorkoutDays = (content, allExercises) => {
    if (!content || !allExercises) return [];

    const lines = content.split("\n");
    const days = [];
    let currentDay = null;

    for (const line of lines) {
      const cleanLine = line.replace(/\*\*/g, "").replace(/\*/g, "").trim();

      // Check for day headers like "Day 1: Lower Body Focus" or "Day 1 - Push"
      const dayMatch = cleanLine.match(/^Day\s*(\d+)[:\s-]+(.+)/i);
      if (dayMatch) {
        if (currentDay && currentDay.exercises.length > 0) {
          days.push(currentDay);
        }
        currentDay = {
          dayNumber: parseInt(dayMatch[1]),
          name: dayMatch[2].trim(),
          exercises: [],
        };
        continue;
      }

      // Skip non-exercise lines
      if (
        !cleanLine ||
        cleanLine.startsWith("Important") ||
        cleanLine.startsWith("How does") ||
        cleanLine.startsWith("Remember") ||
        cleanLine.startsWith("Rest:") ||
        cleanLine.startsWith("Warm") ||
        cleanLine.startsWith("Cool") ||
        cleanLine.startsWith("Maybe") ||
        cleanLine.startsWith("Adjust")
      )
        continue;

      // If no current day yet, create a default one
      if (!currentDay) {
        currentDay = { dayNumber: 1, name: "Workout", exercises: [] };
      }

      let exerciseName = null;
      let sets = 3;
      let reps = 12;

      // Pattern 1: "Exercise: 3 sets of X reps" or "* Exercise: 3 sets..."
      const exerciseMatch = cleanLine.match(
        /^[-•*]?\s*([^:]+):\s*(\d+)\s*sets?/i
      );
      if (exerciseMatch) {
        exerciseName = exerciseMatch[1].trim();
        sets = parseInt(exerciseMatch[2]) || 3;
      }

      // Pattern 2: "Muscle: Exercise (3 sets...)"
      if (!exerciseName) {
        const muscleExerciseMatch = cleanLine.match(
          /^[-•*]?\s*\w+:\s*([^(]+)\s*\((\d+)\s*sets?/i
        );
        if (muscleExerciseMatch) {
          exerciseName = muscleExerciseMatch[1].trim();
          sets = parseInt(muscleExerciseMatch[2]) || 3;
        }
      }

      // Pattern 3: Just "Exercise (3 sets...)" without colon prefix
      if (!exerciseName) {
        const simpleMatch = cleanLine.match(
          /^[-•*]?\s*([A-Z][a-zA-Z\s-]+)\s*\((\d+)\s*sets?/i
        );
        if (simpleMatch) {
          exerciseName = simpleMatch[1].trim();
          sets = parseInt(simpleMatch[2]) || 3;
        }
      }

      // Pattern 4: "* Exercise (X reps)" or "* Exercise (X per leg)"
      if (!exerciseName) {
        const repsInParenMatch = cleanLine.match(
          /^[-•*]?\s*([A-Z][a-zA-Z\s-]+)\s*\((\d+)\s*(reps?|per leg|per side)?/i
        );
        if (repsInParenMatch) {
          exerciseName = repsInParenMatch[1].trim();
          reps = parseInt(repsInParenMatch[2]) || 12;
        }
      }

      // Pattern 5: "* Exercise (as many as possible)" or "* Exercise (60 seconds)"
      if (!exerciseName) {
        const genericParenMatch = cleanLine.match(
          /^[-•*]?\s*([A-Z][a-zA-Z\s-]+)\s*\(([^)]+)\)/i
        );
        if (genericParenMatch) {
          exerciseName = genericParenMatch[1].trim();
          const inParen = genericParenMatch[2].toLowerCase();
          if (inParen.includes("as many") || inParen.includes("failure")) {
            reps = 0; // to failure
          } else if (inParen.includes("second")) {
            const secMatch = inParen.match(/(\d+)/);
            if (secMatch) reps = 0; // timed exercise
          } else {
            const numMatch = inParen.match(/(\d+)/);
            if (numMatch) reps = parseInt(numMatch[1]);
          }
        }
      }

      if (!exerciseName) continue;

      // Extract reps
      const repsMatch = cleanLine.match(/(\d+)[-–]?(\d+)?\s*reps?/i);
      if (repsMatch) {
        reps = parseInt(repsMatch[2] || repsMatch[1]) || 12;
      }

      if (
        cleanLine.toLowerCase().includes("to failure") ||
        cleanLine.toLowerCase().includes("as long as")
      ) {
        reps = 0;
      }

      // Find matching exercise - prefer exact matches first
      const searchName = exerciseName.toLowerCase().trim();
      let matchedExercise = null;

      // 1. Try exact match first
      matchedExercise = allExercises.find(
        (ex) => ex.name.toLowerCase() === searchName
      );

      // 2. Try exact match without parentheses (e.g., "Push-ups" matches "Push-ups (Standard)")
      if (!matchedExercise) {
        matchedExercise = allExercises.find(
          (ex) =>
            ex.name.toLowerCase().split("(")[0].trim() ===
            searchName.split("(")[0].trim()
        );
      }

      // 3. Try if search name starts with exercise name (avoid "Push-ups" matching "Diamond Push-ups")
      if (!matchedExercise) {
        matchedExercise = allExercises.find((ex) => {
          const exName = ex.name.toLowerCase();
          return (
            exName.startsWith(searchName) ||
            searchName.startsWith(exName.split("(")[0].trim())
          );
        });
      }

      if (
        matchedExercise &&
        !currentDay.exercises.find((e) => e.exercise_id === matchedExercise.id)
      ) {
        currentDay.exercises.push({
          exercise_id: matchedExercise.id,
          sets: sets,
          reps: reps || 12,
          duration_seconds: 0,
          weight: 0,
          rest_seconds: 90,
          exerciseData: matchedExercise,
        });
      }
    }

    // Don't forget the last day
    if (currentDay && currentDay.exercises.length > 0) {
      days.push(currentDay);
    }

    return days;
  };

  // Generate unique aesthetic routine name based on exercises
  const generateRoutineName = (exercises, dayName) => {
    // Get primary muscle groups from exercises
    const muscles = new Set();
    exercises.forEach((ex) => {
      if (ex.exerciseData?.muscles?.primary) {
        ex.exerciseData.muscles.primary.forEach((m) =>
          muscles.add(m?.toLowerCase())
        );
      }
      if (ex.exerciseData?.body_part) {
        muscles.add(ex.exerciseData.body_part.toLowerCase());
      }
    });

    const muscleList = [...muscles].filter(Boolean);
    const mainMuscle = muscleList[0] || "";

    // Aesthetic name templates
    const templates = {
      chest: [
        "Chest Crusher",
        "Pec Attack",
        "Iron Chest",
        "Chest Assault",
        "Pec Blaster",
      ],
      back: [
        "Back Destroyer",
        "Lat Attack",
        "V-Taper Builder",
        "Back Blitz",
        "Pull Power",
      ],
      legs: [
        "Leg Day Mayhem",
        "Quad Crusher",
        "Lower Body Blitz",
        "Leg Assault",
        "Iron Legs",
      ],
      shoulders: [
        "Boulder Shoulders",
        "Delt Destroyer",
        "Shoulder Shred",
        "Cap Builder",
        "Delt Attack",
      ],
      arms: [
        "Arm Annihilator",
        "Gun Show",
        "Arm Assault",
        "Peak Builder",
        "Sleeve Busters",
      ],
      biceps: [
        "Bicep Blitz",
        "Peak Builders",
        "Curl Crusher",
        "Arm Day",
        "Gun Show",
      ],
      triceps: [
        "Tricep Torcher",
        "Horseshoe Builder",
        "Tri Assault",
        "Push Power",
        "Arm Shred",
      ],
      core: [
        "Core Crusher",
        "Ab Assault",
        "Core Blitz",
        "Six Pack Attack",
        "Core Power",
      ],
      glutes: [
        "Glute Gains",
        "Booty Builder",
        "Glute Blitz",
        "Lower Power",
        "Hip Thrust Hero",
      ],
      full: [
        "Total Body Blast",
        "Full Send",
        "Complete Crusher",
        "All Out Attack",
        "Beast Mode",
      ],
    };

    // Check for full body or mixed
    const isFullBody =
      muscleList.length >= 4 ||
      (muscleList.some((m) => ["chest", "back"].includes(m)) &&
        muscleList.some((m) => ["legs", "glutes", "quadriceps"].includes(m)));

    let nameOptions;
    if (isFullBody) {
      nameOptions = templates.full;
    } else if (templates[mainMuscle]) {
      nameOptions = templates[mainMuscle];
    } else {
      // Default creative names
      nameOptions = [
        "Power Session",
        "Beast Mode",
        "Grind Time",
        "Iron Hour",
        "Pump Session",
      ];
    }

    // Pick random name and add timestamp for uniqueness
    const baseName =
      nameOptions[Math.floor(Math.random() * nameOptions.length)];
    const timestamp = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    return `${baseName} • ${timestamp}`;
  };

  // Save a specific day as routine
  const saveDayAsRoutine = async (day) => {
    if (!day || day.exercises.length === 0) {
      toast.error("No exercises to save");
      return;
    }

    setSavingRoutine(true);
    try {
      // Generate unique aesthetic name based on exercises
      const routineName = generateRoutineName(day.exercises, day.name);
      await createRoutine(user.uid, {
        name: routineName,
        type: "strength",
        exercises: day.exercises,
      });
      toast.success(`Saved "${routineName}" to your routines!`);
    } catch (error) {
      console.error("Error saving routine:", error);
      toast.error("Failed to save routine");
    } finally {
      setSavingRoutine(false);
    }
  };

  // Save single workout plan as routine
  const saveAsRoutine = async (content) => {
    const days = getWorkoutDays(content);
    if (days.length === 0 || days[0].exercises.length === 0) {
      toast.error("No exercises found to save");
      return;
    }

    // For single workout, use the first (and only) day
    await saveDayAsRoutine(days[0]);
  };

  // Check if message contains workout days
  const getWorkoutDays = (content) => {
    if (!userData?.exercises) return [];
    return parseWorkoutDays(content, userData.exercises);
  };

  // Check if AI response contains a workout plan (not PRs or stats)
  const hasWorkoutPlan = (content) => {
    if (!userData?.exercises) return false;

    // Skip if this looks like PR/stats display (contains "kg x" or "reps (Volume")
    const lowerContent = content.toLowerCase();
    if (
      lowerContent.includes("kg x") ||
      lowerContent.includes("volume:") ||
      lowerContent.includes("personal record") ||
      lowerContent.includes("your pr") ||
      lowerContent.includes("your top") ||
      lowerContent.includes("you're crushing") ||
      lowerContent.includes("here's what you") ||
      lowerContent.includes("those prs")
    ) {
      return false;
    }

    // Check for workout plan indicators
    const hasWorkoutIndicators =
      lowerContent.includes("sets of") ||
      lowerContent.includes("sets, ") ||
      lowerContent.includes("workout") ||
      lowerContent.includes("routine") ||
      lowerContent.includes("day 1") ||
      lowerContent.includes("day 2");

    if (!hasWorkoutIndicators) return false;

    const days = parseWorkoutDays(content, userData.exercises);
    return days.length > 0 && days.some((day) => day.exercises.length > 0);
  };

  // Load all user data for context
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Switch coach handler
  const switchCoach = (newCoach) => {
    if (newCoach === activeCoach) return;
    setActiveCoach(newCoach);
    // Reset chat with new coach's greeting
    setMessages([
      {
        role: "assistant",
        content: COACHES[newCoach].greeting(profile?.name, profile?.gender),
      },
    ]);
  };

  const loadUserData = async () => {
    setLoadingData(true);
    try {
      const [
        stats,
        recentLogs,
        prs,
        activeProgram,
        routines,
        muscleData,
        exercises,
        monthlyData,
        lastMonthData,
      ] = await Promise.all([
        getUserStats(user.uid),
        getRecentLogs(user.uid, 30), // Last 30 logs
        getAllPRs(user.uid),
        getActiveProgram(user.uid),
        getRoutines(user.uid),
        getWeeklyMuscleData(user.uid),
        getExercises(),
        getMonthlyMuscleData(user.uid, 0), // Current month
        getMonthlyMuscleData(user.uid, -1), // Last month
      ]);

      const data = {
        profile: {
          name: profile?.name || "User",
          bodyWeight: profile?.body_weight_kg,
          height: profile?.height_cm,
          age: profile?.age,
          gender: profile?.gender,
        },
        stats,
        recentLogs: recentLogs.slice(0, 20), // Last 20 for context
        personalRecords: prs,
        activeProgram,
        routines,
        muscleData,
        exercises,
        monthlyData,
        lastMonthData,
      };

      setUserData(data);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error loading user data:", error);
      // Don't show error toast - just work without context
    } finally {
      setLoadingData(false);
    }
  };

  const generateSystemPrompt = () => {
    // Basic prompt if data not loaded yet
    if (!userData) {
      const userGender = profile?.gender?.toLowerCase() || "";
      const isMale = userGender === "male";
      const isFemale = userGender === "female";

      if (activeCoach === "daisy") {
        return `You are "Daisy", a warm and caring female fitness coach. Be supportive and encouraging. User's name is ${
          profile?.name || "friend"
        }. Your workout data is loading in the background - ask them to wait a moment and try again, or help with general fitness questions.`;
      } else {
        return `You are "Sai", a high-energy male fitness coach. Be motivating and direct. User's name is ${
          profile?.name || "champ"
        }. Your workout data is loading in the background - ask them to wait a moment and try again, or help with general fitness questions. Keep it professional - no weird jokes or inappropriate humor.`;
      }
    }

    const {
      profile: userProfile,
      stats,
      recentLogs,
      personalRecords,
      activeProgram,
      routines,
      muscleData,
      exercises,
      monthlyData,
      lastMonthData,
    } = userData;

    // Calculate workout frequency
    const workoutDays = new Set(recentLogs.map((log) => log.date)).size;
    const dayRange = recentLogs.length > 0 ? 30 : 0;
    const workoutsPerWeek =
      dayRange > 0 ? ((workoutDays / dayRange) * 7).toFixed(1) : 0;

    // Calculate weekly calories from muscleData
    const weeklyCalories = muscleData.reduce(
      (sum, day) => sum + (day.calories || 0),
      0
    );

    // Calculate monthly calories
    const currentMonthCalories =
      monthlyData?.reduce((sum, day) => sum + (day.calories || 0), 0) || 0;
    const lastMonthCalories =
      lastMonthData?.reduce((sum, day) => sum + (day.calories || 0), 0) || 0;

    // Get current and last month names
    const currentMonthName = new Date().toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthName = lastMonth.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    // Get top exercises by frequency
    const exerciseFreq = {};
    recentLogs.forEach((log) => {
      const name = log.exerciseName || "Unknown";
      exerciseFreq[name] = (exerciseFreq[name] || 0) + 1;
    });
    const topExercises = Object.entries(exerciseFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => `${name} (${count}x)`);

    // Get muscle groups worked - muscleData is array of daily stats with exercises
    const muscleGroups = {};
    muscleData.forEach((day) => {
      if (day.exercises && Array.isArray(day.exercises)) {
        day.exercises.forEach((exercise) => {
          // Count sets for primary muscles
          if (exercise.muscles?.primary) {
            exercise.muscles.primary.forEach((muscle) => {
              if (muscle) {
                muscleGroups[muscle] =
                  (muscleGroups[muscle] || 0) + (exercise.sets || 1);
              }
            });
          }
          // Also count secondary muscles (with less weight)
          if (exercise.muscles?.secondary) {
            exercise.muscles.secondary.forEach((muscle) => {
              if (muscle) {
                muscleGroups[muscle] =
                  (muscleGroups[muscle] || 0) +
                  Math.ceil((exercise.sets || 1) * 0.5);
              }
            });
          }
        });
      }
    });
    const topMuscles = Object.entries(muscleGroups)
      .filter(([muscle]) => muscle && muscle !== "undefined")
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([muscle, count]) => `${muscle} (${count} sets)`);

    // Format PRs - use correct field names (maxWeight, maxReps)
    const topPRs = personalRecords
      .filter((pr) => pr.maxWeight > 0) // Only include PRs with actual weight
      .sort((a, b) => (b.maxWeight || 0) - (a.maxWeight || 0))
      .slice(0, 10)
      .map(
        (pr) =>
          `${pr.exerciseName}: ${pr.maxWeight}kg x ${pr.maxReps} reps (Volume: ${pr.maxVolume}kg)`
      );

    // Group exercises by category for suggestions
    const exercisesByCategory = {};
    exercises.forEach((ex) => {
      const category = ex.category || "other";
      if (!exercisesByCategory[category]) {
        exercisesByCategory[category] = [];
      }
      exercisesByCategory[category].push(ex.name);
    });

    const availableExercises = Object.entries(exercisesByCategory)
      .map(
        ([category, exList]) =>
          `${category.toUpperCase()}: ${exList.join(", ")}`
      )
      .join("\n");

    const userGender = userProfile.gender?.toLowerCase() || "";
    const isMale = userGender === "male";
    const isFemale = userGender === "female";

    let coachPersonality;

    if (activeCoach === "daisy") {
      coachPersonality = `You are "Daisy", a warm and caring female fitness coach with a gentle, uplifting vibe.
Your personality: soft encouragement, emotional support, calm motivation, and positive energy.

USER GENDER: ${isMale ? "MALE" : isFemale ? "FEMALE" : "NOT SPECIFIED"}

GENDER-SPECIFIC LANGUAGE:
${
  isMale
    ? `- For males: Use friendly terms like "hey you", "${userProfile.name}", "handsome" (occasionally)
- Be warm but not flirty, like a supportive sister or friend
- Encourage strength and progress while staying gentle`
    : isFemale
    ? `- For females: Use terms like "girl", "queen", "${userProfile.name}"
- Be like a supportive best friend who gets it
- Focus on feeling strong, confident, and empowered`
    : `- Use neutral friendly terms like "${userProfile.name}", "friend"
- Be warm and supportive to everyone`
}

TONE RULES:
- Use warm, supportive, comforting language
- Keep messages slightly longer (2-4 gentle sentences)
- Encourage self-care, pacing, deep breathing, and confidence
- Use phrases like "I'm proud of you", "You're doing great", "Take it slow, you've got this"
- Never use romantic or flirty language
- Stay strictly fitness-focused
- Use emojis sparingly for warmth (1-2 per message)

COACHING RULES:
1. Prioritize emotional comfort and clarity
2. Offer options ("we can go easy or do a normal session—your choice")
3. If user mentions pain, advise stopping immediately, resting, and seeking professional help
4. Explain benefits of movements and help user stay consistent without pressure
5. Give specific advice based on their actual data
6. Use their name (${userProfile.name}) warmly
7. ONLY suggest exercises from the AVAILABLE EXERCISES list below
8. Use exact exercise names from the list
9. When giving workout plans, ALWAYS use this EXACT format for each exercise:
    - ExerciseName: X sets of Y reps
    Example: "Push-ups: 3 sets of 12 reps" or "Plank: 3 sets of 60 seconds"

YOUR GOAL:
Be the user's calming, supportive fitness guide who boosts confidence, reduces stress, and makes every workout feel safe and encouraging.`;
    } else {
      coachPersonality = `You are "Sai", a friendly and motivating male fitness coach.
Your personality: positive, encouraging, knowledgeable, and supportive.
You're like a helpful gym buddy who knows his stuff and genuinely wants to help.

USER GENDER: ${isMale ? "MALE" : isFemale ? "FEMALE" : "NOT SPECIFIED"}

GENDER-SPECIFIC LANGUAGE:
${
  isMale
    ? `- For males: Use friendly terms like "bro", "man", "${userProfile.name}"
- Be like a supportive gym buddy
- Encourage progress without being pushy`
    : isFemale
    ? `- For females: Use respectful terms like "champ", "${userProfile.name}"
- Be encouraging and supportive
- Focus on strength and progress`
    : `- Use friendly terms like "${userProfile.name}", "champ"
- Keep the energy positive for everyone`
}

TONE RULES:
- Be friendly, warm, and approachable
- Keep messages concise but helpful (2-3 sentences)
- Celebrate wins genuinely ("Nice work!", "That's awesome!")
- Be encouraging, not demanding or pushy
- Never be rude or aggressive
- Stay fitness-focused but conversational
- Use emojis sparingly (1 per message max)

RESPONSE TO GREETINGS:
- When user says "hi", "hello", "hey" - respond warmly and ask how you can help
- Example: "Hey ${
        userProfile.name
      }! Good to see you. What can I help you with today?"
- DON'T immediately push them to work out or "crush goals"

COACHING RULES:
1. Be helpful and supportive, never pushy
2. Always prioritize safety: If user mentions pain, advise rest and professional help
3. Give clear, practical advice
4. Use their actual data to give personalized tips
5. Use their name (${userProfile.name}) naturally
6. ONLY suggest exercises from the AVAILABLE EXERCISES list below
7. Use exact exercise names from the list
8. When giving workout plans, ALWAYS use this EXACT format for each exercise:
    - ExerciseName: X sets of Y reps
    Example: "Push-ups: 3 sets of 12 reps" or "Plank: 3 sets of 60 seconds"

YOUR GOAL:
Be the user's friendly fitness buddy who helps them stay on track with encouragement, not pressure.`;
    }

    return `${coachPersonality}

USER PROFILE:
- Name: ${userProfile.name}
- Body Weight: ${userProfile.bodyWeight || "Not set"} kg
- Height: ${userProfile.height || "Not set"} cm
- Age: ${userProfile.age || "Not set"}
- Gender: ${userProfile.gender || "Not set"}

WORKOUT STATS:
- Recent Workout Logs: ${recentLogs.length} exercises logged recently
- Unique Workout Days (recent): ${workoutDays}
- Workouts Per Week (avg): ${workoutsPerWeek}

THIS WEEK'S ACTIVITY:
- Workout Days This Week: ${muscleData.length} days with workouts
- Top Exercises This Week: ${topExercises.join(", ") || "None yet"}
- Most Worked Muscles This Week: ${topMuscles.join(", ") || "None yet"}

CALORIE HISTORY (Calories Burned):
- This Week: ${weeklyCalories} kcal
- ${currentMonthName}: ${currentMonthCalories} kcal
- ${lastMonthName}: ${lastMonthCalories} kcal

PERSONAL RECORDS (Top 10):
${topPRs.join("\n") || "No PRs yet"}

ACTIVE PROGRAM:
${
  activeProgram
    ? `${activeProgram.name} - Day ${activeProgram.currentDay}/${activeProgram.totalDays}`
    : "No active program"
}

SAVED ROUTINES:
${routines.map((r) => r.name).join(", ") || "No saved routines"}

AVAILABLE EXERCISES IN THE APP (Only suggest from this list):
${availableExercises}

Based on this data, help the user with their fitness questions and provide personalized insights. Remember to ONLY recommend exercises from the available list above.`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const systemPrompt = generateSystemPrompt();

      // Build conversation history for context
      const conversationHistory = messages
        .slice(-10) // Last 10 messages for context
        .map((m) => `${m.role === "user" ? "User" : coach.name}: ${m.content}`)
        .join("\n\n");

      const fullPrompt = `${systemPrompt}\n\nCONVERSATION HISTORY:\n${conversationHistory}\n\nUser: ${userMessage}\n\n${coach.name}:`;

      // Use Firebase AI (Vertex AI)
      const result = await aiModel.generateContent(fullPrompt);
      const response = result.response;
      const aiResponse =
        response.text() ||
        "I'm having trouble responding right now. Please try again!";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: aiResponse },
      ]);
    } catch (error) {
      console.error("Error calling Firebase AI:", error);
      // Fallback to local response
      const localResponse = generateLocalResponse(userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: localResponse },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Local response generator when API is unavailable
  const generateLocalResponse = (query) => {
    const lowerQuery = query.toLowerCase();
    const { profile, stats, recentLogs, personalRecords, muscleData } =
      userData || {};

    if (lowerQuery.includes("pr") || lowerQuery.includes("record")) {
      if (personalRecords?.length > 0) {
        const validPRs = personalRecords.filter((pr) => pr.maxWeight > 0);
        if (validPRs.length > 0) {
          const topPR = validPRs.sort(
            (a, b) => (b.maxWeight || 0) - (a.maxWeight || 0)
          )[0];
          return `Your top PR is **${topPR.exerciseName}** at **${topPR.maxWeight}kg x ${topPR.maxReps} reps**! 🏆\n\nYou have ${validPRs.length} total PRs recorded. Keep pushing!`;
        }
      }
      return "You haven't set any PRs yet! Complete some workouts and I'll track your records automatically.";
    }

    if (lowerQuery.includes("workout") || lowerQuery.includes("exercise")) {
      const workoutDays = new Set(recentLogs?.map((l) => l.date) || []).size;
      const exerciseCount = recentLogs?.length || 0;
      return `You've logged **${exerciseCount} exercises** across **${workoutDays} workout days** recently! ${
        workoutDays > 3
          ? "Great consistency! 💪"
          : "Keep going, you're building a habit!"
      }\n\nRecent exercises include: ${
        recentLogs
          ?.slice(0, 3)
          .map((l) => l.exerciseName)
          .join(", ") || "None yet"
      }`;
    }

    if (lowerQuery.includes("muscle") || lowerQuery.includes("train")) {
      // Extract muscles from muscleData (array of daily stats)
      const muscleGroups = {};
      muscleData?.forEach((day) => {
        if (day.exercises && Array.isArray(day.exercises)) {
          day.exercises.forEach((exercise) => {
            if (exercise.muscles?.primary) {
              exercise.muscles.primary.forEach((muscle) => {
                if (muscle)
                  muscleGroups[muscle] = (muscleGroups[muscle] || 0) + 1;
              });
            }
          });
        }
      });
      const topMuscles = Object.entries(muscleGroups)
        .filter(([muscle]) => muscle && muscle !== "undefined")
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([muscle]) => muscle);

      return `This week you've focused on: **${
        topMuscles.join(", ") || "No data yet"
      }**\n\nFor balanced growth, make sure you're hitting all major muscle groups throughout the week!`;
    }

    if (lowerQuery.includes("weight") || lowerQuery.includes("body")) {
      return `Your current body weight is **${
        profile?.bodyWeight || "not set"
      } kg**.\n\nUpdate your weight in Settings to track your progress over time!`;
    }

    if (lowerQuery.includes("tip") || lowerQuery.includes("advice")) {
      const tips = [
        "Progressive overload is key! Try adding 2.5kg or 1-2 reps each session.",
        "Rest days are when you grow. Make sure you're getting 7-9 hours of sleep!",
        "Track your nutrition too - you can't out-train a bad diet.",
        "Compound movements like squats, deadlifts, and bench press give you the most bang for your buck.",
        "Stay hydrated! Aim for 3-4 liters of water daily when training.",
      ];
      return tips[Math.floor(Math.random() * tips.length)] + " 💡";
    }

    return `I'm here to help with your fitness journey, ${
      profile?.name || "friend"
    }! Ask me about:\n• Your PRs and progress\n• Workout analysis\n• Muscle balance\n• Training tips\n\nWhat would you like to know?`;
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Quick action buttons - different vibes for each coach
  const quickActions =
    activeCoach === "daisy"
      ? [
          { label: "My PRs", query: "Show me my personal records" },
          { label: "Weekly Summary", query: "How was my training this week?" },
          {
            label: "Muscle Balance",
            query: "Am I training all muscles equally?",
          },
          { label: "Tips", query: "Give me a training tip" },
          { label: "Progress Check", query: "How am I doing overall?" },
        ]
      : [
          { label: "My PRs", query: "Show me my personal records" },
          { label: "Weekly Summary", query: "How was my training this week?" },
          {
            label: "Muscle Balance",
            query: "Am I training all muscles equally?",
          },
          { label: "Tips", query: "Give me a training tip" },
        ];

  // Show loading page while data is loading
  if (loadingData) {
    return (
      <div
        style={{
          minHeight: "100vh",
          width: "100%",
          background: "linear-gradient(135deg, #0a0a0a 0%, #111 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          padding: "20px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "100px",
            height: "100px",
            background: coach.image ? "transparent" : coach.gradient,
            borderRadius: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: coach.image ? "none" : `0 8px 32px ${coach.shadowColor}`,
            animation: "pulse 2s ease-in-out infinite",
          }}
        >
          {coach.image ? (
            <img
              src={coach.image}
              alt={coach.name}
              style={{ width: "100px", height: "100px", objectFit: "contain" }}
            />
          ) : (
            <span
              className="material-icons"
              style={{ fontSize: "40px", color: "#fff" }}
            >
              {coach.icon}
            </span>
          )}
        </div>
        <div style={{ textAlign: "center" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "#fff",
              margin: "0 0 8px 0",
            }}
          >
            Loading {coach.name}...
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "#888",
              margin: 0,
            }}
          >
            Fetching your workout data
          </p>
        </div>
        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.08); opacity: 0.9; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0a0a 0%, #111 100%)",
      }}
    >
      <div
        className="coach-container"
        style={{
          maxWidth: "1400px",
          margin: "0 auto",
          padding: "0 24px",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes typing {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .message-bubble {
          max-width: 85%;
          padding: 16px 20px;
          border-radius: 20px;
          font-size: 15px;
          line-height: 1.6;
          word-wrap: break-word;
        }
        .message-bubble p {
          margin: 0 0 8px 0;
        }
        .message-bubble p:last-child {
          margin-bottom: 0;
        }
        .message-bubble strong {
          color: ${coach.color};
        }
        .quick-action {
          padding: 10px 16px;
          background: ${coach.color}15;
          border: 1px solid ${coach.color}40;
          border-radius: 20px;
          color: ${coach.color};
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .quick-action:hover {
          background: ${coach.color}30;
          border-color: ${coach.color};
          transform: translateY(-2px);
        }
        @media (max-width: 600px) {
          .coach-container {
            padding: 0 12px !important;
          }
          .message-bubble {
            max-width: 90%;
            padding: 14px 16px;
            font-size: 14px;
          }
          .coach-header {
            padding: 12px 0 !important;
          }
          .coach-input-area {
            padding: 12px 0 !important;
          }
          .coach-avatar {
            width: 56px !important;
            height: 56px !important;
          }
          .coach-avatar img {
            width: 56px !important;
            height: 56px !important;
          }
          .coach-title {
            font-size: 20px !important;
          }
          .coach-toggle-btn {
            padding: 6px 12px !important;
            font-size: 12px !important;
          }
          .quick-action {
            padding: 8px 12px !important;
            font-size: 12px !important;
          }
          .msg-avatar {
            width: 36px !important;
            height: 36px !important;
          }
          .msg-avatar img {
            width: 36px !important;
            height: 36px !important;
          }
        }
      `}</style>

        {/* Header */}
        <div
          className="coach-header"
          style={{
            padding: "20px 0",
            borderBottom: "1px solid #222",
            background: "rgba(10, 10, 10, 0.95)",
            backdropFilter: "blur(10px)",
            position: "sticky",
            top: 0,
            zIndex: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              <div
                className="coach-avatar"
                style={{
                  width: "72px",
                  height: "72px",
                  background: coach.image ? "transparent" : coach.gradient,
                  borderRadius: "16px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: coach.image
                    ? "none"
                    : `0 8px 24px ${coach.shadowColor}`,
                  transition: "all 0.3s ease",
                }}
              >
                {coach.image ? (
                  <img
                    src={coach.image}
                    alt={coach.name}
                    style={{
                      width: "72px",
                      height: "72px",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span
                    className="material-icons"
                    style={{ fontSize: "28px", color: "#fff" }}
                  >
                    {coach.icon}
                  </span>
                )}
              </div>
              <div>
                <h1
                  className="coach-title"
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {coach.name}
                  <span
                    style={{
                      width: "10px",
                      height: "10px",
                      background: coach.color,
                      borderRadius: "50%",
                      boxShadow: `0 0 10px ${coach.color}`,
                    }}
                  />
                </h1>
                <p
                  style={{
                    color: "#888",
                    fontSize: "14px",
                    margin: "4px 0 0 0",
                  }}
                >
                  {coach.subtitle}
                </p>
              </div>
            </div>

            {/* Coach Toggle */}
            <div
              style={{
                display: "flex",
                background: "#1a1a1a",
                borderRadius: "12px",
                padding: "4px",
                gap: "4px",
              }}
            >
              <button
                onClick={() => switchCoach("sai")}
                className="coach-toggle-btn"
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    activeCoach === "sai"
                      ? "linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)"
                      : "transparent",
                  color: activeCoach === "sai" ? "#fff" : "#888",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Sai
              </button>
              <button
                onClick={() => switchCoach("daisy")}
                className="coach-toggle-btn"
                style={{
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "none",
                  background:
                    activeCoach === "daisy"
                      ? "linear-gradient(135deg, #10b981 0%, #059669 100%)"
                      : "transparent",
                  color: activeCoach === "daisy" ? "#fff" : "#888",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                Daisy
              </button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "24px 0",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
          }}
        >
          {messages.map((msg, index) => (
            <div
              key={index}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              {msg.role === "assistant" && (
                <div
                  className="msg-avatar"
                  style={{
                    width: "44px",
                    height: "44px",
                    background: coach.image ? "transparent" : coach.gradient,
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "12px",
                    flexShrink: 0,
                  }}
                >
                  {coach.image ? (
                    <img
                      src={coach.image}
                      alt={coach.name}
                      style={{
                        width: "44px",
                        height: "44px",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <span
                      className="material-icons"
                      style={{ fontSize: "20px", color: "#fff" }}
                    >
                      {coach.icon}
                    </span>
                  )}
                </div>
              )}
              <div
                className="message-bubble"
                style={{
                  background: msg.role === "user" ? coach.gradient : "#1a1a1a",
                  color: msg.role === "user" ? "#fff" : "#e0e0e0",
                  border: msg.role === "user" ? "none" : "1px solid #2a2a2a",
                  borderRadius:
                    msg.role === "user"
                      ? "20px 20px 4px 20px"
                      : "20px 20px 20px 4px",
                }}
              >
                <div
                  dangerouslySetInnerHTML={{
                    __html: msg.content
                      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                      .replace(/\n/g, "<br />"),
                  }}
                />
                {msg.role === "assistant" &&
                  hasWorkoutPlan(msg.content) &&
                  (() => {
                    const workoutDays = getWorkoutDays(msg.content);

                    // If multiple days detected, show individual day buttons
                    if (workoutDays.length > 1) {
                      return (
                        <div
                          style={{
                            marginTop: "16px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "12px",
                              color: "#888",
                              marginBottom: "4px",
                            }}
                          >
                            Save individual days:
                          </span>
                          {workoutDays.map((day, dayIndex) => (
                            <button
                              key={dayIndex}
                              onClick={() => saveDayAsRoutine(day)}
                              disabled={savingRoutine}
                              style={{
                                padding: "10px 16px",
                                background: "rgba(255,255,255,0.05)",
                                border: `1px solid ${coach.color}`,
                                borderRadius: "10px",
                                color: "#fff",
                                fontSize: "13px",
                                fontWeight: 500,
                                cursor: savingRoutine
                                  ? "not-allowed"
                                  : "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                                opacity: savingRoutine ? 0.7 : 1,
                                transition: "all 0.2s",
                              }}
                            >
                              <span
                                className="material-icons"
                                style={{ fontSize: "16px", color: coach.color }}
                              >
                                {savingRoutine ? "hourglass_empty" : "add"}
                              </span>
                              Day {day.dayNumber}: {day.name} (
                              {day.exercises.length} exercises)
                            </button>
                          ))}
                        </div>
                      );
                    }

                    // Single workout - show regular save button
                    return (
                      <button
                        onClick={() => saveAsRoutine(msg.content)}
                        disabled={savingRoutine}
                        style={{
                          marginTop: "16px",
                          padding: "10px 16px",
                          background: coach.gradient,
                          border: "none",
                          borderRadius: "10px",
                          color: "#fff",
                          fontSize: "13px",
                          fontWeight: 600,
                          cursor: savingRoutine ? "not-allowed" : "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          opacity: savingRoutine ? 0.7 : 1,
                          transition: "all 0.2s",
                        }}
                      >
                        <span
                          className="material-icons"
                          style={{ fontSize: "18px" }}
                        >
                          {savingRoutine ? "hourglass_empty" : "add_circle"}
                        </span>
                        {savingRoutine ? "Saving..." : "Save to My Routines"}
                      </button>
                    );
                  })()}
              </div>
            </div>
          ))}

          {loading && (
            <div
              style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}
            >
              <div
                className="msg-avatar"
                style={{
                  width: "44px",
                  height: "44px",
                  background: coach.image ? "transparent" : coach.gradient,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {coach.image ? (
                  <img
                    src={coach.image}
                    alt={coach.name}
                    style={{
                      width: "44px",
                      height: "44px",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <span
                    className="material-icons"
                    style={{ fontSize: "20px", color: "#fff" }}
                  >
                    {coach.icon}
                  </span>
                )}
              </div>
              <div
                className="message-bubble"
                style={{
                  background: "#1a1a1a",
                  border: "1px solid #2a2a2a",
                  borderRadius: "20px 20px 20px 4px",
                  display: "flex",
                  gap: "6px",
                  padding: "20px 24px",
                }}
              >
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    background: coach.color,
                    borderRadius: "50%",
                    animation: "typing 1s ease-in-out infinite",
                  }}
                />
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    background: coach.color,
                    borderRadius: "50%",
                    animation: "typing 1s ease-in-out infinite 0.2s",
                  }}
                />
                <span
                  style={{
                    width: "8px",
                    height: "8px",
                    background: coach.color,
                    borderRadius: "50%",
                    animation: "typing 1s ease-in-out infinite 0.4s",
                  }}
                />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div
            style={{
              padding: "0 0 16px",
              display: "flex",
              gap: "10px",
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {quickActions.map((action, index) => (
              <button
                key={index}
                className="quick-action"
                onClick={() => {
                  setInput(action.query);
                  setTimeout(() => sendMessage(), 100);
                }}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div
          className="coach-input-area"
          style={{
            padding: "20px 0",
            borderTop: "1px solid #222",
            background: "rgba(10, 10, 10, 0.95)",
            backdropFilter: "blur(10px)",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "12px",
              maxWidth: "800px",
              margin: "0 auto",
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={`Ask ${coach.name} anything about your fitness...`}
              style={{
                flex: 1,
                padding: "16px 20px",
                background: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "16px",
                color: "#fff",
                fontSize: "15px",
                outline: "none",
                transition: "all 0.2s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = coach.color;
                e.target.style.boxShadow = `0 0 0 3px ${coach.color}20`;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#2a2a2a";
                e.target.style.boxShadow = "none";
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width: "56px",
                height: "56px",
                background: loading || !input.trim() ? "#333" : coach.gradient,
                border: "none",
                borderRadius: "16px",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                boxShadow:
                  loading || !input.trim()
                    ? "none"
                    : `0 4px 15px ${coach.shadowColor}`,
              }}
            >
              <span
                className="material-icons"
                style={{
                  fontSize: "24px",
                  color: loading || !input.trim() ? "#666" : "#fff",
                }}
              >
                send
              </span>
            </button>
          </div>
          <p
            style={{
              textAlign: "center",
              color: "#555",
              fontSize: "11px",
              marginTop: "12px",
            }}
          >
            {coach.name} uses your workout data to provide personalized advice
          </p>
        </div>
      </div>
    </div>
  );
}
