import 'package:flutter/material.dart';
import '../models/dashboard_model.dart';
import '../services/dashboard_service.dart';

class DashboardProvider with ChangeNotifier {
  final DashboardService _service = DashboardService();

  TodaySummaryModel? _todaySummary;
  List<DailyCaloriesModel> _weeklySummary = [];
  GoalProgressModel? _goalProgress;
  
  bool _isLoading = false;
  String? _error;

  TodaySummaryModel? get todaySummary => _todaySummary;
  List<DailyCaloriesModel> get weeklySummary => _weeklySummary;
  GoalProgressModel? get goalProgress => _goalProgress;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadDashboard() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final futures = await Future.wait([
        _service.getTodaySummary(),
        _service.getWeeklySummary(),
        _service.getGoalProgress(),
      ]);
      
      _todaySummary = futures[0] as TodaySummaryModel;
      _weeklySummary = futures[1] as List<DailyCaloriesModel>;
      _goalProgress = futures[2] as GoalProgressModel;
      
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> resetGoal() async {
    try {
      await _service.resetGoal();
      await loadDashboard();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }

  Future<void> extendGoal(int weeks) async {
    try {
      await _service.extendGoal(weeks);
      await loadDashboard();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }
}
