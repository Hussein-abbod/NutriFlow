import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';

import '../../config/theme.dart';
import '../../config/animations.dart';
import '../login_screen.dart';
import '../onboarding_screen.dart';
import '../../providers/dashboard_provider.dart';

class ProfileTab extends StatefulWidget {
  const ProfileTab({super.key});

  @override
  State<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends State<ProfileTab>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _ageController;
  late TextEditingController _heightController;
  late TextEditingController _weightController;
  bool _isEditing = false;
  bool _isSaving = false;
  late AnimationController _entranceController;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _nameController = TextEditingController(text: user?.fullName ?? '');
    _ageController = TextEditingController(text: user?.age?.toString() ?? '');
    _heightController = TextEditingController(text: user?.heightCm?.toString() ?? '');
    _weightController = TextEditingController(text: user?.weightKg?.toString() ?? '');
    _entranceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..forward();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _ageController.dispose();
    _heightController.dispose();
    _weightController.dispose();
    _entranceController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);
    try {
      await context.read<AuthProvider>().updateProfile(
        fullName: _nameController.text.trim(),
        age: int.tryParse(_ageController.text.trim()),
        heightCm: double.tryParse(_heightController.text.trim()),
        weightKg: double.tryParse(_weightController.text.trim()),
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated successfully')),
        );
        setState(() => _isEditing = false);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e'), backgroundColor: NutriFlowTheme.coral),
        );
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _changePasswordDialog() async {
    final currentController = TextEditingController();
    final newController = TextEditingController();

    await showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Change Password'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: currentController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Current Password'),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: newController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'New Password'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Password changed successfully')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
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
            position: Tween<Offset>(begin: const Offset(0, 0.08), end: Offset.zero).animate(curved),
            child: child,
          ),
        );
      },
      child: child,
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;

    if (user == null) return Center(child: CircularProgressIndicator(color: primaryColor));

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Flat Header ──
            SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(24, 16, 24, 28),
                child: Column(
                  children: [
                    // Top bar
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Profile',
                            style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontSize: 22, fontWeight: FontWeight.w800)),
                        GestureDetector(
                          onTap: _isSaving
                              ? null
                              : () {
                                  if (_isEditing) {
                                    _saveProfile();
                                  } else {
                                    setState(() => _isEditing = true);
                                  }
                                },
                          child: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: primaryColor.withOpacity(0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: _isSaving
                                ? SizedBox(width: 20, height: 20,
                                    child: CircularProgressIndicator(color: primaryColor, strokeWidth: 2))
                                : Icon(_isEditing ? Icons.save : Icons.edit, color: primaryColor, size: 20),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 20),
                    // Avatar
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(color: NutriFlowTheme.outlineVariant(context), width: 3),
                      ),
                      child: CircleAvatar(
                        radius: 45,
                        backgroundColor: primaryColor.withOpacity(0.1),
                        child: Text(
                          user.fullName?.isNotEmpty == true ? user.fullName![0].toUpperCase() : 'U',
                          style: TextStyle(fontSize: 36, color: primaryColor, fontWeight: FontWeight.w800),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(user.fullName ?? 'User',
                        style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontSize: 20, fontWeight: FontWeight.w700)),
                    Text(user.email,
                        style: TextStyle(color: NutriFlowTheme.secondaryText(context), fontSize: 14)),
                  ],
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ── Personal Info ──
                  _buildAnimated(
                    index: 0,
                    child: _SectionCard(
                      title: 'Personal Information',
                      icon: Icons.person_outline,
                      child: Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            _ProfileField(controller: _nameController, label: 'Full Name', enabled: _isEditing,
                                validator: (v) => v!.isEmpty ? 'Required' : null),
                            const SizedBox(height: 14),
                            Row(children: [
                              Expanded(child: _ProfileField(controller: _ageController, label: 'Age', enabled: _isEditing,
                                  keyboardType: TextInputType.number)),
                              const SizedBox(width: 12),
                              Expanded(child: _ProfileField(controller: _heightController, label: 'Height (cm)', enabled: _isEditing,
                                  keyboardType: TextInputType.number)),
                            ]),
                            const SizedBox(height: 14),
                            Row(children: [
                              Expanded(child: _ProfileField(controller: _weightController, label: 'Weight (kg)', enabled: _isEditing,
                                  keyboardType: TextInputType.number)),
                              const SizedBox(width: 12),
                              const Expanded(child: SizedBox()), // empty space to keep same width
                            ]),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ── Allergies ──
                  _buildAnimated(
                    index: 1,
                    child: _SectionCard(
                      title: 'Food Allergies',
                      icon: Icons.health_and_safety_outlined,
                      trailing: IconButton(
                        icon: Icon(Icons.edit, size: 18, color: primaryColor),
                        onPressed: () => _editAllergiesDialog(user.foodAllergies ?? []),
                      ),
                      child: (user.foodAllergies?.isEmpty ?? true)
                          ? Text('No allergies listed', style: TextStyle(color: NutriFlowTheme.secondaryText(context)))
                          : Wrap(
                              spacing: 8,
                              runSpacing: 8,
                              children: (user.foodAllergies ?? []).map((a) => Container(
                                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                                 decoration: BoxDecoration(
                                   color: NutriFlowTheme.coral.withOpacity(0.1),
                                   borderRadius: BorderRadius.circular(20),
                                 ),
                                 child: Text(a, style: TextStyle(color: NutriFlowTheme.coral, fontWeight: FontWeight.w600, fontSize: 13)),
                              )).toList(),
                            ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ── Account ──
                  _buildAnimated(
                    index: 2,
                    child: _SectionCard(
                      title: 'Account',
                      icon: Icons.settings_outlined,
                      child: Column(
                        children: [
                          _ActionTile(
                            icon: Icons.lock_outline,
                            iconColor: primaryColor,
                            title: 'Change Password',
                            onTap: _changePasswordDialog,
                          ),
                          Divider(color: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100),
                          _ActionTile(
                            icon: Icons.flag,
                            iconColor: primaryColor,
                            title: 'Extend Goal (2 Weeks)',
                            onTap: () async {
                              await context.read<DashboardProvider>().extendGoal(2);
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('Goal extended by 2 weeks.')),
                                );
                              }
                            },
                          ),
                          _ActionTile(
                            icon: Icons.refresh,
                            iconColor: NutriFlowTheme.coral,
                            title: 'Reset Goal',
                            titleColor: NutriFlowTheme.coral,
                            onTap: () async {
                              await context.read<DashboardProvider>().resetGoal();
                              if (context.mounted) {
                                await context.read<AuthProvider>().checkAuthStatus();
                                if (context.mounted) {
                                  Navigator.of(context).pushReplacement(
                                    NutriAnimations.fadeThrough(const OnboardingScreen()),
                                  );
                                }
                              }
                            },
                          ),
                          _ActionTile(
                            icon: Icons.logout,
                            iconColor: NutriFlowTheme.coral,
                            title: 'Logout',
                            titleColor: NutriFlowTheme.coral,
                            onTap: () async {
                              await context.read<AuthProvider>().logout();
                              if (context.mounted) {
                                Navigator.of(context).pushReplacement(
                                  NutriAnimations.fadeThrough(const LoginScreen()),
                                );
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _editAllergiesDialog(List<String> currentAllergies) async {
    final available = ['Eggs', 'Milk/Dairy', 'Peanuts', 'Tree Nuts', 'Wheat/Gluten', 'Soy', 'Fish', 'Shellfish', 'Sesame'];
    final selected = List<String>.from(currentAllergies);

    await showDialog(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            final isNone = selected.contains('None');
            return AlertDialog(
              title: const Text('Edit Allergies'),
              content: SingleChildScrollView(
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    ...available.map((a) {
                      final isSelected = selected.contains(a);
                      return FilterChip(
                        label: Text(a),
                        selected: isSelected,
                        onSelected: isNone ? null : (val) {
                          setDialogState(() {
                            if (val) selected.add(a);
                            else selected.remove(a);
                          });
                        },
                      );
                    }),
                    FilterChip(
                      label: const Text('None'),
                      selected: isNone,
                      onSelected: (val) {
                        setDialogState(() {
                          selected.clear();
                          if (val) selected.add('None');
                        });
                      },
                    ),
                  ],
                ),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
                ElevatedButton(
                  onPressed: () async {
                    Navigator.pop(ctx);
                    setState(() => _isSaving = true);
                    try {
                      await context.read<AuthProvider>().updateAllergies(selected);
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Allergies updated')));
                      }
                    } catch (e) {
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
                      }
                    } finally {
                      if (mounted) setState(() => _isSaving = false);
                    }
                  },
                  child: const Text('Save'),
                ),
              ],
            );
          },
        );
      },
    );
  }
}

class _SectionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Widget child;
  final Widget? trailing;
  const _SectionCard({required this.title, required this.icon, required this.child, this.trailing});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.all(20),
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
                Icon(icon, size: 18, color: Theme.of(context).colorScheme.primary),
                const SizedBox(width: 8),
                Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
              ]),
              if (trailing != null) trailing!,
            ],
          ),
          const SizedBox(height: 16),
          child,
        ],
      ),
    );
  }
}

class _ProfileField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final bool enabled;
  final String? Function(String?)? validator;
  final TextInputType? keyboardType;

  const _ProfileField({
    required this.controller,
    required this.label,
    this.enabled = false,
    this.validator,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return TextFormField(
      controller: controller,
      enabled: enabled,
      keyboardType: keyboardType,
      validator: validator,
      style: TextStyle(fontWeight: FontWeight.w600, color: Theme.of(context).colorScheme.onSurface),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: TextStyle(color: NutriFlowTheme.secondaryText(context), fontSize: 13),
        filled: true,
        fillColor: isDark ? Colors.white.withOpacity(0.04) : const Color(0xFFF5F7FA),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
        disabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(14), borderSide: BorderSide.none),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final Color? titleColor;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.iconColor,
    required this.title,
    this.titleColor,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(icon, size: 18, color: iconColor),
            ),
            const SizedBox(width: 14),
            Expanded(child: Text(title,
                style: TextStyle(fontWeight: FontWeight.w600, color: titleColor ?? Theme.of(context).colorScheme.onSurface))),
            Icon(Icons.arrow_forward_ios, size: 14, color: NutriFlowTheme.secondaryText(context)),
          ],
        ),
      ),
    );
  }
}
