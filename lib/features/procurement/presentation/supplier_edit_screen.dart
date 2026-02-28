import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/supplier_models.dart';
import '../data/suppliers_service.dart';

class SupplierEditScreen extends StatefulWidget {
  final SupplierModel supplier;
  const SupplierEditScreen({super.key, required this.supplier});

  @override
  State<SupplierEditScreen> createState() => _SupplierEditScreenState();
}

class _SupplierEditScreenState extends State<SupplierEditScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _submitting = false;

  late String _name;
  String? _contactPerson;
  String? _email;
  String? _phone;
  String? _address;
  String? _category;
  String? _taxNumber;
  String? _notes;
  double? _rating;
  bool _isActive = true;

  @override
  void initState() {
    super.initState();
    final s = widget.supplier;
    _name = s.name;
    _contactPerson = s.contactPerson;
    _email = s.email;
    _phone = s.phone;
    _address = s.address;
    _category = s.category;
    _taxNumber = s.taxNumber;
    _notes = s.notes;
    _rating = s.rating;
    _isActive = s.isActive;
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);

    if (!(_formKey.currentState?.validate() ?? false)) return;

    setState(() => _submitting = true);

    try {
      final api = context.read<ApiService>();
      final svc = SuppliersService(api);
      await svc.update(
        widget.supplier.id,
        name: _name.trim(),
        contactPerson: _contactPerson,
        email: _email,
        phone: _phone,
        address: _address,
        category: _category,
        taxNumber: _taxNumber,
        rating: _rating,
        notes: _notes,
        isActive: _isActive,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.success), backgroundColor: Colors.green));
        Navigator.of(context).pop(true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${l10n.error}: $e'), backgroundColor: Colors.red));
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isAr = Localizations.localeOf(context).languageCode == 'ar';

    return Scaffold(
      appBar: AppBar(title: Text(isAr ? 'تعديل المورد' : 'Edit Supplier')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              initialValue: _name,
              decoration: InputDecoration(
                labelText: isAr ? 'اسم المورد' : 'Supplier name',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _name = v,
              validator: (v) => (v == null || v.trim().isEmpty) ? l10n.error : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: _contactPerson,
              decoration: InputDecoration(
                labelText: isAr ? 'جهة الاتصال' : 'Contact person',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _contactPerson = v,
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: _email,
              decoration: InputDecoration(
                labelText: isAr ? 'البريد الإلكتروني' : 'Email',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              keyboardType: TextInputType.emailAddress,
              onChanged: (v) => _email = v,
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: _phone,
              decoration: InputDecoration(
                labelText: isAr ? 'رقم الجوال' : 'Phone',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              keyboardType: TextInputType.phone,
              onChanged: (v) => _phone = v,
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: _address,
              decoration: InputDecoration(
                labelText: isAr ? 'العنوان' : 'Address',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _address = v,
              maxLines: 2,
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: _category,
              decoration: InputDecoration(
                labelText: isAr ? 'التصنيف' : 'Category',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _category = v,
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: _taxNumber,
              decoration: InputDecoration(
                labelText: isAr ? 'الرقم الضريبي' : 'Tax number',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _taxNumber = v,
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: _rating?.toString(),
              decoration: InputDecoration(
                labelText: isAr ? 'التقييم' : 'Rating',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              keyboardType: TextInputType.number,
              onChanged: (v) => _rating = double.tryParse(v),
            ),
            const SizedBox(height: 12),
            TextFormField(
              initialValue: _notes,
              decoration: InputDecoration(
                labelText: isAr ? 'ملاحظات' : 'Notes',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _notes = v,
              maxLines: 3,
            ),
            const SizedBox(height: 12),
            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _isActive,
              onChanged: (v) => setState(() => _isActive = v),
              title: Text(isAr ? 'نشط' : 'Active'),
            ),
            const SizedBox(height: 18),
            ElevatedButton(
              onPressed: _submitting ? null : _submit,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
              child: Text(_submitting ? l10n.loading : l10n.save),
            ),
          ],
        ),
      ),
    );
  }
}
