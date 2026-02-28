import 'package:flutter/material.dart';
import '../../../l10n/app_localizations.dart';
import 'hr_requests_screen.dart';

class HRScreen extends StatelessWidget {
  const HRScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 16),
            
            // Quick actions
            _buildActionCard(
              context,
              icon: Icons.badge,
              title: 'بياناتي الشخصية',
              subtitle: 'عرض وتحديث معلوماتك',
              onTap: () {},
            ),
            
            const SizedBox(height: 12),
            
            _buildActionCard(
              context,
              icon: Icons.assignment,
              title: l10n.hrRequestsTitle,
              subtitle: l10n.filterByStatus,
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const HRRequestsScreen()),
                );
              },
            ),
            
            const SizedBox(height: 12),
            
            _buildActionCard(
              context,
              icon: Icons.calendar_today,
              title: 'جدول الإجازات',
              subtitle: 'عرض الإجازات المعتمدة',
              onTap: () {},
            ),
            
            const SizedBox(height: 12),
            
            _buildActionCard(
              context,
              icon: Icons.attach_money,
              title: 'سلف الموظفين',
              subtitle: 'طلب سلفة أو عرض السلف السابقة',
              onTap: () {},
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildActionCard(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF1976D2).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: const Color(0xFF1976D2),
                  size: 28,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: Colors.grey),
            ],
          ),
        ),
      ),
    );
  }
}
