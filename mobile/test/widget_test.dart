// Basic smoke test for NutriFlow app.

import 'package:flutter_test/flutter_test.dart';
import 'package:nutriflow/main.dart';

void main() {
  testWidgets('App renders without crashing', (WidgetTester tester) async {
    await tester.pumpWidget(const NutriFlowApp());
    // Verify splash screen appears
    expect(find.text('NutriFlow'), findsOneWidget);
  });
}
