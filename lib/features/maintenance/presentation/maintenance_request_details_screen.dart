import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/maintenance_models.dart';
import '../data/maintenance_service.dart';

class MaintenanceRequestDetailsScreen extends StatefulWidget {
  final String requestId;
  final String locale;

  const MaintenanceRequestDetailsScreen({super.key, required this.requestId, required this.locale});

  @override
  State<MaintenanceRequestDetailsScreen> createState() => _MaintenanceRequestDetailsScreenState();
}

class _MaintenanceRequestDetailsScreenState extends State<MaintenanceRequestDetailsScreen> {
  late final MaintenanceService _svc;

  bool _loading = true;
  MaintenanceAccess? _access;
  MaintenanceRequestDetails? _details;

  @override
  void initState() {
    super.initState();
    _svc = MaintenanceService(ApiService());
    _load();
  }

  Future<void> _load() async {
    try {
      setState(() => _loading = true);
      final access = await _svc.getAccess();
      final details = await _svc.getById(widget.requestId);
      setState(() {
        _access = access;
        _details = details;
      });
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _branchApproveReject({required bool approve}) async {
    final l10n = AppLocalizations.of(context);
    String? reason;

    if (!approve) {
      reason = await _askText(title: l10n.rejectionReason, hint: l10n.writeRejectionReason);
      if (reason == null || reason.trim().isEmpty) return;
    }

    try {
      await _svc.branchReview(widget.requestId, action: approve ? 'approve' : 'reject', comment: reason);
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.saved)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _assignTechnician() async {
    final l10n = AppLocalizations.of(context);
    try {
      final technicians = await _svc.listTechnicians();
      if (!mounted) return;
      final picked = await showModalBottomSheet<EmployeeLite>(
        context: context,
        isScrollControlled: true,
        builder: (ctx) {
          return SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(l10n.assignTechnician, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 12),
                  if (technicians.isEmpty)
                    Text(l10n.noTechnicians)
                  else
                    SizedBox(
                      height: 360,
                      child: ListView.separated(
                        itemCount: technicians.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (_, i) {
                          final t = technicians[i];
                          return ListTile(
                            title: Text(t.displayName(widget.locale)),
                            subtitle: Text(t.employeeNumber ?? ''),
                            onTap: () => Navigator.of(ctx).pop(t),
                          );
                        },
                      ),
                    ),
                ],
              ),
            ),
          );
        },
      );

      if (picked == null) return;

      await _svc.assign(widget.requestId, technicianEmployeeId: picked.id);
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.saved)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _completeRequest() async {
    final l10n = AppLocalizations.of(context);
    final notes = await _askText(title: l10n.completionNotes, hint: l10n.writeCompletionNotes);
    if (notes == null) return;

    try {
      await _svc.complete(widget.requestId, notes: notes);
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.saved)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _addComment({required bool internal}) async {
    final l10n = AppLocalizations.of(context);
    final text = await _askText(title: internal ? l10n.internalComment : l10n.comment, hint: l10n.writeComment);
    if (text == null || text.trim().isEmpty) return;

    try {
      await _svc.addComment(widget.requestId, comment: text.trim(), isInternal: internal);
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<String?> _askText({required String title, required String hint}) async {
    final c = TextEditingController();
    return showDialog<String>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          title: Text(title),
          content: TextField(
            controller: c,
            maxLines: 4,
            decoration: InputDecoration(hintText: hint),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.of(ctx).pop(null), child: Text(AppLocalizations.of(context).cancel)),
            ElevatedButton(onPressed: () => Navigator.of(ctx).pop(c.text), child: Text(AppLocalizations.of(context).save)),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    if (_loading) {
      return Scaffold(appBar: AppBar(title: Text(l10n.details)), body: const Center(child: CircularProgressIndicator()));
    }

    final details = _details;
    if (details == null) {
      return Scaffold(appBar: AppBar(title: Text(l10n.details)), body: Center(child: Text(l10n.noData)));
    }

    final req = details.request;
    final access = _access;

    final canBranchReview = access != null && req.status == 'SUBMITTED' && access.canReviewBranch(req.branchId);
    final canAssign = access != null && access.isManager && (req.status == 'UNDER_REVIEW' || req.status == 'SUBMITTED');
    final canComplete = access != null && (access.isManager || access.isTechnician) && req.status == 'ASSIGNED';
    final canInternalComment = access != null && (access.isManager || access.isTechnician);

    return Scaffold(
      appBar: AppBar(
        title: Text(req.requestNumber.isNotEmpty ? req.requestNumber : l10n.maintenanceRequest),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(req.category, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('${l10n.branch}: ${req.branch?.name ?? ''}'),
                  if (req.stage?.name != null) Text('${l10n.stage}: ${req.stage?.name ?? ''}'),
                  const SizedBox(height: 8),
                  Text('${l10n.locationDetails}: ${req.locationDetails}'),
                  const SizedBox(height: 12),
                  Text(req.description),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          if (canBranchReview)
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () => _branchApproveReject(approve: true),
                    icon: const Icon(Icons.check),
                    label: Text(l10n.approve),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () => _branchApproveReject(approve: false),
                    icon: const Icon(Icons.close),
                    label: Text(l10n.reject),
                  ),
                ),
              ],
            ),

          if (canAssign) ...[
            const SizedBox(height: 10),
            ElevatedButton.icon(
              onPressed: _assignTechnician,
              icon: const Icon(Icons.person_add_alt_1),
              label: Text(l10n.assignTechnician),
            ),
          ],

          if (canComplete) ...[
            const SizedBox(height: 10),
            ElevatedButton.icon(
              onPressed: _completeRequest,
              icon: const Icon(Icons.check_circle),
              label: Text(l10n.markCompleted),
            ),
          ],

          const SizedBox(height: 16),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(l10n.comments, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
              Row(
                children: [
                  IconButton(onPressed: () => _addComment(internal: false), icon: const Icon(Icons.add_comment)),
                  if (canInternalComment) IconButton(onPressed: () => _addComment(internal: true), icon: const Icon(Icons.lock)),
                ],
              )
            ],
          ),

          if (details.comments.isEmpty)
            Text(l10n.noComments)
          else
            ...details.comments.map((c) {
              final who = c.user.displayName(widget.locale);
              return Card(
                child: ListTile(
                  title: Text(who),
                  subtitle: Text(c.comment),
                  trailing: c.isInternal ? const Icon(Icons.lock, size: 16) : null,
                ),
              );
            }),
        ],
      ),
    );
  }
}
