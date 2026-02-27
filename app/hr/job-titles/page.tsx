'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader } from '@/components/ui/PageHeader';

interface JobTitle {
  id: string;
  nameAr: string;
  nameEn: string | null;
  description: string | null;
  isActive: boolean;
  sortOrder: number;
}

export default function JobTitlesPage() {
  const router = useRouter();
  const [jobTitles, setJobTitles] = useState<JobTitle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    nameAr: '',
    nameEn: '',
    description: '',
    isActive: true
  });

  useEffect(() => {
    fetchJobTitles();
  }, []);

  const fetchJobTitles = async () => {
    try {
      const res = await fetch('/api/hr/master-data/job-titles');
      if (res.ok) {
        const data = await res.json();
        setJobTitles(data.jobTitles || []);
      }
    } catch (error) {
      console.error('Error fetching job titles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.nameAr.trim()) {
      alert('اسم المسمى الوظيفي مطلوب');
      return;
    }

    try {
      const res = await fetch('/api/hr/master-data/job-titles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        alert('تم إضافة المسمى الوظيفي بنجاح');
        setShowAddModal(false);
        setFormData({ nameAr: '', nameEn: '', description: '', isActive: true });
        fetchJobTitles();
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error adding job title:', error);
      alert('حدث خطأ أثناء الإضافة');
    }
  };

  const handleDelete = async (id: string, nameAr: string) => {
    if (!confirm(`هل تريد حذف المسمى الوظيفي "${nameAr}"؟`)) return;

    try {
      const res = await fetch(`/api/hr/master-data/job-titles/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('تم حذف المسمى الوظيفي بنجاح');
        fetchJobTitles();
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error deleting job title:', error);
      alert('حدث خطأ أثناء الحذف');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <PageHeader
            title="💼 المسميات الوظيفية"
            breadcrumbs={['الرئيسية', 'الموارد البشرية', 'المسميات']}
          />
          <div style={{ textAlign: 'center', padding: '60px', background: 'white', borderRadius: '12px' }}>
            <div style={{ fontSize: '24px' }}>⏳</div>
            <div style={{ marginTop: '12px', color: '#6B7280' }}>جاري التحميل...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader
          title="💼 المسميات الوظيفية"
          breadcrumbs={['الرئيسية', 'الموارد البشرية', 'المسميات']}
        />

        {/* إحصائيات */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', padding: '24px', color: 'white' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>إجمالي المسميات</div>
            <div style={{ fontSize: '36px', fontWeight: '800' }}>{jobTitles.length}</div>
          </div>
          <div style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '12px', padding: '24px', color: 'white' }}>
            <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '8px' }}>المسميات النشطة</div>
            <div style={{ fontSize: '36px', fontWeight: '800' }}>
              {jobTitles.filter(j => j.isActive).length}
            </div>
          </div>
        </div>

        {/* زر إضافة */}
        <div style={{ marginBottom: '24px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              padding: '12px 24px',
              background: '#10B981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            + إضافة مسمى وظيفي جديد
          </button>
        </div>

        {/* قائمة المسميات */}
        <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid #E5E7EB' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>
              قائمة المسميات الوظيفية
            </h2>
          </div>
          <div style={{ padding: '20px' }}>
            {jobTitles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>📋</div>
                <div>لا توجد مسميات وظيفية</div>
                <button
                  onClick={() => setShowAddModal(true)}
                  style={{
                    marginTop: '16px',
                    padding: '10px 20px',
                    background: '#3B82F6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  إضافة أول مسمى وظيفي
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '12px' }}>
                {jobTitles.map((job) => (
                  <div
                    key={job.id}
                    style={{
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      padding: '16px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: job.isActive ? 'white' : '#F3F4F6'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#111827', margin: 0 }}>
                          {job.nameAr}
                        </h3>
                        {job.nameEn && (
                          <span style={{ fontSize: '14px', color: '#6B7280' }}>
                            ({job.nameEn})
                          </span>
                        )}
                        <div style={{
                          background: job.isActive ? '#D1FAE5' : '#FEE2E2',
                          color: job.isActive ? '#065F46' : '#991B1B',
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: '600'
                        }}>
                          {job.isActive ? '✓ نشط' : '✗ غير نشط'}
                        </div>
                      </div>
                      {job.description && (
                        <div style={{ fontSize: '14px', color: '#6B7280' }}>
                          {job.description}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => router.push(`/hr/job-titles/${job.id}/edit`)}
                        style={{
                          padding: '8px 16px',
                          background: '#3B82F6',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        ✏️ تعديل
                      </button>
                      <button
                        onClick={() => handleDelete(job.id, job.nameAr)}
                        style={{
                          padding: '8px 16px',
                          background: '#EF4444',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '600',
                          cursor: 'pointer'
                        }}
                      >
                        🗑️ حذف
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '16px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '24px',
            maxWidth: '500px',
            width: '100%'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#111827', marginBottom: '20px' }}>
              إضافة مسمى وظيفي جديد
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  اسم المسمى بالعربي *
                </label>
                <input
                  type="text"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="مثال: مدير عام"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  اسم المسمى بالإنجليزي
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                  placeholder="e.g., General Manager"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  الوصف
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    border: '1px solid #D1D5DB',
                    borderRadius: '8px',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="وصف مختصر للمسمى الوظيفي"
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: '18px', height: '18px' }}
                />
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  المسمى نشط
                </label>
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({ nameAr: '', nameEn: '', description: '', isActive: true });
                }}
                style={{
                  padding: '10px 20px',
                  background: '#6B7280',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                إلغاء
              </button>
              <button
                onClick={handleAdd}
                style={{
                  padding: '10px 20px',
                  background: '#10B981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
