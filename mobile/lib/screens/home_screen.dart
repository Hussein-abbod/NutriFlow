import 'package:flutter/material.dart';
import 'tabs/food_log_tab.dart';
import 'tabs/dashboard_tab.dart';
import 'tabs/coach_ai_tab.dart';
import 'tabs/profile_tab.dart';
import '../config/theme.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  static final GlobalKey<HomeScreenState> globalKey = GlobalKey<HomeScreenState>();

  static void switchTab(BuildContext context, int index, {String? coachContext}) {
    context.findAncestorStateOfType<HomeScreenState>()?.switchTab(index, coachContext: coachContext);
  }

  @override
  State<HomeScreen> createState() => HomeScreenState();
}

class HomeScreenState extends State<HomeScreen> {
  int _currentIndex = 0;
  String? _coachContext;

  void switchTab(int index, {String? coachContext}) {
    setState(() {
      _currentIndex = index;
      if (coachContext != null) _coachContext = coachContext;
    });
  }

  static const _navItems = [
    _NavItem(icon: Icons.restaurant_menu_outlined, activeIcon: Icons.restaurant_menu, label: 'Food Log'),
    _NavItem(icon: Icons.dashboard_outlined, activeIcon: Icons.dashboard, label: 'Dashboard'),
    _NavItem(icon: Icons.smart_toy_outlined, activeIcon: Icons.smart_toy, label: 'AI Coach'),
    _NavItem(icon: Icons.person_outline, activeIcon: Icons.person, label: 'Profile'),
  ];

  @override
  Widget build(BuildContext context) {
    final List<Widget> tabs = [
      const FoodLogTab(),
      const DashboardTab(),
      CoachAiTab(initialContext: _coachContext),
      const ProfileTab(),
    ];

    final primaryContainerColor = Theme.of(context).colorScheme.primaryContainer;
    final onPrimaryContainerColor = Theme.of(context).colorScheme.onPrimaryContainer;
    final surfaceColor = NutriFlowTheme.surfaceColor(context);
    final unselectedColor = NutriFlowTheme.secondaryText(context);

    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        switchInCurve: Curves.easeOutCubic,
        switchOutCurve: Curves.easeInCubic,
        child: KeyedSubtree(
          key: ValueKey(_currentIndex),
          child: tabs[_currentIndex],
        ),
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: surfaceColor,
          border: Border(
            top: BorderSide(
              color: NutriFlowTheme.outlineVariant(context),
              width: 1,
            ),
          ),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            child: Row(
              children: List.generate(_navItems.length, (index) {
                final item = _navItems[index];
                final isSelected = _currentIndex == index;

                return Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _currentIndex = index),
                    behavior: HitTestBehavior.opaque,
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 250),
                      curve: Curves.easeOutCubic,
                      padding: const EdgeInsets.symmetric(vertical: 6, horizontal: 8),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? primaryContainerColor
                            : Colors.transparent,
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          AnimatedScale(
                            scale: isSelected ? 1.05 : 1.0,
                            duration: const Duration(milliseconds: 200),
                            curve: Curves.easeOutCubic,
                            child: Icon(
                              isSelected ? item.activeIcon : item.icon,
                              color: isSelected ? onPrimaryContainerColor : unselectedColor,
                              size: 24,
                            ),
                          ),
                          const SizedBox(height: 4),
                          AnimatedDefaultTextStyle(
                            duration: const Duration(milliseconds: 200),
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                              color: isSelected ? onPrimaryContainerColor : unselectedColor,
                            ),
                            child: Text(item.label),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  const _NavItem({required this.icon, required this.activeIcon, required this.label});
}
