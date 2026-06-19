import 'package:flutter/material.dart';
import 'package:student_hub/homepage/extrapages/carddetails.dart';
import 'package:student_hub/login/Login.dart';
import 'package:student_hub/profile/owner/messages.dart';
import 'package:student_hub/profile/owner/owner_dashboard.dart';
import 'package:student_hub/profile/owner/owner_payments.dart';
import 'package:student_hub/profile/owner/owner_profile_page.dart';
import 'package:student_hub/profile/owner/properties/add_prop.dart';
import 'package:student_hub/profile/owner/settings.dart';

class OwnerPropertiesScreen extends StatefulWidget {
  const OwnerPropertiesScreen({super.key});

  @override
  State<OwnerPropertiesScreen> createState() => _OwnerPropertiesScreenState();
}

class _OwnerPropertiesScreenState extends State<OwnerPropertiesScreen> {
  // نقلنا اللستة هنا عشان الحذف والتحديث يسمعوا في الـ UI فوراً
  final List<Map<String, dynamic>> properties = [
    {
      "title": "Shared Room - Nasr City",
      "price": "4500",
      "location": "Cairo - Nasr City",
      "status": "Available",
    },
    {
      "title": "Shared Room - Nasr City",
      "price": "4500",
      "location": "Cairo - Nasr City",
      "status": "Available",
    },
    {
      "title": "Shared Room - Nasr City",
      "price": "4500",
      "location": "Cairo - Nasr City",
      "status": "Available",
    },
  ];

  final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: scaffoldKey,
      backgroundColor: const Color(0xFFF4F6F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D214F),
        elevation: 0,
        title: const Text(
          "My Properties",
          style: TextStyle(color: Colors.white, fontSize: 16),
        ),
        leading: IconButton(
          icon: const Icon(Icons.menu, color: Colors.white),
          onPressed: () {
            scaffoldKey.currentState?.openDrawer();
          },
        ),
      ),
      drawer: _buildDrawer(context),
      body: Column(
        children: [
          _buildHeaderSection(context),
          Expanded(
            child: properties.isEmpty
                ? const Center(child: Text("No properties found"))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: properties.length,
                    itemBuilder: (context, index) {
                      final item = properties[index];
                      return _buildPropertyCard(context, item, index);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeaderSection(BuildContext context) {
    return Container(
      color: const Color(0xFF0D214F),
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 20, top: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          const Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Manage Listings",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 4),
              Text(
                "Add or update your available rooms",
                style: TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
          ElevatedButton.icon(
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute<void>(
                  builder: (context) => const AddPropertyScreen(),
                ),
              );
            },
            icon: const Icon(Icons.add, size: 16, color: Color(0xFF0D214F)),
            label: const Text(
              "Add New",
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Color(0xFF0D214F),
              ),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPropertyCard(
    BuildContext context,
    Map<String, dynamic> item,
    int index,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.home_work, color: Colors.grey, size: 35),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.start,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item["title"]!,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  item["location"]!,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      "EGP ${item["price"]}/mo",
                      style: const TextStyle(
                        color: Color(0xFF3B82F6),
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.green[50],
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        item["status"]!,
                        style: const TextStyle(
                          color: Colors.green,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),

          // هنا تم دمج زرار الـ View الأصلي بتاعك كـ child داخل الـ PopupMenuButton ليقوم بالـ Logic المطلوب بالظبط دون تغيير شكله
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'delete') {
                setState(() {
                  properties.removeAt(index); // حذف الكارد من الصفحة
                });
              } else if (value == 'edit') {
                Navigator.of(context).push(
                  MaterialPageRoute<void>(
                    builder: (context) => AddPropertyScreen(
                      propertyData: item,
                    ), // تمرير البيانات لصفحة الإضافة
                  ),
                );
              }
            },
            itemBuilder: (BuildContext context) => [
              const PopupMenuItem(
                value: 'edit',
                child: Row(
                  children: [
                    Icon(Icons.edit, color: Colors.blue, size: 16),
                    SizedBox(width: 8),
                    Text("تعديل", style: TextStyle(fontSize: 13)),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'delete',
                child: Row(
                  children: [
                    Icon(Icons.delete, color: Colors.red, size: 16),
                    SizedBox(width: 8),
                    Text("حذف", style: TextStyle(fontSize: 13)),
                  ],
                ),
              ),
            ],
            // زرار الـ View الأصلي بتاعك بالملي بدون تغيير أي ستايل
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.shade300),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Text(
                "View",
                style: TextStyle(
                  color: Colors.black,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

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
          _buildDrawerItem(context, Icons.dashboard, "Dashboard"),
          _buildDrawerItem2(context, Icons.payment, "Payments"),
          _buildDrawerItem3(context, Icons.message, "Messages"),
          _buildDrawerItem4(
            context,
            Icons.home_work,
            "My Properties",
            isActive: true,
          ),

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
      onTap: () {
        Navigator.pop(context);
        Navigator.of(context).push(
          MaterialPageRoute<void>(builder: (context) => OwnerDashboardScreen()),
        );
      },
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
