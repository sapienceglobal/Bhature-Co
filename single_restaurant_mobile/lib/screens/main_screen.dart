import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/providers/notification_provider.dart';
import 'package:single_restaurant_mobile/screens/home_screen.dart';
import 'package:single_restaurant_mobile/screens/menu_screen.dart';
import 'package:single_restaurant_mobile/screens/offers_screen.dart';
import 'package:single_restaurant_mobile/screens/orders_screen.dart';
import 'package:single_restaurant_mobile/screens/profile_screen.dart';
import 'package:single_restaurant_mobile/services/ota_update_service.dart';
import 'package:single_restaurant_mobile/services/push_notification_service.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

class MainScreen extends StatefulWidget {
  final int initialIndex;
  final String? initialCategory;
  final List<Widget>? tabs;

  const MainScreen({super.key, this.initialIndex = 0, this.initialCategory, this.tabs});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with WidgetsBindingObserver {
  late int _currentIndex;
  final List<int> _navigationHistory = [];
  DateTime? _lastPressedAt;
  String? _menuCategoryId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _currentIndex = widget.initialIndex;
    _menuCategoryId = widget.initialCategory;
    _navigationHistory.add(_currentIndex);

    // Background OTA check and initialize providers
    WidgetsBinding.instance.addPostFrameCallback((_) {
      OtaUpdateService().checkForUpdate(context, isManual: false);

      final authProv = context.read<AuthProvider>();
      authProv.addListener(() {
        if (mounted && authProv.isAuthenticated) {
          context.read<LoyaltyProvider>().fetchHistory();
          context.read<NotificationProvider>().fetchNotifications();
        }
      });
      if (authProv.isAuthenticated) {
        context.read<LoyaltyProvider>().fetchHistory();
        context.read<NotificationProvider>().fetchNotifications();
      }

      try {
        PushNotificationService().initialize(context);
      } catch (e) {
        debugPrint('PushNotification init skipped: $e');
      }
    });
  }

  void _onItemTapped(int index) {
    if (_currentIndex != index) {
      setState(() {
        _currentIndex = index;
        _navigationHistory.add(index);
      });
    }
  }

  void _onNavigateToTab(int index, {String? categoryId}) {
    setState(() {
      _currentIndex = index;
      _navigationHistory.add(index);
      _menuCategoryId = categoryId;
    });
  }

  Future<bool> _onWillPop() async {
    if (_navigationHistory.length > 1) {
      setState(() {
        _navigationHistory.removeLast();
        _currentIndex = _navigationHistory.last;
      });
      return false;
    }

    if (_currentIndex != 0) {
      setState(() {
        _currentIndex = 0;
        _navigationHistory.clear();
        _navigationHistory.add(0);
      });
      return false;
    }

    final now = DateTime.now();
    if (_lastPressedAt == null ||
        now.difference(_lastPressedAt!) > const Duration(seconds: 2)) {
      _lastPressedAt = now;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Press back again to exit the app',
            textAlign: TextAlign.center,
          ),
          duration: Duration(seconds: 2),
          behavior: SnackBarBehavior.floating,
        ),
      );
      return false;
    }

    return true;
  }

  void _navigateBack() {
    _onWillPop();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final isOrdersGuest = _currentIndex == 3 && authProvider.user == null;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (bool didPop, dynamic result) async {
        if (didPop) return;
        final bool shouldPop = await _onWillPop();
        if (shouldPop) {
          SystemNavigator.pop();
        }
      },
      child: Scaffold(
        backgroundColor: isOrdersGuest ? AppColors.primaryDark : null,
        body: IndexedStack(
          index: _currentIndex,
          children: widget.tabs ??
              [
                HomeScreen(onNavigateTab: _onNavigateToTab),
                MenuScreen(
                  key: _menuCategoryId != null
                      ? ValueKey('menu_$_menuCategoryId')
                      : const ValueKey('menu_default'),
                  initialCategoryId: _menuCategoryId,
                  onBack: _navigateBack,
                ),
                OffersScreen(onBack: _navigateBack),
                OrdersScreen(onBack: _navigateBack),
                const ProfileScreen(),
              ],
        ),
        bottomNavigationBar: _buildCustomBottomNavBar(context),
    ),
  );
}

  Widget _buildCustomBottomNavBar(BuildContext context) {
    const items = [
      (icon: Icons.home_outlined, activeIcon: Icons.home_rounded, label: 'Home'),
      (icon: Icons.menu_book_outlined, activeIcon: Icons.menu_book_rounded, label: 'Menu'),
      (icon: Icons.local_offer_outlined, activeIcon: Icons.local_offer_rounded, label: 'Offers'),
      (icon: Icons.receipt_long_outlined, activeIcon: Icons.receipt_long_rounded, label: 'Orders'),
      (icon: Icons.person_outline_rounded, activeIcon: Icons.person_rounded, label: 'Account'),
    ];

    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFFFAF4E8),
        border: const Border(
          top: BorderSide(color: Color(0xFFE2D2BC), width: 1.0),
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4A0810).withValues(alpha: 0.08),
            blurRadius: 12,
            offset: const Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        bottom: true,
        child: SizedBox(
          height: 62,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 6.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(items.length, (index) {
                final item = items[index];
                final isSelected = _currentIndex == index;

                return Expanded(
                  child: GestureDetector(
                    onTap: () => _onItemTapped(index),
                    behavior: HitTestBehavior.opaque,
                    child: Center(
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 220),
                        curve: Curves.easeOutCubic,
                        padding: EdgeInsets.symmetric(
                          horizontal: isSelected ? 14.0 : 6.0,
                          vertical: 5.0,
                        ),
                        decoration: BoxDecoration(
                          color: isSelected
                              ? const Color(0xFF6D0B15)
                              : Colors.transparent,
                          borderRadius: BorderRadius.circular(24),
                        ),
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                isSelected ? item.activeIcon : item.icon,
                                size: 21,
                                color: isSelected
                                    ? const Color(0xFFF5C265)
                                    : const Color(0xFF4A2C24),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                item.label,
                                style: GoogleFonts.poppins(
                                  fontSize: 11.0,
                                  fontWeight: isSelected
                                      ? FontWeight.w700
                                      : FontWeight.w500,
                                  color: isSelected
                                      ? const Color(0xFFF5C265)
                                      : const Color(0xFF3D251E),
                                  height: 1.15,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      if (mounted) {
        final authProv = context.read<AuthProvider>();
        if (authProv.isAuthenticated) {
          context.read<NotificationProvider>().fetchNotifications();
        }
      }
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }
}
