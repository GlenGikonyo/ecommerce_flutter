import '../models/cart_item.dart';

class CartService {
  static final CartService _instance = CartService._internal();
  factory CartService() => _instance;
  CartService._internal();

  final List<CartItem> _cartItems = [];

  List<CartItem> get cartItems => _cartItems;

  void addToCart(CartItem item) {
    final existing =
        _cartItems.where((e) => e.id == item.id).toList();

    if (existing.isNotEmpty) {
      existing.first.quantity++;
    } else {
      _cartItems.add(item);
    }
  }

  void removeFromCart(int id) {
    _cartItems.removeWhere((item) => item.id == id);
  }

  void increaseQuantity(int id) {
    final item = _cartItems.firstWhere((e) => e.id == id);
    if (item.quantity < item.stock) {
      item.quantity++;
    }
  }

  void decreaseQuantity(int id) {
    final item = _cartItems.firstWhere((e) => e.id == id);
    if (item.quantity > 1) {
      item.quantity--;
    }
  }

  double get totalPrice {
    return _cartItems.fold(
      0,
      (sum, item) => sum + (item.price * item.quantity),
    );
  }

  int get totalItems {
    return _cartItems.fold(
      0,
      (sum, item) => sum + item.quantity,
    );
  }
}
