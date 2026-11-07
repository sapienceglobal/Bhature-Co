import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:visibility_detector/visibility_detector.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/address_provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/screens/cart_screen.dart';
import 'package:single_restaurant_mobile/screens/notifications_screen.dart';
import 'package:single_restaurant_mobile/screens/search_screen.dart';

class HomeAppBar extends StatelessWidget implements PreferredSizeWidget {
  final Animation<double> logoScaleAnimation;
  final AnimationController logoController;
  final VoidCallback onLocationTap;
  final double preferredHeight;

  const HomeAppBar({
    super.key,
    required this.logoScaleAnimation,
    required this.logoController,
    required this.onLocationTap,
    this.preferredHeight = 190.0,
  });

  @override
  Size get preferredSize => Size.fromHeight(preferredHeight);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFFFAF3E8),
      ),
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.only(top: 4.0, bottom: 8.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              // Row 1: Bhatura & Co Logo & Circular Action Icons
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    // Left: Brand Logo
                    Flexible(
                      child: VisibilityDetector(
                        key: const Key('home-screen-logo'),
                        onVisibilityChanged: (info) {
                          try {
                            if (info.visibleFraction == 0.0) {
                              logoController.reset();
                            } else if (info.visibleFraction > 0.1 &&
                                !logoController.isAnimating &&
                                logoController.status !=
                                    AnimationStatus.completed) {
                              logoController.forward(from: 0.0);
                            }
                          } catch (_) {}
                        },
                        child: ScaleTransition(
                          scale: logoScaleAnimation,
                          child: Align(
                            alignment: Alignment.centerLeft,
                            heightFactor: 1.0,
                            child: Image.asset(
                              'assets/images/branded/bhatura-and-co/logo-emblem.png',
                              height: 52,
                              fit: BoxFit.contain,
                              alignment: Alignment.centerLeft,
                              errorBuilder: (c, e, s) => Text(
                                'Bhatura & Co',
                                style: GoogleFonts.playfairDisplay(
                                  color: AppColors.primary,
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(width: 8),

                    // Right: Notifications & Shopping Bag
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Consumer<NotificationProvider>(
                          builder: (context, np, _) => Stack(
                            clipBehavior: Clip.none,
                            children: [
                              _appBarIconButton(
                                icon: Icons.notifications_none_rounded,
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        const NotificationsScreen(),
                                  ),
                                ),
                              ),
                              if (np.hasUnread && np.unreadCount > 0)
                                Positioned(
                                  right: 1,
                                  top: 1,
                                  child: Container(
                                    padding: EdgeInsets.symmetric(
                                      horizontal: np.unreadCount > 9 ? 4 : 3.5,
                                      vertical: 1.5,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF7B0C17),
                                      borderRadius: BorderRadius.circular(10),
                                      border: Border.all(
                                        color: const Color(0xFFFAF3E8),
                                        width: 1.5,
                                      ),
                                    ),
                                    constraints: const BoxConstraints(
                                      minWidth: 14,
                                      minHeight: 14,
                                    ),
                                    child: Center(
                                      child: Text(
                                        np.unreadCount > 99
                                            ? '99+'
                                            : '${np.unreadCount}',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 8.5,
                                          fontWeight: FontWeight.w800,
                                          height: 1,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 10),
                        Consumer<CartProvider>(
                          builder: (context, cart, _) => Stack(
                            clipBehavior: Clip.none,
                            children: [
                              _appBarIconButton(
                                icon: Icons.shopping_bag_outlined,
                                onTap: () => Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => const CartScreen(),
                                  ),
                                ),
                              ),
                              if (cart.itemCount > 0)
                                Positioned(
                                  right: -1,
                                  top: -1,
                                  child: Container(
                                    padding: const EdgeInsets.all(3.5),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF730B17),
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: const Color(0xFFFAF3E8),
                                        width: 1.5,
                                      ),
                                    ),
                                    constraints: const BoxConstraints(
                                      minWidth: 17,
                                      minHeight: 17,
                                    ),
                                    child: Center(
                                      child: Text(
                                        '${cart.itemCount}',
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 9.5,
                                          fontWeight: FontWeight.bold,
                                          height: 1,
                                        ),
                                      ),
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 8),

              // Row 2: Deliver To Card
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Consumer2<AddressProvider, AuthProvider>(
                  builder: (context, addressProvider, authProvider, _) {
                    String displayAddress = 'Select your delivery address';
                    String label = 'Deliver to';

                    if (authProvider.isAuthenticated &&
                        addressProvider.addresses.isNotEmpty) {
                      final def = addressProvider.addresses.firstWhere(
                        (a) => a['isDefault'] == true,
                        orElse: () => addressProvider.addresses.first,
                      );
                      displayAddress = def['address'] ?? displayAddress;
                      final rawLabel = (def['label'] ?? 'Deliver to').toString();
                      label = rawLabel.isNotEmpty
                          ? 'Deliver to (${rawLabel[0].toUpperCase()}${rawLabel.substring(1).toLowerCase()})'
                          : 'Deliver to';
                    }

                    return GestureDetector(
                      onTap: onLocationTap,
                      child: Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 7.5,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFDF9F2),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: const Color(0xFFE4D4C0),
                            width: 1.0,
                          ),
                        ),
                        child: Row(
                          children: [
                            const Icon(
                              Icons.location_on,
                              color: Color(0xFF730B17),
                              size: 20,
                            ),
                            const SizedBox(width: 9),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Text(
                                    label,
                                    style: GoogleFonts.poppins(
                                      fontSize: 11.5,
                                      fontWeight: FontWeight.w700,
                                      color: const Color(0xFF730B17),
                                      height: 1.15,
                                    ),
                                  ),
                                  Text(
                                    displayAddress,
                                    style: GoogleFonts.poppins(
                                      fontSize: 12.0,
                                      fontWeight: FontWeight.w400,
                                      color: const Color(0xFF3E2E28),
                                      height: 1.2,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                    maxLines: 1,
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 6),
                            const Icon(
                              Icons.keyboard_arrow_down_rounded,
                              color: Color(0xFF3E2E28),
                              size: 20,
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              const SizedBox(height: 8),

              // Row 3: Search Bar Pill
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: GestureDetector(
                  onTap: () => Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const SearchScreen(),
                    ),
                  ),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(
                      horizontal: 14,
                      vertical: 9.5,
                    ),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFDF9F2),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                        color: const Color(0xFFE4D4C0),
                        width: 1.0,
                      ),
                    ),
                    child: Row(
                      children: [
                        const Icon(
                          Icons.search_rounded,
                          color: Color(0xFF3D271D),
                          size: 20,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Search for your favourite food',
                            style: GoogleFonts.poppins(
                              fontSize: 13.0,
                              fontWeight: FontWeight.w400,
                              color: const Color(0xFF6B5A50),
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _appBarIconButton({
    required IconData icon,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(22),
      child: Container(
        width: 39,
        height: 39,
        decoration: BoxDecoration(
          color: const Color(0xFFFDF9F2),
          shape: BoxShape.circle,
          border: Border.all(color: const Color(0xFFE4D4C0), width: 1.0),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF4A0810).withValues(alpha: 0.04),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Icon(icon, size: 20, color: const Color(0xFF2B1810)),
      ),
    );
  }
}
