import 'package:flutter/material.dart';
import '../models/food_item_model.dart';
import '../models/food_log_model.dart';
import '../services/food_log_service.dart';
import '../services/notification_service.dart';

class FoodLogProvider with ChangeNotifier {
  final FoodLogService _service = FoodLogService();

  TodayLogsModel? _todayLogs;
  bool _isLoading = false;
  String? _error;
  String? _lastAdvice;
  FoodLogModel? _lastSubmittedLog;
  DateTime _selectedDate = DateTime.now();

  TodayLogsModel? get todayLogs => _todayLogs;
  bool get isLoading => _isLoading;
  String? get error => _error;
  String? get lastAdvice => _lastAdvice;
  FoodLogModel? get lastSubmittedLog => _lastSubmittedLog;
  DateTime get selectedDate => _selectedDate;

  // ── Load date ────────────────────────────────────
  Future<void> loadDate(DateTime date) async {
    _selectedDate = date;
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final dateStr = "${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}";
      _todayLogs = await _service.getHistoryLogs(dateStr);
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ── Load today ────────────────────────────────────
  Future<void> loadToday() async {
    await loadDate(DateTime.now());
  }

  // ── Submit food log ───────────────────────────────
  Future<FoodLogModel?> submitFoodLog({
    required String mealType,
    required String logMethod,
    required List<FoodItemModel> items,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final log = await _service.submitFoodLog(
        mealType: mealType,
        logMethod: logMethod,
        logDate: _selectedDate,
        items: items,
      );
      _lastAdvice = log.aiAdvice;
      _lastSubmittedLog = log;
      await loadDate(_selectedDate);
      
      // Trigger notification if daily target reached
      if (_todayLogs != null && _todayLogs!.totalCalories >= 2000) {
         NotificationService().showTargetReachedNotification();
      }
      
      return log;
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

  // ── Delete item ───────────────────────────────────
  Future<void> deleteItem(int itemId) async {
    try {
      await _service.deleteItem(itemId);
      await loadDate(_selectedDate);
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      notifyListeners();
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void clearAdvice() {
    _lastAdvice = null;
    _lastSubmittedLog = null;
    notifyListeners();
  }

  // Helpers for the UI
  double getMealCalories(String mealType) {
    final logs = _todayLogs?.getByMeal(mealType) ?? [];
    return logs.fold(0.0, (sum, log) => sum + (log.totalCalories ?? 0));
  }

  double get totalCaloriesToday => _todayLogs?.totalCalories ?? 0;
  double get totalProteinToday  => _todayLogs?.totalProtein  ?? 0;
  double get totalCarbsToday    => _todayLogs?.totalCarbs    ?? 0;
  double get totalFatToday      => _todayLogs?.totalFat      ?? 0;
}
