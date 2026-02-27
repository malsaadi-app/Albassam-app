'use client';

import { useState } from 'react';

export type ChecklistItem = {
  text: string;
  completed: boolean;
};

type Props = {
  taskId: string;
  checklist: ChecklistItem[];
  canEdit: boolean;
  onUpdate?: () => void;
};

export default function ChecklistDisplay({ taskId, checklist, canEdit, onUpdate }: Props) {
  const [updating, setUpdating] = useState(false);

  if (!checklist || checklist.length === 0) return null;

  const toggleItem = async (index: number) => {
    if (!canEdit) return;

    const updated = [...checklist];
    updated[index].completed = !updated[index].completed;

    setUpdating(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}/checklist`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklist: updated }),
      });

      if (res.ok && onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Error updating checklist:', error);
    } finally {
      setUpdating(false);
    }
  };

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <div style={{ marginTop: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#2D1B4E' }}>
          ☑️ قائمة المهام
        </span>
        <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
          {completedCount}/{totalCount}
        </span>
      </div>

      {/* Progress Bar */}
      <div style={{
        height: '4px',
        background: 'rgba(45,27,78,0.1)',
        borderRadius: '2px',
        marginBottom: '0.75rem',
        overflow: 'hidden'
      }}>
        <div style={{
          height: '100%',
          width: `${progress}%`,
          background: progress === 100 ? '#10b981' : '#2D1B4E',
          transition: 'width 0.3s ease'
        }} />
      </div>

      {/* Items */}
      <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
        {checklist.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.5rem',
              padding: '0.25rem'
            }}
          >
            <input
              type="checkbox"
              checked={item.completed}
              onChange={() => toggleItem(index)}
              disabled={!canEdit || updating}
              style={{ cursor: canEdit ? 'pointer' : 'not-allowed' }}
            />
            <span
              style={{
                flex: 1,
                fontSize: '0.75rem',
                textDecoration: item.completed ? 'line-through' : 'none',
                color: item.completed ? '#9ca3af' : '#374151'
              }}
            >
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
