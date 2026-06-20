import 'dart:developer';

import 'package:flutter/material.dart' hide Notification;
import 'package:student_hub/homepage/extrapages/carddetails.dart';
import 'package:student_hub/homepage/extrapages/notification.dart';
import 'package:student_hub/homepage/extrapages/viewall.dart';
import 'package:student_hub/login/Login.dart';
import 'package:student_hub/main.dart';
import 'package:student_hub/profile/customer/student_profile.dart';
import 'package:student_hub/profile/owner/owner_profile_page.dart';
import 'package:student_hub/service/service.dart';
import 'package:student_hub/findroom/findroom.dart';

class StudentHubHome extends StatefulWidget {
  final Function(int) onRedirect; // ضيف السطر ده
  StudentHubHome({super.key, required this.onRedirect});

  @override
  State<StudentHubHome> createState() => _StudentHubHomeState();
}

class _StudentHubHomeState extends State<StudentHubHome> {
  int _currentIndex = 0;
  Map<String, Map<String, dynamic>> roomData = {
    "room1": {
      "title": "Modern Apartment - El Hamra",
      "loc": "Cairo",
      "price": 2500,
      "type": "Apartment",
      "gender": "Boys",
      "roommate": "2 People",
      "dist": "10 mins to Uni",
      "rating": 4.5,
      "amenities": ["Wi-Fi", "Air Conditioning", "Security"],
      "img":
          "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070",
    },
    "room2": {
      "title": "Private Cozy Room - Dokki",
      "loc": "Giza",
      "price": 3500,
      "type": "Private Room",
      "gender": "Girls",
      "roommate": "Alone",
      "dist": "5 mins to Uni",
      "rating": 4.9,
      "amenities": ["Wi-Fi", "Kitchen", "Elevator"],
      "img":
          "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?q=80&w=2080",
    },
    "room3": {
      "title": "Student Studio - Maadi",
      "loc": "Cairo",
      "price": 1800,
      "type": "Studio",
      "gender": "Boys",
      "roommate": "Alone",
      "dist": "15 mins to Uni",
      "rating": 4.2,
      "amenities": ["Air Conditioning", "Security"],
      "img":
          "https://images.unsplash.com/photo-1493809842364-78817add7ffb?q=80&w=2070",
    },
    "room4": {
      "title": "Shared Flat - Nasr City",
      "loc": "Cairo",
      "price": 1200,
      "type": "Shared Room",
      "gender": "Boys",
      "roommate": "3+ People",
      "dist": "12 mins to Uni",
      "rating": 3.8,
      "amenities": ["Wi-Fi", "Kitchen"],
      "img":
          "https://images.unsplash.com/photo-1554995207-c18c203602cb?q=80&w=2070",
    },
    "room5": {
      "title": "Girls Housing - Zamalek",
      "loc": "Cairo",
      "price": 4500,
      "type": "Apartment",
      "gender": "Girls",
      "roommate": "2 People",
      "dist": "8 mins to Uni",
      "rating": 5.0,
      "amenities": ["Wi-Fi", "Security", "Elevator"],
      "img":
          "https://images.unsplash.com/photo-1484154218962-a197022b5858?q=80&w=2074",
    },
    "room6": {
      "title": "Budget Room - Helwan",
      "loc": "Cairo",
      "price": 900,
      "type": "Private Room",
      "gender": "Boys",
      "roommate": "1 Person",
      "dist": "20 mins to Uni",
      "rating": 3.5,
      "amenities": ["Kitchen", "Parking"],
      "img":
          "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070",
    },
    "room7": {
      "title": "Furnished Apartment - Cairo",
      "loc": "Cairo",
      "price": 2500,
      "type": "Studio",
      "gender": "Boys",
      "roommate": "2 People",
      "dist": "14 mins to Uni",
      "rating": 4.0,
      "amenities": ["Wi-Fi", "Air Conditioning"],
      "img":
          "https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=2070",
    },
  };

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FB),

      // 1. Navigation Bar المطلوب
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // --- Header (Logo & Icons) ---
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        InkWell(
                          onTap: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute<void>(
                                builder: (context) => StudentProfileScreen(),
                              ),
                            );
                          },
                          child: const CircleAvatar(
                            backgroundColor: Color(0xFF1E3A8A),
                            radius: 15,
                            child: Image(
                              image: AssetImage("assets/images/logo.png"),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        const Text(
                          "StudentHub",
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF1E3A8A),
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        IconButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute<void>(
                                builder: (context) => OwnerProfileScreen(),
                              ),
                            );
                          },
                          icon: const Icon(
                            Icons.notifications_none_rounded,
                            size: 28,
                          ),
                        ),
                        const SizedBox(width: 12),
                        CircleAvatar(
                          backgroundColor: Colors.blue,
                          child: Center(
                            child: IconButton(
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute<void>(
                                    builder: (context) => LoginScreen(),
                                  ),
                                );
                              },
                              icon: const Icon(Icons.person),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // --- Search Bar ---
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(30),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: "Search for rooms, cities, or universities",
                      border: InputBorder.none,
                      icon: Icon(Icons.search, color: Colors.grey),
                      suffixIcon: IconButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (context) => const FindRoomScreen(),
                            ),
                          );
                        },
                        icon: Icon(Icons.tune, color: Colors.grey),
                      ),
                    ),
                  ),
                ),
              ),

              // --- Hero Banner ---
              _buildHeroBanner(),

              // --- Popular Near Your University ---
              _buildSectionHeader("Popular Near Your University"),
              _buildPopularList(),

              // --- Browse by City ---
              _buildSectionHeader1("Browse by City"),
              _buildCityGrid(),

              // --- University Partners ---
              //_buildSectionHeader("University Partners"),
              // _buildPartnersList(),

              // --- Why Students Choose Us ---
              _buildSectionHeader1("Why Students Choose Us"),
              _buildWhyUsCards(),

              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  // --- Widgets Helpers ---

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          TextButton(
            child: const Text(
              "View all",
              style: TextStyle(color: Colors.blue, fontSize: 14),
            ),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute<void>(builder: (context) => FindRoomScreen()),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader1(String title) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 24, 16, 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroBanner() {
    return Container(
      margin: const EdgeInsets.all(7),
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10),
        ],
      ),
      child: Expanded(
        child: Stack(
          children: [
            // 1. الصورة
            ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: Image.asset(
                'assets/images/girlhome.png',
                width: double.infinity,
                height: 200,
                fit: BoxFit.cover,
              ),
            ),

            // 2. التعتيم (Overlay)
            Container(
              height: 200,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                color: Colors.black.withOpacity(0.3),
              ),
            ),

            // 3. الكلام (متشفت شوية من فوق ومن الشمال)
            Positioned(
              top: 10, // حرك الكلام فوق وتحت من هنا
              left: 20,
              bottom: 10, // حرك الكلام يمين وشمال من هنا
              child: Column(
                crossAxisAlignment:
                    CrossAxisAlignment.start, // يخلي الكلام تحت بعضه من الشمال
                children: [
                  const Text(
                    "Find Your Perfect\nStudent Home",
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                      color: Colors.white, // ضفت أبيض عشان يبان
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    "Safe and comfortable \nhomes near your\n university.",
                    style: TextStyle(color: Colors.white70),
                  ),
                ],
              ),
            ),
            SizedBox(height: 20),

            // 4. الزرار (متحرك لوحده تماماً)
            Positioned(
              top: 150,
              // bottom: 10, // يبعد عن الحافة التحت 20
              left: 10, // يبعد عن الحافة الشمال 20
              child: ElevatedButton(
                onPressed: () {
                  widget.onRedirect(1); //
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E3A8A),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text(
                  "Find Your Room →",
                  style: TextStyle(color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPopularList() {
    return SizedBox(
      height: 303,

      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.only(left: 16),
        itemCount: 4,
        itemBuilder: (context, index) {
          // جلب بيانات غرفة محددة بناءً على الـ index أو تحديد غرفة معينة كمثال
          // هنا سنأخذ "room1" كمثال لتجنب الـ null أو يمكنك تعديل الـ Map لتكون List
          final currentRoom =
              roomData["room${index + 1}"] ?? roomData["room1"]!;

          return SizedBox(
            width: 200,
            child: Card(
              margin: const EdgeInsets.only(right: 16),
              child: InkWell(
                onTap: () {
                  // التعديل السحري: نمرر الغرفة الحالية المحددة فقط وليس الـ Map كاملة
                  Navigator.push(
                    context,
                    MaterialPageRoute<void>(
                      builder: (context) => Carddetails(room: currentRoom),
                    ),
                  );
                },
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(15),
                      ),
                      child: Container(
                        height: 182,
                        width: 180,
                        color: Colors.grey.shade300,
                        child: Image(
                          image: AssetImage("assets/images/building.png"),
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(12.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            currentRoom["title"] ??
                                "No Title", // استخدام الغرفة المحددة
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          Text(
                            currentRoom["loc"] ??
                                "Cairo", // استخدام الغرفة المحددة
                            style: const TextStyle(
                              color: Colors.grey,
                              fontSize: 12,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            "EGP ${currentRoom["price"]} / month", // استخدام الغرفة المحددة
                            style: const TextStyle(
                              color: Color(0xFF1E3A8A),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildCityGrid() {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 4,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      //mainAxisSpacing: 10,
      crossAxisSpacing: 3,
      childAspectRatio: 1.5,
      children: [
        _cityCard(
          "Cairo",
          Image(image: AssetImage("assets/images/cairocity.jpg")),
        ),
        _cityCard(
          "Alexandria",
          Image(image: AssetImage("assets/images/alecity.jpg")),
        ),
        _cityCard(
          "New Cairo",
          Image(image: AssetImage("assets/images/newcairo.jpg")),
        ),
        _cityCard(
          "Giza",
          Image(image: AssetImage("assets/images/gizacity4.jpg")),
        ),
      ],
    );
  }

  Widget _cityCard(String name, Image image) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.blue.shade100,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Stack(
        children: [
          ClipRRect(borderRadius: BorderRadius.circular(20), child: image),
          Positioned(
            top: 40,
            left: 5,

            child: Container(
              child: Text(
                name,
                style: TextStyle(fontSize: 12, color: Colors.white),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Widget _buildPartnersList() {
  //   return SizedBox(
  //     height: 60,
  //     child: ListView.builder(
  //       scrollDirection: Axis.horizontal,
  //       padding: const EdgeInsets.only(left: 16),
  //       itemCount: 5,
  //       itemBuilder: (context, index) => const Padding(
  //         padding: EdgeInsets.only(right: 20),
  //         child: CircleAvatar(
  //           backgroundColor: Colors.white,
  //           child: Image(image: AssetImage("assets/images/cairo.jpg")),
  //         ),
  //       ),
  //     ),
  //   );
  // }

  Widget _buildWhyUsCards() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Row(
        children: [
          Expanded(child: _whyCard(Icons.verified, "Verified Properties")),
          const SizedBox(width: 10),
          Expanded(child: _whyCard(Icons.sell, "Best Price")),
        ],
      ),
    );
  }

  Widget _whyCard(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(15),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.blue),
          const SizedBox(height: 8),
          Text(
            text,
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
