import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/hr_requests_service.dart';

class HRRequestDetailsScreen extends StatefulWidget {
  final String id;
  const HRRequestDetailsScreen({super.key, required this.id});

  @override
  State<HRRequestDetailsScreen> createState() => _HRRequestDetailsScreenState();
}

class _HRRequestDetailsScreenState extends State<HRRequestDetailsScreen> {
  bool _loading = true;
  Map<String, dynamic>? _data;

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final svc = HRRequestsService(api);
      final data = await svc.getById(widget.id);
      if (mounted) setState(() => _data = data);
    } catch (_) {
      if (mounted) setState(() => _data = null);
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
      appBar: AppBar(title: Text(isAr ? 'تفاصيل الطلب' : 'Request Details')),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _data == null
              ? Center(child: Text(l10n.error))
              : Padding(
                  padding: const EdgeInsets.all(16),
                  child: ListView(
                    children: [
                      _headerCard(l10n, isAr, df),
                      const SizedBox(height: 12),
                      _fieldsCard(isAr, df),
                    ],
                  ),
                ),
    );
  }

  Widget _headerCard(AppLocalizations l10n, bool isAr, DateFormat df) {
    final type = _data?['type']?.toString() ?? '';
    final status = _data?['status']?.toString() ?? '';
    final createdAt = _data?['createdAt']?.toString();
    final employee = _data?['employee'] as Map<String, dynamic>?;

    final created = createdAt != null ? df.format(DateTime.parse(createdAt).toLocal()) : '';

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              _typeLabel(type, isAr),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              '${employee?['displayName'] ?? ''} • $created',
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 10),
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: _statusChip(_statusLabel(status, l10n), status),
            ),
          ],
        ),
      ),
    );
  }

  Widget _fieldsCard(bool isAr, DateFormat df) {
    final fields = <MapEntry<String, dynamic>>[];

    void add(String labelAr, String labelEn, dynamic value) {
      if (value == null) return;
      if (value is String && value.trim().isEmpty) return;
      fields.add(MapEntry(isAr ? labelAr : labelEn, value));
    }

    add('سبب', 'Reason', _data?['reason']);
    add('الغرض', 'Purpose', _data?['purpose']);
    add('الجهة المستفيدة', 'Recipient', _data?['recipientOrganization']);
    add('الوجهة', 'Destination', _data?['destination']);
    add('المبلغ', 'Amount', _data?['amount']);
    add('المدة', 'Period', _data?['period']);
    add('نوع الإجازة', 'Leave Type', _data?['leaveType']);

    DateTime? parseDate(String? s) => s == null ? null : DateTime.tryParse(s);

    final startDate = parseDate(_data?['startDate']?.toString());
    final endDate = parseDate(_data?['endDate']?.toString());
    final travelDate = parseDate(_data?['travelDate']?.toString());
    final departureDate = parseDate(_data?['departureDate']?.toString());
    final returnDate = parseDate(_data?['returnDate']?.toString());

    if (startDate != null) add('من', 'Start', df.format(startDate.toLocal()));
    if (endDate != null) add('إلى', 'End', df.format(endDate.toLocal()));
    if (travelDate != null) add('تاريخ السفر', 'Travel Date', df.format(travelDate.toLocal()));
    if (departureDate != null) add('تاريخ المغادرة', 'Departure Date', df.format(departureDate.toLocal()));
    if (returnDate != null) add('تاريخ العودة', 'Return Date', df.format(returnDate.toLocal()));

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(isAr ? 'البيانات' : 'Details', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            if (fields.isEmpty)
              Text(isAr ? 'لا توجد بيانات إضافية' : 'No additional details', style: TextStyle(color: Colors.grey[600]))
            else
              ...fields.map((e) => Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        SizedBox(
                          width: 120,
                          child: Text(e.key, style: const TextStyle(color: Color(0xFF6B7280))),
                        ),
                        const SizedBox(width: 10),
                        Expanded(child: Text(e.value.toString(), style: const TextStyle(fontWeight: FontWeight.w600))),
                      ],
                    ),
                  )),
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
    // Keep mapping consistent with list screen.
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
