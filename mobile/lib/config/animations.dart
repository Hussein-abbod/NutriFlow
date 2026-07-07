import 'package:flutter/material.dart';

/// NutriFlow shared animation constants & utilities.
class NutriAnimations {
  NutriAnimations._();

  // ──── Durations ────
  static const Duration fast = Duration(milliseconds: 200);
  static const Duration normal = Duration(milliseconds: 350);
  static const Duration slow = Duration(milliseconds: 600);
  static const Duration entrance = Duration(milliseconds: 800);
  static const Duration pageTransition = Duration(milliseconds: 400);

  // ──── Curves ────
  static const Curve springCurve = Curves.elasticOut;
  static const Curve smoothDecelerate = Curves.easeOutCubic;
  static const Curve subtleBounce = Curves.easeOutBack;
  static const Curve gentleEase = Curves.easeInOutCubic;

  // ──── Page Transitions ────
  static Route<T> fadeThrough<T>(Widget page) {
    return PageRouteBuilder<T>(
      transitionDuration: pageTransition,
      reverseTransitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, secondaryAnimation, child) {
        return FadeTransition(
          opacity: CurvedAnimation(parent: animation, curve: Curves.easeInOut),
          child: SlideTransition(
            position: Tween<Offset>(
              begin: const Offset(0, 0.04),
              end: Offset.zero,
            ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
            child: child,
          ),
        );
      },
    );
  }

  static Route<T> slideUp<T>(Widget page) {
    return PageRouteBuilder<T>(
      transitionDuration: pageTransition,
      reverseTransitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (_, __, ___) => page,
      transitionsBuilder: (_, animation, __, child) {
        return SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0, 0.15),
            end: Offset.zero,
          ).animate(CurvedAnimation(parent: animation, curve: Curves.easeOutCubic)),
          child: FadeTransition(
            opacity: CurvedAnimation(parent: animation, curve: Curves.easeIn),
            child: child,
          ),
        );
      },
    );
  }

  /// Stagger interval for list items.
  /// [index] is the item's position, [total] is the total number of items.
  static Interval stagger(int index, {int total = 6, double overlap = 0.4}) {
    final start = (index / total) * (1.0 - overlap);
    final end = start + overlap;
    return Interval(start.clamp(0.0, 1.0), end.clamp(0.0, 1.0), curve: Curves.easeOutCubic);
  }
}
