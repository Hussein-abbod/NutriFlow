import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/food_item_model.dart';
import '../../providers/food_log_provider.dart';
import '../../widgets/edit_food_item_sheet.dart';
import '../../config/theme.dart';

class FoodConfirmScreen extends StatefulWidget {
  final List<FoodItemModel> items;
  final String mealType;
  final String logMethod;

  const FoodConfirmScreen({
    super.key,
    required this.items,
    required this.mealType,
    required this.logMethod,
  });

  @override
  State<FoodConfirmScreen> createState() => _FoodConfirmScreenState();
}

class _FoodConfirmScreenState extends State<FoodConfirmScreen>
    with SingleTickerProviderStateMixin {
  late List<FoodItemModel> _items;
  late AnimationController _controller;
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
    _items = List.from(widget.items);
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 700));
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  double get _totalCalories => _items.fold(0, (s, i) => s + i.calories);
  double get _totalProtein  => _items.fold(0, (s, i) => s + i.protein);
  double get _totalCarbs    => _items.fold(0, (s, i) => s + i.carbs);
  double get _totalFat      => _items.fold(0, (s, i) => s + i.fat);

  String _capitalize(String s) => s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

  Future<void> _submit() async {
    if (_items.isEmpty) return;
    setState(() => _submitting = true);

    final log = await context.read<FoodLogProvider>().submitFoodLog(
      mealType: widget.mealType,
      logMethod: widget.logMethod,
      items: _items,
    );

    if (!mounted) return;
    setState(() => _submitting = false);

    if (log != null) {
      Navigator.of(context).popUntil((route) => route.isFirst || route.settings.name == '/home');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.read<FoodLogProvider>().error ?? 'Failed to submit'),
          backgroundColor: NutriFlowTheme.coral,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Scaffold(
      appBar: AppBar(title: Text('Confirm ${_capitalize(widget.mealType)}')),
      body: Column(
        children: [
          // Summary card
          AnimatedBuilder(
            animation: _controller,
            builder: (_, child) => FadeTransition(
              opacity: _controller,
              child: SlideTransition(
                position: Tween<Offset>(begin: const Offset(0, -0.15), end: Offset.zero)
                    .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic)),
                child: child,
              ),
            ),
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: NutriFlowTheme.gradient(context),
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(color: primaryColor.withOpacity(0.15), blurRadius: 8, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                children: [
                  Text('Total Nutrition', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13)),
                  const SizedBox(height: 4),
                  TweenAnimationBuilder<int>(
                    tween: IntTween(begin: 0, end: _totalCalories.round()),
                    duration: const Duration(milliseconds: 900),
                    curve: Curves.easeOutCubic,
                    builder: (_, value, __) => Text('$value kcal',
                        style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.w800)),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _MacroChip(label: 'Protein', value: _totalProtein, icon: Icons.fitness_center),
                      _MacroChip(label: 'Carbs', value: _totalCarbs, icon: Icons.grain),
                      _MacroChip(label: 'Fat', value: _totalFat, icon: Icons.water_drop),
                    ],
                  ),
                ],
              ),
            ),
          ),

          // Items list
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _items.length,
              itemBuilder: (ctx, i) {
                final item = _items[i];
                return AnimatedBuilder(
                  animation: _controller,
                  builder: (_, child) => FadeTransition(
                    opacity: Tween<double>(begin: 0, end: 1).animate(
                      CurvedAnimation(parent: _controller,
                          curve: Interval((i * 0.1).clamp(0, 1), ((i * 0.1) + 0.5).clamp(0, 1), curve: Curves.easeOut)),
                    ),
                    child: child,
                  ),
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: NutriFlowTheme.cardBackground(context),
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100),
                      boxShadow: [
                        BoxShadow(color: Colors.black.withOpacity(isDark ? 0.12 : 0.03), blurRadius: 8, offset: const Offset(0, 2)),
                      ],
                    ),
                    child: Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: primaryColor.withOpacity(0.08),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Icon(Icons.restaurant, size: 18, color: primaryColor),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.foodName, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                              if (item.brandName != null)
                                Text(item.brandName!, style: TextStyle(color: NutriFlowTheme.secondaryText(context), fontSize: 12)),
                            ],
                          ),
                        ),
                        InkWell(
                          onTap: () async {
                            final updated = await showModalBottomSheet<FoodItemModel>(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (ctx) => EditFoodItemSheet(initialItem: item),
                            );
                            if (updated != null) setState(() => _items[i] = updated);
                          },
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                            decoration: BoxDecoration(
                              color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF5F7FA),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Row(
                              children: [
                                Column(
                                  crossAxisAlignment: CrossAxisAlignment.end,
                                  children: [
                                    Text(
                                      '${item.quantity == item.quantity.truncateToDouble() ? item.quantity.toInt() : item.quantity} ${item.unit}',
                                      style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 13),
                                    ),
                                    Text('${item.calories.round()} kcal',
                                        style: TextStyle(color: primaryColor, fontSize: 11, fontWeight: FontWeight.w700)),
                                  ],
                                ),
                                const SizedBox(width: 6),
                                Icon(Icons.edit, size: 14, color: NutriFlowTheme.secondaryText(context)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        InkWell(
                          onTap: () => setState(() => _items.removeAt(i)),
                          borderRadius: BorderRadius.circular(8),
                          child: Padding(
                            padding: const EdgeInsets.all(4),
                            child: Icon(Icons.close, color: NutriFlowTheme.coral, size: 18),
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

          // Confirm button
          Padding(
            padding: const EdgeInsets.all(16),
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: _submitting || _items.isEmpty ? null : NutriFlowTheme.gradient(context),
                color: _submitting || _items.isEmpty ? NutriFlowTheme.secondaryText(context).withOpacity(0.3) : null,
                borderRadius: BorderRadius.circular(16),
                boxShadow: _submitting || _items.isEmpty ? null : [
                  BoxShadow(color: primaryColor.withOpacity(0.15), blurRadius: 6, offset: const Offset(0, 2)),
                ],
              ),
              child: ElevatedButton(
                onPressed: _submitting || _items.isEmpty ? null : _submit,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent,
                  shadowColor: Colors.transparent,
                  minimumSize: const Size(double.infinity, 54),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: _submitting
                    ? const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                        SizedBox(height: 20, width: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5)),
                        SizedBox(width: 12),
                        Text('Logging meal...', style: TextStyle(color: Colors.white)),
                      ])
                    : const Text('Log Meal', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Colors.white)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MacroChip extends StatelessWidget {
  final String label;
  final double value;
  final IconData icon;

  const _MacroChip({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, size: 16, color: Colors.white.withOpacity(0.9)),
        const SizedBox(height: 4),
        Text('${value.round()}g', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 18)),
        Text(label, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 11)),
      ],
    );
  }
}
