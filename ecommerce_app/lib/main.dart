import 'package:flutter/material.dart';
import 'screens/login_screen.dart';  // 👈 IMPORTANT

void main() {
  runApp(MyApp());
}

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: LoginScreen(),  // 👈 This is what shows
    );
  }
}
