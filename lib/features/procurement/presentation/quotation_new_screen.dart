import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/purchase_request_models.dart';
import '../data/purchase_requests_service.dart';
import '../data/quotation_models.dart';
import '../data/quotations_service.dart';

class QuotationNewScreen extends StatefulWidget {
  final String? initialPurchaseRequestId;
  const QuotationNewScreen({super.key, this.initialPurchaseRequestId});

  @override
  State<QuotationNewScreen> createState() => _QuotationNewScreenState();
}

class _QuotationNewScreenState extends State<QuotationNewScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = true;
  bool _submitting = false;

  List<PurchaseRequest> _purchaseRequests = [];
  List<Supplier> _suppliers = [];

  String? _purchaseRequestId;
  String? _supplierId;

  DateTime? _validUntil;
  String? _paymentTerms;
  String? _deliveryTime;
  String? _notes;

  final _totalCtrl = TextEditingController();

  final List<QuotedItem> _items = [
    QuotedItem(itemName: '', quantity: 1, unitPrice: 0, totalPrice: 0),
  ];

  @override
  void dispose() {
    _totalCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final purchaseSvc = PurchaseRequestsService(api);
      final qSvc = QuotationsService(api);

      final pr = await purchaseSvc.list(status: 'ALL');
      final suppliers = await qSvc.suppliers();

      if (mounted) {
        setState(() {
          _purchaseRequests = pr;
          _suppliers = suppliers;
          if (widget.initialPurchaseRequestId != null) {
            _purchaseRequestId = widget.initialPurchaseRequestId;
          } else {
            _purchaseRequestId = pr.isNotEmpty ? pr.first.id : null;
          }
          _supplierId = suppliers.isNotEmpty ? suppliers.first.id : null;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _purchaseRequests = [];
          _suppliers = [];
        });
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  double _calcTotal() {
    double sum = 0;
    for (final it in _items) {
      sum += it.totalPrice;
    }
    return sum;
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
    if (_purchaseRequestId == null || _supplierId == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.error)));
      return;
    }

    final cleanItems = _items.where((i) => i.itemName.trim().isNotEmpty).toList();
    if (cleanItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.error)));
      return;
    }

    final total = double.tryParse(_totalCtrl.text.trim());
    final totalAmount = total ?? _calcTotal();

    setState(() => _submitting = true);

    try {
      final api = context.read<ApiService>();
      final svc = QuotationsService(api);
      await svc.create(
        purchaseRequestId: _purchaseRequestId!,
        supplierId: _supplierId!,
        quotedItems: cleanItems,
        totalAmount: totalAmount,
        validUntil: _validUntil,
        paymentTerms: _paymentTerms,
        deliveryTime: _deliveryTime,
        notes: _notes,
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
    final df = DateFormat('yyyy-MM-dd');

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.newQuotationTitle)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(l10n.newQuotationTitle)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            DropdownButtonFormField<String>(
              value: _purchaseRequestId,
              decoration: InputDecoration(
                labelText: l10n.purchaseRequest,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              items: _purchaseRequests
                  .map((r) => DropdownMenuItem(value: r.id, child: Text('${r.requestNumber} • ${r.department}')))
                  .toList(),
              onChanged: widget.initialPurchaseRequestId != null ? null : (v) => setState(() => _purchaseRequestId = v),
              validator: (v) => (v == null || v.isEmpty) ? l10n.error : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _supplierId,
              decoration: InputDecoration(
                labelText: l10n.supplier,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              items: _suppliers.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name))).toList(),
              onChanged: (v) => setState(() => _supplierId = v),
              validator: (v) => (v == null || v.isEmpty) ? l10n.error : null,
            ),
            const SizedBox(height: 12),

            InkWell(
              onTap: () async {
                final picked = await _pickDate(_validUntil);
                if (picked != null) setState(() => _validUntil = picked);
              },
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: l10n.validUntil,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(_validUntil == null ? (isAr ? 'اختياري' : 'Optional') : df.format(_validUntil!)),
              ),
            ),
            const SizedBox(height: 12),

            TextFormField(
              decoration: InputDecoration(
                labelText: l10n.paymentTerms,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _paymentTerms = v,
            ),
            const SizedBox(height: 12),

            TextFormField(
              decoration: InputDecoration(
                labelText: l10n.deliveryTime,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _deliveryTime = v,
            ),
            const SizedBox(height: 12),

            TextFormField(
              decoration: InputDecoration(
                labelText: l10n.notes,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _notes = v,
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
                  setState(() => _items.add(QuotedItem(itemName: '', quantity: 1, unitPrice: 0, totalPrice: 0)));
                },
                icon: const Icon(Icons.add),
                label: Text(isAr ? 'إضافة صنف' : 'Add item'),
              ),
            ),

            const SizedBox(height: 12),
            TextFormField(
              controller: _totalCtrl,
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: l10n.totalAmount,
                helperText: isAr ? 'اختياري (لو تركتها فاضية نحسبها من الأصناف)' : 'Optional (auto-calculated from items)',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),

            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _submitting ? null : _submit,
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
              child: Text(_submitting ? l10n.loading : l10n.submit),
            ),
          ],
        ),
      ),
    );
  }

  Widget _itemCard(AppLocalizations l10n, bool isAr, int idx, QuotedItem it) {
    void update({String? name, double? qty, double? unit, double? total, String? notes}) {
      final newQty = qty ?? it.quantity;
      final newUnit = unit ?? it.unitPrice;
      final computedTotal = total ?? (newQty * newUnit);

      _items[idx] = QuotedItem(
        itemName: name ?? it.itemName,
        quantity: newQty,
        unitPrice: newUnit,
        totalPrice: computedTotal,
        notes: notes ?? it.notes,
      );
    }

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
              onChanged: (v) => setState(() => update(name: v)),
              validator: (v) {
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
                    onChanged: (v) => setState(() => update(qty: double.tryParse(v) ?? it.quantity)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    initialValue: it.unitPrice.toString(),
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: l10n.unitPrice,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (v) => setState(() => update(unit: double.tryParse(v) ?? it.unitPrice)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextFormField(
              initialValue: it.totalPrice.toString(),
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: l10n.totalPrice,
                helperText: isAr ? 'يتحسب تلقائياً من الكمية والسعر' : 'Auto-calculated from qty x price',
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => setState(() => update(total: double.tryParse(v) ?? it.totalPrice)),
            ),
            const SizedBox(height: 10),
            TextFormField(
              decoration: InputDecoration(
                labelText: l10n.notes,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => setState(() => update(notes: v)),
              maxLines: 2,
            ),
          ],
        ),
      ),
    );
  }

}
