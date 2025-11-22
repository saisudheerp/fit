import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { updateProfile } from '../lib/firebase-database';
import { signOut } from '../lib/firebase-auth';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { user, profile } = useAuth();
  const [name, setName] = useState('');
  const [bodyWeight, setBodyWeight] = useState(75);
  const [height, setHeight] = useState(175);
  const [age, setAge] = useState(25);
  const [gender, setGender] = useState('male');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setBodyWeight(profile.body_weight_kg || 75);
      setHeight(profile.height_cm || 175);
      setAge(profile.age || 25);
      setGender(profile.gender || 'male');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await updateProfile(user.uid, {
        name: name || null,
        body_weight_kg: bodyWeight,
        height_cm: height,
        age: age,
        gender: gender
      });
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ marginBottom: '48px', animation: 'fadeIn 0.5s ease-out' }}>
        <h2 style={{
          fontFamily: 'Bebas Neue, Impact, sans-serif',
          fontSize: '64px',
          letterSpacing: '0.05em',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text'
        }}>SETTINGS</h2>
        <p style={{ color: '#666', fontSize: '16px', fontWeight: 500 }}>⚙️ Configure your profile and preferences</p>
      </div>

      {message && (
        <div className="scale-in" style={{
          padding: '16px 20px',
          marginBottom: '24px',
          background: message.includes('Error') ? 'linear-gradient(135deg, #ff6b6b20 0%, #ee5a5a20 100%)' : 'linear-gradient(135deg, #4ade8020 0%, #22c55e20 100%)',
          color: message.includes('Error') ? '#ff6b6b' : '#4ade80',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: 600,
          border: `2px solid ${message.includes('Error') ? '#ff6b6b' : '#4ade80'}`,
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span className="material-icons">{message.includes('Error') ? 'error' : 'check_circle'}</span>
          {message}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* User Profile */}
        <div className="scale-in" style={{
          backgroundColor: '#1a1a1a',
          border: '2px solid #2a2a2a',
          borderRadius: '16px',
          padding: '32px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Purple accent */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '4px',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
          }}></div>

          <h3 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'Bebas Neue, Impact, sans-serif',
            letterSpacing: '0.05em'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="material-icons" style={{ color: '#fff' }}>person</span>
            </div>
            User Profile
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#999', letterSpacing: '0.05em' }}>NAME</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: '#0a0a0a',
                  border: '2px solid #2a2a2a',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '15px',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#999', letterSpacing: '0.05em' }}>BODY WEIGHT (KG)</label>
                <input
                  type="number"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    backgroundColor: '#0a0a0a',
                    border: '2px solid #2a2a2a',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '15px',
                    fontFamily: 'Roboto Mono, monospace',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#999', letterSpacing: '0.05em' }}>HEIGHT (CM)</label>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => setHeight(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    backgroundColor: '#0a0a0a',
                    border: '2px solid #2a2a2a',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '15px',
                    fontFamily: 'Roboto Mono, monospace',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#999', letterSpacing: '0.05em' }}>AGE</label>
                <input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    backgroundColor: '#0a0a0a',
                    border: '2px solid #2a2a2a',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '15px',
                    fontFamily: 'Roboto Mono, monospace',
                    outline: 'none',
                    transition: 'all 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '8px', color: '#999', letterSpacing: '0.05em' }}>GENDER</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    backgroundColor: '#0a0a0a',
                    border: '2px solid #2a2a2a',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '15px',
                    outline: 'none',
                    transition: 'all 0.2s',
                    cursor: 'pointer'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#667eea'}
                  onBlur={(e) => e.target.style.borderColor = '#2a2a2a'}
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Calculated Metrics */}
        <div className="scale-in" style={{
          backgroundColor: '#1a1a1a',
          border: '2px solid #2a2a2a',
          borderRadius: '16px',
          padding: '32px',
          animationDelay: '0.1s'
        }}>
          <h3 style={{
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontFamily: 'Bebas Neue, Impact, sans-serif',
            letterSpacing: '0.05em'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span className="material-icons" style={{ color: '#fff' }}>calculate</span>
            </div>
            Calculated Metrics
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
              padding: '24px',
              borderRadius: '12px',
              border: '2px solid #667eea40',
              textAlign: 'center'
            }}>
              <div style={{ color: '#667eea', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '8px' }}>STRIDE LENGTH</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '48px', fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>{(height * 0.415 / 100).toFixed(2)}</div>
              <div style={{ fontSize: '12px', color: '#999', fontWeight: 600 }}>meters</div>
            </div>

            <div style={{
              background: 'linear-gradient(135deg, #f093fb20 0%, #f5576c20 100%)',
              padding: '24px',
              borderRadius: '12px',
              border: '2px solid #f093fb40',
              textAlign: 'center'
            }}>
              <div style={{ color: '#f093fb', fontSize: '11px', fontWeight: 700, letterSpacing: '0.1em', marginBottom: '8px' }}>BMI</div>
              <div style={{ fontFamily: 'Bebas Neue', fontSize: '48px', fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
                {(bodyWeight / ((height / 100) ** 2)).toFixed(1)}
              </div>
              <div style={{ fontSize: '12px', color: '#999', fontWeight: 600 }}>kg/m²</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="scale-in" style={{ display: 'flex', gap: '16px', animationDelay: '0.2s' }}>
          <button onClick={handleSave} disabled={saving} style={{
            flex: 1,
            padding: '16px',
            background: saving ? '#666' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: saving ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s',
            boxShadow: saving ? 'none' : '0 4px 12px rgba(102, 126, 234, 0.4)'
          }}
          onMouseEnter={(e) => {
            if (!saving) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 8px 20px rgba(102, 126, 234, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            if (!saving) {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
            }
          }}>
            <span className="material-icons">{saving ? 'hourglass_empty' : 'save'}</span>
            {saving ? 'Saving...' : 'Save Settings'}
          </button>

          <button style={{
            flex: 1,
            padding: '16px',
            background: 'transparent',
            color: '#999',
            border: '2px solid #2a2a2a',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = '#fff';
            e.target.style.color = '#fff';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = '#2a2a2a';
            e.target.style.color = '#999';
            e.target.style.transform = 'translateY(0)';
          }}>
            <span className="material-icons">refresh</span>
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
