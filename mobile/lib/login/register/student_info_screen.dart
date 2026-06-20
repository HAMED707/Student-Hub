import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:student_hub/login/register/student_info_screen2.dart';

class StudentInfoScreen extends StatefulWidget {
  final String
  role; // "student" أو "owner" اللي جايين من صفحة الـ Role Selection

  StudentInfoScreen({super.key, required this.role});
  String? selectedGovernorate;
  String? selectedCity;
  String? selectedGender;

  @override
  State<StudentInfoScreen> createState() => _StudentInfoScreenState();
}

class _StudentInfoScreenState extends State<StudentInfoScreen> {
  String? selectedGovernorate;
  String? selectedCity;
  String? selectedGender;

  // الـ Controllers الحالية بتاعتك زي ما هي بدون تغيير
  final firstNameController = TextEditingController();
  final lastNameController = TextEditingController();
  final phoneController = TextEditingController();
  final dobController = TextEditingController();
  final nationalIdController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Header Image Section (نفس الديزاين بتاعك بالظبط)
            Container(
              height: 200,
              width: double.infinity,
              color: const Color(0xFF0055D3),
              child: Stack(
                children: [
                  Positioned(
                    top: 40,
                    left: 10,
                    child: IconButton(
                      icon: const Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                  Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          widget.role == "student"
                              ? "Create Student Account"
                              : "Create Owner Account",
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          "Step 1 of 3: Basic Info",
                          style: TextStyle(color: Colors.white70, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                children: [
                  _buildStepIndicator(1),
                  const SizedBox(height: 30),

                  // الحقول الحالية بتاعتك
                  _buildTextField(
                    "First Name",
                    firstNameController,
                    Icons.person,
                  ),
                  const SizedBox(height: 15),
                  _buildTextField(
                    "Last Name",
                    lastNameController,
                    Icons.person,
                  ),
                  const SizedBox(height: 15),

                  _buildDropdown("Gender", ["Male", "Female"], selectedGender, (
                    val,
                  ) {
                    setState(() => selectedGender = val);
                  }),
                  const SizedBox(height: 15),

                  _buildTextField2(
                    "Phone Number",
                    phoneController,
                    Icons.phone,
                  ),
                  const SizedBox(height: 15),
                  _buildTextField2(
                    "Date of Birth",
                    dobController,
                    Icons.calendar_today,
                  ),
                  const SizedBox(height: 15),
                  _buildTextField2(
                    "National ID",
                    nationalIdController,
                    Icons.credit_card,
                  ),
                  const SizedBox(height: 15),

                  _buildDropdown(
                    "Governorate",
                    ["Cairo", "Giza", "Alexandria"],
                    selectedGovernorate,
                    (val) {
                      setState(() => selectedGovernorate = val);
                    },
                  ),
                  const SizedBox(height: 15),

                  _buildDropdown(
                    "City",
                    ["Nasr City", "Dokki", "6th of October"],
                    selectedCity,
                    (val) {
                      setState(() => selectedCity = val);
                    },
                  ),
                  const SizedBox(height: 30),

                  // زرار الانتقال للخطوة الثانية مع تمرير الـ Role
                  SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0055D3),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => StudentInfoScreen2(
                              role: widget.role,
                            ), // تمرير الـ role هنا
                          ),
                        );
                      },
                      child: const Text(
                        "Next Step",
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

  // الميثودز المساعدة الخاصة بك (Dropdown & TextField) تظل كما هي بالأسفل...
  Widget _buildTextField(
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

  Widget _buildTextField2(
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

  Widget _buildDropdown(
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
          hint: Text(hint, style: const TextStyle(fontSize: 14)),
          isExpanded: true,
          value: value,
          items: items
              .map((e) => DropdownMenuItem(value: e, child: Text(e)))
              .toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildStepIndicator(int currentStep) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _circleStep(true, "Basic Info"),
        _lineStep(),
        _circleStep(false, "Academic"),
        _lineStep(),
        _circleStep(false, "Password"),
      ],
    );
  }

  Widget _circleStep(bool isActive, String label) => Column(
    children: [
      CircleAvatar(
        radius: 8,
        backgroundColor: isActive ? const Color(0xFF0055D3) : Colors.grey[300],
      ),
      const SizedBox(height: 4),
      Text(
        label,
        style: TextStyle(
          fontSize: 10,
          color: isActive ? const Color(0xFF0055D3) : Colors.grey,
        ),
      ),
    ],
  );

  Widget _lineStep() =>
      Container(width: 40, height: 2, color: Colors.grey[300]);
}
