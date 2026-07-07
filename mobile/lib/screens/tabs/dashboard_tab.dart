import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../providers/dashboard_provider.dart';
import '../../models/dashboard_model.dart';
import '../../config/theme.dart';
import '../../widgets/animated_gradient_ring.dart';

class DashboardTab extends StatefulWidget {
  const DashboardTab({super.key});

  @override
  State<DashboardTab> createState() => _DashboardTabState();
}

class _DashboardTabState extends State<DashboardTab>
    with SingleTickerProviderStateMixin {
  late AnimationController _entranceController;

  @override
  void initState() {
    super.initState();
    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..forward();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardProvider>().loadDashboard();
    });
  }

  @override
  void dispose() {
    _entranceController.dispose();
    super.dispose();
  }

  Widget _buildAnimated({required int index, required Widget child}) {
    final interval = Interval((index * 0.1).clamp(0, 1), ((index * 0.1) + 0.5).clamp(0, 1), curve: Curves.easeOutCubic);
    return AnimatedBuilder(
      animation: _entranceController,
      builder: (_, child) {
        final curved = CurvedAnimation(parent: _entranceController, curve: interval);
        return FadeTransition(
          opacity: curved,
          child: SlideTransition(
            position: Tween<Offset>(begin: const Offset(0, 0.1), end: Offset.zero).animate(curved),
            child: child,
          ),
        );
      },
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Consumer<DashboardProvider>(
      builder: (context, dashboard, child) {
        if (dashboard.isLoading && dashboard.todaySummary == null) {
          return Center(child: CircularProgressIndicator(color: primaryColor));
        }

        if (dashboard.error != null && dashboard.todaySummary == null) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 48, color: NutriFlowTheme.coral),
                const SizedBox(height: 16),
                Text(dashboard.error!, style: TextStyle(color: NutriFlowTheme.secondaryText(context))),
                TextButton(onPressed: () => dashboard.loadDashboard(), child: const Text('Retry')),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: () => dashboard.loadDashboard(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // ── Header (flat, consistent with food log) ──
                SafeArea(
                  bottom: false,
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Dashboard',
                            style: TextStyle(color: NutriFlowTheme.secondaryText(context), fontSize: 14)),
                        const SizedBox(height: 4),
                        Text("Today's Overview",
                            style: TextStyle(
                              color: Theme.of(context).colorScheme.onSurface,
                              fontSize: 26,
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.5,
                            )),
                      ],
                    ),
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      _buildAnimated(index: 0, child: _TodaySummaryCard(summary: dashboard.todaySummary!)),
                      const SizedBox(height: 20),
                      _buildAnimated(
                        index: 1,
                        child: _SectionTitle(title: 'Meal Breakdown', icon: Icons.restaurant_menu),
                      ),
                      const SizedBox(height: 12),
                      _buildAnimated(index: 2, child: _MealBreakdownCards(meals: dashboard.todaySummary!.meals)),
                      const SizedBox(height: 20),
                      _buildAnimated(
                        index: 3,
                        child: _SectionTitle(title: 'Weekly Progress', icon: Icons.trending_up),
                      ),
                      const SizedBox(height: 12),
                      _buildAnimated(
                        index: 4,
                        child: _WeeklyProgressCard(
                          weeklyData: dashboard.weeklySummary,
                          calorieTarget: dashboard.todaySummary!.caloriesTarget,
                        ),
                      ),
                      const SizedBox(height: 20),
                      _buildAnimated(
                        index: 5,
                        child: _SectionTitle(title: 'Goal Progress', icon: Icons.flag_outlined),
                      ),
                      const SizedBox(height: 12),
                      if (dashboard.goalProgress != null)
                        _buildAnimated(
                          index: 6,
                          child: _GoalProgressCard(
                            goal: dashboard.goalProgress!,
                          ),
                        ),
                      const SizedBox(height: 80),
                    ],
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

// ── Section Title ──
class _SectionTitle extends StatelessWidget {
  final String title;
  final IconData icon;
  const _SectionTitle({required this.title, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Theme.of(context).colorScheme.primary),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
      ],
    );
  }
}

