'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Input } from '@/components/ui/Input';

export default function AttendanceSettingsPage() {
  const [settings, setSettings] = useState({
    workStartTime: '08:00',
    workEndTime: '17:00',
    lateThresholdMinutes: 15,
    overtimeStartMinutes: 60
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/hr/attendance/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/hr/attendance/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (res.ok) {
        alert('تم حفظ الإعدادات');
      } else {
        alert('حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <PageHeader
          title="⚙️ إعدادات الحضور"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'الحضور', 'الإعدادات']}
        />

        <Card variant="default">
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
            أوقات الدوام
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '24px' }}>
            <Input
              label="بداية الدوام"
              type="time"
              value={settings.workStartTime}
              onChange={(e) => setSettings({ ...settings, workStartTime: e.target.value })}
            />
            <Input
              label="نهاية الدوام"
              type="time"
              value={settings.workEndTime}
              onChange={(e) => setSettings({ ...settings, workEndTime: e.target.value })}
            />
            <Input
              label="حد التأخير (دقيقة)"
              type="number"
              value={settings.lateThresholdMinutes}
              onChange={(e) => setSettings({ ...settings, lateThresholdMinutes: parseInt(e.target.value) })}
            />
            <Input
              label="بداية العمل الإضافي (دقيقة)"
              type="number"
              value={settings.overtimeStartMinutes}
              onChange={(e) => setSettings({ ...settings, overtimeStartMinutes: parseInt(e.target.value) })}
            />
          </div>

          <Button variant="success" loading={saving} onClick={handleSave}>
            💾 حفظ الإعدادات
          </Button>
        </Card>
      </div>
    </div>
  );
}
