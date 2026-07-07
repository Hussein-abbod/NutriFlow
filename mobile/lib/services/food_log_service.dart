import 'dart:convert';
import '../services/api_client.dart';
import '../models/food_item_model.dart';
import '../models/food_log_model.dart';

class FoodLogService {
  final ApiClient _api = ApiClient();

  // ── Barcode lookup ──────────────────────────────────────
  Future<FoodItemModel> lookupBarcode(String barcode) async {
    final resp = await _api.post('/food-log/barcode', body: {'barcode': barcode});
    if (resp.statusCode == 200) {
      return FoodItemModel.fromJson(jsonDecode(resp.body));
    } else if (resp.statusCode == 404) {
      throw Exception('No food found for this barcode.');
    }
    throw Exception('Barcode lookup failed.');
  }

  // ── Image identification ─────────────────────────────────
  Future<List<FoodItemModel>> identifyFromImage(
      String base64Image, String mealType) async {
    final resp = await _api.post('/food-log/image', body: {
      'image_base64': base64Image,
      'meal_type': mealType,
    });
    if (resp.statusCode == 200) {
      final List<dynamic> list = jsonDecode(resp.body);
      return list.map((e) => FoodItemModel.fromJson(e)).toList();
    }
    throw Exception('Image analysis failed: ${resp.body}');
  }

  // ── Text search ──────────────────────────────────────────
  Future<List<FoodItemModel>> searchByText(String query,
      {bool useAiParse = false, String mealType = 'breakfast'}) async {
    final resp = await _api.post('/food-log/text', body: {
      'query': query,
      'meal_type': mealType,
      'use_ai_parse': useAiParse,
    });
    if (resp.statusCode == 200) {
      final List<dynamic> list = jsonDecode(resp.body);
      return list.map((e) => FoodItemModel.fromJson(e)).toList();
    }
    throw Exception('Search failed: ${resp.body}');
  }

  // ── Submit food log ──────────────────────────────────────
  Future<FoodLogModel> submitFoodLog({
    required String mealType,
    required String logMethod,
    required DateTime logDate,
    required List<FoodItemModel> items,
  }) async {
    final resp = await _api.post('/food-log/submit', body: {
      'meal_type': mealType,
      'log_method': logMethod,
      'log_date': "${logDate.year}-${logDate.month.toString().padLeft(2, '0')}-${logDate.day.toString().padLeft(2, '0')}",
      'items': items.map((i) => i.toSubmitJson()).toList(),
    });
    if (resp.statusCode == 200) {
      return FoodLogModel.fromJson(jsonDecode(resp.body));
    }
    throw Exception('Submit failed: ${resp.body}');
  }

  // ── Today's logs ─────────────────────────────────────────
  Future<TodayLogsModel> getTodayLogs() async {
    final resp = await _api.get('/food-log/today');
    if (resp.statusCode == 200) {
      return TodayLogsModel.fromJson(jsonDecode(resp.body));
    }
    throw Exception('Failed to load today\'s logs.');
  }

  // ── History logs ─────────────────────────────────────────
  Future<TodayLogsModel> getHistoryLogs(String date) async {
    final resp = await _api.get('/food-log/history?log_date=$date');
    if (resp.statusCode == 200) {
      return TodayLogsModel.fromJson(jsonDecode(resp.body));
    }
    throw Exception('Failed to load logs for date: $date');
  }

  // ── Delete item ──────────────────────────────────────────
  Future<void> deleteItem(int itemId) async {
    final resp = await _api.delete('/food-log/item/$itemId');
    if (resp.statusCode != 204) {
      throw Exception('Failed to delete item.');
    }
  }
}
