import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/onboarding_provider.dart';
import '../providers/auth_provider.dart';
import '../config/theme.dart';
import '../config/animations.dart';
import 'home_screen.dart';
import 'onboarding/step_welcome.dart';
import 'onboarding/step_basic_info.dart';
import 'onboarding/step_activity_level.dart';
import 'onboarding/step_goal_selection.dart';
import 'onboarding/step_allergies.dart';
import 'onboarding/step_summary.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen>
    with TickerProviderStateMixin {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  final int _totalPages = 6;

  final GlobalKey<FormState> _welcomeFormKey = GlobalKey<FormState>();
  final GlobalKey<FormState> _basicInfoFormKey = GlobalKey<FormState>();

  // Gradient colors that shift per step
  static const List<List<Color>> _stepGradients = [
    [Color(0xFF1B5E20), Color(0xFF00695C)], // Welcome — deep green
    [Color(0xFF0D47A1), Color(0xFF1565C0)], // Basic info — blue
    [Color(0xFF4A148C), Color(0xFF7B1FA2)], // Activity — purple
    [Color(0xFF00695C), Color(0xFF00826C)], // Goal — teal
    [Color(0xFF00695C), Color(0xFF00897B)], // Allergies — teal
    [Color(0xFF1B5E20), Color(0xFF2E7D32)], // Summary — back to green
  ];

  void _nextPage() async {
    final provider = Provider.of<OnboardingProvider>(context, listen: false);

    if (_currentPage == 0) {
      final authProv = Provider.of<AuthProvider>(context, listen: false);
      if (!authProv.isAuthenticated) {
        if (!_welcomeFormKey.currentState!.validate()) return;
      }
      _animateToPage(_currentPage + 1);
    } else if (_currentPage == 1) {
      if (!_basicInfoFormKey.currentState!.validate()) return;
      _basicInfoFormKey.currentState!.save();
      _animateToPage(_currentPage + 1);
    } else if (_currentPage == 2) {
      if (provider.activityLevel == null) {
        _showError('Please select an activity level');
        return;
      }
      final success = await provider.submitProfileInfo();
      if (success) {
        _animateToPage(_currentPage + 1);
      } else {
        _showError(provider.error ?? 'Failed to save profile');
      }
    } else if (_currentPage == 3) {
      if (provider.goalType == null) {
        _showError('Please select a goal');
        return;
      }
      final success = await provider.submitGoal();
      if (success) {
        _animateToPage(_currentPage + 1);
      } else {
        _showError(provider.error ?? 'Failed to save goal');
      }
    } else if (_currentPage == 4) {
      final success = await provider.submitAllergies();
      if (success) {
        _animateToPage(_currentPage + 1);
      } else {
        _showError(provider.error ?? 'Failed to save allergies');
      }
    } else if (_currentPage == 5) {
      final success = await provider.finishOnboarding();
      if (success) {
        if (!mounted) return;
        Navigator.of(context).pushReplacement(
          NutriAnimations.fadeThrough(const HomeScreen()),
        );
      } else {
        _showError(provider.error ?? 'Failed to complete onboarding');
      }
    }
  }

  void _animateToPage(int page) {
    _pageController.animateToPage(
      page,
      duration: const Duration(milliseconds: 500),
      curve: Curves.easeOutCubic,
    );
  }

  void _previousPage() {
    if (_currentPage > 0) {
      _pageController.previousPage(
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeOutCubic,
      );
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: NutriFlowTheme.coral,
      ),
    );
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final provider = Provider.of<OnboardingProvider>(context);
    final gradColors = _stepGradients[_currentPage.clamp(0, _stepGradients.length - 1)];

    return Scaffold(
      body: AnimatedContainer(
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOut,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: gradColors,
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // ── Animated Step Indicator ──
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 20.0),
                child: Row(
                  children: List.generate(_totalPages, (index) {
                    final isActive = index <= _currentPage;
                    final isCurrent = index == _currentPage;

                    return Expanded(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 400),
                        curve: Curves.easeOutCubic,
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        height: isCurrent ? 6 : 4,
                        decoration: BoxDecoration(
                          color: isActive
                              ? Colors.white
                              : Colors.white.withOpacity(0.25),
                          borderRadius: BorderRadius.circular(3),
                          boxShadow: isCurrent
                              ? [
                                  BoxShadow(
                                    color: Colors.white.withOpacity(0.2),
                                    blurRadius: 4,
                                    spreadRadius: 0,
                                  ),
                                ]
                              : null,
                        ),
                      ),
                    );
                  }),
                ),
              ),

              // ── Step Content ──
              Expanded(
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  onPageChanged: (index) => setState(() => _currentPage = index),
                  children: [
                    StepWelcome(formKey: _welcomeFormKey, onNext: _nextPage),
                    StepBasicInfo(formKey: _basicInfoFormKey),
                    const StepActivityLevel(),
                    const StepGoalSelection(),
                    const StepAllergies(),
                    const StepSummary(),
                  ],
                ),
              ),

              // ── Bottom Navigation ──
              Container(
                padding: const EdgeInsets.fromLTRB(24, 12, 24, 20),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    if (_currentPage > 0)
                      TextButton.icon(
                        onPressed: provider.isLoading ? null : _previousPage,
                        icon: Icon(Icons.arrow_back_ios, size: 16, color: Colors.white.withOpacity(0.8)),
                        label: Text('Back', style: TextStyle(color: Colors.white.withOpacity(0.8))),
                      )
                    else
                      const SizedBox(width: 80),

                    if (_currentPage > 0)
                      AnimatedContainer(
                        duration: const Duration(milliseconds: 300),
                        child: ElevatedButton(
                          onPressed: provider.isLoading ? null : _nextPage,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.white,
                            foregroundColor: gradColors.first,
                            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(16),
                            ),
                            elevation: 0,
                          ),
                          child: provider.isLoading
                              ? SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    color: gradColors.first,
                                    strokeWidth: 2.5,
                                  ),
                                )
                              : Text(
                                  _currentPage == _totalPages - 1
                                      ? 'Confirm & Finish'
                                      : 'Next',
                                  style: const TextStyle(fontWeight: FontWeight.w700),
                                ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
