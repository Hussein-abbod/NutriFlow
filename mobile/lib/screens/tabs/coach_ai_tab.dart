import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/coach_provider.dart';
import '../../models/coach_message_model.dart';
import '../../config/theme.dart';

class CoachAiTab extends StatefulWidget {
  final String? initialContext;
  const CoachAiTab({super.key, this.initialContext});

  @override
  State<CoachAiTab> createState() => _CoachAiTabState();
}

class _CoachAiTabState extends State<CoachAiTab> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _initialized = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initCoach());
  }

  @override
  void didUpdateWidget(CoachAiTab oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialContext != null && widget.initialContext != oldWidget.initialContext) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _sendInitialContext(widget.initialContext!);
      });
    }
  }

  Future<void> _initCoach() async {
    final provider = context.read<CoachProvider>();
    await provider.loadHistory();
    if (widget.initialContext != null && !_initialized) {
      _sendInitialContext(widget.initialContext!);
      _initialized = true;
    }
    _scrollToBottom();
  }

  void _sendInitialContext(String advice) {
    final msg = "The user wants to discuss this meal advice: $advice. Wait for the user's question or feedback.";
    context.read<CoachProvider>().clearHistory();
    context.read<CoachProvider>().sendMessage(
      msg, isInitialContext: true, adviceContent: advice,
    ).then((_) => _scrollToBottom());
  }

  void _sendMessage() {
    final text = _textController.text.trim();
    if (text.isEmpty) return;
    _textController.clear();
    context.read<CoachProvider>().sendMessage(text).then((_) => _scrollToBottom());
    _scrollToBottom();
  }

  void _scrollToBottom() {
    if (_scrollController.hasClients) {
      Future.delayed(const Duration(milliseconds: 100), () {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // ── Header (flat, consistent) ──
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 16, 24, 12),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Icon(Icons.smart_toy, color: primaryColor, size: 24),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Coach AI',
                            style: TextStyle(color: Theme.of(context).colorScheme.onSurface, fontSize: 22, fontWeight: FontWeight.w800)),
                        Text('Your personal nutrition advisor',
                            style: TextStyle(color: NutriFlowTheme.secondaryText(context), fontSize: 12)),
                      ],
                    ),
                  ),
                  GestureDetector(
                    onTap: () {
                      context.read<CoachProvider>().clearHistory();
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                      decoration: BoxDecoration(
                        color: primaryColor.withOpacity(0.08),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.refresh, color: primaryColor, size: 14),
                          const SizedBox(width: 4),
                          Text('New Chat', style: TextStyle(color: primaryColor, fontSize: 11, fontWeight: FontWeight.w600)),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // ── Quick Suggestions ──
            Consumer<CoachProvider>(
              builder: (context, provider, _) {
                if (provider.messages.isNotEmpty) return const SizedBox.shrink();
                return Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _QuickChip(icon: Icons.lightbulb_outline, label: 'Meal ideas', onTap: () { _textController.text = 'Give me healthy meal ideas for today'; _sendMessage(); }),
                      _QuickChip(icon: Icons.analytics_outlined, label: 'Analyze my diet', onTap: () { _textController.text = 'Analyze my diet from this week'; _sendMessage(); }),
                      _QuickChip(icon: Icons.eco_outlined, label: 'Low calorie snacks', onTap: () { _textController.text = 'Suggest some low calorie snacks'; _sendMessage(); }),
                    ],
                  ),
                );
              },
            ),

            // ── Chat Messages ──
            Expanded(
              child: Consumer<CoachProvider>(
                builder: (context, provider, child) {
                  if (provider.isLoading && provider.messages.isEmpty) {
                    return Center(child: CircularProgressIndicator(color: primaryColor));
                  }

                  if (provider.messages.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: primaryColor.withOpacity(0.08),
                              shape: BoxShape.circle,
                            ),
                            child: Icon(Icons.chat_bubble_outline, size: 40, color: primaryColor.withOpacity(0.4)),
                          ),
                          const SizedBox(height: 16),
                          Text('Say hi to your Coach AI!',
                              style: TextStyle(color: NutriFlowTheme.secondaryText(context), fontWeight: FontWeight.w500)),
                          const SizedBox(height: 4),
                          Text('Ask anything about nutrition',
                              style: TextStyle(color: NutriFlowTheme.secondaryText(context).withOpacity(0.6), fontSize: 13)),
                        ],
                      ),
                    );
                  }

                  return ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.all(16),
                    itemCount: provider.messages.length + (provider.isTyping ? 1 : 0),
                    itemBuilder: (context, index) {
                      if (index == provider.messages.length) return const _TypingIndicator();
                      return _ChatBubble(message: provider.messages[index], index: index);
                    },
                  );
                },
              ),
            ),

            // ── Input Area ──
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: NutriFlowTheme.surfaceColor(context),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(isDark ? 0.2 : 0.04), offset: const Offset(0, -4), blurRadius: 16),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF5F7FA),
                        borderRadius: BorderRadius.circular(24),
                      ),
                      child: TextField(
                        controller: _textController,
                        textCapitalization: TextCapitalization.sentences,
                        decoration: InputDecoration(
                          hintText: 'Ask about nutrition, meals, goals...',
                          hintStyle: TextStyle(color: NutriFlowTheme.secondaryText(context), fontSize: 14),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                        ),
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Consumer<CoachProvider>(
                    builder: (context, provider, child) {
                      return GestureDetector(
                        onTap: provider.isTyping ? null : _sendMessage,
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 250),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: provider.isTyping ? NutriFlowTheme.secondaryText(context).withOpacity(0.3) : primaryColor,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _QuickChip({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withOpacity(0.06) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: NutriFlowTheme.outlineVariant(context)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: primaryColor),
            const SizedBox(width: 6),
            Text(label, style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500, color: Theme.of(context).colorScheme.onSurface)),
          ],
        ),
      ),
    );
  }
}

