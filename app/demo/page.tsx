'use client';

import { useState } from 'react';
import { FloatingInput, FloatingSelect, FloatingTextarea, Checkbox, Radio, FileUpload } from '@/components/ui/FormEnhanced';
import { CardEnhanced, CardHeader, CardBody, CardFooter, StatsCard, HeaderButton } from '@/components/ui/CardEnhanced';
import { TableEnhanced, Badge, Column } from '@/components/ui/TableEnhanced';
import { ModalEnhanced, ModalHeader, ModalBody, ModalFooter, ModalButton, ConfirmDialog } from '@/components/ui/ModalEnhanced';
import { MobileActionSheet, ActionItem, ActionSheetDivider } from '@/components/ui/MobileActionSheet';
import { ResponsiveContainer, ResponsiveGrid, ResponsiveStack, HideShow } from '@/components/layout/ResponsiveContainer';
import { useIsMobile, useIsTablet, useIsDesktop } from '@/hooks/useMediaQuery';
import { HiOutlineUser, HiOutlineTrash, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';

interface DemoUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export default function DemoPage() {
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');
  const [bio, setBio] = useState('');
  const [agree, setAgree] = useState(false);
  const [plan, setPlan] = useState('');
  const [nameError, setNameError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  // Table data
  const users: DemoUser[] = [
    { id: '1', name: 'أحمد محمد', email: 'ahmed@example.com', role: 'Admin', status: 'active' },
    { id: '2', name: 'فاطمة علي', email: 'fatima@example.com', role: 'User', status: 'active' },
    { id: '3', name: 'محمد سالم', email: 'mohamed@example.com', role: 'Manager', status: 'inactive' },
    { id: '4', name: 'نورة خالد', email: 'noura@example.com', role: 'User', status: 'active' },
  ];

  const columns: Column<DemoUser>[] = [
    { key: 'name', label: 'الاسم', sortable: true },
    { key: 'email', label: 'البريد الإلكتروني', sortable: true },
    { key: 'role', label: 'الدور', sortable: true },
    { 
      key: 'status', 
      label: 'الحالة', 
      render: (row) => (
        <Badge type={row.status === 'active' ? 'success' : 'gray'}>
          {row.status === 'active' ? 'نشط' : 'غير نشط'}
        </Badge>
      )
    },
  ];

  // Responsive hooks
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const isDesktop = useIsDesktop();

  // Form validation
  const handleNameBlur = () => {
    if (name.length > 0 && name.length < 3) {
      setNameError('الاسم يجب أن يكون 3 أحرف على الأقل');
    } else {
      setNameError('');
    }
  };

  const handleEmailBlur = () => {
    if (email.includes('@')) {
      setEmailSuccess('البريد الإلكتروني صحيح ✓');
    } else {
      setEmailSuccess('');
    }
  };

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F8FAFC', padding: '20px' }}>
      <ResponsiveContainer size="xl">
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: '800', color: '#1E293B', margin: '0 0 8px 0' }}>
            🎨 Components Demo
          </h1>
          <p style={{ fontSize: '16px', color: '#64748B', margin: 0 }}>
            تجربة جميع المكونات المحسّنة
          </p>
          
          {/* Device Info */}
          <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Badge type={isMobile ? 'info' : 'gray'}>
              📱 Mobile: {isMobile ? 'Yes' : 'No'}
            </Badge>
            <Badge type={isTablet ? 'info' : 'gray'}>
              📟 Tablet: {isTablet ? 'Yes' : 'No'}
            </Badge>
            <Badge type={isDesktop ? 'info' : 'gray'}>
              💻 Desktop: {isDesktop ? 'Yes' : 'No'}
            </Badge>
          </div>
        </div>

        {/* Forms Section */}
        <CardEnhanced variant="default" style={{ marginBottom: '24px' }}>
          <CardHeader
            icon={<HiOutlineUser size={24} />}
            title="Form Components"
            subtitle="FloatingInput, FloatingSelect, FloatingTextarea, Checkbox, Radio, FileUpload"
          />
          <CardBody>
            <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }} gap="md">
              <FloatingInput
                label="الاسم الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleNameBlur}
                error={nameError}
                clearable
                onClear={() => setName('')}
              />

              <FloatingInput
                label="البريد الإلكتروني"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={handleEmailBlur}
                success={emailSuccess}
              />

              <FloatingSelect
                label="القسم"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                options={[
                  { value: 'hr', label: 'الموارد البشرية' },
                  { value: 'it', label: 'تقنية المعلومات' },
                  { value: 'finance', label: 'المالية' },
                ]}
              />

              <div>
                <Checkbox
                  label="أوافق على الشروط والأحكام"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />
                <div style={{ marginTop: '12px' }}>
                  <Radio
                    label="الخطة الأساسية"
                    name="plan"
                    value="basic"
                    checked={plan === 'basic'}
                    onChange={(e) => setPlan(e.target.value)}
                  />
                  <Radio
                    label="الخطة المميزة"
                    name="plan"
                    value="premium"
                    checked={plan === 'premium'}
                    onChange={(e) => setPlan(e.target.value)}
                    style={{ marginTop: '8px' }}
                  />
                </div>
              </div>
            </ResponsiveGrid>

            <div style={{ marginTop: '20px' }}>
              <FloatingTextarea
                label="نبذة عنك"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                helper="اكتب نبذة مختصرة عن نفسك"
              />
            </div>

            <div style={{ marginTop: '20px' }}>
              <FileUpload
                label="اختر ملف"
                accept="image/*,.pdf"
                multiple
                maxSize={5}
              />
            </div>
          </CardBody>
        </CardEnhanced>

        {/* Cards Section */}
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', margin: '32px 0 16px' }}>
          Card Components
        </h2>
        
        <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 4 }} gap="md" style={{ marginBottom: '24px' }}>
          <StatsCard
            icon={<HiOutlineUser size={28} />}
            label="إجمالي المستخدمين"
            value="1,234"
            change={{ value: '+12%', isPositive: true }}
            variant="gradient"
            hoverable
          />
          
          <StatsCard
            icon={<HiOutlineCheck size={28} />}
            label="المهام المكتملة"
            value="856"
            change={{ value: '+8%', isPositive: true }}
            variant="success"
            hoverable
          />
          
          <StatsCard
            icon={<HiOutlineX size={28} />}
            label="المهام المعلقة"
            value="42"
            change={{ value: '-3%', isPositive: false }}
            variant="warning"
            hoverable
          />
          
          <StatsCard
            icon={<HiOutlineTrash size={28} />}
            label="المحذوفات"
            value="18"
            variant="danger"
            hoverable
          />
        </ResponsiveGrid>

        <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 2 }} gap="md" style={{ marginBottom: '24px' }}>
          <CardEnhanced variant="outlined" hoverable>
            <CardHeader
              title="Outlined Card"
              subtitle="Blue border variant"
              actions={<HeaderButton>عرض</HeaderButton>}
            />
            <CardBody>
              <p style={{ margin: 0, color: '#64748B' }}>
                هذا مثال على الكارد بنمط Outlined مع حدود زرقاء
              </p>
            </CardBody>
            <CardFooter>
              <span style={{ fontSize: '14px', color: '#64748B' }}>آخر تحديث: اليوم</span>
              <button style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #3B82F6', background: '#3B82F6', color: '#FFF', cursor: 'pointer' }}>
                حفظ
              </button>
            </CardFooter>
          </CardEnhanced>

          <CardEnhanced variant="elevated" hoverable>
            <CardHeader
              title="Elevated Card"
              subtitle="With shadow effect"
            />
            <CardBody>
              <p style={{ margin: 0, color: '#64748B' }}>
                هذا مثال على الكارد بنمط Elevated مع ظل خفيف
              </p>
            </CardBody>
          </CardEnhanced>
        </ResponsiveGrid>

        {/* Table Section */}
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', margin: '32px 0 16px' }}>
          Table Component
        </h2>
        
        <TableEnhanced
          data={users}
          columns={columns}
          selectable
          onRowSelect={(ids) => console.log('Selected:', ids)}
          searchable
          exportable
          pageSize={10}
          bulkActions={
            <>
              <button style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #DC2626', background: '#DC2626', color: '#FFF', cursor: 'pointer' }}>
                <HiOutlineTrash size={16} style={{ display: 'inline', marginLeft: '4px' }} />
                حذف
              </button>
            </>
          }
        />

        {/* Modals & Sheets Section */}
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', margin: '32px 0 16px' }}>
          Modals & Action Sheets
        </h2>
        
        <ResponsiveStack direction="responsive" gap="md" style={{ marginBottom: '32px' }}>
          <button
            onClick={() => setIsModalOpen(true)}
            style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #3B82F6', background: '#3B82F6', color: '#FFF', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
          >
            فتح Modal
          </button>
          
          <button
            onClick={() => setIsConfirmOpen(true)}
            style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #DC2626', background: '#DC2626', color: '#FFF', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
          >
            Confirm Dialog
          </button>
          
          <button
            onClick={() => setIsActionSheetOpen(true)}
            style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #10B981', background: '#10B981', color: '#FFF', fontSize: '16px', fontWeight: '600', cursor: 'pointer' }}
          >
            Action Sheet
          </button>
        </ResponsiveStack>

        {/* Hide/Show Section */}
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1E293B', margin: '32px 0 16px' }}>
          Responsive Hide/Show
        </h2>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <HideShow hideOn="mobile">
            <Badge type="warning">مخفي على Mobile</Badge>
          </HideShow>
          
          <HideShow showOn="mobile">
            <Badge type="success">ظاهر على Mobile فقط</Badge>
          </HideShow>
          
          <HideShow hideOn="desktop">
            <Badge type="info">مخفي على Desktop</Badge>
          </HideShow>
        </div>
      </ResponsiveContainer>

      {/* Modal */}
      <ModalEnhanced isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} size="md">
        <ModalHeader
          icon={<HiOutlineUser size={32} />}
          title="مثال على Modal"
          subtitle="يمكنك إغلاقه بالضغط على ESC أو خارج النافذة"
        />
        <ModalBody>
          <p style={{ fontSize: '16px', color: '#64748B', lineHeight: '1.6' }}>
            هذا مثال على Modal Component مع:
          </p>
          <ul style={{ color: '#64748B', lineHeight: '1.8' }}>
            <li>Portal-based rendering</li>
            <li>ESC key support</li>
            <li>Click outside to close</li>
            <li>Body scroll lock</li>
            <li>Smooth animations</li>
          </ul>
        </ModalBody>
        <ModalFooter>
          <ModalButton onClick={() => setIsModalOpen(false)}>
            إلغاء
          </ModalButton>
          <ModalButton variant="primary" onClick={() => setIsModalOpen(false)}>
            حفظ
          </ModalButton>
        </ModalFooter>
      </ModalEnhanced>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => alert('تم التأكيد!')}
        title="تأكيد الحذف"
        message="هل أنت متأكد من حذف هذا العنصر؟ لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف"
        cancelText="إلغاء"
        variant="danger"
      />

      {/* Action Sheet */}
      <MobileActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        title="الإجراءات"
        subtitle="اختر إجراء من القائمة"
      >
        <ActionItem
          icon={<HiOutlineUser size={20} />}
          title="عرض الملف الشخصي"
          description="شاهد معلومات الملف الشخصي"
          onClick={() => {
            alert('عرض الملف الشخصي');
            setIsActionSheetOpen(false);
          }}
        />
        
        <ActionSheetDivider />
        
        <ActionItem
          icon={<HiOutlineTrash size={20} />}
          title="حذف"
          description="حذف العنصر نهائياً"
          onClick={() => {
            alert('حذف!');
            setIsActionSheetOpen(false);
          }}
          danger
        />
      </MobileActionSheet>
    </div>
  );
}
