import 'package:flutter/material.dart';
import 'package:student_hub/homepage/extrapages/carddetails.dart';
import 'package:student_hub/login/Login.dart';
import 'package:student_hub/profile/owner/messages.dart';
import 'package:student_hub/profile/owner/owner_dashboard.dart';
import 'package:student_hub/profile/owner/owner_payments.dart';
import 'package:student_hub/profile/owner/properties/owner_properties.dart';
import 'package:student_hub/profile/owner/settings.dart';

class OwnerProfileScreen extends StatelessWidget {
  const OwnerProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    // تعريف الـ GlobalKey لفتح الـ Drawer من زرار الـ AppBar
    final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();

    return Scaffold(
      key: scaffoldKey,
      backgroundColor: const Color(0xFFF4F6F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D214F),
        elevation: 0,
        title: const Text(
          "StudentHub Owner",
          style: TextStyle(color: Colors.white, fontSize: 16),
        ),
        // تشغيل زرار المنيو الجانبية (من الشمال)
        leading: IconButton(
          icon: const Icon(Icons.menu, color: Colors.white),
          onPressed: () {
            scaffoldKey.currentState?.openDrawer();
          },
        ),
      ),
      // إضافة الـ Drawer (المنيو الجانبية اللي بتفتح من الشمال)
      drawer: _buildDrawer(context),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // 1. الصورة الخلفية الملونة والبروفايل (الاسم واللوجو مظبوطين تماماً)
            _buildProfileHeader(),

            const SizedBox(
              height: 70,
            ), // مساحة عشان الكروت متدخلش في الاسم تحت البروفايل

            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // إحصائيات الأونر (Owner Statistics)
                  _buildSectionTitle("Owner Statistics"),
                  _buildStatisticsCard(),
                  const SizedBox(height: 16),

                  // بيانات الاتصال (Contact Information)
                  _buildSectionTitle("Contact Information"),
                  _buildContactCard(),
                  const SizedBox(height: 16),

