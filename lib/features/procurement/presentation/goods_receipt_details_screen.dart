import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/goods_receipt_models.dart';
import '../data/goods_receipts_service.dart';

class GoodsReceiptDetailsScreen extends StatefulWidget {
  final String id;
  const GoodsReceiptDetailsScreen({super.key, required this.id});

  @override
  State<GoodsReceiptDetailsScreen> createState() => _GoodsReceiptDetailsScreenState();
}

class _GoodsReceiptDetailsScreenState extends State<GoodsReceiptDetailsScreen> {
  bool _loading = true;
  bool _updating = false;
  GoodsReceipt? _r;

  final _qualityNotesCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  String? _draftStatus;
  bool? _draftQualityCheck;

  bool _statusDirty = false;
  bool _qualityDirty = false;
  bool _notesDirty = false;

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final svc = GoodsReceiptsService(api);
      final r = await svc.getById(widget.id);

      if (mounted) {
        setState(() {
          _r = r;
          _qualityNotesCtrl.text = r.qualityNotes ?? '';
          _notesCtrl.text = r.notes ?? '';
          _draftStatus = r.status;
          _draftQualityCheck = r.qualityCheck;
          _statusDirty = false;
          _qualityDirty = false;
          _notesDirty = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _r = null);
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
  void dispose() {
    _qualityNotesCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    final df = DateFormat('yyyy-MM-dd');

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(isAr ? 'تفاصيل سند الاستلام' : 'Goods Receipt Details'),
            if (_hasChanges())
              Text(
                isAr ? 'يوجد تغييرات غير محفوظة' : 'Unsaved changes',
                style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
              ),
          ],
        ),
        actions: [
          IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh), tooltip: l10n.retry),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _r == null
              ? Center(child: Text(l10n.error))
              : Column(
                  children: [
                    Expanded(
                      child: ListView(
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
                            Text(_r!.receiptNumber, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                            const SizedBox(height: 8),
                            Text('${l10n.purchaseOrder}: ${_r!.purchaseOrder?.orderNumber ?? _r!.purchaseOrderId}'),
                            Text('${l10n.receivedBy}: ${_r!.receivedBy}'),
                            const SizedBox(height: 6),
                            Text('${l10n.createdAt}: ${df.format(_r!.receiptDate.toLocal())}', style: TextStyle(color: Colors.grey[600])),
                            const SizedBox(height: 10),
                            Align(
                              alignment: AlignmentDirectional.centerStart,
                              child: _statusChip(_r!.status, isAr),
                            ),
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
                            if (_r!.items.isEmpty)
                              Text(l10n.noData, style: TextStyle(color: Colors.grey[600]))
                            else
                              ..._r!.items.map((it) => Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.stretch,
                                      children: [
                                        Text(it.name, style: const TextStyle(fontWeight: FontWeight.w700)),
                                        const SizedBox(height: 2),
                                        Text('${l10n.orderedQty}: ${it.orderedQty} ${it.unit}'),
                                        Text('${l10n.receivedQty}: ${it.receivedQty} ${it.unit}'),
                                        if ((it.condition ?? '').trim().isNotEmpty) Text('${l10n.condition}: ${it.condition}'),
                                        if ((it.notes ?? '').trim().isNotEmpty) Text('${l10n.notes}: ${it.notes}'),
                                        const Divider(),
                                      ],
                                    ),
                                  )),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    _actionsCard(l10n, isAr),
                    const SizedBox(height: 12),
                    _qualityCard(l10n, isAr),
                    const SizedBox(height: 12),
                    _notesCard(l10n, isAr),
                    const SizedBox(height: 90),
                        ],
                      ),
                    ),
                    SafeArea(
                      top: false,
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                        child: SizedBox(
                          width: double.infinity,
                          child: ElevatedButton.icon(
                            onPressed: (_updating || !_hasChanges()) ? null : _saveAll,
                            icon: const Icon(Icons.save),
                            label: Text(isAr ? 'حفظ التغييرات' : 'Save changes'),
                            style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
    );
  }

  Widget _actionsCard(AppLocalizations l10n, bool isAr) {
    final r = _r;
    if (r == null) return const SizedBox.shrink();

    final options = <String, String>{
      'PENDING': isAr ? 'معلق' : 'Pending',
      'INSPECTED': isAr ? 'تم الفحص' : 'Inspected',
      'ACCEPTED': isAr ? 'مقبول' : 'Accepted',
      'REJECTED': isAr ? 'مرفوض' : 'Rejected',
      'PARTIAL': isAr ? 'جزئي' : 'Partial',
    };

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(isAr ? 'إجراءات' : 'Actions', style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            DropdownButtonFormField<String>(
              value: _draftStatus ?? r.status,
              decoration: InputDecoration(
                labelText: l10n.status,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              items: options.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
              onChanged: _updating
                  ? null
                  : (v) {
                      if (v == null) return;
                      setState(() {
                        _draftStatus = v;
                        _statusDirty = v != r.status;
                      });
                    },
            ),
            const SizedBox(height: 10),
            Text(
              isAr ? 'ملاحظة: تعديل الحالة يحتاج صلاحية مسؤول (Admin)' : 'Note: Status change requires Admin role',
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Widget _qualityCard(AppLocalizations l10n, bool isAr) {
    final r = _r;
    if (r == null) return const SizedBox.shrink();

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l10n.qualityCheck, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _draftQualityCheck ?? r.qualityCheck,
              onChanged: _updating
                  ? null
                  : (v) {
                      setState(() {
                        _draftQualityCheck = v;
                        _qualityDirty = v != r.qualityCheck;
                      });
                    },
              title: Text((_draftQualityCheck ?? r.qualityCheck) ? (isAr ? 'نعم' : 'Yes') : (isAr ? 'لا' : 'No')),
            ),
            const SizedBox(height: 8),
            TextField(
              controller: _qualityNotesCtrl,
              decoration: InputDecoration(
                labelText: l10n.qualityNotes,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              maxLines: 2,
              onChanged: (_) => setState(() => _qualityDirty = true),
            ),
          ],
        ),
      ),
    );
  }

  Widget _notesCard(AppLocalizations l10n, bool isAr) {
    final r = _r;
    if (r == null) return const SizedBox.shrink();

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(l10n.notes, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextField(
              controller: _notesCtrl,
              decoration: InputDecoration(
                labelText: isAr ? 'ملاحظات السند' : 'Receipt notes',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              maxLines: 3,
              onChanged: (_) => setState(() => _notesDirty = true),
            ),
          ],
        ),
      ),
    );
  }

  bool _hasChanges() {
    return _statusDirty || _qualityDirty || _notesDirty;
  }

  Future<void> _saveAll() async {
    final r = _r;
    if (r == null) return;

    final l10n = AppLocalizations.of(context);

    setState(() => _updating = true);
    try {
      final api = context.read<ApiService>();
      final svc = GoodsReceiptsService(api);

      await svc.update(
        r.id,
        status: _statusDirty ? _draftStatus : null,
        qualityCheck: _qualityDirty ? _draftQualityCheck : null,
        qualityNotes: _qualityNotesCtrl.text,
        notes: _notesCtrl.text,
      );

      await _load();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.success), backgroundColor: Colors.green));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${l10n.error}: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _updating = false);
    }
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
