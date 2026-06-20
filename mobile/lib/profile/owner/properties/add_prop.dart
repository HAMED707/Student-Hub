import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';

class AddPropertyScreen extends StatefulWidget {
  // إضافة استقبال بيانات الكارد بشكل اختياري دون تغيير في الـ Constructor الأساسي
  final Map<String, dynamic>? propertyData;

  const AddPropertyScreen({super.key, this.propertyData});

  @override
  State<AddPropertyScreen> createState() => _AddPropertyScreenState();
}

class _AddPropertyScreenState extends State<AddPropertyScreen> {
  final _formKey = GlobalKey<FormState>();
  final ImagePicker _picker = ImagePicker();

  // الحقول والمتغيرات الأصلية بتاعتك بالكامل
  String? propertyType = 'Apartment';
  String? genderType = 'Both/Any';
  List<String> selectedBills = [];

  XFile? coverImage;
  XFile? propertyPhotos;
  XFile? videoTour;
  XFile? leaseAgreement;

  // لتعبئة النصوص تلقائياً عند التعديل فقط
  late TextEditingController _titleController;
  late TextEditingController _priceController;
  late TextEditingController _depositController;
  late TextEditingController _locationController;

  @override
  void initState() {
    super.initState();
    // كود ميزة التعديل: إذا كانت الداتا مبعوثة، نضع القيم داخل الـ Controllers، وإلا نتركها فارغة كالأصل
    _titleController = TextEditingController(
      text: widget.propertyData?["title"],
    );
    _priceController = TextEditingController(
      text: widget.propertyData?["price"],
    );
    _depositController =
        TextEditingController(); // يمكنك تركه فارغاً أو تعبئته إذا توفر
    _locationController = TextEditingController(
      text: widget.propertyData?["location"],
    );
  }

