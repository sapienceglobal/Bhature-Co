import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';

class CartPickupLocation extends StatelessWidget {
  final CartProvider cart;
  final VoidCallback onTap;

  const CartPickupLocation({
    super.key,
    required this.cart,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final restaurant = cart.restaurant;
    final name = restaurant?['name'] ?? 'Bhatura & Co';
    final address = restaurant?['address'] ?? '123 Main St, City';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        decoration: BoxDecoration(
          color: const Color(0xFFFDF9F2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE6D7C3), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF4A0810).withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 2),
            )
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF9F5),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.storefront_outlined,
                color: Color(0xFF8B1E1E),
                size: 24,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Pickup from',
                    style: TextStyle(
                      color: Colors.grey,
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    name,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    address,
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 12,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }
}
