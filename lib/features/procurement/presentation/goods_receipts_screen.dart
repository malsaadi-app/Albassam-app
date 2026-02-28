import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/goods_receipt_models.dart';
import '../data/goods_receipts_service.dart';
import 'goods_receipt_details_screen.dart';
import 'goods_receipt_new_screen.dart';

class GoodsReceiptsScreen extends StatefulWidget {
  const GoodsReceiptsScreen({super.key});

  @override
  State<GoodsReceiptsScreen> createState() => _GoodsReceiptsScreenState();
}

class _GoodsReceiptsScreenState extends State<GoodsReceiptsScreen> {
  bool _loading = true;
  List<GoodsReceipt> _items = [];
  String _status = 'ALL';

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final svc = GoodsReceiptsService(api);
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
      'INSPECTED': isAr ? 'تم الفحص' : 'Inspected',
      'ACCEPTED': isAr ? 'مقبول' : 'Accepted',
      'REJECTED': isAr ? 'مرفوض' : 'Rejected',
      'PARTIAL': isAr ? 'جزئي' : 'Partial',
    };

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.goodsReceiptsTitle),
        actions: [
          IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh), tooltip: l10n.retry),
          IconButton(
            onPressed: () async {
              final created = await Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const GoodsReceiptNewScreen()),
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
                          final r = _items[index];
                          return Card(
                            margin: const EdgeInsets.only(bottom: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            child: ListTile(
                              title: Text('${r.receiptNumber} • ${r.purchaseOrder?.orderNumber ?? ''}'),
                              subtitle: Text('${df.format(r.receiptDate.toLocal())} • ${r.receivedBy}'),
                              trailing: _statusChip(r.status, isAr),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => GoodsReceiptDetailsScreen(id: r.id)),
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
    String label = _statusLabel(status, isAr);
    Color bg = const Color(0xFFE5E7EB);
    Color fg = const Color(0xFF374151);

    switch (status) {
      case 'PENDING':
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
        break;
      case 'ACCEPTED':
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF065F46);
        break;
      case 'REJECTED':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFF991B1B);
        break;
      case 'PARTIAL':
        bg = const Color(0xFFDBEAFE);
        fg = const Color(0xFF1D4ED8);
        break;
      case 'INSPECTED':
        bg = const Color(0xFFEDE9FE);
        fg = const Color(0xFF5B21B6);
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: TextStyle(color: fg, fontWeight: FontWeight.w600, fontSize: 12)),
    );
  }

  String _statusLabel(String status, bool isAr) {
    const ar = {
      'PENDING': 'معلق',
      'INSPECTED': 'تم الفحص',
      'ACCEPTED': 'مقبول',
      'REJECTED': 'مرفوض',
      'PARTIAL': 'جزئي',
    };
    const en = {
      'PENDING': 'Pending',
      'INSPECTED': 'Inspected',
      'ACCEPTED': 'Accepted',
      'REJECTED': 'Rejected',
      'PARTIAL': 'Partial',
    };
    return (isAr ? ar : en)[status] ?? status;
  }
}
