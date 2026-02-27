'use client';

import { useState } from 'react';

export type ChecklistItem = {
  text: string;
  completed: boolean;
};

type Props = {
  checklist: ChecklistItem[];
  onChange: (checklist: ChecklistItem[]) => void;
};

export default function ChecklistEditor({ checklist, onChange }: Props) {
  const [newItemText, setNewItemText] = useState('');

  const addItem = () => {
    if (!newItemText.trim()) return;
    onChange([...checklist, { text: newItemText, completed: false }]);
    setNewItemText('');
  };

  const removeItem = (index: number) => {
    onChange(checklist.filter((_, i) => i !== index));
  };

  const toggleItem = (index: number) => {
    const updated = [...checklist];
    updated[index].completed = !updated[index].completed;
    onChange(updated);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        قائمة المهام الفرعية
      </label>

      {/* Items List */}
      {checklist.length > 0 && (
        <div style={{ marginBottom: '0.75rem' }}>
          {checklist.map((item, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.5rem',
                background: 'rgba(45,27,78,0.05)',
                padding: '0.5rem',
                borderRadius: '8px'
              }}
            >
              <input
                type="checkbox"
                checked={item.completed}
                onChange={() => toggleItem(index)}
                style={{ cursor: 'pointer' }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: '0.875rem',
                  textDecoration: item.completed ? 'line-through' : 'none',
                  color: item.completed ? '#9ca3af' : '#374151'
                }}
              >
                {item.text}
              </span>
              <button
                type="button"
                onClick={() => removeItem(index)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '1.25rem',
                  color: '#ef4444',
                  padding: '0'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Item */}
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={newItemText}
          onChange={(e) => setNewItemText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addItem();
            }
          }}
          placeholder="إضافة عنصر جديد..."
          className="form-input"
          style={{ flex: 1, fontSize: '0.875rem' }}
        />
        <button
          type="button"
          onClick={addItem}
          style={{
            background: '#2D1B4E',
            color: 'white',
            padding: '0.5rem 1rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: '600'
          }}
        >
          + إضافة
        </button>
      </div>
    </div>
  );
}