// ── Today's Summary Card ──
class _TodaySummaryCard extends StatelessWidget {
  final TodaySummaryModel summary;
  const _TodaySummaryCard({required this.summary});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;
    final progress = (summary.caloriesConsumed / summary.caloriesTarget).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: NutriFlowTheme.cardBackground(context),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: NutriFlowTheme.outlineVariant(context)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(isDark ? 0.08 : 0.03), blurRadius: 12, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          // Gradient Ring
          AnimatedGradientRing(
            progress: progress,
            size: 140,
            strokeWidth: 12,
            gradientColors: [primaryColor, NutriFlowTheme.teal],
            trackColor: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100,
            showGlow: false,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                TweenAnimationBuilder<int>(
                  tween: IntTween(begin: 0, end: summary.caloriesConsumed.round()),
                  duration: const Duration(milliseconds: 1200),
                  curve: Curves.easeOutCubic,
                  builder: (_, value, __) => Text(
                    '$value',
                    style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800),
                  ),
                ),
                Text('/ ${summary.caloriesTarget.round()} kcal',
                    style: TextStyle(color: NutriFlowTheme.secondaryText(context), fontSize: 12)),
              ],
            ),
          ),
          const SizedBox(height: 24),
          // Macro bars — Material Icons instead of emojis
          Row(
            children: [
              Expanded(child: _MacroBar(label: 'Protein', macro: summary.protein, icon: Icons.fitness_center,
                  color: const Color(0xFF448AFF))),
              const SizedBox(width: 12),
              Expanded(child: _MacroBar(label: 'Carbs', macro: summary.carbs, icon: Icons.grain,
                  color: const Color(0xFFFFB74D))),
              const SizedBox(width: 12),
              Expanded(child: _MacroBar(label: 'Fat', macro: summary.fat, icon: Icons.water_drop,
                  color: const Color(0xFFCE93D8))),
            ],
          ),
        ],
      ),
    );
  }
}

class _MacroBar extends StatelessWidget {
  final String label;
  final MacroSummary macro;
  final IconData icon;
  final Color color;
  const _MacroBar({required this.label, required this.macro, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    final pct = (macro.progress * 100).round();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 14, color: color),
            const SizedBox(width: 4),
            Expanded(child: Text(label, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 12))),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: LinearProgressIndicator(
            value: macro.progress.clamp(0.0, 1.0),
            backgroundColor: color.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation<Color>(color),
            minHeight: 6,
          ),
        ),
        const SizedBox(height: 4),
        FittedBox(
          fit: BoxFit.scaleDown,
          alignment: Alignment.centerLeft,
          child: Text('${macro.consumed.round()}/${macro.target.round()}g · $pct%',
              style: TextStyle(fontSize: 10, color: NutriFlowTheme.secondaryText(context))),
        ),
      ],
    );
  }
}

// ── Meal Breakdown ──
class _MealBreakdownCards extends StatelessWidget {
  final Map<String, MealSummary> meals;
  const _MealBreakdownCards({required this.meals});

  static const _mealIcons = {
    'breakfast': Icons.wb_sunny,
    'lunch': Icons.restaurant,
    'snack': Icons.cookie,
    'dinner': Icons.nightlight,
  };

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.25,
      children: [
        _MealCard(name: 'Breakfast', icon: _mealIcons['breakfast']!, data: meals['breakfast']!),
        _MealCard(name: 'Lunch', icon: _mealIcons['lunch']!, data: meals['lunch']!),
        _MealCard(name: 'Snack', icon: _mealIcons['snack']!, data: meals['snack']!),
        _MealCard(name: 'Dinner', icon: _mealIcons['dinner']!, data: meals['dinner']!),
      ],
    );
  }
}

class _MealCard extends StatelessWidget {
  final String name;
  final IconData icon;
  final MealSummary data;
  const _MealCard({required this.name, required this.icon, required this.data});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;
    final color = data.isOver ? NutriFlowTheme.coral : primaryColor;

    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: NutriFlowTheme.cardBackground(context),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: NutriFlowTheme.outlineVariant(context)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(isDark ? 0.06 : 0.02), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 8),
            Text(name, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
          ]),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text('${data.calories.round()} kcal',
                      style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: color)),
                ),
                FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: Text('Target: ${data.target.round()}',
                      style: TextStyle(fontSize: 11, color: NutriFlowTheme.secondaryText(context))),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Weekly Progress ──
class _WeeklyProgressCard extends StatelessWidget {
  final List<DailyCaloriesModel> weeklyData;
  final double calorieTarget;
  const _WeeklyProgressCard({required this.weeklyData, required this.calorieTarget});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;

