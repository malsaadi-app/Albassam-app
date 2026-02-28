class HRRequest {
  final String id;
  final String type;
  final String status;
  final DateTime createdAt;
  final String? employeeName;

  HRRequest({
    required this.id,
    required this.type,
    required this.status,
    required this.createdAt,
    this.employeeName,
  });

  factory HRRequest.fromJson(Map<String, dynamic> json) {
    final emp = json['employee'] as Map<String, dynamic>?;
    return HRRequest(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      status: json['status']?.toString() ?? '',
      createdAt: DateTime.parse(json['createdAt'] as String),
      employeeName: emp?['displayName']?.toString(),
    );
  }
}
