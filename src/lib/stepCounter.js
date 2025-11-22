/**
 * Step Counter with Sensor Fusion
 * Combines native step APIs with accelerometer/gyroscope sensor fusion
 * Provides accurate step counting, distance, and calorie calculation
 */

class StepCounter {
  constructor(config = {}) {
    // Configuration
    this.config = {
      sampleRate: 50, // Hz for active mode
      idleSampleRate: 10, // Hz for idle mode
      lowBatteryThreshold: 0.1, // 10%
      peakDebounceMs: 250,
      stepRegularityCount: 3,
      calibrationSteps: 20,
      persistIntervalMs: 30000, // 30 seconds
      lowPassAlpha: 0.9,
      highPassAlpha: 0.8,
      ...config,
    };

    // State
    this.isActive = false;
    this.steps = 0;
    this.distance = 0; // km
    this.calories = 0;
    this.startTime = null;
    this.lastStepTime = 0;
    this.lastPeakTime = 0;
    this.isCalibrated = false;
    this.strideFactor = 1.0;

    // User profile
    this.userHeight = 170; // cm, default
    this.userWeight = 75; // kg, default
    this.strideLength = 0; // calculated

    // Sensor fusion state
    this.accelBuffer = [];
    this.gyroBuffer = [];
    this.recentStepTimes = [];
    this.lastAccel = { x: 0, y: 0, z: 0 };
    this.filteredAccel = { x: 0, y: 0, z: 0 };
    this.gravity = { x: 0, y: 0, z: 0 };

    // Native step counter
    this.nativeStepCounter = null;
    this.useNativeAPI = false;
    this.baselineNativeSteps = 0;

    // Callbacks
    this.onStepDetected = null;
    this.onStatsUpdate = null;

    // Battery monitoring
    this.batteryLevel = 1.0;

    // Device orientation
    this.deviceOrientation = "unknown"; // 'pocket', 'hand', 'unknown'
    this.orientationThreshold = 0.7;

    // Persistence
    this.persistTimer = null;
    this.storageKey = "step_counter_session";
  }

  /**
   * Initialize step counter with user profile
   */
  async initialize(userProfile) {
    this.userHeight = userProfile.height_cm || 170;
    this.userWeight = userProfile.body_weight_kg || 75;
    this.strideLength = this.calculateStrideLength();

    // Load persisted session
    await this.loadPersistedSession();

    // Check for native step API
    await this.checkNativeStepAPI();

    // Setup battery monitoring
    this.setupBatteryMonitoring();

    console.log("Step counter initialized:", {
      height: this.userHeight,
      weight: this.userWeight,
      strideLength: this.strideLength,
      useNative: this.useNativeAPI,
    });
  }

  /**
   * Calculate stride length based on height
   */
  calculateStrideLength() {
    // stride_length_m = height_cm * 0.415
    return (this.userHeight * 0.415) / 100; // Convert to meters
  }

  /**
   * Check for native step counting API
   */
  async checkNativeStepAPI() {
    // Check for Web APIs (experimental)
    if ("Sensor" in window && "GravitySensor" in window) {
      console.log("Native sensors available");
    }

    // For actual native API, this would interface with Cordova/Capacitor plugins
    // For web demo, we'll use sensor fusion
    this.useNativeAPI = false;
  }

  /**
   * Start step counting
   */
  async start() {
    if (this.isActive) return;

    this.isActive = true;
    this.startTime = Date.now();

    if (this.useNativeAPI) {
      await this.startNativeStepCounter();
    } else {
      await this.startSensorFusion();
    }

    // Start persistence timer
    this.startPersistence();

    console.log("Step counter started");
  }

  /**
   * Stop step counting
   */
  async stop() {
    if (!this.isActive) return;

    this.isActive = false;

    if (this.useNativeAPI) {
      this.stopNativeStepCounter();
    } else {
      this.stopSensorFusion();
    }

    // Stop persistence timer
    this.stopPersistence();

    // Save final state
    await this.persistSession();

    console.log("Step counter stopped");
  }

  /**
   * Start native step counter (platform-specific)
   */
  async startNativeStepCounter() {
    // This would use Cordova/Capacitor plugins in production
    // For web: not available
    console.log("Native step counter not available on web");
  }

