import '../../../core/services/api_service.dart';
import 'goods_receipt_models.dart';

class GoodsReceiptsService {
  final ApiService _api;
  GoodsReceiptsService(this._api);

  Future<List<GoodsReceipt>> list({String? purchaseOrderId, String? status}) async {
    final qp = <String, dynamic>{};
    if (purchaseOrderId != null && purchaseOrderId.isNotEmpty) qp['purchaseOrderId'] = purchaseOrderId;
    if (status != null && status.isNotEmpty && status != 'ALL') qp['status'] = status;

    final res = await _api.get('/procurement/goods-receipts', queryParameters: qp);
    final data = (res.data as Map).cast<String, dynamic>();
    final list = (data['receipts'] as List? ?? []).cast<dynamic>();
    return list.map((e) => GoodsReceipt.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<GoodsReceipt> getById(String id) async {
    final res = await _api.get('/procurement/goods-receipts/$id');
    final data = (res.data as Map).cast<String, dynamic>();
    final r = (data['receipt'] as Map).cast<String, dynamic>();
    return GoodsReceipt.fromJson(r);
  }

  Future<void> create({
    required String purchaseOrderId,
    required String receivedBy,
    required List<GoodsReceiptItem> items,
    bool qualityCheck = false,
    String? qualityNotes,
    String? notes,
  }) async {
    final payload = {
      'purchaseOrderId': purchaseOrderId,
      'receivedBy': receivedBy,
      'items': items.map((e) => e.toJson()).toList(),
      'qualityCheck': qualityCheck,
      if (qualityNotes != null && qualityNotes.trim().isNotEmpty) 'qualityNotes': qualityNotes.trim(),
      if (notes != null && notes.trim().isNotEmpty) 'notes': notes.trim(),
    };

    await _api.post('/procurement/goods-receipts', data: payload);
  }

  Future<void> update(String id, {
    String? status,
    bool? qualityCheck,
    String? qualityNotes,
    String? notes,
  }) async {
    final payload = <String, dynamic>{
      if (status != null) 'status': status,
      if (qualityCheck != null) 'qualityCheck': qualityCheck,
      if (qualityNotes != null) 'qualityNotes': qualityNotes,
      if (notes != null) 'notes': notes,
    };

    await _api.put('/procurement/goods-receipts/$id', data: payload);
  }
}
