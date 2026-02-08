import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config.dart';

class ProductService {
  Future<List> getProducts() async {
    final res = await http.get(Uri.parse("${Config.baseUrl}/products"));

    if (res.statusCode == 200) {
      return jsonDecode(res.body);
    }
    return [];
  }
}
