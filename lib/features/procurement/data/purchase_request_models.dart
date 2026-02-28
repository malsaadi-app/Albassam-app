class PurchaseRequestItem {
  final String name;
  final double quantity;
  final String unit;
  final String? specifications;
  final double? estimatedPrice;

  PurchaseRequestItem({
    required this.name,
    required this.quantity,
    required this.unit,
    this.specifications,
    this.estimatedPrice,
  });

  factory PurchaseRequestItem.fromJson(Map<String, dynamic> json) {
    return PurchaseRequestItem(
      name: json['name']?.toString() ?? '',
      quantity: (json['quantity'] is num) ? (json['quantity'] as num).toDouble() : double.tryParse(json['quantity']?.toString() ?? '') ?? 0,
      unit: json['unit']?.toString() ?? '',
      specifications: json['specifications']?.toString(),
      estimatedPrice: (json['estimatedPrice'] is num)
          ? (json['estimatedPrice'] as num).toDouble()
          : double.tryParse(json['estimatedPrice']?.toString() ?? ''),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'quantity': quantity,
      'unit': unit,
      if (specifications != null && specifications!.trim().isNotEmpty) 'specifications': specifications,
      if (estimatedPrice != null) 'estimatedPrice': estimatedPrice,
    };
  }
}

class PurchaseRequestUser {
  final String id;
  final String displayName;
  final String? username;

  PurchaseRequestUser({required this.id, required this.displayName, this.username});

  factory PurchaseRequestUser.fromJson(Map<String, dynamic> json) {
    return PurchaseRequestUser(
      id: json['id']?.toString() ?? '',
      displayName: json['displayName']?.toString() ?? '',
      username: json['username']?.toString(),
    );
  }
}

class PurchaseRequest {
  final String id;
  final String requestNumber;
  final String department;
  final String category;
  final String priority;
  final String status;
  final double? estimatedBudget;
  final DateTime? requiredDate;
  final DateTime createdAt;
  final PurchaseRequestUser requestedBy;

  PurchaseRequest({
    required this.id,
    required this.requestNumber,
    required this.department,
    required this.category,
    required this.priority,
    required this.status,
    required this.estimatedBudget,
    required this.requiredDate,
    required this.createdAt,
    required this.requestedBy,
  });

  factory PurchaseRequest.fromJson(Map<String, dynamic> json) {
    return PurchaseRequest(
      id: json['id']?.toString() ?? '',
      requestNumber: json['requestNumber']?.toString() ?? '',
      department: json['department']?.toString() ?? '',
      category: json['category']?.toString() ?? '',
      priority: json['priority']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      estimatedBudget: (json['estimatedBudget'] is num)
          ? (json['estimatedBudget'] as num).toDouble()
          : double.tryParse(json['estimatedBudget']?.toString() ?? ''),
      requiredDate: json['requiredDate'] == null ? null : DateTime.tryParse(json['requiredDate'].toString()),
      createdAt: DateTime.parse(json['createdAt'] as String),
      requestedBy: PurchaseRequestUser.fromJson((json['requestedBy'] as Map).cast<String, dynamic>()),
    );
  }
}

class PurchaseRequestDetails {
  final PurchaseRequest header;
  final List<PurchaseRequestItem> items;
  final String? justification;

  PurchaseRequestDetails({required this.header, required this.items, this.justification});

  factory PurchaseRequestDetails.fromJson(Map<String, dynamic> json) {
    final header = PurchaseRequest.fromJson(json);
    final items = (json['items'] as List? ?? []).map((e) => PurchaseRequestItem.fromJson((e as Map).cast<String, dynamic>())).toList();
    return PurchaseRequestDetails(
      header: header,
      items: items,
      justification: json['justification']?.toString(),
    );
  }
}
