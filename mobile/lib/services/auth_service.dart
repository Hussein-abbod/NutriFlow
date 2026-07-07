import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../models/user_model.dart';
import 'api_client.dart';

class AuthService {
  final ApiClient _api = ApiClient();
  final _storage = const FlutterSecureStorage();

  Future<UserModel> register(String email, String password, String fullName) async {
    final response = await _api.post('/auth/register', body: {
      'email': email,
      'password': password,
    });

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      
      // Save tokens
      await _storage.write(key: 'access_token', value: data['access_token']);
      await _storage.write(key: 'refresh_token', value: data['refresh_token']);
      
      // We can also immediately update name via onboarding profile endpoint
      // but the UI will do that in Step 2.
      // We return the user model parsed from the register response
      return UserModel.fromJson(data);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['detail'] ?? 'Registration failed');
    }
  }

  Future<void> login(String email, String password) async {
    final response = await _api.post('/auth/login', body: {
      'email': email,
      'password': password,
    });

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await _storage.write(key: 'access_token', value: data['access_token']);
      await _storage.write(key: 'refresh_token', value: data['refresh_token']);
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['detail'] ?? 'Login failed');
    }
  }

  Future<UserModel> getMe() async {
    final response = await _api.get('/auth/me');
    if (response.statusCode == 200) {
      return UserModel.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load user profile');
    }
  }

  Future<void> logout() async {
    try {
      await _api.post('/auth/logout');
    } catch (e) {
      // Ignore errors on logout
    } finally {
      await _storage.delete(key: 'access_token');
      await _storage.delete(key: 'refresh_token');
    }
  }

  Future<bool> isLoggedIn() async {
    final token = await _storage.read(key: 'access_token');
    return token != null;
  }

  Future<UserModel> updateProfile({String? fullName, int? age, double? heightCm, double? weightKg}) async {
    final body = <String, dynamic>{};
    if (fullName != null) body['full_name'] = fullName;
    if (age != null) body['age'] = age;
    if (heightCm != null) body['height_cm'] = heightCm;
    if (weightKg != null) body['weight_kg'] = weightKg;

    final resp = await _api.put('/users/profile', body: body);
    if (resp.statusCode == 200) {
      return UserModel.fromJson(jsonDecode(resp.body));
    } else {
      throw Exception('Failed to update profile');
    }
  }

  Future<List<String>> updateAllergies(List<String> allergies) async {
    final resp = await _api.put('/users/allergies', body: {'allergies': allergies});
    if (resp.statusCode == 200) {
      final data = jsonDecode(resp.body);
      return List<String>.from(data['allergies'] ?? []);
    } else {
      throw Exception('Failed to update allergies');
    }
  }
}
