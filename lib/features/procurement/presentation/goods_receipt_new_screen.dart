import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/goods_receipt_models.dart';
import '../data/goods_receipts_service.dart';
import '../data/purchase_order_models.dart';
import '../data/purchase_orders_service.dart';

class GoodsReceiptNewScreen extends StatefulWidget {
  final String? initialPurchaseOrderId;
  const GoodsReceiptNewScreen({super.key, this.initialPurchaseOrderId});

  @override
  State<GoodsReceiptNewScreen> createState() => _GoodsReceiptNewScreenState();
}

class _GoodsReceiptNewScreenState extends State<GoodsReceiptNewScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _loading = true;
  bool _submitting = false;

  List<PurchaseOrder> _orders = [];
  String? _purchaseOrderId;
  String _receivedBy = '';

  bool _qualityCheck = false;
  String? _qualityNotes;
  String? _notes;

  final List<GoodsReceiptItem> _items = [
    GoodsReceiptItem(name: '', orderedQty: 0, receivedQty: 0, unit: 'pcs'),
  ];

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final svc = PurchaseOrdersService(api);
      final list = await svc.list(status: 'ALL');

      if (mounted) {
        setState(() {
          _orders = list;
          if (widget.initialPurchaseOrderId != null) {
            _purchaseOrderId = widget.initialPurchaseOrderId;
          } else {
            _purchaseOrderId = list.isNotEmpty ? list.first.id : null;
          }
        });
      }
    } catch (_) {
      if (mounted) setState(() => _orders = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);

    if (!(_formKey.currentState?.validate() ?? false)) return;
    if (_purchaseOrderId == null || _purchaseOrderId!.isEmpty) {
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
      final svc = GoodsReceiptsService(api);
      await svc.create(
        purchaseOrderId: _purchaseOrderId!,
        receivedBy: _receivedBy.trim(),
        items: cleanItems,
        qualityCheck: _qualityCheck,
        qualityNotes: _qualityNotes,
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

    if (_loading) {
      return Scaffold(
        appBar: AppBar(title: Text(l10n.newGoodsReceiptTitle)),
        body: const Center(child: CircularProgressIndicator()),
      );
    }

    return Scaffold(
      appBar: AppBar(title: Text(l10n.newGoodsReceiptTitle)),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            DropdownButtonFormField<String>(
              value: _purchaseOrderId,
              decoration: InputDecoration(
                labelText: l10n.purchaseOrder,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              items: _orders
                  .map((o) => DropdownMenuItem(value: o.id, child: Text('${o.orderNumber} • ${o.supplier?.name ?? ''}')))
                  .toList(),
              onChanged: widget.initialPurchaseOrderId != null ? null : (v) => setState(() => _purchaseOrderId = v),
              validator: (v) => (v == null || v.isEmpty) ? l10n.error : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              decoration: InputDecoration(
                labelText: l10n.receivedBy,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _receivedBy = v,
              validator: (v) => (v == null || v.trim().isEmpty) ? l10n.error : null,
            ),
            const SizedBox(height: 12),

            SwitchListTile(
              contentPadding: EdgeInsets.zero,
              value: _qualityCheck,
              onChanged: (v) => setState(() => _qualityCheck = v),
              title: Text(l10n.qualityCheck),
            ),
            const SizedBox(height: 8),
            TextFormField(
              decoration: InputDecoration(
                labelText: l10n.qualityNotes,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => _qualityNotes = v,
              maxLines: 2,
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
                  setState(() => _items.add(GoodsReceiptItem(name: '', orderedQty: 0, receivedQty: 0, unit: 'pcs')));
                },
                icon: const Icon(Icons.add),
                label: Text(isAr ? 'إضافة صنف' : 'Add item'),
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

  Widget _itemCard(AppLocalizations l10n, bool isAr, int idx, GoodsReceiptItem it) {
    void update({String? name, double? ordered, double? received, String? unit, String? condition, String? notes}) {
      _items[idx] = GoodsReceiptItem(
        name: name ?? it.name,
        orderedQty: ordered ?? it.orderedQty,
        receivedQty: received ?? it.receivedQty,
        unit: unit ?? it.unit,
        condition: condition ?? it.condition,
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
                    initialValue: it.orderedQty.toString(),
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: l10n.orderedQty,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (v) => setState(() => update(ordered: double.tryParse(v) ?? it.orderedQty)),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: TextFormField(
                    initialValue: it.receivedQty.toString(),
                    keyboardType: TextInputType.number,
                    decoration: InputDecoration(
                      labelText: l10n.receivedQty,
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (v) => setState(() => update(received: double.tryParse(v) ?? it.receivedQty)),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            TextFormField(
              initialValue: it.unit,
              decoration: InputDecoration(
                labelText: l10n.unit,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => setState(() => update(unit: v)),
            ),
            const SizedBox(height: 10),
            TextFormField(
              decoration: InputDecoration(
                labelText: l10n.condition,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onChanged: (v) => setState(() => update(condition: v)),
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
