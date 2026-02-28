import 'package:flutter/material.dart';
import '../../../l10n/app_localizations.dart';

import 'purchase_requests_screen.dart';
import 'quotations_screen.dart';
import 'purchase_orders_screen.dart';
import 'goods_receipts_screen.dart';
import 'suppliers_screen.dart';

class ProcurementScreen extends StatelessWidget {
  const ProcurementScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isAr = Localizations.localeOf(context).languageCode == 'ar';

    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 16),
            _buildActionCard(
              context,
              icon: Icons.shopping_cart,
              title: l10n.purchaseRequestsTitle,
              subtitle: isAr ? 'عرض وإنشاء طلبات الشراء' : 'View & create purchase requests',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const PurchaseRequestsScreen()),
                );
              },
            ),
            const SizedBox(height: 12),
            _buildActionCard(
              context,
              icon: Icons.description,
              title: l10n.quotationsTitle,
              subtitle: isAr ? 'عرض وإنشاء عروض الأسعار' : 'View & create quotations',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const QuotationsScreen()),
                );
              },
            ),
            const SizedBox(height: 12),
            _buildActionCard(
              context,
              icon: Icons.receipt_long,
              title: l10n.purchaseOrdersTitle,
              subtitle: isAr ? 'عرض وإنشاء أوامر الشراء' : 'View & create purchase orders',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const PurchaseOrdersScreen()),
                );
              },
            ),
            const SizedBox(height: 12),
            _buildActionCard(
              context,
              icon: Icons.inventory,
              title: l10n.goodsReceiptsTitle,
              subtitle: isAr ? 'استلام البضائع' : 'Goods receipts',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const GoodsReceiptsScreen()),
                );
              },
            ),
            const SizedBox(height: 12),
            _buildActionCard(
              context,
              icon: Icons.store,
              title: l10n.suppliersTitle,
              subtitle: isAr ? 'إدارة الموردين' : 'Manage suppliers',
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const SuppliersScreen()),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1976D2).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: const Color(0xFF1976D2), size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 4),
                    Text(subtitle, style: TextStyle(fontSize: 13, color: Colors.grey[600])),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
