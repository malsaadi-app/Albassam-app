import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ErrorState } from '@/components/states';

describe('ErrorState', () => {
  it('should render 404 error state', () => {
    render(<ErrorState type="404" />);
    
    expect(screen.getByText('الصفحة غير موجودة')).toBeInTheDocument();
    expect(screen.getByText(/الصفحة التي تبحث عنها غير موجودة/)).toBeInTheDocument();
  });

  it('should render 403 error state', () => {
    render(<ErrorState type="403" />);
    
    expect(screen.getByText('غير مصرح')).toBeInTheDocument();
    expect(screen.getByText(/لا تملك الصلاحيات اللازمة/)).toBeInTheDocument();
  });

  it('should render 500 error state', () => {
    render(<ErrorState type="500" />);
    
    expect(screen.getByText('خطأ في الخادم')).toBeInTheDocument();
    expect(screen.getByText(/حدث خطأ في الخادم/)).toBeInTheDocument();
  });

  it('should render network error state', () => {
    render(<ErrorState type="network" />);
    
    expect(screen.getByText('خطأ في الاتصال')).toBeInTheDocument();
    expect(screen.getByText(/تحقق من اتصالك بالإنترنت/)).toBeInTheDocument();
  });

  it('should render timeout error state', () => {
    render(<ErrorState type="timeout" />);
    
    expect(screen.getByText('انتهت المهلة')).toBeInTheDocument();
    expect(screen.getByText(/استغرق الطلب وقتاً أطول من المتوقع/)).toBeInTheDocument();
  });

  it('should render data error state', () => {
    render(<ErrorState type="data" />);
    
    expect(screen.getByText('خطأ في البيانات')).toBeInTheDocument();
    expect(screen.getByText(/حدث خطأ أثناء معالجة البيانات/)).toBeInTheDocument();
  });

  it('should render custom title and message', () => {
    render(
      <ErrorState
        type="500"
        title="عنوان مخصص"
        message="رسالة مخصصة"
      />
    );
    
    expect(screen.getByText('عنوان مخصص')).toBeInTheDocument();
    expect(screen.getByText('رسالة مخصصة')).toBeInTheDocument();
  });

  it('should call onRetry when retry button is clicked', () => {
    const onRetry = vi.fn();
    render(<ErrorState type="500" onRetry={onRetry} />);
    
    const retryButton = screen.getByText('إعادة المحاولة');
    retryButton.click();
    
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should render action button when provided', () => {
    const action = {
      label: 'الذهاب للرئيسية',
      onClick: vi.fn(),
    };
    render(<ErrorState type="404" action={action} />);
    
    const actionButton = screen.getByText('الذهاب للرئيسية');
    expect(actionButton).toBeInTheDocument();
    
    actionButton.click();
    expect(action.onClick).toHaveBeenCalledTimes(1);
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ErrorState type="500" className="custom-class" />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should render inline variant', () => {
    const { container } = render(<ErrorState type="500" variant="inline" />);
    
    expect(container.querySelector('.error-state-inline')).toBeInTheDocument();
  });

  it('should render compact variant', () => {
    const { container } = render(<ErrorState type="500" variant="compact" />);
    
    expect(container.querySelector('.error-state-compact')).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    const { container } = render(<ErrorState type="500" showIcon={false} />);
    
    expect(container.querySelector('.error-icon')).not.toBeInTheDocument();
  });
});
