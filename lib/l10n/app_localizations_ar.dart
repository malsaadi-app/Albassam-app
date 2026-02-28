import 'app_localizations.dart';

class AppLocalizationsAr extends AppLocalizations {
  @override
  String get appName => 'منصة مجموعة البسام';
  
  // Auth
  @override
  String get login => 'تسجيل الدخول';
  
  @override
  String get logout => 'تسجيل الخروج';
  
  @override
  String get username => 'اسم المستخدم';
  
  @override
  String get password => 'كلمة المرور';
  
  @override
  String get welcome => 'مرحباً';
  
  @override
  String get loginSuccess => 'تم تسجيل الدخول بنجاح';
  
  @override
  String get loginFailed => 'فشل تسجيل الدخول';
  
  @override
  String get invalidCredentials => 'اسم المستخدم أو كلمة المرور غير صحيحة';
  
  // Navigation
  @override
  String get attendance => 'الحضور';
  
  @override
  String get hr => 'الموارد البشرية';

  @override
  String get requestType => 'نوع الطلب';

  @override
  String get startDate => 'من';

  @override
  String get endDate => 'إلى';

  @override
  String get leaveType => 'نوع الإجازة';

  @override
  String get destination => 'الوجهة';

  @override
  String get travelDate => 'تاريخ السفر';

  @override
  String get departureDate => 'تاريخ المغادرة';

  @override
  String get returnDate => 'تاريخ العودة';

  @override
  String get amount => 'المبلغ';

  @override
  String get period => 'المدة';

  @override
  String get purpose => 'الغرض';

  @override
  String get reason => 'السبب';

  @override
  String get hrRequestsTitle => 'طلبات الموارد البشرية';

  @override
  String get filterByStatus => 'تصفية حسب الحالة';

  @override
  String get all => 'الكل';

  @override
  String get pendingReview => 'قيد المراجعة';

  @override
  String get approved => 'موافق عليها';

  @override
  String get rejected => 'مرفوضة';

  @override
  String get noRequests => 'لا توجد طلبات';
  
  @override
  String get procurement => 'المشتريات';

  // Procurement
  @override
  String get purchaseRequestsTitle => 'طلبات الشراء';

  @override
  String get newPurchaseRequestTitle => 'طلب شراء جديد';

  @override
  String get department => 'القسم';

  @override
  String get category => 'الفئة';

  @override
  String get priority => 'الأولوية';

  @override
  String get status => 'الحالة';

  @override
  String get requiredDate => 'تاريخ الحاجة';

  @override
  String get estimatedBudget => 'الميزانية التقديرية';

  @override
  String get justification => 'مبررات الطلب';

  @override
  String get items => 'الأصناف';

  @override
  String get item => 'صنف';

  @override
  String get itemName => 'اسم الصنف';

  @override
  String get quantity => 'الكمية';

  @override
  String get unit => 'الوحدة';

  @override
  String get specifications => 'المواصفات';

  @override
  String get createdAt => 'تاريخ الإنشاء';

  @override
  String get statusPendingReview => 'قيد المراجعة';

  @override
  String get statusReviewed => 'تمت المراجعة';

  @override
  String get statusApproved => 'موافق عليه';

  @override
  String get statusRejected => 'مرفوض';

  @override
  String get statusInProgress => 'قيد التنفيذ';

  @override
  String get statusCompleted => 'مكتمل';

  @override
  String get statusCancelled => 'ملغي';

  @override
  String get quotationsTitle => 'عروض الأسعار';

  @override
  String get newQuotationTitle => 'عرض سعر جديد';

  @override
  String get purchaseRequest => 'طلب الشراء';

  @override
  String get supplier => 'المورد';

  @override
  String get totalAmount => 'الإجمالي';

  @override
  String get validUntil => 'صالح حتى';

  @override
  String get paymentTerms => 'شروط الدفع';

  @override
  String get deliveryTime => 'مدة التوريد';

  @override
  String get notes => 'ملاحظات';

  @override
  String get unitPrice => 'سعر الوحدة';

  @override
  String get totalPrice => 'الإجمالي للصنف';

  @override
  String get purchaseOrdersTitle => 'أوامر الشراء';

  @override
  String get newPurchaseOrderTitle => 'أمر شراء جديد';

  @override
  String get expectedDelivery => 'التسليم المتوقع';

  @override
  String get deliveryTerms => 'شروط التسليم';

  @override
  String get tax => 'الضريبة';

  @override
  String get discount => 'الخصم';

  @override
  String get finalAmount => 'الإجمالي النهائي';

  @override
  String get goodsReceiptsTitle => 'سندات الاستلام';

