import 'package:awesome_dialog/awesome_dialog.dart';
import 'package:flutter/material.dart';
import 'package:student_hub/findroom/findroom.dart';
import 'package:student_hub/homepage/home.dart';
import 'package:student_hub/main.dart';

class BookingDetailsScreen extends StatefulWidget {
  // 1. استقبال بيانات الشقة ديناميكياً
  final String apartmentName;
  final String location;
  final int monthlyPrice;
  final String imageUrl;

  const BookingDetailsScreen({
    super.key,
    required this.apartmentName,
    required this.location,
    required this.monthlyPrice,
    required this.imageUrl,
  });

  @override
  State<BookingDetailsScreen> createState() => _BookingDetailsScreenState();
}

class _BookingDetailsScreenState extends State<BookingDetailsScreen> {
  String selectedPaymentMethod = "Visa ending with 4242";
  DateTime selectedDate = DateTime.now();
  String selectedDuration = "6 Months";
  bool isAgreed = true;

  // دالة اختيار التاريخ[cite: 3]
  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime(2030),
    );
    if (picked != null && picked != selectedDate) {
      setState(() => selectedDate = picked);
    }
  }

  // دالة اختيار المدة[cite: 3]
  void _showDurationPicker() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text("Select Duration"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ["3 Months", "6 Months", "1 Year", "2 Years"].map((d) {
            return ListTile(
              title: Text(d),
              onTap: () {
                setState(() => selectedDuration = d);
                Navigator.pop(context);
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    int serviceFee = 250;
    int total = widget.monthlyPrice + serviceFee;

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text(
          "Booking Details",
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        backgroundColor: Colors.white,
        foregroundColor: Colors.black,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Apartment Summary (Dynamic)[cite: 3]
            _buildDynamicHeader(),
            const SizedBox(height: 25),

            _buildSectionTitle("Move-in Date"),
            GestureDetector(
              onTap: () => _selectDate(context),
              child: _buildInfoBox(
                "${selectedDate.day}/${selectedDate.month}/${selectedDate.year}",
                Icons.calendar_today,
              ),
            ),

            _buildSectionTitle("Duration"),
            GestureDetector(
              onTap: _showDurationPicker,
              child: _buildInfoBox(selectedDuration, Icons.timelapse),
            ),

            const SizedBox(height: 25),
            const Text(
              "Price Breakdown",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            _buildPriceRow("Monthly Rent", "EGP ${widget.monthlyPrice}"),
            _buildPriceRow("Service Fee", "EGP $serviceFee"),
            const Divider(),
            _buildPriceRow("Total", "EGP $total", isTotal: true),

            const SizedBox(height: 25),
            const Text(
              "Payment Method",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.payment, color: Color(0xFF0D47A1)),
              title: Text(selectedPaymentMethod),
              trailing: TextButton(
                onPressed: _showPaymentMethodsDialog,
                child: const Text("Change"),
              ),
            ),

            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: () {
                // تشغيل الـ Dialog مباشرة
                AwesomeDialog(
                  context: context,
                  dialogType: DialogType.question,
                  animType: AnimType.bottomSlide,
                  title: 'Are you sure You Want TO Book This Room',
                  desc: 'are you want to book ${widget.apartmentName}',
                  // تأكد إن الـ Buttons دي متعرفة صح عشان البرنامج ميعلقش
                  btnOkOnPress: () {
                    // التنقل بيحصل 'بعد' ما المستخدم يضغط OK[cite: 3]
                    Navigator.pushAndRemoveUntil(
                      context,
                      MaterialPageRoute(builder: (context) => StudentHubApp()),
                      (route) => false,
                    );
                  },
                  btnCancelOnPress: () {},
                ).show(); // مهم جداً تتأكد إن .show() في آخر الـ AwesomeDialog
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0D47A1),
                minimumSize: const Size(double.infinity, 55),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: const Text(
                "Confirm Booking",
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // --- قوائم الدفع الجديدة[cite: 3] ---
  void _showPaymentMethodsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text("Payment Method"),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _paymentOptionTile("Visa / Mastercard", Icons.credit_card, () {
              Navigator.pop(context);
              _showInputFieldsDialog("Card Details", [
                "Card Number",
                "Expiry Date",
                "CVV",
              ], "Visa");
            }),
            _paymentOptionTile("Vodafone Cash", Icons.phone_android, () {
              Navigator.pop(context);
              _showInputFieldsDialog("Vodafone Cash", [
                "Wallet Number",
              ], "Vodafone Cash");
            }),
            _paymentOptionTile("Fawry", Icons.code, () {
              Navigator.pop(context);
              _showInputFieldsDialog("Fawry Pay", [
                "Reference Number / Phone",
              ], "Fawry");
            }),
            _paymentOptionTile("Cash on Delivery", Icons.money, () {
              setState(() => selectedPaymentMethod = "Cash on Delivery");
              Navigator.pop(context);
            }),
          ],
        ),
      ),
    );
  }

  // قائمة إدخال البيانات الموحدة (فوري، فودافون، فيزا)[cite: 3]
  void _showInputFieldsDialog(String title, List<String> fields, String type) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: fields
              .map(
                (f) => Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: TextField(
                    decoration: InputDecoration(
                      hintText: f,
                      filled: true,
                      fillColor: Colors.grey[100],
                    ),
                  ),
                ),
              )
              .toList(),
        ),
        actions: [
          TextButton(
            onPressed: () {
              setState(() => selectedPaymentMethod = "$type Details Saved");
              Navigator.pop(context);
            },
            child: const Text("Save"),
          ),
        ],
      ),
    );
  }

  // Widgets مساعدة[cite: 3]
  Widget _buildDynamicHeader() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade200),
        borderRadius: BorderRadius.circular(15),
      ),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(10),
            child: Image.network(
              widget.imageUrl,
              width: 90,
              height: 70,
              fit: BoxFit.cover,
            ),
          ),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.apartmentName,
                  style: const TextStyle(fontWeight: FontWeight.bold),
                ),
                Text(
                  widget.location,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                ),
                Text(
                  "EGP ${widget.monthlyPrice}/mo",
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.blue,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) => Padding(
    padding: const EdgeInsets.only(top: 15, bottom: 8),
    child: Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
  );
  Widget _buildInfoBox(String text, IconData icon) => Container(
    padding: const EdgeInsets.all(15),
    decoration: BoxDecoration(
      color: Colors.grey[50],
      borderRadius: BorderRadius.circular(12),
      border: Border.all(color: Colors.grey.shade200),
    ),
    child: Row(
      children: [
        Icon(icon, size: 20, color: Colors.blue),
        const SizedBox(width: 10),
        Text(text),
      ],
    ),
  );
  Widget _buildPriceRow(String l, String p, {bool isTotal = false}) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 4),
    child: Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(l),
        Text(
          p,
          style: TextStyle(
            fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    ),
  );
  Widget _paymentOptionTile(String t, IconData i, VoidCallback o) => ListTile(
    leading: Icon(i, color: Colors.blue),
    title: Text(t),
    onTap: o,
  );
}
