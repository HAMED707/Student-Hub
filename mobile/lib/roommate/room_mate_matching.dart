import 'package:flutter/material.dart';
// تأكد من عمل import لصفحة الكومينتي عشان الربط يشتغل
import 'package:student_hub/community/community_screen.dart';

class RoommateMatchingScreen extends StatefulWidget {
  const RoommateMatchingScreen({super.key});

  @override
  State<RoommateMatchingScreen> createState() => _RoommateMatchingScreenState();
}

class _RoommateMatchingScreenState extends State<RoommateMatchingScreen> {
  // 1. Preferences Data[cite: 3]
  Map<String, String> userPrefs = {
    'major': 'Computer Science',
    'year': '1st Year',
    'sleep': 'normal',
    'clean': 'high',
    'pers': 'quiet',
    'smoke': 'non_smoker',
    'guests': 'sometimes',
    'room': 'shared',
    'study': 'sturdy',
    'pets': 'no',
  };

  final List<Map<String, dynamic>> studentsRawData = [
    {
      "name": "Sara Mohamed",
      "major": "Computer Science",
      "year": "1st Year",
      "uni": "Cairo University",
      "sleep": "early",
      "clean": "high",
      "pers": "quiet",
      "smoke": "non_smoker",
      "guests": "never",
      "room": "single",
      "study": "sturdy",
      "pets": "no",
      "img": "https://randomuser.me/api/portraits/women/1.jpg",
    },
    {
      "name": "Ahmed Ali",
      "major": "Engineering",
      "year": "2nd Year",
      "uni": "Helwan University",
      "sleep": "late",
      "clean": "medium",
      "pers": "social",
      "smoke": "smoker",
      "guests": "often",
      "room": "shared",
      "study": "relaxed",
      "pets": "yes",
      "img": "https://randomuser.me/api/portraits/men/1.jpg",
    },
    {
      "name": "Mona Ahmed",
      "major": "Medicine",
      "year": "4th Year",
      "uni": "Ain Shams University",
      "sleep": "normal",
      "clean": "high",
      "pers": "social",
      "smoke": "non_smoker",
      "guests": "sometimes",
      "room": "shared",
      "study": "sturdy",
      "pets": "no",
      "img": "https://randomuser.me/api/portraits/women/2.jpg",
    },
    {
      "name": "Hassan Karim",
      "major": "Computer Science",
      "year": "3rd Year",
      "uni": "Cairo University",
      "sleep": "early",
      "clean": "high",
      "pers": "quiet",
      "smoke": "non_smoker",
      "guests": "sometimes",
      "room": "shared",
      "study": "sturdy",
      "pets": "no",
      "img": "https://randomuser.me/api/portraits/men/2.jpg",
    },
    {
      "name": "Omar Idrees",
      "major": "Business",
      "year": "2nd Year",
      "uni": "Mansoura University",
      "sleep": "late",
      "clean": "medium",
      "pers": "quiet",
      "smoke": "smoker",
      "guests": "never",
      "room": "single",
      "study": "sturdy",
      "pets": "no",
      "img": "https://randomuser.me/api/portraits/men/3.jpg",
    },
  ];

  List<Map<String, dynamic>> calculatedMatches = [];
  bool isLoading = false;

  @override
  void initState() {
    super.initState();
    _calculateMatching();
  }

  // AI Matching Engine[cite: 3]
  void _calculateMatching() {
    setState(() => isLoading = true);
    Future.delayed(const Duration(milliseconds: 900), () {
      List<Map<String, dynamic>> newList = [];
      for (var student in studentsRawData) {
        double score = 0;
        userPrefs.forEach((key, value) {
          if (student[key] == value) {
            score += 10;
          }
        });
        newList.add({...student, "matchScore": score});
      }
      newList.sort((a, b) => b['matchScore'].compareTo(a['matchScore']));
      setState(() {
        calculatedMatches = newList;
        isLoading = false;
      });
    });
  }

