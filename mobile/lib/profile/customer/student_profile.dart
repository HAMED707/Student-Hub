import 'package:flutter/material.dart';

class StudentProfileScreen extends StatefulWidget {
  const StudentProfileScreen({super.key});

  @override
  State<StudentProfileScreen> createState() => _StudentProfileScreenState();
}

class _StudentProfileScreenState extends State<StudentProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // --- المتغيرات وقيمها الابتدائية (البيانات الحالية للطالب) ---
  String firstName = "Mathew";
  String lastName = "Perry";
  String email = "mathew.perry@studenthub.com";
  String phone = "+20 115 069 0478";
  String gender = "Male";
  String governorate = "Cairo";
  String city = "Nasr City";

  String selectedUniversity = "Cairo University";
  String selectedFaculty = "Computers & Artificial Intelligence";
  String selectedLevel = "Level 4 (Senior)";

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  // --- دالة فتح قائمة تعديل البيانات من الأسفل (Edit Bottom Sheet) ---
  void _showEditBottomSheet() {
    // تعريف الـ Controllers وتعبئتها بالقيم الحالية
    final fNameCtrl = TextEditingController(text: firstName);
    final lNameCtrl = TextEditingController(text: lastName);
    final emailCtrl = TextEditingController(text: email);
    final phoneCtrl = TextEditingController(text: phone);
    final cityCtrl = TextEditingController(text: city);

    String? tempGov = governorate;
    String? tempUniv = selectedUniversity;
    String? tempFaculty = selectedFaculty;
    String? tempLevel = selectedLevel;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true, // عشان يفتح بمساحة مناسبة للكيبورد
      backgroundColor: Colors.transparent,
      builder: (context) {
        return StatefulBuilder(
          // عشان التحديث جوه الـ Dropdowns يشتغل فوراً أثناء الكتابة
          builder: (BuildContext context, StateSetter setModalState) {
            return Container(
              decoration: const BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.only(
                  topLeft: Radius.circular(24),
                  topRight: Radius.circular(24),
                ),
              ),
              padding: EdgeInsets.only(
                top: 20,
                left: 20,
                right: 20,
                bottom:
                    MediaQuery.of(context).viewInsets.bottom +
                    20, // حماية من كيبورد الموبايل
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // شريط سحب القائمة العلوي
                    Center(
                      child: Container(
                        width: 50,
                        height: 5,
                        decoration: BoxDecoration(
                          color: Colors.grey[300],
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    const Text(
                      "Update Profile Info",
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0D214F),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // الحقول النصية للبيانات الأساسية
                    Row(
                      children: [
                        Expanded(
                          child: _buildInputField(
                            "First Name",
                            fNameCtrl,
                            Icons.person_outline,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildInputField(
                            "Last Name",
                            lNameCtrl,
                            Icons.person_outline,
                          ),
                        ),
                      ],
                    ),
                    _buildInputField(
                      "Email Address",
                      emailCtrl,
                      Icons.email_outlined,
                    ),
                    _buildInputField(
                      "Phone Number",
                      phoneCtrl,
                      Icons.phone_android_outlined,
                    ),
                    _buildInputField(
                      "City / Region",
                      cityCtrl,
                      Icons.location_city_outlined,
                    ),

                    const SizedBox(height: 10),
                    const Text(
                      "Academic & Location Dropdowns",
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: Colors.grey,
                      ),
                    ),
                    const SizedBox(height: 10),

                    // الـ Dropdowns المتصلة والمحدثة مع الـ Modal State
                    _buildModalDropdown(
                      "Governorate",
                      ["Cairo", "Giza", "Alexandria"],
                      tempGov,
                      (val) => setModalState(() => tempGov = val),
                    ),
                    _buildModalDropdown(
                      "University",
                      [
                        "Cairo University",
                        "Ain Shams University",
                        "Helwan University",
                      ],
                      tempUniv,
                      (val) => setModalState(() => tempUniv = val),
                    ),
                    _buildModalDropdown(
                      "Faculty",
                      [
                        "Computers & Artificial Intelligence",
                        "Engineering",
                        "Science",
                      ],
                      tempFaculty,
                      (val) => setModalState(() => tempFaculty = val),
                    ),
                    _buildModalDropdown(
                      "Academic Level",
                      ["Level 1", "Level 2", "Level 3", "Level 4 (Senior)"],
                      tempLevel,
                      (val) => setModalState(() => tempLevel = val),
                    ),

                    const SizedBox(height: 25),

                    // زر حفظ التعديلات وحفظها في الـ Screen الأساسية
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0055D3),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          elevation: 0,
                        ),
                        onPressed: () {
                          // تحديث الحالة في الشاشة الأساسية (UI) بالقيم الجديدة
                          setState(() {
                            firstName = fNameCtrl.text;
                            lastName = lNameCtrl.text;
                            email = emailCtrl.text;
                            phone = phoneCtrl.text;
                            city = cityCtrl.text;
                            governorate = tempGov!;
                            selectedUniversity = tempUniv!;
                            selectedFaculty = tempFaculty!;
                            selectedLevel = tempLevel!;
                          });
                          Navigator.pop(context); // إغلاق القائمة
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text("Profile updated successfully!"),
                              backgroundColor: Color(0xFF10B981),
                            ),
                          );
                        },
                        child: const Text(
                          "Save Changes",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: NestedScrollView(
        headerSliverBuilder: (BuildContext context, bool innerBoxIsScrolled) {
          return <Widget>[
            SliverAppBar(
              expandedHeight: 280.0,
              floating: false,
              pinned: true,
              elevation: 0,
              backgroundColor: const Color(0xFF0D214F),
              leading: IconButton(
                icon: const Icon(
                  Icons.arrow_back_ios_new,
                  color: Colors.white,
                  size: 20,
                ),
                onPressed: () => Navigator.pop(context),
              ),
              actions: [
                IconButton(
                  icon: const Icon(
                    Icons.edit_note_rounded,
                    color: Colors.white,
                    size: 28,
                  ),
                  onPressed:
                      _showEditBottomSheet, // تفعيل الزرار ليفتح قائمة التعديل المباشر
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                collapseMode: CollapseMode.pin,
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [Color(0xFF0D214F), Color(0xFF0055D3)],
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 50),
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withOpacity(0.2),
                            width: 6,
                          ),
                        ),
                        child: CircleAvatar(
                          radius: 45,
                          backgroundColor: Colors.white,
                          child: CircleAvatar(
                            radius: 42,
                            backgroundColor: const Color(0xFF0055D3),
                            child: Text(
                              firstName.isNotEmpty && lastName.isNotEmpty
                                  ? "${firstName[0]}${lastName[0]}"
                                  : "MP",
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 26,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        "$firstName $lastName",
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        email,
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.7),
                          fontSize: 13,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            SliverPersistentHeader(
              pinned: true,
              delegate: _SliverAppBarDelegate(
                TabBar(
                  controller: _tabController,
                  labelColor: const Color(0xFF0055D3),
                  unselectedLabelColor: Colors.grey[500],
                  indicatorColor: const Color(0xFF0055D3),
                  indicatorSize: TabBarIndicatorSize.label,
                  indicatorWeight: 3,
                  labelStyle: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                  ),
                  tabs: const [
                    Tab(text: "Account & ID"),
                    Tab(text: "Academic & Life"),
                    Tab(text: "Reviews"),
                  ],
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildAccountAndIdentityTab(),
            _buildAcademicAndLifestyleTab(),
            _buildNewReviewsTab(),
          ],
        ),
      ),
    );
  }

  Widget _buildAccountAndIdentityTab() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _buildModernCard(
          title: "Personal & Contact Details",
          icon: Icons.person_outline_rounded,
          child: Column(
            children: [
              _buildModernRow("First Name", firstName),
              _buildModernRow("Last Name", lastName),
              _buildModernRow("Email Address", email),
              _buildModernRow("Phone Number", phone),
              _buildModernRow("Gender", gender),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _buildModernCard(
          title: "Address & Security Status",
          icon: Icons.gpp_good_outlined,
          child: Column(
            children: [
              _buildModernRow("Governorate", governorate),
              _buildModernRow("City / Region", city),
              const Divider(height: 24, thickness: 0.5),
              _buildVerificationBadge("National ID Verification", true),
              _buildVerificationBadge("Student ID ID Status", true),
              _buildVerificationBadge("Active Phone Verified", true),
              const Divider(height: 24, thickness: 0.5),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    "Account Trust Score",
                    style: TextStyle(
                      color: Colors.black54,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFF10B981).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text(
                      "98%",
                      style: TextStyle(
                        color: Color(0xFF10B981),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildAcademicAndLifestyleTab() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        _buildModernCard(
          title: "Academic Information",
          icon: Icons.school_outlined,
          child: Column(
            children: [
              _buildModernRow("University", selectedUniversity),
              _buildModernRow("Faculty", selectedFaculty),
              _buildModernRow("Academic Level", selectedLevel),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _buildModernCard(
          title: "Living Habits & Routines",
          icon: Icons.wb_sunny_outlined,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Student lifestyle profile traits:",
                style: TextStyle(color: Colors.grey, fontSize: 13),
              ),
              const SizedBox(height: 15),
              Wrap(
                spacing: 10,
                runSpacing: 10,
                children: [
                  _buildCustomChip(
                    Icons.cleaning_services_outlined,
                    "Highly Organized",
                    Colors.blue,
                  ),
                  _buildCustomChip(
                    Icons.smoke_free_rounded,
                    "Non-Smoker",
                    Colors.green,
                  ),
                  _buildCustomChip(
                    Icons.dark_mode_outlined,
                    "Night Owl (2AM - 10AM)",
                    Colors.indigo,
                  ),
                  _buildCustomChip(
                    Icons.music_note_outlined,
                    "Lo-Fi Music Lover",
                    Colors.purple,
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        _buildModernCard(
          title: "Housing Preference & Budget",
          icon: Icons.home_work_outlined,
          child: Column(
            children: [
              _buildModernRow("Preferred Room", "Single Room (Private)"),
              _buildModernRow(
                "Social Profile",
                "Introvert / Quiet Environment",
              ),
              const SizedBox(height: 10),
              Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: const Color(0xFF0055D3).withOpacity(0.05),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.wallet_rounded, color: Color(0xFF0055D3)),
                    const SizedBox(width: 15),
                    const Text(
                      "Max Monthly Budget",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF0D214F),
                      ),
                    ),
                    const Spacer(),
                    Text(
                      "6,000 EGP",
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF0055D3).withOpacity(0.9),
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildNewReviewsTab() {
    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        Row(
          children: [
            const Text(
              "Community Feedback",
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0D214F),
              ),
            ),
            const Spacer(),
            Icon(Icons.star_rounded, color: Colors.amber[600], size: 20),
            const SizedBox(width: 4),
            const Text(
              "4.95 (2 reviews)",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
            ),
          ],
        ),
        const SizedBox(height: 20),
        _buildNewReviewCard(
          "Kim Jhone",
          "Landlord",
          "Mathew is incredibly reliable. As a landlord, I never had to worry about rent or noise. Highly recommended for any quiet housing setup.",
          "5.0",
        ),
        const SizedBox(height: 16),
        _buildNewReviewCard(
          "Ahmed Ali",
          "Roommate",
          "A great roommate who really respects study time and private boundaries. We shared a unit for a year and it was an excellent environment.",
          "4.9",
        ),
      ],
    );
  }

  // --- عناصر الديزاين المساعدة وجداول البيانات المحدثة (UI Helpers) ---

  Widget _buildInputField(
    String hint,
    TextEditingController controller,
    IconData icon,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        style: const TextStyle(fontSize: 14, color: Color(0xFF0D214F)),
        decoration: InputDecoration(
          prefixIcon: Icon(icon, color: Colors.grey, size: 20),
          hintText: hint,
          labelText: hint,
          labelStyle: const TextStyle(color: Colors.grey, fontSize: 12),
          contentPadding: const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 12,
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: BorderSide(color: Colors.grey[300]!),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(10),
            borderSide: const BorderSide(color: Color(0xFF0055D3)),
          ),
        ),
      ),
    );
  }

  Widget _buildModalDropdown(
    String hint,
    List<String> items,
    String? currentValue,
    Function(String?) onChanged,
  ) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(10),
        ),
        child: DropdownButtonHideUnderline(
          child: DropdownButton<String>(
            isExpanded: true,
            hint: Text(hint, style: const TextStyle(fontSize: 14)),
            value: currentValue,
            items: items
                .map(
                  (e) => DropdownMenuItem(
                    value: e,
                    child: Text(e, style: const TextStyle(fontSize: 14)),
                  ),
                )
                .toList(),
            onChanged: onChanged,
          ),
        ),
      ),
    );
  }

  Widget _buildModernCard({
    required String title,
    required IconData icon,
    required Widget child,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0D214F).withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: const Color(0xFF0D214F), size: 22),
              const SizedBox(width: 10),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0D214F),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          child,
        ],
      ),
    );
  }

  Widget _buildModernRow(
    String label,
    String value, {
    bool isPassword = false,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(
              color: Colors.black45,
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: TextStyle(
                color: const Color(0xFF0D214F),
                fontWeight: isPassword ? FontWeight.normal : FontWeight.w600,
                fontSize: isPassword ? 18 : 14,
                letterSpacing: isPassword ? 2 : 0,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationBadge(String label, bool verified) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(Icons.check_circle_rounded, color: Colors.green[400], size: 18),
          const SizedBox(width: 12),
          Text(
            label,
            style: const TextStyle(color: Colors.black87, fontSize: 14),
          ),
          const Spacer(),
          const Text(
            "Verified",
            style: TextStyle(
              color: Colors.grey,
              fontSize: 13,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCustomChip(IconData icon, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withOpacity(0.06),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: color.withOpacity(0.15)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            text,
            style: TextStyle(
              color: color,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNewReviewCard(
    String name,
    String role,
    String text,
    String rating,
  ) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
      ),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: const Color(0xFF0055D3).withOpacity(0.1),
                child: Text(
                  name[0],
                  style: const TextStyle(
                    color: Color(0xFF0055D3),
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                      color: Color(0xFF0D214F),
                    ),
                  ),
                  Text(
                    role,
                    style: const TextStyle(color: Colors.grey, fontSize: 11),
                  ),
                ],
              ),
              const Spacer(),
              Icon(Icons.star_rounded, color: Colors.amber[600], size: 16),
              const SizedBox(width: 2),
              Text(
                rating,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            "\"$text\"",
            style: TextStyle(
              color: Colors.grey[700],
              fontStyle: FontStyle.italic,
              height: 1.5,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  _SliverAppBarDelegate(this._tabBar);

  final TabBar _tabBar;

  @override
  double get minExtent => _tabBar.preferredSize.height;
  @override
  double get maxExtent => _tabBar.preferredSize.height;

  @override
  Widget build(
    BuildContext context,
    double shrinkOffset,
    bool overlapsContent,
  ) {
    return Container(color: Colors.white, child: _tabBar);
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
