class BranchLite {
  final String id;
  final String name;

  BranchLite({required this.id, required this.name});

  factory BranchLite.fromJson(Map<String, dynamic> json) {
    return BranchLite(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
    );
  }
}

class StageLite {
  final String id;
  final String name;

  StageLite({required this.id, required this.name});

  factory StageLite.fromJson(Map<String, dynamic> json) {
    return StageLite(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
    );
  }
}

class EmployeeLite {
  final String id;
  final String fullNameAr;
  final String? fullNameEn;
  final String? employeeNumber;
  final String? maintenanceTeam;

  EmployeeLite({
    required this.id,
    required this.fullNameAr,
    this.fullNameEn,
    this.employeeNumber,
    this.maintenanceTeam,
  });

  factory EmployeeLite.fromJson(Map<String, dynamic> json) {
    return EmployeeLite(
      id: json['id']?.toString() ?? '',
      fullNameAr: json['fullNameAr']?.toString() ?? '',
      fullNameEn: json['fullNameEn']?.toString(),
      employeeNumber: json['employeeNumber']?.toString(),
      maintenanceTeam: json['maintenanceTeam']?.toString(),
    );
  }

  String displayName(String locale) {
    if (locale == 'en' && (fullNameEn?.trim().isNotEmpty ?? false)) return fullNameEn!;
    return fullNameAr;
  }
}

class MaintenanceAccess {
  final bool isAdmin;
  final EmployeeLite? employee;
  final String? maintenanceRole;
  final String? maintenanceTeam;
  final List<String> forwarderBranchIds;

  MaintenanceAccess({
    required this.isAdmin,
    required this.employee,
    required this.maintenanceRole,
    required this.maintenanceTeam,
    required this.forwarderBranchIds,
  });

  factory MaintenanceAccess.fromJson(Map<String, dynamic> json) {
    final empJson = json['employee'];
    return MaintenanceAccess(
      isAdmin: json['isAdmin'] == true,
      employee: empJson is Map<String, dynamic> ? EmployeeLite.fromJson(empJson) : null,
      maintenanceRole: empJson is Map<String, dynamic> ? empJson['maintenanceRole']?.toString() : null,
      maintenanceTeam: empJson is Map<String, dynamic> ? empJson['maintenanceTeam']?.toString() : null,
      forwarderBranchIds: (json['forwarderBranchIds'] as List? ?? []).map((e) => e.toString()).toList(),
    );
  }

  bool get isForwarder => forwarderBranchIds.isNotEmpty;
  bool canReviewBranch(String branchId) => isAdmin || forwarderBranchIds.contains(branchId);
  bool get isManager => isAdmin || maintenanceRole == 'MANAGER';
  bool get isTechnician => isAdmin || maintenanceRole == 'TECHNICIAN';
}

class MaintenanceComment {
  final String id;
  final String comment;
  final bool isInternal;
  final DateTime createdAt;
  final EmployeeLite user;

  MaintenanceComment({
    required this.id,
    required this.comment,
    required this.isInternal,
    required this.createdAt,
    required this.user,
  });

  factory MaintenanceComment.fromJson(Map<String, dynamic> json) {
    return MaintenanceComment(
      id: json['id']?.toString() ?? '',
      comment: json['comment']?.toString() ?? '',
      isInternal: json['isInternal'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      user: EmployeeLite.fromJson((json['user'] as Map).cast<String, dynamic>()),
    );
  }
}

class MaintenanceRequest {
  final String id;
  final String requestNumber;
  final String type;
  final String kind;
  final String category;
  final String priority;
  final String status;
  final String branchId;
  final BranchLite? branch;
  final String? stageId;
  final StageLite? stage;
  final String locationDetails;
  final String description;
  final DateTime createdAt;

  final EmployeeLite? requestedBy;
  final EmployeeLite? assignedTo;

  MaintenanceRequest({
    required this.id,
    required this.requestNumber,
    required this.type,
    required this.kind,
    required this.category,
    required this.priority,
    required this.status,
    required this.branchId,
    required this.branch,
    required this.stageId,
    required this.stage,
    required this.locationDetails,
    required this.description,
    required this.createdAt,
    required this.requestedBy,
    required this.assignedTo,
  });

  factory MaintenanceRequest.fromJson(Map<String, dynamic> json) {
    return MaintenanceRequest(
      id: json['id']?.toString() ?? '',
      requestNumber: json['requestNumber']?.toString() ?? '',
      type: json['type']?.toString() ?? 'BUILDING',
      kind: json['kind']?.toString() ?? 'CORRECTIVE',
      category: json['category']?.toString() ?? '',
      priority: json['priority']?.toString() ?? 'NORMAL',
      status: json['status']?.toString() ?? '',
      branchId: json['branchId']?.toString() ?? (json['branch']?['id']?.toString() ?? ''),
      branch: json['branch'] is Map ? BranchLite.fromJson((json['branch'] as Map).cast<String, dynamic>()) : null,
      stageId: json['stageId']?.toString(),
      stage: json['stage'] is Map ? StageLite.fromJson((json['stage'] as Map).cast<String, dynamic>()) : null,
      locationDetails: json['locationDetails']?.toString() ?? '',
      description: json['description']?.toString() ?? '',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ?? DateTime.now(),
      requestedBy: json['requestedBy'] is Map
          ? EmployeeLite.fromJson((json['requestedBy'] as Map).cast<String, dynamic>())
          : null,
      assignedTo: json['assignedTo'] is Map ? EmployeeLite.fromJson((json['assignedTo'] as Map).cast<String, dynamic>()) : null,
    );
  }
}

class MaintenanceRequestDetails {
  final MaintenanceRequest request;
  final List<MaintenanceComment> comments;

  MaintenanceRequestDetails({required this.request, required this.comments});
}
