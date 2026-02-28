import '../../../core/services/api_service.dart';

class SupplierRequestModel {
  final String id;
  final String status;
  final String name;
  final String? contactPerson;
  final String? email;
  final String? phone;
  final String? category;
  final String? taxNumber;
  final double rating;
  final String? notes;

  final Map<String, dynamic>? requestedBy;
  final DateTime createdAt;

  SupplierRequestModel({
    required this.id,
    required this.status,
    required this.name,
    required this.contactPerson,
    required this.email,
    required this.phone,
    required this.category,
    required this.taxNumber,
    required this.rating,
    required this.notes,
    required this.requestedBy,
    required this.createdAt,
  });

  factory SupplierRequestModel.fromJson(Map<String, dynamic> json) {
    double numVal(dynamic v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '') ?? 0;
    }

    return SupplierRequestModel(
      id: json['id']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      contactPerson: json['contactPerson']?.toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      category: json['category']?.toString(),
      taxNumber: json['taxNumber']?.toString(),
      rating: numVal(json['rating']),
      notes: json['notes']?.toString(),
      requestedBy: json['requestedBy'] is Map ? (json['requestedBy'] as Map).cast<String, dynamic>() : null,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class SupplierRequestsService {
  final ApiService _api;
  SupplierRequestsService(this._api);

  Future<void> create({
    required String name,
    String? contactPerson,
    String? email,
    String? phone,
    String? address,
    String? category,
    String? taxNumber,
    double? rating,
    String? notes,
  }) async {
    final payload = <String, dynamic>{
      'name': name,
      if (contactPerson != null) 'contactPerson': contactPerson,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      if (address != null) 'address': address,
      if (category != null) 'category': category,
      if (taxNumber != null) 'taxNumber': taxNumber,
      if (rating != null) 'rating': rating,
      if (notes != null) 'notes': notes,
    };

    await _api.post('/procurement/supplier-requests', data: payload);
  }

  Future<List<SupplierRequestModel>> list({String? status}) async {
    final qp = <String, dynamic>{};
    if (status != null && status.trim().isNotEmpty && status != 'ALL') qp['status'] = status;

    final res = await _api.get('/procurement/supplier-requests', queryParameters: qp);
    final data = (res.data as Map).cast<String, dynamic>();
    final list = (data['requests'] as List? ?? []).cast<dynamic>();
    return list.map((e) => SupplierRequestModel.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<void> approve(String id) async {
    await _api.post('/procurement/supplier-requests/$id/approve');
  }

  Future<void> reject(String id, {String? reason}) async {
    await _api.post('/procurement/supplier-requests/$id/reject', data: {
      if (reason != null && reason.trim().isNotEmpty) 'reason': reason.trim(),
    });
  }
}
