import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import StepCounter from '../lib/stepCounter';
import { logSteps, getStepLogs } from '../lib/firebase-database';

export default function StepTracker() {
  const { user, profile } = useAuth();
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);
  const [calories, setCalories] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [duration, setDuration] = useState(0);
  const [cadence, setCadence] = useState(0);
  const [todayLogs, setTodayLogs] = useState([]);
  const [strideLength, setStrideLength] = useState(0);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [bmi, setBmi] = useState(0);
  const [bmiCategory, setBmiCategory] = useState('');
  const [healthAdvice, setHealthAdvice] = useState('');
  
  const stepCounterRef = useRef(null);
  const durationIntervalRef = useRef(null);
  const syncIntervalRef = useRef(null);

  useEffect(() => {
    if (user && profile) {
      // Calculate stride length: height_cm * 0.415
      const stride = ((profile.height_cm || 170) * 0.415) / 100; // Convert to meters
      setStrideLength(stride);
      
      // Calculate BMI and health status
      calculateBMI();
      
      loadTodaySteps();
      
      // Initialize step counter
      initializeStepCounter();
    }
    
    return () => {
      if (stepCounterRef.current) {
        stepCounterRef.current.stop();
      }
    };
  }, [user, profile]);

  const calculateBMI = () => {
    if (!profile) return;
    
    const height_m = (profile.height_cm || 170) / 100;
    const weight = profile.body_weight_kg || 75;
    const calculatedBmi = weight / (height_m * height_m);
    
    setBmi(calculatedBmi);
    
    // Determine BMI category and advice
    let category = '';
    let advice = '';
    
    if (calculatedBmi < 18.5) {
      category = 'Underweight';
      advice = '⚠️ You may need to gain weight. Aim for 10,000+ steps daily with strength training. Consult a nutritionist for a healthy weight gain plan.';
    } else if (calculatedBmi >= 18.5 && calculatedBmi < 25) {
      category = 'Normal Weight';
      advice = '✅ Great! Maintain your healthy weight with 7,500-10,000 steps daily and regular exercise. Keep up the good work!';
    } else if (calculatedBmi >= 25 && calculatedBmi < 30) {
      category = 'Overweight';
      advice = '⚡ Consider increasing activity to 10,000-12,000 steps daily. Combine walking with strength training and a balanced diet for gradual weight loss.';
    } else {
      category = 'Obese';
      advice = '🔥 Focus on gradual increase in activity. Start with 5,000 steps and work up to 12,000+. Consult a healthcare provider for personalized guidance.';
    }
    
    setBmiCategory(category);
    setHealthAdvice(advice);
  };

  const initializeStepCounter = async () => {
    if (!profile) return;
    
    try {
      const counter = new StepCounter({
        height_cm: profile.height_cm || 170,
        body_weight_kg: profile.body_weight_kg || 75,
        age: profile.age || 30,
        gender: profile.gender || 'male'
      });
      
      // Set up callbacks
      counter.onStepDetected = (data) => {
        setSteps(data.steps);
        setDistance(data.distance);
        setCalories(data.calories);
        setCadence(data.cadence || 0);
      };
      
      counter.onError = (error) => {
        setErrorMessage(error.message);
        console.error('Step counter error:', error);
      };
      
      stepCounterRef.current = counter;
      
      // Check for saved session
      counter.loadPersistedSession();
      if (counter.steps > 0) {
        setSteps(counter.steps);
        setDistance(counter.distance);
        setCalories(counter.calories);
      }
      
    } catch (error) {
      console.error('Failed to initialize step counter:', error);
      setErrorMessage('Failed to initialize step counter');
    }
  };

  useEffect(() => {
    if (isTracking && startTime) {
      durationIntervalRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      
      // Auto-sync to Firebase every 60 seconds
      syncIntervalRef.current = setInterval(() => {
        saveToFirebase();
      }, 60000);
    } else {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    }
    
    return () => {
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isTracking, startTime]);

  const loadTodaySteps = async () => {
    if (!user) return;
    
    const today = new Date().toISOString().split('T')[0];
    try {
      const logs = await getStepLogs(user.uid, today, today);
      setTodayLogs(logs);
    } catch (error) {
      console.error('Error loading today steps:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      // Request Device Motion permissions (iOS 13+)
      if (typeof DeviceMotionEvent !== 'undefined' && typeof DeviceMotionEvent.requestPermission === 'function') {
        const permission = await DeviceMotionEvent.requestPermission();
        setPermissionStatus(permission);
        
        if (permission !== 'granted') {
          setErrorMessage('Motion & Fitness tracking permission denied. Please enable it in your device settings.');
          return false;
        }
      }
      
      // Request Device Orientation permissions
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        await DeviceOrientationEvent.requestPermission();
      }
      
      setPermissionStatus('granted');
      setErrorMessage('');
      return true;
    } catch (error) {
      console.error('Permission error:', error);
      setErrorMessage('Failed to request permissions: ' + error.message);
      setPermissionStatus('denied');
      return false;
    }
  };

  const startTracking = async () => {
    if (!stepCounterRef.current) {
      setErrorMessage('Step counter not initialized');
      return;
    }
    
    // Request permissions first
    const hasPermission = await requestPermissions();
    if (!hasPermission && permissionStatus !== 'granted') {
      return;
    }
    
    try {
      await stepCounterRef.current.start();
      setIsTracking(true);
      setStartTime(Date.now());
      setErrorMessage('');
    } catch (error) {
      console.error('Failed to start tracking:', error);
      setErrorMessage('Failed to start tracking: ' + error.message);
    }
  };

  const stopTracking = async () => {
    if (stepCounterRef.current) {
      stepCounterRef.current.stop();
    }
    
    setIsTracking(false);
    
    // Save to Firebase
    await saveToFirebase();
  };

  const saveToFirebase = async () => {
    if (!user || steps === 0) return;

    const today = new Date().toISOString().split('T')[0];

    try {
      await logSteps(user.uid, {
        date: today,
        steps: steps,
        distance_km: distance,
        calories: calories,
        duration_minutes: Math.floor(duration / 60),
        stride_length_m: strideLength,
        cadence: cadence
      });
      
      console.log('Steps saved to Firebase');
      await loadTodaySteps();
    } catch (error) {
      console.error('Failed to save steps:', error);
    }
  };

  const resetCounter = async () => {
    if (!confirm('Reset step counter? This will clear current session.')) return;
    
    if (stepCounterRef.current) {
      stepCounterRef.current.reset();
    }
    
    setSteps(0);
    setDistance(0);
    setCalories(0);
    setDuration(0);
    setCadence(0);
    setStartTime(null);
    setIsTracking(false);
  };

  if (showSettings) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{
          background: '#0a0a0a',
          border: '2px solid #333',
          borderRadius: '20px',
          padding: '40px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{
              fontFamily: 'Bebas Neue, Impact, sans-serif',
              fontSize: '48px',
              letterSpacing: '0.05em',
              background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>SETTINGS</h2>
            <button onClick={() => setShowSettings(false)} style={{
              padding: '12px 24px',
              background: '#1a1a1a',
              border: '2px solid #333',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span className="material-icons">arrow_back</span>
              Back
            </button>
          </div>

          {/* BMI & Health Status */}
          <div style={{
            background: bmi < 18.5 ? 'rgba(255, 193, 61, 0.1)' :
                       bmi < 25 ? 'rgba(168, 230, 207, 0.1)' :
                       bmi < 30 ? 'rgba(255, 142, 83, 0.1)' : 'rgba(255, 107, 107, 0.1)',
            border: `2px solid ${
              bmi < 18.5 ? '#FFC13D' :
              bmi < 25 ? '#A8E6CF' :
              bmi < 30 ? '#FF8E53' : '#FF6B6B'
            }`,
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '24px'
          }}>
            <h3 style={{
              fontSize: '24px',
              fontWeight: 700,
              color: '#fff',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span className="material-icons" style={{ color: '#4ECDC4' }}>monitor_heart</span>
              Health Assessment
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
              <div style={{ padding: '20px', background: '#1a1a1a', borderRadius: '12px' }}>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>Your BMI</div>
                <div style={{ fontSize: '36px', color: '#4ECDC4', fontWeight: 700, fontFamily: 'Bebas Neue' }}>
                  {bmi.toFixed(1)}
                </div>
              </div>
              <div style={{ padding: '20px', background: '#1a1a1a', borderRadius: '12px' }}>
                <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>Category</div>
                <div style={{ 
                  fontSize: '24px', 
                  color: bmi < 18.5 ? '#FFC13D' :
                         bmi < 25 ? '#A8E6CF' :
                         bmi < 30 ? '#FF8E53' : '#FF6B6B',
                  fontWeight: 700,
                  fontFamily: 'Bebas Neue'
                }}>
                  {bmiCategory}
                </div>
              </div>
            </div>

            <div style={{
              background: '#1a1a1a',
              border: '2px solid #2a2a2a',
              borderRadius: '12px',
              padding: '24px'
            }}>
              <div style={{ fontSize: '16px', color: '#fff', lineHeight: '1.6' }}>
                {healthAdvice}
              </div>
            </div>
          </div>

          {/* BMI Reference Chart */}
          <div style={{
            background: '#1a1a1a',
            border: '2px solid #333',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h4 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              BMI Reference Chart
            </h4>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255, 193, 61, 0.1)', borderLeft: '4px solid #FFC13D', borderRadius: '8px' }}>
                <span style={{ color: '#FFC13D', fontWeight: 600 }}>Underweight</span>
                <span style={{ color: '#999' }}>BMI {'<'} 18.5</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(168, 230, 207, 0.1)', borderLeft: '4px solid #A8E6CF', borderRadius: '8px' }}>
                <span style={{ color: '#A8E6CF', fontWeight: 600 }}>Normal Weight</span>
                <span style={{ color: '#999' }}>BMI 18.5 - 24.9</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255, 142, 83, 0.1)', borderLeft: '4px solid #FF8E53', borderRadius: '8px' }}>
                <span style={{ color: '#FF8E53', fontWeight: 600 }}>Overweight</span>
                <span style={{ color: '#999' }}>BMI 25 - 29.9</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255, 107, 107, 0.1)', borderLeft: '4px solid #FF6B6B', borderRadius: '8px' }}>
                <span style={{ color: '#FF6B6B', fontWeight: 600 }}>Obese</span>
                <span style={{ color: '#999' }}>BMI ≥ 30</span>
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div style={{
            background: '#1a1a1a',
            border: '2px solid #333',
            borderRadius: '16px',
            padding: '24px'
          }}>
            <h4 style={{ color: '#fff', fontSize: '18px', fontWeight: 700, marginBottom: '16px' }}>
              Your Profile
            </h4>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div style={{ padding: '16px', background: '#0a0a0a', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Height</div>
                <div style={{ fontSize: '20px', color: '#4ECDC4', fontWeight: 700 }}>
                  {profile?.height_cm || 170} cm
                </div>
              </div>
              <div style={{ padding: '16px', background: '#0a0a0a', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Weight</div>
                <div style={{ fontSize: '20px', color: '#4ECDC4', fontWeight: 700 }}>
                  {profile?.body_weight_kg || 75} kg
                </div>
              </div>
              <div style={{ padding: '16px', background: '#0a0a0a', borderRadius: '8px' }}>
                <div style={{ fontSize: '12px', color: '#999', marginBottom: '4px' }}>Stride</div>
                <div style={{ fontSize: '20px', color: '#4ECDC4', fontWeight: 700 }}>
                  {strideLength.toFixed(2)} m
                </div>
              </div>
            </div>
          </div>

          {/* Toggle Tracking */}
          <div style={{
            background: '#1a1a1a',
            border: '2px solid #333',
            borderRadius: '16px',
            padding: '24px',
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
                Step Tracking
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>
                {trackingEnabled ? 'Enabled - Automatic tracking active' : 'Disabled - No tracking'}
              </div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
              <input 
                type="checkbox" 
                checked={trackingEnabled} 
                onChange={(e) => setTrackingEnabled(e.target.checked)}
                style={{ opacity: 0, width: 0, height: 0 }}
              />
              <span style={{
                position: 'absolute',
                cursor: 'pointer',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: trackingEnabled ? '#4ECDC4' : '#333',
                transition: '0.4s',
                borderRadius: '34px'
              }}>
                <span style={{
                  position: 'absolute',
                  content: '',
                  height: '26px',
                  width: '26px',
                  left: trackingEnabled ? '30px' : '4px',
                  bottom: '4px',
                  background: '#fff',
                  transition: '0.4s',
                  borderRadius: '50%'
                }}></span>
              </span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  if (!trackingEnabled) {
    return (
      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 24px' }}>
        <div style={{
          background: '#0a0a0a',
          border: '2px solid #333',
          borderRadius: '20px',
          padding: '40px',
          textAlign: 'center'
        }}>
          <span className="material-icons" style={{ fontSize: '64px', color: '#666', marginBottom: '16px' }}>
            block
          </span>
          <h3 style={{ color: '#999', marginBottom: '16px' }}>Step Tracking Disabled</h3>
          <p style={{ color: '#666', marginBottom: '24px' }}>
            Enable step tracking to monitor your daily activity
          </p>
          <button onClick={() => setShowSettings(true)} style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{
            fontFamily: 'Bebas Neue, Impact, sans-serif',
            fontSize: '56px',
            letterSpacing: '0.05em',
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>STEP TRACKER</h2>
          <p style={{ color: '#999', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="material-icons" style={{ fontSize: '20px', color: '#4ECDC4' }}>directions_walk</span>
            Automatic step tracking with motion sensors
          </p>
        </div>
        <button onClick={() => setShowSettings(true)} style={{
          padding: '12px 24px',
          background: '#1a1a1a',
          border: '2px solid #333',
          borderRadius: '12px',
          color: '#fff',
          fontSize: '16px',
          fontWeight: 700,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span className="material-icons">settings</span>
          Settings
        </button>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div style={{
          background: 'rgba(255, 107, 107, 0.1)',
          border: '2px solid #FF6B6B',
          borderRadius: '12px',
          padding: '16px 24px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span className="material-icons" style={{ color: '#FF6B6B' }}>error</span>
          <div style={{ color: '#FF6B6B', fontSize: '14px' }}>{errorMessage}</div>
        </div>
      )}

      {/* Permission Request */}
      {permissionStatus === 'unknown' && !isTracking && (
        <div style={{
          background: 'rgba(78, 205, 196, 0.1)',
          border: '2px solid #4ECDC4',
          borderRadius: '12px',
          padding: '24px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
            <span className="material-icons" style={{ color: '#4ECDC4', fontSize: '32px' }}>info</span>
            <div>
              <div style={{ color: '#4ECDC4', fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
                Motion & Fitness Permissions Required
              </div>
              <div style={{ color: '#999', fontSize: '14px', marginBottom: '16px' }}>
                To automatically track your steps, this app needs access to your device's motion sensors (accelerometer and gyroscope).
                Your data is processed locally and stored securely.
              </div>
              <button onClick={requestPermissions} style={{
                padding: '12px 24px',
                background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 700,
                cursor: 'pointer'
              }}>
                Grant Permissions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Stats Card */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(78, 205, 196, 0.1) 0%, rgba(68, 160, 141, 0.05) 100%)',
        border: '2px solid #4ECDC430',
        borderRadius: '24px',
        padding: '40px',
        marginBottom: '32px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Step Count - Big Display */}
        <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
          <div style={{
            fontFamily: 'Bebas Neue, Impact, sans-serif',
            fontSize: '120px',
            fontWeight: 700,
            color: '#4ECDC4',
            lineHeight: '1',
            textShadow: '0 0 40px rgba(78, 205, 196, 0.5)',
            marginBottom: '8px'
          }}>{steps.toLocaleString()}</div>
          <div style={{ fontSize: '24px', color: '#999', fontWeight: 600 }}>STEPS TODAY</div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          marginBottom: '32px'
        }}>
          <StatCard
            icon="straighten"
            label="Distance"
            value={distance.toFixed(2)}
            unit="km"
            color="#4ECDC4"
          />
          <StatCard
            icon="local_fire_department"
            label="Calories"
            value={calories.toFixed(0)}
            unit="kcal"
            color="#FF6B6B"
          />
          <StatCard
            icon="speed"
            label="Cadence"
            value={cadence}
            unit="steps/min"
            color="#FFD93D"
          />
          <StatCard
            icon="schedule"
            label="Duration"
            value={Math.floor(duration / 60)}
            unit="min"
            color="#A8E6CF"
          />
        </div>

        {/* Control Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {!isTracking ? (
            <button onClick={startTracking} style={{
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(78, 205, 196, 0.4)',
              transition: 'all 0.3s'
            }}>
              <span className="material-icons">play_arrow</span>
              Start Tracking
            </button>
          ) : (
            <button onClick={stopTracking} style={{
              padding: '16px 48px',
              background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '18px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(255, 107, 107, 0.4)',
              animation: 'pulse 2s ease-in-out infinite'
            }}>
              <span className="material-icons">stop</span>
              Stop & Save
            </button>
          )}
          
          <button onClick={resetCounter} style={{
            padding: '16px 32px',
            background: '#1a1a1a',
            border: '2px solid #333',
            borderRadius: '12px',
            color: '#999',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span className="material-icons">refresh</span>
            Reset
          </button>
        </div>
      </div>

      {/* Today's Logs */}
      {todayLogs.length > 0 && (
        <div style={{
          background: '#0a0a0a',
          border: '2px solid #333',
          borderRadius: '20px',
          padding: '32px',
          marginTop: '32px'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span className="material-icons" style={{ color: '#4ECDC4' }}>history</span>
            Today's Activity Log
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {todayLogs.map((log, idx) => (
              <div key={idx} style={{
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: '12px',
                padding: '20px',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Steps</div>
                  <div style={{ fontSize: '20px', color: '#4ECDC4', fontWeight: 700 }}>
                    {log.steps?.toLocaleString() || 0}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Distance</div>
                  <div style={{ fontSize: '20px', color: '#fff', fontWeight: 700 }}>
                    {log.distance_km?.toFixed(2) || 0} km
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>Calories</div>
                  <div style={{ fontSize: '20px', color: '#FF6B6B', fontWeight: 700 }}>
                    {log.calories?.toFixed(0) || 0} kcal
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, unit, color }) {
  return (
    <div style={{
      background: '#1a1a1a',
      border: `2px solid ${color}30`,
      borderRadius: '16px',
      padding: '20px',
      textAlign: 'center'
    }}>
      <span className="material-icons" style={{ fontSize: '32px', color, marginBottom: '8px' }}>
        {icon}
      </span>
      <div style={{
        fontSize: '36px',
        fontWeight: 700,
        color,
        marginBottom: '4px',
        fontFamily: 'Bebas Neue, Impact, sans-serif'
      }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>{unit}</div>
      <div style={{ fontSize: '14px', color: '#999', fontWeight: 600 }}>{label}</div>
    </div>
  );
}