  // Filter Dialog[cite: 3]
  void _showFilterDialog() {
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: '',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, anim1, anim2) => const SizedBox.shrink(),
      transitionBuilder: (context, anim1, anim2, child) {
        return Transform.scale(
          scale: anim1.value,
          child: Opacity(
            opacity: anim1.value,
            child: StatefulBuilder(
              builder: (context, setModalState) =>
                  Dialog(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(25),
                    ),
                    child: Container(
                      padding: const EdgeInsets.all(20),
                      constraints: const BoxConstraints(
                        maxWidth: 400,
                        maxHeight: 680,
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Text(
                            "Matching Criteria",
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF0D47A1),
                            ),
                          ),
                          const Divider(),
                          Flexible(
                            child: SingleChildScrollView(
                              child: Column(
                                children: [
                                  _buildChoice(
                                    setModalState,
                                    "Academic Major",
                                    'major',
                                    [
                                      'Computer Science',
                                      'Engineering',
                                      'Medicine',
                                      'Business',
                                    ],
                                    Icons.work_outline,
                                  ),
                                  _buildChoice(
                                    setModalState,
                                    "Academic Year",
                                    'year',
                                    [
                                      '1st Year',
                                      '2nd Year',
                                      '3rd Year',
                                      '4th Year',
                                      '5th Year',
                                      '6th Year',
                                    ],
                                    Icons.school,
                                  ),
                                  _buildChoice(
                                    setModalState,
                                    "Sleeping",
                                    'sleep',
                                    ['early', 'normal', 'late'],
                                    Icons.bedtime,
                                  ),
                                  _buildChoice(
                                    setModalState,
                                    "Cleanliness",
                                    'clean',
                                    ['medium', 'high'],
                                    Icons.cleaning_services,
                                  ),
                                  _buildChoice(
                                    setModalState,
                                    "Personality",
                                    'pers',
                                    ['quiet', 'social'],
                                    Icons.psychology,
                                  ),
                                  _buildChoice(
                                    setModalState,
                                    "Smoking",
                                    'smoke',
                                    ['non_smoker', 'smoker'],
                                    Icons.smoke_free,
                                  ),
                                  _buildChoice(
                                    setModalState,
                                    "Guests",
                                    'guests',
                                    ['never', 'sometimes', 'often'],
                                    Icons.group,
                                  ),
                                  _buildChoice(
                                    setModalState,
                                    "Room Type",
                                    'room',
                                    ['shared', 'single'],
                                    Icons.meeting_room,
                                  ),
                                  _buildChoice(
                                    setModalState,
                                    "Study Habit",
                                    'study',
                                    ['sturdy', 'relaxed'],
                                    Icons.menu_book,
                                  ),
                                  _buildChoice(setModalState, "Pets", 'pets', [
                                    'yes',
                                    'no',
                                  ], Icons.pets),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 15),
                          ElevatedButton(
                            onPressed: () => Navigator.pop(context),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.grey[200],
                              foregroundColor: Colors.black,
                              minimumSize: const Size(double.infinity, 48),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                            ),
                            child: const Text("Save & Close"),
                          ),
                        ],
                      ),
                    ),
                  ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildChoice(
    Function setModalState,
    String label,
    String key,
    List<String> opts,
    IconData icon,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: Colors.blue),
              const SizedBox(width: 8),
              Text(label, style: const TextStyle(fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            children: opts.map((o) {
              bool sel = userPrefs[key] == o;
              return ChoiceChip(
                label: Text(o, style: const TextStyle(fontSize: 11)),
                selected: sel,
                onSelected: (s) => setModalState(() => userPrefs[key] = o),
                selectedColor: const Color(0xFF1976D2),
                labelStyle: TextStyle(color: sel ? Colors.white : Colors.black),
                backgroundColor: Colors.grey[100],
                side: BorderSide.none,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF4F7F9),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D47A1),
        title: const Text(
          "Roommate Matching",
          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
        ),
        centerTitle: true,
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              children: [
                ElevatedButton.icon(
                  onPressed: _showFilterDialog,
                  icon: const Icon(Icons.tune),
                  label: const Text("Edit Matching Filters"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFF0D47A1),
                    minimumSize: const Size(double.infinity, 52),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                      side: const BorderSide(color: Color(0xFF0D47A1)),
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: _calculateMatching,
                  icon: const Icon(Icons.auto_awesome, color: Colors.yellow),
                  label: const Text("Run AI Match"),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF1976D2),
                    foregroundColor: Colors.white,
                    minimumSize: const Size(double.infinity, 52),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(15),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: AnimatedSwitcher(
              duration: const Duration(milliseconds: 600),
              child: isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : ListView.builder(
                      itemCount: calculatedMatches.length,
                      padding: const EdgeInsets.only(bottom: 20),
                      itemBuilder: (context, index) =>
                          _buildPremiumCard(calculatedMatches[index]),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  // Premium Card UI with Integrated Chat Connection[cite: 2, 3]
  Widget _buildPremiumCard(Map<String, dynamic> u) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(22),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.06),
            blurRadius: 15,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(radius: 32, backgroundImage: NetworkImage(u['img'])),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      u['name'],
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      "${u['major']} • ${u['year']}",
                      style: const TextStyle(
                        color: Color(0xFF1976D2),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      u['uni'],
                      style: const TextStyle(color: Colors.grey, fontSize: 12),
                    ),
                  ],
                ),
              ),
              Column(
                children: [
                  Text(
                    "${u['matchScore'].toInt()}%",
                    style: const TextStyle(
                      color: Colors.green,
                      fontWeight: FontWeight.bold,
                      fontSize: 22,
                    ),
                  ),
                  const Text(
                    "Match",
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ],
          ),
          const Divider(height: 35),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.bolt, color: Colors.amber, size: 18),
                  const SizedBox(width: 5),
                  Text(
                    u['matchScore'] > 80 ? "Top Recommendation" : "Compatible",
                    style: TextStyle(
                      color: u['matchScore'] > 80
                          ? Colors.green
                          : Colors.blueGrey,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
              ElevatedButton(
                onPressed: () {
                  // 1. Create New Chat Data[cite: 3]
                  var newChat = {
                    "name": u['name'],
                    "lastMsg": "I saw your profile on Roommate Matching!",
                    "time": "Just now",
                    "unread": 0,
                    "img": u['img'],
                    "messages": [
                      {
                        "txt":
                            "Hey ${u['name']}! I saw we have a ${u['matchScore'].toInt()}% match. Would you like to talk?",
                        "isMe": true,
                      },
                    ],
                  };

                  // 2. Add to Community Chat List (Static)[cite: 2]
                  // Note: Make sure CommunityScreen.chatList is static as discussed
                  bool exists = CommunityScreen.chatList.any(
                    (chat) => chat['name'] == u['name'],
                  );
                  if (!exists) {
                    CommunityScreen.chatList.insert(0, newChat);
                  }

                  // 3. Navigate to Chat Page[cite: 2]
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ChatPage(chatData: newChat),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0D47A1),
                  padding: const EdgeInsets.symmetric(horizontal: 25),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: const Text(
                  "Chat Now",
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
