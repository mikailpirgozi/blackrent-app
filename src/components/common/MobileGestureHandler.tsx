// 🤏 Mobile Gesture Handler
// Advanced gesture recognition and handling for mobile interactions

import React, { useRef, useCallback, useEffect } from 'react';
import { Box } from '@mui/material';
import { touchManager } from '../../utils/mobileOptimization';

interface GestureCallbacks {
  onTap?: (event: TouchEvent) => void;
  onDoubleTap?: (event: TouchEvent) => void;
  onLongPress?: (event: TouchEvent) => void;
  onSwipeLeft?: (event: TouchEvent) => void;
  onSwipeRight?: (event: TouchEvent) => void;
  onSwipeUp?: (event: TouchEvent) => void;
  onSwipeDown?: (event: TouchEvent) => void;
  onPinchStart?: (event: TouchEvent) => void;
  onPinchMove?: (event: TouchEvent, scale: number) => void;
  onPinchEnd?: (event: TouchEvent) => void;
  onRotateStart?: (event: TouchEvent) => void;
  onRotateMove?: (event: TouchEvent, angle: number) => void;
  onRotateEnd?: (event: TouchEvent) => void;
}

interface MobileGestureHandlerProps {
  children: React.ReactNode;
  callbacks?: GestureCallbacks;
  disabled?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface TouchPoint {
  id: number;
  x: number;
  y: number;
}

class AdvancedGestureRecognizer {
  private touchPoints: Map<number, TouchPoint> = new Map();
  private lastTapTime: number = 0;
  private tapCount: number = 0;
  private longPressTimer: NodeJS.Timeout | null = null;
  private initialDistance: number = 0;
  private initialAngle: number = 0;
  private isGesturing: boolean = false;

  private config = {
    doubleTapDelay: 300,
    longPressDelay: 500,
    minSwipeDistance: 50,
    maxSwipeTime: 300,
    pinchThreshold: 10,
    rotationThreshold: 5,
  };

  handleTouchStart = (event: TouchEvent, callbacks: GestureCallbacks) => {
    const touches = Array.from(event.touches);
    
    // Update touch points
    touches.forEach(touch => {
      this.touchPoints.set(touch.identifier, {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
      });
    });

    if (touches.length === 1) {
      // Single touch - potential tap, long press, or swipe
      this.handleSingleTouchStart(event, callbacks);
    } else if (touches.length === 2) {
      // Two touches - potential pinch or rotation
      this.handleMultiTouchStart(event, callbacks);
    }
  };

  private handleSingleTouchStart = (event: TouchEvent, callbacks: GestureCallbacks) => {
    const now = Date.now();
    
    // Check for double tap
    if (now - this.lastTapTime < this.config.doubleTapDelay) {
      this.tapCount++;
      if (this.tapCount === 2 && callbacks.onDoubleTap) {
        callbacks.onDoubleTap(event);
        touchManager.triggerHapticFeedback('medium');
        this.resetTapState();
        return;
      }
    } else {
      this.tapCount = 1;
    }
    
    this.lastTapTime = now;

    // Start long press detection
    if (callbacks.onLongPress) {
      this.longPressTimer = setTimeout(() => {
        if (!this.isGesturing && this.touchPoints.size === 1) {
          callbacks.onLongPress!(event);
          touchManager.triggerHapticFeedback('heavy');
        }
      }, this.config.longPressDelay);
    }
  };

  private handleMultiTouchStart = (event: TouchEvent, callbacks: GestureCallbacks) => {
    this.clearLongPress();
    this.isGesturing = true;

    if (event.touches.length === 2) {
      const touch1 = event.touches[0];
      const touch2 = event.touches[1];

      // Calculate initial distance for pinch
      this.initialDistance = this.getDistance(touch1, touch2);
      
      // Calculate initial angle for rotation
      this.initialAngle = this.getAngle(touch1, touch2);

      if (callbacks.onPinchStart) {
        callbacks.onPinchStart(event);
      }

      if (callbacks.onRotateStart) {
        callbacks.onRotateStart(event);
      }
    }
  };

  handleTouchMove = (event: TouchEvent, callbacks: GestureCallbacks) => {
    if (event.touches.length === 1) {
      // Single touch movement
      this.isGesturing = true;
      this.clearLongPress();
    } else if (event.touches.length === 2) {
      // Multi-touch gestures
      this.handleMultiTouchMove(event, callbacks);
    }
  };

