// Spinner component for loading indicators
import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray' | 'success' | 'danger' | 'warning';
  className?: string;
  label?: string;
}

export function Spinner({
  size = 'md',
  color = 'primary',
  className = '',
  label,
}: SpinnerProps) {
  const sizeMap = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const colorMap = {
    primary: 'border-blue-600',
    white: 'border-white',
    gray: 'border-gray-600',
    success: 'border-green-600',
    danger: 'border-red-600',
    warning: 'border-yellow-600',
  };

  return (
    <div className={`inline-flex flex-col items-center gap-2 ${className}`}>
      <div
        className={`
          ${sizeMap[size]}
          border-4
          ${colorMap[color]}
          border-t-transparent
          rounded-full
          animate-spin
        `}
        role="status"
        aria-label={label || 'جاري التحميل'}
      />
      {label && (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {label}
        </span>
      )}
    </div>
  );
}

export function SpinnerDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
      <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
    </div>
  );
}

export function SpinnerPulse({ className = '' }: { className?: string }) {
  return (
    <div className={`relative ${className}`}>
      <div className="w-12 h-12 rounded-full bg-blue-400 opacity-75 absolute animate-ping"></div>
      <div className="w-12 h-12 rounded-full bg-blue-600"></div>
    </div>
  );
}

// Full-page loading overlay
interface LoadingOverlayProps {
  show: boolean;
  message?: string;
  blur?: boolean;
}

export function LoadingOverlay({ show, message = 'جاري التحميل...', blur = true }: LoadingOverlayProps) {
  if (!show) return null;

  return (
    <div className={`
      fixed inset-0 z-50 
      flex items-center justify-center 
      bg-black/20 dark:bg-black/40
      ${blur ? 'backdrop-blur-sm' : ''}
      transition-all duration-300
    `}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-gray-700 dark:text-gray-300 font-medium">
          {message}
        </p>
      </div>
    </div>
  );
}

// Button with loading state
interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
}

export function LoadingButton({
  loading = false,
  loadingText,
  children,
  variant = 'primary',
  disabled,
  className = '',
  ...props
}: LoadingButtonProps) {
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      disabled={disabled || loading}
      className={`
        px-4 py-2 rounded-lg font-medium
        transition-all duration-200
        disabled:opacity-50 disabled:cursor-not-allowed
        flex items-center gap-2
        ${variantClasses[variant]}
        ${className}
      `}
      {...props}
    >
      {loading && <Spinner size="sm" color="white" />}
      {loading ? (loadingText || children) : children}
    </button>
  );
}

// Progress bar
interface ProgressBarProps {
  progress: number; // 0-100
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ProgressBar({
  progress,
  showLabel = true,
  color = 'primary',
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const colorMap = {
    primary: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-yellow-600',
    danger: 'bg-red-600',
  };

  const sizeMap = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const clampedProgress = Math.min(Math.max(progress, 0), 100);

  return (
    <div className={className}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {clampedProgress}%
          </span>
        </div>
      )}
      <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeMap[size]}`}>
        <div
          className={`${colorMap[color]} ${sizeMap[size]} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  );
}

// Linear progress (indeterminate)
export function LinearProgress({ className = '' }: { className?: string }) {
  return (
    <div className={`w-full h-1 bg-gray-200 dark:bg-gray-700 overflow-hidden ${className}`}>
      <div className="h-full bg-blue-600 animate-progress" />
    </div>
  );
}

// Add to globals.css:
export const progressStyles = `
@keyframes progress {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.animate-progress {
  animation: progress 1.5s ease-in-out infinite;
  width: 40%;
}
`;

// Loading state hook
export function useLoading(initialState = false) {
  const [loading, setLoading] = React.useState(initialState);

  const startLoading = () => setLoading(true);
  const stopLoading = () => setLoading(false);
  const toggleLoading = () => setLoading((prev) => !prev);

  return {
    loading,
    startLoading,
    stopLoading,
    toggleLoading,
    setLoading,
  };
}
