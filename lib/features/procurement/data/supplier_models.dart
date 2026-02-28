class SupplierModel {
  final String id;
  final String name;
  final String? contactPerson;
  final String? email;
  final String? phone;
  final String? address;
  final String? category;
  final String? taxNumber;
  final double rating;
  final String? notes;
  final bool isActive;

  SupplierModel({
    required this.id,
    required this.name,
    required this.contactPerson,
    required this.email,
    required this.phone,
    required this.address,
    required this.category,
    required this.taxNumber,
    required this.rating,
    required this.notes,
    required this.isActive,
  });

  factory SupplierModel.fromJson(Map<String, dynamic> json) {
    double numVal(dynamic v) {
      if (v is num) return v.toDouble();
      return double.tryParse(v?.toString() ?? '') ?? 0;
    }

    return SupplierModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      contactPerson: json['contactPerson']?.toString(),
      email: json['email']?.toString(),
      phone: json['phone']?.toString(),
      address: json['address']?.toString(),
      category: json['category']?.toString(),
      taxNumber: json['taxNumber']?.toString(),
      rating: numVal(json['rating']),
      notes: json['notes']?.toString(),
      isActive: json['isActive'] == null ? true : json['isActive'] == true,
    );
  }
}
