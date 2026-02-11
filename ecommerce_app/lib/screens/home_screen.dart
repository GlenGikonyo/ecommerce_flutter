import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import '../services/product_service.dart';
import '../models/cart_item.dart';
import '../services/cart_service.dart';
import 'cart_screen.dart';


class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ProductService _productService = ProductService();

  List<dynamic> _products = [];
  bool _isLoading = true;
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  void _loadProducts() async {
    final data = await _productService.getProducts();

    setState(() {
      _products = data;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey.shade50,
      body: SafeArea(
        child: Column(
          children: [
            _buildHeader(),
            _buildSearchBar(),
            const SizedBox(height: 10),

            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _products.isEmpty
                      ? const Center(child: Text("No products available"))
                      : GridView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          gridDelegate:
                              const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.70,
                            crossAxisSpacing: 15,
                            mainAxisSpacing: 15,
                          ),
                          itemCount: _products.length,
                          itemBuilder: (context, index) {
                            return _buildProductCard(_products[index]);
                          },
                        ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  // ================= HEADER =================
  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Welcome,',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey.shade600,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Stylish',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined, size: 28),
                onPressed: () {},
              ),
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ================= SEARCH =================
  Widget _buildSearchBar() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(30),
          boxShadow: [
            BoxShadow(
              color: Colors.grey.shade200,
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: TextField(
          decoration: InputDecoration(
            hintText: 'Search products...',
            hintStyle: TextStyle(color: Colors.grey.shade400),
            prefixIcon: Icon(Icons.search, color: Colors.grey.shade400),
            suffixIcon: Icon(Icons.tune, color: Colors.grey.shade400),
            border: InputBorder.none,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: 20,
              vertical: 15,
            ),
          ),
        ),
      ),
    );
  }

  // ================= PRODUCT CARD =================
  Widget _buildProductCard(dynamic product) {
    final String name = product['name'] ?? '';
    final String price = product['price'] ?? '0';
    final int stock = product['stock'] ?? 0;
    final String base64Image = product['image_url'] ?? '';

    Uint8List? imageBytes;

    try {
      if (base64Image.contains(',')) {
        final base64Str = base64Image.split(',').last;
        imageBytes = base64Decode(base64Str);
      }
    } catch (_) {}

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.grey.shade200,
            blurRadius: 8,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // IMAGE
          ClipRRect(
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(20),
              topRight: Radius.circular(20),
            ),
            child: imageBytes != null
                ? Image.memory(
                    imageBytes,
                    height: 140,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  )
                : Container(
                    height: 140,
                    color: Colors.grey.shade100,
                    child: const Center(
                      child: Icon(Icons.image, size: 50),
                    ),
                  ),
          ),

          // DETAILS
          Padding(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),

                const SizedBox(height: 6),

                Text(
                  stock > 0
                      ? "In Stock ($stock left)"
                      : "Out of Stock",
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: stock > 0 ? Colors.green : Colors.red,
                  ),
                ),

                const SizedBox(height: 8),

        Row(
  mainAxisAlignment: MainAxisAlignment.spaceBetween,
  children: [
    Text(
      "KES $price",
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
        color: Colors.red,
      ),
    ),

    InkWell(
      onTap: stock > 0
          ? () {
              final cartService = CartService();

              cartService.addToCart(
                CartItem(
                  id: product['id'],
                  name: name,
                  price: double.parse(price.toString()),
                  image: base64Image,
                  stock: stock,
                ),
              );

              setState(() {}); // refresh UI (cart count etc)

              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text("$name added to cart"),
                ),
              );
            }
          : null, // disables tap if out of stock
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: stock > 0 ? Colors.red : Colors.grey.shade400,
          shape: BoxShape.circle,
        ),
        child: const Icon(
          Icons.add,
          size: 16,
          color: Colors.white,
        ),
      ),
    ),
  ],
),

              ],
            ),
          )
        ],
      ),
    );
  }

  // ================= BOTTOM NAV =================
  Widget _buildBottomNav() {
    return BottomNavigationBar(
      currentIndex: _selectedIndex,
onTap: (index) {
  setState(() {
    _selectedIndex = index;
  });

  if (index == 2) { // Cart tab
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => const CartScreen(),
      ),
    ).then((_) => setState(() {})); // refresh when returning
  }
},

      selectedItemColor: Colors.red,
      unselectedItemColor: Colors.grey,
      type: BottomNavigationBarType.fixed,
      items: [
        BottomNavigationBarItem(
          icon: Icon(Icons.home_outlined),
          label: 'Home',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.favorite_border),
          label: 'Wishlist',
        ),
        BottomNavigationBarItem(
          icon: Stack(
  children: [
    Icon(Icons.shopping_cart_outlined),
    if (CartService().totalItems > 0)
      Positioned(
        right: 0,
        child: Container(
          padding: EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: Colors.red,
            shape: BoxShape.circle,
          ),
          child: Text(
            CartService().totalItems.toString(),
            style: TextStyle(
              color: Colors.white,
              fontSize: 10,
            ),
          ),
        ),
      )
  ],
),
          label: 'Cart',
        ),
        BottomNavigationBarItem(
          icon: Icon(Icons.person_outline),
          label: 'Profile',
        ),
      ],
    );
  }
}
