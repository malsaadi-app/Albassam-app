import { useState, useEffect } from 'react';
import Select from 'react-select';

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
}

interface QuotedItem {
  itemName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  notes?: string;
}

interface AddQuotationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseRequestId: string;
  requestItems?: any[];
}

export default function AddQuotationModal({
  isOpen,
  onClose,
  onSuccess,
  purchaseRequestId,
  requestItems = []
}: AddQuotationModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [items, setItems] = useState<QuotedItem[]>([]);
  const [paymentTerms, setPaymentTerms] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
      // Initialize items from request
      if (requestItems.length > 0) {
        const initialItems = requestItems.map((item: any) => ({
          itemName: item.name,
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: 0,
          totalPrice: 0,
          notes: ''
        }));
        setItems(initialItems);
      } else {
        setItems([{
          itemName: '',
          quantity: 1,
          unit: 'قطعة',
          unitPrice: 0,
          totalPrice: 0,
          notes: ''
        }]);
      }
    }
  }, [isOpen, requestItems]);

  const fetchSuppliers = async () => {
    try {
      const res = await fetch('/api/procurement/suppliers?isActive=true');
      if (res.ok) {
        const data = await res.json();
        setSuppliers(data.suppliers);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const addItem = () => {
    setItems([...items, {
      itemName: '',
      quantity: 1,
      unit: 'قطعة',
      unitPrice: 0,
      totalPrice: 0,
      notes: ''
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof QuotedItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate total
    if (field === 'quantity' || field === 'unitPrice') {
      updated[index].totalPrice = updated[index].quantity * updated[index].unitPrice;
    }
    
    setItems(updated);
  };

  const getTotalAmount = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  const handleSubmit = async () => {
    // Validation
    if (!selectedSupplierId) {
      alert('❌ يرجى اختيار المورد');
      return;
    }

    if (items.length === 0 || items.some(i => !i.itemName || i.unitPrice <= 0)) {
      alert('❌ يرجى إضافة الأصناف والأسعار');
      return;
    }

    try {
      setSaving(true);

      const res = await fetch('/api/procurement/quotations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          purchaseRequestId,
          supplierId: selectedSupplierId,
          quotedItems: items,
          totalAmount: getTotalAmount(),
          paymentTerms: paymentTerms || null,
          deliveryTime: deliveryTime || null,
          validUntil: validUntil || null,
          notes: notes || null
        })
      });

      if (res.ok) {
        alert('✅ تم إضافة عرض السعر بنجاح');
        onSuccess();
        onClose();
        // Reset
        setSelectedSupplierId('');
        setItems([]);
        setPaymentTerms('');
        setDeliveryTime('');
        setValidUntil('');
        setNotes('');
      } else {
        const error = await res.json();
        alert(`❌ ${error.error || 'حدث خطأ'}`);
      }
    } catch (error) {
      console.error('Error creating quotation:', error);
      alert('❌ حدث خطأ أثناء إضافة عرض السعر');
    } finally {
      setSaving(false);
    }
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
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderRadius: '16px',
        padding: '24px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h3 style={{ 
          color: 'white', 
          fontSize: '24px', 
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '28px' }}>💰</span>
          إضافة عرض سعر
        </h3>

        {/* Supplier Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            المورد *
          </label>
          <Select
            value={suppliers.find(s => s.id === selectedSupplierId) ? {
              value: selectedSupplierId,
              label: suppliers.find(s => s.id === selectedSupplierId)?.name || ''
            } : null}
            onChange={(option) => setSelectedSupplierId(option?.value || '')}
            options={suppliers.map(s => ({ value: s.id, label: s.name }))}
            placeholder="اختر المورد..."
            isSearchable
            styles={{
              control: (base) => ({
                ...base,
                background: 'rgba(255, 255, 255, 0.1)',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: '10px',
                padding: '4px',
                color: 'white'
              }),
              singleValue: (base) => ({ ...base, color: 'white' }),
              input: (base) => ({ ...base, color: 'white' }),
              placeholder: (base) => ({ ...base, color: 'rgba(255, 255, 255, 0.6)' }),
              menu: (base) => ({ ...base, background: '#764ba2', borderRadius: '10px' }),
              option: (base, state) => ({
                ...base,
                background: state.isFocused ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
                color: 'white',
                cursor: 'pointer'
              })
            }}
          />
        </div>

        {/* Items */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: '12px'
          }}>
            <label style={{ color: 'white', fontSize: '14px', fontWeight: '600' }}>
              الأصناف والأسعار *
            </label>
            <button
              onClick={addItem}
              style={{
                padding: '8px 16px',
                background: 'rgba(59, 130, 246, 0.9)',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              ➕ إضافة صنف
            </button>
          </div>

          {items.map((item, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '12px',
              position: 'relative'
            }}>
              <button
                onClick={() => removeItem(index)}
                style={{
                  position: 'absolute',
                  top: '12px',
                  left: '12px',
                  padding: '4px 10px',
                  background: 'rgba(239, 68, 68, 0.8)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '12px',
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '2fr 1fr 1fr',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '6px', fontSize: '13px' }}>
                    اسم الصنف
                  </label>
                  <input
                    type="text"
                    value={item.itemName}
                    onChange={(e) => updateItem(index, 'itemName', e.target.value)}
                    placeholder="مثال: ورق A4"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '6px', fontSize: '13px' }}>
                    الكمية
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '6px', fontSize: '13px' }}>
                    الوحدة
                  </label>
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => updateItem(index, 'unit', e.target.value)}
                    placeholder="قطعة"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px'
              }}>
                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '6px', fontSize: '13px' }}>
                    سعر الوحدة (ريال)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '6px', fontSize: '13px' }}>
                    الإجمالي (ريال)
                  </label>
                  <input
                    type="number"
                    value={item.totalPrice.toFixed(2)}
                    readOnly
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'rgba(255, 255, 255, 0.7)',
                      fontSize: '14px',
                      cursor: 'not-allowed'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', color: 'white', marginBottom: '6px', fontSize: '13px' }}>
                    ملاحظات
                  </label>
                  <input
                    type="text"
                    value={item.notes || ''}
                    onChange={(e) => updateItem(index, 'notes', e.target.value)}
                    placeholder="اختياري"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: 'white',
                      fontSize: '14px'
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{
          background: 'rgba(16, 185, 129, 0.2)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center'
        }}>
          <div style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', marginBottom: '6px' }}>
            الإجمالي الكلي
          </div>
          <div style={{ color: 'white', fontSize: '32px', fontWeight: 'bold' }}>
            {getTotalAmount().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ريال
          </div>
        </div>

        {/* Additional Details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div>
            <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              شروط الدفع
            </label>
            <input
              type="text"
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              placeholder="مثال: 50% مقدم و50% عند الاستلام"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              مدة التسليم
            </label>
            <input
              type="text"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              placeholder="مثال: 7-10 أيام"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: 'white',
                fontSize: '14px'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            صالح حتى
          </label>
          <input
            type="date"
            value={validUntil}
            onChange={(e) => setValidUntil(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '14px'
            }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', color: 'white', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            ملاحظات إضافية
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="أي ملاحظات أو تفاصيل إضافية..."
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: 'white',
              fontSize: '14px',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              flex: 1,
              padding: '14px',
              background: saving ? 'rgba(156, 163, 175, 0.5)' : 'rgba(16, 185, 129, 0.9)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? 'جاري الحفظ...' : '✅ حفظ عرض السعر'}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '14px',
              background: 'rgba(239, 68, 68, 0.9)',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '15px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            ❌ إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
