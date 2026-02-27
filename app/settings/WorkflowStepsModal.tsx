import { useState, useEffect } from 'react';
import Select from 'react-select';

interface User {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

interface WorkflowStep {
  id?: string;
  order: number;
  userId: string;
  statusName: string;
  user?: { id: string; displayName: string; username: string };
}

interface WorkflowStepsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (steps: WorkflowStep[]) => void;
  title: string;
  initialSteps?: WorkflowStep[];
  users: User[];
}

export default function WorkflowStepsModal({
  isOpen,
  onClose,
  onSave,
  title,
  initialSteps = [],
  users
}: WorkflowStepsModalProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  useEffect(() => {
    if (isOpen) {
      setSteps(initialSteps.length > 0 ? initialSteps : []);
    }
  }, [isOpen, initialSteps]);

  const addStep = () => {
    const newStep: WorkflowStep = {
      order: steps.length,
      userId: '',
      statusName: ''
    };
    setSteps([...steps, newStep]);
  };

  const removeStep = (index: number) => {
    const updated = steps.filter((_, i) => i !== index);
    // Re-order
    updated.forEach((step, i) => {
      step.order = i;
    });
    setSteps(updated);
  };

  const moveStepUp = (index: number) => {
    if (index === 0) return;
    const updated = [...steps];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    // Re-order
    updated.forEach((step, i) => {
      step.order = i;
    });
    setSteps(updated);
  };

  const moveStepDown = (index: number) => {
    if (index === steps.length - 1) return;
    const updated = [...steps];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    // Re-order
    updated.forEach((step, i) => {
      step.order = i;
    });
    setSteps(updated);
  };

  const updateStep = (index: number, field: 'userId' | 'statusName', value: string) => {
    const updated = [...steps];
    updated[index][field] = value;
    setSteps(updated);
  };

  const handleSave = () => {
    // Validate
    const invalid = steps.some(s => !s.userId || !s.statusName);
    if (invalid) {
      alert('❌ يرجى ملء جميع الحقول لكل خطوة');
      return;
    }
    onSave(steps);
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '700px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ 
          color: 'white', 
          fontSize: '20px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '24px' }}>⚙️</span>
          {title}
        </h3>

        {/* Steps List */}
        <div style={{ marginBottom: '20px' }}>
          {steps.length === 0 && (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              color: 'rgba(255, 255, 255, 0.7)',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '10px',
              marginBottom: '16px'
            }}>
              لا توجد خطوات. اضغط "إضافة خطوة" لإنشاء مسار موافقات.
            </div>
          )}

          {steps.map((step, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 'bold',
                  fontSize: '14px',
                  flexShrink: 0
                }}>
                  {index + 1}
                </div>
                
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', color: 'white', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                    اسم الحالة
                  </label>
                  <input
                    type="text"
                    value={step.statusName}
                    onChange={(e) => updateStep(index, 'statusName', e.target.value)}
                    placeholder="مثال: مراجعة أولية، موافقة المدير..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <button
                    onClick={() => moveStepUp(index)}
                    disabled={index === 0}
                    style={{
                      padding: '4px 8px',
                      background: index === 0 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '12px',
                      cursor: index === 0 ? 'not-allowed' : 'pointer',
                      opacity: index === 0 ? 0.5 : 1
                    }}
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveStepDown(index)}
                    disabled={index === steps.length - 1}
                    style={{
                      padding: '4px 8px',
                      background: index === steps.length - 1 ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.2)',
                      border: 'none',
                      borderRadius: '6px',
                      color: 'white',
                      fontSize: '12px',
                      cursor: index === steps.length - 1 ? 'not-allowed' : 'pointer',
                      opacity: index === steps.length - 1 ? 0.5 : 1
                    }}
                  >
                    ↓
                  </button>
                </div>

                <button
                  onClick={() => removeStep(index)}
                  style={{
                    padding: '6px 12px',
                    background: 'rgba(239, 68, 68, 0.8)',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  ✕
                </button>
              </div>

              <div>
                <label style={{ display: 'block', color: 'white', marginBottom: '6px', fontSize: '13px', fontWeight: '600' }}>
                  الشخص المسؤول
                </label>
                <Select
                  value={users.find(u => u.id === step.userId) ? {
                    value: step.userId,
                    label: users.find(u => u.id === step.userId)?.displayName || ''
                  } : null}
                  onChange={(option) => updateStep(index, 'userId', option?.value || '')}
                  options={users.map(user => ({ value: user.id, label: user.displayName }))}
                  placeholder="اختر الشخص..."
                  isSearchable
                  styles={{
                    control: (base) => ({
                      ...base,
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      borderRadius: '8px',
                      padding: '2px',
                      color: 'white'
                    }),
                    singleValue: (base) => ({ ...base, color: 'white' }),
                    input: (base) => ({ ...base, color: 'white' }),
                    placeholder: (base) => ({ ...base, color: 'rgba(255, 255, 255, 0.6)' }),
                    menu: (base) => ({ ...base, background: '#764ba2', borderRadius: '8px', zIndex: 9999 }),
                    option: (base, state) => ({
                      ...base,
                      background: state.isFocused ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                      color: 'white',
                      cursor: 'pointer'
                    })
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Add Step Button */}
        <button
          onClick={addStep}
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(59, 130, 246, 0.9)',
            border: '1px dashed rgba(255, 255, 255, 0.4)',
            borderRadius: '10px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          <span style={{ fontSize: '18px' }}>➕</span>
          <span>إضافة خطوة</span>
        </button>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSave}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(16, 185, 129, 0.9)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ✅ حفظ
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              background: 'rgba(239, 68, 68, 0.9)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            ❌ إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
