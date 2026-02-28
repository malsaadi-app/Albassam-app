import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/purchase_order_models.dart';
import '../data/purchase_orders_service.dart';
import '../data/quotation_models.dart';

class PurchaseOrderNewScreen extends StatefulWidget {
  final String? initialSupplierId;
  final List<PurchaseOrderItem>? initialItems;
  const PurchaseOrderNewScreen({super.key, this.initialSupplierId, this.initialItems});

  @override
  State<PurchaseOrderNewScreen> createState() => _PurchaseOrderNewScreenState();
}

class _PurchaseOrderNewScreenState extends State<PurchaseOrderNewScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = true;
  bool _submitting = false;

  List<Supplier> _suppliers = [];
  String? _supplierId;

  DateTime? _expectedDelivery;
  String? _paymentTerms;
  String? _deliveryTerms;
  String? _notes;

  double _tax = 15;
  double _discount = 0;

  final _taxCtrl = TextEditingController(text: '15');
  final _discountCtrl = TextEditingController(text: '0');

  late final List<PurchaseOrderItem> _items;

  @override
  void dispose() {
    _taxCtrl.dispose();
    _discountCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final svc = PurchaseOrdersService(api);
      final suppliers = await svc.suppliers();
      if (mounted) {
        setState(() {
          _suppliers = suppliers;
          if (widget.initialSupplierId != null) {
            _supplierId = widget.initialSupplierId;
          } else {
            _supplierId = suppliers.isNotEmpty ? suppliers.first.id : null;
          }
        });
      }
    } catch (_) {
      if (mounted) setState(() => _suppliers = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _items = widget.initialItems == null || widget.initialItems!.isEmpty
        ? [PurchaseOrderItem(name: '', quantity: 1, unit: 'pcs', unitPrice: 0, totalPrice: 0)]
        : widget.initialItems!;
    _load();
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

  double _calcTotal() => _items.fold<double>(0, (sum, i) => sum + i.totalPrice);

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);

    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_supplierId == null || _supplierId!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.error)));
      return;
    }

    final cleanItems = _items.where((i) => i.name.trim().isNotEmpty).toList();
    if (cleanItems.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.error)));
      return;
    }

    setState(() => _submitting = true);

    try {
      final api = context.read<ApiService>();
      final svc = PurchaseOrdersService(api);
      await svc.create(
        supplierId: _supplierId!,
        items: cleanItems,
        expectedDelivery: _expectedDelivery,
        tax: _tax,
        discount: _discount,
        paymentTerms: _paymentTerms,
        deliveryTerms: _deliveryTerms,
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
        appBar: AppBar(title: Text(l10n.newPurchaseOrderTitle)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    final total = _calcTotal();
    final taxAmount = (total * _tax) / 100;
    final finalAmount = total + taxAmount - _discount;

    return Scaffold(
      appBar: AppBar(title: Text(l10n.newPurchaseOrderTitle)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            DropdownButtonFormField<String>(
              value: _supplierId,
              decoration: InputDecoration(
                labelText: l10n.supplier,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              items: _suppliers.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name))).toList(),
              onChanged: widget.initialSupplierId != null ? null : (v) => setState(() => _supplierId = v),
              validator: (v) => (v == null || v.isEmpty) ? l10n.error : null,
            ),
            const SizedBox(height: 12),

            InkWell(
              onTap: () async {
                final picked = await _pickDate(_expectedDelivery);
                if (picked != null) setState(() => _expectedDelivery = picked);
              },
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: l10n.expectedDelivery,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: Text(_expectedDelivery == null ? (isAr ? 'اختياري' : 'Optional') : df.format(_expectedDelivery!)),
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
                labelText: l10n.deliveryTerms,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _deliveryTerms = v,
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

            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _taxCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: l10n.tax,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (v) => setState(() => _tax = double.tryParse(v) ?? _tax),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    controller: _discountCtrl,
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: l10n.discount,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (v) => setState(() => _discount = double.tryParse(v) ?? _discount),
                  ),
                ),
              ],
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
                  setState(() => _items.add(PurchaseOrderItem(name: '', quantity: 1, unit: 'pcs', unitPrice: 0, totalPrice: 0)));
                },
                icon: const Icon(Icons.add),
                label: Text(isAr ? 'إضافة صنف' : 'Add item'),
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
                    Text('${l10n.totalAmount}: ${total.toStringAsFixed(2)}'),
                    Text('${l10n.tax}: ${taxAmount.toStringAsFixed(2)}'),
                    Text('${l10n.finalAmount}: ${finalAmount.toStringAsFixed(2)}',
                        style: const TextStyle(fontWeight: FontWeight.w800)),
                  ],
                ),
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

  Widget _itemCard(AppLocalizations l10n, bool isAr, int idx, PurchaseOrderItem it) {
    void update({String? name, double? qty, String? unit, double? unitPrice, String? specs}) {
      final newQty = qty ?? it.quantity;
      final newUnitPrice = unitPrice ?? it.unitPrice;
      final total = newQty * newUnitPrice;

      _items[idx] = PurchaseOrderItem(
        name: name ?? it.name,
        quantity: newQty,
        unit: unit ?? it.unit,
        unitPrice: newUnitPrice,
        totalPrice: total,
        specifications: specs ?? it.specifications,
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
                    initialValue: it.unit,
                    decoration: InputDecoration(
                      labelText: l10n.unit,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (v) => setState(() => update(unit: v)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextFormField(
              initialValue: it.unitPrice.toString(),
              keyboardType: TextInputType.number,
              decoration: InputDecoration(
                labelText: l10n.unitPrice,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => setState(() => update(unitPrice: double.tryParse(v) ?? it.unitPrice)),
            ),
            const SizedBox(height: 10),
            TextFormField(
              decoration: InputDecoration(
                labelText: l10n.specifications,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => setState(() => update(specs: v)),
              maxLines: 2,
            ),
            const SizedBox(height: 10),
            Align(
              alignment: AlignmentDirectional.centerStart,
              child: Text('${l10n.totalPrice}: ${(it.quantity * it.unitPrice).toStringAsFixed(2)}',
                  style: TextStyle(color: Colors.grey[700])),
            ),
          ],
        ),
      ),
    );
  }
}
