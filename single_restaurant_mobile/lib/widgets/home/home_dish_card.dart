import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/screens/item_detail_screen.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';

class HomeDishCard extends StatelessWidget {
  final dynamic dish;

  const HomeDishCard({super.key, required this.dish});

  @override
  Widget build(BuildContext context) {
    final name = (dish['name'] ?? 'Dish').toString();
    final description = (dish['description'] ??
            'Freshly prepared with authentic royal spices.')
        .toString();
    final isVeg = dish['isVeg'] ?? true;
    final screenWidth = MediaQuery.sizeOf(context).width;
    final cardWidth = ((screenWidth - 44.0) / 2.0).clamp(164.0, 210.0);

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ItemDetailScreen(item: dish),
          ),
        );
      },
      child: Container(
        width: cardWidth,
        margin: const EdgeInsets.only(right: 12, bottom: 4),
        decoration: BoxDecoration(
          color: const Color(0xFFFDF9F2),
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE4D4C0), width: 1.0),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF4A0810).withValues(alpha: 0.05),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // Top Dish Image + Veg/Non-Veg Square Badge
            Stack(
              children: [
                ClipRRect(
                  borderRadius: const BorderRadius.vertical(
                    top: Radius.circular(13),
                  ),
                  child: SizedBox(
                    height: 112,
                    width: double.infinity,
                    child: ImageHelper.buildDishImage(
                      dish,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
                Positioned(
                  top: 8,
                  right: 8,
                  child: Container(
                    width: 18,
                    height: 18,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(3.5),
                      border: Border.all(
                        color: isVeg
                            ? const Color(0xFF1B8A3D)
                            : const Color(0xFFC62828),
                        width: 1.4,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.12),
                          blurRadius: 3,
                        ),
                      ],
                    ),
                    alignment: Alignment.center,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: BoxDecoration(
                        color: isVeg
                            ? const Color(0xFF1B8A3D)
                            : const Color(0xFFC62828),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ),
              ],
            ),

            // Content Body
            Expanded(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(10, 8, 10, 8),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          name,
                          style: GoogleFonts.playfairDisplay(
                            fontWeight: FontWeight.w800,
                            fontSize: 14.0,
                            color: const Color(0xFF23140E),
                            height: 1.15,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 3.5),
                        Text(
                          description,
                          style: GoogleFonts.poppins(
                            fontSize: 10.5,
                            color: const Color(0xFF5A483E),
                            height: 1.25,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),

                    // Bottom Action Row: View details > | Add +
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Flexible(
                          child: FittedBox(
                            fit: BoxFit.scaleDown,
                            alignment: Alignment.centerLeft,
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  'View details',
                                  style: GoogleFonts.poppins(
                                    color: const Color(0xFF720A15),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 11.0,
                                  ),
                                ),
                                const SizedBox(width: 1),
                                const Icon(
                                  Icons.chevron_right_rounded,
                                  size: 15,
                                  color: Color(0xFF720A15),
                                ),
                              ],
                            ),
                          ),
                        ),
                        Container(
                          height: 16,
                          width: 1,
                          margin: const EdgeInsets.symmetric(horizontal: 6),
                          color: const Color(0xFFE0CDB6),
                        ),
                        Consumer<CartProvider>(
                          builder: (context, cart, child) {
                            final dishId = dish['_id'] ?? dish['id'];
                            int totalQty = 0;
                            int lastMatchIndex = -1;
                            for (int i = 0; i < cart.items.length; i++) {
                              final c = cart.items[i];
                              if ((c['menuItemId'] ?? c['_id'] ?? c['id']) ==
                                  dishId) {
                                totalQty +=
                                    (c['quantity'] ?? c['qty'] ?? 1) as int;
                                lastMatchIndex = i;
                              }
                            }

                            if (totalQty > 0) {
                              return Container(
                                decoration: BoxDecoration(
                                  color: const Color(0xFF720A15),
                                  borderRadius: BorderRadius.circular(18),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    InkWell(
                                      onTap: () {
                                        if (lastMatchIndex != -1) {
                                          final lastQty = (cart
                                                      .items[lastMatchIndex]
                                                  ['quantity'] ??
                                              cart.items[lastMatchIndex]
                                                  ['qty'] ??
                                              1) as int;
                                          cart.updateQuantity(
                                            lastMatchIndex,
                                            lastQty - 1,
                                          );
                                        }
                                      },
                                      child: const Padding(
                                        padding: EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 4.5,
                                        ),
                                        child: Icon(
                                          Icons.remove,
                                          size: 13,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                    Text(
                                      '$totalQty',
                                      style: GoogleFonts.poppins(
                                        fontWeight: FontWeight.w700,
                                        color: Colors.white,
                                        fontSize: 11.5,
                                      ),
                                    ),
                                    InkWell(
                                      onTap: () {
                                        final restProv =
                                            Provider.of<RestaurantProvider>(
                                          context,
                                          listen: false,
                                        );
                                        AddToCartHelper.handleAddToCart(
                                          context,
                                          dish,
                                          cart,
                                          restProv,
                                        );
                                      },
                                      child: const Padding(
                                        padding: EdgeInsets.symmetric(
                                          horizontal: 6,
                                          vertical: 4.5,
                                        ),
                                        child: Icon(
                                          Icons.add,
                                          size: 13,
                                          color: Colors.white,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }

                            return InkWell(
                              borderRadius: BorderRadius.circular(18),
                              onTap: () {
                                final restProv =
                                    Provider.of<RestaurantProvider>(
                                  context,
                                  listen: false,
                                );
                                AddToCartHelper.handleAddToCart(
                                  context,
                                  dish,
                                  cart,
                                  restProv,
                                );
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 14,
                                  vertical: 5,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFF720A15),
                                  borderRadius: BorderRadius.circular(18),
                                ),
                                child: Text(
                                  'Add +',
                                  style: GoogleFonts.poppins(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 11.5,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
