/**
 * Step Tracking with Sensor Fusion
 * Combines accelerometer, gyroscope, gravity, and step counter APIs
 * for accurate step detection and calorie estimation
 */

/**
 * SENSOR FUSION PSEUDOCODE FOR ANDROID/iOS
 * 
 * ===== ANDROID IMPLEMENTATION =====
 * 
 * Sensors Required:
 * - TYPE_ACCELEROMETER
 * - TYPE_GYROSCOPE
 * - TYPE_LINEAR_ACCELERATION (derived from accel - gravity)
 * - TYPE_STEP_COUNTER (hardware step counter if available)
 * - TYPE_GRAVITY
 * 
 * Algorithm Flow:
 * 
 * 1. Initialize Sensors
 *    sensorManager = getSystemService(SENSOR_SERVICE)
 *    accelerometer = sensorManager.getDefaultSensor(TYPE_ACCELEROMETER)
 *    gyroscope = sensorManager.getDefaultSensor(TYPE_GYROSCOPE)
 *    linearAccel = sensorManager.getDefaultSensor(TYPE_LINEAR_ACCELERATION)
 *    stepCounter = sensorManager.getDefaultSensor(TYPE_STEP_COUNTER)
 * 
 * 2. Sensor Event Handling
 *    onSensorChanged(event):
 *      if event.sensor == TYPE_ACCELEROMETER:
 *        rawAccel = event.values
 *        filteredAccel = lowPassFilter(rawAccel, alpha=0.8)
 *        
 *      if event.sensor == TYPE_LINEAR_ACCELERATION:
 *        linearAccel = event.values
 *        magnitude = sqrt(x² + y² + z²)
 *        
 *        if magnitude > STEP_THRESHOLD (e.g., 1.5 m/s²):
 *          potentialStep = true
 *          
 *      if event.sensor == TYPE_GYROSCOPE:
 *        gyroData = event.values
 *        angularVelocity = sqrt(x² + y² + z²)
 *        
 *        // Validate step with gyro (detect leg swing)
 *        if potentialStep AND angularVelocity > GYRO_THRESHOLD (e.g., 0.5 rad/s):
 *          validateStep()
 *          
 *      if event.sensor == TYPE_STEP_COUNTER:
 *        hardwareSteps = event.values[0]
 * 
 * 3. Step Validation (Peak Detection)
 *    validateStep():
 *      currentTime = System.currentTimeMillis()
 *      
 *      // Debounce - prevent double counting
 *      if (currentTime - lastStepTime) < MIN_STEP_INTERVAL (e.g., 200ms):
 *        return
 *        
 *      // Check stride regularity
 *      timeSinceLastStep = currentTime - lastStepTime
 *      if timeSinceLastStep > 2000ms: // Too long, reset cadence
 *        resetCadence()
 *        
 *      // Confirm step
 *      stepCount++
 *      lastStepTime = currentTime
 *      
 *      // Blend with hardware step counter
 *      if hardwareSteps available:
 *        stepCount = (0.7 * stepCount) + (0.3 * hardwareSteps)
 * 
 * 4. Low-Pass Filter (Noise Reduction)
 *    lowPassFilter(input, previousOutput, alpha):
 *      output = alpha * previousOutput + (1 - alpha) * input
 *      return output
 * 
 * 5. High-Pass Filter (Remove Gravity/Drift)
 *    highPassFilter(input, previousInput, previousOutput, alpha):
 *      output = alpha * (previousOutput + input - previousInput)
 *      return output
 * 
 * 
 * ===== iOS IMPLEMENTATION (CoreMotion) =====
 * 
 * Import CoreMotion framework
 * 
 * 1. Initialize Motion Manager
 *    motionManager = CMMotionManager()
 *    pedometer = CMPedometer()
 *    
 *    if motionManager.isAccelerometerAvailable:
 *      motionManager.accelerometerUpdateInterval = 0.1 // 10Hz
 *      
 *    if motionManager.isGyroAvailable:
 *      motionManager.gyroUpdateInterval = 0.1
 * 
 * 2. Start Updates
 *    motionManager.startAccelerometerUpdates(to: queue) { (data, error) ->
 *      accelX = data.acceleration.x
 *      accelY = data.acceleration.y
 *      accelZ = data.acceleration.z
 *      
 *      magnitude = sqrt(accelX² + accelY² + accelZ²)
 *      filteredMagnitude = lowPassFilter(magnitude)
 *      
 *      if filteredMagnitude > STEP_THRESHOLD:
 *        detectPeak()
 *    }
 *    
 *    motionManager.startGyroUpdates(to: queue) { (data, error) ->
 *      gyroValidation = sqrt(data.rotationRate.x² + y² + z²)
 *      
 *      if gyroValidation > GYRO_THRESHOLD:
 *        confirmStepWithGyro()
 *    }
 *    
 *    // Use CMPedometer for hardware-backed step counting
 *    if CMPedometer.isStepCountingAvailable():
 *      pedometer.startUpdates(from: Date()) { (data, error) ->
 *        hardwareSteps = data.numberOfSteps
 *        // Blend with custom algorithm
 *        finalSteps = blendStepCounts(customSteps, hardwareSteps)
 *      }
 * 
 * 3. Peak Detection Algorithm
 *    detectPeak():
 *      if magnitude > previousMagnitude AND magnitude > nextMagnitude:
 *        // Peak detected
 *        if (currentTime - lastPeakTime) > MIN_PEAK_INTERVAL:
 *          registerStep()
 *          lastPeakTime = currentTime
 * 
 * 4. Stride Regularity Check
 *    registerStep():
 *      intervalBetweenSteps = currentTime - lastStepTime
 *      
 *      if abs(intervalBetweenSteps - averageStepInterval) < REGULARITY_THRESHOLD:
 *        confidenceScore += 1
 *      else:
 *        confidenceScore -= 1
 *        
 *      if confidenceScore > MIN_CONFIDENCE:
 *        stepCount++
 *        updateAverageInterval(intervalBetweenSteps)
 * 
 * 
 * ===== CROSS-PLATFORM CONFIGURATION =====
 * 
 * Constants:
 * STEP_THRESHOLD = 1.2 - 1.8 m/s² (acceleration magnitude)
 * GYRO_THRESHOLD = 0.4 - 0.8 rad/s (rotation rate)
 * MIN_STEP_INTERVAL = 200ms (prevent double-counting)
 * MAX_STEP_INTERVAL = 2000ms (reset cadence if too slow)
 * LOW_PASS_ALPHA = 0.8 (smooth accelerometer noise)
 * HIGH_PASS_ALPHA = 0.9 (remove drift)
 * REGULARITY_THRESHOLD = 100ms (stride consistency)
 * MIN_CONFIDENCE = 3 (number of regular steps to confirm pattern)
 */

