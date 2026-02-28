import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/purchase_order_models.dart';
import '../data/purchase_orders_service.dart';
import '../data/goods_receipt_models.dart';
import '../data/goods_receipts_service.dart';
import 'goods_receipt_details_screen.dart';
import 'goods_receipt_new_screen.dart';

class PurchaseOrderDetailsScreen extends StatefulWidget {
  final String id;
  const PurchaseOrderDetailsScreen({super.key, required this.id});

  @override
  State<PurchaseOrderDetailsScreen> createState() => _PurchaseOrderDetailsScreenState();
}

class _PurchaseOrderDetailsScreenState extends State<PurchaseOrderDetailsScreen> {
  bool _loading = true;
  PurchaseOrder? _o;
  List<GoodsReceipt> _receipts = [];
  bool _receiptsLoading = false;

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final svc = PurchaseOrdersService(api);
      final o = await svc.getById(widget.id);
      if (mounted) setState(() => _o = o);
      await _loadReceipts();
    } catch (_) {
      if (mounted) setState(() => _o = null);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _loadReceipts() async {
    final o = _o;
    if (o == null) return;

    setState(() => _receiptsLoading = true);
    try {
      final api = context.read<ApiService>();
      final svc = GoodsReceiptsService(api);
      final list = await svc.list(purchaseOrderId: o.id);
      if (mounted) setState(() => _receipts = list);
    } catch (_) {
      if (mounted) setState(() => _receipts = []);
    } finally {
      if (mounted) setState(() => _receiptsLoading = false);
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

    return Scaffold(
      appBar: AppBar(title: Text(isAr ? 'تفاصيل أمر الشراء' : 'Purchase Order Details')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _o == null
              ? Center(child: Text(l10n.error))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(_o!.orderNumber, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                            const SizedBox(height: 8),
                            Text('${l10n.supplier}: ${_o!.supplier?.name ?? ''}'),
                            Text('${l10n.status}: ${_o!.status}'),
                            const SizedBox(height: 6),
                            Text('${l10n.createdAt}: ${df.format(_o!.orderDate.toLocal())}', style: TextStyle(color: Colors.grey[600])),
                            if (_o!.expectedDelivery != null)
                              Text('${l10n.expectedDelivery}: ${df.format(_o!.expectedDelivery!.toLocal())}',
                                  style: TextStyle(color: Colors.grey[600])),
                            const SizedBox(height: 10),
                            Text('${l10n.totalAmount}: ${_o!.totalAmount.toStringAsFixed(2)}'),
                            Text('${l10n.tax}: ${_o!.tax.toStringAsFixed(2)}%'),
                            Text('${l10n.discount}: ${_o!.discount.toStringAsFixed(2)}'),
                            Text('${l10n.finalAmount}: ${_o!.finalAmount.toStringAsFixed(2)}',
                                style: const TextStyle(fontWeight: FontWeight.w800)),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            Text(l10n.items, style: const TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 10),
                            if (_o!.items.isEmpty)
                              Text(l10n.noData, style: TextStyle(color: Colors.grey[600]))
                            else
                              ..._o!.items.map((it) => Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Icon(Icons.inventory_2, size: 18, color: Color(0xFF6B7280)),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.stretch,
                                            children: [
                                              Text(it.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                                              const SizedBox(height: 2),
                                              Text('${it.quantity} ${it.unit} • ${it.unitPrice.toStringAsFixed(2)}',
                                                  style: TextStyle(color: Colors.grey[700])),
                                              Text('${l10n.totalPrice}: ${it.totalPrice.toStringAsFixed(2)}',
                                                  style: TextStyle(color: Colors.grey[700], fontSize: 12)),
                                              if ((it.specifications ?? '').trim().isNotEmpty)
                                                Text(it.specifications!, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                                            ],
                                          ),
                                        ),
                                      ],
                                    ),
                                  )),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _goodsReceiptsCard(l10n, isAr),
                    if ((_o!.paymentTerms ?? '').trim().isNotEmpty) ...[
                      const SizedBox(height: 12),
                      _simpleCard(l10n.paymentTerms, _o!.paymentTerms!),
                    ],
                    if ((_o!.deliveryTerms ?? '').trim().isNotEmpty) ...[
                      const SizedBox(height: 12),
                      _simpleCard(l10n.deliveryTerms, _o!.deliveryTerms!),
                    ],
                    if ((_o!.notes ?? '').trim().isNotEmpty) ...[
                      const SizedBox(height: 12),
                      _simpleCard(l10n.notes, _o!.notes!),
                    ],
                  ],
                ),
    );
  }

  Widget _goodsReceiptsCard(AppLocalizations l10n, bool isAr) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Text(l10n.goodsReceiptsTitle, style: const TextStyle(fontWeight: FontWeight.bold)),
                const Spacer(),
                TextButton.icon(
                  onPressed: () async {
                    final created = await Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => GoodsReceiptNewScreen(initialPurchaseOrderId: _o!.id),
                      ),
                    );
                    if (created == true) {
                      await _loadReceipts();
                      if (_receipts.isNotEmpty && mounted) {
                        Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => GoodsReceiptDetailsScreen(id: _receipts.first.id)),
                        );
                      }
                    }
                  },
                  icon: const Icon(Icons.add),
                  label: Text(isAr ? 'سند جديد' : 'New'),
                )
              ],
            ),
            const SizedBox(height: 10),
            if (_receiptsLoading)
              const Center(child: Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator()))
            else if (_receipts.isEmpty)
              Text(isAr ? 'لا توجد سندات استلام لهذا الأمر' : 'No goods receipts for this order',
                  style: TextStyle(color: Colors.grey[600]))
            else
              ..._receipts.map(
                (r) => InkWell(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => GoodsReceiptDetailsScreen(id: r.id)),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      children: [
                        const Icon(Icons.inventory, size: 18, color: Color(0xFF6B7280)),
                        const SizedBox(width: 10),
                        Expanded(child: Text('${r.receiptNumber} • ${_grStatusLabel(r.status, isAr)}')),
                        const Icon(Icons.chevron_right, color: Colors.grey),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _grStatusLabel(String status, bool isAr) {
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

  Widget _simpleCard(String title, String body) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(body),
          ],
        ),
      ),
    );
  }
}
