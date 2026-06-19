import 'package:flutter/material.dart';
import 'package:student_hub/login/Login.dart';
import 'package:student_hub/profile/owner/owner_dashboard.dart';
import 'package:student_hub/profile/owner/owner_payments.dart';
import 'package:student_hub/profile/owner/owner_profile_page.dart';
import 'package:student_hub/profile/owner/properties/owner_properties.dart';
import 'package:student_hub/profile/owner/settings.dart';

// --- الشاشة الأولى: لستة الرسائل والمحادثات ---
class OwnerMessagesScreen extends StatelessWidget {
  const OwnerMessagesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();

    // داتا لستة الشات المأخوذة من التصميم بالظبط
    final List<Map<String, dynamic>> chats = [
      {
        "name": "John Smith",
        "message": "See you later, I'll let you know.",
        "time": "09:15",
        "unread": 5,
        "online": true,
      },
      {
        "name": "Creative Minds",
        "message": "Marcus Miller: Do you have time for a...",
        "time": "09:00",
        "unread": 57,
        "online": false,
      },
      {
        "name": "Anna Roberts",
        "message": "I'll confirm the time tomorrow.",
        "time": "08:57",
        "unread": 2,
        "online": true,
      },
      {
        "name": "Charles Miller",
        "message": "Thanks for the document, everythi...",
        "time": "08:55",
        "unread": 1,
        "online": true,
      },
      {
        "name": "Luis Anderson",
        "message": "I'll send you the link in a moment.",
        "time": "08:55",
        "unread": 0,
        "online": false,
      },
      {
        "name": "Sophia Taylor",
        "message": "I loved the idea, let's do it.",
        "time": "08:45",
        "unread": 0,
        "online": true,
      },
      {
        "name": "Daniel Wilson",
        "message": "I called you earlier, call me back.",
        "time": "08:00",
        "unread": 0,
        "online": false,
      },
      {
        "name": "Richard Davis",
        "message": "Today's meeting was great, thanks.",
        "time": "07:56",
        "unread": 0,
        "online": true,
      },
    ];

    return Scaffold(
      key: scaffoldKey,
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D214F),
        elevation: 0,
        title: Row(
          children: [
            const Text(
              "Messages",
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(width: 8),
            // شارة عدد الرسائل الكلي (65) اللي في التصميم
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFF3B82F6),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Text(
                "65",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        leading: IconButton(
          icon: const Icon(Icons.menu, color: Colors.white),
          onPressed: () => scaffoldKey.currentState?.openDrawer(),
        ),
      ),
      drawer: _buildDrawer(context),
      body: Column(
        children: [
          // شريط البحث (Search Bar) الشبيه بالتصميم
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: TextField(
              decoration: InputDecoration(
                hintText: "Search",
                prefixIcon: const Icon(Icons.search, color: Colors.grey),
                fillColor: const Color(0xFFF3F4F6),
                filled: true,
                contentPadding: const EdgeInsets.symmetric(vertical: 0),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
              ),
            ),
          ),

          // قائمة المحادثات
          Expanded(
            child: ListView.separated(
              itemCount: chats.length,
              separatorBuilder: (context, index) =>
                  const Divider(height: 1, indent: 70),
              itemBuilder: (context, index) {
                final chat = chats[index];
                return ListTile(
                  leading: Stack(
                    children: [
                      const CircleAvatar(
                        radius: 24,
                        backgroundColor: Color(0xFFE5E7EB),
                        child: Icon(
                          Icons.person,
                          color: Colors.grey,
                        ), // استبدلها بصور الـ assets لاحقاً
                      ),
                      if (chat['online'])
                        Positioned(
                          bottom: 2,
                          right: 2,
                          child: Container(
                            width: 12,
                            height: 12,
                            decoration: BoxDecoration(
                              color: const Color(
                                0xFF10B981,
                              ), // النقطة الخضراء للـ Online
                              shape: BoxShape.circle,
                              border: Border.all(color: Colors.white, width: 2),
                            ),
                          ),
                        ),
                    ],
                  ),
                  title: Text(
                    chat['name'],
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFF1F2937),
                    ),
                  ),
                  subtitle: Text(
                    chat['message'],
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text(
                        chat['time'],
                        style: const TextStyle(
                          color: Colors.grey,
                          fontSize: 11,
                        ),
                      ),
                      const SizedBox(height: 4),
                      if (chat['unread'] > 0)
                        Container(
                          padding: const EdgeInsets.all(6),
                          decoration: const BoxDecoration(
                            color: Color(0xFF3B82F6),
                            shape: BoxShape.circle,
                          ),
                          child: Text(
                            "${chat['unread']}",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                  onTap: () {
                    // الانتقال لصفحة المحادثة المفتوحة عند الضغط
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) =>
                            ChatDetailScreen(userName: chat['name']),
                      ),
                    );
                  },
                );
              },
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
          _buildDrawerItem3(context, Icons.message, "messages", isActive: true),
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
      onTap: () {},
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

// --- الشاشة الثانية: داخل المحادثة (Chat Details) ---
class ChatDetailScreen extends StatelessWidget {
  final String userName;
  const ChatDetailScreen({super.key, required this.userName});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9FAFB),
      // هيدر الشات العلوي مع أزرار الاتصال ورؤية الحساب
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 1,
        iconTheme: const IconThemeData(color: Color(0xFF0D214F)),
        title: Row(
          children: [
            const CircleAvatar(
              radius: 18,
              backgroundColor: Colors.grey,
              child: Icon(Icons.person, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    userName,
                    style: const TextStyle(
                      color: Color(0xFF0D214F),
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    "Online",
                    style: TextStyle(color: Color(0xFF10B981), fontSize: 11),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.phone_outlined, color: Color(0xFF3B82F6)),
            onPressed: () {},
          ),
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: ElevatedButton(
              onPressed: () {},
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF3B82F6),
                padding: const EdgeInsets.symmetric(horizontal: 12),
                minimumSize: const Size(0, 32),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              child: const Text(
                "View Profile",
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          // منطقة عرض الرسائل (فقاعات الشات)
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildChatBubble(
                  message:
                      "Hey Emma! I was thinking about the new app interface. Do you think a dark theme would work better for this project?",
                  time: "09:20",
                  isMe: false, // الطرف التاني (رمادي غامق)
                ),
                _buildChatBubble(
                  message:
                      "Hey Mary! I actually like that idea. Dark themes feel modern and reduce eye strain. But we need to make sure accessibility is on point—contrast is key.",
                  time: "09:20",
                  isMe: true, // أنا اللي برسل (الأزرق)
                ),
                _buildChatBubble(
                  message:
                      "Totally agree. I’ll test a few variations with different text contrasts and button highlights. Do you have any preferences for accent colors?",
                  time: "09:21",
                  isMe: false,
                ),
                _buildChatBubble(
                  message:
                      "Maybe something vibrant, like a deep cyan or a soft neon green? Something that pops without being overwhelming.",
                  time: "09:21",
                  isMe: true,
                ),
                _buildChatBubble(
                  message:
                      "Great call! I’ll experiment with those and send over a few mockups later today.",
                  time: "09:23",
                  isMe: false,
                ),
              ],
            ),
          ),

          // شريط إدخال الرسائل والمرفقات السفلي (Input Bar)
          _buildMessageInputBar(),
        ],
      ),
    );
  }

