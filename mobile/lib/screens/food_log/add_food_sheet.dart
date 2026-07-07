import 'dart:convert';
import 'dart:async';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';
import '../../providers/food_log_provider.dart';
import '../../models/food_item_model.dart';
import '../../services/food_log_service.dart';
import '../../config/theme.dart';
import 'food_confirm_screen.dart';

// ═══════════════════════════════════════════════════
// Add Food Bottom Sheet — Choose input method
// ═══════════════════════════════════════════════════

class AddFoodSheet extends StatelessWidget {
  final String mealType;

  const AddFoodSheet({super.key, required this.mealType});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: NutriFlowTheme.surfaceColor(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40, height: 4,
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.15) : Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 20),
          Text('Add Food to ${_capitalize(mealType)}',
              style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800)),
          const SizedBox(height: 6),
          Text('Choose how you want to log food',
              style: TextStyle(color: NutriFlowTheme.secondaryText(context))),
          const SizedBox(height: 24),

          _OptionTile(
            icon: Icons.qr_code_scanner,
            title: 'Barcode Scanner',
            subtitle: 'Scan a product barcode for instant nutrition info',
            gradient: NutriFlowTheme.primaryGradient,
            onTap: () => Navigator.pop(context, 'barcode'),
            delay: 0,
          ),
          const SizedBox(height: 12),

          _OptionTile(
            icon: Icons.camera_alt_rounded,
            title: 'Log by Photo',
            subtitle: 'Take a photo or upload from gallery',
            gradient: const LinearGradient(colors: [Color(0xFF448AFF), Color(0xFF7C4DFF)]),
            onTap: () {
              showDialog(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('Select Image Source'),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  content: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      ListTile(
                        leading: const Icon(Icons.camera_alt, color: Color(0xFF448AFF)),
                        title: const Text('Take Photo'),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        onTap: () {
                          Navigator.pop(ctx);
                          Navigator.pop(context, 'image_camera');
                        },
                      ),
                      ListTile(
                        leading: const Icon(Icons.photo_library, color: Color(0xFF00B4DB)),
                        title: const Text('Upload Image'),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        onTap: () {
                          Navigator.pop(ctx);
                          Navigator.pop(context, 'image_gallery');
                        },
                      ),
                    ],
                  ),
                ),
              );
            },
            delay: 100,
          ),
          const SizedBox(height: 12),

          _OptionTile(
            icon: Icons.search_rounded,
            title: 'Search by Name',
            subtitle: 'Type what you ate and search the USDA database',
            gradient: NutriFlowTheme.coralGradient,
            onTap: () => Navigator.pop(context, 'text'),
            delay: 200,
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  String _capitalize(String s) => s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);
}

class _OptionTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final LinearGradient gradient;
  final VoidCallback onTap;
  final int delay;

  const _OptionTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.gradient,
    required this.onTap,
    this.delay = 0,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: Duration(milliseconds: 400 + delay),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(0, 20 * (1 - value)),
          child: Opacity(opacity: value, child: child),
        );
      },
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(18),
          child: Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.04) : Colors.white,
              border: Border.all(color: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100),
              borderRadius: BorderRadius.circular(18),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.15 : 0.04),
                  blurRadius: 12,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    gradient: gradient,
                    borderRadius: BorderRadius.circular(14),
                    boxShadow: [
                      BoxShadow(color: gradient.colors.first.withOpacity(0.15), blurRadius: 4, offset: const Offset(0, 2)),
                    ],
                  ),
                  child: Icon(icon, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(title, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                      const SizedBox(height: 3),
                      Text(subtitle, style: TextStyle(color: NutriFlowTheme.secondaryText(context), fontSize: 12)),
                    ],
                  ),
                ),
                Icon(Icons.arrow_forward_ios, size: 14, color: NutriFlowTheme.secondaryText(context)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}


// ═══════════════════════════════════════════════════
// Barcode Scanner Screen
// ═══════════════════════════════════════════════════

class BarcodeScannerScreen extends StatefulWidget {
  final String mealType;
  const BarcodeScannerScreen({super.key, required this.mealType});

  @override
  State<BarcodeScannerScreen> createState() => _BarcodeScannerScreenState();
}

class _BarcodeScannerScreenState extends State<BarcodeScannerScreen> {
  final _service = FoodLogService();
  bool _scanned = false;
  bool _loading = false;
  FoodItemModel? _found;
  String? _error;