class _ChatBubble extends StatelessWidget {
  final CoachMessageModel message;
  final int index;
  const _ChatBubble({required this.message, required this.index});

  @override
  Widget build(BuildContext context) {
    final isUser = message.role == 'user';
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final primaryColor = Theme.of(context).colorScheme.primary;

    return TweenAnimationBuilder<double>(
      tween: Tween(begin: 0.0, end: 1.0),
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeOutCubic,
      builder: (context, value, child) {
        return Transform.translate(
          offset: Offset(isUser ? 20 * (1 - value) : -20 * (1 - value), 0),
          child: Opacity(opacity: value, child: child),
        );
      },
      child: Padding(
        padding: const EdgeInsets.only(bottom: 12),
        child: Row(
          mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            if (!isUser) ...[
              Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.smart_toy, color: primaryColor, size: 14),
              ),
            ],
            Flexible(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  gradient: isUser ? NutriFlowTheme.primaryGradient : null,
                  color: isUser ? null : (isDark ? Colors.white.withOpacity(0.06) : const Color(0xFFF0F2F5)),
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(18),
                    topRight: const Radius.circular(18),
                    bottomLeft: Radius.circular(isUser ? 18 : 4),
                    bottomRight: Radius.circular(isUser ? 4 : 18),
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(isDark ? 0.15 : 0.04),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Text(
                  message.content,
                  style: TextStyle(
                    color: isUser ? Colors.white : Theme.of(context).colorScheme.onSurface,
                    fontSize: 14,
                    height: 1.5,
                  ),
                ),
              ),
            ),
            if (isUser) ...[
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.all(7),
                decoration: BoxDecoration(
                  color: primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(Icons.person, size: 14, color: primaryColor),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  const _TypingIndicator();

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            margin: const EdgeInsets.only(right: 8),
            padding: const EdgeInsets.all(7),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(Icons.smart_toy, color: Theme.of(context).colorScheme.primary, size: 14),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: Theme.of(context).brightness == Brightness.dark
                  ? Colors.white.withOpacity(0.06)
                  : const Color(0xFFF0F2F5),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(18),
                topRight: Radius.circular(18),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(18),
              ),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                _Dot(delay: 0),
                const SizedBox(width: 5),
                _Dot(delay: 200),
                const SizedBox(width: 5),
                _Dot(delay: 400),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Dot extends StatefulWidget {
  final int delay;
  const _Dot({required this.delay});

  @override
  State<_Dot> createState() => _DotState();
}

class _DotState extends State<_Dot> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 600));
    Future.delayed(Duration(milliseconds: widget.delay), () {
      if (mounted) _controller.repeat(reverse: true);
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: _controller,
      child: Container(
        width: 7,
        height: 7,
        decoration: BoxDecoration(
          color: NutriFlowTheme.purple.withOpacity(0.5),
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}
