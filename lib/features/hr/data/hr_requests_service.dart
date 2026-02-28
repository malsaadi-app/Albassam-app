import '../../../core/services/api_service.dart';
import 'hr_request_models.dart';

class HRRequestsService {
  final ApiService _api;
  HRRequestsService(this._api);

  Future<List<HRRequest>> list({String? status, int page = 1, int limit = 20}) async {
    final qp = <String, dynamic>{
      'page': page.toString(),
      'limit': limit.toString(),
    };
    if (status != null && status.isNotEmpty) qp['status'] = status;

    final res = await _api.get('/hr/requests', queryParams: qp);
    final data = (res.data as Map).cast<String, dynamic>();
    final items = (data['requests'] as List? ?? []).cast<dynamic>();
    return items.map((e) => HRRequest.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<Map<String, dynamic>> getById(String id) async {
    final res = await _api.get('/hr/requests/$id');
    return (res.data as Map).cast<String, dynamic>();
  }
}