  Future<void> _onDetect(BarcodeCapture capture) async {
    if (_scanned) return;
    final barcode = capture.barcodes.firstOrNull?.rawValue;
    if (barcode == null) return;

    setState(() { _scanned = true; _loading = true; _error = null; });
    try {
      final item = await _service.lookupBarcode(barcode);
      setState(() { _found = item; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceAll('Exception: ', ''); _loading = false; _scanned = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        title: const Text('Scan Barcode'),
      ),
      body: Stack(
        children: [
          if (_found == null) MobileScanner(onDetect: _onDetect),
          if (_loading) const Center(child: CircularProgressIndicator(color: Colors.white)),
          if (_error != null)
            Positioned(bottom: 32, left: 24, right: 24,
                child: _ErrorBanner(message: _error!, onRetry: () => setState(() { _scanned = false; _error = null; }))),
          if (_found != null)
            Positioned(bottom: 0, left: 0, right: 0,
                child: _FoundFoodCard(
                  item: _found!, mealType: widget.mealType, logMethod: 'barcode',
                  onQuantityChanged: (q) => setState(() => _found = _found!.copyWith(quantity: q)),
                  onRescan: () => setState(() { _found = null; _scanned = false; }),
                )),
        ],
      ),
    );
  }
}


// ═══════════════════════════════════════════════════
// Camera Food Screen
// ═══════════════════════════════════════════════════

class CameraFoodScreen extends StatefulWidget {
  final String mealType;
  final ImageSource source;
  const CameraFoodScreen({super.key, required this.mealType, required this.source});

