import { usePermissions } from '@/hooks/usePermissions';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';

/**
 * Dynamic Sidebar - يبني القائمة الجانبية تلقائياً حسب الصلاحيات
 * 
 * الاستخدام:
 * <DynamicSidebar />
 * 
 * الميزات:
 * - يعرض فقط الصفحات المسموح بها
 * - يخفي الأقسام إذا كانت كل عناصرها محجوبة
 * - يدعم الأيقونات من lucide-react
 */
export default function DynamicSidebar() {
  const { getAccessibleNavigation } = usePermissions();
  const pathname = usePathname();
  
  const navigation = getAccessibleNavigation;
  
  return (
    <aside className="w-64 bg-white border-l border-gray-200 h-screen overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-6">نظام البسام</h2>
        
        <nav className="space-y-2">
          {navigation.map((item) => (
            <NavItem 
              key={item.id} 
              item={item} 
              pathname={pathname}
            />
          ))}
        </nav>
      </div>
    </aside>
  );
}

/**
 * NavItem Component - عنصر القائمة الفردي
 */
function NavItem({ item, pathname, level = 0 }) {
  const isActive = pathname === item.path;
  const hasChildren = item.children && item.children.length > 0;
  
  // جلب الأيقونة من lucide-react
  const IconComponent = item.icon ? Icons[item.icon] : null;
  
  // Parent item (has children)
  if (hasChildren) {
    return (
      <div className={`${level > 0 ? 'mr-4' : ''}`}>
        <div className="flex items-center gap-2 px-3 py-2 text-gray-700 font-medium">
          {IconComponent && <IconComponent size={20} />}
          <span>{item.label}</span>
        </div>
        
        <div className="space-y-1 mt-1">
          {item.children.map((child) => (
            <NavItem 
              key={child.id} 
              item={child} 
              pathname={pathname}
              level={level + 1}
            />
          ))}
        </div>
      </div>
    );
  }
  
  // Leaf item (no children)
  return (
    <Link
      href={item.path}
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg transition-colors
        ${level > 0 ? 'mr-4' : ''}
        ${isActive 
          ? 'bg-blue-50 text-blue-700 font-medium' 
          : 'text-gray-700 hover:bg-gray-50'
        }
      `}
    >
      {IconComponent && <IconComponent size={20} />}
      <span>{item.label}</span>
    </Link>
  );
}

/**
 * Simplified Sidebar - نسخة مبسطة بدون أيقونات
 */
export function SimpleSidebar() {
  const { getAccessibleNavigation } = usePermissions();
  const pathname = usePathname();
  
  const navigation = getAccessibleNavigation;
  
  return (
    <aside className="w-64 bg-gray-50 border-l border-gray-200 p-4">
      <nav className="space-y-1">
        {navigation.map((item) => (
          <SimpleNavItem 
            key={item.id} 
            item={item} 
            pathname={pathname}
          />
        ))}
      </nav>
    </aside>
  );
}

function SimpleNavItem({ item, pathname, level = 0 }) {
  const isActive = pathname === item.path;
  const hasChildren = item.children && item.children.length > 0;
  
  if (hasChildren) {
    return (
      <div className={`${level > 0 ? 'mr-4' : ''}`}>
        <div className="px-3 py-2 font-medium text-gray-900">
          {item.label}
        </div>
        <div className="space-y-1">
          {item.children.map((child) => (
            <SimpleNavItem 
              key={child.id} 
              item={child} 
              pathname={pathname}
              level={level + 1}
            />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <Link
      href={item.path}
      className={`
        block px-3 py-2 rounded text-sm
        ${level > 0 ? 'mr-4' : ''}
        ${isActive 
          ? 'bg-blue-100 text-blue-700 font-medium' 
          : 'text-gray-700 hover:bg-gray-100'
        }
      `}
    >
      {item.label}
    </Link>
  );
}
