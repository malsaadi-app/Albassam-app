import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';

import '../../../core/services/auth_service.dart';
import '../../../core/services/api_service.dart';
import '../../../l10n/app_localizations.dart';
import '../data/attendance_models.dart';
import '../data/attendance_service.dart';
import 'attendance_widgets.dart';

class AttendanceScreen extends StatefulWidget {
  const AttendanceScreen({super.key});

  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  Widget _buildRecordsCard(AppLocalizations l10n) {
    return buildRecordsCard(
      loading: _loadingRecords,
      records: _records,
      title: l10n.today,
      emptyText: l10n.noData,
      isArabic: Localizations.localeOf(context).languageCode == 'ar',
    );
  }

  @override
  void initState() {
    super.initState();
    _loadToday();
  }

  Future<void> _loadToday() async {
    setState(() => _loadingRecords = true);

    try {
      final api = context.read<ApiService>();
      final service = AttendanceService(api);
      // today YYYY-MM-DD
      final now = DateTime.now();
      final date = '${now.year.toString().padLeft(4, '0')}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}';
      final records = await service.getRecords(date: date);
      if (mounted) {
        setState(() => _records = records);
      }
    } catch (_) {
      // keep silent; records will be empty
    } finally {
      if (mounted) setState(() => _loadingRecords = false);
    }
  }

  bool _loading = false;
  bool _loadingRecords = false;
  String? _message;
  bool _isSuccess = true;

  List<AttendanceRecord> _records = [];

  Future<Position> _getPosition() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      throw Exception('Location services are disabled');
    }

    LocationPermission permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
    }

    if (permission == LocationPermission.denied) {
      throw Exception('Location permission denied');
    }

    if (permission == LocationPermission.deniedForever) {
      throw Exception('Location permission permanently denied');
    }

    return Geolocator.getCurrentPosition(desiredAccuracy: LocationAccuracy.high);
  }

  Future<void> _checkIn() async {
    final l10n = AppLocalizations.of(context);

    setState(() {
      _loading = true;
      _message = null;
    });

    try {
      final api = context.read<ApiService>();
      final service = AttendanceService(api);

      final pos = await _getPosition();
      final location = AttendanceService.formatLocation(pos.latitude, pos.longitude);

      final result = await service.checkIn(location: location);

      setState(() {
        _isSuccess = result['error'] == null;
        _message = _isSuccess ? l10n.checkInSuccess : (result['error']?.toString() ?? l10n.checkInError);
      });
      await _loadToday();
    } catch (e) {
      setState(() {
        _isSuccess = false;
        _message = '${l10n.checkInError}: $e';
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _checkOut() async {
    final l10n = AppLocalizations.of(context);

    setState(() {
      _loading = true;
      _message = null;
    });

    try {
      final api = context.read<ApiService>();
      final service = AttendanceService(api);

      final pos = await _getPosition();
      final location = AttendanceService.formatLocation(pos.latitude, pos.longitude);

      final result = await service.checkOut(location: location);

      setState(() {
        _isSuccess = result['error'] == null;
        _message = _isSuccess ? l10n.checkOutSuccess : (result['error']?.toString() ?? l10n.checkOutError);
      });
      await _loadToday();
    } catch (e) {
      setState(() {
        _isSuccess = false;
        _message = '${l10n.checkOutError}: $e';
      });
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final auth = context.watch<AuthService>();

    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 16),
            Text(
              l10n.attendance,
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 6),
            Text(
              auth.username ?? '',
              style: TextStyle(color: Colors.grey[600]),
            ),
            const SizedBox(height: 16),

            if (_message != null)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: _isSuccess ? const Color(0xFFD1FAE5) : const Color(0xFFFEE2E2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  _message!,
                  style: TextStyle(color: _isSuccess ? const Color(0xFF065F46) : const Color(0xFF991B1B)),
                ),
              ),

            const SizedBox(height: 12),
            _buildRecordsCard(l10n),

            const Spacer(),

            ElevatedButton.icon(
              onPressed: _loading ? null : _checkIn,
              icon: const Icon(Icons.login),
              label: Text(_loading ? l10n.loading : l10n.checkIn),
              style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
            ),
            const SizedBox(height: 12),
            OutlinedButton.icon(
              onPressed: _loading ? null : _checkOut,
              icon: const Icon(Icons.logout),
              label: Text(_loading ? l10n.loading : l10n.checkOut),
              style: OutlinedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }
}