/**
 * Calculate stride length based on height
 * @param {number} heightCm - User's height in centimeters
 * @returns {number} Stride length in meters
 */
export function calculateStrideLength(heightCm) {
  return heightCm * 0.415 / 100; // Convert to meters
}

/**
 * Calculate distance from steps
 * @param {number} steps - Number of steps
 * @param {number} strideLength - Stride length in meters
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(steps, strideLength) {
  const distanceMeters = steps * strideLength;
  return distanceMeters / 1000; // Convert to km
}

/**
 * Calculate calories burned from steps
 * @param {number} steps - Number of steps
 * @param {number} bodyWeightKg - User's body weight in kg
 * @param {number} strideFactor - Stride factor (default 1.0, adjust for terrain/pace)
 * @returns {number} Calories burned
 */
export function calculateStepCalories(steps, bodyWeightKg, strideFactor = 1.0) {
  const calories = steps * (0.0005 * bodyWeightKg * strideFactor);
  return Math.round(calories * 10) / 10;
}

/**
 * Get stride factor based on activity type
 * @param {string} activityType - 'walking' | 'running' | 'uphill' | 'stairs'
 * @returns {number} Stride factor multiplier
 */
export function getStrideFactor(activityType) {
  const factors = {
    walking: 1.0,
    running: 1.3,
    uphill: 1.5,
    stairs: 1.8,
    downhill: 0.8
  };
  return factors[activityType] || 1.0;
}

/**
 * Calculate comprehensive step metrics
 * @param {Object} params - Step tracking parameters
 * @param {number} params.steps - Total steps
 * @param {number} params.heightCm - User height
 * @param {number} params.bodyWeightKg - User weight
 * @param {string} [params.activityType] - Activity type
 * @returns {Object} Step metrics
 */
export function calculateStepMetrics({
  steps,
  heightCm,
  bodyWeightKg,
  activityType = 'walking'
}) {
  const strideLength = calculateStrideLength(heightCm);
  const distance = calculateDistance(steps, strideLength);
  const strideFactor = getStrideFactor(activityType);
  const calories = calculateStepCalories(steps, bodyWeightKg, strideFactor);

  return {
    steps,
    strideLength: Math.round(strideLength * 100) / 100,
    distance: Math.round(distance * 100) / 100,
    calories,
    activityType
  };
}

/**
 * Low-pass filter for smoothing sensor data
 * Used in actual implementation
 * @param {number} current - Current sensor reading
 * @param {number} previous - Previous filtered value
 * @param {number} alpha - Filter coefficient (0-1, higher = more smoothing)
 * @returns {number} Filtered value
 */
export function lowPassFilter(current, previous, alpha = 0.8) {
  return alpha * previous + (1 - alpha) * current;
}

/**
 * High-pass filter for removing gravity/drift
 * @param {number} current - Current sensor reading
 * @param {number} previousInput - Previous input
 * @param {number} previousOutput - Previous output
 * @param {number} alpha - Filter coefficient
 * @returns {number} Filtered value
 */
export function highPassFilter(current, previousInput, previousOutput, alpha = 0.9) {
  return alpha * (previousOutput + current - previousInput);
}
