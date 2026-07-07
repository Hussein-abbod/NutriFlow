import 'dart:convert';
import '../services/api_client.dart';
import '../models/coach_message_model.dart';

class CoachService {
  final ApiClient _api = ApiClient();

  Future<List<CoachMessageModel>> getHistory() async {
    final resp = await _api.get('/coach/history?limit=20');
    if (resp.statusCode == 200) {
      final List<dynamic> list = jsonDecode(resp.body);
      return list.map((e) => CoachMessageModel.fromJson(e)).toList();
    }
    throw Exception('Failed to load chat history: ${resp.body}');
  }

  Future<CoachMessageModel> sendMessage(String message, {bool isInitialContext = false, String? adviceContent}) async {
    final resp = await _api.post('/coach/message', body: {
      'message': message,
      'is_initial_context': isInitialContext,
      'advice_content': adviceContent,
    });
    
    if (resp.statusCode == 200) {
      return CoachMessageModel.fromJson(jsonDecode(resp.body));
    }
    throw Exception('Failed to send message: ${resp.body}');
  }

  Future<void> clearHistory() async {
    final resp = await _api.delete('/coach/history');
    if (resp.statusCode != 204) {
      throw Exception('Failed to clear history: ${resp.body}');
    }
  }
}
