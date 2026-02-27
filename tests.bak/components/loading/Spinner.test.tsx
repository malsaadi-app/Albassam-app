import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Spinner, LoadingButton, ProgressBar } from '@/components/loading/Spinner';

describe('Spinner', () => {
  it('should render spinner with default props', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should render spinner with label', () => {
    render(<Spinner label="جاري التحميل..." />);
    expect(screen.getByText('جاري التحميل...')).toBeInTheDocument();
  });

  it('should apply correct size class', () => {
    const { container } = render(<Spinner size="lg" />);
    const spinner = container.querySelector('.w-12.h-12');
    expect(spinner).toBeInTheDocument();
  });

  it('should apply correct color class', () => {
    const { container } = render(<Spinner color="success" />);
    const spinner = container.querySelector('.border-green-600');
    expect(spinner).toBeInTheDocument();
  });
});

describe('LoadingButton', () => {
  it('should render button with children', () => {
    render(<LoadingButton>حفظ</LoadingButton>);
    expect(screen.getByText('حفظ')).toBeInTheDocument();
  });

  it('should show spinner when loading', () => {
    render(<LoadingButton loading={true}>حفظ</LoadingButton>);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('should be disabled when loading', () => {
    render(<LoadingButton loading={true}>حفظ</LoadingButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('should show loading text when provided', () => {
    render(
      <LoadingButton loading={true} loadingText="جاري الحفظ...">
        حفظ
      </LoadingButton>
    );
    expect(screen.getByText('جاري الحفظ...')).toBeInTheDocument();
  });

  it('should apply variant classes', () => {
    const { container } = render(
      <LoadingButton variant="success">حفظ</LoadingButton>
    );
    const button = container.querySelector('.bg-green-600');
    expect(button).toBeInTheDocument();
  });
});

describe('ProgressBar', () => {
  it('should render progress bar', () => {
    const { container } = render(<ProgressBar progress={50} />);
    const progressBar = container.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should show label when showLabel is true', () => {
    render(<ProgressBar progress={75} showLabel={true} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('should clamp progress to 0-100 range', () => {
    const { container } = render(<ProgressBar progress={150} />);
    const progressBar = container.querySelector('[style*="width: 100%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should apply color classes', () => {
    const { container } = render(<ProgressBar progress={50} color="success" />);
    const progressBar = container.querySelector('.bg-green-600');
    expect(progressBar).toBeInTheDocument();
  });
});
