import 'package:flutter/material.dart';

class CommunityScreen extends StatefulWidget {
  const CommunityScreen({super.key});
  static List<Map<String, dynamic>> chatList = [
    {
      "name": "Ziad Amr",
      "lastMsg": "See you at the library!",
      "time": "12:30 PM",
      "unread": 2,
      "img": "https://randomuser.me/api/portraits/men/5.jpg",
      "messages": [],
    },
    {
      "name": "Mariam Said",
      "lastMsg": "Did you finish the project?",
      "time": "11:15 AM",
      "unread": 0,
      "img": "https://randomuser.me/api/portraits/women/5.jpg",
      "messages": [],
    },
  ];

  @override
  State<CommunityScreen> createState() => _CommunityScreenState();
}

class _CommunityScreenState extends State<CommunityScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final Color primaryBlue = const Color(0xFF0D47A1);

  // --- Data Structures ---
  List<Map<String, dynamic>> posts = [
    {
      "name": "Sara Ali",
      "text": "Does anyone have a summary for Microeconomics?",
      "isLiked": false,
      "comments": ["I have one!", "Check the student portal."],
    },
    {
      "name": "Ahmed Mostafa",
      "text": "The football tournament starts tomorrow!",
      "isLiked": true,
      "comments": ["Good luck!"],
    },
  ];

  // جعل القائمة static وتعديلها لتشمل مفتاح الصورة img

  List<Map<String, dynamic>> allGroups = [
    {
      "name": "CS Students",
      "desc": "1.2k Members • Official Group",
      "isJoined": true,
      "icon": Icons.terminal,
    },
    {
      "name": "Design Team",
      "desc": "450 Members • UI/UX Discussions",
      "isJoined": true,
      "icon": Icons.brush,
    },
    {
      "name": "Sports Hub",
      "desc": "800 Members • Training & Matches",
      "isJoined": false,
      "icon": Icons.fitness_center,
    },
    {
      "name": "Art Club",
      "desc": "120 Members • Painting & Drawing",
      "isJoined": false,
      "icon": Icons.palette,
    },
  ];

  List<Map<String, dynamic>> events = [
    {
      "title": "Annual Tech Summit",
      "date": "15 JUN",
      "loc": "Main Conference Hall",
      "time": "10:00 AM",
      "details":
          "A full day of networking with tech leaders, workshops, and career talks. Lunch and certificates are included!",
      "interested": "120 Interested",
    },
    {
      "title": "Flutter Workshop",
      "date": "22 JUN",
      "loc": "Lab 4 - Level 2",
      "time": "01:00 PM",
      "details":
          "Learn how to build cross-platform apps from scratch with Google's UI toolkit.",
      "interested": "45 Interested",
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FD),
      appBar: AppBar(
        elevation: 0,
        backgroundColor: primaryBlue,
        title: Center(
          child: const Text(
            "Community",
            style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          indicatorColor: Colors.white,
          tabs: const [
            Tab(text: "For You"),
            Tab(text: "Chats"),
            Tab(text: "Groups"),
            Tab(text: "Events"),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildForYouTab(),
          _buildModernChatsTab(),
          _buildModernGroupsTab(),
          _buildEventsTab(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        backgroundColor: primaryBlue,
        onPressed: () => _showCreatePostDialog(),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildForYouTab() {
    return ListView.builder(
      itemCount: posts.length,
      itemBuilder: (context, i) => Card(
        margin: const EdgeInsets.all(12),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        child: Column(
          children: [
            ListTile(
              leading: const CircleAvatar(child: Icon(Icons.person)),
              title: Text(
                posts[i]['name'],
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: const Text("Just now"),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(posts[i]['text']),
              ),
            ),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _postBtn(
                  posts[i]['isLiked'] ? Icons.favorite : Icons.favorite_border,
                  "Like",
                  posts[i]['isLiked'] ? Colors.red : Colors.grey,
                  () => setState(
                    () => posts[i]['isLiked'] = !posts[i]['isLiked'],
                  ),
                ),
                _postBtn(
                  Icons.chat_bubble_outline,
                  "Comment",
                  Colors.grey,
                  () => _showCommentsDialog(i),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildModernChatsTab() {
    return ListView.builder(
      padding: const EdgeInsets.symmetric(vertical: 10),
      itemCount: CommunityScreen.chatList.length,
      itemBuilder: (context, i) => Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(15),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10),
          ],
        ),
        child: ListTile(
          onTap: () => Navigator.push(
            context,
            MaterialPageRoute(
              builder: (c) => ChatPage(chatData: CommunityScreen.chatList[i]),
            ),
          ),
          leading: CircleAvatar(
            backgroundImage: NetworkImage(
              CommunityScreen.chatList[i]['img'] ??
                  "https://via.placeholder.com/150",
            ),
          ),
          title: Text(
            CommunityScreen.chatList[i]['name'],
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
          subtitle: Text(CommunityScreen.chatList[i]['lastMsg'], maxLines: 1),
          trailing: CommunityScreen.chatList[i]['unread'] > 0
              ? CircleAvatar(
                  radius: 10,
                  backgroundColor: primaryBlue,
                  child: Text(
                    "${CommunityScreen.chatList[i]['unread']}",
                    style: const TextStyle(color: Colors.white, fontSize: 10),
                  ),
                )
              : Text(
                  CommunityScreen.chatList[i]['time'],
                  style: const TextStyle(fontSize: 12),
                ),
        ),
      ),
    );
  }

  Widget _buildModernGroupsTab() {
    List joined = allGroups.where((g) => g['isJoined']).toList();
    List suggested = allGroups.where((g) => !g['isJoined']).toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (joined.isNotEmpty) ...[
          const Text(
            "My Groups",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          ...joined.map((g) => _groupCard(g)).toList(),
          const SizedBox(height: 20),
        ],
        const Text(
          "Suggested Groups",
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        ...suggested.map((g) => _groupCard(g)).toList(),
      ],
    );
  }

  Widget _groupCard(Map g) {
    return Card(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: ListTile(
        leading: Icon(g['icon'], color: primaryBlue),
        title: Text(
          g['name'],
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Text(g['desc']),
        trailing: ElevatedButton(
          style: ElevatedButton.styleFrom(
            backgroundColor: g['isJoined'] ? Colors.grey[200] : primaryBlue,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          onPressed: () {
            if (g['isJoined']) {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (c) => ChatPage(
                    chatData: {
                      "name": g['name'],
                      "messages": [],
                      "img": "https://via.placeholder.com/150",
                    },
                  ),
                ),
              );
            } else {
              setState(() => g['isJoined'] = true);
            }
          },
          child: Text(
            g['isJoined'] ? "Chat" : "Join",
            style: TextStyle(
              color: g['isJoined'] ? Colors.black : Colors.white,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildEventsTab() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: events.length,
      itemBuilder: (context, i) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(color: Colors.black.withOpacity(0.06), blurRadius: 15),
          ],
        ),
        child: InkWell(
          onTap: () => _showEventDialog(events[i]),
          child: Column(
            children: [
              Container(
                height: 100,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: primaryBlue,
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(20),
                  ),
                ),
                child: const Icon(
                  Icons.rocket_launch,
                  color: Colors.white,
                  size: 40,
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.blue[50],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        children: [
                          Text(
                            events[i]['date'].split(' ')[0],
                            style: TextStyle(
                              color: primaryBlue,
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          Text(
                            events[i]['date'].split(' ')[1],
                            style: TextStyle(color: primaryBlue, fontSize: 12),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 15),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            events[i]['title'],
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          Text(
                            events[i]['loc'],
                            style: const TextStyle(color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              Padding(
                padding: const EdgeInsets.only(bottom: 12, left: 16, right: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      events[i]['interested'],
                      style: const TextStyle(
                        color: Colors.orange,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                    const Text(
                      "View Details →",
                      style: TextStyle(
                        color: Color(0xFF0D47A1),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showCreatePostDialog() {
    TextEditingController c = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text("Create Post"),
        content: TextField(
          controller: c,
          maxLines: 3,
          decoration: const InputDecoration(hintText: "What's on your mind?"),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text("Cancel"),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: primaryBlue),
            onPressed: () {
              if (c.text.isNotEmpty) {
                setState(
                  () => posts.insert(0, {
                    "name": "Me",
                    "text": c.text,
                    "isLiked": false,
                    "comments": [],
                  }),
                );
                Navigator.pop(context);
              }
            },
            child: const Text("Post", style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  void _showCommentsDialog(int postIndex) {
    TextEditingController c = TextEditingController();
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(20),
          ),
          title: const Text("Comments"),
          content: SizedBox(
            width: double.maxFinite,
            height: 300,
            child: Column(
              children: [
                Expanded(
                  child: ListView.builder(
                    itemCount: posts[postIndex]['comments'].length,
                    itemBuilder: (c, i) =>
                        ListTile(title: Text(posts[postIndex]['comments'][i])),
                  ),
                ),
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: c,
                        decoration: const InputDecoration(
                          hintText: "Add comment...",
                        ),
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.send, color: primaryBlue),
                      onPressed: () {
                        if (c.text.isNotEmpty) {
                          setState(
                            () => posts[postIndex]['comments'].add(c.text),
                          );
                          setDialogState(() {});
                          c.clear();
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showEventDialog(Map ev) {
    showDialog(
      context: context,
      builder: (c) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text(
          ev['title'],
          style: TextStyle(color: primaryBlue, fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text("📅 Time: ${ev['time']}"),
            Text("📍 Location: ${ev['loc']}"),
            const Divider(),
            Text(ev['details']),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c),
            child: const Text("Cool!"),
          ),
        ],
      ),
    );
  }

  Widget _postBtn(
    IconData icon,
    String label,
    Color color,
    VoidCallback onTap,
  ) {
    return TextButton.icon(
      onPressed: onTap,
      icon: Icon(icon, color: color, size: 20),
      label: Text(label, style: TextStyle(color: color)),
    );
  }
}

// --- Chat Page (MODIFIED WITH IMAGE IN APPBAR) ---
class ChatPage extends StatefulWidget {
  final Map<String, dynamic> chatData;
  const ChatPage({super.key, required this.chatData});
  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final TextEditingController _msgC = TextEditingController();
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0D47A1),
        foregroundColor: Colors.white,
        titleSpacing: 0,
        title: Row(
          children: [
            CircleAvatar(
              radius: 18,
              backgroundImage: NetworkImage(
                widget.chatData['img'] ?? "https://via.placeholder.com/150",
              ),
            ),
            const SizedBox(width: 12),
            Text(widget.chatData['name'], style: const TextStyle(fontSize: 18)),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(15),
              itemCount: (widget.chatData['messages'] as List).length,
              itemBuilder: (c, i) {
                var msg = widget.chatData['messages'][i];
                return Align(
                  alignment: msg['isMe']
                      ? Alignment.centerRight
                      : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.symmetric(vertical: 5),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: msg['isMe']
                          ? const Color(0xFF0D47A1)
                          : Colors.white,
                      borderRadius: BorderRadius.circular(15),
                      boxShadow: [
                        BoxShadow(color: Colors.black12, blurRadius: 2),
                      ],
                    ),
                    child: Text(
                      msg['txt'],
                      style: TextStyle(
                        color: msg['isMe'] ? Colors.white : Colors.black,
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
          Container(
            padding: const EdgeInsets.all(10),
            color: Colors.white,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _msgC,
                    decoration: const InputDecoration(
                      hintText: "Type message...",
                      border: InputBorder.none,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.send, color: Color(0xFF0D47A1)),
                  onPressed: () {
                    if (_msgC.text.isNotEmpty) {
                      setState(() {
                        (widget.chatData['messages'] as List).add({
                          "txt": _msgC.text,
                          "isMe": true,
                        });
                      });
                      _msgC.clear();
                    }
                  },
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
