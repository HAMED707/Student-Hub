import 'package:flutter/material.dart';

class PassScreen extends StatefulWidget {
  @override
  _PassScreenState createState() => _PassScreenState();
}

class _PassScreenState extends State<PassScreen> {
  bool _isObscure = true;
  bool _isObscureConfirm = true;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "Set Password",
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF0055D3),
                ),
              ),
              SizedBox(height: 10),
              Text(
                "Create a strong password to secure your account.",
                style: TextStyle(color: Colors.grey[600], fontSize: 16),
              ),
              SizedBox(height: 40),
              Text("Email", style: TextStyle(fontWeight: FontWeight.bold)),
              SizedBox(height: 20),
              TextField(
                decoration: InputDecoration(
                  hint: Text("Enter Your Email"),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(15),
                    borderSide: BorderSide(width: 1),
                  ),
                ),
              ),

              SizedBox(height: 20),

              _buildLabel("Password *"),
              _buildPasswordField(
                hint: "Enter your password",
                isObscure: _isObscure,
                onToggle: () => setState(() => _isObscure = !_isObscure),
              ),

              SizedBox(height: 20),

              _buildLabel("Confirm Password *"),
              _buildPasswordField(
                hint: "Confirm your password",
                isObscure: _isObscureConfirm,
                onToggle: () =>
                    setState(() => _isObscureConfirm = !_isObscureConfirm),
              ),

              SizedBox(height: 40),

              // Register Button
              SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  onPressed: () {
                    // هنا يتم استدعاء الـ API النهائي لإنشاء الحساب
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Color(0xFF0055D3),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: Text(
                    "Create Account",
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),

              SizedBox(height: 30),
              // Progress Step
              _buildProgressIndicator(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8.0),
      child: Text(text, style: TextStyle(fontWeight: FontWeight.w600)),
    );
  }

  Widget _buildPasswordField({
    required String hint,
    required bool isObscure,
    required VoidCallback onToggle,
  }) {
    return TextField(
      obscureText: isObscure,
      decoration: InputDecoration(
        hintText: hint,
        suffixIcon: IconButton(
          icon: Icon(isObscure ? Icons.visibility_off : Icons.visibility),
          onPressed: onToggle,
        ),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide(color: Colors.grey[300]!),
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
        _stepCircle(true, Icons.check),
        _stepLine(true),
        _stepCircle(true, null, label: "3"),
      ],
    );
  }

  Widget _stepCircle(bool isDone, IconData? icon, {String? label}) {
    return CircleAvatar(
      radius: 12,
      backgroundColor: isDone ? Color(0xFF0055D3) : Colors.grey[300],
      child: icon != null
          ? Icon(icon, size: 14, color: Colors.white)
          : Text(
              label ?? "",
              style: TextStyle(color: Colors.white, fontSize: 12),
            ),
    );
  }

  Widget _stepLine(bool isDone) => Container(
    width: 40,
    height: 2,
    color: isDone ? Color(0xFF0055D3) : Colors.grey[300],
  );
}