  @override
  String get suppliersTitle => 'الموردين';

  @override
  String get newGoodsReceiptTitle => 'سند استلام جديد';

  @override
  String get purchaseOrder => 'أمر الشراء';

  @override
  String get receivedBy => 'مستلم البضاعة';

  @override
  String get orderedQty => 'الكمية المطلوبة';

  @override
  String get receivedQty => 'الكمية المستلمة';

  @override
  String get condition => 'الحالة';

  @override
  String get qualityCheck => 'فحص الجودة';

  @override
  String get qualityNotes => 'ملاحظات الجودة';

  @override
  String get newRequest => 'طلب جديد';
  
  @override
  String get maintenance => 'الصيانة';
  
  @override
  String get approvals => 'الموافقات';

  // Maintenance
  @override
  String get maintenanceRequestsTitle => 'طلبات الصيانة';
  @override
  String get openMaintenanceRequests => 'عرض وإدارة طلبات الصيانة';
  @override
  String get newMaintenanceRequest => 'طلب صيانة جديد';
  @override
  String get maintenanceRequest => 'طلب صيانة';
  @override
  String get maintenanceType => 'نوع الصيانة';
  @override
  String get maintenanceTypeBuilding => 'مباني';
  @override
  String get maintenanceTypeElectronics => 'إلكترونيات';
  @override
  String get maintenanceStatusSubmitted => 'مرفوع للفرع';
  @override
  String get maintenanceStatusUnderReview => 'تحت المراجعة';
  @override
  String get maintenanceStatusAssigned => 'تم التعيين';
  @override
  String get maintenanceStatusCompleted => 'مكتمل';
  @override
  String get maintenanceStatusRejected => 'مرفوض';
  @override
  String get branch => 'الفرع';
  @override
  String get stage => 'المرحلة';
  @override
  String get stageOptional => 'المرحلة (اختياري)';
  @override
  String get locationDetails => 'تفاصيل الموقع';
  @override
  String get approve => 'اعتماد';
  @override
  String get reject => 'رفض';
  @override
  String get assignTechnician => 'تعيين فني';
  @override
  String get noTechnicians => 'لا يوجد فنيين متاحين';
  @override
  String get markCompleted => 'وضع كمكتمل';
  @override
  String get completionNotes => 'ملاحظات الإنهاء';
  @override
  String get writeCompletionNotes => 'اكتب ملاحظات الإنهاء هنا...';
  @override
  String get comments => 'التعليقات';
  @override
  String get noComments => 'لا توجد تعليقات';
  @override
  String get comment => 'تعليق';
  @override
  String get internalComment => 'تعليق داخلي';
  @override
  String get writeComment => 'اكتب تعليقك هنا...';
  @override
  String get rejectionReason => 'سبب الرفض';
  @override
  String get writeRejectionReason => 'اكتب سبب الرفض هنا...';
  @override
  String get saved => 'تم الحفظ';
  @override
  String get low => 'منخفض';
  @override
  String get medium => 'متوسط';
  @override
  String get high => 'عالي';
  @override
  String get urgent => 'عاجل';
  @override
  String get requiredFields => 'يرجى تعبئة الحقول المطلوبة';
  @override
  String get requestCreated => 'تم إنشاء الطلب بنجاح';
  @override
  String get details => 'التفاصيل';
  
  // Common
  @override
  String get today => 'اليوم';

  @override
  String get submit => 'إرسال';
  
  @override
  String get cancel => 'إلغاء';
  
  @override
  String get save => 'حفظ';
  
  @override
  String get delete => 'حذف';
  
  @override
  String get edit => 'تعديل';
  
  @override
  String get search => 'بحث';
  
  @override
  String get loading => 'جاري التحميل...';

  @override
  String get checkIn => 'تسجيل حضور';

  @override
  String get checkOut => 'تسجيل انصراف';

  @override
  String get checkInSuccess => 'تم تسجيل الحضور بنجاح';

  @override
  String get checkOutSuccess => 'تم تسجيل الانصراف بنجاح';

  @override
  String get checkInError => 'حدث خطأ أثناء تسجيل الحضور';

  @override
  String get checkOutError => 'حدث خطأ أثناء تسجيل الانصراف';
  
  @override
  String get error => 'خطأ';
  
  @override
  String get success => 'نجح';
  
  @override
  String get noData => 'لا توجد بيانات';
  
  @override
  String get retry => 'إعادة المحاولة';
  
  // Messages
  @override
  String get networkError => 'خطأ في الاتصال بالشبكة';
  
  @override
  String get serverError => 'خطأ في الخادم';
  
  @override
  String get unknownError => 'حدث خطأ غير معروف';
}
