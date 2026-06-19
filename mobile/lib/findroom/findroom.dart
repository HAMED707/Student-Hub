import 'package:flutter/material.dart';
import 'package:student_hub/homepage/extrapages/carddetails.dart';

class FindRoomScreen extends StatefulWidget {
  const FindRoomScreen({super.key});

  @override
  State<FindRoomScreen> createState() => _FindRoomScreenState();
}

class _FindRoomScreenState extends State<FindRoomScreen> {
  // داتا الـ 6 كروت الأساسية في تطبيقك ثابتة كما هي بنفس المسميات
  final List<Map<String, dynamic>> allRooms = [
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
    {
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
    {
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
    {
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
    {
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
  ];

  // لستة ديناميكية نستخدمها لعرض نتائج البحث تظهر فيها الشقق المتطابقة
  List<Map<String, dynamic>> displayedRooms = [];
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // في البداية نعرض جميع الشقق
    displayedRooms = List.from(allRooms);
  }

  // دالة لتصفية الشقق بناءً على النص المكتوب في خانة البحث
  void _filterRooms(String query) {
    setState(() {
      if (query.isEmpty) {
        displayedRooms = List.from(allRooms);
      } else {
        displayedRooms = allRooms.where((room) {
          final title = (room['title'] ?? "").toString().toLowerCase();
          final location = (room['loc'] ?? "").toString().toLowerCase();
          return title.contains(query.toLowerCase()) ||
              location.contains(query.toLowerCase());
        }).toList();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: const Text(
          "Find Your Room",
          style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // شريط البحث في أعلى الصفحة يعمل بشكل تفاعلي
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(15),
              ),
              child: TextField(
                controller: _searchController,
                onChanged: _filterRooms, // عند تغيير النص يتم البحث فوراً
                decoration: const InputDecoration(
                  hintText: "Search by title or location...",
                  border: InputBorder.none,
                  icon: Icon(Icons.search, color: Colors.grey),
                ),
              ),
            ),
          ),
          // عرض قائمة الشقق المفلترة
          Expanded(
            child: displayedRooms.isEmpty
                ? const Center(child: Text("No rooms match your search"))
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: displayedRooms.length,
                    itemBuilder: (context, index) {
                      final data = displayedRooms[index];
                      return _buildRoomCard(data);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoomCard(Map<String, dynamic> data) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      elevation: 2,
      child: InkWell(
        borderRadius: BorderRadius.circular(15),
        onTap: () {
          // تمرير بيانات الكارد الحالي بشكل سليم لتجنب الـ Freezing
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => Carddetails(room: data)),
          );
        },
        child: Row(
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(15),
                bottomLeft: Radius.circular(15),
              ),
              child: Image.network(
                data['img'] ?? "",
                height: 130,
                width: 120,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) {
                  return Image.asset(
                    "assets/images/building.png",
                    height: 130,
                    width: 120,
                    fit: BoxFit.cover,
                  );
                },
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 4),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      data['title'] ?? "No Title",
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "${data['loc'] ?? 'Cairo'} • ${data['dist'] ?? '10 mins'}",
                      style: const TextStyle(color: Colors.grey, fontSize: 10),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "${data['roommate'] ?? '1 Person'} • ${data['gender'] ?? 'Boys'}",
                      style: const TextStyle(
                        color: Colors.blueGrey,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star, size: 12, color: Colors.amber),
                        Text(
                          " ${data['rating'] ?? 4.5}",
                          style: const TextStyle(fontSize: 10),
                        ),
                      ],
                    ),
                    const Divider(height: 8),
                    Text(
                      "EGP ${data['price'] ?? 0}",
                      style: TextStyle(
                        color: Colors.blue[800],
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
