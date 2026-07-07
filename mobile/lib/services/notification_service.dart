import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import 'package:flutter/foundation.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> init() async {
    // Only works on mobile platforms, skip on Web
    if (kIsWeb) return;
    if (_initialized) return;

    tz.initializeTimeZones();

    const AndroidInitializationSettings androidSettings = 
        AndroidInitializationSettings('@mipmap/ic_launcher');
    
    // Add iOS settings here if targeting iOS
    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
    );

    await _notifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: (details) {
        // Handle tap if needed
      },
    );
    
    // Request permissions for Android 13+
    await _notifications.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>()?.requestNotificationsPermission();

    _initialized = true;
    
    // Setup recurring notifications
    _scheduleDailyReminders();
  }

  Future<void> _scheduleDailyReminders() async {
    if (!_initialized) return;

    // Daily at 8:00 AM (Breakfast reminder)
    await _scheduleDaily(
      id: 1,
      title: 'Good Morning!',
      body: 'Don\'t forget to log your breakfast today to stay on track!',
      hour: 8,
      minute: 0,
    );

    // Daily at 2:00 PM (Late lunch check-in)
    await _scheduleDaily(
      id: 2,
      title: 'Checking in',
      body: 'Have you logged your meals yet? Keeping track helps you hit your goals.',
      hour: 14,
      minute: 0,
    );
    
    // Daily at 8:00 PM (Dinner / Daily wrap up)
    await _scheduleDaily(
      id: 3,
      title: 'Daily Wrap-up',
      body: 'Time to log your dinner and check your daily progress!',
      hour: 20,
      minute: 0,
    );
  }

  Future<void> _scheduleDaily({
    required int id,
    required String title,
    required String body,
    required int hour,
    required int minute,
  }) async {
    final now = tz.TZDateTime.now(tz.local);
    var scheduledDate = tz.TZDateTime(tz.local, now.year, now.month, now.day, hour, minute);
    
    if (scheduledDate.isBefore(now)) {
      scheduledDate = scheduledDate.add(const Duration(days: 1));
    }

    await _notifications.zonedSchedule(
      id: id,
      title: title,
      body: body,
      scheduledDate: scheduledDate,
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          'daily_reminders',
          'Daily Reminders',
          channelDescription: 'Reminders to log food',
          importance: Importance.defaultImportance,
          priority: Priority.defaultPriority,
        ),
      ),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      matchDateTimeComponents: DateTimeComponents.time,
    );
  }

  Future<void> showTargetReachedNotification() async {
    if (!_initialized) return;

    await _notifications.show(
      id: 100,
      title: 'Target Reached!',
      body: 'Great job! You\'ve reached your daily calorie target.',
      notificationDetails: NotificationDetails(
        android: AndroidNotificationDetails(
          'achievements',
          'Achievements',
          channelDescription: 'Notifications for reaching goals',
          importance: Importance.high,
          priority: Priority.high,
        ),
      ),
    );
  }
}
