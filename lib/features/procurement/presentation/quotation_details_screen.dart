import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/quotation_models.dart';
import '../data/quotations_service.dart';
import '../data/purchase_order_models.dart';
import 'purchase_order_new_screen.dart';

class QuotationDetailsScreen extends StatefulWidget {
  final String id;
  const QuotationDetailsScreen({super.key, required this.id});

  @override
  State<QuotationDetailsScreen> createState() => _QuotationDetailsScreenState();
}

class _QuotationDetailsScreenState extends State<QuotationDetailsScreen> {
  bool _loading = true;
  Quotation? _q;

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final svc = QuotationsService(api);
      final q = await svc.getById(widget.id);
      if (mounted) setState(() => _q = q);
    } catch (_) {
      if (mounted) setState(() => _q = null);
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

    return Scaffold(
      appBar: AppBar(
        title: Text(isAr ? 'تفاصيل عرض السعر' : 'Quotation Details'),
        actions: [
          IconButton(
            onPressed: _q == null
                ? null
                : () {
                    final q = _q!;
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => PurchaseOrderNewScreen(
                          initialSupplierId: q.supplierId,
                          initialItems: q.quotedItems
                              .map(
                                (it) => PurchaseOrderItem(
                                  name: it.itemName,
                                  quantity: it.quantity,
                                  unit: 'pcs',
                                  unitPrice: it.unitPrice,
                                  totalPrice: it.totalPrice,
                                ),
                              )
                              .toList(),
                        ),
                      ),
                    );
                  },
            icon: const Icon(Icons.receipt_long),
            tooltip: isAr ? 'إنشاء أمر شراء' : 'Create PO',
          )
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _q == null
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
                            Text(_q!.quotationNumber, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                            const SizedBox(height: 8),
                            Text('${l10n.supplier}: ${_q!.supplier?.name ?? ''}'),
                            const SizedBox(height: 6),
                            Text('${l10n.totalAmount}: ${_q!.totalAmount.toStringAsFixed(2)}'),
                            Text('${l10n.createdAt}: ${df.format(_q!.createdAt.toLocal())}', style: TextStyle(color: Colors.grey[600])),
                            if (_q!.validUntil != null)
                              Text('${l10n.validUntil}: ${df.format(_q!.validUntil!.toLocal())}', style: TextStyle(color: Colors.grey[600])),
                            const SizedBox(height: 10),
                            Align(
                              alignment: AlignmentDirectional.centerStart,
                              child: _statusChip(_q!.status, isAr),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () {
                          final q = _q!;
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => PurchaseOrderNewScreen(
                                initialSupplierId: q.supplierId,
                                initialItems: q.quotedItems
                                    .map(
                                      (it) => PurchaseOrderItem(
                                        name: it.itemName,
                                        quantity: it.quantity,
                                        unit: 'pcs',
                                        unitPrice: it.unitPrice,
                                        totalPrice: it.totalPrice,
                                      ),
                                    )
                                    .toList(),
                              ),
                            ),
                          );
                        },
                        icon: const Icon(Icons.receipt_long),
                        label: Text(isAr ? 'إنشاء أمر شراء' : 'Create Purchase Order'),
                        style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
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
                            if (_q!.quotedItems.isEmpty)
                              Text(l10n.noData, style: TextStyle(color: Colors.grey[600]))
                            else
                              ..._q!.quotedItems.map((it) => Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: Row(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        const Icon(Icons.sell, size: 18, color: Color(0xFF6B7280)),
                                        const SizedBox(width: 10),
                                        Expanded(
                                          child: Column(
                                            crossAxisAlignment: CrossAxisAlignment.stretch,
                                            children: [
                                              Text(it.itemName, style: const TextStyle(fontWeight: FontWeight.w700)),
                                              const SizedBox(height: 2),
                                              Text('${it.quantity} • ${it.unitPrice.toStringAsFixed(2)} = ${it.totalPrice.toStringAsFixed(2)}',
                                                  style: TextStyle(color: Colors.grey[700])),
                                              if ((it.notes ?? '').trim().isNotEmpty)
                                                Text(it.notes!, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
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
                    if ((_q!.paymentTerms ?? '').trim().isNotEmpty) ...[
                      const SizedBox(height: 12),
                      _simpleCard(l10n.paymentTerms, _q!.paymentTerms!),
                    ],
                    if ((_q!.deliveryTime ?? '').trim().isNotEmpty) ...[
                      const SizedBox(height: 12),
                      _simpleCard(l10n.deliveryTime, _q!.deliveryTime!),
                    ],
                    if ((_q!.notes ?? '').trim().isNotEmpty) ...[
                      const SizedBox(height: 12),
                      _simpleCard(l10n.notes, _q!.notes!),
                    ],
                  ],
                ),
    );
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
      case 'ACCEPTED':
        label = isAr ? 'مقبول' : 'Accepted';
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF065F46);
        break;
      case 'REJECTED':
        label = isAr ? 'مرفوض' : 'Rejected';
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFF991B1B);
        break;
      case 'EXPIRED':
        label = isAr ? 'منتهي' : 'Expired';
        bg = const Color(0xFFF3F4F6);
        fg = const Color(0xFF6B7280);
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: TextStyle(color: fg, fontWeight: FontWeight.w600, fontSize: 12)),
    );
  }
}
