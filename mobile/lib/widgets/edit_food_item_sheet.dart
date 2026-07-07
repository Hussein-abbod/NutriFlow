import 'package:flutter/material.dart';
import '../models/food_item_model.dart';
import '../config/theme.dart';

class EditFoodItemSheet extends StatefulWidget {
  final FoodItemModel initialItem;

  const EditFoodItemSheet({super.key, required this.initialItem});

  @override
  State<EditFoodItemSheet> createState() => _EditFoodItemSheetState();
}

class _EditFoodItemSheetState extends State<EditFoodItemSheet> {
  late TextEditingController _quantityController;
  late String _selectedUnit;
  late FoodItemModel _previewItem;
  late List<String> _availableUnits;

  @override
  void initState() {
    super.initState();
    _previewItem = widget.initialItem.copyWith();
    _quantityController = TextEditingController(text: _previewItem.quantity.toString());
    _selectedUnit = _previewItem.unit;
    _availableUnits = _previewItem.availableUnits.toList();
    if (!_availableUnits.contains(_selectedUnit)) {
      _availableUnits.add(_selectedUnit);
    }
  }

  @override
  void dispose() {
    _quantityController.dispose();
    super.dispose();
  }

  void _updatePreview() {
    final qty = double.tryParse(_quantityController.text) ?? 1.0;
    setState(() {
      _previewItem = _previewItem.copyWith(quantity: qty, unit: _selectedUnit);
    });
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Container(
      padding: EdgeInsets.only(
        top: 24,
        left: 20,
        right: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      decoration: BoxDecoration(
        color: NutriFlowTheme.surfaceColor(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Handle
          Center(
            child: Container(
              width: 40, height: 4,
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withOpacity(0.15) : Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  widget.initialItem.foodName,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              IconButton(
                icon: Icon(Icons.close, color: NutriFlowTheme.secondaryText(context)),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const SizedBox(height: 4),

          // Calorie preview
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: primaryColor.withOpacity(0.08),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '${_previewItem.calories.round()} kcal · ${_previewItem.quantity} ${_previewItem.unit}',
              style: TextStyle(color: primaryColor, fontWeight: FontWeight.w700, fontSize: 14),
            ),
          ),
          const SizedBox(height: 24),

          Row(
            children: [
              Expanded(
                flex: 2,
                child: Container(
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF5F7FA),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: TextField(
                    controller: _quantityController,
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800),
                    decoration: const InputDecoration(
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(vertical: 16),
                    ),
                    onChanged: (_) => _updatePreview(),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                flex: 3,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF5F7FA),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      value: _selectedUnit,
                      isExpanded: true,
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700,
                          color: Theme.of(context).colorScheme.onSurface),
                      dropdownColor: NutriFlowTheme.surfaceColor(context),
                      items: _availableUnits.map((u) {
                        return DropdownMenuItem(value: u, child: Text(u));
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setState(() {
                            _selectedUnit = val;
                            _updatePreview();
                          });
                        }
                      },
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 28),

          Container(
            width: double.infinity,
            decoration: BoxDecoration(
              gradient: NutriFlowTheme.gradient(context),
              borderRadius: BorderRadius.circular(16),
            ),
            child: ElevatedButton(
              onPressed: () => Navigator.pop(context, _previewItem),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.transparent,
                shadowColor: Colors.transparent,
                minimumSize: const Size(double.infinity, 54),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              ),
              child: const Text('Update', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: Colors.white)),
            ),
          ),
        ],
      ),
    );
  }
}
