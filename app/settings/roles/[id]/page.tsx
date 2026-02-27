import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getSession } from '@/lib/session';
import { prisma } from '@/lib/db';
import Link from 'next/link';
import RolePermissionsManager from './RolePermissionsManager';
import RoleEditButtons from './RoleEditButtons';

export default async function RoleDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await getSession(await cookies());
  
  if (!session?.user) {
    redirect('/');
  }

  // Fetch role with permissions
  const role = await prisma.systemRole.findUnique({
    where: { id: params.id },
    include: {
      permissions: {
        include: {
          permission: true
        }
      },
      users: {
        select: {
          id: true,
          username: true,
          displayName: true
        }
      }
    }
  });

  if (!role) {
    redirect('/settings/roles');
  }

  // Fetch all permissions grouped by module
  const allPermissions = await prisma.permission.findMany({
    orderBy: [{ module: 'asc' }, { name: 'asc' }]
  });

  // Group permissions by module
  const permissionsByModule: { [key: string]: typeof allPermissions } = {};
  allPermissions.forEach(perm => {
    if (!permissionsByModule[perm.module]) {
      permissionsByModule[perm.module] = [];
    }
    permissionsByModule[perm.module].push(perm);
  });

  // Get current role permission IDs
  const rolePermissionIds = new Set(role.permissions.map(rp => rp.permissionId));

  return (
    <>
      <style>{`
        .user-card:hover {
          border-color: #667eea !important;
          background: #edf2f7 !important;
        }
      `}</style>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem', direction: 'rtl' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1a202c' }}>
                  {role.nameAr}
                </h1>
                {role.isSystem && (
                  <span style={{
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}>
                    🔒 دور نظام
                  </span>
                )}
                {!role.isActive && (
                  <span style={{
                    background: '#e2e8f0',
                    color: '#64748b',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '1rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold'
                  }}>
                    ⚫ معطل
                  </span>
                )}
              </div>
              <p style={{ color: '#718096', marginBottom: '0.5rem' }}>{role.nameEn}</p>
              {role.description && (
                <p style={{ color: '#a0aec0', fontSize: '0.9rem' }}>{role.description}</p>
              )}
            </div>
            
            <RoleEditButtons 
              roleId={role.id}
              roleName={role.name}
              roleNameAr={role.nameAr}
              roleNameEn={role.nameEn || ''}
              description={role.description || ''}
              isActive={role.isActive}
              isSystem={role.isSystem}
              userCount={role.users.length}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '2rem', fontSize: '0.9rem', color: '#718096', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
            <span>🔑 الصلاحيات: <strong style={{ color: '#667eea' }}>{role.permissions.length}</strong></span>
            <span>👥 المستخدمون: <strong style={{ color: '#667eea' }}>{role.users.length}</strong></span>
          </div>
        </div>

        {/* Permissions Manager */}
        <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '1.5rem' }}>
            🔑 إدارة الصلاحيات
          </h2>
          
          <RolePermissionsManager
            roleId={role.id}
            roleName={role.name}
            permissionsByModule={permissionsByModule}
            currentPermissionIds={Array.from(rolePermissionIds)}
          />
        </div>

        {/* Users with this role */}
        {role.users.length > 0 && (
          <div style={{ background: 'rgba(255, 255, 255, 0.95)', borderRadius: '1rem', padding: '2rem', marginBottom: '2rem', boxShadow: '0 8px 32px rgba(0,0,0,0.1)' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1a202c', marginBottom: '1.5rem' }}>
              👥 المستخدمون ({role.users.length})
            </h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
              {role.users.map(user => (
                <Link
                  key={user.id}
                  href={`/settings/users/${user.id}`}
                  className="user-card"
                  style={{
                    background: '#f7fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    display: 'block'
                  }}
                >
                  <div style={{ fontWeight: 'bold', color: '#1a202c', marginBottom: '0.25rem' }}>
                    {user.displayName}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#718096' }}>
                    @{user.username}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back Button */}
        <div style={{ textAlign: 'center' }}>
          <Link 
            href="/settings/roles"
            style={{
              color: 'white',
              textDecoration: 'none',
              fontSize: '1rem',
              opacity: 0.9
            }}
          >
            ← العودة لقائمة الأدوار
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
