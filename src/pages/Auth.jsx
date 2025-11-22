import { useState, useEffect } from 'react';
import { signIn, signUp, signInWithGoogle } from '../lib/firebase-auth';
import { createProfile } from '../lib/firebase-database';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const { user, profile, loading: authLoading } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && user) {
      console.log('Auth redirect check:', { user: user?.uid, profile: profile?.name, hasWeight: !!profile?.body_weight_kg });
      
      if (!profile?.name || !profile?.body_weight_kg) {
        console.log('Redirecting to /setup');
        navigate('/setup');
      } else {
        console.log('Redirecting to /');
        navigate('/');
      }
    }
  }, [user, profile, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting to', isSignUp ? 'sign up' : 'sign in', email);
      
      if (isSignUp) {
        // Sign up user
        const user = await signUp(email, password);
        console.log('User created:', user.uid);
        
        alert('Account created! Please complete your profile to continue.');
        // User will be auto-signed in, navigation to /setup happens via useEffect
      } else {
        await signIn(email, password);
        console.log('Signed in successfully');
        // Navigation happens via useEffect
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('Attempting Google sign in');
      const user = await signInWithGoogle();
      console.log('Google sign in successful:', user.uid);
      // Don't set loading to false - let the useEffect handle navigation
      // The auth state will change and trigger the redirect
    } catch (err) {
      console.error('Google auth error:', err);
      setError(err.message || 'An error occurred with Google sign in');
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Animated background elements */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, rgba(102, 126, 234, 0) 70%)',
        borderRadius: '50%',
        animation: 'pulse 4s ease-in-out infinite'
      }}></div>
      <div style={{
        position: 'absolute',
        bottom: '10%',
        right: '10%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(240, 147, 251, 0.15) 0%, rgba(240, 147, 251, 0) 70%)',
        borderRadius: '50%',
        animation: 'pulse 5s ease-in-out infinite'
      }}></div>

      <div className="scale-in" style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#1a1a1a',
        border: '2px solid #2a2a2a',
        borderRadius: '20px',
        padding: '48px',
        position: 'relative',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(10px)'
      }}>
        {/* Top gradient accent */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '4px',
          background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          borderRadius: '20px 20px 0 0'
        }}></div>

        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)'
          }}>
            <span className="material-icons" style={{ fontSize: '48px', color: '#fff' }}>
              fitness_center
            </span>
          </div>
          <h1 style={{
            fontFamily: 'Bebas Neue, Impact, sans-serif',
            fontSize: '48px',
            letterSpacing: '0.1em',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '8px'
          }}>FITTRACK</h1>
          <p style={{ color: '#999', fontSize: '15px', fontWeight: 500 }}>
            {isSignUp ? '🎯 Create your fitness journey' : '👋 Welcome back, champion'}
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#999', letterSpacing: '0.05em' }}>
              EMAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: '#0a0a0a',
                border: '2px solid #2a2a2a',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#2a2a2a';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '10px', color: '#999', letterSpacing: '0.05em' }}>
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="••••••••"
              style={{
                width: '100%',
                padding: '14px 16px',
                backgroundColor: '#0a0a0a',
                border: '2px solid #2a2a2a',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '15px',
                outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#667eea';
                e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#2a2a2a';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          {error && (
            <div className="scale-in" style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #ff6b6b20 0%, #ee5a5a20 100%)',
              border: '2px solid #ff6b6b',
              borderRadius: '12px',
              color: '#ff6b6b',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span className="material-icons" style={{ fontSize: '18px' }}>error</span>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '16px',
              background: loading ? '#666' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.5)';
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
              }
            }}
          >
            {loading ? 'Loading...' : (isSignUp ? 'Create Account' : 'Sign In')}
          </button>
        </form>

        {/* Divider */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          margin: '32px 0'
        }}>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent 0%, #2a2a2a 50%, transparent 100%)' }}></div>
          <span style={{ color: '#666', fontSize: '13px', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: '1px', background: 'linear-gradient(90deg, transparent 0%, #2a2a2a 50%, transparent 100%)' }}></div>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          type="button"
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            backgroundColor: '#fff',
            color: '#000',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '24px',
            transition: 'all 0.2s',
            boxShadow: '0 4px 12px rgba(255, 255, 255, 0.1)'
          }}
          onMouseEnter={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(255, 255, 255, 0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(255, 255, 255, 0.1)';
            }
          }}
        >
          {/* Google SVG Logo */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div style={{
          textAlign: 'center',
          marginTop: '28px',
          paddingTop: '24px',
          borderTop: '1px solid #2a2a2a'
        }}>
          <p style={{ color: '#999', fontSize: '14px' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError('');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: '#667eea',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                fontSize: '14px'
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
