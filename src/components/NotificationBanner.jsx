import { useState, useEffect } from 'react';
import {
  requestNotificationPermission,
  saveNotificationPreference,
  hasShownNotificationPrompt,
  getNotificationPermission,
} from '../utils/notifications';

export default function NotificationBanner() {
  const [show, setShow] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Show banner if:
    // 1. Notification prompt hasn't been shown before
    // 2. Permission is still 'default' (not granted or denied)
    const permission = getNotificationPermission();
    const hasShown = hasShownNotificationPrompt();
    
    if (!hasShown && permission === 'default') {
      // Delay showing the banner by 2 seconds for better UX
      const timer = setTimeout(() => {
        setShow(true);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    
    if (result.success) {
      saveNotificationPreference(true);
      handleClose();
    } else {
      // If denied, still save that we asked
      saveNotificationPreference(false);
      handleClose();
    }
  };

  const handleMaybeLater = () => {
    // Don't save preference yet, just mark as shown
    localStorage.setItem('notificationPromptShown', 'true');
    handleClose();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setShow(false);
    }, 300);
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        left: '50%',
        transform: `translateX(-50%) translateY(${isClosing ? '-120%' : '0'})`,
        zIndex: 9999,
        width: '90%',
        maxWidth: '500px',
        transition: 'all 0.3s ease',
        opacity: isClosing ? 0 : 1,
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 100%)',
          border: '2px solid #f43f5e',
          borderRadius: '20px',
          padding: '24px',
          boxShadow: '0 20px 60px rgba(244, 63, 94, 0.4), 0 0 100px rgba(244, 63, 94, 0.2)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Animated gradient background */}
        <div
          style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, rgba(244, 63, 94, 0.1) 0%, transparent 70%)',
            animation: 'pulse 3s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            {/* Icon */}
            <div
              style={{
                width: '56px',
                height: '56px',
                background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 8px 24px rgba(244, 63, 94, 0.4)',
              }}
            >
              <span className="material-icons" style={{ fontSize: '28px', color: '#fff' }}>
                notifications_active
              </span>
            </div>

            {/* Text */}
            <div style={{ flex: 1 }}>
              <h3
                style={{
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#fff',
                  marginBottom: '8px',
                  fontFamily: 'Bebas Neue, Impact, sans-serif',
                  letterSpacing: '0.05em',
                }}
              >
                🎯 Stay Motivated & Informed!
              </h3>
              <p
                style={{
                  fontSize: '14px',
                  color: '#999',
                  lineHeight: 1.5,
                  marginBottom: '16px',
                }}
              >
                Get instant alerts when you crush new PRs, hit workout streaks, and receive smart
                training reminders. Never miss a milestone!
              </p>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={handleEnable}
                  style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
                    border: 'none',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 12px rgba(244, 63, 94, 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(244, 63, 94, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(244, 63, 94, 0.3)';
                  }}
                >
                  <span className="material-icons" style={{ fontSize: '16px' }}>
                    check_circle
                  </span>
                  Enable Notifications
                </button>

                <button
                  onClick={handleMaybeLater}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    color: '#999',
                    fontSize: '14px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    e.currentTarget.style.color = '#999';
                  }}
                >
                  Maybe Later
                </button>
              </div>
            </div>
          </div>
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.05); opacity: 0.8; }
          }
        `}</style>
      </div>
    </div>
  );
}
