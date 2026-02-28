import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:cookie_jar/cookie_jar.dart';
import 'package:path_provider/path_provider.dart';
import 'core/services/auth_service.dart';
import 'core/services/api_service.dart';
import 'core/storage/secure_storage.dart';
import 'core/theme/app_theme.dart';
import 'l10n/app_localizations.dart';
import 'features/auth/presentation/splash_screen.dart';
import 'core/navigation/app_router.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final dir = await getApplicationDocumentsDirectory();
  final cookieJar = PersistCookieJar(storage: FileStorage('${dir.path}/cookies'));

  // Initialize services
  final secureStorage = SecureStorage();
  final apiService = ApiService(cookieJar: cookieJar);
  final authService = AuthService(secureStorage, apiService);
  
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => authService),
        Provider(create: (_) => apiService),
      ],
      child: const AlbassamApp(),
    ),
  );
}

class AlbassamApp extends StatelessWidget {
  const AlbassamApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Albassam Platform',
      debugShowCheckedModeBanner: false,
      
      // Theme
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      
      // Localization
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('ar', ''), // Arabic
        Locale('en', ''), // English
      ],
      locale: const Locale('ar', ''), // Default to Arabic
      
      // Navigation
      home: const SplashScreen(),
      onGenerateRoute: AppRouter.onGenerateRoute,
    );
  }
}
