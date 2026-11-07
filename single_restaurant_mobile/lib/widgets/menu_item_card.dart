import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/screens/item_detail_screen.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';
import 'package:single_restaurant_mobile/utils/spice_helper.dart';

class MenuItemCard extends StatelessWidget {
  final Map<String, dynamic> item;
  final int cartQty;
  final VoidCallback onAdd;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;

  const MenuItemCard({
    super.key,
    required this.item,
    required this.cartQty,
    required this.onAdd,
    required this.onIncrement,
    required this.onDecrement,
  });

  @override
  Widget build(BuildContext context) {
    final isVeg = item['isVeg'] ?? true;
    final showSpiceBadge = SpiceHelper.shouldShowMenuSpiceBadge(item);
    final itemId = item['_id'] ?? item['id'];
    final cartItems = Provider.of<CartProvider>(context).items;
    final cartMatch = cartItems.cast<Map<String, dynamic>?>().firstWhere(
          (c) => c != null && (c['menuItemId'] == itemId || c['_id'] == itemId),
          orElse: () => null,
        );
    final effectiveItemForSpice = (cartMatch != null && cartMatch['selectedSpiceLevel'] != null)
        ? <String, dynamic>{...item, 'selectedSpiceLevel': cartMatch['selectedSpiceLevel']}
        : item;
    final spiceText = SpiceHelper.getMenuSpiceBadgeText(effectiveItemForSpice);
    final activeFlames = SpiceHelper.getActiveFlameCount(spiceText);
    final rawPrice = item['price'] ?? 0.0;
    final double price = rawPrice is num
        ? rawPrice.toDouble()
        : (double.tryParse(rawPrice.toString()) ?? 0.0);
    final name = (item['name'] ?? 'Unknown Dish').toString();
    final description = (item['description'] ??
            'Freshly prepared with authentic royal spices.')
        .toString();
    final isBestseller = item['isBestseller'] == true ||
        item['isSignature'] == true ||
        item['isPopular'] == true;

    final screenWidth = MediaQuery.sizeOf(context).width;
    final imageWidth = (screenWidth * 0.28).clamp(96.0, 118.0);
    final imageHeight = (imageWidth * 0.90).clamp(88.0, 106.0);

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => ItemDetailScreen(item: item)),
        );
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(8.5),
        decoration: BoxDecoration(
          color: const Color(0xFFFDF9F2),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE6D7C3), width: 1.0),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF4A0810).withValues(alpha: 0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Left Rounded Image
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: SizedBox(
                width: imageWidth,
                height: imageHeight,
                child: ImageHelper.buildDishImage(item, fit: BoxFit.cover),
              ),
            ),

            const SizedBox(width: 11),

            // Center & Right Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Top Row: Veg Icon + Dish Name
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Container(
                        width: 15,
                        height: 15,
                        margin: const EdgeInsets.only(right: 6),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          border: Border.all(
                            color: isVeg
                                ? const Color(0xFF1B8A3D)
                                : const Color(0xFFC62828),
                            width: 1.4,
                          ),
                          borderRadius: BorderRadius.circular(3.5),
                        ),
                        alignment: Alignment.center,
                        child: Container(
                          width: 6.5,
                          height: 6.5,
                          decoration: BoxDecoration(
                            color: isVeg
                                ? const Color(0xFF1B8A3D)
                                : const Color(0xFFC62828),
                            shape: BoxShape.circle,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Text(
                          name,
                          style: GoogleFonts.playfairDisplay(
                            fontWeight: FontWeight.w800,
                            fontSize: 15.0,
                            color: const Color(0xFF23140E),
                            height: 1.15,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 5),

                  // Bottom Row: Details on Left + Price & Add Pill on Right
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      // Left Sub-column: Description, Bestseller badge, Spice level
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              description,
                              style: GoogleFonts.poppins(
                                color: const Color(0xFF5A483E),
                                fontSize: 11.0,
                                height: 1.25,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            if (isBestseller) ...[
                              const SizedBox(height: 5),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2.5,
                                ),
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFFF3CA7A),
                                      Color(0xFFE5B358),
                                    ],
                                  ),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.star_rounded,
                                      size: 12,
                                      color: Color(0xFF5A0811),
                                    ),
                                    const SizedBox(width: 3),
                                    Text(
                                      'Bestseller',
                                      style: GoogleFonts.poppins(
                                        fontSize: 10.0,
                                        fontWeight: FontWeight.w700,
                                        color: const Color(0xFF42060C),
                                        height: 1.1,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                            if (showSpiceBadge) ...[
                              const SizedBox(height: 5),
                              // Spice Flames + Label
                              Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  ...List.generate(3, (index) {
                                    final isActive = index < activeFlames;
                                    return Padding(
                                      padding: const EdgeInsets.only(right: 1.5),
                                      child: Icon(
                                        Icons.local_fire_department_rounded,
                                        size: 13.5,
                                        color: isActive
                                            ? const Color(0xFFC92A2A)
                                            : const Color(0xFFD8CFC4),
                                      ),
                                    );
                                  }),
                                  const SizedBox(width: 4),
                                  Flexible(
                                    child: Text(
                                      '($spiceText)',
                                      style: GoogleFonts.poppins(
                                        color: const Color(0xFF5A483E),
                                        fontSize: 11.0,
                                        fontWeight: FontWeight.w500,
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ],
                        ),
                      ),

                      const SizedBox(width: 8),

                      // Right Sub-column: Price & Pill Button
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          if (price > 0)
                            Padding(
                              padding: const EdgeInsets.only(bottom: 6, right: 2),
                              child: Text(
                                '\$${price.toStringAsFixed(2)}',
                                style: GoogleFonts.poppins(
                                  color: const Color(0xFF720A15),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 13.5,
                                ),
                              ),
                            ),
                          _buildCartButton(),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCartButton() {
    if (cartQty > 0) {
      return Container(
        height: 31,
        padding: const EdgeInsets.symmetric(horizontal: 4),
        decoration: BoxDecoration(
          color: const Color(0xFF730B17),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            InkWell(
              onTap: onDecrement,
              borderRadius: BorderRadius.circular(14),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 7, vertical: 5),
                child: Icon(Icons.remove, color: Colors.white, size: 15),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: Text(
                '$cartQty',
                style: GoogleFonts.poppins(
                  color: Colors.white,
                  fontWeight: FontWeight.w700,
                  fontSize: 12.5,
                ),
              ),
            ),
            InkWell(
              onTap: onIncrement,
              borderRadius: BorderRadius.circular(14),
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 7, vertical: 5),
                child: Icon(Icons.add, color: Colors.white, size: 15),
              ),
            ),
          ],
        ),
      );
    }

    return InkWell(
      onTap: onAdd,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        height: 31,
        padding: const EdgeInsets.symmetric(horizontal: 15),
        decoration: BoxDecoration(
          color: const Color(0xFF730B17),
          borderRadius: BorderRadius.circular(20),
        ),
        alignment: Alignment.center,
        child: Text(
          '+ Add',
          style: GoogleFonts.poppins(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 12.5,
          ),
        ),
      ),
    );
  }
}
