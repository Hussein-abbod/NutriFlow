import 'dart:convert';
import '../models/user_model.dart';
import 'api_client.dart';

class OnboardingService {
  final ApiClient _api = ApiClient();

  Future<UserModel> saveProfile({
    required String fullName,
    required int age,
    required String gender,
    required double heightCm,
    required double weightKg,
    required String activityLevel,
  }) async {
    final response = await _api.post('/onboarding/profile', body: {
      'full_name': fullName,
      'age': age,
      'gender': gender,
      'height_cm': heightCm,
      'weight_kg': weightKg,
      'activity_level': activityLevel,
    });

    if (response.statusCode == 200) {
      return UserModel.fromJson(jsonDecode(response.body));
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['detail'] ?? 'Failed to save profile');
    }
  }

  Future<Map<String, dynamic>> saveGoal({
    required String goalType,
    double? targetWeightKg,
    int? goalPeriodWeeks,
  }) async {
    final response = await _api.post('/onboarding/goal', body: {
      'goal_type': goalType,
      if (targetWeightKg != null) 'target_weight_kg': targetWeightKg,
      if (goalPeriodWeeks != null) 'goal_period_weeks': goalPeriodWeeks,
    });

    final data = jsonDecode(response.body);
    if (response.statusCode == 200) {
      if (data['is_feasible'] == true) {
        return data; // Return full response with targets
      } else {
        throw Exception(data['message']);
      }
    } else {
      throw Exception(data['detail'] ?? 'Failed to save goal');
    }
  }

  Future<UserModel> saveAllergies(List<String> allergies) async {
    final response = await _api.post('/onboarding/allergies', body: {
      'food_allergies': allergies,
    });

    if (response.statusCode == 200) {
      return UserModel.fromJson(jsonDecode(response.body));
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['detail'] ?? 'Failed to save allergies');
    }
  }

  Future<UserModel> completeOnboarding() async {
    final response = await _api.post('/onboarding/complete');

    if (response.statusCode == 200) {
      return UserModel.fromJson(jsonDecode(response.body));
    } else {
      final error = jsonDecode(response.body);
      throw Exception(error['detail'] ?? 'Failed to complete onboarding');
    }
  }
}
