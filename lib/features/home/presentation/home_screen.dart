import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/services/auth_service.dart';
import '../../../l10n/app_localizations.dart';
import '../../attendance/presentation/attendance_screen.dart';
import '../../hr/presentation/hr_screen.dart';
import '../../procurement/presentation/procurement_screen.dart';
import '../../maintenance/presentation/maintenance_screen.dart';
import '../../approvals/presentation/approvals_screen.dart';
import '../../auth/presentation/login_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;

  late final List<Widget> _screens;

  @override
  void initState() {
    super.initState();
    _screens = [
      const AttendanceScreen(),
      const HRScreen(),
      const ProcurementScreen(),
      const MaintenanceScreen(),
      const ApprovalsScreen(),
    ];
  }

  Future<void> _handleLogout() async {
    final shouldLogout = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('تسجيل الخروج'),
        content: const Text('هل أنت متأكد من تسجيل الخروج؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('تسجيل الخروج'),
          ),
        ],
      ),
    );

    if (shouldLogout == true && mounted) {
      await context.read<AuthService>().logout();
      
      if (mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final authService = context.watch<AuthService>();
    
    final titles = [
      l10n.attendance,
      l10n.hr,
      l10n.procurement,
      l10n.maintenance,
      l10n.approvals,
    ];

    return Scaffold(
      appBar: AppBar(
        title: Text(titles[_currentIndex]),
        actions: [
          // User info
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0),
            child: Center(
              child: Text(
                authService.username ?? '',
                style: const TextStyle(fontSize: 14),
              ),
            ),
          ),
          
          // Logout button
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
            tooltip: l10n.logout,
          ),
        ],
      ),
      
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() => _currentIndex = index);
        },
        items: [
          BottomNavigationBarItem(
            icon: const Icon(Icons.access_time),
            label: l10n.attendance,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.people),
            label: l10n.hr,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.shopping_cart),
            label: l10n.procurement,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.build),
            label: l10n.maintenance,
          ),
          BottomNavigationBarItem(
            icon: const Icon(Icons.check_circle),
            label: l10n.approvals,
          ),
        ],
      ),
    );
  }
}
