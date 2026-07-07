import 'package:flutter/material.dart';
import '../models/coach_message_model.dart';
import '../services/coach_service.dart';

class CoachProvider with ChangeNotifier {
  final CoachService _service = CoachService();
  
  List<CoachMessageModel> _messages = [];
  bool _isLoading = false;
  bool _isTyping = false;
  String? _error;

  List<CoachMessageModel> get messages => _messages;
  bool get isLoading => _isLoading;
  bool get isTyping => _isTyping;
  String? get error => _error;

  Future<void> loadHistory() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _messages = await _service.getHistory();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> clearHistory() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await _service.clearHistory();
      _messages.clear();
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> sendMessage(String text, {bool isInitialContext = false, String? adviceContent}) async {
    if (text.isEmpty && !isInitialContext) return;
    
    // Add user message to UI immediately for better UX
    if (!isInitialContext) {
      _messages.add(CoachMessageModel(
        id: DateTime.now().millisecondsSinceEpoch, // temporary ID
        role: 'user',
        content: text,
        createdAt: DateTime.now().toIso8601String(),
      ));
    }
    
    _isTyping = true;
    _error = null;
    notifyListeners();

    try {
      final reply = await _service.sendMessage(
        text, 
        isInitialContext: isInitialContext,
        adviceContent: adviceContent,
      );
      
      // If it was initial context, reload history to get the advice + acknowledgment
      if (isInitialContext) {
        await loadHistory();
      } else {
        _messages.add(reply);
      }
    } catch (e) {
      _error = e.toString().replaceAll('Exception: ', '');
      // Remove the optimistic user message if we failed to send
      if (!isInitialContext && _messages.isNotEmpty && _messages.last.role == 'user') {
        _messages.removeLast();
      }
    } finally {
      _isTyping = false;
      notifyListeners();
    }
  }
}