    if (weeklyData.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: NutriFlowTheme.cardBackground(context),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: NutriFlowTheme.outlineVariant(context)),
        ),
        child: Center(child: Text('Not enough data yet', style: TextStyle(color: NutriFlowTheme.secondaryText(context)))),
      );
    }

    double maxVal = calorieTarget;
    for (var d in weeklyData) { if (d.calories > maxVal) maxVal = d.calories; }
    maxVal *= 1.2;

    final barGroups = weeklyData.asMap().entries.map((entry) {
      final data = entry.value;
      return BarChartGroupData(x: entry.key, barRods: [
        BarChartRodData(
          toY: data.calories,
          gradient: data.calories > calorieTarget
              ? const LinearGradient(colors: [NutriFlowTheme.coral, Color(0xFFE53935)], begin: Alignment.bottomCenter, end: Alignment.topCenter)
              : LinearGradient(colors: [primaryColor, NutriFlowTheme.teal], begin: Alignment.bottomCenter, end: Alignment.topCenter),
          width: 18,
          borderRadius: BorderRadius.circular(6),
        ),
      ]);
    }).toList();

    return Container(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
      decoration: BoxDecoration(
        color: NutriFlowTheme.cardBackground(context),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: NutriFlowTheme.outlineVariant(context)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(isDark ? 0.06 : 0.02), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: SizedBox(
        height: 200,
        child: BarChart(
          BarChartData(
            alignment: BarChartAlignment.spaceAround,
            maxY: maxVal,
            barTouchData: BarTouchData(
              touchTooltipData: BarTouchTooltipData(
                getTooltipItem: (group, groupIndex, rod, rodIndex) {
                  return BarTooltipItem(
                    '${rod.toY.round()} kcal',
                    TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12),
                  );
                },
              ),
            ),
            titlesData: FlTitlesData(
              show: true,
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  getTitlesWidget: (value, meta) {
                    if (value.toInt() >= weeklyData.length) return const SizedBox.shrink();
                    final dateStr = weeklyData[value.toInt()].date;
                    if (dateStr.isEmpty) return const SizedBox.shrink();
                    try {
                      final date = DateTime.parse(dateStr);
                      final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                      return Padding(
                        padding: const EdgeInsets.only(top: 8),
                        child: Text(days[date.weekday - 1],
                            style: TextStyle(fontSize: 10, color: NutriFlowTheme.secondaryText(context), fontWeight: FontWeight.w600)),
                      );
                    } catch (e) { return const SizedBox.shrink(); }
                  },
                  reservedSize: 28,
                ),
              ),
              leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              horizontalInterval: calorieTarget > 0 ? calorieTarget : 2000,
              getDrawingHorizontalLine: (value) => FlLine(
                color: NutriFlowTheme.coral.withOpacity(0.4),
                strokeWidth: 2,
                dashArray: [6, 4],
              ),
            ),
            borderData: FlBorderData(show: false),
            barGroups: barGroups,
          ),
        ),
      ),
    );
  }
}

// ── Goal Progress ──
class _GoalProgressCard extends StatelessWidget {
  final GoalProgressModel goal;

  const _GoalProgressCard({
    required this.goal,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;

    if (!goal.hasActiveGoal) {
      return Container(
        padding: const EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: NutriFlowTheme.cardBackground(context),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: NutriFlowTheme.outlineVariant(context)),
        ),
        child: Column(
          children: [
            Icon(Icons.flag, size: 32, color: primaryColor),
            const SizedBox(height: 12),
            const Text('No active goal found.'),
          ],
        ),
      );
    }

    String goalText = '';
    IconData goalIcon;
    if (goal.goalType == 'lose_weight') { goalText = 'Lose Weight'; goalIcon = Icons.trending_down; }
    else if (goal.goalType == 'gain_weight') { goalText = 'Gain Weight'; goalIcon = Icons.trending_up; }
    else { goalText = 'Maintain Weight'; goalIcon = Icons.balance; }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: NutriFlowTheme.cardBackground(context),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: NutriFlowTheme.outlineVariant(context)),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(isDark ? 0.06 : 0.02), blurRadius: 8, offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(children: [
                Icon(goalIcon, size: 22, color: primaryColor),
                const SizedBox(width: 10),
                Text(goalText, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
              ]),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                decoration: BoxDecoration(
                  color: primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('${goal.daysRemaining} days left',
                    style: TextStyle(color: primaryColor, fontWeight: FontWeight.w700, fontSize: 12)),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('${goal.startWeight.round()}kg', style: TextStyle(fontWeight: FontWeight.w600, color: NutriFlowTheme.secondaryText(context))),
              Text('${goal.currentWeight}kg', style: TextStyle(fontWeight: FontWeight.w800, color: primaryColor, fontSize: 22)),
              Text('${goal.targetWeight.round()}kg', style: TextStyle(fontWeight: FontWeight.w600, color: NutriFlowTheme.secondaryText(context))),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: goal.weightProgress,
              minHeight: 10,
              backgroundColor: isDark ? Colors.white.withOpacity(0.08) : Colors.grey.shade100,
              valueColor: AlwaysStoppedAnimation<Color>(primaryColor),
            ),
          ),
        ],
      ),
    );
  }
}
