import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import StepCounter from '../lib/stepCounter';
import { logSteps } from '../lib/firebase-database';

export default function StepTracker() {
  const { user, profile } = useAuth();
  const [isTracking, setIsTracking] = useState(false);
  const [stats, setStats] = useState({
    steps: 0,
    distance: 0,
    calories: 0,
    duration: 0,
    cadence: 0
  });
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationStep, setCalibrationStep] = useState(0);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  
  const stepCounterRef = useRef(null);
  const syncIntervalRef = useRef(null);

  useEffect(() => {
    if (user && profile && !stepCounterRef.current) {
      initializeStepCounter();
    }
    
    return () => {
      if (stepCounterRef.current && isTracking) {
        stopTracking();
      }
    };
  }, [user, profile]);

  const initializeStepCounter = async () => {
    const counter = new StepCounter({
      sampleRate: 50,
      idleSampleRate: 10,
      lowBatteryThreshold: 0.10
    });

    await counter.initialize({
      height_cm: profile.height_cm || 170,
      body_weight_kg: profile.body_weight_kg || 75
    });

    // Set callbacks
    counter.onStepDetected = (steps) => {
      console.log('Step detected:', steps);
    };

    counter.onStatsUpdate = (newStats) => {
      setStats(newStats);
    };

    stepCounterRef.current = counter;
    setStats(counter.getStats());
  };

  const requestPermissions = async () => {
    try {
      // Check if permissions API is available
      if (typeof DeviceMotionEvent !== 'undefined' && 
          typeof DeviceMotionEvent.requestPermission === 'function') {
        const permission = await DeviceMotionEvent.requestPermission();
        if (permission === 'granted') {
          setPermissionGranted(true);
          setShowPermissionDialog(false);
          return true;
        } else {
          alert('Motion sensor permission is required for step tracking');
          return false;
        }
      } else {
        // Desktop/Android - no permission needed
        setPermissionGranted(true);
        return true;
      }
    } catch (error) {
      console.error('Permission request failed:', error);
      alert('Failed to request permissions: ' + error.message);
      return false;
    }
  };

  const startTracking = async () => {
    if (!stepCounterRef.current) {
      await initializeStepCounter();
    }

    // Request permissions if needed
    if (!permissionGranted) {
      const granted = await requestPermissions();
      if (!granted) return;
    }

    try {
      await stepCounterRef.current.start();
      setIsTracking(true);
      
      // Start periodic sync to Firebase
      syncIntervalRef.current = setInterval(() => {
        syncToFirebase();
      }, 60000); // Every minute
      
      console.log('Step tracking started');
    } catch (error) {
      console.error('Failed to start tracking:', error);
      alert('Failed to start step tracking. Please check sensor permissions.');
    }
  };

  const stopTracking = async () => {
    if (!stepCounterRef.current) return;

    await stepCounterRef.current.stop();
    setIsTracking(false);
    
    // Stop sync interval
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    
    // Final sync
    await syncToFirebase();
    
    console.log('Step tracking stopped');
  };

  const syncToFirebase = async () => {
    if (!stepCounterRef.current || !user) return;

    const stats = stepCounterRef.current.getStats();
    const today = new Date().toISOString().split('T')[0];

    try {
      await logSteps(user.uid, {
        date: today,
        steps: stats.steps,
        distance_km: stats.distance,
        calories: stats.calories,
        duration_minutes: Math.floor(stats.duration / 60),
        avg_cadence: stats.cadence,
        stride_length_m: stats.strideLength,
        stride_factor: stats.strideFactor
      });
      
      console.log('Synced steps to Firebase:', stats.steps);
    } catch (error) {
      console.error('Failed to sync steps:', error);
    }
  };

  const startCalibration = async () => {
    if (!stepCounterRef.current) {
      await initializeStepCounter();
    }

    setIsCalibrating(true);
    setCalibrationStep(0);
    await stepCounterRef.current.startCalibration();
  };

  const completeCalibration = async () => {
    if (!stepCounterRef.current) return;

    const success = await stepCounterRef.current.completeCalibration();
    if (success) {
      setIsCalibrating(false);
      setCalibrationStep(0);
      alert('Calibration complete! Your stride has been adjusted for better accuracy.');
    } else {
      alert('Please walk at least 20 steps to complete calibration');
    }
  };

  const resetCounter = () => {
    if (!stepCounterRef.current) return;
    if (!confirm('Reset step counter for today?')) return;
    
    stepCounterRef.current.reset();
    setStats(stepCounterRef.current.getStats());
  };

  const toggleTracking = () => {
    setTrackingEnabled(!trackingEnabled);
    if (trackingEnabled && isTracking) {
      stopTracking();
    }
  };

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
          <button onClick={toggleTracking} style={{
            padding: '12px 32px',
            background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
            border: 'none',
            borderRadius: '12px',
            color: '#fff',
            fontSize: '16px',
            fontWeight: 700,
            cursor: 'pointer'
          }}>
            Enable Step Tracking
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 24px' }}>
      {/* Header */}
      <div style={{ marginBottom: '40px' }}>
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
          Real-time step counting with sensor fusion
        </p>
      </div>

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
        {/* Animated background */}
        <div style={{
          position: 'absolute',
          top: '-50%',
          right: '-20%',
          width: '400px',
          height: '400px',
          background: 'radial-gradient(circle, #4ECDC425 0%, transparent 70%)',
          borderRadius: '50%',
          animation: 'pulse 4s ease-in-out infinite'
        }}></div>

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
          }}>{stats.steps.toLocaleString()}</div>
          <div style={{ fontSize: '24px', color: '#999', fontWeight: 600 }}>STEPS</div>
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
            value={stats.distance.toFixed(2)}
            unit="km"
            color="#4ECDC4"
          />
          <StatCard
            icon="local_fire_department"
            label="Calories"
            value={stats.calories.toFixed(0)}
            unit="kcal"
            color="#FF6B6B"
          />
          <StatCard
            icon="speed"
            label="Cadence"
            value={stats.cadence}
            unit="steps/min"
            color="#FFD93D"
          />
          <StatCard
            icon="schedule"
            label="Duration"
            value={Math.floor(stats.duration / 60)}
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
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 30px rgba(78, 205, 196, 0.6)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(78, 205, 196, 0.4)';
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
              Stop Tracking
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

      {/* Calibration Section */}
      <div style={{
        background: '#0a0a0a',
        border: '2px solid #333',
        borderRadius: '20px',
        padding: '32px',
        marginBottom: '32px'
      }}>
        <h3 style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#fff',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span className="material-icons" style={{ color: '#FFD93D' }}>tune</span>
          Calibration
        </h3>
        
        {!isCalibrating ? (
          <>
            <p style={{ color: '#999', marginBottom: '24px' }}>
              Calibrate your stride for more accurate distance and calorie calculations. 
              Walk 20 steps in a straight line when prompted.
            </p>
            <button onClick={startCalibration} style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #FFD93D 0%, #F5C000 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#000',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <span className="material-icons">directions_walk</span>
              Start Calibration
            </button>
          </>
        ) : (
          <>
            <div style={{ 
              background: '#FFD93D20',
              border: '2px solid #FFD93D',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '24px'
            }}>
              <p style={{ color: '#FFD93D', fontSize: '18px', fontWeight: 600, marginBottom: '12px' }}>
                Walk 20 steps now...
              </p>
              <p style={{ color: '#999', fontSize: '14px' }}>
                Current steps: {stats.steps}
              </p>
            </div>
            <button onClick={completeCalibration} style={{
              padding: '12px 32px',
              background: 'linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              fontSize: '16px',
              fontWeight: 700,
              cursor: 'pointer'
            }}>
              Complete Calibration
            </button>
          </>
        )}
      </div>

      {/* Settings */}
      <div style={{
        background: '#0a0a0a',
        border: '2px solid #333',
        borderRadius: '20px',
        padding: '32px'
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
          <span className="material-icons" style={{ color: '#A8E6CF' }}>settings</span>
          Settings
        </h3>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ color: '#fff', fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
              Step Tracking
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>
              {trackingEnabled ? 'Enabled - monitoring your steps' : 'Disabled'}
            </div>
          </div>
          <label style={{ position: 'relative', display: 'inline-block', width: '60px', height: '34px' }}>
            <input 
              type="checkbox" 
              checked={trackingEnabled} 
              onChange={toggleTracking}
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

        <div style={{ marginTop: '24px', padding: '16px', background: '#1a1a1a', borderRadius: '12px' }}>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            <strong style={{ color: '#4ECDC4' }}>Height:</strong> {profile?.height_cm || 170} cm
          </div>
          <div style={{ fontSize: '14px', color: '#999', marginBottom: '8px' }}>
            <strong style={{ color: '#4ECDC4' }}>Weight:</strong> {profile?.body_weight_kg || 75} kg
          </div>
          <div style={{ fontSize: '14px', color: '#999' }}>
            <strong style={{ color: '#4ECDC4' }}>Stride Length:</strong> {stats.strideLength?.toFixed(2) || 0.71} m
          </div>
        </div>
      </div>
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
