import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/purchase_request_models.dart';
import '../data/purchase_requests_service.dart';

class PurchaseNewRequestScreen extends StatefulWidget {
  const PurchaseNewRequestScreen({super.key});

  @override
  State<PurchaseNewRequestScreen> createState() => _PurchaseNewRequestScreenState();
}

class _PurchaseNewRequestScreenState extends State<PurchaseNewRequestScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = false;

  String _department = '';
  String _category = 'SUPPLIES';
  String _priority = 'NORMAL';
  String? _justification;
  DateTime? _requiredDate;
  double? _estimatedBudget;

  final _budgetCtrl = TextEditingController();

  final List<PurchaseRequestItem> _items = [
    PurchaseRequestItem(name: '', quantity: 1, unit: 'pcs'),
  ];

  @override
  void dispose() {
    _budgetCtrl.dispose();
    super.dispose();
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

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);

    if (!(_formKey.currentState?.validate() ?? false)) return;

    // Validate items
    final cleanItems = _items
        .where((i) => i.name.trim().isNotEmpty)
        .map((i) => PurchaseRequestItem(
              name: i.name.trim(),
              quantity: i.quantity,
              unit: i.unit.trim().isEmpty ? 'pcs' : i.unit.trim(),
              specifications: i.specifications,
              estimatedPrice: i.estimatedPrice,
            ))
        .toList();

    if (cleanItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.error)));
      return;
    }

    setState(() => _loading = true);

    try {
      final api = context.read<ApiService>();
      final svc = PurchaseRequestsService(api);

      await svc.create(
        department: _department.trim(),
        category: _category,
        items: cleanItems,
        priority: _priority,
        justification: _justification,
        estimatedBudget: _estimatedBudget,
        requiredDate: _requiredDate,
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
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isAr = Localizations.localeOf(context).languageCode == 'ar';
    final df = DateFormat('yyyy-MM-dd');

    final categoryLabels = <String, String>{
      'SUPPLIES': isAr ? 'مستلزمات' : 'Supplies',
      'EQUIPMENT': isAr ? 'معدات' : 'Equipment',
      'SERVICES': isAr ? 'خدمات' : 'Services',
      'MAINTENANCE': isAr ? 'صيانة' : 'Maintenance',
      'OTHER': isAr ? 'أخرى' : 'Other',
    };

    final priorityLabels = <String, String>{
      'LOW': isAr ? 'منخفض' : 'Low',
      'NORMAL': isAr ? 'عادي' : 'Normal',
      'HIGH': isAr ? 'عالي' : 'High',
      'URGENT': isAr ? 'عاجل' : 'Urgent',
    };

    return Scaffold(
      appBar: AppBar(title: Text(l10n.newPurchaseRequestTitle)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              decoration: InputDecoration(
                labelText: l10n.department,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _department = v,
              validator: (v) => (v == null || v.trim().isEmpty) ? l10n.error : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _category,
              decoration: InputDecoration(
                labelText: l10n.category,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              items: categoryLabels.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
              onChanged: (v) => setState(() => _category = v ?? 'SUPPLIES'),
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _priority,
              decoration: InputDecoration(
                labelText: l10n.priority,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              items: priorityLabels.entries.map((e) => DropdownMenuItem(value: e.key, child: Text(e.value))).toList(),
              onChanged: (v) => setState(() => _priority = v ?? 'NORMAL'),
            ),
            const SizedBox(height: 12),

            InkWell(
              onTap: () async {
                final picked = await _pickDate(_requiredDate);
                if (picked != null) setState(() => _requiredDate = picked);
              },
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: l10n.requiredDate,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(_requiredDate == null ? (isAr ? 'اختياري' : 'Optional') : df.format(_requiredDate!)),
              ),
            ),
            const SizedBox(height: 12),

            TextFormField(
              controller: _budgetCtrl,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: l10n.estimatedBudget,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _estimatedBudget = double.tryParse(v),
            ),
            const SizedBox(height: 12),

            TextFormField(
              decoration: InputDecoration(
                labelText: l10n.justification,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _justification = v,
              maxLines: 3,
            ),

            const SizedBox(height: 18),
            Text(l10n.items, style: const TextStyle(fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),

            ..._items.asMap().entries.map((entry) {
              final idx = entry.key;
              final it = entry.value;
              return _itemCard(l10n, isAr, idx, it);
            }),

            Align(
              alignment: AlignmentDirectional.centerStart,
              child: TextButton.icon(
                onPressed: () {
                  setState(() => _items.add(PurchaseRequestItem(name: '', quantity: 1, unit: 'pcs')));
                },
                icon: const Icon(Icons.add),
                label: Text(isAr ? 'إضافة صنف' : 'Add item'),
              ),
            ),

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

  Widget _itemCard(AppLocalizations l10n, bool isAr, int idx, PurchaseRequestItem it) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                Text('${l10n.item} ${idx + 1}', style: const TextStyle(fontWeight: FontWeight.bold)),
                const Spacer(),
                IconButton(
                  onPressed: _items.length <= 1
                      ? null
                      : () {
                          setState(() => _items.removeAt(idx));
                        },
                  icon: const Icon(Icons.delete_outline),
                ),
              ],
            ),
            const SizedBox(height: 8),
            TextFormField(
              decoration: InputDecoration(
                labelText: l10n.itemName,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _items[idx] = PurchaseRequestItem(
                name: v,
                quantity: it.quantity,
                unit: it.unit,
                specifications: it.specifications,
                estimatedPrice: it.estimatedPrice,
              ),
              validator: (v) {
                // only validate first item strictly; others optional if empty
                if (idx == 0 && (v == null || v.trim().isEmpty)) return l10n.error;
                return null;
              },
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    initialValue: it.quantity.toString(),
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: l10n.quantity,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (v) {
                      final q = double.tryParse(v) ?? it.quantity;
                      _items[idx] = PurchaseRequestItem(
                        name: it.name,
                        quantity: q,
                        unit: it.unit,
                        specifications: it.specifications,
                        estimatedPrice: it.estimatedPrice,
                      );
                    },
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    initialValue: it.unit,
                    decoration: InputDecoration(
                      labelText: l10n.unit,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (v) {
                      _items[idx] = PurchaseRequestItem(
                        name: it.name,
                        quantity: it.quantity,
                        unit: v,
                        specifications: it.specifications,
                        estimatedPrice: it.estimatedPrice,
                      );
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextFormField(
              decoration: InputDecoration(
                labelText: l10n.specifications,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) {
                _items[idx] = PurchaseRequestItem(
                  name: it.name,
                  quantity: it.quantity,
                  unit: it.unit,
                  specifications: v,
                  estimatedPrice: it.estimatedPrice,
                );
              },
              maxLines: 2,
            ),
          ],
        ),
      ),
    );
  }
}
