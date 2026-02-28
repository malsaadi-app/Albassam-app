import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';

class HRNewRequestScreen extends StatefulWidget {
  const HRNewRequestScreen({super.key});

  @override
  State<HRNewRequestScreen> createState() => _HRNewRequestScreenState();
}

class _HRNewRequestScreenState extends State<HRNewRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;

  String _type = 'LEAVE';

  // Common fields
  DateTime? _startDate;
  DateTime? _endDate;
  String _leaveType = 'annual';

  String? _destination;
  DateTime? _travelDate;
  DateTime? _departureDate;
  DateTime? _returnDate;

  String? _purpose;
  double? _amount;
  String? _period;
  String? _reason;

  final _amountCtrl = TextEditingController();

  @override
  void dispose() {
    _amountCtrl.dispose();
    super.dispose();
  }

  List<String> _requiredFieldsForType(String type) {
    switch (type) {
      case 'LEAVE':
        return ['startDate', 'endDate', 'leaveType'];
      case 'TICKET_ALLOWANCE':
        return ['destination', 'travelDate', 'amount'];
      case 'FLIGHT_BOOKING':
        return ['destination', 'departureDate', 'returnDate'];
      case 'SALARY_CERTIFICATE':
        return ['purpose'];
      case 'HOUSING_ALLOWANCE':
        return ['amount', 'period'];
      case 'VISA_EXIT_REENTRY_SINGLE':
      case 'VISA_EXIT_REENTRY_MULTI':
        return ['departureDate', 'returnDate', 'reason'];
      case 'RESIGNATION':
        return ['endDate', 'reason'];
      default:
        return [];
    }
  }

  Future<DateTime?> _pickDate(DateTime? initial) async {
    final now = DateTime.now();
    return showDatePicker(
      context: context,
      initialDate: initial ?? now,
      firstDate: DateTime(now.year - 1),
      lastDate: DateTime(now.year + 3),
    );
  }

  String _fmt(DateTime? d) {
    if (d == null) return '';
    return DateFormat('yyyy-MM-dd').format(d);
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);

    // Form validation for text/number.
    if (!(_formKey.currentState?.validate() ?? false)) return;

    // Required date fields.
    final req = _requiredFieldsForType(_type).toSet();
    if (req.contains('startDate') && _startDate == null) {
      _toast(l10n.error);
      return;
    }
    if (req.contains('endDate') && _endDate == null) {
      _toast(l10n.error);
      return;
    }
    if (req.contains('travelDate') && _travelDate == null) {
      _toast(l10n.error);
      return;
    }
    if (req.contains('departureDate') && _departureDate == null) {
      _toast(l10n.error);
      return;
    }
    if (req.contains('returnDate') && _returnDate == null) {
      _toast(l10n.error);
      return;
    }

    setState(() => _loading = true);

    try {
      final api = context.read<ApiService>();
      final payload = <String, dynamic>{
        'type': _type,
      };

      if (_startDate != null) payload['startDate'] = _startDate!.toIso8601String();
      if (_endDate != null) payload['endDate'] = _endDate!.toIso8601String();
      if (req.contains('leaveType')) payload['leaveType'] = _leaveType;

      if (_destination != null && _destination!.trim().isNotEmpty) payload['destination'] = _destination!.trim();
      if (_travelDate != null) payload['travelDate'] = _travelDate!.toIso8601String();
      if (_departureDate != null) payload['departureDate'] = _departureDate!.toIso8601String();
      if (_returnDate != null) payload['returnDate'] = _returnDate!.toIso8601String();

      if (_purpose != null && _purpose!.trim().isNotEmpty) payload['purpose'] = _purpose!.trim();
      if (_amount != null) payload['amount'] = _amount;
      if (_period != null && _period!.trim().isNotEmpty) payload['period'] = _period!.trim();
      if (_reason != null && _reason!.trim().isNotEmpty) payload['reason'] = _reason!.trim();

      final res = await api.post('/hr/requests', data: payload);
      final data = (res.data as Map).cast<String, dynamic>();

      if (data['error'] != null) {
        _toast(data['error'].toString());
      } else {
        _toast(l10n.success);
        if (mounted) Navigator.of(context).pop(true);
      }
    } catch (e) {
      _toast('${l10n.error}: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isAr = Localizations.localeOf(context).languageCode == 'ar';

    final types = <String, String>{
      'LEAVE': isAr ? 'طلب إجازة' : 'Leave Request',
      'TICKET_ALLOWANCE': isAr ? 'طلب بدل تذاكر' : 'Ticket Allowance Request',
      'HOUSING_ALLOWANCE': isAr ? 'طلب بدل سكن' : 'Housing Allowance Request',
      'SALARY_CERTIFICATE': isAr ? 'طلب تعريف راتب' : 'Salary Certificate Request',
      'VISA_EXIT_REENTRY_SINGLE': isAr ? 'تأشيرة خروج وعودة (مفردة)' : 'Exit/Re-entry Visa (Single)',
      'VISA_EXIT_REENTRY_MULTI': isAr ? 'تأشيرة خروج وعودة (متعددة)' : 'Exit/Re-entry Visa (Multiple)',
      'RESIGNATION': isAr ? 'استقالة' : 'Resignation Request',
      'FLIGHT_BOOKING': isAr ? 'طلب تذاكر سفر' : 'Flight Booking Request',
    };

    return Scaffold(
      appBar: AppBar(title: Text(l10n.newRequest)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            DropdownButtonFormField<String>(
              value: _type,
              decoration: InputDecoration(
                labelText: l10n.requestType,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              items: types.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
              onChanged: (v) {
                setState(() => _type = v ?? 'LEAVE');
              },
            ),
            const SizedBox(height: 14),

            ..._buildFields(l10n, isAr),

            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _loading ? null : _submit,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
              child: Text(_loading ? l10n.loading : l10n.submit),
            ),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildFields(AppLocalizations l10n, bool isAr) {
    final req = _requiredFieldsForType(_type).toSet();

    Widget dateField(String label, DateTime? val, void Function(DateTime?) setVal) {
      return InkWell(
        onTap: () async {
          final picked = await _pickDate(val);
          if (picked != null) setState(() => setVal(picked));
        },
        child: InputDecorator(
          decoration: InputDecoration(
            labelText: label,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
          child: Text(val == null ? (isAr ? 'اختر التاريخ' : 'Select date') : _fmt(val)),
        ),
      );
    }

    final widgets = <Widget>[];

    if (req.contains('startDate')) {
      widgets.add(dateField(l10n.startDate, _startDate, (d) => _startDate = d));
      widgets.add(const SizedBox(height: 12));
    }

    if (req.contains('endDate')) {
      widgets.add(dateField(l10n.endDate, _endDate, (d) => _endDate = d));
      widgets.add(const SizedBox(height: 12));
    }

    if (req.contains('leaveType')) {
      final leaveTypes = <String, String>{
        'annual': isAr ? 'سنوية' : 'Annual',
        'emergency': isAr ? 'اضطرارية' : 'Emergency',
        'unpaid': isAr ? 'بدون راتب' : 'Unpaid',
        'sick': isAr ? 'مرضية' : 'Sick',
      };

      widgets.add(
        DropdownButtonFormField<String>(
          value: _leaveType,
          decoration: InputDecoration(
            labelText: l10n.leaveType,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
          items: leaveTypes.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
          onChanged: (v) => setState(() => _leaveType = v ?? 'annual'),
        ),
      );
      widgets.add(const SizedBox(height: 12));
    }

    if (req.contains('destination')) {
      widgets.add(TextFormField(
        decoration: InputDecoration(
          labelText: l10n.destination,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onChanged: (v) => _destination = v,
        validator: (v) => (req.contains('destination') && (v == null || v.trim().isEmpty)) ? l10n.error : null,
      ));
      widgets.add(const SizedBox(height: 12));
    }

    if (req.contains('travelDate')) {
      widgets.add(dateField(l10n.travelDate, _travelDate, (d) => _travelDate = d));
      widgets.add(const SizedBox(height: 12));
    }

    if (req.contains('departureDate')) {
      widgets.add(dateField(l10n.departureDate, _departureDate, (d) => _departureDate = d));
      widgets.add(const SizedBox(height: 12));
    }

    if (req.contains('returnDate')) {
      widgets.add(dateField(l10n.returnDate, _returnDate, (d) => _returnDate = d));
      widgets.add(const SizedBox(height: 12));
    }

    if (req.contains('purpose')) {
      widgets.add(TextFormField(
        decoration: InputDecoration(
          labelText: l10n.purpose,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onChanged: (v) => _purpose = v,
        validator: (v) => (v == null || v.trim().isEmpty) ? l10n.error : null,
      ));
      widgets.add(const SizedBox(height: 12));
    }

    if (req.contains('amount')) {
      widgets.add(TextFormField(
        controller: _amountCtrl,
        keyboardType: TextInputType.number,
        decoration: InputDecoration(
          labelText: l10n.amount,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onChanged: (v) {
          final parsed = double.tryParse(v);
          _amount = parsed;
        },
        validator: (v) {
          if (v == null || v.trim().isEmpty) return l10n.error;
          if (double.tryParse(v) == null) return l10n.error;
          return null;
        },
      ));
      widgets.add(const SizedBox(height: 12));
    }

    if (req.contains('period')) {
      widgets.add(TextFormField(
        decoration: InputDecoration(
          labelText: l10n.period,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onChanged: (v) => _period = v,
        validator: (v) => (v == null || v.trim().isEmpty) ? l10n.error : null,
      ));
      widgets.add(const SizedBox(height: 12));
    }

    if (req.contains('reason')) {
      widgets.add(TextFormField(
        decoration: InputDecoration(
          labelText: l10n.reason,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
        onChanged: (v) => _reason = v,
        validator: (v) => (v == null || v.trim().isEmpty) ? l10n.error : null,
        maxLines: 3,
      ));
      widgets.add(const SizedBox(height: 12));
    }

    // Optional helper: for resignation, startDate is not required.

    return widgets;
  }
}
