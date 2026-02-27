'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';

export default function EmployeeFilesPage() {
  const router = useRouter();
  const params = useParams();
  const [employee, setEmployee] = useState<any>(null);
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const [uploadData, setUploadData] = useState({
    documentType: '',
    expiryDate: '',
    file: null as File | null
  });

  useEffect(() => {
    if (params.id) {
      fetchEmployee();
      fetchFiles();
    }
  }, [params.id]);

  const fetchEmployee = async () => {
    try {
      const res = await fetch(`/api/hr/employees/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setEmployee(data);
      }
    } catch (error) {
      console.error('Error fetching employee:', error);
    }
  };

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/hr/employees/${params.id}/files`);
      if (res.ok) {
        const data = await res.json();
        setFiles(data.files || []);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadData({ ...uploadData, file: e.target.files[0] });
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadData.file || !uploadData.documentType) {
      alert('يرجى تعبئة الحقول المطلوبة');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadData.file);
      formData.append('documentType', uploadData.documentType);
      if (uploadData.expiryDate) {
        formData.append('expiryDate', uploadData.expiryDate);
      }

      const res = await fetch(`/api/hr/employees/${params.id}/files`, {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        alert('تم رفع الملف بنجاح');
        setUploadData({ documentType: '', expiryDate: '', file: null });
        fetchFiles();
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('حدث خطأ أثناء الرفع');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (!confirm('هل تريد حذف هذا الملف؟')) return;

    try {
      const res = await fetch(`/api/hr/employees/${params.id}/files/${fileId}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('تم حذف الملف');
        fetchFiles();
      } else {
        alert('حدث خطأ');
      }
    } catch (error) {
      alert('حدث خطأ');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F9FAFB' }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '4px solid #E5E7EB',
          borderTop: '4px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F9FAFB', padding: '24px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <PageHeader
          title={`📂 ملفات ${employee?.displayName || 'الموظف'}`}
          breadcrumbs={['الرئيسية', 'شؤون الموظفين', 'الموظفين', employee?.displayName || '', 'الملفات']}
          actions={
            <Button variant="outline" onClick={() => router.push(`/hr/employees/${params.id}`)}>
              ← رجوع
            </Button>
          }
        />

        {/* Upload Form */}
        <Card variant="default" style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
            📤 رفع ملف جديد
          </h3>

          <form onSubmit={handleUpload}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              <Select
                label="نوع الوثيقة *"
                value={uploadData.documentType}
                onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })}
                required
              >
                <option value="">اختر...</option>
                <option value="ID">بطاقة هوية</option>
                <option value="PASSPORT">جواز سفر</option>
                <option value="CONTRACT">عقد عمل</option>
                <option value="CERTIFICATE">شهادة</option>
                <option value="LICENSE">رخصة</option>
                <option value="OTHER">أخرى</option>
              </Select>

              <Input
                label="تاريخ الانتهاء"
                type="date"
                value={uploadData.expiryDate}
                onChange={(e) => setUploadData({ ...uploadData, expiryDate: e.target.value })}
              />

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                  الملف *
                </label>
                <input
                  type="file"
                  onChange={handleFileChange}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            <Button type="submit" variant="success" loading={uploading}>
              📤 رفع الملف
            </Button>
          </form>
        </Card>

        {/* Files List */}
        <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#111827', marginBottom: '20px' }}>
          الملفات المرفوعة ({files.length})
        </h3>

        {files.length === 0 ? (
          <Card variant="default">
            <div style={{ padding: '60px 40px', textAlign: 'center' }}>
              <div style={{ fontSize: '80px', marginBottom: '24px' }}>📂</div>
              <h3 style={{ fontSize: '24px', color: '#111827', fontWeight: '800', marginBottom: '12px' }}>
                لا توجد ملفات
              </h3>
              <p style={{ fontSize: '16px', color: '#6B7280' }}>
                ابدأ برفع الوثائق المطلوبة
              </p>
            </div>
          </Card>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {files.map((file) => (
              <Card key={file.id} variant="default" hover>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                    <h4 style={{ fontSize: '16px', fontWeight: '800', color: '#111827' }}>
                      {file.documentType}
                    </h4>
                    {file.expiryDate && (
                      <Badge variant={new Date(file.expiryDate) < new Date() ? 'red' : 'yellow'}>
                        {new Date(file.expiryDate) < new Date() ? 'منتهي' : 'ينتهي قريباً'}
                      </Badge>
                    )}
                  </div>
                  
                  <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '4px' }}>
                    📄 {file.fileName}
                  </p>
                  
                  {file.expiryDate && (
                    <p style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>
                      📅 ينتهي: {new Date(file.expiryDate).toLocaleDateString('ar-SA')}
                    </p>
                  )}
                  
                  <p style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '600', marginTop: '8px' }}>
                    تم الرفع: {new Date(file.uploadedAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => window.open(file.filePath, '_blank')}
                    style={{ flex: 1 }}
                  >
                    👁️ عرض
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleDelete(file.id)}
                  >
                    🗑️
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
