import '../../../core/services/api_service.dart';
import 'quotation_models.dart';

class QuotationsService {
  final ApiService _api;
  QuotationsService(this._api);

  Future<List<Quotation>> list({String? status, String? purchaseRequestId, String? supplierId}) async {
    final qp = <String, dynamic>{};
    if (status != null && status.isNotEmpty && status != 'ALL') qp['status'] = status;
    if (purchaseRequestId != null && purchaseRequestId.isNotEmpty) qp['purchaseRequestId'] = purchaseRequestId;
    if (supplierId != null && supplierId.isNotEmpty) qp['supplierId'] = supplierId;

    final res = await _api.get('/procurement/quotations', queryParameters: qp);
    final data = (res.data as Map).cast<String, dynamic>();
    final list = (data['quotations'] as List? ?? []).cast<dynamic>();
    return list.map((e) => Quotation.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<Quotation> getById(String id) async {
    final res = await _api.get('/procurement/quotations/$id');
    final data = (res.data as Map).cast<String, dynamic>();
    final q = (data['quotation'] as Map).cast<String, dynamic>();
    return Quotation.fromJson(q);
  }

  Future<List<Supplier>> suppliers() async {
    final res = await _api.get('/procurement/suppliers');
    final data = (res.data as Map).cast<String, dynamic>();
    final list = (data['suppliers'] as List? ?? []).cast<dynamic>();
    return list.map((e) => Supplier.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<void> create({
    required String purchaseRequestId,
    required String supplierId,
    required List<QuotedItem> quotedItems,
    required double totalAmount,
    DateTime? validUntil,
    String? paymentTerms,
    String? deliveryTime,
    String? notes,
  }) async {
    final payload = {
      'purchaseRequestId': purchaseRequestId,
      'supplierId': supplierId,
      'quotedItems': quotedItems.map((e) => e.toJson()).toList(),
      'totalAmount': totalAmount,
      if (validUntil != null) 'validUntil': validUntil.toIso8601String(),
      if (paymentTerms != null && paymentTerms.trim().isNotEmpty) 'paymentTerms': paymentTerms.trim(),
      if (deliveryTime != null && deliveryTime.trim().isNotEmpty) 'deliveryTime': deliveryTime.trim(),
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
    };

    await _api.post('/procurement/quotations', data: payload);
  }
}