                  // الشقق المرفوعة (Properties)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      _buildSectionTitle("Properties"),
                      const Text(
                        "4 listings",
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  _buildPropertiesGrid(context),
                  const SizedBox(height: 16),

                  // آراء الطلاب (Student Reviews)
                  _buildSectionTitle("Student Reviews (34 total)"),
                  _buildReviewsSlider(),
                  const SizedBox(height: 16),

                  // التوثيق والشارة (Verification & Badge)
                  _buildVerificationCard(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // دالة مساعدة لعنوان كل سيكشن
  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 16,
          fontWeight: FontWeight.bold,
          color: Color(0xFF0D214F),
        ),
      ),
    );
  }

  // 1. هيدر البروفايل والألوان (الاسم واللوجو تحت الـ Cover ومظبوطين)
  Widget _buildProfileHeader() {
    return Stack(
      clipBehavior: Clip.none,
      alignment: Alignment.bottomCenter,
      children: [
        Container(
          height: 140,
          width: double.infinity,
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.pinkAccent, Colors.blueAccent, Colors.cyan],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
        ),
        Positioned(
          bottom: -60, // متموضع بره الكفر ونازل على الخلفية الفاتحة بشكل شيك
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  color: Colors.white,
                  shape: BoxShape.circle,
                ),
                child: const CircleAvatar(
                  radius: 40,
                  backgroundColor: Colors.grey,
                  child: Icon(Icons.person, size: 50, color: Colors.white),
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                "Mathew Perry",
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0D214F),
                ),
              ),
              const Text(
                "mathewperry@xyz.com",
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // 2. تصميم المنيو الجانبية (Drawer) باللون الأزرق الداكن واللوجو والأزرار
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
          _buildDrawerItem5(context, Icons.person, "Profile", isActive: true),
          _buildDrawerItem(context, Icons.dashboard, "Dashboard"),
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
          MaterialPageRoute<void>(
            builder: (context) => const OwnerPaymentsScreen(),
          ),
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
      onTap: () {},
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

  // كارت الإحصائيات
  Widget _buildStatisticsCard() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          childAspectRatio: 2.5,
          children: [
            _buildStatItem("Avg. Rating", "⭐ 2.5"),
            _buildStatItem("Properties", "8"),
            _buildStatItem("Available Rooms", "7"),
            _buildStatItem("Reviews", "34"),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
        Text(
          value,
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
        ),
      ],
    );
  }

  // كارت بيانات الاتصال
  Widget _buildContactCard() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: const Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            ListTile(
              leading: Icon(Icons.email_outlined, color: Colors.blue),
              title: Text(
                "Email",
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              subtitle: Text(
                "mathewjamess@gmail.com",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
            ),
            Divider(),
            ListTile(
              leading: Icon(Icons.phone_outlined, color: Colors.blue),
              title: Text(
                "Phone Number",
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              subtitle: Text(
                "+20150550475",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
            ),
            Divider(),
            ListTile(
              leading: Icon(Icons.location_on_outlined, color: Colors.blue),
              title: Text(
                "Location",
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              subtitle: Text(
                "Nasr City, Cairo",
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.black,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // شبكة عرض الشقق المرفوعة (زرار الـ View هنا مربوط وجاهز، هتحط اسم صفحتك جواه بس)
  Widget _buildPropertiesGrid(BuildContext context) {
    const String itemTitle = "Furnished Apartment - El Hamra";
    const String itemPrice = "EGP 3500";

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: 2,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.75,
      ),
      itemBuilder: (context, index) {
        return Card(
          clipBehavior: Clip.antiAlias,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Stack(
                children: [
                  Container(
                    height: 100,
                    color: Colors.grey[300],
                    child: const Center(
                      child: Icon(Icons.vaccines_outlined, color: Colors.grey),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 6,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.green,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text(
                        "Available",
                        style: TextStyle(color: Colors.white, fontSize: 10),
                      ),
                    ),
                  ),
                ],
              ),
              Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      itemTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    const Text(
                      "Cairo - El Hamra",
                      style: TextStyle(color: Colors.grey, fontSize: 10),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      "Price: $itemPrice",
                      style: TextStyle(
                        color: Colors.blue,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        // 3. زرار الـ View جاهز بالـ Navigator، هتشيل بس كلمة CardDetailsScreen وتحط اسم صفحتك الحقيقية
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () {
                              _showPropertyDetailsModal(context);
                            },
                            style: OutlinedButton.styleFrom(
                              padding: EdgeInsets.zero,
                              minimumSize: const Size(0, 28),
                            ),
                            child: const Text(
                              "View",
                              style: TextStyle(fontSize: 11),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // آراء الطلاب (Slider)
  Widget _buildReviewsSlider() {
    return SizedBox(
      height: 130,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: 2,
        itemBuilder: (context, index) {
          return Container(
            width: 260,
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: const Color(0xFF3B82F6),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  "Lorem ipsum is simply dummy text of the printing and typesetting industry.",
                  maxLines: 3,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
                Row(
                  children: [
                    CircleAvatar(
                      radius: 12,
                      backgroundColor: Colors.white,
                      child: Icon(Icons.person, size: 14),
                    ),
                    SizedBox(width: 8),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          "Kim Jhone",
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                        Text(
                          "Cairo University",
                          style: TextStyle(color: Colors.white70, fontSize: 9),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  // كارت التوثيق
  Widget _buildVerificationCard() {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  "Verification Status",
                  style: TextStyle(fontWeight: FontWeight.bold),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 4,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.green[100],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text(
                    "Trusted Owner",
                    style: TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            _buildVerificationRow("Identity:", "Verified"),
            const Divider(),
            _buildVerificationRow("Ownership:", "Verified"),
          ],
        ),
      ),
    );
  }

  Widget _buildVerificationRow(String label, String status) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(color: Colors.grey)),
        Text(
          status,
          style: const TextStyle(
            color: Colors.green,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  void _showPropertyDetailsModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true, // عشان لو البيانات كتير تاخد مساحتها بارتياح
      backgroundColor: Colors.transparent, // عشان نعمل حواف دائرية مخصصة
      builder: (context) {
        return Container(
          height:
              MediaQuery.of(context).size.height *
              0.75, // أقصى ارتفاع 75% من الشاشة
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(28),
              topRight: Radius.circular(28),
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // الشريط الرمادي الصغير فوق للتمرير والـ UX (Indicator)
              const SizedBox(height: 12),
              Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 20),

              // هيدر القائمة
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      "Property Details",
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0D214F),
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.close_rounded, color: Colors.grey[600]),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(),

              // قايمة البيانات القابلة للتمرير
              Expanded(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // حالة الإيجار أو التوثيق
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: const Color(0xFF0055D3).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              "Active Listing",
                              style: TextStyle(
                                color: Color(0xFF0055D3),
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.green[50],
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              "Verified",
                              style: TextStyle(
                                color: Colors.green,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),

                      // تفاصيل البيانات في سطور منسقة
                      _buildModalDetailRow(
                        Icons.home_outlined,
                        "Property Name",
                        "Elite Student Housing A-1",
                      ),
                      _buildModalDetailRow(
                        Icons.location_on_outlined,
                        "Location",
                        "5th Settlement, New Cairo, Egypt",
                      ),
                      _buildModalDetailRow(
                        Icons.king_bed_outlined,
                        "Room Type",
                        "Single Room (Private Bathroom)",
                      ),
                      _buildModalDetailRow(
                        Icons.attach_money_rounded,
                        "Monthly Rent",
                        "6,500 EGP / Month",
                      ),
                      _buildModalDetailRow(
                        Icons.group_outlined,
                        "Current Tenants",
                        "3 Students",
                      ),
                      _buildModalDetailRow(
                        Icons.flash_on_outlined,
                        "Services Included",
                        "WiFi, Electricity, Water",
                      ),

                      const SizedBox(height: 15),
                      const Text(
                        "Description",
                        style: TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0D214F),
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Fully furnished premium room close to the university campus. Clean environment with 24/7 security, study desk, and central AC.",
                        style: TextStyle(
                          color: Colors.grey[650],
                          fontSize: 13,
                          height: 1.4,
                        ),
                      ),
                      const SizedBox(height: 30),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  } // ويدجت مساعدة لبناء سطور البيانات بشكل شيك ومنظم داخل القائمة

  Widget _buildModalDetailRow(IconData icon, String title, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 18.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, size: 20, color: const Color(0xFF0D214F)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: TextStyle(fontSize: 12, color: Colors.grey[500]),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0D214F),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
