import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/purchase_request_models.dart';
import '../data/purchase_requests_service.dart';
import 'purchase_new_request_screen.dart';
import 'purchase_request_details_screen.dart';

class PurchaseRequestsScreen extends StatefulWidget {
  const PurchaseRequestsScreen({super.key});

  @override
  State<PurchaseRequestsScreen> createState() => _PurchaseRequestsScreenState();
}

class _PurchaseRequestsScreenState extends State<PurchaseRequestsScreen> {
  bool _loading = true;
  List<PurchaseRequest> _items = [];

  String _status = 'ALL';

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final svc = PurchaseRequestsService(api);
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

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.purchaseRequestsTitle),
        actions: [
          IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh), tooltip: l10n.retry),
          IconButton(
            onPressed: () async {
              final created = await Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const PurchaseNewRequestScreen()),
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
              items: <String>['ALL', 'PENDING_REVIEW', 'REVIEWED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']
                  .map((s) => DropdownMenuItem(value: s, child: Text(_statusLabel(s, l10n, isAr))))
                  .toList(),
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
                              title: Text('${r.requestNumber} • ${_categoryLabel(r.category, isAr)}'),
                              subtitle: Text('${r.department} • ${df.format(r.createdAt.toLocal())}'),
                              trailing: _statusChip(r.status, l10n, isAr),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(builder: (_) => PurchaseRequestDetailsScreen(id: r.id)),
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

  String _statusLabel(String s, AppLocalizations l10n, bool isAr) {
    switch (s) {
      case 'ALL':
        return l10n.all;
      case 'PENDING_REVIEW':
        return l10n.statusPendingReview;
      case 'REVIEWED':
        return l10n.statusReviewed;
      case 'APPROVED':
        return l10n.statusApproved;
      case 'REJECTED':
        return l10n.statusRejected;
      case 'IN_PROGRESS':
        return l10n.statusInProgress;
      case 'COMPLETED':
        return l10n.statusCompleted;
      case 'CANCELLED':
        return l10n.statusCancelled;
      default:
        return s;
    }
  }

  String _categoryLabel(String c, bool isAr) {
    const ar = {
      'SUPPLIES': 'مستلزمات',
      'EQUIPMENT': 'معدات',
      'SERVICES': 'خدمات',
      'MAINTENANCE': 'صيانة',
      'OTHER': 'أخرى',
    };
    const en = {
      'SUPPLIES': 'Supplies',
      'EQUIPMENT': 'Equipment',
      'SERVICES': 'Services',
      'MAINTENANCE': 'Maintenance',
      'OTHER': 'Other',
    };
    return (isAr ? ar : en)[c] ?? c;
  }

  Widget _statusChip(String status, AppLocalizations l10n, bool isAr) {
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
