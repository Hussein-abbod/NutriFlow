import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/onboarding_provider.dart';
import '../../widgets/glass_card.dart';

class StepGoalSelection extends StatefulWidget {
  const StepGoalSelection({super.key});

  @override
  State<StepGoalSelection> createState() => _StepGoalSelectionState();
}

class _StepGoalSelectionState extends State<StepGoalSelection> {
  String? _selectedGoal;
  double _targetWeight = 70;
  int _periodWeeks = 12;

  final List<Map<String, dynamic>> _goals = const [
    {'id': 'lose_weight', 'title': 'Lose Weight', 'icon': Icons.trending_down, 'color': Color(0xFFFF6B6B)},
    {'id': 'maintain_weight', 'title': 'Maintain', 'icon': Icons.balance, 'color': Color(0xFF64B5F6)},
    {'id': 'gain_weight', 'title': 'Gain Weight', 'icon': Icons.trending_up, 'color': Color(0xFF81C784)},
  ];

  void _updateProvider() {
    Provider.of<OnboardingProvider>(context, listen: false).setGoal(
      _selectedGoal ?? '',
      weight: _selectedGoal == 'maintain_weight' ? null : _targetWeight,
      weeks: _selectedGoal == 'maintain_weight' ? null : _periodWeeks,
    );
  }

  @override
  Widget build(BuildContext context) {
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
            child: const Icon(Icons.flag_outlined, size: 36, color: Colors.white),
          ),
          const SizedBox(height: 16),
          Text(
            'Your Goal',
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'What would you like to achieve?',
            style: TextStyle(color: Colors.white.withOpacity(0.7)),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),

          // Goal cards
          Row(
            children: _goals.map((goal) {
              final isSelected = _selectedGoal == goal['id'];
              return Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 4),
                  child: GestureDetector(
                    onTap: () {
                      setState(() => _selectedGoal = goal['id']);
                      _updateProvider();
                    },
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOutCubic,
                      padding: const EdgeInsets.symmetric(vertical: 20),
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
                      child: Column(
                        children: [
                          Icon(goal['icon'] as IconData, size: 28, color: isSelected ? Colors.white : Colors.white.withOpacity(0.7)),
                          const SizedBox(height: 10),
                          Text(
                            goal['title'],
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                              color: isSelected ? Colors.white : Colors.white.withOpacity(0.7),
                              fontSize: 13,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 28),

          if (_selectedGoal != null && _selectedGoal != 'maintain_weight') ...[
            GlassCard(
              padding: const EdgeInsets.all(20),
              opacity: 0.1,
              blurAmount: 12,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Target Weight', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.white.withOpacity(0.8))),
                  const SizedBox(height: 12),
                  TextFormField(
                    initialValue: _targetWeight.toStringAsFixed(1),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
                    decoration: InputDecoration(
                      suffixText: 'kg',
                      suffixStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                      filled: true,
                      fillColor: Colors.white.withOpacity(0.08),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                    ),
                    onChanged: (v) {
                      final val = double.tryParse(v);
                      if (val != null) {
                        _targetWeight = val;
                        _updateProvider();
                      }
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            GlassCard(
              padding: const EdgeInsets.all(20),
              opacity: 0.1,
              blurAmount: 12,
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('Goal Period', style: TextStyle(fontWeight: FontWeight.w600, color: Colors.white.withOpacity(0.8))),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text('$_periodWeeks weeks',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  SliderTheme(
                    data: SliderThemeData(
                      activeTrackColor: Colors.white,
                      inactiveTrackColor: Colors.white.withOpacity(0.2),
                      thumbColor: Colors.white,
                      overlayColor: Colors.white.withOpacity(0.1),
                      trackHeight: 6,
                    ),
                    child: Slider(
                      value: _periodWeeks.toDouble(),
                      min: 1,
                      max: 52,
                      divisions: 51,
                      onChanged: (v) {
                        setState(() => _periodWeeks = v.toInt());
                        _updateProvider();
                      },
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
