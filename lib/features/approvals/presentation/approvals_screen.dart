import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/approval_models.dart';
import '../data/approvals_service.dart';

class ApprovalsScreen extends StatefulWidget {
  const ApprovalsScreen({super.key});

  @override
  State<ApprovalsScreen> createState() => _ApprovalsScreenState();
}

class _ApprovalsScreenState extends State<ApprovalsScreen> {
  bool _loading = true;
  List<PendingApprovalItem> _items = [];

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final api = context.read<ApiService>();
      final svc = ApprovalsService(api);
      final items = await svc.pending();
      if (mounted) setState(() => _items = items);
    } catch (_) {
      if (mounted) setState(() => _items = []);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final isAr = Localizations.localeOf(context).languageCode == 'ar';

    return DefaultTabController(
      length: 1,
      child: Scaffold(
        appBar: AppBar(
          title: Text(l10n.approvals),
          actions: [
            IconButton(onPressed: _loading ? null : _load, icon: const Icon(Icons.refresh), tooltip: l10n.retry)
          ],
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _items.isEmpty
                ? Center(child: Text(isAr ? 'لا توجد موافقات' : 'No approvals', style: TextStyle(color: Colors.grey[600])))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _items.length,
                    itemBuilder: (context, index) {
                      final item = _items[index];
                      return _approvalCard(context, item, l10n, isAr);
                    },
                  ),
      ),
    );
  }

  Widget _approvalCard(BuildContext context, PendingApprovalItem item, AppLocalizations l10n, bool isAr) {
    final df = DateFormat('yyyy-MM-dd');
    final date = df.format(item.submittedAt.toLocal());

    IconData icon;
    Color color;
    if (item.type == 'hr_request') {
      icon = Icons.badge;
      color = Colors.orange;
    } else if (item.type == 'purchase_request') {
      icon = Icons.shopping_cart;
      color = Colors.blue;
    } else {
      icon = Icons.description;
      color = Colors.grey;
    }

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                CircleAvatar(
                  backgroundColor: color.withOpacity(0.12),
                  child: Icon(icon, color: color),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.title, style: const TextStyle(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 4),
                      Text('${item.submittedBy} • $date', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                      const SizedBox(height: 4),
                      Text(item.action, style: TextStyle(color: Colors.grey[700], fontSize: 13)),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: _buildActions(context, item, l10n, isAr),
            )
          ],
        ),
      ),
    );
  }

  List<Widget> _buildActions(BuildContext context, PendingApprovalItem item, AppLocalizations l10n, bool isAr) {
    final api = context.read<ApiService>();
    final svc = ApprovalsService(api);

    Future<void> run(Future<void> Function(String notes) action, {required bool approve}) async {
      final notes = await _notesDialog(context, approve: approve, isAr: isAr);
      if (notes == null) return;
      try {
        await action(notes);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(approve ? l10n.success : l10n.success), backgroundColor: approve ? Colors.green : Colors.red),
          );
        }
        await _load();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('${l10n.error}: $e'), backgroundColor: Colors.red),
          );
        }
      }
    }

    if (item.type == 'hr_request') {
      return [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => run((n) => svc.rejectHR(item.id, comment: n), approve: false),
            icon: const Icon(Icons.close),
            label: Text(isAr ? 'رفض' : 'Reject'),
            style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () => run((n) => svc.approveHR(item.id, comment: n), approve: true),
            icon: const Icon(Icons.check),
            label: Text(isAr ? 'موافقة' : 'Approve'),
          ),
        ),
      ];
    }

    if (item.type == 'purchase_request') {
      // If still pending review -> review, else approve.
      final isPendingReview = item.status == 'PENDING_REVIEW';

      return [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => run((n) => svc.rejectPurchaseRequest(item.id, notes: n), approve: false),
            icon: const Icon(Icons.close),
            label: Text(isAr ? 'رفض' : 'Reject'),
            style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () => run((n) => isPendingReview ? svc.reviewPurchaseRequest(item.id, notes: n) : svc.approvePurchaseRequest(item.id, notes: n), approve: true),
            icon: const Icon(Icons.check),
            label: Text(isAr ? (isPendingReview ? 'مراجعة' : 'اعتماد') : (isPendingReview ? 'Review' : 'Approve')),
          ),
        ),
      ];
    }

    if (item.type == 'supplier_request') {
      return [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => run((n) => svc.rejectSupplierRequest(item.id, reason: n), approve: false),
            icon: const Icon(Icons.close),
            label: Text(isAr ? 'رفض' : 'Reject'),
            style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () async {
              try {
                setState(() {});
                await svc.approveSupplierRequest(item.id);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(l10n.success), backgroundColor: Colors.green),
                  );
                }
                await _load();
              } catch (e) {
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('${l10n.error}: $e'), backgroundColor: Colors.red),
                  );
                }
              }
            },
            icon: const Icon(Icons.check),
            label: Text(isAr ? 'اعتماد' : 'Approve'),
          ),
        ),
      ];
    }

    if (item.type == 'maintenance_request') {
      return [
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => run((n) => svc.rejectMaintenance(item.id, comment: n), approve: false),
            icon: const Icon(Icons.close),
            label: Text(isAr ? 'رفض' : 'Reject'),
            style: OutlinedButton.styleFrom(foregroundColor: Colors.red),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: () => run((n) => svc.approveMaintenance(item.id, comment: n), approve: true),
            icon: const Icon(Icons.check),
            label: Text(isAr ? 'موافقة' : 'Approve'),
          ),
        ),
      ];
    }

    // purchase_order not yet implemented
    return [
      Expanded(
        child: Text(isAr ? 'غير مدعوم حالياً' : 'Not supported yet', style: TextStyle(color: Colors.grey[600])),
      )
    ];
  }

  Future<String?> _notesDialog(BuildContext context, {required bool approve, required bool isAr}) async {
    final ctrl = TextEditingController();
    final title = approve ? (isAr ? 'موافقة' : 'Approve') : (isAr ? 'رفض' : 'Reject');

    final res = await showDialog<String?>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: TextField(
          controller: ctrl,
          maxLines: 3,
          decoration: InputDecoration(
            hintText: isAr ? 'ملاحظات (اختياري)' : 'Notes (optional)',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, null), child: Text(isAr ? 'إلغاء' : 'Cancel')),
          ElevatedButton(onPressed: () => Navigator.pop(context, ctrl.text), child: Text(isAr ? 'تأكيد' : 'Confirm')),
        ],
      ),
    );

    ctrl.dispose();
    return res;
  }
}

  
  Widget _buildPendingApprovals(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 3,
      itemBuilder: (context, index) {
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: Colors.orange[100],
                      child: const Icon(
                        Icons.pending_actions,
                        color: Colors.orange,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'طلب إجازة - أحمد محمد',
                            style: const TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'من 2026-03-01 إلى 2026-03-05',
                            style: TextStyle(
                              fontSize: 13,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                const Divider(),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () {
                          _showApprovalDialog(context, false);
                        },
                        icon: const Icon(Icons.close),
                        label: const Text('رفض'),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          _showApprovalDialog(context, true);
                        },
                        icon: const Icon(Icons.check),
                        label: const Text('موافقة'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildApprovedList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 8,
      itemBuilder: (context, index) {
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.green[100],
              child: const Icon(Icons.check, color: Colors.green),
            ),
            title: Text('طلب شراء #${3000 + index}'),
            subtitle: const Text('تمت الموافقة بتاريخ 2026-02-20'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
        );
      },
    );
  }
  
  Widget _buildRejectedList() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 2,
      itemBuilder: (context, index) {
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.red[100],
              child: const Icon(Icons.close, color: Colors.red),
            ),
            title: Text('طلب صيانة #${4000 + index}'),
            subtitle: const Text('تم الرفض بتاريخ 2026-02-18'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
        );
      },
    );
  }
  
  void _showApprovalDialog(BuildContext context, bool isApprove) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(isApprove ? 'تأكيد الموافقة' : 'تأكيد الرفض'),
        content: Text(
          isApprove
              ? 'هل تريد الموافقة على هذا الطلب؟'
              : 'هل تريد رفض هذا الطلب؟',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    isApprove ? 'تمت الموافقة بنجاح' : 'تم الرفض بنجاح',
                  ),
                  backgroundColor: isApprove ? Colors.green : Colors.red,
                ),
              );
            },
            child: Text(isApprove ? 'موافقة' : 'رفض'),
          ),
        ],
      ),
    );
  }
}
