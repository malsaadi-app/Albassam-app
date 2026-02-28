class PendingApprovalItem {
  final String id;
  final String type; // hr_request | purchase_request | purchase_order | supplier_request | maintenance_request | finance_request | petty_cash_settlement | petty_cash_topup
  final String title;
  final String submittedBy;
  final DateTime submittedAt;
  final String status;
  final String action;
  final String url;

  PendingApprovalItem({
    required this.id,
    required this.type,
    required this.title,
    required this.submittedBy,
    required this.submittedAt,
    required this.status,
    required this.action,
    required this.url,
  });

  factory PendingApprovalItem.fromJson(Map<String, dynamic> json) {
    return PendingApprovalItem(
      id: json['id']?.toString() ?? '',
      type: json['type']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      submittedBy: json['submittedBy']?.toString() ?? '',
      submittedAt: DateTime.parse(json['submittedAt'] as String),
      status: json['status']?.toString() ?? '',
      action: json['action']?.toString() ?? '',
      url: json['url']?.toString() ?? '',
    );
  }
}
