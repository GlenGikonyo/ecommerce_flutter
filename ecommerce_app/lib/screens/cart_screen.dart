import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../services/cart_service.dart';
import '../services/auth_service.dart';
import '../services/api_service.dart';
import '../models/cart_item.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final CartService cartService = CartService();

  @override
  Widget build(BuildContext context) {
    final items = cartService.cartItems;

    return Scaffold(
      backgroundColor: const Color(0xFFFDFDFD),
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            Expanded(
              child: items.isEmpty
                  ? const Center(child: Text("Your cart is empty"))
                  : ListView(
                      padding: const EdgeInsets.all(20),
                      children: [
                        ...items.map((item) => _buildCartItem(item)),
                        const SizedBox(height: 20),
                        _buildPaymentDetails(),
                      ],
                    ),
            ),
            _buildBottomSection(),
          ],
        ),
      ),
    );
  }

  // ================= HEADER =================
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.pop(context),
          ),
          const Text(
            "Shopping Bag",
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
          ),
          IconButton(
            icon: const Icon(Icons.favorite_border),
            onPressed: () {},
          ),
        ],
      ),
    );
  }

  // ================= CART ITEM =================
  Widget _buildCartItem(CartItem item) {
    Uint8List? imageBytes;

    try {
      if (item.image.contains(',')) {
        final base64Str = item.image.split(',').last;
        imageBytes = base64Decode(base64Str);
      }
    } catch (_) {}

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade200,
            blurRadius: 6,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          // IMAGE
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: imageBytes != null
                ? Image.memory(
                    imageBytes,
                    height: 80,
                    width: 80,
                    fit: BoxFit.cover,
                  )
                : Container(
                    height: 80,
                    width: 80,
                    color: Colors.grey.shade200,
                    child: const Icon(Icons.image),
                  ),
          ),

          const SizedBox(width: 12),

          // DETAILS
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.name,
                  style: const TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 6),
                Text(
                  "KES ${item.price}",
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.red,
                  ),
                ),
                const SizedBox(height: 8),

                // QUANTITY CONTROLS
                Row(
                  children: [
                    _qtyButton(Icons.remove, () {
                      setState(() {
                        cartService.decreaseQuantity(item.id);
                      });
                    }),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      child: Text(
                        item.quantity.toString(),
                        style: const TextStyle(fontSize: 16),
                      ),
                    ),
                    _qtyButton(Icons.add, () {
                      setState(() {
                        cartService.increaseQuantity(item.id);
                      });
                    }),
                  ],
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _qtyButton(IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey.shade300),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, size: 16),
      ),
    );
  }

  // ================= PAYMENT DETAILS =================
  Widget _buildPaymentDetails() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Divider(),
        const SizedBox(height: 10),
        const Text(
          "Order Payment Details",
          style: TextStyle(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 15),
        _priceRow("Order Amount", cartService.totalPrice),
        _priceRow("Delivery Fee", 0),
        const Divider(height: 30),
        _priceRow("Order Total", cartService.totalPrice, isTotal: true),
      ],
    );
  }

  Widget _priceRow(String title, double amount, {bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title),
          Text(
            "KES ${amount.toStringAsFixed(2)}",
            style: TextStyle(
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
              fontSize: isTotal ? 16 : 14,
            ),
          ),
        ],
      ),
    );
  }

  // ================= BOTTOM SECTION =================
  Widget _buildBottomSection() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade200,
            blurRadius: 10,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Text(
              "KES ${cartService.totalPrice.toStringAsFixed(2)}",
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          SizedBox(
            height: 50,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: cartService.cartItems.isEmpty
                  ? null
                  : () async {
                      try {
                        final prefs = await SharedPreferences.getInstance();
                        final token = prefs.getString('token');

                        if (token == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Please log in first")),
                          );
                          return;
                        }

                        // Place order first to get orderId
                        final orderId = await ApiService.placeOrder(token);

                        if (orderId == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Failed to create order")),
                          );
                          return;
                        }

                        // Get user email and phone from SharedPreferences or auth
                        final email = prefs.getString('email') ?? '';
                        final phone = prefs.getString('phone') ?? '';

                        final response = await ApiService.initiatePayment(
                          orderId: orderId,
                          amount: cartService.totalPrice,
                          email: email,
                          phone: phone,
                          token: token,
                        );

                        if (response != null && response['checkoutUrl'] != null) {
                          final checkoutUrl = response['checkoutUrl'];

                          if (await canLaunchUrl(Uri.parse(checkoutUrl))) {
                            await launchUrl(
                              Uri.parse(checkoutUrl),
                              mode: LaunchMode.externalApplication,
                            );
                          }
                        } else {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text("Payment initiation failed")),
                          );
                        }
                      } catch (e) {
                        print(e);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text("Something went wrong")),
                        );
                      }
                    },
              child: const Text(
                "Proceed to Payment",
                style: TextStyle(fontSize: 16),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
