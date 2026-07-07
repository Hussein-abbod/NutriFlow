class MacroSummary {
  final double consumed;
  final double target;

  MacroSummary({required this.consumed, required this.target});

  factory MacroSummary.fromJson(Map<String, dynamic> json) {
    return MacroSummary(
      consumed: (json['consumed'] as num?)?.toDouble() ?? 0,
      target: (json['target'] as num?)?.toDouble() ?? 0,
    );
  }
  
  double get progress => target > 0 ? (consumed / target).clamp(0.0, 1.0) : 0;
}

class MealSummary {
  final double calories;
  final double target;

  MealSummary({required this.calories, required this.target});

  factory MealSummary.fromJson(Map<String, dynamic> json) {
    return MealSummary(
      calories: (json['calories'] as num?)?.toDouble() ?? 0,
      target: (json['target'] as num?)?.toDouble() ?? 0,
    );
  }
  
  bool get isOver => calories > target;
}

class TodaySummaryModel {
  final double caloriesConsumed;
  final double caloriesTarget;
  final MacroSummary protein;
  final MacroSummary carbs;
  final MacroSummary fat;
  final Map<String, MealSummary> meals;

  TodaySummaryModel({
    required this.caloriesConsumed,
    required this.caloriesTarget,
    required this.protein,
    required this.carbs,
    required this.fat,
    required this.meals,
  });

  factory TodaySummaryModel.fromJson(Map<String, dynamic> json) {
    final mealsData = json['meals'] as Map<String, dynamic>? ?? {};
    final mealsMap = <String, MealSummary>{};
    mealsData.forEach((key, value) {
      mealsMap[key] = MealSummary.fromJson(value);
    });

    return TodaySummaryModel(
      caloriesConsumed: (json['calories_consumed'] as num?)?.toDouble() ?? 0,
      caloriesTarget: (json['calories_target'] as num?)?.toDouble() ?? 2000,
      protein: MacroSummary.fromJson(json['protein'] ?? {}),
      carbs: MacroSummary.fromJson(json['carbs'] ?? {}),
      fat: MacroSummary.fromJson(json['fat'] ?? {}),
      meals: mealsMap,
    );
  }
  
  double get caloriesProgress => caloriesTarget > 0 ? (caloriesConsumed / caloriesTarget).clamp(0.0, 1.0) : 0;
}

class DailyCaloriesModel {
  final String date;
  final double calories;

  DailyCaloriesModel({required this.date, required this.calories});

  factory DailyCaloriesModel.fromJson(Map<String, dynamic> json) {
    return DailyCaloriesModel(
      date: json['date'] ?? '',
      calories: (json['calories'] as num?)?.toDouble() ?? 0,
    );
  }
}

class GoalProgressModel {
  final bool hasActiveGoal;
  final String goalType;
  final double startWeight;
  final double currentWeight;
  final double targetWeight;
  final int daysRemaining;

  GoalProgressModel({
    required this.hasActiveGoal,
    this.goalType = '',
    this.startWeight = 0,
    this.currentWeight = 0,
    this.targetWeight = 0,
    this.daysRemaining = 0,
  });

  factory GoalProgressModel.fromJson(Map<String, dynamic> json) {
    return GoalProgressModel(
      hasActiveGoal: json['has_active_goal'] ?? false,
      goalType: json['goal_type'] ?? '',
      startWeight: (json['start_weight'] as num?)?.toDouble() ?? 0,
      currentWeight: (json['current_weight'] as num?)?.toDouble() ?? 0,
      targetWeight: (json['target_weight'] as num?)?.toDouble() ?? 0,
      daysRemaining: json['days_remaining'] ?? 0,
    );
  }
  
  double get weightProgress {
    if (!hasActiveGoal || startWeight == targetWeight) return 0;
    
    // For weight loss: start = 80, target = 70, current = 75
    // Progress = (80 - 75) / (80 - 70) = 5 / 10 = 0.5
    // For weight gain: start = 60, target = 70, current = 65
    // Progress = (65 - 60) / (70 - 60) = 5 / 10 = 0.5
    
    double totalDiff = (targetWeight - startWeight).abs();
    double currentDiff = (currentWeight - startWeight).abs();
    
    // Check if we've passed the target (or going wrong direction)
    if (goalType == 'lose_weight' && currentWeight > startWeight) return 0;
    if (goalType == 'gain_weight' && currentWeight < startWeight) return 0;
    if (goalType == 'lose_weight' && currentWeight <= targetWeight) return 1.0;
    if (goalType == 'gain_weight' && currentWeight >= targetWeight) return 1.0;
    
    return (currentDiff / totalDiff).clamp(0.0, 1.0);
  }
}
