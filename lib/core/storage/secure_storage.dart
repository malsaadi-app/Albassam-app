import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class SecureStorage {
  final FlutterSecureStorage _storage = const FlutterSecureStorage();
  
  // Keys
  static const String _keyAccessToken = 'access_token';
  static const String _keyRefreshToken = 'refresh_token';
  static const String _keyUserId = 'user_id';
  static const String _keyUsername = 'username';
  static const String _keyUserData = 'user_data';
  
  // Token operations
  Future<void> saveAccessToken(String token) async {
    await _storage.write(key: _keyAccessToken, value: token);
  }
  
  Future<String?> getAccessToken() async {
    return await _storage.read(key: _keyAccessToken);
  }
  
  Future<void> saveRefreshToken(String token) async {
    await _storage.write(key: _keyRefreshToken, value: token);
  }
  
  Future<String?> getRefreshToken() async {
    return await _storage.read(key: _keyRefreshToken);
  }
  
  // User data operations
  Future<void> saveUserId(String userId) async {
    await _storage.write(key: _keyUserId, value: userId);
  }
  
  Future<String?> getUserId() async {
    return await _storage.read(key: _keyUserId);
  }
  
  Future<void> saveUsername(String username) async {
    await _storage.write(key: _keyUsername, value: username);
  }
  
  Future<String?> getUsername() async {
    return await _storage.read(key: _keyUsername);
  }
  
  Future<void> saveUserData(String jsonData) async {
    await _storage.write(key: _keyUserData, value: jsonData);
  }
  
  Future<String?> getUserData() async {
    return await _storage.read(key: _keyUserData);
  }
  
  // Clear all data (logout)
  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
