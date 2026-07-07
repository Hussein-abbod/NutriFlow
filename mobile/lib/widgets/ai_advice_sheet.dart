import 'dart:ui';
import 'package:flutter/material.dart';
import '../models/food_log_model.dart';
import '../config/theme.dart';

class AiAdviceSheet extends StatelessWidget {
  final String advice;
  final FoodLogModel log;
  final double remainingCalories;
  final VoidCallback? onDiscussWithCoach;

  const AiAdviceSheet({
    super.key,
    required this.advice,
    required this.log,
    required this.remainingCalories,
    this.onDiscussWithCoach,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;

    return BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 5, sigmaY: 5),
      child: Container(
        decoration: BoxDecoration(
          color: NutriFlowTheme.surfaceColor(context),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            const SizedBox(height: 12),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.15) : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),

            // Green header
            Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: NutriFlowTheme.gradient(context),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(color: primaryColor.withOpacity(0.15), blurRadius: 8, offset: const Offset(0, 4)),
                ],
              ),
              child: Column(
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.auto_awesome, color: Colors.white, size: 20),
                      ),
                      const SizedBox(width: 12),
                      const Text('NutriFlow Advice',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 18)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Text(advice, style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.6)),
                ],
              ),
            ),

            // Stats
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white.withOpacity(0.04) : const Color(0xFFF5F7FA),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _StatPill(label: 'This Meal', value: '${log.totalCalories?.round() ?? 0} kcal',
                        color: primaryColor),
                    Container(width: 1, height: 40,
                        color: isDark ? Colors.white.withOpacity(0.08) : Colors.grey.shade200),
                    _StatPill(label: 'Remaining', value: '${remainingCalories.round().clamp(0, 99999)} kcal',
                        color: NutriFlowTheme.blue),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Actions
            if (onDiscussWithCoach != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: OutlinedButton.icon(
                  onPressed: () {
                    onDiscussWithCoach!();
                  },
                  icon: const Icon(Icons.chat_bubble_outline, size: 18),
                  label: const Text('Discuss with Coach AI'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: NutriFlowTheme.purple,
                    side: BorderSide(color: NutriFlowTheme.purple.withOpacity(0.4)),
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                ),
              ),
            const SizedBox(height: 8),

            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: NutriFlowTheme.gradient(context),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: ElevatedButton(
                  onPressed: () => Navigator.pop(context),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    minimumSize: const Size(double.infinity, 50),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  child: const Text('Got it!', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatPill extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  const _StatPill({required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontWeight: FontWeight.w800, fontSize: 18, color: color)),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(color: NutriFlowTheme.secondaryText(context), fontSize: 12)),
      ],
    );
  }
}
