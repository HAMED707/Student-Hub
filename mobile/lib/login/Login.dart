import 'package:flutter/material.dart';
import 'package:student_hub/login/forget_pass/forget_pass_screen.dart';
import 'package:student_hub/login/register/student_info_screen.dart';
import 'package:student_hub/login/selection.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _rememberMe = false;
  final TextEditingController _usernameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        child: Column(
          children: [
            // الجزء العلوي الأزرق مع الصورة
            Container(
              width: double.infinity,
              height: MediaQuery.of(context).size.height * 0.35,
              decoration: BoxDecoration(
                color: Color(0xFF0055D3), // لون أزرق مطابق للتصميم
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(40),
                  bottomRight: Radius.circular(40),
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20.0),
                    child: Text(
                      '"Find your next room or roommate - Login to get started!"',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  // هنا نضع الصورة (AssetImage)
                  SizedBox(height: 10),
                  Icon(
                    Icons.person_pin_circle,
                    size: 80,
                    color: Colors.white70,
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  Text(
                    "Login",
                    style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
                  ),
                  SizedBox(height: 30),

                  // Username Field
                  _buildTextField(
                    controller: _usernameController,
                    hint: "Username",
                    icon: Icons.person_outline,
                  ),
                  SizedBox(height: 16),

                  // Password Field
                  _buildTextField(
                    controller: _passwordController,
                    hint: "Password",
                    icon: Icons.remove_red_eye_outlined,
                    isPassword: true,
                  ),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Checkbox(
                            value: _rememberMe,
                            onChanged: (val) =>
                                setState(() => _rememberMe = val!),
                          ),
                          Text("Remember me"),
                        ],
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (context) => ForgotPasswordScreen(),
                            ),
                          );
                        },
                        child: Text("Forgot Password?"),
                      ),
                    ],
                  ),

                  SizedBox(height: 20),

                  // Login Button
                  SizedBox(
                    width: double.infinity,
                    height: 55,
                    child: ElevatedButton(
                      onPressed: () {
                        // هنا يتم استدعاء الـ API
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Color(0xFF0055D3),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: Text(
                        "Login",
                        style: TextStyle(color: Colors.white, fontSize: 18),
                      ),
                    ),
                  ),

                  SizedBox(height: 20),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text("Don't have an account? "),
                      GestureDetector(
                        onTap: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute<void>(
                              builder: (context) => RoleSelectionScreen(),
                            ),
                          );
                        },
                        child: Text(
                          "Register",
                          style: TextStyle(
                            color: Colors.blue,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),

                  SizedBox(height: 30),
                  Text(
                    "Login with Others",
                    style: TextStyle(color: Colors.grey),
                  ),
                  SizedBox(height: 20),

                  // Social Login Buttons
                  _buildSocialButton(
                    "Log In with Facebook",
                    Colors.blue[700]!,
                    Icons.facebook,
                  ),
                  SizedBox(height: 12),
                  _buildSocialButton(
                    "Log In with Google",
                    Colors.white,
                    Icons.g_mobiledata,
                    textColor: Colors.black,
                    hasBorder: true,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool isPassword = false,
  }) {
    return TextField(
      controller: controller,
      obscureText: isPassword,
      decoration: InputDecoration(
        prefixIcon: Icon(icon),
        hintText: hint,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Widget _buildSocialButton(
    String text,
    Color color,
    IconData icon, {
    Color textColor = Colors.white,
    bool hasBorder = false,
  }) {
    return Container(
      width: double.infinity,
      height: 50,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(12),
        border: hasBorder ? Border.all(color: Colors.grey[300]!) : null,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: textColor),
          SizedBox(width: 10),
          Text(
            text,
            style: TextStyle(color: textColor, fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
