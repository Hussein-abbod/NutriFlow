class UserModel {
  final int id;
  final String email;
  final String? fullName;
  final bool isProfileComplete;
  
  // Basic Info
  final int? age;
  final String? gender;
  final double? heightCm;
  final double? weightKg;
  final String? activityLevel;

  // Goal
  final String? goalType;
  final double? goalWeightKg;
  final int? goalPeriodWeeks;

  // Targets
  final double? dailyCaloriesTarget;
  final double? dailyProteinTarget;
  final double? dailyCarbsTarget;
  final double? dailyFatTarget;
  
  final List<String>? foodAllergies;

  UserModel({
    required this.id,
    required this.email,
    this.fullName,
    required this.isProfileComplete,
    this.age,
    this.gender,
    this.heightCm,
    this.weightKg,
    this.activityLevel,
    this.goalType,
    this.goalWeightKg,
    this.goalPeriodWeeks,
    this.dailyCaloriesTarget,
    this.dailyProteinTarget,
    this.dailyCarbsTarget,
    this.dailyFatTarget,
    this.foodAllergies,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'],
      email: json['email'],
      fullName: json['full_name'],
      isProfileComplete: json['is_profile_complete'] ?? false,
      age: json['age'],
      gender: json['gender'],
      heightCm: (json['height_cm'] as num?)?.toDouble(),
      weightKg: (json['weight_kg'] as num?)?.toDouble(),
      activityLevel: json['activity_level'],
      goalType: json['goal_type'],
      goalWeightKg: (json['goal_weight_kg'] as num?)?.toDouble(),
      goalPeriodWeeks: json['goal_period_weeks'],
      dailyCaloriesTarget: (json['daily_calories_target'] as num?)?.toDouble(),
      dailyProteinTarget: (json['daily_protein_target'] as num?)?.toDouble(),
      dailyCarbsTarget: (json['daily_carbs_target'] as num?)?.toDouble(),
      dailyFatTarget: (json['daily_fat_target'] as num?)?.toDouble(),
      foodAllergies: json['food_allergies'] != null 
          ? List<String>.from(json['food_allergies']) 
          : null,
    );
  }

  UserModel copyWith({
    int? id,
    String? email,
    String? fullName,
    bool? isProfileComplete,
    int? age,
    String? gender,
    double? heightCm,
    double? weightKg,
    String? activityLevel,
    String? goalType,
    double? goalWeightKg,
    int? goalPeriodWeeks,
    double? dailyCaloriesTarget,
    double? dailyProteinTarget,
    double? dailyCarbsTarget,
    double? dailyFatTarget,
    List<String>? foodAllergies,
  }) {
    return UserModel(
      id: id ?? this.id,
      email: email ?? this.email,
      fullName: fullName ?? this.fullName,
      isProfileComplete: isProfileComplete ?? this.isProfileComplete,
      age: age ?? this.age,
      gender: gender ?? this.gender,
      heightCm: heightCm ?? this.heightCm,
      weightKg: weightKg ?? this.weightKg,
      activityLevel: activityLevel ?? this.activityLevel,
      goalType: goalType ?? this.goalType,
      goalWeightKg: goalWeightKg ?? this.goalWeightKg,
      goalPeriodWeeks: goalPeriodWeeks ?? this.goalPeriodWeeks,
      dailyCaloriesTarget: dailyCaloriesTarget ?? this.dailyCaloriesTarget,
      dailyProteinTarget: dailyProteinTarget ?? this.dailyProteinTarget,
      dailyCarbsTarget: dailyCarbsTarget ?? this.dailyCarbsTarget,
      dailyFatTarget: dailyFatTarget ?? this.dailyFatTarget,
      foodAllergies: foodAllergies ?? this.foodAllergies,
    );
  }
}
