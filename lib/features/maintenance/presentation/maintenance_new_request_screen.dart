import 'package:flutter/material.dart';
import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/maintenance_models.dart';
import '../data/maintenance_service.dart';

class MaintenanceNewRequestScreen extends StatefulWidget {
  const MaintenanceNewRequestScreen({super.key});

  @override
  State<MaintenanceNewRequestScreen> createState() => _MaintenanceNewRequestScreenState();
}

class _MaintenanceNewRequestScreenState extends State<MaintenanceNewRequestScreen> {
  late final MaintenanceService _svc;

  bool _loading = false;
  bool _loadingLookups = true;

  List<BranchLite> _branches = [];
  List<StageLite> _stages = [];

  String _type = 'BUILDING';
  String _priority = 'NORMAL';
  String? _branchId;
  String? _stageId;

  final _category = TextEditingController();
  final _locationDetails = TextEditingController();
  final _description = TextEditingController();

  @override
  void initState() {
    super.initState();
    _svc = MaintenanceService(ApiService());
    _loadLookups();
  }

  Future<void> _loadLookups() async {
    try {
      setState(() => _loadingLookups = true);
      final branches = await _svc.listBranches();
      setState(() {
        _branches = branches;
        _branchId = branches.isNotEmpty ? branches.first.id : null;
      });
      await _loadStages();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _loadingLookups = false);
    }
  }

  Future<void> _loadStages() async {
    if (_branchId == null) return;
    try {
      final stages = await _svc.listStages(branchId: _branchId);
      setState(() {
        _stages = stages;
        _stageId = null;
      });
    } catch (_) {
      // ignore
    }
  }

  Future<void> _submit() async {
    final l10n = AppLocalizations.of(context);

    if (_branchId == null || _category.text.trim().isEmpty || _locationDetails.text.trim().isEmpty || _description.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.requiredFields)));
      return;
    }

    try {
      setState(() => _loading = true);
      await _svc.createRequest(
        type: _type,
        category: _category.text.trim(),
        branchId: _branchId!,
        stageId: _stageId,
        locationDetails: _locationDetails.text.trim(),
        description: _description.text.trim(),
        priority: _priority,
      );
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(l10n.requestCreated)));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void dispose() {
    _category.dispose();
    _locationDetails.dispose();
    _description.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(l10n.newMaintenanceRequest)),
      body: _loadingLookups
          ? const Center(child: CircularProgressIndicator())
          : ListView(
              padding: const EdgeInsets.all(16),
              children: [
                DropdownButtonFormField<String>(
                  value: _type,
                  decoration: InputDecoration(labelText: l10n.maintenanceType, border: const OutlineInputBorder()),
                  items: [
                    DropdownMenuItem(value: 'BUILDING', child: Text(l10n.maintenanceTypeBuilding)),
                    DropdownMenuItem(value: 'ELECTRONICS', child: Text(l10n.maintenanceTypeElectronics)),
                  ],
                  onChanged: (v) => setState(() => _type = v ?? 'BUILDING'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _priority,
                  decoration: InputDecoration(labelText: l10n.priority, border: const OutlineInputBorder()),
                  items: [
                    DropdownMenuItem(value: 'NORMAL', child: Text(l10n.medium)),
                    DropdownMenuItem(value: 'HIGH', child: Text(l10n.high)),
                    DropdownMenuItem(value: 'EMERGENCY', child: Text(l10n.urgent)),
                  ],
                  onChanged: (v) => setState(() => _priority = v ?? 'NORMAL'),
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _branchId,
                  decoration: InputDecoration(labelText: l10n.branch, border: const OutlineInputBorder()),
                  items: _branches.map((b) => DropdownMenuItem(value: b.id, child: Text(b.name))).toList(),
                  onChanged: (v) async {
                    setState(() => _branchId = v);
                    await _loadStages();
                  },
                ),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: _stageId,
                  decoration: InputDecoration(labelText: l10n.stageOptional, border: const OutlineInputBorder()),
                  items: [
                    DropdownMenuItem(value: null, child: Text(l10n.all)),
                    ..._stages.map((s) => DropdownMenuItem(value: s.id, child: Text(s.name))),
                  ],
                  onChanged: (v) => setState(() => _stageId = v),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _category,
                  decoration: InputDecoration(labelText: l10n.category, border: const OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _locationDetails,
                  decoration: InputDecoration(labelText: l10n.locationDetails, border: const OutlineInputBorder()),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _description,
                  maxLines: 5,
                  decoration: InputDecoration(labelText: l10n.description, border: const OutlineInputBorder()),
                ),
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  onPressed: _loading ? null : _submit,
                  icon: const Icon(Icons.send),
                  label: Text(_loading ? l10n.loading : l10n.submit),
                ),
              ],
            ),
    );
  }
}
