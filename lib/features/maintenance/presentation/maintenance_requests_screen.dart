import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/maintenance_models.dart';
import '../data/maintenance_service.dart';
import 'maintenance_request_details_screen.dart';
import 'maintenance_new_request_screen.dart';

class MaintenanceRequestsScreen extends StatefulWidget {
  const MaintenanceRequestsScreen({super.key});

  @override
  State<MaintenanceRequestsScreen> createState() => _MaintenanceRequestsScreenState();
}

class _MaintenanceRequestsScreenState extends State<MaintenanceRequestsScreen> {
  late final MaintenanceService _svc;

  bool _loading = true;
  String _status = 'ALL';
  List<MaintenanceRequest> _items = [];

  @override
  void initState() {
    super.initState();
    _svc = MaintenanceService(ApiService());
    _load();
  }

  Future<void> _load() async {
    try {
      setState(() => _loading = true);
      final items = await _svc.list(status: _status);
      setState(() => _items = items);
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String _statusLabel(AppLocalizations l10n, String status) {
    switch (status) {
      case 'SUBMITTED':
        return l10n.maintenanceStatusSubmitted;
      case 'UNDER_REVIEW':
        return l10n.maintenanceStatusUnderReview;
      case 'ASSIGNED':
        return l10n.maintenanceStatusAssigned;
      case 'COMPLETED':
        return l10n.maintenanceStatusCompleted;
      case 'REJECTED':
        return l10n.maintenanceStatusRejected;
      default:
        return status;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'SUBMITTED':
        return Colors.orange;
      case 'UNDER_REVIEW':
        return Colors.blue;
      case 'ASSIGNED':
        return Colors.purple;
      case 'COMPLETED':
        return Colors.green;
      case 'REJECTED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final locale = Localizations.localeOf(context).languageCode;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n.maintenanceRequestsTitle),
        actions: [
          IconButton(onPressed: _load, icon: const Icon(Icons.refresh)),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.of(context).push(MaterialPageRoute(builder: (_) => const MaintenanceNewRequestScreen()));
          await _load();
        },
        icon: const Icon(Icons.add),
        label: Text(l10n.newMaintenanceRequest),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: DropdownButtonFormField<String>(
              value: _status,
              decoration: InputDecoration(
                labelText: l10n.filterByStatus,
                border: const OutlineInputBorder(),
              ),
              items: [
                DropdownMenuItem(value: 'ALL', child: Text(l10n.all)),
                DropdownMenuItem(value: 'SUBMITTED', child: Text(l10n.maintenanceStatusSubmitted)),
                DropdownMenuItem(value: 'UNDER_REVIEW', child: Text(l10n.maintenanceStatusUnderReview)),
                DropdownMenuItem(value: 'ASSIGNED', child: Text(l10n.maintenanceStatusAssigned)),
                DropdownMenuItem(value: 'COMPLETED', child: Text(l10n.maintenanceStatusCompleted)),
                DropdownMenuItem(value: 'REJECTED', child: Text(l10n.maintenanceStatusRejected)),
              ],
              onChanged: (v) async {
                if (v == null) return;
                setState(() => _status = v);
                await _load();
              },
            ),
          ),
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _items.isEmpty
                    ? Center(child: Text(l10n.noRequests))
                    : ListView.separated(
                        padding: const EdgeInsets.all(16),
                        itemCount: _items.length,
                        separatorBuilder: (_, __) => const SizedBox(height: 10),
                        itemBuilder: (context, index) {
                          final r = _items[index];
                          final statusText = _statusLabel(l10n, r.status);
                          return Card(
                            child: ListTile(
                              leading: Container(
                                width: 10,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: _statusColor(r.status),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                              ),
                              title: Text(r.requestNumber.isNotEmpty ? r.requestNumber : l10n.maintenanceRequest),
                              subtitle: Text(
                                '${r.branch?.name ?? ''}\n${r.category} • ${statusText}',
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () {
                                Navigator.of(context).push(
                                  MaterialPageRoute(
                                    builder: (_) => MaintenanceRequestDetailsScreen(requestId: r.id, locale: locale),
                                  ),
                                );
                              },
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