  // ويدجت بناء فقاعات الشات بالألوان المأخوذة من الديزاين بالظبط
  Widget _buildChatBubble({
    required String message,
    required String time,
    required bool isMe,
  }) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(14),
        constraints: const BoxConstraints(maxWidth: 290),
        decoration: BoxDecoration(
          color: isMe
              ? const Color(0xFF1D4ED8)
              : const Color(0xFF374151), // أزرق للأونر ورمادي للطرف الآخر
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 0),
            bottomRight: Radius.circular(isMe ? 0 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Text(
              message,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
                height: 1.4,
              ),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  time,
                  style: const TextStyle(color: Colors.white70, fontSize: 10),
                ),
                if (isMe) ...[
                  const SizedBox(width: 4),
                  const Icon(
                    Icons.done_all,
                    color: Colors.white70,
                    size: 14,
                  ), // علامة الصحين الزرقاء
                ],
              ],
            ),
          ],
        ),
      ),
    );
  }

  // شريط الإدخال السفلي بكامل أيقوناته
  Widget _buildMessageInputBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      color: Colors.white,
      child: SafeArea(
        child: Row(
          children: [
            // أيقونة المرفقات (المشبك)
            IconButton(
              icon: const Icon(Icons.attach_file, color: Color(0xFF3B82F6)),
              onPressed: () {},
            ),

            // حقل النص مع أيقونة الـ Document الداخلية
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F4F6),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Row(
                  children: [
                    const Expanded(
                      child: Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16.0),
                        child: TextField(
                          decoration: InputDecoration(
                            hintText: "Message",
                            hintStyle: TextStyle(
                              color: Colors.grey,
                              fontSize: 14,
                            ),
                            //border: .none,
                          ),
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(
                        Icons.file_copy_outlined,
                        color: Colors.grey,
                        size: 20,
                      ),
                      onPressed: () {},
                    ),
                  ],
                ),
              ),
            ),

            // أيقونات الكاميرا والمايك الخارجية
            IconButton(
              icon: const Icon(
                Icons.camera_alt_outlined,
                color: Color(0xFF3B82F6),
              ),
              onPressed: () {},
            ),
            IconButton(
              icon: const Icon(
                Icons.mic_none_outlined,
                color: Color(0xFF3B82F6),
              ),
              onPressed: () {},
            ),
          ],
        ),
      ),
    );
  }
}