  private handleMultiTouchMove = (event: TouchEvent, callbacks: GestureCallbacks) => {
    const touch1 = event.touches[0];
    const touch2 = event.touches[1];

    // Pinch gesture
    if (callbacks.onPinchMove) {
      const currentDistance = this.getDistance(touch1, touch2);
      const scale = currentDistance / this.initialDistance;
      
      if (Math.abs(scale - 1) > 0.1) { // Threshold to avoid jitter
        callbacks.onPinchMove(event, scale);
      }
    }

    // Rotation gesture
    if (callbacks.onRotateMove) {
      const currentAngle = this.getAngle(touch1, touch2);
      const angleDiff = currentAngle - this.initialAngle;
      
      if (Math.abs(angleDiff) > this.config.rotationThreshold) {
        callbacks.onRotateMove(event, angleDiff);
      }
    }
  };

  handleTouchEnd = (event: TouchEvent, callbacks: GestureCallbacks) => {
    const remainingTouches = Array.from(event.touches);
    
    if (remainingTouches.length === 0) {
      // All touches ended
      if (!this.isGesturing && this.tapCount === 1) {
        // Single tap
        setTimeout(() => {
          if (this.tapCount === 1 && callbacks.onTap) {
            callbacks.onTap(event);
            touchManager.triggerHapticFeedback('light');
          }
          this.resetTapState();
        }, this.config.doubleTapDelay);
      } else if (this.isGesturing) {
        // Check for swipe gesture
        this.handleSwipeGesture(event, callbacks);
      }

      this.reset();
    } else if (remainingTouches.length === 1 && this.touchPoints.size === 2) {
      // One finger lifted from multi-touch
      if (callbacks.onPinchEnd) {
        callbacks.onPinchEnd(event);
      }
      if (callbacks.onRotateEnd) {
        callbacks.onRotateEnd(event);
      }
    }

    // Update touch points
    const changedTouches = Array.from(event.changedTouches);
    changedTouches.forEach(touch => {
      this.touchPoints.delete(touch.identifier);
    });
  };

  private handleSwipeGesture = (event: TouchEvent, callbacks: GestureCallbacks) => {
    const changedTouch = event.changedTouches[0];
    const startPoint = this.touchPoints.get(changedTouch.identifier);
    
    if (!startPoint) return;

    const deltaX = changedTouch.clientX - startPoint.x;
    const deltaY = changedTouch.clientY - startPoint.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    if (distance > this.config.minSwipeDistance) {
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);

      if (absDeltaX > absDeltaY) {
        // Horizontal swipe
        if (deltaX > 0 && callbacks.onSwipeRight) {
          callbacks.onSwipeRight(event);
        } else if (deltaX < 0 && callbacks.onSwipeLeft) {
          callbacks.onSwipeLeft(event);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && callbacks.onSwipeDown) {
          callbacks.onSwipeDown(event);
        } else if (deltaY < 0 && callbacks.onSwipeUp) {
          callbacks.onSwipeUp(event);
        }
      }

      touchManager.triggerHapticFeedback('light');
    }
  };

  private getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  private getAngle = (touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.atan2(dy, dx) * (180 / Math.PI);
  };

  private clearLongPress = () => {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
  };

  private resetTapState = () => {
    this.tapCount = 0;
    this.lastTapTime = 0;
  };

  private reset = () => {
    this.touchPoints.clear();
    this.isGesturing = false;
    this.clearLongPress();
    this.initialDistance = 0;
    this.initialAngle = 0;
  };
}

const MobileGestureHandler: React.FC<MobileGestureHandlerProps> = ({
  children,
  callbacks = {},
  disabled = false,
  className,
  style,
}) => {
  const gestureRecognizer = useRef(new AdvancedGestureRecognizer());
  const elementRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((event: React.TouchEvent) => {
    if (disabled) return;
    
    event.preventDefault(); // Prevent default browser behaviors
    gestureRecognizer.current.handleTouchStart(event.nativeEvent, callbacks);
  }, [callbacks, disabled]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (disabled) return;
    
    gestureRecognizer.current.handleTouchMove(event.nativeEvent, callbacks);
  }, [callbacks, disabled]);

  const handleTouchEnd = useCallback((event: React.TouchEvent) => {
    if (disabled) return;
    
    gestureRecognizer.current.handleTouchEnd(event.nativeEvent, callbacks);
  }, [callbacks, disabled]);

  // Prevent context menu on long press for better UX
  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const preventContextMenu = (event: Event) => {
      if (!disabled) {
        event.preventDefault();
      }
    };

    element.addEventListener('contextmenu', preventContextMenu);
    
    return () => {
      element.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [disabled]);

  return (
    <Box
      ref={elementRef}
      className={className}
      style={style}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      sx={{
        touchAction: disabled ? 'auto' : 'none', // Disable default touch behaviors
        userSelect: 'none', // Prevent text selection
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none', // Disable iOS callout
        WebkitTapHighlightColor: 'transparent', // Remove tap highlight
        ...style,
      }}
    >
      {children}
    </Box>
  );
};

export default MobileGestureHandler;
