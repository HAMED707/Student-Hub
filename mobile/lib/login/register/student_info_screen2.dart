import 'dart:io'; // مهمة جداً للتعامل مع ملفات الصور (File)
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:image_picker/image_picker.dart'; // استيراد مكتبة اختيار الصور
import 'package:student_hub/login/register/set_password/pass_screen.dart';

class StudentInfoScreen2 extends StatefulWidget {
  final String role;

  const StudentInfoScreen2({super.key, required this.role});

  @override
  StudentInfoScreen2State createState() => StudentInfoScreen2State();
}

class StudentInfoScreen2State extends State<StudentInfoScreen2> {
  // متغيرات الطالب
  String? selectedUniversity;
  String? selectedFaculty;
  String? selectedLevel;
  final departmentController = TextEditingController();

  // متغيرات الأونر (المالك)
  String? selectedPropertyType;
  final totalPropertiesController = TextEditingController();
  final officeAddressController = TextEditingController();

  // متغيرات حفظ الملفات الحقيقية المرفوعة من الاستوديو
  File? profileImage;
  File? nationalIdFront;
  File? nationalIdBack;

  final ImagePicker _picker = ImagePicker();

  // ميثود ذكية لفتح المعرض واختيار الصورة بناءً على النوع
  Future<void> _pickImage(String type) async {
    try {
      final XFile? pickedFile = await _picker.pickImage(
        source: ImageSource.gallery, // فتح معرض الصور
        imageQuality: 80, // ضغط جودة الصورة لتقليل حجمها عند الرفع للسيرفر
      );

      if (pickedFile != null) {
        setState(() {
          if (type == 'profile') {
            profileImage = File(pickedFile.path);
          } else if (type == 'id_front') {
            nationalIdFront = File(pickedFile.path);
          } else if (type == 'id_back') {
            nationalIdBack = File(pickedFile.path);
          }
        });
      }
    } catch (e) {
      print("Error picking image: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: const Color(0xFF0055D3),
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.role == "student"
              ? "Academic Information"
              : "Property Owner Info",
          style: const TextStyle(color: Colors.white),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Container(
              height: 120,
              width: double.infinity,
              decoration: const BoxDecoration(
                color: Color(0xFF0055D3),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(30),
                  bottomRight: Radius.circular(30),
                ),
              ),
              child: Center(
                child: Text(
                  widget.role == "student"
                      ? "Provide Academic Details"
                      : "Provide Rental Details",
                  style: const TextStyle(color: Colors.white70, fontSize: 14),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildProgressIndicator(),
                  const SizedBox(height: 30),

                  // 1️⃣ صورة الملف الشخصي (تفتح الاستوديو فوراً)
                  _buildSectionTitle("Profile Picture"),
                  _buildUploadButton(
                    hint: "Upload Profile Picture",
                    imageFile: profileImage,
                    icon: Icons.add_a_photo_outlined,
                    onTap: () => _pickImage('profile'),
                  ),
                  const SizedBox(height: 25),

                  // 2️⃣ الحقول الديناميكية
                  if (widget.role == "student") ...[
                    _buildSectionTitle("Academic Details"),
                    _buildDropdownField(
                      "Select University",
                      [
                        "Cairo University",
                        "Ain Shams University",
                        "Helwan University",
                      ],
                      selectedUniversity,
                      (val) {
                        setState(() => selectedUniversity = val);
                      },
                    ),
                    const SizedBox(height: 15),
                    _buildDropdownField(
                      "Select Faculty",
                      ["Computers & AI", "Engineering", "Medicine"],
                      selectedFaculty,
                      (val) {
                        setState(() => selectedFaculty = val);
                      },
                    ),
                    const SizedBox(height: 15),
                    _buildNormalTextField(
                      "Department (e.g. CS, IS)",
                      departmentController,
                      Icons.account_tree_outlined,
                    ),
                    const SizedBox(height: 15),
                    _buildDropdownField(
                      "Select Academic Level",
                      ["Level 1", "Level 2", "Level 3", "Level 4"],
                      selectedLevel,
                      (val) {
                        setState(() => selectedLevel = val);
                      },
                    ),
                  ] else ...[
                    _buildSectionTitle("Property Details"),
                    _buildDropdownField(
                      "Primary Property Type",
                      ["Apartments", "Studio Rooms", "Shared Suites"],
                      selectedPropertyType,
                      (val) {
                        setState(() => selectedPropertyType = val);
                      },
                    ),
                    const SizedBox(height: 15),
                    _buildNumericTextField(
                      "Number of Listed Properties",
                      totalPropertiesController,
                      Icons.home_work_outlined,
                    ),
                    const SizedBox(height: 15),
                    _buildNormalTextField(
                      "Office / Business Address",
                      officeAddressController,
                      Icons.location_city_outlined,
                    ),
                  ],

                  const SizedBox(height: 25),

                  // 3️⃣ رفع صور البطاقة (وجه وظهر) من الاستوديو
                  _buildSectionTitle("National ID Verification"),
                  Row(
                    children: [
                      Expanded(
                        child: _buildUploadButton(
                          hint: "ID Card (Front)",
                          imageFile: nationalIdFront,
                          icon: Icons.credit_card_outlined,
                          onTap: () => _pickImage('id_front'),
                        ),
                      ),
                      const SizedBox(width: 15),
                      Expanded(
                        child: _buildUploadButton(
                          hint: "ID Card (Back)",
                          imageFile: nationalIdBack,
                          icon: Icons.credit_card_outlined,
                          onTap: () => _pickImage('id_back'),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 40),

                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0055D3),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (context) => PassScreen()),
                        );
                      },
                      child: const Text(
                        "Next",
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- زر الرفع الذكي: بيعرض الصورة الحقيقية مصغرة لو المستخدم اختارها ---
  Widget _buildUploadButton({
    required String hint,
    required File? imageFile,
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 55,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          border: Border.all(
            color: imageFile != null
                ? const Color(0xFF0055D3)
                : Colors.grey[300]!,
            width: imageFile != null ? 1.5 : 1,
          ),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            // لو تم اختيار صورة، بنعرضها هي بشكل مصغر داخل كارت الرفع
            imageFile != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: Image.file(
                      imageFile,
                      width: 35,
                      height: 35,
                      fit: BoxFit.cover,
                    ),
                  )
                : Icon(icon, color: const Color(0xFF0055D3)),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                imageFile != null ? "Image Selected Successfully" : hint,
                style: TextStyle(
                  fontSize: 13,
                  color: imageFile != null
                      ? Colors.green[700]
                      : Colors.grey[600],
                  fontWeight: imageFile != null
                      ? FontWeight.bold
                      : FontWeight.normal,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
            Icon(
              imageFile != null
                  ? Icons.check_circle
                  : Icons.file_upload_outlined,
              size: 20,
              color: imageFile != null ? Colors.green : Colors.grey,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10.0, top: 5.0),
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Color(0xFF0D214F),
        ),
      ),
    );
  }

  Widget _buildNumericTextField(
    String hint,
    TextEditingController controller,
    IconData icon,
  ) {
    return TextField(
      controller: controller,
      keyboardType: TextInputType.number,
      inputFormatters: [FilteringTextInputFormatter.digitsOnly],
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: const Color(0xFF0055D3)),
        hintText: hint,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
      ),
    );
  }

  Widget _buildNormalTextField(
    String hint,
    TextEditingController controller,
    IconData icon,
  ) {
    return TextField(
      controller: controller,
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: const Color(0xFF0055D3)),
        hintText: hint,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
      ),
    );
  }

  Widget _buildDropdownField(
    String hint,
    List<String> items,
    String? value,
    Function(String?) onChanged,
  ) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 15),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(10),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          isExpanded: true,
          hint: Text(hint),
          value: value,
          items: items
              .map((e) => DropdownMenuItem(value: e, child: Text(e)))
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildProgressIndicator() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _stepCircle(true, Icons.check),
        _stepLine(true),
        _stepCircle(true, null, label: "2"),
        _stepLine(false),
        _stepCircle(false, null, label: "3"),
      ],
    );
  }

  Widget _stepCircle(bool isDone, IconData? icon, {String? label}) {
    return CircleAvatar(
      radius: 12,
      backgroundColor: isDone ? const Color(0xFF0055D3) : Colors.grey[300],
      child: icon != null
          ? Icon(icon, size: 14, color: Colors.white)
          : Text(
              label ?? "",
              style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
    );
  }

  Widget _stepLine(bool isActive) => Container(
    width: 50,
    height: 2,
    color: isActive ? const Color(0xFF0055D3) : Colors.grey[300],
  );
}
