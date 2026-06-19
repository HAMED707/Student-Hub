class ForgotPasswordModel {
  final String email;

  ForgotPasswordModel({required this.email});

  // تيم الـ API هيحتاج الـ email بس عشان يبعت الـ OTP
  Map<String, dynamic> toJson() => {"email": email};
}
