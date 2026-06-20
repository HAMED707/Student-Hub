class VerifyCodeModel {
  final String email; // أو phone حسب الـ Backend
  final String code;

  VerifyCodeModel({required this.email, required this.code});

  Map<String, dynamic> toJson() => {"email": email, "otp_code": code};
}
