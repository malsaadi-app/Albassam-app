import 'dart:convert';

import 'purchase_order_models.dart';

class GoodsReceiptItem {
  final String name;
  final double orderedQty;
  final double receivedQty;
  final String unit;
  final String? condition;
  final String? notes;

  GoodsReceiptItem({
    required this.name,
    required this.orderedQty,
    required this.receivedQty,
    required this.unit,
    this.condition,
    this.notes,
  });

  factory GoodsReceiptItem.fromJson(Map<String, dynamic> json) {
    double numVal(dynamic v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '') ?? 0;
    }

    return GoodsReceiptItem(
      name: json['name']?.toString() ?? '',
      orderedQty: numVal(json['orderedQty']),
      receivedQty: numVal(json['receivedQty']),
      unit: json['unit']?.toString() ?? '',
      condition: json['condition']?.toString(),
      notes: json['notes']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'orderedQty': orderedQty,
      'receivedQty': receivedQty,
      'unit': unit,
      if (condition != null && condition!.trim().isNotEmpty) 'condition': condition,
      if (notes != null && notes!.trim().isNotEmpty) 'notes': notes,
    };
  }
}

class GoodsReceipt {
  final String id;
  final String receiptNumber;
  final String purchaseOrderId;
  final DateTime receiptDate;
  final String receivedBy;
  final List<GoodsReceiptItem> items;
  final String status;
  final bool qualityCheck;
  final String? qualityNotes;
  final String? notes;
  final PurchaseOrder? purchaseOrder;

  GoodsReceipt({
    required this.id,
    required this.receiptNumber,
    required this.purchaseOrderId,
    required this.receiptDate,
    required this.receivedBy,
    required this.items,
    required this.status,
    required this.qualityCheck,
    required this.qualityNotes,
    required this.notes,
    required this.purchaseOrder,
  });

  static List<GoodsReceiptItem> _parseItems(dynamic raw) {
    try {
      if (raw is List) {
        return raw.map((e) => GoodsReceiptItem.fromJson((e as Map).cast<String, dynamic>())).toList();
      }
      if (raw is String) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          return decoded.map((e) => GoodsReceiptItem.fromJson((e as Map).cast<String, dynamic>())).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  factory GoodsReceipt.fromJson(Map<String, dynamic> json) {
    return GoodsReceipt(
      id: json['id']?.toString() ?? '',
      receiptNumber: json['receiptNumber']?.toString() ?? '',
      purchaseOrderId: json['purchaseOrderId']?.toString() ?? '',
      receiptDate: DateTime.parse(json['receiptDate'] as String),
      receivedBy: json['receivedBy']?.toString() ?? '',
      items: _parseItems(json['items']),
      status: json['status']?.toString() ?? '',
      qualityCheck: json['qualityCheck'] == true,
      qualityNotes: json['qualityNotes']?.toString(),
      notes: json['notes']?.toString(),
      purchaseOrder: json['purchaseOrder'] is Map
          ? PurchaseOrder.fromJson((json['purchaseOrder'] as Map).cast<String, dynamic>())
          : null,
    );
  }
}
