import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/supplier_models.dart';
import '../data/suppliers_service.dart';
import 'supplier_edit_screen.dart';

class SupplierDetailsScreen extends StatefulWidget {
  final String id;
  const SupplierDetailsScreen({super.key, required this.id});

  @override
  State<SupplierDetailsScreen> createState() => _SupplierDetailsScreenState();
}

class _SupplierDetailsScreenState extends State<SupplierDetailsScreen> {
  bool _loading = true;
  SupplierModel? _s;

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final svc = SuppliersService(api);
      final s = await svc.getById(widget.id);
      if (mounted) setState(() => _s = s);
    } catch (_) {
      if (mounted) setState(() => _s = null);
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

    return Scaffold(
      appBar: AppBar(
        title: Text(isAr ? 'تفاصيل المورد' : 'Supplier Details'),
        actions: [
          IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh), tooltip: l10n.retry),
          IconButton(
            onPressed: _s == null
                ? null
                : () async {
                    final updated = await Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => SupplierEditScreen(supplier: _s!)),
                    );
                    if (updated == true) await _load();
                  },
            icon: const Icon(Icons.edit),
            tooltip: l10n.edit,
          )
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _s == null
              ? Center(child: Text(l10n.error))
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _card(isAr ? 'الاسم' : 'Name', _s!.name),
                    _card(isAr ? 'جهة الاتصال' : 'Contact', _s!.contactPerson ?? ''),
                    _card(isAr ? 'البريد' : 'Email', _s!.email ?? ''),
                    _card(isAr ? 'الجوال' : 'Phone', _s!.phone ?? ''),
                    _card(isAr ? 'العنوان' : 'Address', _s!.address ?? ''),
                    _card(isAr ? 'التصنيف' : 'Category', _s!.category ?? ''),
                    _card(isAr ? 'الرقم الضريبي' : 'Tax Number', _s!.taxNumber ?? ''),
                    _card(isAr ? 'التقييم' : 'Rating', _s!.rating.toStringAsFixed(1)),
                    _card(isAr ? 'الحالة' : 'Status', _s!.isActive ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Inactive')),
                    if ((_s!.notes ?? '').trim().isNotEmpty) _card(isAr ? 'ملاحظات' : 'Notes', _s!.notes!),
                  ],
                ),
    );
  }

  Widget _card(String title, String value) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text(value.trim().isEmpty ? '-' : value),
          ],
        ),
      ),
    );
  }
}
