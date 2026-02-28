import '../../../core/services/api_service.dart';
import 'attendance_models.dart';

class AttendanceService {
  final ApiService _api;

  AttendanceService(this._api);

  Future<List<AttendanceRecord>> getRecords({String? date}) async {
    final res = await _api.get('/attendance', queryParams: date != null ? {'date': date} : null);
    final data = (res.data as Map).cast<String, dynamic>();
    final records = (data['records'] as List? ?? []).cast<dynamic>();
    return records.map((e) => AttendanceRecord.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<Map<String, dynamic>> checkIn({required String location}) async {
    final res = await _api.post('/attendance', data: {
      'action': 'check-in',
      'location': location,
    });
    return (res.data as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> checkOut({required String location}) async {
    final res = await _api.post('/attendance', data: {
      'action': 'check-out',
      'location': location,
    });
    return (res.data as Map).cast<String, dynamic>();
  }

  static String formatLocation(double lat, double lng) => '${lat.toStringAsFixed(6)},${lng.toStringAsFixed(6)}';
}
