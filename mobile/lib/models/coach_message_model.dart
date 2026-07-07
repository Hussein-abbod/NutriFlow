class CoachMessageModel {
  final int id;
  final String role;
  final String content;
  final String createdAt;

  CoachMessageModel({
    required this.id,
    required this.role,
    required this.content,
    required this.createdAt,
  });

  factory CoachMessageModel.fromJson(Map<String, dynamic> json) {
    return CoachMessageModel(
      id: json['id'],
      role: json['role'] ?? 'user',
      content: json['content'] ?? '',
      createdAt: json['created_at'] ?? '',
    );
  }
}