  @override
  void dispose() {
    _titleController.dispose();
    _priceController.dispose();
    _depositController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _pickFile(String type) async {
    try {
      XFile? pickedFile;
      if (type == 'video') {
        pickedFile = await _picker.pickVideo(source: ImageSource.gallery);
      } else {
        pickedFile = await _picker.pickImage(source: ImageSource.gallery);
      }

      if (pickedFile != null) {
        setState(() {
          if (type == 'cover') coverImage = pickedFile;
          if (type == 'photos') propertyPhotos = pickedFile;
          if (type == 'video') videoTour = pickedFile;
          if (type == 'lease') leaseAgreement = pickedFile;
        });
      }
    } catch (e) {
      debugPrint("Error picking file: $e");
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          widget.propertyData != null ? "Edit Property" : "Add Property",
          style: const TextStyle(
            color: Colors.black,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionTitle("Basic Information"),
              const SizedBox(height: 12),
              _buildTextField(
                "Property Title",
                "e.g. Cozy Studio Near University",
                controller: _titleController,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _buildDropdownField(
                      "Property Type",
                      ['Apartment', 'Private Room', 'Shared Room', 'Studio'],
                      propertyType,
                      (val) => setState(() => propertyType = val),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildDropdownField(
                      "Target Gender",
                      ['Both/Any', 'Boys', 'Girls'],
                      genderType,
                      (val) => setState(() => genderType = val),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      "Monthly Price (EGP)",
                      "e.g. 3500",
                      isNumeric: true,
                      controller: _priceController,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTextField(
                      "Security Deposit (EGP)",
                      "e.g. 2000",
                      isNumeric: true,
                      controller: _depositController,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              _buildTextField(
                "Location / Address",
                "e.g. 12 El-Tahrir St, Dokki, Giza",
                controller: _locationController,
              ),
              const SizedBox(height: 24),
              _buildSectionTitle("Utilities & Bills Included"),
              const SizedBox(height: 10),
              _buildBillsSelection(),
              const SizedBox(height: 24),
              _buildSectionTitle("Media & Documents"),
              const SizedBox(height: 12),
              _buildUploadRow(),
              const SizedBox(height: 12),
              _buildFileUploadTile(
                "Property Video Tour",
                Icons.video_collection,
                videoTour?.name,
                () => _pickFile('video'),
              ),
              const SizedBox(height: 12),
              _buildFileUploadTile(
                "Proof of Ownership / Lease Agreement",
                Icons.description,
                leaseAgreement?.name,
                () => _pickFile('lease'),
              ),
              const SizedBox(height: 35),
              ElevatedButton(
                onPressed: () {
                  if (_formKey.currentState!.validate()) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          widget.propertyData != null
                              ? "Property updated successfully"
                              : "Property submitted successfully",
                        ),
                      ),
                    );
                    Navigator.pop(context);
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF2563EB),
                  minimumSize: const Size(double.infinity, 48),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  elevation: 0,
                ),
                child: Text(
                  widget.propertyData != null
                      ? "Update Property"
                      : "Submit Property",
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 15,
        fontWeight: FontWeight.bold,
        color: Color(0xFF0F172A),
      ),
    );
  }

  Widget _buildTextField(
    String label,
    String hint, {
    bool isNumeric = false,
    required TextEditingController controller,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.grey,
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: isNumeric ? TextInputType.number : TextInputType.text,
          style: const TextStyle(fontSize: 13),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: Colors.grey.shade400, fontSize: 13),
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 12,
            ),
            fillColor: Colors.white,
            filled: true,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF3B82F6)),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Colors.redAccent),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Colors.redAccent),
            ),
          ),
          validator: (value) {
            if (value == null || value.isEmpty) {
              return "Required";
            }
            return null;
          },
        ),
      ],
    );
  }

  Widget _buildDropdownField(
    String label,
    List<String> items,
    String? currentSelected,
    Function(String?) onChanged,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.grey,
          ),
        ),
        const SizedBox(height: 6),
        DropdownButtonFormField<String>(
          value: currentSelected,
          items: items
              .map(
                (e) => DropdownMenuItem(
                  value: e,
                  child: Text(e, style: const TextStyle(fontSize: 13)),
                ),
              )
              .toList(),
          onChanged: onChanged,
          decoration: InputDecoration(
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 14,
              vertical: 10,
            ),
            fillColor: Colors.white,
            filled: true,
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: BorderSide(color: Colors.grey.shade200),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Color(0xFF3B82F6)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildBillsSelection() {
    final bills = ['Electricity', 'Water', 'Gas', 'Wi-Fi / Internet'];
    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: bills.map((bill) {
        final isSelected = selectedBills.contains(bill);
        return FilterChip(
          label: Text(
            bill,
            style: TextStyle(
              fontSize: 12,
              color: isSelected ? Colors.white : Colors.black87,
            ),
          ),
          selected: isSelected,
          onSelected: (selected) {
            setState(() {
              if (selected) {
                selectedBills.add(bill);
              } else {
                selectedBills.remove(bill);
              }
            });
          },
          selectedColor: const Color(0xFF3B82F6),
          checkmarkColor: Colors.white,
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(8),
            side: BorderSide(
              color: isSelected ? Colors.transparent : Colors.grey.shade200,
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildUploadRow() {
    return Row(
      children: [
        Expanded(
          child: _buildFileUploadTile(
            "Cover Image",
            Icons.image,
            coverImage?.name,
            () => _pickFile('cover'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildFileUploadTile(
            "Property Photos",
            Icons.collections,
            propertyPhotos?.name,
            () => _pickFile('photos'),
          ),
        ),
      ],
    );
  }

  Widget _buildFileUploadTile(
    String label,
    IconData icon,
    String? fileName,
    VoidCallback onTap,
  ) {
    bool hasFile = fileName != null;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.grey,
          ),
        ),
        const SizedBox(height: 6),
        OutlinedButton.icon(
          onPressed: onTap,
          icon: Icon(
            hasFile ? Icons.check_circle : icon,
            size: 18,
            color: hasFile ? Colors.green : const Color(0xFF3B82F6),
          ),
          label: Text(
            hasFile ? fileName! : "Choose File",
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12,
              color: hasFile ? Colors.green : const Color(0xFF3B82F6),
              fontWeight: hasFile ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          style: OutlinedButton.styleFrom(
            minimumSize: const Size(double.infinity, 42),
            side: BorderSide(
              color: hasFile ? Colors.green.shade300 : Colors.blue.shade200,
              width: hasFile ? 1.5 : 1,
            ),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
      ],
    );
  }
}
