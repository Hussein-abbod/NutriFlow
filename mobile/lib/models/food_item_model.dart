class FoodItemModel {
  final int? fdcId;
  final String foodName;
  final String? brandName;
  double quantity;
  String unit;
  final double caloriesPer100g;
  final double proteinPer100g;
  final double carbsPer100g;
  final double fatPer100g;
  final double fiberPer100g;
  final double sugarPer100g;
  final double sodiumPer100g;

  FoodItemModel({
    this.fdcId,
    required this.foodName,
    this.brandName,
    this.quantity = 100.0,
    this.unit = 'g',
    this.caloriesPer100g = 0,
    this.proteinPer100g = 0,
    this.carbsPer100g = 0,
    this.fatPer100g = 0,
    this.fiberPer100g = 0,
    this.sugarPer100g = 0,
    this.sodiumPer100g = 0,
  });

  double get _quantityInGrams {
    final u = unit.toLowerCase().trim();
    if (u == 'g' || u == 'gram' || u == 'grams' || u == 'grm') return quantity;
    if (u == 'oz' || u == 'ounce' || u == 'ounces' || u == 'unz') return quantity * 28.3495;
    if (u == 'lb' || u == 'lbs' || u == 'pound' || u == 'pounds') return quantity * 453.592;
    if (u == 'kg') return quantity * 1000.0;
    
    // Volume conversions
    if (u == 'ml' || u == 'mlt') return quantity; // rough estimate for liquids
    if (u == 'fl oz') return quantity * 29.5735;
    if (u.contains('cup')) return quantity * 240.0; // 1 cup is ~240g
    if (u.contains('tbsp') || u.contains('tablespoon')) return quantity * 15.0;
    if (u.contains('tsp') || u.contains('teaspoon')) return quantity * 5.0;
    
    // Reasonable estimates for common unit pieces
    if (u == 'small egg') return quantity * 40.0;
    if (u == 'medium egg') return quantity * 50.0;
    if (u == 'large egg' || u == 'egg' || u == 'eggs') return quantity * 60.0;
    if (u == 'bowl') return quantity * 250.0;
    if (u == 'slice' || u == 'slices') return quantity * 30.0;
    if (u == 'piece' || u == 'pieces') return quantity * 80.0;
    if (u == 'small') return quantity * 80.0;
    if (u == 'medium') return quantity * 130.0;
    if (u == 'large') return quantity * 200.0;

    // Default fallback: treat unknown units as grams (safest assumption)
    return quantity;
  }

  List<String> get availableUnits {
    final name = foodName.toLowerCase();
    if (name.contains('egg')) return ['large egg', 'medium egg', 'small egg', 'g', 'oz'];
    if (name.contains('milk') || name.contains('juice') || name.contains('water') || name.contains('oil') || name.contains('sauce')) 
      return ['cup', 'fl oz', 'ml', 'tbsp', 'tsp'];
    if (name.contains('rice') || name.contains('oat') || name.contains('cereal') || name.contains('pasta')) 
      return ['cup', 'bowl', 'g', 'oz'];
    if (name.contains('bread') || name.contains('toast') || name.contains('cake') || name.contains('pizza')) 
      return ['slice', 'g', 'oz'];
    if (name.contains('meat') || name.contains('chicken') || name.contains('beef') || name.contains('fish') || name.contains('steak'))
      return ['g', 'oz', 'lb', 'piece'];
    
    // Default fallback
    return ['g', 'oz', 'lb', 'ml', 'cup', 'tbsp', 'tsp', 'piece', 'small', 'medium', 'large', 'slice'];
  }

  double get scaleFactor => _quantityInGrams / 100.0;
  double get calories => _r(caloriesPer100g * scaleFactor);
  double get protein  => _r(proteinPer100g  * scaleFactor);
  double get carbs    => _r(carbsPer100g    * scaleFactor);
  double get fat      => _r(fatPer100g      * scaleFactor);

  double _r(double v) => double.parse(v.toStringAsFixed(1));

  factory FoodItemModel.fromJson(Map<String, dynamic> json) {
    return FoodItemModel(
      fdcId: json['fdc_id'],
      foodName: json['food_name'] ?? 'Unknown',
      brandName: json['brand_name'],
      quantity: (json['serving_size'] as num?)?.toDouble() ?? 100.0,
      unit: json['serving_unit'] ?? 'g',
      caloriesPer100g: (json['calories'] as num?)?.toDouble() ?? 0,
      proteinPer100g:  (json['protein']  as num?)?.toDouble() ?? 0,
      carbsPer100g:    (json['carbs']    as num?)?.toDouble() ?? 0,
      fatPer100g:      (json['fat']      as num?)?.toDouble() ?? 0,
      fiberPer100g:    (json['fiber']    as num?)?.toDouble() ?? 0,
      sugarPer100g:    (json['sugar']    as num?)?.toDouble() ?? 0,
      sodiumPer100g:   (json['sodium']   as num?)?.toDouble() ?? 0,
    );
  }

  Map<String, dynamic> toSubmitJson() => {
    'food_name': foodName,
    'brand_name': brandName,
    'quantity': quantity,
    'unit': unit,
    'calories': calories,
    'protein': protein,
    'carbs': carbs,
    'fat': fat,
    'fiber': _r(fiberPer100g * scaleFactor),
    'sodium': _r(sodiumPer100g * scaleFactor),
    'sugar': _r(sugarPer100g * scaleFactor),
    if (fdcId != null) 'nutritionix_food_id': fdcId.toString(),
  };

  FoodItemModel copyWith({double? quantity, String? unit}) {
    return FoodItemModel(
      fdcId: fdcId,
      foodName: foodName,
      brandName: brandName,
      quantity: quantity ?? this.quantity,
      unit: unit ?? this.unit,
      caloriesPer100g: caloriesPer100g,
      proteinPer100g: proteinPer100g,
      carbsPer100g: carbsPer100g,
      fatPer100g: fatPer100g,
      fiberPer100g: fiberPer100g,
      sugarPer100g: sugarPer100g,
      sodiumPer100g: sodiumPer100g,
    );
  }
}
