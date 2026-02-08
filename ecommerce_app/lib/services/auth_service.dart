import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';

class AuthService {
  Future<bool> login(String email, String password) async {
    final res = await http.post(
      Uri.parse("${Config.baseUrl}/auth/login"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"email": email, "password": password}),
    );

    if (res.statusCode == 200) {
      final data = jsonDecode(res.body);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString("token", data["token"]);
      return true;
    }
    return false;
  }

  Future<bool> register(String name, String email, String password) async {
    final res = await http.post(
      Uri.parse("${Config.baseUrl}/auth/register"),
      headers: {"Content-Type": "application/json"},
      body: jsonEncode({"name": name, "email": email, "password": password}),
    );

    return res.statusCode == 201;
  }
}
