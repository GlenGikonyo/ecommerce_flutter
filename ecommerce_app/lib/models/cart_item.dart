class CartItem {
  final int id;
  final String name;
  final double price;
  final String image;
  final int stock;
  int quantity;

  CartItem({
    required this.id,
    required this.name,
    required this.price,
    required this.image,
    required this.stock,
    this.quantity = 1,
  });
}
