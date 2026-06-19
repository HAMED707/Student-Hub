import 'package:flutter/material.dart';
import 'package:student_hub/community/community_screen.dart';
import 'package:student_hub/findroom/findroom.dart';
import 'package:student_hub/homepage/home.dart';
import 'package:student_hub/roommate/room_mate_matching.dart';
import 'package:student_hub/service/service.dart';
import 'package:student_hub/service/service.dart';

void main() {
  runApp(const StudentHubApp());
}

class StudentHubApp extends StatefulWidget {
  const StudentHubApp({super.key});

  @override
  State<StudentHubApp> createState() => _StudentHubAppState();
}

class _StudentHubAppState extends State<StudentHubApp> {
  int _currentIndex = 0;

  // امسح تعريف _pages من هنا (بره الـ build)

  @override
  Widget build(BuildContext context) {
    // 1. انقل التعريف هنا جوه الـ build
    final List<Widget> _pages = [
      StudentHubHome(
        onRedirect: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
      ),
      const FindRoomScreen(),
      const NearbyPlacesScreen(),
      const RoommateMatchingScreen(),
      const CommunityScreen(),
    ];

    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        // 2. استخدم القائمة اللي عرفناها فوق
        body: _pages[_currentIndex],
        bottomNavigationBar: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            setState(() {
              _currentIndex = index;
            });
          },
          type: BottomNavigationBarType.fixed,
          selectedItemColor: const Color(0xFF0D47A1),
          unselectedItemColor: Colors.grey,
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.bed), label: 'Find Room'),

            BottomNavigationBarItem(
              icon: Icon(Icons.category),
              label: 'Services',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.person_search),
              label: 'Roommate',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.groups),
              label: 'Community',
            ),
          ],
        ),
      ),
    );
  }
}
