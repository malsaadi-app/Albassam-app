import 'dart:convert';

import 'quotation_models.dart';

class PurchaseOrderItem {
  final String name;
  final double quantity;
  final String unit;
  final double unitPrice;
  final double totalPrice;
  final String? specifications;

  PurchaseOrderItem({
    required this.name,
    required this.quantity,
    required this.unit,
    required this.unitPrice,
    required this.totalPrice,
    this.specifications,
  });

  factory PurchaseOrderItem.fromJson(Map<String, dynamic> json) {
    double numVal(dynamic v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '') ?? 0;
    }

    return PurchaseOrderItem(
      name: json['name']?.toString() ?? '',
      quantity: numVal(json['quantity']),
      unit: json['unit']?.toString() ?? '',
      unitPrice: numVal(json['unitPrice']),
      totalPrice: numVal(json['totalPrice']),
      specifications: json['specifications']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'quantity': quantity,
      'unit': unit,
      'unitPrice': unitPrice,
      'totalPrice': totalPrice,
      if (specifications != null && specifications!.trim().isNotEmpty) 'specifications': specifications,
    };
  }
}

class PurchaseOrder {
  final String id;
  final String orderNumber;
  final String supplierId;
  final Supplier? supplier;
  final String status;
  final DateTime orderDate;
  final DateTime? expectedDelivery;
  final List<PurchaseOrderItem> items;
  final double totalAmount;
  final double tax;
  final double discount;
  final double finalAmount;
  final String? paymentTerms;
  final String? deliveryTerms;
  final String? notes;

  PurchaseOrder({
    required this.id,
    required this.orderNumber,
    required this.supplierId,
    required this.supplier,
    required this.status,
    required this.orderDate,
    required this.expectedDelivery,
    required this.items,
    required this.totalAmount,
    required this.tax,
    required this.discount,
    required this.finalAmount,
    required this.paymentTerms,
    required this.deliveryTerms,
    required this.notes,
  });

  static List<PurchaseOrderItem> _parseItems(dynamic raw) {
    try {
      if (raw is List) {
        return raw.map((e) => PurchaseOrderItem.fromJson((e as Map).cast<String, dynamic>())).toList();
      }
      if (raw is String) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          return decoded.map((e) => PurchaseOrderItem.fromJson((e as Map).cast<String, dynamic>())).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  factory PurchaseOrder.fromJson(Map<String, dynamic> json) {
    double numVal(dynamic v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '') ?? 0;
    }

    return PurchaseOrder(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber']?.toString() ?? '',
      supplierId: json['supplierId']?.toString() ?? '',
      supplier: json['supplier'] is Map ? Supplier.fromJson((json['supplier'] as Map).cast<String, dynamic>()) : null,
      status: json['status']?.toString() ?? '',
      orderDate: DateTime.parse(json['orderDate'] as String),
      expectedDelivery: json['expectedDelivery'] == null ? null : DateTime.tryParse(json['expectedDelivery'].toString()),
      items: _parseItems(json['items']),
      totalAmount: numVal(json['totalAmount']),
      tax: numVal(json['tax']),
      discount: numVal(json['discount']),
      finalAmount: numVal(json['finalAmount']),
      paymentTerms: json['paymentTerms']?.toString(),
      deliveryTerms: json['deliveryTerms']?.toString(),
      notes: json['notes']?.toString(),
    );
  }
}
