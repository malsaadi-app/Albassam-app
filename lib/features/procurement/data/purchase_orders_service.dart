import '../../../core/services/api_service.dart';
import 'purchase_order_models.dart';
import 'quotation_models.dart';

class PurchaseOrdersService {
  final ApiService _api;
  PurchaseOrdersService(this._api);

  Future<List<PurchaseOrder>> list({String? status, String? supplierId, int page = 1, int limit = 20}) async {
    final qp = <String, dynamic>{
      'page': page,
      'limit': limit,
    };
    if (status != null && status.isNotEmpty && status != 'ALL') qp['status'] = status;
    if (supplierId != null && supplierId.isNotEmpty) qp['supplierId'] = supplierId;

    final res = await _api.get('/procurement/purchase-orders', queryParameters: qp);
    final data = (res.data as Map).cast<String, dynamic>();
    final list = (data['orders'] as List? ?? []).cast<dynamic>();
    return list.map((e) => PurchaseOrder.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<PurchaseOrder> getById(String id) async {
    final res = await _api.get('/procurement/purchase-orders/$id');
    final data = (res.data as Map).cast<String, dynamic>();
    return PurchaseOrder.fromJson(data);
  }

  Future<List<Supplier>> suppliers() async {
    final res = await _api.get('/procurement/suppliers');
    final data = (res.data as Map).cast<String, dynamic>();
    final list = (data['suppliers'] as List? ?? []).cast<dynamic>();
    return list.map((e) => Supplier.fromJson((e as Map).cast<String, dynamic>())).toList();
  }

  Future<void> create({
    required String supplierId,
    required List<PurchaseOrderItem> items,
    DateTime? expectedDelivery,
    double tax = 15,
    double discount = 0,
    String? paymentTerms,
    String? deliveryTerms,
    String? notes,
  }) async {
    final totalAmount = items.fold<double>(0, (sum, i) => sum + i.totalPrice);
    final taxAmount = (totalAmount * tax) / 100;
    final finalAmount = totalAmount + taxAmount - discount;

    final payload = {
      'supplierId': supplierId,
      'expectedDelivery': expectedDelivery?.toIso8601String(),
      'paymentTerms': paymentTerms ?? '',
      'deliveryTerms': deliveryTerms ?? '',
      'notes': notes ?? '',
      'tax': tax,
      'discount': discount,
      'items': items.map((e) => e.toJson()).toList(),
      'totalAmount': totalAmount,
      'finalAmount': finalAmount,
    };

    await _api.post('/procurement/purchase-orders', data: payload);
  }
}
