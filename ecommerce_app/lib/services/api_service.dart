import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';

class ApiService {

static Future<Map<String, dynamic>?> initiatePayment({
  required int orderId,
  required double amount,
  required String email,
  required String phone,
  required String token,
}) async {
  final response = await http.post(
    Uri.parse("${Config.baseUrl}/payment/intasend/initiate"),
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer $token", // VERY IMPORTANT
    },
    body: jsonEncode({
      "orderId": orderId,
      "amount": amount,
      "email": email,
      "phone": phone,
    }),
  );

  if (response.statusCode == 200) {
    return jsonDecode(response.body);
  } else {
    print(response.body);
    return null;
  }
}

  static Future<int?> placeOrder(String token) async {
    final response = await http.post(
      Uri.parse("${Config.baseUrl}/orders/place"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token",
      },
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return data["orderId"];
    } else {
      print(response.body);
      return null;
    }
  }

}