  @override
  State<CameraFoodScreen> createState() => _CameraFoodScreenState();
}

class _CameraFoodScreenState extends State<CameraFoodScreen> {
  final _service = FoodLogService();
  bool _loading = false;
  String? _error;
  List<FoodItemModel> _items = [];
  XFile? _selectedImage;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _pickImage(widget.source);
    });
  }

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final xfile = await picker.pickImage(source: source, imageQuality: 80, maxWidth: 1024);
    if (xfile == null) {
      if (_selectedImage == null) Navigator.pop(context);
      return;
    }
    setState(() {
      _selectedImage = xfile;
      _items = [];
      _error = null;
    });
  }

  Future<void> _analyzeImage() async {
    if (_selectedImage == null) return;
    
    final bytes = await _selectedImage!.readAsBytes();
    if (bytes.length > 5 * 1024 * 1024) {
      setState(() => _error = 'Image is too large (max 5 MB).');
      return;
    }
    final base64Image = base64Encode(bytes);

    setState(() { _loading = true; _error = null; _items = []; });
    try {
      final found = await _service.identifyFromImage(base64Image, widget.mealType);
      setState(() { _items = found; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceAll('Exception: ', ''); _loading = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Scaffold(
      appBar: AppBar(title: const Text('Camera Food Scan')),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            children: [
              if (_selectedImage == null && !_loading)
                 Expanded(child: Center(child: CircularProgressIndicator(color: primaryColor))),

              if (_selectedImage != null && _items.isEmpty) ...[
                Expanded(
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        kIsWeb
                            ? Image.network(
                                _selectedImage!.path,
                                fit: BoxFit.contain,
                              )
                            : Image.file(
                                File(_selectedImage!.path),
                                fit: BoxFit.contain,
                              ),
                        if (_loading) const _ScannerOverlay(),
                        if (_loading)
                          Container(
                            color: Colors.black.withOpacity(0.4),
                            child: const Center(
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  CircularProgressIndicator(color: Colors.white),
                                  SizedBox(height: 16),
                                  Text(
                                    'Analyzing with AI...',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      shadows: [Shadow(color: Colors.black54, blurRadius: 4, offset: Offset(0, 2))],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                if (_error != null && !_loading) 
                  _ErrorBanner(message: _error!, onRetry: () => setState(() => _error = null)),
                if (!_loading)
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: () => _pickImage(widget.source),
                          icon: const Icon(Icons.refresh),
                          label: const Text('Retake'),
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _analyzeImage,
                          icon: const Icon(Icons.auto_awesome),
                          label: const Text('Analyze'),
                          style: ElevatedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                          ),
                        ),
                      ),
                    ],
                  ),
              ],

              if (_items.isNotEmpty) ...[
                if (_error != null)
                  _ErrorBanner(message: _error!, onRetry: () => setState(() => _error = null)),
                const Text('Identified Foods', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Expanded(child: _FoodItemsList(
                  items: _items, mealType: widget.mealType, logMethod: 'image',
                  onItemsChanged: (updated) => setState(() => _items = updated),
                )),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _SourceButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final LinearGradient gradient;
  final VoidCallback onTap;

  const _SourceButton({required this.icon, required this.label, required this.gradient, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: gradient,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(color: gradient.colors.first.withOpacity(0.15), blurRadius: 4, offset: const Offset(0, 2)),
        ],
      ),
      child: ElevatedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, color: Colors.white),
        label: Text(label, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          padding: const EdgeInsets.symmetric(vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        ),
      ),
    );
  }
}


// ═══════════════════════════════════════════════════
// Text Food Screen
// ═══════════════════════════════════════════════════

class TextFoodScreen extends StatefulWidget {
  final String mealType;
  const TextFoodScreen({super.key, required this.mealType});

  @override
  State<TextFoodScreen> createState() => _TextFoodScreenState();
}

class _TextFoodScreenState extends State<TextFoodScreen> {
  final _service = FoodLogService();
  final _controller = TextEditingController();
  bool _loading = false;
  String? _error;
  List<FoodItemModel> _results = [];
  List<FoodItemModel> _selected = [];

  Future<void> _search({bool useAi = false}) async {
    final query = _controller.text.trim();
    if (query.isEmpty) return;

    FocusScope.of(context).unfocus();
    if (_loading) return;

    setState(() { _loading = true; _error = null; _results = []; });
    try {
      final found = await _service.searchByText(query, useAiParse: useAi, mealType: widget.mealType);
      setState(() { _results = found; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString().replaceAll('Exception: ', ''); _loading = false; });
    }
  }

  void _addItem(FoodItemModel item) {
    setState(() => _selected.add(item));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${item.foodName} added'), duration: const Duration(seconds: 1)),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).colorScheme.primary;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(title: const Text('Search Food')),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    decoration: InputDecoration(
                      hintText: 'e.g. "rice" or "chicken breast"',
                      prefixIcon: const Icon(Icons.search),
                      suffixIcon: _controller.text.isNotEmpty
                          ? IconButton(icon: const Icon(Icons.clear), onPressed: () {
                              _controller.clear();
                              setState(() { _results = []; });
                            })
                          : null,
                    ),
                    onSubmitted: (_) => _loading ? null : _search(),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  decoration: BoxDecoration(
                    gradient: NutriFlowTheme.primaryGradient,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(color: primaryColor.withOpacity(0.15), blurRadius: 4, offset: const Offset(0, 2)),
                    ],
                  ),
                  child: IconButton(
                    onPressed: _loading ? null : _search,
                    icon: const Icon(Icons.search, color: Colors.white),
                    tooltip: 'Search',
                  ),
                ),
                const SizedBox(width: 6),
                Container(
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF448AFF), Color(0xFF7C4DFF)]),
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(color: const Color(0xFF448AFF).withOpacity(0.15), blurRadius: 4, offset: const Offset(0, 2)),
                    ],
                  ),
                  child: IconButton(
                    onPressed: _loading ? null : () => _search(useAi: true),
                    icon: const Icon(Icons.auto_awesome, color: Colors.white),
                    tooltip: 'AI Parse',
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),

          if (_loading) Padding(
            padding: const EdgeInsets.all(32),
            child: CircularProgressIndicator(color: primaryColor),
          ),
          if (_error != null) Padding(
            padding: const EdgeInsets.all(16),
            child: _ErrorBanner(message: _error!, onRetry: () => setState(() { _error = null; })),
          ),

          Expanded(
            child: _results.isEmpty && !_loading
                ? Center(child: Text('Search for food above',
                    style: TextStyle(color: NutriFlowTheme.secondaryText(context))))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _results.length,
                    itemBuilder: (ctx, i) {
                      final item = _results[i];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 10),
                        decoration: BoxDecoration(
                          color: NutriFlowTheme.cardBackground(context),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: isDark ? Colors.white.withOpacity(0.06) : Colors.grey.shade100),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          leading: Container(
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: primaryColor.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(Icons.restaurant, color: primaryColor),
                          ),
                          title: Text(item.foodName, style: const TextStyle(fontWeight: FontWeight.w700)),
                          subtitle: Text(item.brandName != null
                              ? '${item.brandName} · ${item.calories.round()} kcal / ${item.quantity == item.quantity.truncateToDouble() ? item.quantity.toInt() : item.quantity} ${item.unit}'
                              : '${item.calories.round()} kcal / ${item.quantity == item.quantity.truncateToDouble() ? item.quantity.toInt() : item.quantity} ${item.unit}',
                              style: TextStyle(fontSize: 12, color: NutriFlowTheme.secondaryText(context))),
                          trailing: GestureDetector(
                            onTap: () => _addItem(item),
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                gradient: NutriFlowTheme.primaryGradient,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: const Icon(Icons.add, color: Colors.white, size: 20),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
          ),

          if (_selected.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: NutriFlowTheme.surfaceColor(context),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(isDark ? 0.2 : 0.06), blurRadius: 12)],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('${_selected.length} item(s) selected',
                      style: const TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Container(
                    decoration: BoxDecoration(
                      gradient: NutriFlowTheme.primaryGradient,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: ElevatedButton(
                      onPressed: () => Navigator.push(context, MaterialPageRoute(
                        builder: (_) => FoodConfirmScreen(items: _selected, mealType: widget.mealType, logMethod: 'text'),
                      )),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.transparent,
                        shadowColor: Colors.transparent,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      child: const Text('Review & Confirm', style: TextStyle(color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}


// ═══════════════════════════════════════════════════
// Shared — Food Items List with steppers
// ═══════════════════════════════════════════════════

class _FoodItemsList extends StatefulWidget {
  final List<FoodItemModel> items;
  final String mealType;
  final String logMethod;
  final ValueChanged<List<FoodItemModel>> onItemsChanged;

  const _FoodItemsList({required this.items, required this.mealType, required this.logMethod, required this.onItemsChanged});

  @override
  State<_FoodItemsList> createState() => _FoodItemsListState();
}

class _FoodItemsListState extends State<_FoodItemsList> {
  late List<FoodItemModel> _items;

  @override
  void initState() {
    super.initState();
    _items = List.from(widget.items);
  }

  void _updateQty(int index, double qty) {
    setState(() => _items[index] = _items[index].copyWith(quantity: qty));
    widget.onItemsChanged(_items);
  }

  void _remove(int index) {
    setState(() => _items.removeAt(index));
    widget.onItemsChanged(_items);
  }

  @override
  Widget build(BuildContext context) {
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Column(
      children: [
        Expanded(
          child: ListView.builder(
            itemCount: _items.length,
            itemBuilder: (ctx, i) {
              final item = _items[i];
              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(children: [
                        Expanded(child: Text(item.foodName, style: const TextStyle(fontWeight: FontWeight.w700))),
                        IconButton(icon: Icon(Icons.delete_outline, color: NutriFlowTheme.coral, size: 20),
                            onPressed: () => _remove(i)),
                      ]),
                      if (item.brandName != null)
                        Text(item.brandName!, style: TextStyle(color: NutriFlowTheme.secondaryText(context), fontSize: 12)),
                      const SizedBox(height: 8),
                      Builder(
                        builder: (context) {
                          final step = (item.unit.toLowerCase() == 'g' || item.unit.toLowerCase() == 'ml') ? 10.0 : 1.0;
                          return Row(children: [
                            IconButton(
                              icon: const Icon(Icons.remove_circle_outline),
                              onPressed: item.quantity > step ? () => _updateQty(i, item.quantity - step) : null,
                            ),
                            Text('${item.quantity == item.quantity.truncateToDouble() ? item.quantity.toInt() : item.quantity} ${item.unit}', style: const TextStyle(fontWeight: FontWeight.w700)),
                            IconButton(
                              icon: const Icon(Icons.add_circle_outline),
                              onPressed: () => _updateQty(i, item.quantity + step),
                            ),
                            const Spacer(),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: primaryColor.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text('${item.calories.round()} kcal',
                                  style: TextStyle(color: primaryColor, fontWeight: FontWeight.w700)),
                            ),
                          ]);
                        }
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Container(
          width: double.infinity,
          decoration: BoxDecoration(
            gradient: NutriFlowTheme.primaryGradient,
            borderRadius: BorderRadius.circular(16),
          ),
          child: ElevatedButton(
            onPressed: _items.isEmpty ? null : () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => FoodConfirmScreen(
                items: _items, mealType: widget.mealType, logMethod: widget.logMethod,
              )),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.transparent,
              shadowColor: Colors.transparent,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            ),
            child: const Text('Review & Confirm', style: TextStyle(color: Colors.white)),
          ),
        ),
      ],
    );
  }
}


// ═══════════════════════════════════════════════════
// Shared — Found food card for barcode result
// ═══════════════════════════════════════════════════

class _FoundFoodCard extends StatefulWidget {
  final FoodItemModel item;
  final String mealType;
  final String logMethod;
  final ValueChanged<double> onQuantityChanged;
  final VoidCallback onRescan;

  const _FoundFoodCard({
    required this.item, required this.mealType, required this.logMethod,
    required this.onQuantityChanged, required this.onRescan,
  });

  @override
  State<_FoundFoodCard> createState() => _FoundFoodCardState();
}

class _FoundFoodCardState extends State<_FoundFoodCard> {
  late double _qty;

  @override
  void initState() {
    super.initState();
    _qty = widget.item.quantity;
  }

  @override
  Widget build(BuildContext context) {
    final cal = widget.item.copyWith(quantity: _qty).calories.round();
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Container(
      decoration: BoxDecoration(
        color: NutriFlowTheme.surfaceColor(context),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(widget.item.foodName,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800), textAlign: TextAlign.center),
          if (widget.item.brandName != null)
            Text(widget.item.brandName!, style: TextStyle(color: NutriFlowTheme.secondaryText(context))),
          const SizedBox(height: 20),
          Builder(
            builder: (context) {
              final step = (widget.item.unit.toLowerCase() == 'g' || widget.item.unit.toLowerCase() == 'ml') ? 10.0 : 1.0;
              return Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  IconButton(
                    onPressed: _qty > step ? () { setState(() => _qty -= step); widget.onQuantityChanged(_qty); } : null,
                    icon: Icon(Icons.remove_circle, size: 32, color: primaryColor),
                  ),
                  const SizedBox(width: 8),
                  Text('${_qty == _qty.truncateToDouble() ? _qty.toInt() : _qty} ${widget.item.unit}', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800)),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: () { setState(() => _qty += step); widget.onQuantityChanged(_qty); },
                    icon: Icon(Icons.add_circle, size: 32, color: primaryColor),
                  ),
                ],
              );
            }
          ),
          Text('$cal kcal', style: TextStyle(color: primaryColor, fontSize: 24, fontWeight: FontWeight.w800)),
          const SizedBox(height: 20),
          Row(children: [
            Expanded(child: OutlinedButton(onPressed: widget.onRescan, child: const Text('Rescan'))),
            const SizedBox(width: 12),
            Expanded(child: Container(
              decoration: BoxDecoration(
                gradient: NutriFlowTheme.primaryGradient,
                borderRadius: BorderRadius.circular(16),
              ),
              child: ElevatedButton(
                onPressed: () => Navigator.push(context, MaterialPageRoute(
                  builder: (_) => FoodConfirmScreen(
                    items: [widget.item.copyWith(quantity: _qty)],
                    mealType: widget.mealType, logMethod: widget.logMethod,
                  ),
                )),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.transparent, shadowColor: Colors.transparent,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                child: const Text('Confirm', style: TextStyle(color: Colors.white)),
              ),
            )),
          ]),
        ],
      ),
    );
  }
}


