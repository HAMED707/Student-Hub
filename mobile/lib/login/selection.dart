import 'package:flutter/material.dart';
import 'package:student_hub/login/register/student_info_screen.dart'; // تأكد من المسار عندك

class RoleSelectionScreen extends StatefulWidget {
  const RoleSelectionScreen({super.key});

  @override
  State<RoleSelectionScreen> createState() => _RoleSelectionScreenState();
}

class _RoleSelectionScreenState extends State<RoleSelectionScreen> {
  // متغير لحفظ الدور اللي المستخدم ضغط عليه حالياً ("student" أو "owner" أو null لو مأختارش حاجة)
  String? selectedRole;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(
        0xFFF8FAFC,
      ), // خلفية رمادي فاتح جداً ومودرن عشان تبرز الكروت
      body: Column(
        children: [
          // 1️⃣ الجزء العلوي: هيدر مموج وتصميم ترحيبي جذاب
          ClipPath(
            clipper: HeaderClipper(),
            child: Container(
              width: double.infinity,
              height: MediaQuery.of(context).size.height * 0.32,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                  colors: [Color(0xFF0D214F), Color(0xFF0055D3)],
                ),
              ),
              child: SafeArea(
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20.0,
                    vertical: 10,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // زر الرجوع بتصميم دائري شفاف وشيك
                      CircleAvatar(
                        backgroundColor: Colors.white.withOpacity(0.15),
                        child: IconButton(
                          icon: const Icon(
                            Icons.arrow_back_ios_new,
                            color: Colors.white,
                            size: 18,
                          ),
                          onPressed: () => Navigator.pop(context),
                        ),
                      ),
                      const Spacer(),
                      const Text(
                        "Join StudentHub",
                        style: TextStyle(
                          fontSize: 28,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Choose your account type to get started",
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withOpacity(0.8),
                        ),
                      ),
                      const SizedBox(height: 30), // مساحة عشان الكيرف
                    ],
                  ),
                ),
              ),
            ),
          ),

          // 2️⃣ الجزء الأوسط: كروت الاختيارات المتفاعلة
          Expanded(
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // كارت حساب الطالب
                  _buildInteractiveRoleCard(
                    roleValue: "student",
                    icon: Icons.school_rounded,
                    title: "I am a Student",
                    description:
                        "Looking for a comfortable room, flat, or flatmates near my university.",
                  ),

                  const SizedBox(height: 20),

                  // كارت حساب المالك / الأونر
                  _buildInteractiveRoleCard(
                    roleValue: "owner",
                    icon: Icons.real_estate_agent_rounded,
                    title: "I am a Property Owner",
                    description:
                        "Looking to list my rooms or flats and manage student rentals seamlessly.",
                  ),
                ],
              ),
            ),
          ),

          // 3️⃣ الجزء السفلي: زرار التأكيد الذكي (بيظهر بشكل أنيق لما يختار نوع الحساب)
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: AnimatedOpacity(
                duration: const Duration(milliseconds: 300),
                opacity: selectedRole != null
                    ? 1.0
                    : 0.3, // بيكون خفيف لو مأختارش، وبينور لما يختار
                child: SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF0055D3),
                      elevation: selectedRole != null ? 4 : 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                    ),
                    onPressed: selectedRole == null
                        ? null // الزرار مقفول لحد ما يختار
                        : () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    StudentInfoScreen(role: selectedRole!),
                              ),
                            );
                          },
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Text(
                          "Continue",
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(width: 8),
                        Icon(
                          Icons.arrow_forward_rounded,
                          color: Colors.white.withOpacity(0.9),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ويدجت ذكية لبناء كرت الاختيار المتفاعل بتأثيرات الـ Selection
  Widget _buildInteractiveRoleCard({
    required String roleValue,
    required IconData icon,
    required String title,
    required String description,
  }) {
    // هل الكارت ده هو اللي ملوش اختيار حالياً؟
    bool isSelected = selectedRole == roleValue;

    return GestureDetector(
      onTap: () {
        setState(() {
          selectedRole = roleValue; // تحديث الهوية المختارة
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        curve: Curves.easeInOut,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          // لو الكارت متحدد بياخد اللون الأزرق، لو مش متحدد بيفضل أبيض شيك
          color: isSelected ? const Color(0xFF0055D3) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? const Color(0xFF0055D3) : Colors.grey[200]!,
            width: 2,
          ),
          boxShadow: [
            BoxShadow(
              color: isSelected
                  ? const Color(0xFF0055D3).withOpacity(0.25)
                  : Colors.black.withOpacity(0.03),
              blurRadius: 15,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Row(
          children: [
            // أيقونة تتغير ألوانها بناءً على حالة الاختيار
            AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isSelected
                    ? Colors.white.withOpacity(0.2)
                    : const Color(0xFF0055D3).withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                color: isSelected ? Colors.white : const Color(0xFF0055D3),
                size: 30,
              ),
            ),
            const SizedBox(width: 16),

            // النصوص والعناوين
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: isSelected
                          ? Colors.white
                          : const Color(0xFF0D214F),
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    description,
                    style: TextStyle(
                      fontSize: 12,
                      color: isSelected
                          ? Colors.white.withOpacity(0.85)
                          : Colors.grey[600],
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),

            // علامة الدائرة الصغيرة (Radio-like effect) جهة اليمين
            Container(
              width: 22,
              height: 22,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: isSelected ? Colors.white : Colors.grey[300]!,
                  width: 2,
                ),
                color: isSelected ? Colors.white : Colors.transparent,
              ),
              child: isSelected
                  ? const Icon(Icons.check, size: 14, color: Color(0xFF0055D3))
                  : null,
            ),
          ],
        ),
      ),
    );
  }
}

// كلاس الرسم المخصص لعمل انحناء الكيرف الانسيابي في الهيدر
class HeaderClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    Path path = Path();
    path.lineTo(0, size.height - 40);

    var firstControlPoint = Offset(size.width / 4, size.height);
    var firstEndPoint = Offset(size.width / 2, size.height - 20);
    path.quadraticBezierTo(
      firstControlPoint.dx,
      firstControlPoint.dy,
      firstEndPoint.dx,
      firstEndPoint.dy,
    );

    var secondControlPoint = Offset(
      size.width - (size.width / 4),
      size.height - 40,
    );
    var secondEndPoint = Offset(size.width, size.height - 10);
    path.quadraticBezierTo(
      secondControlPoint.dx,
      secondControlPoint.dy,
      secondEndPoint.dx,
      secondEndPoint.dy,
    );

    path.lineTo(size.width, 0);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(CustomClipper oldClipper) => false;
}
