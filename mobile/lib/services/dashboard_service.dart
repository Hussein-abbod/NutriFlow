import 'dart:convert';
import '../services/api_client.dart';
import '../models/dashboard_model.dart';

class DashboardService {
  final ApiClient _api = ApiClient();

  Future<TodaySummaryModel> getTodaySummary() async {
    final resp = await _api.get('/dashboard/today');
    if (resp.statusCode == 200) {
      return TodaySummaryModel.fromJson(jsonDecode(resp.body));
    }
    throw Exception('Failed to load today summary: ${resp.body}');
  }

  Future<List<DailyCaloriesModel>> getWeeklySummary() async {
    final resp = await _api.get('/dashboard/weekly');
    if (resp.statusCode == 200) {
      final List<dynamic> list = jsonDecode(resp.body);
      return list.map((e) => DailyCaloriesModel.fromJson(e)).toList();
    }
    throw Exception('Failed to load weekly summary: ${resp.body}');
  }

  Future<GoalProgressModel> getGoalProgress() async {
    final resp = await _api.get('/dashboard/goal-progress');
    if (resp.statusCode == 200) {
      return GoalProgressModel.fromJson(jsonDecode(resp.body));
    }
    throw Exception('Failed to load goal progress: ${resp.body}');
  }

  Future<void> resetGoal() async {
    final resp = await _api.put('/dashboard/reset-goal');
    if (resp.statusCode != 200) {
      throw Exception('Failed to reset goal: ${resp.body}');
    }
  }

  Future<void> extendGoal(int extraWeeks) async {
    final resp = await _api.put('/dashboard/extend-goal', body: {
      'extra_weeks': extraWeeks
    });
    if (resp.statusCode != 200) {
      throw Exception('Failed to extend goal: ${resp.body}');
    }
  }
}
