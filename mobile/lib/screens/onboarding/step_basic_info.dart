import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/onboarding_provider.dart';
import '../../widgets/glass_card.dart';

class StepBasicInfo extends StatefulWidget {
  final GlobalKey<FormState> formKey;

  const StepBasicInfo({super.key, required this.formKey});

  @override
  State<StepBasicInfo> createState() => _StepBasicInfoState();
}

class _StepBasicInfoState extends State<StepBasicInfo>
    with SingleTickerProviderStateMixin {
  int _age = 25;
  String _gender = 'male';
  double _height = 170;
  double _weight = 70;
  late AnimationController _entranceController;

  @override
  void initState() {
    super.initState();
    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    )..forward();
  }

  @override
  void dispose() {
    _entranceController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
      child: Form(
        key: widget.formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildAnimated(
              index: 0,
              child: Column(
                children: [
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.person_outline, size: 36, color: Colors.white),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Basic Information',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tell us about yourself',
                    style: TextStyle(color: Colors.white.withOpacity(0.7)),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 28),

            // Gender Selection
            _buildAnimated(
              index: 1,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Gender', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white.withOpacity(0.8))),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(child: _GenderButton(title: 'Male', icon: Icons.male, isSelected: _gender == 'male',
                          onTap: () => setState(() => _gender = 'male'))),
                      const SizedBox(width: 12),
                      Expanded(child: _GenderButton(title: 'Female', icon: Icons.female, isSelected: _gender == 'female',
                          onTap: () => setState(() => _gender = 'female'))),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Age
            _buildAnimated(
              index: 2,
              child: GlassCard(
                padding: const EdgeInsets.all(20),
                opacity: 0.1,
                blurAmount: 12,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Age', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white.withOpacity(0.8))),
                    const SizedBox(height: 8),
                    TextFormField(
                      initialValue: _age.toString(),
                      keyboardType: TextInputType.number,
                      style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
                      decoration: InputDecoration(
                        suffixText: 'years',
                        suffixStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.08),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      ),
                      validator: (v) {
                        final val = int.tryParse(v ?? '');
                        if (val == null || val < 10 || val > 100) return 'Enter a valid age (10-100)';
                        return null;
                      },
                      onSaved: (v) => _age = int.parse(v!),
                      onChanged: (v) => setState(() { if (int.tryParse(v) != null) _age = int.parse(v); }),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Height
            _buildAnimated(
              index: 3,
              child: GlassCard(
                padding: const EdgeInsets.all(20),
                opacity: 0.1,
                blurAmount: 12,
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Height', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white.withOpacity(0.8))),
                        Text('${_height.toStringAsFixed(1)} cm',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SliderTheme(
                      data: SliderThemeData(
                        activeTrackColor: Colors.white,
                        inactiveTrackColor: Colors.white.withOpacity(0.2),
                        thumbColor: Colors.white,
                        overlayColor: Colors.white.withOpacity(0.1),
                        trackHeight: 6,
                      ),
                      child: Slider(
                        value: _height, min: 100, max: 250,
                        onChanged: (v) => setState(() => _height = v),
                      ),
                    ),
                    TextFormField(
                      key: ValueKey('height_$_height'),
                      initialValue: _height.toStringAsFixed(1),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        suffixText: 'cm',
                        suffixStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.08),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      ),
                      validator: (v) {
                        final val = double.tryParse(v ?? '');
                        if (val == null || val <= 0 || val > 300) return 'Invalid height';
                        return null;
                      },
                      onSaved: (v) => _height = double.parse(v!),
                      onChanged: (v) {
                        final val = double.tryParse(v);
                        if (val != null && val >= 100 && val <= 250) setState(() => _height = val);
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Weight
            _buildAnimated(
              index: 4,
              child: GlassCard(
                padding: const EdgeInsets.all(20),
                opacity: 0.1,
                blurAmount: 12,
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Weight', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: Colors.white.withOpacity(0.8))),
                        Text('${_weight.toStringAsFixed(1)} kg',
                            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 16)),
                      ],
                    ),
                    const SizedBox(height: 8),
                    SliderTheme(
                      data: SliderThemeData(
                        activeTrackColor: Colors.white,
                        inactiveTrackColor: Colors.white.withOpacity(0.2),
                        thumbColor: Colors.white,
                        overlayColor: Colors.white.withOpacity(0.1),
                        trackHeight: 6,
                      ),
                      child: Slider(
                        value: _weight, min: 30, max: 200,
                        onChanged: (v) => setState(() => _weight = v),
                      ),
                    ),
                    TextFormField(
                      key: ValueKey('weight_$_weight'),
                      initialValue: _weight.toStringAsFixed(1),
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      style: const TextStyle(color: Colors.white),
                      decoration: InputDecoration(
                        suffixText: 'kg',
                        suffixStyle: TextStyle(color: Colors.white.withOpacity(0.5)),
                        filled: true,
                        fillColor: Colors.white.withOpacity(0.08),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
                      ),
                      validator: (v) {
                        final val = double.tryParse(v ?? '');
                        if (val == null || val <= 0 || val > 500) return 'Invalid weight';
                        return null;
                      },
                      onSaved: (v) {
                        _weight = double.parse(v!);
                        Provider.of<OnboardingProvider>(context, listen: false)
                            .setBasicInfo(_age, _gender, _height, _weight);
                      },
                      onChanged: (v) {
                        final val = double.tryParse(v);
                        if (val != null && val >= 30 && val <= 200) setState(() => _weight = val);
                      },
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildAnimated({required int index, required Widget child}) {
    final interval = Interval((index * 0.12).clamp(0, 1), ((index * 0.12) + 0.5).clamp(0, 1), curve: Curves.easeOutCubic);
    return AnimatedBuilder(
      animation: _entranceController,
      builder: (_, child) {
        final curved = CurvedAnimation(parent: _entranceController, curve: interval);
        return FadeTransition(
          opacity: curved,
          child: SlideTransition(
            position: Tween<Offset>(begin: const Offset(0, 0.12), end: Offset.zero).animate(curved),
            child: child,
          ),
        );
      },
      child: child,
    );
  }
}

class _GenderButton extends StatelessWidget {
  final String title;
  final IconData icon;
  final bool isSelected;
  final VoidCallback onTap;

  const _GenderButton({required this.title, required this.icon, required this.isSelected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        curve: Curves.easeOutCubic,
        padding: const EdgeInsets.symmetric(vertical: 20),
        decoration: BoxDecoration(
          color: isSelected ? Colors.white.withOpacity(0.2) : Colors.white.withOpacity(0.06),
          border: Border.all(
            color: isSelected ? Colors.white : Colors.white.withOpacity(0.15),
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(16),
          boxShadow: isSelected
              ? [BoxShadow(color: Colors.white.withOpacity(0.05), blurRadius: 6)]
              : null,
        ),
        child: Column(
          children: [
            Icon(icon, size: 36, color: isSelected ? Colors.white : Colors.white.withOpacity(0.5)),
            const SizedBox(height: 8),
            Text(title, style: TextStyle(
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? Colors.white : Colors.white.withOpacity(0.6),
              fontSize: 15,
            )),
          ],
        ),
      ),
    );
  }
}
