import 'package:cookie_jar/cookie_jar.dart';
import 'package:dio/dio.dart';
import 'package:dio_cookie_manager/dio_cookie_manager.dart';

class ApiService {
  late final Dio _dio;

  // Web/API base (Next.js routes are under /api)
  static const String baseUrl = 'https://app.albassam-app.com/api';

  ApiService({required CookieJar cookieJar}) {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 30),
      receiveTimeout: const Duration(seconds: 30),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    ));
    
    // Cookie-based session auth (iron-session). Cookies are persisted via cookieJar.
    _dio.interceptors.add(CookieManager(cookieJar));

    _dio.interceptors.add(LogInterceptor(
      requestBody: true,
      responseBody: true,
    ));
  }

  // Token auth is not used currently (backend uses session cookies).
  // Kept for future OTP/Biometric token-based flows.
  void setAuthToken(String token) {
    _dio.options.headers['Authorization'] = 'Bearer $token';
  }

  void clearAuthToken() {
    _dio.options.headers.remove('Authorization');
  }
  
  // Auth Endpoints
  Future<Map<String, dynamic>> login(String username, String password) async {
    final response = await _dio.post('/auth/login', data: {
      'username': username,
      'password': password,
    });
    return (response.data as Map).cast<String, dynamic>();
  }

  Future<Map<String, dynamic>> me() async {
    final response = await _dio.get('/auth/me');
    return (response.data as Map).cast<String, dynamic>();
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {
      // ignore
    }
  }

  // (Optional) Future token refresh endpoint (not implemented on backend)
  Future<Map<String, dynamic>> refreshToken(String refreshToken) async {
    final response = await _dio.post('/auth/refresh', data: {
      'refresh_token': refreshToken,
    });
    return (response.data as Map).cast<String, dynamic>();
  }
  
  // Generic GET request
  Future<Response> get(String endpoint, {Map<String, dynamic>? queryParams}) async {
    return await _dio.get(endpoint, queryParameters: queryParams);
  }
  
  // Generic POST request
  Future<Response> post(String endpoint, {dynamic data}) async {
    return await _dio.post(endpoint, data: data);
  }
  
  // Generic PUT request
  Future<Response> put(String endpoint, {dynamic data}) async {
    return await _dio.put(endpoint, data: data);
  }
  
  // Generic DELETE request
  Future<Response> delete(String endpoint) async {
    return await _dio.delete(endpoint);
  }
}
