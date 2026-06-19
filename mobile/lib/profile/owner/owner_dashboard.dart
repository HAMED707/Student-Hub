import 'package:flutter/material.dart';
import 'package:student_hub/login/Login.dart';
import 'package:student_hub/profile/owner/messages.dart';
import 'package:student_hub/profile/owner/owner_payments.dart';
import 'package:student_hub/profile/owner/owner_profile_page.dart';
import 'package:student_hub/profile/owner/properties/owner_properties.dart';
import 'package:student_hub/profile/owner/settings.dart';

class OwnerDashboardScreen extends StatelessWidget {
  const OwnerDashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();

    return Scaffold(
      key: scaffoldKey,
      backgroundColor: const Color(0xFFF4F6F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D214F),
        elevation: 0,
        title: const Text(
          "                    Dashboard",
          style: TextStyle(color: Colors.white, fontSize: 16),
        ),
        leading: IconButton(
          icon: const Icon(Icons.menu, color: Colors.white),
          onPressed: () => scaffoldKey.currentState?.openDrawer(),
        ),
      ),
      // المنيو الجانبية اللي عملناها سوا
      drawer: _buildDrawer(context),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1. الترحيب والتنبيه العلوي
            const Text(
              "Welcome back, Mathew Perry",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0D214F),
              ),
            ),
            const SizedBox(height: 12),
            _buildWarningNotice(),
            const SizedBox(height: 20),

            // 2. كارت الأرباح الكلي (Total Earnings) - بارز فوق
            _buildEarningsCard(),
            const SizedBox(height: 16),

            // 3. كروت الإحصائيات الأربعة (Grid 2x2)
            _buildStatisticsGrid(),
            const SizedBox(height: 20),

            // 4. أحدث الحجوزات (Latest Student Bookings)
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  "Latest Student Bookings",
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0D214F),
                  ),
                ),
                TextButton(onPressed: () {}, child: const Text("See All")),
              ],
            ),
            _buildStudentBookingsSlider(),
            const SizedBox(height: 20),

            // 5. تحليلات الأداء (Performance Analytics)
            const Text(
              "Performance Analytics",
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0D214F),
              ),
            ),
            const SizedBox(height: 8),
            _buildAnalyticsList(),
            const SizedBox(height: 20),

            // 6. التنبيهات الهامة (Important Notifications)
            const Text(
              "Important Notifications",
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0D214F),
              ),
            ),
            const SizedBox(height: 8),
            _buildNotificationsList(),
          ],
        ),
      ),
    );
  }

  // التنبيه البرتقالي اللي فوق
  Widget _buildWarningNotice() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.orange[50],
        border: Border.all(color: Colors.orange.shade200),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          const Icon(Icons.info_outline, color: Colors.orange),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              "Your property 'Nasr City Apartment' needs updated photos to remain listed.",
              style: TextStyle(
                color: Colors.orange[900],
                fontSize: 13,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  // كارت الأرباح الأخضر المميز
  Widget _buildEarningsCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFA7F3D0), Color(0xFF6EE7B7)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(15),
      ),
      child: const Column(
        children: [
          Text(
            "Total Earnings",
            style: TextStyle(
              color: Color(0xFF065F46),
              fontSize: 15,
              fontWeight: FontWeight.w500,
            ),
          ),
          SizedBox(height: 8),
          Text(
            "\$ 1,500",
            style: TextStyle(
              color: Color(0xFF065F46),
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  // الإحصائيات الأربعة في الموبايل معمولين كـ Grid منظم جداً
  Widget _buildStatisticsGrid() {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.4,
      children: [
        _buildStatCard(
          "Total Properties",
          "5",
          const Color(0xFFDBEAFE),
          const Color(0xFF1E40AF),
        ),
        _buildStatCard(
          "Booked Units (85%)",
          "4",
          const Color(0xFFF3E8FF),
          const Color(0xFF6B21A8),
        ),
        _buildStatCard(
          "Total Views",
          "1500",
          const Color(0xFFE0F2FE),
          const Color(0xFF0369A1),
        ),
        _buildStatCard(
          "Pending Requests",
          "15",
          const Color(0xFFFEF3C7),
          const Color(0xFF92400E),
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    Color bgColor,
    Color textColor,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            title,
            style: TextStyle(
              color: textColor,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          Text(
            value,
            style: TextStyle(
              color: textColor,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  // كروت الطلاب (أحمد خالد) بتمرير أفقي شيك جداً
  Widget _buildStudentBookingsSlider() {
    final List<Map<String, String>> bookings = [
      {
        "name": "Ahmed Khaled",
        "room": "Room A3 - 2 Beds",
        "date": "Check-in: 12 March 2026",
        "status": "Available",
      },
      {
        "name": "Ahmed Khaled",
        "room": "Room A3 - 2 Beds",
        "date": "Check-in: 12 March 2026",
        "status": "Pending",
      },
      {
        "name": "Ahmed Khaled",
        "room": "Room A3 - 2 Beds",
        "date": "Check-in: 12 March 2026",
        "status": "Available",
      },
    ];

    return SizedBox(
      height: 140,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: bookings.length,
        itemBuilder: (context, index) {
          final item = bookings[index];
          bool isAvailable = item['status'] == "Available";

          return Container(
            width: 220,
            margin: const EdgeInsets.only(right: 12, bottom: 4),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: isAvailable
                  ? const Color(0xFFECFDF5)
                  : const Color(0xFFFFFBEB),
              border: Border.all(
                color: isAvailable
                    ? Colors.green.shade100
                    : Colors.amber.shade100,
              ),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const CircleAvatar(
                      radius: 14,
                      backgroundColor: Colors.grey,
                      child: Icon(Icons.person, size: 16, color: Colors.white),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: isAvailable ? Colors.green : Colors.amber,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        item['status']!,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
                Text(
                  item['name']!,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                Text(
                  item['room']!,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
                Text(
                  item['date']!,
                  style: const TextStyle(
                    color: Colors.black54,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // سيكشن تحليلات الأداء (Performance Analytics)
  Widget _buildAnalyticsList() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: const Padding(
        padding: EdgeInsets.all(8.0),
        child: Column(
          children: [
            ListTile(
              title: Text(
                "Shared Room - Nasr City",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              subtitle: Text(
                "Cairo - Nasr City",
                style: TextStyle(fontSize: 12),
              ),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    "124 views",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  Text(
                    "8 bookings",
                    style: TextStyle(color: Colors.grey, fontSize: 11),
                  ),
                ],
              ),
            ),
            Divider(),
            ListTile(
              title: Text(
                "Shared Room - Nasr City",
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
              ),
              subtitle: Text(
                "Cairo - Nasr City",
                style: TextStyle(fontSize: 12),
              ),
              trailing: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    "124 views",
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  ),
                  Text(
                    "8 bookings",
                    style: TextStyle(color: Colors.grey, fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // سيكشن التنبيهات الهامة (Important Notifications)
  Widget _buildNotificationsList() {
    return Column(
      children: [
        _buildNotificationItem(
          "Payout Available",
          "Your balance is ready for withdrawal: \$1,240 after platform fees.",
          Icons.account_balance_wallet_outlined,
          Colors.orange,
        ),
        _buildNotificationItem(
          "Payment Received",
          "You received a new payment: \$320 for Room A2.",
          Icons.check_circle_outline,
          Colors.green,
        ),
        _buildNotificationItem(
          "Tenant Contract Ending Soon",
          "The contract for Omar Hassan ends in 10 days.",
          Icons.assignment_late_outlined,
          Colors.blue,
        ),
        _buildNotificationItem(
          "Security Alert",
          "Verification documents are required to receive payouts.",
          Icons.gpp_bad_outlined,
          Colors.red,
        ),
      ],
    );
  }

  Widget _buildNotificationItem(
    String title,
    String body,
    IconData icon,
    Color color,
  ) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: color.withOpacity(0.1),
          child: Icon(icon, color: color, size: 20),
        ),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 13,
            color: color,
          ),
        ),
        subtitle: Text(body, style: const TextStyle(fontSize: 11, height: 1.3)),
        trailing: const Icon(Icons.close, size: 16, color: Colors.grey),
      ),
    );
  }

  // المنيو الجانبية (Drawer)
  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      backgroundColor: const Color(0xFF0D214F),
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(color: Color(0xFF0D214F)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.white24,
                  child: Icon(Icons.person, color: Colors.white, size: 35),
                ),
                SizedBox(height: 10),
                Text(
                  "Mathew Perry",
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  "Owner Account",
                  style: TextStyle(color: Colors.white54, fontSize: 12),
                ),
              ],
            ),
          ),
          _buildDrawerItem5(context, Icons.person, "Profile"),
          _buildDrawerItem(
            context,
            Icons.dashboard,
            "Dashboard",
            isActive: true,
          ),
          _buildDrawerItem2(context, Icons.payment, "Payments"),
          _buildDrawerItem3(context, Icons.message, "Messages"),
          _buildDrawerItem4(context, Icons.home_work, "My Properties"),

          _buildDrawerItem6(context, Icons.settings, "Settings"),
          const Divider(color: Colors.white10),
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.redAccent),
            title: const Text(
              "Logout",
              style: TextStyle(color: Colors.redAccent, fontSize: 14),
            ),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).push(
                MaterialPageRoute<void>(builder: (context) => LoginScreen()),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildDrawerItem(
    BuildContext context,
    IconData icon,
    String title, {
    bool isActive = false,
  }) {
    return ListTile(
      leading: Icon(icon, color: isActive ? Colors.white : Colors.white54),
      title: Text(
        title,
        style: TextStyle(
          color: isActive ? Colors.white : Colors.white54,
          fontSize: 14,
        ),
      ),
      tileColor: isActive ? Colors.blue.withOpacity(0.2) : Colors.transparent,
      onTap: () {},
    );
  }

  Widget _buildDrawerItem2(
    BuildContext context,
    IconData icon,
    String title, {
    bool isActive = false,
  }) {
    return ListTile(
      leading: Icon(icon, color: isActive ? Colors.white : Colors.white54),
      title: Text(
        title,
        style: TextStyle(
          color: isActive ? Colors.white : Colors.white54,
          fontSize: 14,
        ),
      ),
      tileColor: isActive ? Colors.blue.withOpacity(0.2) : Colors.transparent,
      onTap: () {
        Navigator.pop(context);
        Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (context) => OwnerPaymentsScreen()),
        );
      },
    );
  }

  Widget _buildDrawerItem3(
    BuildContext context,
    IconData icon,
    String title, {
    bool isActive = false,
  }) {
    return ListTile(
      leading: Icon(icon, color: isActive ? Colors.white : Colors.white54),
      title: Text(
        title,
        style: TextStyle(
          color: isActive ? Colors.white : Colors.white54,
          fontSize: 14,
        ),
      ),
      tileColor: isActive ? Colors.blue.withOpacity(0.2) : Colors.transparent,
      onTap: () {
        Navigator.pop(context);
        Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (context) => OwnerMessagesScreen()),
        );
      },
    );
  }

  Widget _buildDrawerItem4(
    BuildContext context,
    IconData icon,
    String title, {
    bool isActive = false,
  }) {
    return ListTile(
      leading: Icon(icon, color: isActive ? Colors.white : Colors.white54),
      title: Text(
        title,
        style: TextStyle(
          color: isActive ? Colors.white : Colors.white54,
          fontSize: 14,
        ),
      ),
      tileColor: isActive ? Colors.blue.withOpacity(0.2) : Colors.transparent,
      onTap: () {
        Navigator.pop(context);
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (context) => OwnerPropertiesScreen(),
          ),
        );
      },
    );
  }

  Widget _buildDrawerItem5(
    BuildContext context,
    IconData icon,
    String title, {
    bool isActive = false,
  }) {
    return ListTile(
      leading: Icon(icon, color: isActive ? Colors.white : Colors.white54),
      title: Text(
        title,
        style: TextStyle(
          color: isActive ? Colors.white : Colors.white54,
          fontSize: 14,
        ),
      ),
      tileColor: isActive ? Colors.blue.withOpacity(0.2) : Colors.transparent,
      onTap: () {
        Navigator.pop(context);
        Navigator.of(context).push(
          MaterialPageRoute<void>(
            builder: (context) => const OwnerProfileScreen(),
          ),
        );
      },
    );
  }

  Widget _buildDrawerItem6(
    BuildContext context,
    IconData icon,
    String title, {
    bool isActive = false,
  }) {
    return ListTile(
      leading: Icon(icon, color: isActive ? Colors.white : Colors.white54),
      title: Text(
        title,
        style: TextStyle(
          color: isActive ? Colors.white : Colors.white54,
          fontSize: 14,
        ),
      ),
      tileColor: isActive ? Colors.blue.withOpacity(0.2) : Colors.transparent,
      onTap: () {
        Navigator.pop(context);
        Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (context) => OwnerSettingsScreen()),
        );
      },
    );
  }
}
