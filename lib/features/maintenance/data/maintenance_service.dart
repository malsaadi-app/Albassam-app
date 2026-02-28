import '../../../core/services/api_service.dart';
import 'maintenance_models.dart';

class MaintenanceService {
  final ApiService _api;
  MaintenanceService(this._api);

  Future<MaintenanceAccess> getAccess() async {
    final res = await _api.get('/maintenance/access');
    final data = (res.data as Map).cast<String, dynamic>();
    return MaintenanceAccess.fromJson(data);
  }

  Future<List<MaintenanceRequest>> list({String? status, String? type, String? priority, String? branchId, String? q}) async {
    final qp = <String, dynamic>{};
    if (status != null && status.isNotEmpty && status != 'ALL') qp['status'] = status;
    if (type != null && type.isNotEmpty && type != 'ALL') qp['type'] = type;
    if (priority != null && priority.isNotEmpty && priority != 'ALL') qp['priority'] = priority;
    if (branchId != null && branchId.isNotEmpty) qp['branchId'] = branchId;
    if (q != null && q.trim().isNotEmpty) qp['q'] = q.trim();

    final res = await _api.get('/maintenance/requests', queryParameters: qp);
    final data = (res.data as Map).cast<String, dynamic>();
    final list = (data['requests'] as List? ?? []).cast<dynamic>();
    return list.map((e) => MaintenanceRequest.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<MaintenanceRequestDetails> getById(String id) async {
    final res = await _api.get('/maintenance/requests/$id');
    final data = (res.data as Map).cast<String, dynamic>();
    final req = MaintenanceRequest.fromJson((data['request'] as Map).cast<String, dynamic>());
    final commentsRaw = ((data['request'] as Map)['comments'] as List? ?? []).cast<dynamic>();
    final comments = commentsRaw.map((e) => MaintenanceComment.fromJson((e as Map).cast<String, dynamic>())).toList();
    return MaintenanceRequestDetails(request: req, comments: comments);
  }

  Future<List<BranchLite>> listBranches() async {
    final res = await _api.get('/branches');
    final data = (res.data as Map).cast<String, dynamic>();
    final list = (data['branches'] as List? ?? []).cast<dynamic>();
    return list.map((e) => BranchLite.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<List<StageLite>> listStages({String? branchId}) async {
    final qp = <String, dynamic>{};
    if (branchId != null && branchId.isNotEmpty) qp['branchId'] = branchId;
    final res = await _api.get('/stages', queryParameters: qp);
    final data = (res.data as Map).cast<String, dynamic>();
    final list = (data['stages'] as List? ?? []).cast<dynamic>();
    return list.map((e) => StageLite.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<void> createRequest({
    required String type,
    required String category,
    required String branchId,
    String? stageId,
    required String locationDetails,
    required String description,
    String kind = 'CORRECTIVE',
    String priority = 'NORMAL',
  }) async {
    final payload = {
      'type': type,
      'kind': kind,
      'category': category,
      'priority': priority,
      'branchId': branchId,
      'stageId': stageId,
      'locationDetails': locationDetails,
      'description': description,
    };
    await _api.post('/maintenance/requests', data: payload);
  }

  Future<void> branchReview(String requestId, {required String action, String? comment}) async {
    final payload = {
      'action': action,
      if (comment != null) 'comment': comment,
    };
    await _api.post('/maintenance/requests/$requestId/branch-review', data: payload);
  }

  Future<List<EmployeeLite>> listTechnicians({String? q}) async {
    final qp = <String, dynamic>{};
    if (q != null && q.trim().isNotEmpty) qp['q'] = q.trim();

    final res = await _api.get('/maintenance/technicians', queryParameters: qp);
    final data = (res.data as Map).cast<String, dynamic>();
    final list = (data['technicians'] as List? ?? []).cast<dynamic>();
    return list.map((e) => EmployeeLite.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<void> assign(String requestId, {required String technicianEmployeeId, String? notes}) async {
    final payload = {
      'assignedToId': technicianEmployeeId,
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
    };
    await _api.post('/maintenance/requests/$requestId/assign', data: payload);
  }

  Future<void> complete(String requestId, {double? laborHours, String? notes}) async {
    final payload = <String, dynamic>{};
    if (laborHours != null) payload['laborHours'] = laborHours;
    if (notes != null && notes.trim().isNotEmpty) payload['notes'] = notes.trim();
    await _api.post('/maintenance/requests/$requestId/complete', data: payload);
  }

  Future<void> addComment(String requestId, {required String comment, bool isInternal = false}) async {
    await _api.post('/maintenance/requests/$requestId/comments', data: {
      'comment': comment,
      'isInternal': isInternal,
    });
  }

  Future<List<MaintenanceComment>> getComments(String requestId) async {
    final res = await _api.get('/maintenance/requests/$requestId/comments');
    final data = (res.data as Map).cast<String, dynamic>();
    final list = (data['comments'] as List? ?? []).cast<dynamic>();
    return list.map((e) => MaintenanceComment.fromJson((e as Map).cast<String, dynamic>())).toList();
  }
}
