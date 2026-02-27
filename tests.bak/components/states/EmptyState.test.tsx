import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EmptyState } from '@/components/states';

describe('EmptyState', () => {
  it('should render empty state with title and description', () => {
    render(
      <EmptyState
        title="لا يوجد بيانات"
        description="لم يتم العثور على أي بيانات"
      />
    );
    
    expect(screen.getByText('لا يوجد بيانات')).toBeInTheDocument();
    expect(screen.getByText('لم يتم العثور على أي بيانات')).toBeInTheDocument();
  });

  it('should render action button when provided', () => {
    const action = {
      label: 'إضافة جديد',
      onClick: vi.fn(),
    };
    
    render(
      <EmptyState
        title="لا يوجد بيانات"
        description="ابدأ بإضافة أول عنصر"
        action={action}
      />
    );
    
    const actionButton = screen.getByText('إضافة جديد');
    expect(actionButton).toBeInTheDocument();
    
    actionButton.click();
    expect(action.onClick).toHaveBeenCalledTimes(1);
  });

  it('should render search preset', () => {
    render(<EmptyState preset="search" />);
    
    expect(screen.getByText('لا توجد نتائج')).toBeInTheDocument();
    expect(screen.getByText(/لم يتم العثور على نتائج/)).toBeInTheDocument();
  });

  it('should render filter preset', () => {
    render(<EmptyState preset="filter" />);
    
    expect(screen.getByText('لا توجد نتائج')).toBeInTheDocument();
    expect(screen.getByText(/لم يتم العثور على نتائج تطابق الفلتر/)).toBeInTheDocument();
  });

  it('should render new preset', () => {
    render(<EmptyState preset="new" />);
    
    expect(screen.getByText('ابدأ الآن')).toBeInTheDocument();
    expect(screen.getByText(/لم يتم إضافة أي عناصر بعد/)).toBeInTheDocument();
  });

  it('should render noData preset', () => {
    render(<EmptyState preset="noData" />);
    
    expect(screen.getByText('لا توجد بيانات')).toBeInTheDocument();
    expect(screen.getByText(/لا توجد بيانات لعرضها حالياً/)).toBeInTheDocument();
  });

  it('should render permissions preset', () => {
    render(<EmptyState preset="permissions" />);
    
    expect(screen.getByText('غير مصرح')).toBeInTheDocument();
    expect(screen.getByText(/لا تملك الصلاحيات/)).toBeInTheDocument();
  });

  it('should render offline preset', () => {
    render(<EmptyState preset="offline" />);
    
    expect(screen.getByText('غير متصل')).toBeInTheDocument();
    expect(screen.getByText(/لا يوجد اتصال بالإنترنت/)).toBeInTheDocument();
  });

  it('should render error preset', () => {
    render(<EmptyState preset="error" />);
    
    expect(screen.getByText('حدث خطأ')).toBeInTheDocument();
    expect(screen.getByText(/حدث خطأ أثناء تحميل البيانات/)).toBeInTheDocument();
  });

  it('should render loading preset', () => {
    render(<EmptyState preset="loading" />);
    
    expect(screen.getByText('جاري التحميل')).toBeInTheDocument();
    expect(screen.getByText(/يرجى الانتظار/)).toBeInTheDocument();
  });

  it('should render maintenance preset', () => {
    render(<EmptyState preset="maintenance" />);
    
    expect(screen.getByText('صيانة')).toBeInTheDocument();
    expect(screen.getByText(/النظام قيد الصيانة/)).toBeInTheDocument();
  });

  it('should render comingSoon preset', () => {
    render(<EmptyState preset="comingSoon" />);
    
    expect(screen.getByText('قريباً')).toBeInTheDocument();
    expect(screen.getByText(/هذه الميزة ستكون متاحة قريباً/)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <EmptyState
        title="Test"
        description="Test"
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should render inline variant', () => {
    const { container } = render(
      <EmptyState
        title="Test"
        description="Test"
        variant="inline"
      />
    );
    
    expect(container.querySelector('.empty-state-inline')).toBeInTheDocument();
  });

  it('should render compact variant', () => {
    const { container } = render(
      <EmptyState
        title="Test"
        description="Test"
        variant="compact"
      />
    );
    
    expect(container.querySelector('.empty-state-compact')).toBeInTheDocument();
  });

  it('should hide icon when showIcon is false', () => {
    const { container } = render(
      <EmptyState
        title="Test"
        description="Test"
        showIcon={false}
      />
    );
    
    expect(container.querySelector('.empty-icon')).not.toBeInTheDocument();
  });

  it('should render custom icon', () => {
    const CustomIcon = () => <div data-testid="custom-icon">Icon</div>;
    
    render(
      <EmptyState
        title="Test"
        description="Test"
        icon={<CustomIcon />}
      />
    );
    
    expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
  });
});
