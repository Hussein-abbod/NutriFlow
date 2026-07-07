import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/onboarding_provider.dart';

class StepAllergies extends StatefulWidget {
  const StepAllergies({super.key});

  @override
  State<StepAllergies> createState() => _StepAllergiesState();
}

class _StepAllergiesState extends State<StepAllergies> {
  final List<String> _selectedAllergies = [];
  final _customController = TextEditingController();

  final List<Map<String, dynamic>> _commonAllergies = const [
    {'id': 'Eggs', 'icon': Icons.egg_outlined},
    {'id': 'Milk/Dairy', 'icon': Icons.local_drink_outlined},
    {'id': 'Peanuts', 'icon': Icons.spa_outlined},
    {'id': 'Tree Nuts', 'icon': Icons.forest_outlined},
    {'id': 'Wheat/Gluten', 'icon': Icons.grass_outlined},
    {'id': 'Soy', 'icon': Icons.grain_outlined},
    {'id': 'Fish', 'icon': Icons.set_meal_outlined},
    {'id': 'Shellfish', 'icon': Icons.water_outlined},
    {'id': 'Sesame', 'icon': Icons.cookie_outlined},
  ];

  void _updateProvider() {
    final all = List<String>.from(_selectedAllergies);
    if (_customController.text.trim().isNotEmpty) {
      all.add(_customController.text.trim());
    }
    Provider.of<OnboardingProvider>(context, listen: false).setAllergies(all);
  }

  @override
  void dispose() {
    _customController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool isNone = _selectedAllergies.contains('None');

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
            child: const Icon(Icons.health_and_safety_outlined, size: 36, color: Colors.white),
          ),
          const SizedBox(height: 16),
          Text(
            'Food Allergies',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Select any food allergies or intolerances',
            style: TextStyle(color: Colors.white.withOpacity(0.7)),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),

          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: _commonAllergies.map((a) {
              final isSelected = _selectedAllergies.contains(a['id']);
              return GestureDetector(
                onTap: isNone
                    ? null
                    : () {
                        setState(() {
                          if (isSelected) {
                            _selectedAllergies.remove(a['id']);
                          } else {
                            _selectedAllergies.add(a['id']);
                          }
                        });
                        _updateProvider();
                      },
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeOutCubic,
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? Colors.white.withOpacity(0.25) : Colors.white.withOpacity(0.06),
                    border: Border.all(
                      color: isSelected ? Colors.white : Colors.white.withOpacity(0.15),
                      width: isSelected ? 2 : 1,
                    ),
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: isSelected
                        ? [BoxShadow(color: Colors.white.withOpacity(0.04), blurRadius: 6)]
                        : null,
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(a['icon'] as IconData, size: 18, color: isSelected ? Colors.white : Colors.white.withOpacity(0.7)),
                      const SizedBox(width: 8),
                      Text(
                        a['id'],
                        style: TextStyle(
                          color: isSelected ? Colors.white : Colors.white.withOpacity(0.7),
                          fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                          fontSize: 14,
                        ),
                      ),
                      if (isSelected) ...[
                        const SizedBox(width: 6),
                        const Icon(Icons.check_circle, size: 16, color: Colors.white),
                      ],
                    ],
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // None
          GestureDetector(
            onTap: () {
              setState(() {
                if (isNone) {
                  _selectedAllergies.remove('None');
                } else {
                  _selectedAllergies.clear();
                  _selectedAllergies.add('None');
                  _customController.clear();
                }
              });
              _updateProvider();
            },
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: isNone ? Colors.white.withOpacity(0.2) : Colors.white.withOpacity(0.06),
                border: Border.all(
                  color: isNone ? Colors.white : Colors.white.withOpacity(0.15),
                  width: isNone ? 2 : 1,
                ),
                borderRadius: BorderRadius.circular(14),
              ),
              child: Row(
                children: [
                  Icon(Icons.check_circle_outline, size: 18, color: isNone ? Colors.white : Colors.white.withOpacity(0.7)),
                  const SizedBox(width: 10),
                  Text(
                    'None',
                    style: TextStyle(
                      color: isNone ? Colors.white : Colors.white.withOpacity(0.7),
                      fontWeight: isNone ? FontWeight.w700 : FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 24),

          if (!isNone)
            TextFormField(
              controller: _customController,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                labelText: 'Other allergies (optional)',
                labelStyle: TextStyle(color: Colors.white.withOpacity(0.6)),
                hintText: 'e.g. Strawberries',
                hintStyle: TextStyle(color: Colors.white.withOpacity(0.3)),
                filled: true,
                fillColor: Colors.white.withOpacity(0.08),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: Colors.white.withOpacity(0.15)),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide(color: Colors.white.withOpacity(0.15)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: const BorderSide(color: Colors.white, width: 2),
                ),
              ),
              onChanged: (_) => _updateProvider(),
            ),
        ],
      ),
    );
  }
}
