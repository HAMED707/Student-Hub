class StudentBasicInfo {
  final String firstName;
  final String lastName;
  final String gender;
  final String phone;
  final String dob; // Date of Birth
  final String nationalId;
  final String governorate;
  final String city;

  StudentBasicInfo({
    required this.firstName,
    required this.lastName,
    required this.gender,
    required this.phone,
    required this.dob,
    required this.nationalId,
    required this.governorate,
    required this.city,
  });

  // تو تيم الـ API: هتبعت الكلاس ده كـ JSON في الـ Request body
  Map<String, dynamic> toJson() => {
    "first_name": firstName,
    "last_name": lastName,
    "gender": gender,
    "phone": phone,
    "date_of_birth": dob,
    "national_id": nationalId,
    "governorate": governorate,
    "city": city,
  };
}
