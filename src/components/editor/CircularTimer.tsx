import { useEffect, useState } from 'react';

interface CircularTimerProps {
  duration: number; // Total duration in milliseconds
  isActive: boolean; // Whether timer is running
  onComplete?: () => void; // Callback when timer completes
  size?: number; // Size in pixels
  strokeWidth?: number; // Stroke width in pixels
}

export function CircularTimer({ 
  duration, 
  isActive, 
  onComplete,
  size = 16, 
  strokeWidth = 2 
}: CircularTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isActive || duration === 0) {
      setElapsed(0);
      return;
    }

    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const newElapsed = now - startTime;

      if (newElapsed >= duration) {
        setElapsed(duration);
        clearInterval(interval);
        onComplete?.();
      } else {
        setElapsed(newElapsed);
      }
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(interval);
  }, [duration, isActive, onComplete]);

  // Reset elapsed when duration changes or becomes inactive
  useEffect(() => {
    if (!isActive) {
      setElapsed(0);
    }
  }, [isActive, duration]);

  const progress = duration > 0 ? (elapsed / duration) : 0;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <svg
      width={size}
      height={size}
      className="transform -rotate-90"
    >
      {/* Background circle */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted-foreground/20"
      />
      
      {/* Progress circle */}
      {isActive && (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-primary transition-all duration-100 ease-linear"
        />
      )}
    </svg>
  );
}
