// ignore_for_file: invalid_null_aware_operator

import 'package:flutter/material.dart';
import 'package:student_hub/findroom/booking_details.dart';

class Carddetails extends StatelessWidget {
  // دي الـ Map اللي بتستقبل الداتا من أي مكان (Home أو Find Room)
  final Map<String, dynamic> room;

  Carddetails({super.key, required this.room});

  // اللستة دي كدة كدة إحنا مش مستخدمينها هنا لأننا بنعرض داتا الكارد اللي مبعوث (room)
  final List<Map<String, dynamic>> roomData = [
    {
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
    {
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
  ];

  @override
  Widget build(BuildContext context) {
    // التصحيح: بنجيب السعر من الغرفة المبعوثة للشاشة مباشرة، وبنديله قيمة افتراضية 0 لو جِه null
    final int currentPrice = room['price'] ?? 0;

    return Scaffold(
      backgroundColor: Colors.white,
      // زرار الحجز ثابت تحت وبياخد السعر المظبوط
      bottomNavigationBar: _buildBottomAction(currentPrice, context),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // الهيدر ثابت (الصورة + الأزرار)
            _buildImageHeader(context),

            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // العنوان واللوكيشن والتقييم (Data Driven)
                  _buildTitleSection(),
                  const SizedBox(height: 20),

                  // المواصفات (Data Driven)
                  _buildQuickSpecs(),
                  const SizedBox(height: 25),

                  const Text(
                    "About this place",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  const Text(
                    "Modern and fully furnished apartment in a prime location. Close to the university and public transport. Perfect for students looking for comfort and safety.",
                    style: TextStyle(color: Colors.grey, height: 1.5),
                  ),
                  const SizedBox(height: 20),

                  const Text(
                    "Amenities",
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 15),

                  // الخدمات (بتظهر وتختفي حسب الداتا)
                  _buildAmenities(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- 1. هيدر الصورة ---
  Widget _buildImageHeader(BuildContext context) {
    // تأمين رابط الصورة المبعوث، لو مش موجود يحط صورة افتراضية من داتا الشقة
    final String imagePath =
        room['img'] ??
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070';

    return Stack(
      children: [
        Container(
          height: 300,
          width: double.infinity,
          decoration: BoxDecoration(
            image: DecorationImage(
              // يفضل استخدام NetworkImage لأن اللنكات عندك من Unsplash أونلاين
              image: imagePath.startsWith('http')
                  ? NetworkImage(imagePath) as ImageProvider
                  : AssetImage(imagePath),
              fit: BoxFit.cover,
            ),
          ),
        ),
        Positioned(
          top: 50,
          left: 20,
          child: CircleAvatar(
            backgroundColor: Colors.white,
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.black),
              onPressed: () => Navigator.pop(context),
            ),
          ),
        ),
        const Positioned(
          top: 50,
          right: 20,
          child: CircleAvatar(
            backgroundColor: Colors.white,
            child: Icon(Icons.favorite_border, color: Colors.black),
          ),
        ),
      ],
    );
  }

  // --- 2. العنوان والتقييم ---
  Widget _buildTitleSection() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              room['title'] ?? "No Title",
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 5),
            Row(
              children: [
                const Icon(Icons.location_on, color: Colors.grey, size: 16),
                Text(
                  // تصحيح: توحيد الـ Keys لتجنب الـ Null Exception
                  room['loc'] ?? room['location'] ?? "Cairo, Egypt",
                  style: const TextStyle(color: Colors.grey),
                ),
              ],
            ),
          ],
        ),
        Row(
          children: [
            const Icon(Icons.star, color: Colors.amber, size: 20),
            Text(
              " ${room['rating'] ?? 4.5}",
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ],
    );
  }

  // --- 3. المواصفات السريعة ---
  Widget _buildQuickSpecs() {
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade200),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _specItem(Icons.directions_walk, room['dist'] ?? "10 min"),
          _specItem(
            Icons.people,
            "${room['roommate'] ?? room['roommates'] ?? '2'} Mates",
          ),
          _specItem(
            Icons.wifi,
            (room['hasWifi'] == true ||
                    (room['amenities'] != null &&
                        room['amenities'].contains('Wi-Fi')))
                ? "WiFi Incl."
                : "No WiFi",
          ),
          _specItem(Icons.security, "Security"),
        ],
      ),
    );
  }

  Widget _specItem(IconData icon, String text) {
    return Column(
      children: [
        Icon(icon, color: Colors.black87, size: 22),
        const SizedBox(height: 8),
        Text(text, style: const TextStyle(fontSize: 10, color: Colors.grey)),
      ],
    );
  }

  // --- 4. الخدمات ---
  Widget _buildAmenities() {
    // طريقة ذكية تقرأ من لستة الـ amenities أو من الـ bool الافتراضي في الماب
    final List amenitiesList = room['amenities'] ?? [];
    final bool hasWifi =
        room['hasWifi'] == true || amenitiesList.contains('Wi-Fi');
    final bool hasAC =
        room['hasAC'] == true || amenitiesList.contains('Air Conditioning');

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: [
        if (hasWifi) _amenityChip("Wi-Fi", Icons.wifi),
        if (hasAC) _amenityChip("Air Conditioning", Icons.ac_unit),
        if (amenitiesList.contains('Kitchen') || room['type'] == 'Apartment')
          _amenityChip("Kitchen", Icons.kitchen),
        _amenityChip("Washing Machine", Icons.local_laundry_service),
        _amenityChip("Elevator", Icons.elevator),
      ],
    );
  }

  Widget _amenityChip(String name, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(10),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16),
          const SizedBox(width: 8),
          Text(name, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }

  // --- 5. شريط السعر والحجز ---
  Widget _buildBottomAction(int price, BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 25, vertical: 20),
      decoration: const BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
            offset: Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "EGP $price / month",
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Text(
                "Available",
                style: TextStyle(
                  color: Colors.green,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          ElevatedButton(
            onPressed: () {
              // تأمين رابط الصورة للتأكد من أنه ليس فارغاً ويبدأ بـ http لتجنب تجمد Image.network
              String validImageUrl = room['img'] ?? "";
              if (!validImageUrl.startsWith('http')) {
                validImageUrl =
                    "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2070"; // صورة افتراضية
              }

              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => BookingDetailsScreen(
                    apartmentName: room['title'] ?? "Apartment",
                    location: room['loc'] ?? room['location'] ?? "Cairo",
                    monthlyPrice: price,
                    imageUrl: validImageUrl, // تمرير الرابط المؤمن
                  ),
                ),
              );
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1E3A8A),
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            child: const Text(
              "Book Now",
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
