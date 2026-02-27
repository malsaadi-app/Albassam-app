'use client';

import { useState, type ChangeEvent, type FormEvent, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { COLORS } from '@/lib/colors';

export default function PublicApplyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // قائمة الجنسيات
  const nationalities = [
    'سعودي', 'مصري', 'سوري', 'أردني', 'لبناني', 'فلسطيني', 'عراقي',
    'يمني', 'سوداني', 'جزائري', 'مغربي', 'تونسي', 'ليبي', 'إماراتي',
    'كويتي', 'بحريني', 'عماني', 'قطري', 'باكستاني', 'هندي', 'بنغلاديشي',
    'فلبيني', 'إندونيسي', 'نيبالي', 'سيريلانكي', 'أمريكي', 'بريطاني',
    'كندي', 'أسترالي', 'فرنسي', 'ألماني', 'إيطالي', 'إسباني'
  ];

  const [formData, setFormData] = useState({
    fullNameAr: '',
    fullNameEn: '',
    nationalId: '',
    nationality: 'سعودي',
    dateOfBirth: '',
    gender: 'MALE',
    maritalStatus: 'SINGLE',
    phone: '',
    email: '',
    address: '',
    city: '',
    education: '',
    certifications: '',
    experience: '',
    coverLetter: ''
  });

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/hr/job-applications/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          source: 'PUBLIC_FORM',
          status: 'PENDING'
        })
      });

      if (res.ok) {
        setSuccess(true);
        setFormData({
          fullNameAr: '',
          fullNameEn: '',
          nationalId: '',
          nationality: 'سعودي',
          dateOfBirth: '',
          gender: 'MALE',
          maritalStatus: 'SINGLE',
          phone: '',
          email: '',
          address: '',
          city: '',
          education: '',
          certifications: '',
          experience: '',
          coverLetter: ''
        });
      } else {
        const data = await res.json();
        setError(data.error || 'حدث خطأ');
      }
    } catch {
      setError('حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle: CSSProperties = {
    background: COLORS.white,
    border: `1px solid ${COLORS.gray200}`,
    borderRadius: '12px',
    padding: '12px 14px',
    color: COLORS.gray900,
    fontSize: '15px',
    outline: 'none',
    width: '100%'
  };

  const labelStyle: CSSProperties = {
    color: COLORS.gray900,
    fontSize: '13px',
    fontWeight: 800,
    marginBottom: '8px',
    display: 'block'
  };

  if (success) {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: COLORS.background, padding: '24px 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '600px', textAlign: 'center' }}>
          <div style={{
            background: COLORS.white,
            border: `1px solid ${COLORS.gray200}`,
            borderRadius: '16px',
            padding: '40px 20px'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>✅</div>
            <h1 style={{ color: COLORS.gray900, fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>
              تم إرسال طلبك بنجاح!
            </h1>
            <p style={{ color: COLORS.gray600, fontSize: '16px', lineHeight: '1.6' }}>
              شكراً لتقديمك على الوظيفة في مدارس الباسم. سيتم مراجعة طلبك والتواصل معك قريباً.
            </p>
            <button
              type="button"
              onClick={() => setSuccess(false)}
              style={{
                marginTop: '24px',
                background: COLORS.primary,
                border: `1px solid ${COLORS.primary}`,
                padding: '12px 24px',
                borderRadius: '12px',
                color: COLORS.white,
                fontWeight: 800,
                fontSize: '15px',
                cursor: 'pointer'
              }}
            >
              تقديم طلب آخر
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: COLORS.background, padding: '24px 16px' }}>
      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ color: COLORS.gray900, fontSize: '32px', fontWeight: 800, margin: '0 0 8px' }}>
            📋 نموذج التقديم على وظيفة
          </h1>
          <p style={{ color: COLORS.gray600, fontSize: '16px' }}>
            مدارس الباسم - يرجى تعبئة البيانات التالية بدقة
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.gray200}`,
              borderRadius: '16px',
              padding: '24px'
            }}
          >
            {error && (
              <div
                style={{
                  background: COLORS.dangerLighter,
                  border: `1px solid ${COLORS.dangerLight}`,
                  borderRadius: '12px',
                  padding: '12px 14px',
                  color: COLORS.dangerText,
                  marginBottom: '16px',
                  fontWeight: 700
                }}
              >
                ❌ {error}
              </div>
            )}

            <h2 style={{ color: COLORS.gray900, fontSize: '18px', margin: '0 0 16px', fontWeight: 800 }}>
              📋 البيانات الشخصية
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '14px',
                marginBottom: '24px'
              }}
            >
              <div>
                <label style={labelStyle}>الاسم بالكامل (عربي) *</label>
                <input
                  type="text"
                  name="fullNameAr"
                  value={formData.fullNameAr}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="مثال: محمد أحمد علي"
                />
              </div>
              <div>
                <label style={labelStyle}>الاسم بالإنجليزي</label>
                <input
                  type="text"
                  name="fullNameEn"
                  value={formData.fullNameEn}
                  onChange={handleChange}
                  style={inputStyle}
                  placeholder="Example: Mohammed Ahmed Ali"
                />
              </div>
              <div>
                <label style={labelStyle}>رقم الهوية/الإقامة *</label>
                <input
                  type="text"
                  name="nationalId"
                  value={formData.nationalId}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="10 أرقام"
                />
              </div>
              <div>
                <label style={labelStyle}>الجنسية *</label>
                <input
                  type="text"
                  name="nationality"
                  value={formData.nationality}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  list="nationalities-list"
                  placeholder="اختر أو اكتب..."
                />
                <datalist id="nationalities-list">
                  {nationalities.map((nat) => (
                    <option key={nat} value={nat} />
                  ))}
                </datalist>
              </div>
              <div>
                <label style={labelStyle}>تاريخ الميلاد *</label>
                <input
                  type="date"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>الجنس *</label>
                <select name="gender" value={formData.gender} onChange={handleChange} required style={inputStyle}>
                  <option value="MALE">ذكر</option>
                  <option value="FEMALE">أنثى</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>الحالة الاجتماعية *</label>
                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} required style={inputStyle}>
                  <option value="SINGLE">أعزب</option>
                  <option value="MARRIED">متزوج</option>
                  <option value="DIVORCED">مطلق</option>
                  <option value="WIDOWED">أرمل</option>
                </select>
              </div>
            </div>

            <h2 style={{ color: COLORS.gray900, fontSize: '18px', margin: '24px 0 16px', fontWeight: 800 }}>
              📞 معلومات الاتصال
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '14px',
                marginBottom: '24px'
              }}
            >
              <div>
                <label style={labelStyle}>رقم الجوال *</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="05xxxxxxxx"
                />
              </div>
              <div>
                <label style={labelStyle}>البريد الإلكتروني *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="example@mail.com"
                />
              </div>
              <div>
                <label style={labelStyle}>العنوان *</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="الشارع، الحي"
                />
              </div>
              <div>
                <label style={labelStyle}>المدينة *</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  style={inputStyle}
                  placeholder="مثال: الرياض"
                />
              </div>
            </div>

            <h2 style={{ color: COLORS.gray900, fontSize: '18px', margin: '24px 0 16px', fontWeight: 800 }}>
              🎓 المؤهلات والخبرات
            </h2>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>المؤهل العلمي *</label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                required
                style={inputStyle}
                placeholder="مثال: بكالوريوس إدارة أعمال"
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>الشهادات (إن وجدت)</label>
              <textarea
                name="certifications"
                value={formData.certifications}
                onChange={handleChange}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="مثال: شهادة PMP، ITIL..."
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>الخبرات السابقة</label>
              <textarea
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                rows={4}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="اذكر خبراتك السابقة (الجهة، المدة، المهام)..."
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={labelStyle}>نبذة عنك / خطاب تعريفي</label>
              <textarea
                name="coverLetter"
                value={formData.coverLetter}
                onChange={handleChange}
                rows={5}
                style={{ ...inputStyle, resize: 'vertical' }}
                placeholder="لماذا تريد الانضمام لمدارس الباسم؟"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? COLORS.gray200 : COLORS.success,
                  border: `1px solid ${loading ? COLORS.gray200 : COLORS.success}`,
                  padding: '14px 32px',
                  borderRadius: '12px',
                  color: COLORS.white,
                  fontWeight: 800,
                  fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  minWidth: '200px'
                }}
              >
                {loading ? '⏳ جاري الإرسال...' : '✅ إرسال الطلب'}
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '24px', color: COLORS.gray600, fontSize: '14px' }}>
          © 2026 مدارس الباسم - جميع الحقوق محفوظة
        </div>
      </div>
    </div>
  );
}
