import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';

class CartService {
  Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString("token");
  }

  Future<void> addToCart(int productId, int quantity) async {
    final token = await _getToken();

    await http.post(
      Uri.parse("${Config.baseUrl}/cart"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token"
      },
      body: jsonEncode({"productId": productId, "quantity": quantity}),
    );
  }

  Future<List> getCart() async {
    final token = await _getToken();

    final res = await http.get(
      Uri.parse("${Config.baseUrl}/cart"),
      headers: {"Authorization": "Bearer $token"},
    );

    return jsonDecode(res.body);
  }
}
