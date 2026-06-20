class SetPasswordModel {
  final String password;
  final String confirmPassword;

  SetPasswordModel({required this.password, required this.confirmPassword});

  // تيم الـ API هيحتاجوا يتأكدوا إن الـ passwords متطابقين قبل ما يبعتوا الـ Request
  Map<String, dynamic> toJson() => {
    "password": password,
    "password_confirmation": confirmPassword,
  };
}
