import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/purchase_request_models.dart';
import '../data/purchase_requests_service.dart';
import '../data/quotation_models.dart';
import '../data/quotations_service.dart';
import 'quotation_details_screen.dart';
import 'quotation_new_screen.dart';

class PurchaseRequestDetailsScreen extends StatefulWidget {
  final String id;
  const PurchaseRequestDetailsScreen({super.key, required this.id});

  @override
  State<PurchaseRequestDetailsScreen> createState() => _PurchaseRequestDetailsScreenState();
}

class _PurchaseRequestDetailsScreenState extends State<PurchaseRequestDetailsScreen> {
  bool _loading = true;
  PurchaseRequestDetails? _details;
  bool _quotationsLoading = false;
  List<Quotation> _quotations = [];

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final svc = PurchaseRequestsService(api);
      final details = await svc.getById(widget.id);
      if (mounted) setState(() => _details = details);
      await _loadQuotations();
    } catch (_) {
      if (mounted) setState(() => _details = null);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _loadQuotations() async {
    final d = _details;
    if (d == null) return;

    setState(() => _quotationsLoading = true);
    try {
      final api = context.read<ApiService>();
      final svc = QuotationsService(api);
      final list = await svc.list(purchaseRequestId: d.header.id);
      if (mounted) setState(() => _quotations = list);
    } catch (_) {
      if (mounted) setState(() => _quotations = []);
    } finally {
      if (mounted) setState(() => _quotationsLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    final df = DateFormat('yyyy-MM-dd');

    return Scaffold(
      appBar: AppBar(title: Text(isAr ? 'تفاصيل طلب الشراء' : 'Purchase Request Details')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _details == null
              ? Center(child: Text(l10n.error))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _headerCard(_details!.header, df, l10n, isAr),
                    const SizedBox(height: 12),
                    _itemsCard(_details!, l10n, isAr),
                    const SizedBox(height: 12),
                    _quotationsCard(l10n, isAr),
                    if ((_details!.justification ?? '').trim().isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Card(
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(l10n.justification, style: const TextStyle(fontWeight: FontWeight.bold)),
                              const SizedBox(height: 8),
                              Text(_details!.justification!),
                            ],
                          ),
                        ),
                      ),
                    ]
                  ],
                ),
    );
  }

  Widget _headerCard(PurchaseRequest r, DateFormat df, AppLocalizations l10n, bool isAr) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(r.requestNumber, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
            const SizedBox(height: 6),
            Text('${l10n.department}: ${r.department}'),
            Text('${l10n.category}: ${r.category}'),
            const SizedBox(height: 8),
            Text('${l10n.createdAt}: ${df.format(r.createdAt.toLocal())}', style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 10),
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: _statusChip(r.status, l10n),
            )
          ],
        ),
      ),
    );
  }

  Widget _itemsCard(PurchaseRequestDetails d, AppLocalizations l10n, bool isAr) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l10n.items, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            ...d.items.map((it) {
              return Padding(
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
                          Text('${it.quantity} ${it.unit}', style: TextStyle(color: Colors.grey[700])),
                          if ((it.specifications ?? '').trim().isNotEmpty)
                            Text(it.specifications!, style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _quotationsCard(AppLocalizations l10n, bool isAr) {
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
                Text(l10n.quotationsTitle, style: const TextStyle(fontWeight: FontWeight.bold)),
                const Spacer(),
                TextButton.icon(
                  onPressed: _details == null
                      ? null
                      : () async {
                          final created = await Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => QuotationNewScreen(initialPurchaseRequestId: _details!.header.id),
                            ),
                          );
                          if (created == true) await _loadQuotations();
                        },
                  icon: const Icon(Icons.add),
                  label: Text(isAr ? 'عرض جديد' : 'New'),
                ),
              ],
            ),
            const SizedBox(height: 10),
            if (_quotationsLoading)
              const Center(child: Padding(padding: EdgeInsets.all(8), child: CircularProgressIndicator()))
            else if (_quotations.isEmpty)
              Text(isAr ? 'لا توجد عروض أسعار' : 'No quotations', style: TextStyle(color: Colors.grey[600]))
            else
              ..._quotations.map(
                (q) => InkWell(
                  onTap: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => QuotationDetailsScreen(id: q.id)),
                    );
                  },
                  child: Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      children: [
                        const Icon(Icons.description, size: 18, color: Color(0xFF6B7280)),
                        const SizedBox(width: 10),
                        Expanded(child: Text('${q.quotationNumber} • ${q.supplier?.name ?? ''}')),
                        Text(q.totalAmount.toStringAsFixed(2), style: TextStyle(color: Colors.grey[700], fontSize: 12)),
                        const SizedBox(width: 8),
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

  Widget _statusChip(String status, AppLocalizations l10n) {
    String label = status;
    Color bg = const Color(0xFFE5E7EB);
    Color fg = const Color(0xFF374151);

    switch (status) {
      case 'PENDING_REVIEW':
        label = l10n.statusPendingReview;
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
        break;
      case 'REVIEWED':
        label = l10n.statusReviewed;
        bg = const Color(0xFFDBEAFE);
        fg = const Color(0xFF1D4ED8);
        break;
      case 'APPROVED':
        label = l10n.statusApproved;
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF065F46);
        break;
      case 'REJECTED':
        label = l10n.statusRejected;
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFF991B1B);
        break;
      case 'IN_PROGRESS':
        label = l10n.statusInProgress;
        bg = const Color(0xFFEDE9FE);
        fg = const Color(0xFF5B21B6);
        break;
      case 'COMPLETED':
        label = l10n.statusCompleted;
        bg = const Color(0xFFF3F4F6);
        fg = const Color(0xFF111827);
        break;
      case 'CANCELLED':
        label = l10n.statusCancelled;
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
