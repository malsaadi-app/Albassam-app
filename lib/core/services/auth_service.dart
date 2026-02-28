import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../storage/secure_storage.dart';
import 'api_service.dart';

enum AuthStatus {
  unknown,
  authenticated,
  unauthenticated,
}

class AuthService extends ChangeNotifier {
  final SecureStorage _storage;
  final ApiService _apiService;
  
  AuthStatus _status = AuthStatus.unknown;
  String? _userId;
  String? _username;
  Map<String, dynamic>? _userData;
  
  AuthStatus get status => _status;
  String? get userId => _userId;
  String? get username => _username;
  Map<String, dynamic>? get userData => _userData;
  bool get isAuthenticated => _status == AuthStatus.authenticated;
  
  AuthService(this._storage, this._apiService) {
    _checkAuthStatus();
  }
  
  Future<void> _checkAuthStatus() async {
    // Cookie-based auth: try /auth/me. If it returns 200, user is authenticated.
    try {
      final me = await _apiService.me();
      final user = me['user'];
      if (user != null) {
        _userId = user['id']?.toString();
        _username = user['username']?.toString();
        _userData = user;
        await _storage.saveUserId(_userId ?? '');
        await _storage.saveUsername(_username ?? '');
        await _storage.saveUserData(jsonEncode(user));
        _status = AuthStatus.authenticated;
      } else {
        _status = AuthStatus.unauthenticated;
      }
    } catch (_) {
      _status = AuthStatus.unauthenticated;
    }

    notifyListeners();
  }
  
  Future<bool> login(String username, String password) async {
    try {
      final response = await _apiService.login(username, password);
      if (response['ok'] == true) {
        // Cookie is stored in the CookieJar automatically.
        final me = await _apiService.me();
        final user = me['user'];

        if (user != null) {
          _userId = user['id']?.toString();
          _username = user['username']?.toString() ?? username;
          _userData = user;

          if (_userId != null) await _storage.saveUserId(_userId!);
          await _storage.saveUsername(_username!);
          await _storage.saveUserData(jsonEncode(user));
        }

        _status = AuthStatus.authenticated;
        notifyListeners();
        return true;
      }

      return false;
    } catch (e) {
      debugPrint('Login error: $e');
      return false;
    }
  }
  
  Future<void> logout() async {
    try {
      await _apiService.logout();
    } catch (e) {
      debugPrint('Logout API error: $e');
    }
    
    await _storage.clearAll();
    
    _status = AuthStatus.unauthenticated;
    _userId = null;
    _username = null;
    _userData = null;
    
    notifyListeners();
  }
  
  // Token refresh is not used currently (cookie-session auth)
  Future<bool> refreshToken() async {
    return false;
  }
}
