'use client';

import { useState, useEffect, useRef, RefObject } from 'react';

export interface SwipeConfig {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  threshold?: number; // minimum distance for swipe (default: 50px)
  preventDefaultTouchmoveEvent?: boolean;
}

export function useSwipe(
  elementRef: RefObject<HTMLElement>,
  config: SwipeConfig
): void {
  const {
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold = 50,
    preventDefaultTouchmoveEvent = false
  } = config;

  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      setTouchEnd(null);
      setTouchStart({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (preventDefaultTouchmoveEvent) {
        e.preventDefault();
      }
      
      setTouchEnd({
        x: e.targetTouches[0].clientX,
        y: e.targetTouches[0].clientY
      });
    };

    const handleTouchEnd = () => {
      if (!touchStart || !touchEnd) return;

      const deltaX = touchStart.x - touchEnd.x;
      const deltaY = touchStart.y - touchEnd.y;

      const isHorizontalSwipe = Math.abs(deltaX) > Math.abs(deltaY);

      if (isHorizontalSwipe) {
        // Horizontal swipe
        if (Math.abs(deltaX) > threshold) {
          if (deltaX > 0) {
            // Swiped left
            onSwipeLeft?.();
          } else {
            // Swiped right
            onSwipeRight?.();
          }
        }
      } else {
        // Vertical swipe
        if (Math.abs(deltaY) > threshold) {
          if (deltaY > 0) {
            // Swiped up
            onSwipeUp?.();
          } else {
            // Swiped down
            onSwipeDown?.();
          }
        }
      }

      setTouchStart(null);
      setTouchEnd(null);
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    elementRef,
    touchStart,
    touchEnd,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    threshold,
    preventDefaultTouchmoveEvent
  ]);
}

// Long press hook
export interface LongPressConfig {
  onLongPress: () => void;
  duration?: number; // milliseconds (default: 500)
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
}

export function useLongPress(
  elementRef: RefObject<HTMLElement>,
  config: LongPressConfig
): void {
  const {
    onLongPress,
    duration = 500,
    onStart,
    onFinish,
    onCancel
  } = config;

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleStart = () => {
      isLongPressRef.current = false;
      onStart?.();
      
      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        onLongPress();
        onFinish?.();
      }, duration);
    };

    const handleEnd = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (!isLongPressRef.current) {
        onCancel?.();
      }

      isLongPressRef.current = false;
    };

    const handleCancel = () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      
      onCancel?.();
      isLongPressRef.current = false;
    };

    element.addEventListener('mousedown', handleStart);
    element.addEventListener('mouseup', handleEnd);
    element.addEventListener('mouseleave', handleCancel);
    element.addEventListener('touchstart', handleStart);
    element.addEventListener('touchend', handleEnd);
    element.addEventListener('touchcancel', handleCancel);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      element.removeEventListener('mousedown', handleStart);
      element.removeEventListener('mouseup', handleEnd);
      element.removeEventListener('mouseleave', handleCancel);
      element.removeEventListener('touchstart', handleStart);
      element.removeEventListener('touchend', handleEnd);
      element.removeEventListener('touchcancel', handleCancel);
    };
  }, [elementRef, onLongPress, duration, onStart, onFinish, onCancel]);
}

// Pull to refresh hook
export interface PullToRefreshConfig {
  onRefresh: () => Promise<void>;
  threshold?: number; // pull distance threshold (default: 80px)
  maxPullDistance?: number; // max pull distance (default: 150px)
}

export function usePullToRefresh(
  elementRef: RefObject<HTMLElement>,
  config: PullToRefreshConfig
) {
  const { onRefresh, threshold = 80, maxPullDistance = 150 } = config;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (element.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (element.scrollTop === 0 && !isRefreshing) {
        const currentY = e.touches[0].clientY;
        const distance = Math.min(currentY - startY.current, maxPullDistance);
        
        if (distance > 0) {
          setPullDistance(distance);
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(0);
        
        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setPullDistance(0);
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [elementRef, onRefresh, threshold, maxPullDistance, isRefreshing, pullDistance]);

  return { isRefreshing, pullDistance };
}
