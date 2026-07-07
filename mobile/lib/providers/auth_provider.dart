import 'package:flutter/material.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();
  
  UserModel? _user;
  bool _isLoading = true;
  String? _error;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;

  Future<void> checkAuthStatus() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final loggedIn = await _authService.isLoggedIn();
      if (loggedIn) {
        _user = await _authService.getMe();
      } else {
        _user = null;
      }
    } catch (e) {
      _user = null;
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _authService.login(email, password);
      _user = await _authService.getMe();
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> register(String email, String password, String fullName) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _user = await _authService.register(email, password, fullName);
    } catch (e) {
      _error = e.toString();
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    
    await _authService.logout();
    _user = null;
    
    _isLoading = false;
    notifyListeners();
  }

  void updateUser(UserModel user) {
    _user = user;
    notifyListeners();
  }

  Future<void> updateProfile({String? fullName, int? age, double? heightCm, double? weightKg}) async {
    try {
      final updatedUser = await _authService.updateProfile(
        fullName: fullName,
        age: age,
        heightCm: heightCm,
        weightKg: weightKg,
      );
      updateUser(updatedUser);
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }

  Future<void> updateAllergies(List<String> allergies) async {
    try {
      final updatedAllergies = await _authService.updateAllergies(allergies);
      if (_user != null) {
        _user = _user!.copyWith(foodAllergies: updatedAllergies);
        notifyListeners();
      }
    } catch (e) {
      _error = e.toString();
      rethrow;
    }
  }
}
