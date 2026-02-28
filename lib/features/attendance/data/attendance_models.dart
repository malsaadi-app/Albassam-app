class AttendanceRecord {
  final String id;
  final DateTime date;
  final DateTime checkIn;
  final DateTime? checkOut;
  final double? workHours;
  final String? status;
  final String? branchName;

  AttendanceRecord({
    required this.id,
    required this.date,
    required this.checkIn,
    this.checkOut,
    this.workHours,
    this.status,
    this.branchName,
  });

  factory AttendanceRecord.fromJson(Map<String, dynamic> json) {
    final branch = json['branch'] as Map<String, dynamic>?;
    return AttendanceRecord(
      id: json['id']?.toString() ?? '',
      date: DateTime.parse(json['date'] as String),
      checkIn: DateTime.parse(json['checkIn'] as String),
      checkOut: json['checkOut'] != null ? DateTime.parse(json['checkOut'] as String) : null,
      workHours: (json['workHours'] is num) ? (json['workHours'] as num).toDouble() : null,
      status: json['status']?.toString(),
      branchName: branch?['name']?.toString(),
    );
  }
}
