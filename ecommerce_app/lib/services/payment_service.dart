import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../config.dart';

class PaymentService {
  Future<String?> initiatePayment(int orderId, double amount, String email, String phone) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString("token");

    final res = await http.post(
      Uri.parse("${Config.baseUrl}/payments/checkout"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token"
      },
      body: jsonEncode({
        "orderId": orderId,
        "amount": amount,
        "email": email,
        "phone": phone
      }),
    );

    if (res.statusCode == 200) {
      return jsonDecode(res.body)["checkoutUrl"];
    }
    return null;
  }
}
