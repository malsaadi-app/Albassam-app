import '../../../core/services/api_service.dart';
import 'approval_models.dart';

class ApprovalsService {
  final ApiService _api;
  ApprovalsService(this._api);

  Future<List<PendingApprovalItem>> pending() async {
    final res = await _api.get('/dashboard/pending-approvals');
    final data = (res.data as Map).cast<String, dynamic>();
    final approvals = (data['approvals'] as List? ?? []).cast<dynamic>();
    return approvals
        .map((e) => PendingApprovalItem.fromJson((e as Map).cast<String, dynamic>()))
        .toList();
  }

  Future<void> approveHR(String id, {String? comment}) async {
    await _api.post('/hr/requests/$id/process-step', data: {
      'action': 'approve',
      if (comment != null && comment.trim().isNotEmpty) 'comment': comment.trim(),
    });
  }

  Future<void> rejectHR(String id, {String? comment}) async {
    await _api.post('/hr/requests/$id/process-step', data: {
      'action': 'reject',
      if (comment != null && comment.trim().isNotEmpty) 'comment': comment.trim(),
    });
  }

  Future<void> reviewPurchaseRequest(String id, {String? notes}) async {
    await _api.post('/procurement/requests/$id/review', data: {
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
    });
  }

  Future<void> approvePurchaseRequest(String id, {String? notes}) async {
    await _api.post('/procurement/requests/$id/approve', data: {
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
    });
  }

  Future<void> rejectPurchaseRequest(String id, {String? reason}) async {
    await _api.post('/procurement/requests/$id/reject', data: {
      // API expects `reason` (required)
      'reason': (reason == null || reason.trim().isEmpty) ? 'Rejected from mobile' : reason.trim(),
    });
  }

  Future<void> approveSupplierRequest(String id) async {
    await _api.post('/procurement/supplier-requests/$id/approve');
  }

  Future<void> rejectSupplierRequest(String id, {String? reason}) async {
    await _api.post('/procurement/supplier-requests/$id/reject', data: {
      if (reason != null && reason.trim().isNotEmpty) 'reason': reason.trim(),
    });
  }

  Future<void> approveMaintenance(String id, {String? comment}) async {
    await _api.post('/maintenance/requests/$id/branch-review', data: {
      'action': 'approve',
      if (comment != null && comment.trim().isNotEmpty) 'comment': comment.trim(),
    });
  }

  Future<void> rejectMaintenance(String id, {String? comment}) async {
    await _api.post('/maintenance/requests/$id/branch-review', data: {
      'action': 'reject',
      if (comment != null && comment.trim().isNotEmpty) 'comment': comment.trim(),
    });
  }
}
