'use client';

import { useEffect, useState } from 'react';

export default function DebugBranchesPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [data, setData] = useState<any>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString('ar-SA')}] ${msg}`]);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      addLog('🔄 بدء جلب البيانات...');
      
      const res = await fetch('/api/branches');
      addLog(`📡 Response Status: ${res.status} ${res.statusText}`);
      
      if (res.ok) {
        const responseData = await res.json();
        addLog(`✅ تم استلام البيانات`);
        addLog(`📊 نوع البيانات: ${Array.isArray(responseData) ? 'Array' : typeof responseData}`);
        
        if (Array.isArray(responseData)) {
          addLog(`📈 عدد الفروع: ${responseData.length}`);
          setData(responseData);
        } else if (responseData.branches) {
          addLog(`📈 عدد الفروع: ${responseData.branches.length}`);
          setData(responseData.branches);
        } else if (responseData.error) {
          addLog(`❌ خطأ من الـ API: ${responseData.error}`);
          setData({ error: responseData.error });
        } else {
          addLog(`⚠️ بيانات غير متوقعة`);
          setData(responseData);
        }
      } else {
        const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
        addLog(`❌ فشل الطلب: ${JSON.stringify(errorData)}`);
        setData({ error: errorData });
      }
    } catch (error: any) {
      addLog(`💥 خطأ في الاتصال: ${error.message}`);
      setData({ error: error.message });
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#1a1a1a', 
      color: '#00ff00', 
      fontFamily: 'monospace',
      padding: '20px' 
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <h1 style={{ 
          fontSize: '24px', 
          marginBottom: '20px',
          color: '#00ff00',
          textAlign: 'center'
        }}>
          🔍 صفحة تشخيص الفروع
        </h1>

        {/* Logs Section */}
        <div style={{
          background: '#000',
          border: '2px solid #00ff00',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '20px'
        }}>
          <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#ffff00' }}>
            📝 سجل العمليات:
          </h2>
          <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
            {logs.map((log, i) => (
              <div key={i} style={{ marginBottom: '4px' }}>
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div style={{ color: '#888' }}>جاري التحميل...</div>
            )}
          </div>
        </div>

        {/* Data Section */}
        {data && (
          <div style={{
            background: '#000',
            border: '2px solid #00ff00',
            borderRadius: '8px',
            padding: '20px'
          }}>
            <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#ffff00' }}>
              📦 البيانات المستلمة:
            </h2>
            
            {Array.isArray(data) ? (
              <div>
                <p style={{ marginBottom: '10px', color: '#00ff00' }}>
                  ✅ نوع البيانات: Array (صحيح)
                </p>
                <p style={{ marginBottom: '10px', color: '#00ff00' }}>
                  📊 عدد الفروع: <strong>{data.length}</strong>
                </p>
                
                {data.length > 0 ? (
                  <div style={{ marginTop: '20px' }}>
                    <h3 style={{ fontSize: '16px', marginBottom: '10px', color: '#00ffff' }}>
                      قائمة الفروع:
                    </h3>
                    {data.map((branch: any, i: number) => (
                      <div 
                        key={i} 
                        style={{
                          background: '#111',
                          padding: '10px',
                          marginBottom: '8px',
                          borderRadius: '4px',
                          border: '1px solid #333'
                        }}
                      >
                        <div style={{ color: '#00ffff' }}>
                          {i + 1}. {branch.name}
                        </div>
                        <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>
                          النوع: {branch.type} | المراحل: {branch._count?.stages || 0} | الموظفين: {branch._count?.employees || 0}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: '#ff0000', marginTop: '10px' }}>
                    ⚠️ الـ Array فاضي (0 فروع)
                  </p>
                )}
              </div>
            ) : data.error ? (
              <div style={{ color: '#ff0000' }}>
                ❌ خطأ: {JSON.stringify(data.error)}
              </div>
            ) : (
              <pre style={{ 
                color: '#ffff00', 
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '400px'
              }}>
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Refresh Button */}
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <button
            onClick={() => {
              setLogs([]);
              setData(null);
              fetchBranches();
            }}
            style={{
              padding: '12px 24px',
              background: '#00ff00',
              color: '#000',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            🔄 إعادة المحاولة
          </button>
        </div>
      </div>
    </div>
  );
}
