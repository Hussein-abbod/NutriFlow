import 'package:flutter/material.dart';
import '../services/onboarding_service.dart';
import '../models/user_model.dart';
import 'auth_provider.dart';

class OnboardingProvider with ChangeNotifier {
  final OnboardingService _service = OnboardingService();
  final AuthProvider authProvider;

  OnboardingProvider(this.authProvider);

  bool _isLoading = false;
  String? _error;

  bool get isLoading => _isLoading;
  String? get error => _error;

  // Step 2 data
  int? age;
  String? gender;
  double? heightCm;
  double? weightKg;

  // Step 3 data
  String? activityLevel;

  // Step 4 data
  String? goalType;
  double? targetWeightKg;
  int? goalPeriodWeeks;

  // Step 5 data
  List<String> foodAllergies = [];

  // Targets (from Step 4 API response)
  Map<String, dynamic>? targets;

  void setBasicInfo(int a, String g, double h, double w) {
    age = a;
    gender = g;
    heightCm = h;
    weightKg = w;
    notifyListeners();
  }

  void setActivityLevel(String level) {
    activityLevel = level;
    notifyListeners();
  }

  void setGoal(String type, {double? weight, int? weeks}) {
    goalType = type;
    targetWeightKg = weight;
    goalPeriodWeeks = weeks;
    notifyListeners();
  }

  void setAllergies(List<String> allergies) {
    foodAllergies = allergies;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<bool> submitProfileInfo() async {
    if (age == null || gender == null || heightCm == null || weightKg == null || activityLevel == null) {
      _error = "Please fill out all fields.";
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final user = await _service.saveProfile(
        fullName: authProvider.user?.fullName ?? "User",
        age: age!,
        gender: gender!,
        heightCm: heightCm!,
        weightKg: weightKg!,
        activityLevel: activityLevel!,
      );
      authProvider.updateUser(user);
      return true;
    } catch (e) {
      _error = e.toString().replaceAll("Exception: ", "");
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> submitGoal() async {
    if (goalType == null) {
      _error = "Please select a goal.";
      notifyListeners();
      return false;
    }

    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _service.saveGoal(
        goalType: goalType!,
        targetWeightKg: targetWeightKg,
        goalPeriodWeeks: goalPeriodWeeks,
      );
      targets = response['targets'];
      // Update local state just in case, though user object is updated later
      return true;
    } catch (e) {
      _error = e.toString().replaceAll("Exception: ", "");
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> submitAllergies() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final user = await _service.saveAllergies(foodAllergies);
      authProvider.updateUser(user);
      return true;
    } catch (e) {
      _error = e.toString().replaceAll("Exception: ", "");
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> finishOnboarding() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final user = await _service.completeOnboarding();
      authProvider.updateUser(user);
      return true;
    } catch (e) {
      _error = e.toString().replaceAll("Exception: ", "");
      return false;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
