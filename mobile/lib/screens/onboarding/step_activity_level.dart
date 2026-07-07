import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/onboarding_provider.dart';

class StepActivityLevel extends StatelessWidget {
  const StepActivityLevel({super.key});

  final List<Map<String, dynamic>> _levels = const [
    {'id': 'sedentary', 'title': 'Sedentary', 'subtitle': 'Desk job, little to no exercise', 'icon': Icons.weekend},
    {'id': 'lightly_active', 'title': 'Lightly Active', 'subtitle': 'Light exercise 1-3 days/week', 'icon': Icons.directions_walk},
    {'id': 'moderately_active', 'title': 'Moderately Active', 'subtitle': 'Moderate exercise 3-5 days/week', 'icon': Icons.fitness_center},
    {'id': 'very_active', 'title': 'Very Active', 'subtitle': 'Hard exercise 6-7 days/week', 'icon': Icons.directions_run},
    {'id': 'extra_active', 'title': 'Extra Active', 'subtitle': 'Physical job + hard exercise', 'icon': Icons.local_fire_department},
  ];

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<OnboardingProvider>(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.fitness_center, size: 36, color: Colors.white),
          ),
          const SizedBox(height: 16),
          Text(
            'Activity Level',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'How active are you on an average week?',
            style: TextStyle(color: Colors.white.withOpacity(0.7)),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),

          ..._levels.asMap().entries.map((entry) {
            final index = entry.key;
            final level = entry.value;
            final isSelected = provider.activityLevel == level['id'];

            return TweenAnimationBuilder<double>(
              tween: Tween(begin: 0.0, end: 1.0),
              duration: Duration(milliseconds: 400 + (index * 100)),
              curve: Curves.easeOutCubic,
              builder: (context, value, child) {
                return Transform.translate(
                  offset: Offset(0, 20 * (1 - value)),
                  child: Opacity(opacity: value, child: child),
                );
              },
              child: Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: GestureDetector(
                  onTap: () => provider.setActivityLevel(level['id']),
                  child: AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOutCubic,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isSelected ? Colors.white.withOpacity(0.2) : Colors.white.withOpacity(0.06),
                      border: Border.all(
                        color: isSelected ? Colors.white : Colors.white.withOpacity(0.12),
                        width: isSelected ? 2 : 1,
                      ),
                      borderRadius: BorderRadius.circular(16),
                      boxShadow: isSelected
                          ? [BoxShadow(color: Colors.white.withOpacity(0.05), blurRadius: 8)]
                          : null,
                    ),
                    child: Row(
                      children: [
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 300),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isSelected ? Colors.white.withOpacity(0.25) : Colors.white.withOpacity(0.08),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(level['icon'] as IconData, size: 22, color: isSelected ? Colors.white : Colors.white.withOpacity(0.7)),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                level['title'],
                                style: TextStyle(
                                  fontWeight: FontWeight.w700,
                                  fontSize: 16,
                                  color: isSelected ? Colors.white : Colors.white.withOpacity(0.8),
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                level['subtitle'],
                                style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13),
                              ),
                            ],
                          ),
                        ),
                        AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          width: 24,
                          height: 24,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: isSelected ? Colors.white : Colors.transparent,
                            border: Border.all(
                              color: isSelected ? Colors.white : Colors.white.withOpacity(0.3),
                              width: 2,
                            ),
                          ),
                          child: isSelected
                              ? const Icon(Icons.check, size: 16, color: Color(0xFF4A148C))
                              : null,
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          }),
        ],
      ),
    );
  }
}
