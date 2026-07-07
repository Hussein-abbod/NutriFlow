import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiClient {
  // --- How to run on Mobile/Emulator ---
  // 1. For Chrome (Web): Keep as 'http://localhost:8000'
  // 2. For Android Emulator: Uncomment the line below and comment the localhost one.
  //    (The Android emulator uses 10.0.2.2 to access your PC's localhost)
  // static const String baseUrl = 'http://10.0.2.2:8000';
  // 3. For Physical Device via USB: 
  //    Find your computer's local IP address (run 'ipconfig' in terminal, look for IPv4 Address)
  //    Make sure your phone and PC are on the same Wi-Fi network.
  // static const String baseUrl = 'http://192.168.0.12:8000'; // Replace with your IPv4
  
  // static const String baseUrl = 'http://127.0.0.1:8000';
  static const String baseUrl ='http://localhost:8000';
  // static const String baseUrl = 'http://192.168.0.4:8000';
  final _storage = const FlutterSecureStorage();

  Future<Map<String, String>> _getHeaders() async {
    final token = await _storage.read(key: 'access_token');
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<http.Response> get(String endpoint) async {
    final headers = await _getHeaders();
    return http.get(Uri.parse('$baseUrl$endpoint'), headers: headers);
  }

  Future<http.Response> post(String endpoint, {Map<String, dynamic>? body}) async {
    final headers = await _getHeaders();
    return http.post(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
  }

  Future<http.Response> put(String endpoint, {Map<String, dynamic>? body}) async {
    final headers = await _getHeaders();
    return http.put(
      Uri.parse('$baseUrl$endpoint'),
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
  }

  Future<http.Response> delete(String endpoint) async {
    final headers = await _getHeaders();
    return http.delete(Uri.parse('$baseUrl$endpoint'), headers: headers);
  }
}
