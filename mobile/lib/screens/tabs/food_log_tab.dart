import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/food_log_provider.dart';
import '../../providers/auth_provider.dart';
import '../../providers/dashboard_provider.dart';
import '../../models/food_log_model.dart';
import '../../config/theme.dart';
import '../food_log/add_food_sheet.dart';
import '../../widgets/ai_advice_sheet.dart';
import 'package:image_picker/image_picker.dart';
import '../home_screen.dart';

class FoodLogTab extends StatefulWidget {
  const FoodLogTab({super.key});

  @override
  State<FoodLogTab> createState() => _FoodLogTabState();
}

class _FoodLogTabState extends State<FoodLogTab> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  int _selectedDayOffset = 0; // 0 = today

  static const _meals = [
    {'key': 'breakfast', 'label': 'Breakfast', 'icon': Icons.wb_sunny, 'pct': 0.25},
    {'key': 'lunch',     'label': 'Lunch',     'icon': Icons.restaurant, 'pct': 0.35},
    {'key': 'snack',     'label': 'Snack',     'icon': Icons.cookie,     'pct': 0.10},
    {'key': 'dinner',    'label': 'Dinner',    'icon': Icons.nightlight,  'pct': 0.30},
  ];

  static Color _mealIconColor(BuildContext context, String key) {
    final cs = Theme.of(context).colorScheme;
    switch (key) {
      case 'breakfast': return cs.tertiary;
      case 'lunch':     return cs.onTertiary == Colors.white ? const Color(0xFF004DA8) : cs.tertiary;
      case 'snack':     return cs.primary;
      case 'dinner':    return cs.onSecondaryContainer;
      default:          return cs.primary;
    }
  }

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000));
    _animController.forward();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FoodLogProvider>().loadToday();
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _showAdviceIfAvailable() {
    final provider = context.read<FoodLogProvider>();
    if (provider.lastAdvice != null && provider.lastSubmittedLog != null) {
      final advice = provider.lastAdvice!;
      final log = provider.lastSubmittedLog!;
      final remaining = (context.read<AuthProvider>().user?.dailyCaloriesTarget ?? 2000) -
          provider.totalCaloriesToday;

      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (!mounted) return;
        showModalBottomSheet(
          context: context,
          isScrollControlled: true,
          backgroundColor: Colors.transparent,
          builder: (sheetContext) => AiAdviceSheet(
            advice: advice,
            log: log,
            remainingCalories: remaining,
            onDiscussWithCoach: () {
              Navigator.pop(sheetContext, true);
            },
          ),
        ).then((discuss) {
          provider.clearAdvice();
          if (discuss == true) {
            HomeScreen.switchTab(context, 2, coachContext: advice);
          }
        });
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Consumer2<FoodLogProvider, AuthProvider>(
      builder: (context, foodLog, auth, _) {
        final dailyCal = auth.user?.dailyCaloriesTarget ?? 2000;
        final consumed = foodLog.totalCaloriesToday;
        final remaining = (dailyCal - consumed).round().clamp(0, 99999);
        final progress = (consumed / dailyCal).clamp(0.0, 1.0);
        final userName = auth.user?.fullName?.split(' ').first ?? '';

        return RefreshIndicator(
          color: primaryColor,
          onRefresh: () => foodLog.loadDate(foodLog.selectedDate),
          child: CustomScrollView(
            slivers: [
              // ── Top App Bar ──
              SliverToBoxAdapter(
                child: Container(
                  color: Theme.of(context).scaffoldBackgroundColor.withOpacity(0.8),
                  child: SafeArea(
                    bottom: false,
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(20, 12, 20, 8),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              // User avatar
                              Container(
                                width: 32,
                                height: 32,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: primaryColor.withOpacity(0.1),
                                  border: Border.all(
                                    color: NutriFlowTheme.outlineVariant(context),
                                  ),
                                ),
                                child: Center(
                                  child: Text(
                                    userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                                    style: TextStyle(
                                      color: primaryColor,
                                      fontWeight: FontWeight.w700,
                                      fontSize: 14,
                                    ),
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'NutriFlow',
                                style: TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.w700,
                                  color: primaryColor,
                                  letterSpacing: -0.5,
                                ),
                              ),
                            ],
                          ),
                          IconButton(
                            onPressed: () {},
                            icon: Icon(
                              Icons.notifications_outlined,
                              color: NutriFlowTheme.secondaryText(context),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // ── Daily Calendar Selector ──
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 80,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: 7,
                    itemBuilder: (context, index) {
                      final dayOffset = index - 3; // 3 days before, today, 3 after
                      final date = DateTime.now().add(Duration(days: dayOffset));
                      final isToday = dayOffset == _selectedDayOffset;
                      final dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

                      return Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 4),
                        child: GestureDetector(
                          onTap: () {
                            setState(() => _selectedDayOffset = dayOffset);
                            context.read<FoodLogProvider>().loadDate(date);
                          },
                          child: AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            width: isToday ? 56 : 48,
                            decoration: BoxDecoration(
                              color: isToday ? primaryColor : NutriFlowTheme.surfaceColor(context),
                              borderRadius: BorderRadius.circular(14),
                              border: isToday
                                  ? null
                                  : Border.all(color: NutriFlowTheme.outlineVariant(context)),
                              boxShadow: isToday
                                  ? [BoxShadow(color: primaryColor.withOpacity(0.15), blurRadius: 12, offset: const Offset(0, 4))]
                                  : null,
                            ),
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  dayNames[date.weekday - 1],
                                  style: TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w500,
                                    color: isToday
                                        ? Colors.white.withOpacity(0.9)
                                        : NutriFlowTheme.secondaryText(context),
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  '${date.day}',
                                  style: TextStyle(
                                    fontSize: isToday ? 20 : 18,
                                    fontWeight: FontWeight.w600,
                                    color: isToday ? Colors.white : Theme.of(context).colorScheme.onSurface,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),

              // ── Daily Summary Widget ──
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: NutriFlowTheme.surfaceColor(context).withOpacity(0.8),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: NutriFlowTheme.outlineVariant(context)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(isDark ? 0.08 : 0.03),
                          blurRadius: 20,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'CALORIES REMAINING',
                              style: TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w500,
                                color: NutriFlowTheme.secondaryText(context),
                                letterSpacing: 1.0,
                              ),
                            ),
                            const SizedBox(height: 6),
                            RichText(
                              text: TextSpan(
                                children: [
                                  TextSpan(
                                    text: '$remaining',
                                    style: TextStyle(
                                      fontSize: 28,
                                      fontWeight: FontWeight.w700,
                                      color: Theme.of(context).colorScheme.onSurface,
                                      letterSpacing: -0.5,
                                    ),
                                  ),
                                  TextSpan(
                                    text: ' / ${dailyCal.round()}',
                                    style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w400,
                                      color: NutriFlowTheme.secondaryText(context),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        // Calorie ring with fire icon
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: NutriFlowTheme.outlineVariant(context).withOpacity(0.5),
                              width: 3,
                            ),
                          ),
                          child: Stack(
                            alignment: Alignment.center,
                            children: [
                              SizedBox(
                                width: 56,
                                height: 56,
                                child: CircularProgressIndicator(
                                  value: progress,
                                  strokeWidth: 3,
                                  backgroundColor: Colors.transparent,
                                  valueColor: AlwaysStoppedAnimation<Color>(primaryColor),
                                  strokeCap: StrokeCap.round,
                                ),
                              ),
                              Icon(
                                Icons.local_fire_department,
                                color: primaryColor,
                                size: 22,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              // ── Meal Sections ──
              SliverPadding(
                padding: const EdgeInsets.fromLTRB(20, 4, 20, 16),
                sliver: SliverList(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) {
                      final meal = _meals[i];
                      final target = dailyCal * (meal['pct'] as double);
                      final logs = foodLog.todayLogs?.getByMeal(meal['key'] as String) ?? [];

                      return AnimatedBuilder(
                        animation: _animController,
                        builder: (_, child) {
                          final interval = Interval(i * 0.12, (i * 0.12 + 0.5).clamp(0, 1), curve: Curves.easeOutCubic);
                          final curved = CurvedAnimation(parent: _animController, curve: interval);
                          return FadeTransition(
                            opacity: curved,
                            child: SlideTransition(
                              position: Tween<Offset>(begin: const Offset(0, 0.15), end: Offset.zero).animate(curved),
                              child: child,
                            ),
                          );
                        },
                        child: _MealSection(
                          mealKey: meal['key'] as String,
                          label: meal['label'] as String,
                          icon: meal['icon'] as IconData,
                          iconColor: _mealIconColor(context, meal['key'] as String),
                          calorieTarget: target,
                          logs: logs,
                          onAdd: () => _openAddFood(meal['key'] as String),
                        ),
                      );
                    },
                    childCount: _meals.length,
                  ),
                ),
              ),
              // Bottom padding for nav bar
              const SliverToBoxAdapter(child: SizedBox(height: 60)),
            ],
          ),
        );
      },
    );
  }

  void _openAddFood(String mealType) async {
    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AddFoodSheet(mealType: mealType),
    );

    if (result == null) return;
    if (!mounted) return;

    if (result == 'barcode') {
      await Navigator.push(context, MaterialPageRoute(builder: (_) => BarcodeScannerScreen(mealType: mealType)));
    } else if (result == 'image_camera') {
      await Navigator.push(context, MaterialPageRoute(builder: (_) => CameraFoodScreen(mealType: mealType, source: ImageSource.camera)));
    } else if (result == 'image_gallery') {
      await Navigator.push(context, MaterialPageRoute(builder: (_) => CameraFoodScreen(mealType: mealType, source: ImageSource.gallery)));
    } else if (result == 'text') {
      await Navigator.push(context, MaterialPageRoute(builder: (_) => TextFoodScreen(mealType: mealType)));
    }

    if (mounted) {
      context.read<DashboardProvider>().loadDashboard();
    }
    _showAdviceIfAvailable();
  }
}


// ═══════════════════════════════════════════════════
// Meal Section Card — matches reference design
// ═══════════════════════════════════════════════════

class _MealSection extends StatefulWidget {
  final String mealKey;
  final String label;
  final IconData icon;
  final Color iconColor;
  final double calorieTarget;
  final List<FoodLogModel> logs;
  final VoidCallback onAdd;

  const _MealSection({
    required this.mealKey,
    required this.label,
    required this.icon,
    required this.iconColor,
    required this.calorieTarget,
    required this.logs,
    required this.onAdd,
  });

  @override
  State<_MealSection> createState() => _MealSectionState();
}

class _MealSectionState extends State<_MealSection> {
  double get _consumed => widget.logs.fold(0.0, (s, l) => s + (l.totalCalories ?? 0));

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;
    final hasItems = widget.logs.isNotEmpty && widget.logs.expand((l) => l.items).isNotEmpty;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: NutriFlowTheme.surfaceColor(context),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: NutriFlowTheme.outlineVariant(context)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.08 : 0.02),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header row with divider
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Icon(widget.icon, color: widget.iconColor, size: 22),
                    const SizedBox(width: 10),
                    Text(
                      widget.label,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                Text(
                  '${_consumed.round()} / ${widget.calorieTarget.round()} kcal',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 0.5,
                    color: hasItems ? primaryColor : NutriFlowTheme.secondaryText(context).withOpacity(0.5),
                  ),
                ),
              ],
            ),
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 8),
              child: Divider(
                height: 1,
                color: isDark
                    ? Colors.white.withOpacity(0.06)
                    : const Color(0xFFD9E3F6).withOpacity(0.5),
              ),
            ),

            // Food items or empty state
            if (!hasItems)
              // Empty state — dashed search button
              GestureDetector(
                onTap: widget.onAdd,
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withOpacity(0.02) : const Color(0xFFF8F9FF),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: NutriFlowTheme.outlineVariant(context),
                      style: BorderStyle.solid,
                    ),
                  ),
                  child: Column(
                    children: [
                      Icon(
                        Icons.search,
                        size: 20,
                        color: NutriFlowTheme.secondaryText(context).withOpacity(0.5),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'Log your ${widget.label.toLowerCase()}',
                        style: TextStyle(
                          fontSize: 13,
                          color: NutriFlowTheme.secondaryText(context),
                        ),
                      ),
                    ],
                  ),
                ),
              )
            else ...[
              // Food item tiles
              ...widget.logs.expand((log) => log.items).map((item) {
                return _FoodItemTile(item: item);
              }),
              const SizedBox(height: 4),
              // Add Food button
              GestureDetector(
                onTap: widget.onAdd,
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    children: [
                      Icon(Icons.add_circle, size: 18, color: primaryColor),
                      const SizedBox(width: 8),
                      Text(
                        'Add Food',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: primaryColor,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}


// ═══════════════════════════════════════════════════
// Food Item Tile — clean flat design
// ═══════════════════════════════════════════════════

class _FoodItemTile extends StatelessWidget {
  final FoodLogItemModel item;

  const _FoodItemTile({required this.item});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.foodName,
                  style: const TextStyle(fontWeight: FontWeight.w400, fontSize: 15),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  '${item.quantity?.round() ?? ''} ${item.unit ?? ''}'.trim(),
                  style: TextStyle(
                    color: NutriFlowTheme.secondaryText(context),
                    fontSize: 13,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.04) : const Color(0xFFF8F9FF),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${item.calories?.round() ?? 0}',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: NutriFlowTheme.secondaryText(context),
              ),
            ),
          ),
          const SizedBox(width: 4),
          InkWell(
            onTap: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (_) => AlertDialog(
                  title: const Text('Remove item?'),
                  content: Text('Remove ${item.foodName}?'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                    TextButton(onPressed: () => Navigator.pop(context, true),
                        child: Text('Remove', style: TextStyle(color: Theme.of(context).colorScheme.error))),
                  ],
                ),
              );
              if (confirmed == true && context.mounted) {
                await context.read<FoodLogProvider>().deleteItem(item.id);
                if (context.mounted) {
                  context.read<DashboardProvider>().loadDashboard();
                }
              }
            },
            borderRadius: BorderRadius.circular(8),
            child: Padding(
              padding: const EdgeInsets.all(4),
              child: Icon(Icons.close, size: 16, color: NutriFlowTheme.secondaryText(context)),
            ),
          ),
        ],
      ),
    );
  }
}
