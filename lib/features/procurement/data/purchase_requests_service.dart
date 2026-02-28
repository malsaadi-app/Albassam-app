import '../../../core/services/api_service.dart';
import 'purchase_request_models.dart';

class PurchaseRequestsService {
  final ApiService _api;
  PurchaseRequestsService(this._api);

  Future<List<PurchaseRequest>> list({String? status, String? category, String? department}) async {
    final qp = <String, dynamic>{};
    if (status != null && status.isNotEmpty && status != 'ALL') qp['status'] = status;
    if (category != null && category.isNotEmpty && category != 'ALL') qp['category'] = category;
    if (department != null && department.isNotEmpty) qp['department'] = department;

    final res = await _api.get('/procurement/requests', queryParameters: qp);
    final data = (res.data as Map).cast<String, dynamic>();
    final list = (data['requests'] as List? ?? []).cast<dynamic>();
    return list.map((e) => PurchaseRequest.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<PurchaseRequestDetails> getById(String id) async {
    final res = await _api.get('/procurement/requests/$id');
    final data = (res.data as Map).cast<String, dynamic>();
    final req = (data['request'] as Map).cast<String, dynamic>();
    return PurchaseRequestDetails.fromJson(req);
  }

  Future<void> create({
    required String department,
    required String category,
    required List<PurchaseRequestItem> items,
    String priority = 'NORMAL',
    String? justification,
    double? estimatedBudget,
    DateTime? requiredDate,
  }) async {
    final payload = {
      'department': department,
      'category': category,
      'items': items.map((e) => e.toJson()).toList(),
      'priority': priority,
      if (justification != null && justification.trim().isNotEmpty) 'justification': justification.trim(),
      if (estimatedBudget != null) 'estimatedBudget': estimatedBudget,
      if (requiredDate != null) 'requiredDate': requiredDate.toIso8601String(),
    };

    await _api.post('/procurement/requests', data: payload);
  }
}
