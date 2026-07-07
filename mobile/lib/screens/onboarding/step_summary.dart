import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/onboarding_provider.dart';
import '../../widgets/glass_card.dart';

class StepSummary extends StatelessWidget {
  const StepSummary({super.key});

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<OnboardingProvider>(context);
    final targets = provider.targets;

    if (targets == null) {
      return const Center(child: CircularProgressIndicator(color: Colors.white));
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Celebration icon
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.celebration, size: 40, color: Colors.white),
          ),
          const SizedBox(height: 16),
          Text(
            'Your Plan is Ready!',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Based on your profile and goals, here are your daily targets',
            style: TextStyle(color: Colors.white.withOpacity(0.7)),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),

          // Calories Card — Hero
          GlassCard(
            padding: const EdgeInsets.all(28),
            opacity: 0.15,
            blurAmount: 16,
            child: Column(
              children: [
                Text('Daily Calories',
                    style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 14, fontWeight: FontWeight.w500)),
                const SizedBox(height: 8),
                TweenAnimationBuilder<int>(
                  tween: IntTween(begin: 0, end: targets['daily_calories'].round()),
                  duration: const Duration(milliseconds: 1200),
                  curve: Curves.easeOutCubic,
                  builder: (context, value, _) {
                    return Text(
                      '$value',
                      style: const TextStyle(color: Colors.white, fontSize: 48, fontWeight: FontWeight.w800, letterSpacing: -1),
                    );
                  },
                ),
                const Text('kcal', style: TextStyle(color: Colors.white70, fontSize: 16)),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Macros
          Row(
            children: [
              _MacroCard(title: 'Protein', amount: targets['daily_protein'].round(), unit: 'g', icon: Icons.fitness_center,
                  color: const Color(0xFF64B5F6)),
              const SizedBox(width: 10),
              _MacroCard(title: 'Carbs', amount: targets['daily_carbs'].round(), unit: 'g', icon: Icons.grain,
                  color: const Color(0xFFFFB74D)),
              const SizedBox(width: 10),
              _MacroCard(title: 'Fat', amount: targets['daily_fat'].round(), unit: 'g', icon: Icons.water_drop,
                  color: const Color(0xFFCE93D8)),
            ],
          ),
          const SizedBox(height: 24),

          if (provider.goalPeriodWeeks != null) ...[
            GlassCard(
              padding: const EdgeInsets.all(20),
              opacity: 0.1,
              blurAmount: 12,
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.15),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.calendar_today, color: Colors.white, size: 20),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Timeline', style: TextStyle(color: Colors.white.withOpacity(0.7), fontSize: 13)),
                        Text('${provider.goalPeriodWeeks} weeks to reach your goal',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _MacroCard extends StatelessWidget {
  final String title;
  final int amount;
  final String unit;
  final IconData icon;
  final Color color;

  const _MacroCard({required this.title, required this.amount, required this.unit, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GlassCard(
        padding: const EdgeInsets.all(16),
        opacity: 0.1,
        blurAmount: 10,
        child: Column(
          children: [
            Icon(icon, size: 22, color: color),
            const SizedBox(height: 8),
            TweenAnimationBuilder<int>(
              tween: IntTween(begin: 0, end: amount),
              duration: const Duration(milliseconds: 1000),
              curve: Curves.easeOutCubic,
              builder: (context, value, _) {
                return Text('$value$unit',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white));
              },
            ),
            const SizedBox(height: 4),
            Text(title, style: TextStyle(color: Colors.white.withOpacity(0.6), fontSize: 12, fontWeight: FontWeight.w500)),
          ],
        ),
      ),
    );
  }
}