// ═══════════════════════════════════════════════════
// Shared — Error banner
// ═══════════════════════════════════════════════════

class _ErrorBanner extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  const _ErrorBanner({required this.message, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: NutriFlowTheme.coral.withOpacity(0.08),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: NutriFlowTheme.coral.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          const Icon(Icons.error_outline, color: NutriFlowTheme.coral),
          const SizedBox(width: 8),
          Expanded(child: Text(message, style: const TextStyle(color: NutriFlowTheme.coral))),
          TextButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════
// Scanner Overlay Animation
// ═══════════════════════════════════════════════════

class _ScannerOverlay extends StatefulWidget {
  const _ScannerOverlay();

  @override
  State<_ScannerOverlay> createState() => _ScannerOverlayState();
}

class _ScannerOverlayState extends State<_ScannerOverlay> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(seconds: 2))
      ..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          painter: _ScannerPainter(_controller.value, Theme.of(context).colorScheme.primary),
        );
      },
    );
  }
}

class _ScannerPainter extends CustomPainter {
  final double progress;
  final Color color;

  _ScannerPainter(this.progress, this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final y = size.height * progress;
    final rect = Rect.fromLTWH(0, 0, size.width, y);
    final paint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [color.withOpacity(0.0), color.withOpacity(0.5)],
      ).createShader(rect);

    canvas.drawRect(rect, paint);
    
    final linePaint = Paint()
      ..color = color
      ..strokeWidth = 3.0
      ..style = PaintingStyle.stroke
      ..maskFilter = const MaskFilter.blur(BlurStyle.solid, 4);

    canvas.drawLine(Offset(0, y), Offset(size.width, y), linePaint);
  }

  @override
  bool shouldRepaint(covariant _ScannerPainter oldDelegate) => oldDelegate.progress != progress;
}
