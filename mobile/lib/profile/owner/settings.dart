import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart'; // مستدعاة وجاهزة للاستخدام
import 'package:student_hub/login/Login.dart';
import 'package:student_hub/profile/owner/messages.dart';
import 'package:student_hub/profile/owner/owner_dashboard.dart';
import 'package:student_hub/profile/owner/owner_payments.dart';
import 'package:student_hub/profile/owner/owner_profile_page.dart';
import 'package:student_hub/profile/owner/properties/owner_properties.dart';

class OwnerSettingsScreen extends StatefulWidget {
  const OwnerSettingsScreen({super.key});

  @override
  State<OwnerSettingsScreen> createState() => _OwnerSettingsScreenState();
}

class _OwnerSettingsScreenState extends State<OwnerSettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  String? selectedDocType;

  // تعريف الـ ImagePicker ومستند الرفع الجديد
  final ImagePicker _picker = ImagePicker();
  XFile? selectedNewFile;

  // وحدات التحكم بالنصوص لتبويب الـ Profile
  final TextEditingController _firstNameController = TextEditingController(
    text: "Killian",
  );
  final TextEditingController _lastNameController = TextEditingController(
    text: "James",
  );
  final TextEditingController _emailController = TextEditingController(
    text: "killianjames@gmail.com",
  );
  final TextEditingController _phoneController = TextEditingController(
    text: "+201150690478",
  );
  final TextEditingController _locationController = TextEditingController(
    text: "Nasr City, Cairo",
  );
  final TextEditingController _responseTimeController = TextEditingController(
    text: "Usually responds within 1 hour",
  );
  final TextEditingController _aboutController = TextEditingController(
    text:
        "I have been hosting students for more than 5 years, offering well-managed properties designed specifically for student needs. My focus is on safety, comfort, and great communication.",
  );

  // داتا المستندات المرفوعة وحالتها من التصميم بالظبط
  final List<Map<String, dynamic>> uploadedDocs = [
    {
      "title": "Property Ownership Contract",
      "status": "Approved",
      "color": Colors.green,
    },
    {
      "title": "Commercial Registration",
      "status": "Rejected",
      "color": Colors.red,
    },
    {"title": "National ID", "status": "Pending", "color": Colors.orange},
  ];

  // دالة اختيار ملف للفورم الجديد أو لإعادة الرفع
  Future<XFile?> _pickDocument() async {
    try {
      final XFile? file = await _picker.pickImage(source: ImageSource.gallery);
      return file;
    } catch (e) {
      debugPrint("Error picking document: $e");
      return null;
    }
  }

  // ميزة زر الـ View: عرض تفاصيل المستند الحالي داخل Dialog تفاعلي ومحترف
  void _viewDocumentDetails(Map<String, dynamic> doc) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
          ),
          title: Row(
            children: [
              Icon(Icons.description, color: const Color(0xFF0D214F), size: 24),
              const SizedBox(width: 8),
              const Text(
                "Document Details",
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0D214F),
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                "Document Name:",
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                doc['title'],
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                "Verification Status:",
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey,
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 6),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  // الطريقة الأصح والأكثر أماناً:
                  color: (doc['color'] as Color).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      doc['status'] == 'Approved'
                          ? Icons.check_circle
                          : doc['status'] == 'Rejected'
                          ? Icons.cancel
                          : Icons.watch_later,
                      color: doc['color'],
                      size: 16,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      doc['status'],
                      style: TextStyle(
                        color: doc['color'],
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              Divider(color: Colors.grey.shade200),
              const SizedBox(height: 4),
              Text(
                doc['status'] == 'Approved'
                    ? "This document has been verified by our team. Your listing features are fully active."
                    : doc['status'] == 'Rejected'
                    ? "This document was rejected due to lack of clarity or expiration. Please re-upload a valid copy."
                    : "This document is currently under review. The verification process takes up to 48 hours.",
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey.shade600,
                  height: 1.4,
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text(
                "Close",
                style: TextStyle(
                  color: Color(0xFF1D4ED8),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _locationController.dispose();
    _responseTimeController.dispose();
    _aboutController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final GlobalKey<ScaffoldState> scaffoldKey = GlobalKey<ScaffoldState>();

    return DefaultTabController(
      length: 2,
      child: Scaffold(
        key: scaffoldKey,
        backgroundColor: const Color(0xFFF4F6F9),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0D214F),
          elevation: 0,
          title: const Text(
            "Settings",
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          leading: IconButton(
            icon: const Icon(Icons.menu, color: Colors.white),
            onPressed: () => scaffoldKey.currentState?.openDrawer(),
          ),
          actions: [
            TextButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Changes saved successfully!'),
                    backgroundColor: Colors.green,
                  ),
                );
              },
              child: const Text(
                "Save",
                style: TextStyle(
                  color: Colors.blueAccent,
                  fontWeight: FontWeight.bold,
                  fontSize: 15,
                ),
              ),
            ),
          ],
          bottom: const TabBar(
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white60,
            indicatorColor: Colors.blueAccent,
            tabs: [
              Tab(text: "Profile"),
              Tab(text: "Documents"),
            ],
          ),
        ),
        drawer: _buildDrawer(context),
        body: TabBarView(
          children: [
            // Tab 1: بيانات الحساب والبروفايل
            _buildProfileTab(),

            // Tab 2: المستندات والتوثيق التفاعلية بالكامل
            _buildDocumentsTab(),
          ],
        ),
      ),
    );
  }

  // --- تَبويب البروفايل ---
  Widget _buildProfileTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Stack(
            clipBehavior: Clip.none,
            alignment: Alignment.bottomCenter,
            children: [
              Container(
                height: 100,
                width: double.infinity,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [
                      Color(0xFFEC4899),
                      Color(0xFF3B82F6),
                      Color(0xFF06B6D4),
                    ],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              const Positioned(
                bottom: -35,
                child: CircleAvatar(
                  radius: 40,
                  backgroundColor: Colors.white,
                  child: CircleAvatar(
                    radius: 36,
                    backgroundColor: Colors.grey,
                    child: Icon(Icons.person, size: 40, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 45),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                "About Me",
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0D214F),
                ),
              ),
              TextButton(
                onPressed: () {},
                child: const Text(
                  "Password (Upload)",
                  style: TextStyle(fontSize: 12, color: Colors.blueAccent),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          TextFormField(
            controller: _aboutController,
            maxLines: 4,
            decoration: InputDecoration(
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.all(12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: BorderSide.none,
              ),
            ),
          ),
          const SizedBox(height: 16),
          _buildInputField(
            label: "First Name",
            controller: _firstNameController,
          ),
          const SizedBox(height: 12),
          _buildInputField(label: "Last Name", controller: _lastNameController),
          const SizedBox(height: 12),
          _buildInputField(
            label: "Email",
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 12),
          _buildInputField(
            label: "Phone Number",
            controller: _phoneController,
            keyboardType: TextInputType.phone,
          ),
          const SizedBox(height: 12),
          _buildInputField(label: "Location", controller: _locationController),
          const SizedBox(height: 12),
          _buildInputField(
            label: "Response Time",
            controller: _responseTimeController,
          ),
          const SizedBox(height: 30),
        ],
      ),
    );
  }

  // --- تَبويب المستندات ---
  Widget _buildDocumentsTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            "Documents",
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF0D214F),
            ),
          ),
          const SizedBox(height: 4),
          const Text(
            "Upload and manage documents required to verify your ownership and property listings.",
            style: TextStyle(fontSize: 11, color: Colors.grey),
          ),
          const SizedBox(height: 16),

          // سيكشن 1: المستندات المرفوعة وحالتها
          const Text(
            "Uploaded Documents",
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 8),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: uploadedDocs.length,
            itemBuilder: (context, index) {
              final doc = uploadedDocs[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12.0,
                    vertical: 10,
                  ),
                  child: Column(
                    children: [
                      Row(
                        children: [
                          const Icon(
                            Icons.description_outlined,
                            color: Colors.grey,
                            size: 24,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              doc['title'],
                              style: const TextStyle(
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF0D214F),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          // حالة التوثيق
                          Row(
                            children: [
                              Icon(
                                doc['status'] == 'Approved'
                                    ? Icons.check_circle_outline
                                    : doc['status'] == 'Rejected'
                                    ? Icons.cancel_outlined
                                    : Icons.error_outline,
                                color: doc['color'],
                                size: 16,
                              ),
                              const SizedBox(width: 4),
                              Text(
                                doc['status'],
                                style: TextStyle(
                                  color: doc['color'],
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                ),
                              ),
                            ],
                          ),
                          // أزرار التحكم التفاعلية للمستند
                          Row(
                            children: [
                              // تفعيل زرار الـ View لعرض تفاصيل الحالات والبيانات حركياً
                              TextButton(
                                onPressed: () => _viewDocumentDetails(doc),
                                style: TextButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 4,
                                  ),
                                  minimumSize: Size.zero,
                                  tapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                ),
                                child: const Text(
                                  "View",
                                  style: TextStyle(
                                    color: Colors.black87,
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 6),
                              // زرار الـ Re-upload لإعادة رفع وتحديث الحالة
                              ElevatedButton(
                                onPressed: () async {
                                  final file = await _pickDocument();
                                  if (file != null) {
                                    setState(() {
                                      uploadedDocs[index]['status'] = 'Pending';
                                      uploadedDocs[index]['color'] =
                                          Colors.orange;
                                    });
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text(
                                          "${doc['title']} re-uploaded successfully!",
                                        ),
                                        backgroundColor: Colors.orange,
                                      ),
                                    );
                                  }
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF1D4ED8),
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 12,
                                    vertical: 6,
                                  ),
                                  minimumSize: Size.zero,
                                  tapTargetSize:
                                      MaterialTapTargetSize.shrinkWrap,
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                ),
                                child: const Text(
                                  "Re-upload",
                                  style: TextStyle(
                                    color: Colors.white,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 20),

          // سيكشن 2: فورم رفع مستند جديد
          const Text(
            "Upload New Document",
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 10),
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(10),
            ),
            child: Padding(
              padding: const EdgeInsets.all(14.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.start,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  OutlinedButton(
                    onPressed: () async {
                      final file = await _pickDocument();
                      if (file != null) {
                        setState(() {
                          selectedNewFile = file;
                        });
                      }
                    },
                    style: OutlinedButton.styleFrom(
                      minimumSize: const Size(double.infinity, 44),
                      side: BorderSide(color: Colors.grey.shade400),
                      alignment: Alignment.centerLeft,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    child: Text(
                      selectedNewFile != null
                          ? selectedNewFile!.name
                          : "Choose File",
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.black54,
                        fontSize: 13,
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  DropdownButtonFormField<String>(
                    value: selectedDocType,
                    hint: const Text(
                      "Select document Type",
                      style: TextStyle(fontSize: 13, color: Colors.black54),
                    ),
                    items:
                        [
                              'Property Ownership Contract',
                              'Commercial Registration',
                              'National ID',
                            ]
                            .map(
                              (type) => DropdownMenuItem(
                                value: type,
                                child: Text(
                                  type,
                                  style: const TextStyle(fontSize: 13),
                                ),
                              ),
                            )
                            .toList(),
                    onChanged: (val) => setState(() => selectedDocType = val),
                    decoration: InputDecoration(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 10,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey.shade400),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey.shade400),
                      ),
                    ),
                  ),
                  const SizedBox(height: 14),
                  ElevatedButton(
                    onPressed: () {
                      if (selectedNewFile == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text("Please choose a file first!"),
                            backgroundColor: Colors.redAccent,
                          ),
                        );
                        return;
                      }
                      if (selectedDocType == null) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text("Please select a document type!"),
                            backgroundColor: Colors.redAccent,
                          ),
                        );
                        return;
                      }

                      setState(() {
                        uploadedDocs.add({
                          "title": selectedDocType!,
                          "status": "Pending",
                          "color": Colors.orange,
                        });
                        selectedNewFile = null;
                        selectedDocType = null;
                      });

                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text("Document uploaded successfully!"),
                          backgroundColor: Colors.green,
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1D4ED8),
                      minimumSize: const Size(100, 36),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    child: const Text(
                      "Upload",
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // سيكشن 3: شروط المستندات التنبيهية
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  "Document Requirements",
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0D214F),
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  "Make sure all uploaded documents are clear, valid, and in PDF or JPG format. Review takes 24–48 hours.",
                  style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[600],
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }

  // ويدجت المساعد لحقول البروفايل
  Widget _buildInputField({
    required String label,
    required TextEditingController controller,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.grey,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          style: const TextStyle(fontSize: 14),
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 12,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide.none,
            ),
          ),
        ),
      ],
    );
  }

  // الـ Drawer الموحد بدون تغيير
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
          _buildDrawerItem4(context, Icons.home_work, "My Properties"),
          _buildDrawerItem6(
            context,
            Icons.settings,
            "Settings",
            isActive: true,
          ),
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
      onTap: () {},
    );
  }
}
