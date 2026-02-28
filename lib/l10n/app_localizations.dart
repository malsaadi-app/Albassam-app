import 'package:flutter/material.dart';
import 'app_localizations_ar.dart';
import 'app_localizations_en.dart';

abstract class AppLocalizations {
  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations)!;
  }
  
  static const LocalizationsDelegate<AppLocalizations> delegate = _AppLocalizationsDelegate();
  
  // App
  String get appName;
  
  // Auth
  String get login;
  String get logout;
  String get username;
  String get password;
  String get welcome;
  String get loginSuccess;
  String get loginFailed;
  String get invalidCredentials;
  
  // Navigation
  String get attendance;
  String get hr;

  // HR
  String get requestType;
  String get startDate;
  String get endDate;
  String get leaveType;
  String get destination;
  String get travelDate;
  String get departureDate;
  String get returnDate;
  String get amount;
  String get period;
  String get purpose;
  String get reason;
  String get hrRequestsTitle;
  String get filterByStatus;
  String get all;
  String get pendingReview;
  String get approved;
  String get rejected;
  String get noRequests;
  String get procurement;
  String get purchaseRequestsTitle;
  String get newPurchaseRequestTitle;
  String get department;
  String get category;
  String get priority;
  String get status;
  String get requiredDate;
  String get estimatedBudget;
  String get justification;
  String get items;
  String get item;
  String get itemName;
  String get quantity;
  String get unit;
  String get specifications;
  String get createdAt;

  // Quotations
  String get quotationsTitle;
  String get purchaseOrdersTitle;
  String get newPurchaseOrderTitle;
  String get expectedDelivery;
  String get deliveryTerms;
  String get tax;
  String get discount;
  String get finalAmount;
  String get newQuotationTitle;
  String get purchaseRequest;
  String get supplier;
  String get totalAmount;
  String get validUntil;
  String get paymentTerms;
  String get deliveryTime;
  String get notes;
  String get unitPrice;
  String get totalPrice;

  // Goods receipts
  String get goodsReceiptsTitle;
  String get suppliersTitle;
  String get newGoodsReceiptTitle;
  String get purchaseOrder;
  String get receivedBy;
  String get orderedQty;
  String get receivedQty;
  String get condition;
  String get qualityCheck;
  String get qualityNotes;

  // Purchase status
  String get statusPendingReview;
  String get statusReviewed;
  String get statusApproved;
  String get statusRejected;
  String get statusInProgress;
  String get statusCompleted;
  String get statusCancelled;
  String get newRequest;
  String get maintenance;
  String get approvals;

  // Maintenance
  String get maintenanceRequestsTitle;
  String get openMaintenanceRequests;
  String get newMaintenanceRequest;
  String get maintenanceRequest;
  String get maintenanceType;
  String get maintenanceTypeBuilding;
  String get maintenanceTypeElectronics;
  String get maintenanceStatusSubmitted;
  String get maintenanceStatusUnderReview;
  String get maintenanceStatusAssigned;
  String get maintenanceStatusCompleted;
  String get maintenanceStatusRejected;
  String get branch;
  String get stage;
  String get stageOptional;
  String get locationDetails;
  String get approve;
  String get reject;
  String get assignTechnician;
  String get noTechnicians;
  String get markCompleted;
  String get completionNotes;
  String get writeCompletionNotes;
  String get comments;
  String get noComments;
  String get comment;
  String get internalComment;
  String get writeComment;
  String get rejectionReason;
  String get writeRejectionReason;
  String get saved;
  String get low;
  String get medium;
  String get high;
  String get urgent;
  String get requiredFields;
  String get requestCreated;
  String get details;
  
  // Common
  String get today;
  String get submit;
  String get cancel;
  String get save;
  String get delete;
  String get edit;
  String get search;
  String get loading;
  String get error;
  String get success;
  String get noData;
  String get retry;
  
  // Attendance
  String get checkIn;
  String get checkOut;
  String get checkInSuccess;
  String get checkOutSuccess;
  String get checkInError;
  String get checkOutError;

  // Messages
  String get networkError;
  String get serverError;
  String get unknownError;
}

class _AppLocalizationsDelegate extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();
  
  @override
  bool isSupported(Locale locale) {
    return ['ar', 'en'].contains(locale.languageCode);
  }
  
  @override
  Future<AppLocalizations> load(Locale locale) async {
    switch (locale.languageCode) {
      case 'ar':
        return AppLocalizationsAr();
      case 'en':
        return AppLocalizationsEn();
      default:
        return AppLocalizationsAr(); // Default to Arabic
    }
  }
  
  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}
