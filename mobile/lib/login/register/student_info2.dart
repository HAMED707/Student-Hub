class AcademicInfoModel {
  final String university;
  final String faculty;
  final String department;
  final String academicLevel;

  AcademicInfoModel({
    required this.university,
    required this.faculty,
    required this.department,
    required this.academicLevel,
  });

  Map<String, dynamic> toJson() => {
    "university": university,
    "faculty": faculty,
    "department": department,
    "academic_level": academicLevel,
  };
}
