import '../../../core/services/api_service.dart';
import 'supplier_models.dart';

class SuppliersService {
  final ApiService _api;
  SuppliersService(this._api);

  Future<List<SupplierModel>> list({String? search, String? category, bool? isActive}) async {
    final qp = <String, dynamic>{};
    if (search != null && search.trim().isNotEmpty) qp['search'] = search.trim();
    if (category != null && category.trim().isNotEmpty) qp['category'] = category.trim();
    if (isActive != null) qp['isActive'] = isActive;

    final res = await _api.get('/procurement/suppliers', queryParameters: qp);
    final data = (res.data as Map).cast<String, dynamic>();
    final list = (data['suppliers'] as List? ?? []).cast<dynamic>();
    return list.map((e) => SupplierModel.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<SupplierModel> getById(String id) async {
    final res = await _api.get('/procurement/suppliers/$id');
    final data = (res.data as Map).cast<String, dynamic>();
    final s = (data['supplier'] as Map).cast<String, dynamic>();
    return SupplierModel.fromJson(s);
  }

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
    bool isActive = true,
  }) async {
    final payload = <String, dynamic>{
      'name': name,
      'isActive': isActive,
      if (contactPerson != null) 'contactPerson': contactPerson,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      if (address != null) 'address': address,
      if (category != null) 'category': category,
      if (taxNumber != null) 'taxNumber': taxNumber,
      if (rating != null) 'rating': rating,
      if (notes != null) 'notes': notes,
    };

    await _api.post('/procurement/suppliers', data: payload);
  }

  Future<void> update(String id, {
    String? name,
    String? contactPerson,
    String? email,
    String? phone,
    String? address,
    String? category,
    String? taxNumber,
    double? rating,
    String? notes,
    bool? isActive,
  }) async {
    final payload = <String, dynamic>{
      if (name != null) 'name': name,
      if (contactPerson != null) 'contactPerson': contactPerson,
      if (email != null) 'email': email,
      if (phone != null) 'phone': phone,
      if (address != null) 'address': address,
      if (category != null) 'category': category,
      if (taxNumber != null) 'taxNumber': taxNumber,
      if (rating != null) 'rating': rating,
      if (notes != null) 'notes': notes,
      if (isActive != null) 'isActive': isActive,
    };

    await _api.put('/procurement/suppliers/$id', data: payload);
  }

  Future<void> deactivate(String id) async {
    await _api.delete('/procurement/suppliers/$id');
  }
}
