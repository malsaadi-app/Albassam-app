'use client';

import { useState } from 'react';

type ChecklistItem = {
  id: string;
  text: string;
  completed: boolean;
};

type Props = {
  taskId: string;
  initialChecklist: ChecklistItem[];
  onUpdate: () => void;
  canEdit: boolean;
};

export default function ChecklistEditor({ taskId, initialChecklist, onUpdate, canEdit }: Props) {
  const [checklist, setChecklist] = useState<ChecklistItem[]>(initialChecklist);
  const [newItemText, setNewItemText] = useState('');
  const [saving, setSaving] = useState(false);

  const saveChecklist = async (updatedChecklist: ChecklistItem[]) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: updatedChecklist })
      });

      if (res.ok) {
        setChecklist(updatedChecklist);
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleItem = (itemId: string) => {
    if (!canEdit) return;
    const updated = checklist.map(item =>
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    saveChecklist(updated);
  };

  const addItem = () => {
    if (!newItemText.trim() || !canEdit) return;
    const newItem: ChecklistItem = {
      id: Date.now().toString(),
      text: newItemText.trim(),
      completed: false
    };
    const updated = [...checklist, newItem];
    saveChecklist(updated);
    setNewItemText('');
  };

  const deleteItem = (itemId: string) => {
    if (!canEdit) return;
    const updated = checklist.filter(item => item.id !== itemId);
    saveChecklist(updated);
  };

  const completedCount = checklist.filter(item => item.completed).length;
  const progress = checklist.length > 0 ? (completedCount / checklist.length) * 100 : 0;

  return (
    <div style={{ marginTop: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '12px'
      }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#f1f5f9' }}>
          ✅ المهام الفرعية ({completedCount}/{checklist.length})
        </h3>
        {checklist.length > 0 && (
          <div style={{ fontSize: '14px', color: '#10b981', fontWeight: 600 }}>
            {Math.round(progress)}%
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {checklist.length > 0 && (
        <div style={{
          width: '100%',
          height: '6px',
          background: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '3px',
          overflow: 'hidden',
          marginBottom: '16px'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}

      {/* Checklist Items */}
      <div style={{ marginBottom: '16px' }}>
        {checklist.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '32px',
            color: '#94a3b8',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '12px',
            border: '1px dashed rgba(255,255,255,0.1)',
            fontSize: '14px'
          }}>
            {canEdit ? 'لا توجد مهام فرعية. أضف مهمة جديدة!' : 'لا توجد مهام فرعية'}
          </div>
        ) : (
          checklist.map(item => (
            <div
              key={item.id}
              style={{
                background: item.completed 
                  ? 'rgba(16, 185, 129, 0.08)'
                  : 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: item.completed
                  ? '1px solid rgba(16, 185, 129, 0.2)'
                  : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '10px',
                padding: '12px 16px',
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'all 0.2s'
              }}
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => toggleItem(item.id)}
                disabled={!canEdit || saving}
                style={{
                  width: '20px',
                  height: '20px',
                  cursor: canEdit ? 'pointer' : 'not-allowed',
                  accentColor: '#10b981'
                }}
              />
              
              <div style={{
                flex: 1,
                color: item.completed ? '#94a3b8' : '#f1f5f9',
                textDecoration: item.completed ? 'line-through' : 'none',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                {item.text}
              </div>

              {canEdit && (
                <button
                  onClick={() => deleteItem(item.id)}
                  disabled={saving}
                  style={{
                    padding: '6px 10px',
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: '6px',
                    color: '#ef4444',
                    fontSize: '12px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
                  }}
                >
                  حذف
                </button>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add New Item */}
      {canEdit && (
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addItem()}
            placeholder="أضف مهمة فرعية جديدة..."
            disabled={saving}
            style={{
              flex: 1,
              padding: '10px 14px',
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '10px',
              color: '#f1f5f9',
              fontSize: '14px',
              outline: 'none'
            }}
          />
          <button
            onClick={addItem}
            disabled={!newItemText.trim() || saving}
            style={{
              padding: '10px 20px',
              background: !newItemText.trim() || saving
                ? 'rgba(100, 100, 100, 0.3)'
                : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              cursor: !newItemText.trim() || saving ? 'not-allowed' : 'pointer',
              opacity: !newItemText.trim() || saving ? 0.5 : 1,
              transition: 'all 0.2s'
            }}
          >
            {saving ? '...' : '+ إضافة'}
          </button>
        </div>
      )}

      {saving && (
        <div style={{ 
          marginTop: '8px', 
          textAlign: 'center', 
          fontSize: '12px', 
          color: '#94a3b8' 
        }}>
          جاري الحفظ...
        </div>
      )}
    </div>
  );
}
