import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/hr_request_models.dart';
import '../data/hr_requests_service.dart';
import 'hr_request_details_screen.dart';
import 'hr_new_request_screen.dart';

class HRRequestsScreen extends StatefulWidget {
  const HRRequestsScreen({super.key});

  @override
  State<HRRequestsScreen> createState() => _HRRequestsScreenState();
}

class _HRRequestsScreenState extends State<HRRequestsScreen> {
  bool _loading = true;
  String _status = '';
  List<HRRequest> _items = [];

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final svc = HRRequestsService(api);
      final data = await svc.list(status: _status.isEmpty ? null : _status);
      if (mounted) setState(() => _items = data);
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

    final statusOptions = <String, String>{
      '': l10n.all,
      'PENDING_REVIEW': l10n.pendingReview,
      'APPROVED': l10n.approved,
      'REJECTED': l10n.rejected,
    };

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.hrRequestsTitle),
        actions: [
          IconButton(
            onPressed: () async {
              final created = await Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const HRNewRequestScreen()),
              );
              if (created == true) {
                await _load();
              }
            },
            icon: const Icon(Icons.add),
            tooltip: l10n.newRequest,
          )
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    value: _status,
                    decoration: InputDecoration(
                      labelText: l10n.filterByStatus,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    items: statusOptions.entries
                        .map((e) => DropdownMenuItem(value: e.key, child: Text(e.value)))
                        .toList(),
                    onChanged: (v) async {
                      setState(() => _status = v ?? '');
                      await _load();
                    },
                  ),
                ),
                const SizedBox(width: 10),
                IconButton(
                  onPressed: _loading ? null : _load,
                  icon: const Icon(Icons.refresh),
                  tooltip: l10n.retry,
                )
              ],
            ),
            const SizedBox(height: 12),
            Expanded(
              child: _loading
                  ? const Center(child: CircularProgressIndicator())
                  : _items.isEmpty
                      ? Center(child: Text(l10n.noRequests, style: TextStyle(color: Colors.grey[600])))
                      : ListView.separated(
                          itemCount: _items.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, i) {
                            final r = _items[i];
                            final date = df.format(r.createdAt.toLocal());
                            final title = _typeLabel(r.type, isAr);
                            final status = _statusLabel(r.status, l10n);

                            return Card(
                              elevation: 0,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                              child: ListTile(
                                title: Text(title, style: const TextStyle(fontWeight: FontWeight.w700)),
                                subtitle: Text('${r.employeeName ?? ''} • $date'),
                                trailing: _statusChip(status, r.status),
                                onTap: () {
                                  Navigator.of(context).push(
                                    MaterialPageRoute(builder: (_) => HRRequestDetailsScreen(id: r.id)),
                                  );
                                },
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  String _statusLabel(String status, AppLocalizations l10n) {
    switch (status) {
      case 'PENDING_REVIEW':
        return l10n.pendingReview;
      case 'APPROVED':
        return l10n.approved;
      case 'REJECTED':
        return l10n.rejected;
      default:
        return status;
    }
  }

  Widget _statusChip(String label, String status) {
    Color bg;
    Color fg;
    switch (status) {
      case 'PENDING_REVIEW':
        bg = const Color(0xFFFEF3C7);
        fg = const Color(0xFF92400E);
        break;
      case 'APPROVED':
        bg = const Color(0xFFD1FAE5);
        fg = const Color(0xFF065F46);
        break;
      case 'REJECTED':
        bg = const Color(0xFFFEE2E2);
        fg = const Color(0xFF991B1B);
        break;
      default:
        bg = const Color(0xFFE5E7EB);
        fg = const Color(0xFF374151);
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(999)),
      child: Text(label, style: TextStyle(color: fg, fontWeight: FontWeight.w600, fontSize: 12)),
    );
  }

  String _typeLabel(String type, bool isAr) {
    // Keep mapping minimal; backend type values.
    const ar = {
      'LEAVE': 'طلب إجازة',
      'UNPAID_LEAVE': 'إجازة بدون راتب',
      'TICKET_ALLOWANCE': 'طلب بدل تذاكر',
      'HOUSING_ALLOWANCE': 'طلب بدل سكن',
      'SALARY_CERTIFICATE': 'طلب تعريف راتب',
      'VISA_EXIT_REENTRY_SINGLE': 'تأشيرة خروج وعودة (مفردة)',
      'VISA_EXIT_REENTRY_MULTI': 'تأشيرة خروج وعودة (متعددة)',
      'RESIGNATION': 'استقالة',
      'FLIGHT_BOOKING': 'طلب تذاكر سفر',
    };
    const en = {
      'LEAVE': 'Leave Request',
      'UNPAID_LEAVE': 'Unpaid Leave',
      'TICKET_ALLOWANCE': 'Ticket Allowance Request',
      'HOUSING_ALLOWANCE': 'Housing Allowance Request',
      'SALARY_CERTIFICATE': 'Salary Certificate Request',
      'VISA_EXIT_REENTRY_SINGLE': 'Exit/Re-entry Visa (Single)',
      'VISA_EXIT_REENTRY_MULTI': 'Exit/Re-entry Visa (Multiple)',
      'RESIGNATION': 'Resignation Request',
      'FLIGHT_BOOKING': 'Flight Booking Request',
    };

    final map = isAr ? ar : en;
    return map[type] ?? type;
  }
}
