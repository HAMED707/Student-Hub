import 'package:flutter/material.dart';

class notify extends StatefulWidget {
  const notify({super.key});

  @override
  State<notify> createState() => _notifyState();
}

class _notifyState extends State<notify> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(body: Center(child: Text("notify")));
  }
}
