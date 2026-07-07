import 'food_item_model.dart';

class FoodLogItemModel {
  final int id;
  final String foodName;
  final String? brandName;
  final double? quantity;
  final String? unit;
  final double? calories;
  final double? protein;
  final double? carbs;
  final double? fat;

  FoodLogItemModel({
    required this.id,
    required this.foodName,
    this.brandName,
    this.quantity,
    this.unit,
    this.calories,
    this.protein,
    this.carbs,
    this.fat,
  });

  factory FoodLogItemModel.fromJson(Map<String, dynamic> json) {
    return FoodLogItemModel(
      id: json['id'],
      foodName: json['food_name'] ?? 'Unknown',
      brandName: json['brand_name'],
      quantity: (json['quantity'] as num?)?.toDouble(),
      unit: json['unit'],
      calories: (json['calories'] as num?)?.toDouble(),
      protein: (json['protein'] as num?)?.toDouble(),
      carbs: (json['carbs'] as num?)?.toDouble(),
      fat: (json['fat'] as num?)?.toDouble(),
    );
  }
}

class FoodLogModel {
  final int id;
  final String mealType;
  final String logDate;
  final String logMethod;
  final double? totalCalories;
  final double? totalProtein;
  final double? totalCarbs;
  final double? totalFat;
  final String? aiAdvice;
  final List<FoodLogItemModel> items;

  FoodLogModel({
    required this.id,
    required this.mealType,
    required this.logDate,
    required this.logMethod,
    this.totalCalories,
    this.totalProtein,
    this.totalCarbs,
    this.totalFat,
    this.aiAdvice,
    this.items = const [],
  });

  factory FoodLogModel.fromJson(Map<String, dynamic> json) {
    return FoodLogModel(
      id: json['id'],
      mealType: json['meal_type'] ?? '',
      logDate: json['log_date'] ?? '',
      logMethod: json['log_method'] ?? 'text',
      totalCalories: (json['total_calories'] as num?)?.toDouble(),
      totalProtein: (json['total_protein'] as num?)?.toDouble(),
      totalCarbs: (json['total_carbs'] as num?)?.toDouble(),
      totalFat: (json['total_fat'] as num?)?.toDouble(),
      aiAdvice: json['ai_advice'],
      items: (json['items'] as List<dynamic>? ?? [])
          .map((i) => FoodLogItemModel.fromJson(i))
          .toList(),
    );
  }
}

class TodayLogsModel {
  final String date;
  final List<FoodLogModel> breakfast;
  final List<FoodLogModel> lunch;
  final List<FoodLogModel> snack;
  final List<FoodLogModel> dinner;
  final double totalCalories;
  final double totalProtein;
  final double totalCarbs;
  final double totalFat;

  TodayLogsModel({
    required this.date,
    this.breakfast = const [],
    this.lunch = const [],
    this.snack = const [],
    this.dinner = const [],
    this.totalCalories = 0,
    this.totalProtein = 0,
    this.totalCarbs = 0,
    this.totalFat = 0,
  });

  factory TodayLogsModel.fromJson(Map<String, dynamic> json) {
    return TodayLogsModel(
      date: json['date'] ?? '',
      breakfast: _parseList(json['breakfast']),
      lunch: _parseList(json['lunch']),
      snack: _parseList(json['snack']),
      dinner: _parseList(json['dinner']),
      totalCalories: (json['total_calories'] as num?)?.toDouble() ?? 0,
      totalProtein: (json['total_protein'] as num?)?.toDouble() ?? 0,
      totalCarbs: (json['total_carbs'] as num?)?.toDouble() ?? 0,
      totalFat: (json['total_fat'] as num?)?.toDouble() ?? 0,
    );
  }

  static List<FoodLogModel> _parseList(dynamic data) {
    if (data == null) return [];
    return (data as List).map((e) => FoodLogModel.fromJson(e)).toList();
  }

  List<FoodLogModel> getByMeal(String mealType) {
    switch (mealType) {
      case 'breakfast': return breakfast;
      case 'lunch':     return lunch;
      case 'snack':     return snack;
      case 'dinner':    return dinner;
      default:          return [];
    }
  }
}
