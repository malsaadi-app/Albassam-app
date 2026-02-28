import 'dart:convert';

class Supplier {
  final String id;
  final String name;

  Supplier({required this.id, required this.name});

  factory Supplier.fromJson(Map<String, dynamic> json) {
    return Supplier(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
    );
  }
}

class QuotedItem {
  final String itemName;
  final double quantity;
  final double unitPrice;
  final double totalPrice;
  final String? notes;

  QuotedItem({
    required this.itemName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
    this.notes,
  });

  factory QuotedItem.fromJson(Map<String, dynamic> json) {
    double numVal(dynamic v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '') ?? 0;
    }

    return QuotedItem(
      itemName: json['itemName']?.toString() ?? '',
      quantity: numVal(json['quantity']),
      unitPrice: numVal(json['unitPrice']),
      totalPrice: numVal(json['totalPrice']),
      notes: json['notes']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'itemName': itemName,
      'quantity': quantity,
      'unitPrice': unitPrice,
      'totalPrice': totalPrice,
      if (notes != null && notes!.trim().isNotEmpty) 'notes': notes,
    };
  }
}

class Quotation {
  final String id;
  final String purchaseRequestId;
  final String supplierId;
  final String quotationNumber;
  final List<QuotedItem> quotedItems;
  final double totalAmount;
  final DateTime? validUntil;
  final String? paymentTerms;
  final String? deliveryTime;
  final String? notes;
  final String status;
  final Supplier? supplier;
  final DateTime createdAt;

  Quotation({
    required this.id,
    required this.purchaseRequestId,
    required this.supplierId,
    required this.quotationNumber,
    required this.quotedItems,
    required this.totalAmount,
    required this.validUntil,
    required this.paymentTerms,
    required this.deliveryTime,
    required this.notes,
    required this.status,
    required this.supplier,
    required this.createdAt,
  });

  static List<QuotedItem> _parseQuotedItems(dynamic raw) {
    try {
      if (raw is List) {
        return raw.map((e) => QuotedItem.fromJson((e as Map).cast<String, dynamic>())).toList();
      }
      if (raw is String) {
        final decoded = jsonDecode(raw);
        if (decoded is List) {
          return decoded.map((e) => QuotedItem.fromJson((e as Map).cast<String, dynamic>())).toList();
        }
      }
    } catch (_) {}
    return [];
  }

  factory Quotation.fromJson(Map<String, dynamic> json) {
    double numVal(dynamic v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '') ?? 0;
    }

    return Quotation(
      id: json['id']?.toString() ?? '',
      purchaseRequestId: json['purchaseRequestId']?.toString() ?? '',
      supplierId: json['supplierId']?.toString() ?? '',
      quotationNumber: json['quotationNumber']?.toString() ?? '',
      quotedItems: _parseQuotedItems(json['quotedItems']),
      totalAmount: numVal(json['totalAmount']),
      validUntil: json['validUntil'] == null ? null : DateTime.tryParse(json['validUntil'].toString()),
      paymentTerms: json['paymentTerms']?.toString(),
      deliveryTime: json['deliveryTime']?.toString(),
      notes: json['notes']?.toString(),
      status: json['status']?.toString() ?? '',
      supplier: json['supplier'] is Map ? Supplier.fromJson((json['supplier'] as Map).cast<String, dynamic>()) : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}
