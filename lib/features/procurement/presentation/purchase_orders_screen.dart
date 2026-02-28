import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/purchase_order_models.dart';
import '../data/purchase_orders_service.dart';
import 'purchase_order_details_screen.dart';
import 'purchase_order_new_screen.dart';

class PurchaseOrdersScreen extends StatefulWidget {
  const PurchaseOrdersScreen({super.key});

  @override
  State<PurchaseOrdersScreen> createState() => _PurchaseOrdersScreenState();
}

class _PurchaseOrdersScreenState extends State<PurchaseOrdersScreen> {
  bool _loading = true;
  List<PurchaseOrder> _items = [];

  String _status = 'ALL';

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final svc = PurchaseOrdersService(api);
      final list = await svc.list(status: _status);
      if (mounted) setState(() => _items = list);
    } catch (_) {
      if (mounted) setState(() => _items = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    final df = DateFormat('yyyy-MM-dd');

    final statuses = <String, String>{
      'ALL': l10n.all,
      'PENDING': isAr ? 'معلق' : 'Pending',
      'APPROVED': isAr ? 'معتمد' : 'Approved',
      'SENT': isAr ? 'تم الإرسال' : 'Sent',
      'CONFIRMED': isAr ? 'مؤكد' : 'Confirmed',
      'IN_DELIVERY': isAr ? 'قيد التوصيل' : 'In delivery',
      'DELIVERED': isAr ? 'تم التسليم' : 'Delivered',
      'CANCELLED': isAr ? 'ملغي' : 'Cancelled',
      'COMPLETED': isAr ? 'مكتمل' : 'Completed',
    };

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.purchaseOrdersTitle),
        actions: [
          IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh), tooltip: l10n.retry),
          IconButton(
            onPressed: () async {
              final created = await Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const PurchaseOrderNewScreen()),
              );
              if (created == true) await _load();
            },
            icon: const Icon(Icons.add),
            tooltip: l10n.newRequest,
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: DropdownButtonFormField<String>(
              value: _status,
              decoration: InputDecoration(
                labelText: l10n.status,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              items: statuses.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
              onChanged: (v) async {
                setState(() => _status = v ?? 'ALL');
                await _load();
              },
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _items.isEmpty
                    ? Center(child: Text(l10n.noData, style: TextStyle(color: Colors.grey[600])))
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _items.length,
                        itemBuilder: (context, index) {
                          final o = _items[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            child: ListTile(
                              title: Text('${o.orderNumber} • ${o.supplier?.name ?? ''}'),
                              subtitle: Text('${df.format(o.orderDate.toLocal())} • ${o.finalAmount.toStringAsFixed(2)}'),
                              trailing: _statusChip(o.status, isAr),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => PurchaseOrderDetailsScreen(id: o.id)),
                                );
                              },
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _statusChip(String status, bool isAr) {
    String label = status;
    Color bg = const Color(0xFFE5E7EB);
    Color fg = const Color(0xFF374151);

    switch (status) {
      case 'PENDING':
        label = isAr ? 'معلق' : 'Pending';
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
        break;
      case 'APPROVED':
        label = isAr ? 'معتمد' : 'Approved';
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF065F46);
        break;
      case 'CANCELLED':
        label = isAr ? 'ملغي' : 'Cancelled';
        bg = const Color(0xFFF3F4F6);
        fg = const Color(0xFF6B7280);
        break;
      case 'DELIVERED':
        label = isAr ? 'تم التسليم' : 'Delivered';
        bg = const Color(0xFFDBEAFE);
        fg = const Color(0xFF1D4ED8);
        break;
      case 'COMPLETED':
        label = isAr ? 'مكتمل' : 'Completed';
        bg = const Color(0xFFF3F4F6);
        fg = const Color(0xFF111827);
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: TextStyle(color: fg, fontWeight: FontWeight.w600, fontSize: 12)),
    );
  }
}