  /**
   * Stop native step counter
   */
  stopNativeStepCounter() {
    // Platform-specific cleanup
  }

  /**
   * Start sensor fusion (accelerometer + gyroscope)
   */
  async startSensorFusion() {
    try {
      // Request sensor permissions
      if (
        typeof DeviceMotionEvent !== "undefined" &&
        typeof DeviceMotionEvent.requestPermission === "function"
      ) {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission !== "granted") {
          throw new Error("Motion sensor permission denied");
        }
      }

      // Start accelerometer
      window.addEventListener(
        "devicemotion",
        this.handleDeviceMotion.bind(this)
      );

      console.log("Sensor fusion started");
    } catch (error) {
      console.error("Failed to start sensor fusion:", error);
      throw error;
    }
  }

  /**
   * Stop sensor fusion
   */
  stopSensorFusion() {
    window.removeEventListener(
      "devicemotion",
      this.handleDeviceMotion.bind(this)
    );
  }

  /**
   * Handle device motion events
   */
  handleDeviceMotion(event) {
    if (!this.isActive) return;

    // Check battery level
    if (this.batteryLevel < this.config.lowBatteryThreshold) {
      console.warn("Battery too low, stopping step counter");
      this.stop();
      return;
    }

    const accel = event.accelerationIncludingGravity;
    const rotation = event.rotationRate;

    if (!accel) return;

    // Apply filters
    this.applyLowPassFilter(accel);
    this.applyHighPassFilter();

    // Update gravity estimation
    this.updateGravity(accel);

    // Get linear acceleration (remove gravity)
    const linearAccel = {
      x: accel.x - this.gravity.x,
      y: accel.y - this.gravity.y,
      z: accel.z - this.gravity.z,
    };

    // Calculate magnitude
    const magnitude = Math.sqrt(
      linearAccel.x * linearAccel.x +
        linearAccel.y * linearAccel.y +
        linearAccel.z * linearAccel.z
    );

    // Detect device orientation
    this.detectOrientation(accel, rotation);

    // Dynamic threshold based on orientation
    const threshold = this.deviceOrientation === "pocket" ? 1.5 : 1.2;

    // Peak detection
    this.detectPeak(magnitude, threshold, rotation);
  }

  /**
   * Apply low-pass filter to reduce noise
   */
  applyLowPassFilter(accel) {
    const alpha = this.config.lowPassAlpha;
    this.filteredAccel.x = alpha * this.filteredAccel.x + (1 - alpha) * accel.x;
    this.filteredAccel.y = alpha * this.filteredAccel.y + (1 - alpha) * accel.y;
    this.filteredAccel.z = alpha * this.filteredAccel.z + (1 - alpha) * accel.z;
  }

  /**
   * Apply high-pass filter to remove DC component
   */
  applyHighPassFilter() {
    const alpha = this.config.highPassAlpha;
    this.filteredAccel.x = alpha * (this.filteredAccel.x + this.lastAccel.x);
    this.filteredAccel.y = alpha * (this.filteredAccel.y + this.lastAccel.y);
    this.filteredAccel.z = alpha * (this.filteredAccel.z + this.lastAccel.z);

    this.lastAccel = { ...this.filteredAccel };
  }

  /**
   * Update gravity estimation
   */
  updateGravity(accel) {
    const alpha = 0.8;
    this.gravity.x = alpha * this.gravity.x + (1 - alpha) * accel.x;
    this.gravity.y = alpha * this.gravity.y + (1 - alpha) * accel.y;
    this.gravity.z = alpha * this.gravity.z + (1 - alpha) * accel.z;
  }

  /**
   * Detect device orientation (pocket vs hand)
   */
  detectOrientation(accel, rotation) {
    if (!rotation) {
      this.deviceOrientation = "unknown";
      return;
    }

    // Calculate variance of rotation
    const rotationMag = Math.sqrt(
      rotation.alpha * rotation.alpha +
        rotation.beta * rotation.beta +
        rotation.gamma * rotation.gamma
    );

    // Higher rotation = likely in hand, lower = pocket
    if (rotationMag > this.orientationThreshold) {
      this.deviceOrientation = "hand";
    } else {
      this.deviceOrientation = "pocket";
    }
  }

  /**
   * Detect step peaks with validation
   */
  detectPeak(magnitude, threshold, rotation) {
    const now = Date.now();

    // Debounce - ignore peaks within 250ms
    if (now - this.lastPeakTime < this.config.peakDebounceMs) {
      return;
    }

    // Check if magnitude exceeds threshold
    if (magnitude > threshold) {
      // Validate with gyroscope (step-like rotation)
      if (rotation && this.validateStepRotation(rotation)) {
        // Check step regularity
        if (this.validateStepRegularity(now)) {
          this.registerStep(now);
          this.lastPeakTime = now;
        }
      }
    }
  }

  /**
   * Validate step-like rotation pattern
   */
  validateStepRotation(rotation) {
    // Steps typically have rotation in beta (pitch) and gamma (roll)
    const rotationMag = Math.abs(rotation.beta) + Math.abs(rotation.gamma);
    return rotationMag > 0.5 && rotationMag < 5.0; // Reasonable rotation range
  }

  /**
   * Validate step regularity (consistent timing)
   */
  validateStepRegularity(currentTime) {
    this.recentStepTimes.push(currentTime);

    // Keep only last few steps
    if (this.recentStepTimes.length > this.config.stepRegularityCount + 1) {
      this.recentStepTimes.shift();
    }

    // Need at least 3 steps to validate regularity
    if (this.recentStepTimes.length < this.config.stepRegularityCount) {
      return true; // Accept first few steps
    }

    // Calculate inter-step intervals
    const intervals = [];
    for (let i = 1; i < this.recentStepTimes.length; i++) {
      intervals.push(this.recentStepTimes[i] - this.recentStepTimes[i - 1]);
    }

    // Calculate variance of intervals
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) /
      intervals.length;
    const stdDev = Math.sqrt(variance);

    // Accept if variance is reasonable (consistent cadence)
    return stdDev / mean < 0.3; // 30% coefficient of variation
  }

  /**
   * Register a detected step
   */
  registerStep(timestamp) {
    this.steps++;
    this.lastStepTime = timestamp;

    // Update distance
    this.updateDistance();

    // Update calories
    this.updateCalories();

    // Callback
    if (this.onStepDetected) {
      this.onStepDetected(this.steps);
    }

    // Update stats callback
    if (this.onStatsUpdate) {
      this.onStatsUpdate(this.getStats());
    }
  }

  /**
   * Update distance calculation
   */
  updateDistance() {
    // distance_km = (steps * stride_length_m) / 1000
    this.distance = (this.steps * this.strideLength * this.strideFactor) / 1000;
  }

  /**
   * Update calorie calculation
   */
  updateCalories() {
    // Calories_steps = steps * (0.0005 * body_weight_kg * stride_factor)
    this.calories = this.steps * (0.0005 * this.userWeight * this.strideFactor);
  }

  /**
   * Get current statistics
   */
  getStats() {
    const duration = this.startTime ? (Date.now() - this.startTime) / 1000 : 0;
    const pace = this.steps > 0 ? duration / this.steps : 0; // seconds per step
    const cadence = pace > 0 ? 60 / pace : 0; // steps per minute

    return {
      steps: this.steps,
      distance: this.distance,
      calories: this.calories,
      duration: Math.floor(duration),
      cadence: Math.round(cadence),
      strideLength: this.strideLength,
      strideFactor: this.strideFactor,
    };
  }

  /**
   * Start calibration process
   */
  async startCalibration() {
    console.log("Starting calibration - walk 20 steps");
    this.isCalibrated = false;
    this.calibrationStartSteps = this.steps;
    this.calibrationStartTime = Date.now();

    // If GPS available, request position
    if ("geolocation" in navigator) {
      try {
        const position = await navigator.geolocation.getCurrentPosition(
          (pos) => pos,
          (err) => console.error("GPS error:", err),
          { enableHighAccuracy: true }
        );
        this.calibrationStartPosition = position;
      } catch (error) {
        console.warn("GPS not available for calibration");
      }
    }
  }

  /**
   * Complete calibration
   */
  async completeCalibration() {
    const stepsTaken = this.steps - this.calibrationStartSteps;

    if (stepsTaken < this.config.calibrationSteps) {
      console.warn("Not enough steps for calibration");
      return false;
    }

    let measuredDistance = null;

    // Try to get GPS distance
    if (this.calibrationStartPosition && "geolocation" in navigator) {
      try {
        const endPosition = await navigator.geolocation.getCurrentPosition(
          (pos) => pos,
          (err) => console.error("GPS error:", err),
          { enableHighAccuracy: true }
        );

        measuredDistance = this.calculateGPSDistance(
          this.calibrationStartPosition,
          endPosition
        );
      } catch (error) {
        console.warn("Could not get end GPS position");
      }
    }

    if (measuredDistance) {
      // Auto-tune stride factor
      const expectedDistance = (stepsTaken * this.strideLength) / 1000;
      this.strideFactor = measuredDistance / expectedDistance;
      console.log("Calibration complete:", {
        steps: stepsTaken,
        measuredDistance,
        strideFactor: this.strideFactor,
      });
    } else {
      // Manual calibration - assume default
      this.strideFactor = 1.0;
      console.log("Calibration complete (no GPS)");
    }

    this.isCalibrated = true;
    await this.persistSession();
    return true;
  }

  /**
   * Calculate distance between two GPS coordinates
   */
  calculateGPSDistance(pos1, pos2) {
    const R = 6371; // Earth radius in km
    const dLat = this.toRadians(pos2.coords.latitude - pos1.coords.latitude);
    const dLon = this.toRadians(pos2.coords.longitude - pos1.coords.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(pos1.coords.latitude)) *
        Math.cos(this.toRadians(pos2.coords.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in km
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  /**
   * Setup battery monitoring
   */
  setupBatteryMonitoring() {
    if ("getBattery" in navigator) {
      navigator.getBattery().then((battery) => {
        this.batteryLevel = battery.level;

        battery.addEventListener("levelchange", () => {
          this.batteryLevel = battery.level;

          if (
            this.batteryLevel < this.config.lowBatteryThreshold &&
            this.isActive
          ) {
            console.warn("Low battery, stopping step counter");
            this.stop();
          }
        });
      });
    }
  }

  /**
   * Start persistence timer
   */
  startPersistence() {
    this.persistTimer = setInterval(() => {
      this.persistSession();
    }, this.config.persistIntervalMs);
  }

  /**
   * Stop persistence timer
   */
  stopPersistence() {
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
      this.persistTimer = null;
    }
  }

  /**
   * Persist session to localStorage
   */
  async persistSession() {
    const session = {
      steps: this.steps,
      distance: this.distance,
      calories: this.calories,
      startTime: this.startTime,
      strideFactor: this.strideFactor,
      isCalibrated: this.isCalibrated,
      timestamp: Date.now(),
      date: new Date().toISOString().split("T")[0],
    };

    localStorage.setItem(this.storageKey, JSON.stringify(session));
  }

  /**
   * Load persisted session
   */
  async loadPersistedSession() {
    const stored = localStorage.getItem(this.storageKey);
    if (!stored) return;

    try {
      const session = JSON.parse(stored);
      const today = new Date().toISOString().split("T")[0];

      // Only restore if from today
      if (session.date === today) {
        this.steps = session.steps || 0;
        this.distance = session.distance || 0;
        this.calories = session.calories || 0;
        this.startTime = session.startTime;
        this.strideFactor = session.strideFactor || 1.0;
        this.isCalibrated = session.isCalibrated || false;

        console.log("Restored session:", session);
      } else {
        // Old session - clear it
        localStorage.removeItem(this.storageKey);
      }
    } catch (error) {
      console.error("Failed to load persisted session:", error);
    }
  }

  /**
   * Reset step counter
   */
  reset() {
    this.steps = 0;
    this.distance = 0;
    this.calories = 0;
    this.startTime = Date.now();
    this.recentStepTimes = [];
    localStorage.removeItem(this.storageKey);
  }
}

export default StepCounter;
