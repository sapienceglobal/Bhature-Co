import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/auth_provider.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/screens/book_table_screen.dart';
import 'package:single_restaurant_mobile/screens/login_screen.dart';
import 'package:single_restaurant_mobile/screens/main_screen.dart';
import 'package:single_restaurant_mobile/screens/referral_prompt_screen.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/welcome/welcome_action_button.dart';
import 'package:single_restaurant_mobile/widgets/welcome/welcome_card_clipper.dart';
import 'package:single_restaurant_mobile/widgets/welcome/welcome_food_header.dart';
import 'package:single_restaurant_mobile/widgets/welcome/welcome_icons.dart';
import 'package:single_restaurant_mobile/services/push_notification_service.dart';
import 'package:single_restaurant_mobile/services/location_service.dart';

class SplashScreen extends StatefulWidget {
  final bool isLoggedIn;

  const SplashScreen({super.key, required this.isLoggedIn});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  bool _isExploreLoading = false;
  bool _isOrderLoading = false;
  bool _isReserveLoading = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      try {
        PushNotificationService().initialize(context);
      } catch (e) {
        debugPrint('PushNotification init on splash error: $e');
      }
      try {
        LocationService().requestStartupLocationPermission();
      } catch (e) {
        debugPrint('Location permission on splash error: $e');
      }
    });
  }

  bool get _isAnyLoading =>
      _isExploreLoading || _isOrderLoading || _isReserveLoading;

  Future<void> _onExploreMenu() async {
    if (_isAnyLoading) return;
    setState(() => _isExploreLoading = true);

    await Future.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;
    setState(() => _isExploreLoading = false);

    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (context) => const MainScreen(initialIndex: 1),
      ),
    );
  }

  Future<void> _onOrderOnline() async {
    if (_isAnyLoading) return;
    setState(() => _isOrderLoading = true);

    await Future.delayed(const Duration(milliseconds: 350));
    if (!mounted) return;
    setState(() => _isOrderLoading = false);

    if (widget.isLoggedIn) {
      final authProv = Provider.of<AuthProvider>(context, listen: false);
      if (authProv.user == null) {
        await authProv.fetchUser();
      }
      if (!mounted) return;
      final target = (authProv.user?.referralOnboarding == 'pending')
          ? const ReferralPromptScreen()
          : const MainScreen(initialIndex: 0);

      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => target,
        ),
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => const LoginScreen(),
        ),
      );
    }
  }

  Future<void> _onReserveTable() async {
    if (_isAnyLoading) return;
    setState(() => _isReserveLoading = true);

    final restProv = Provider.of<RestaurantProvider>(context, listen: false);
    if (restProv.restaurant == null) {
      await restProv.fetchRestaurantData();
    } else {
      await Future.delayed(const Duration(milliseconds: 300));
    }

    if (!mounted) return;
    setState(() => _isReserveLoading = false);

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const BookTableScreen(),
      ),
    );
  }

  Widget _buildFloralFooter(bool isCompact) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 54,
              height: 1.2,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Colors.transparent, Color(0xFFD6A146)],
                ),
              ),
            ),
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 10),
              child: Icon(
                Icons.spa_rounded,
                size: 16,
                color: Color(0xFFD6A146),
              ),
            ),
            Container(
              width: 54,
              height: 1.2,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFD6A146), Colors.transparent],
                ),
              ),
            ),
          ],
        ),
        SizedBox(height: isCompact ? 6 : 8),
        Text(
          'Freshly made. Full of flavour.',
          textAlign: TextAlign.center,
          style: GoogleFonts.playfairDisplay(
            color: const Color(0xFF6B0A14),
            fontSize: isCompact ? 13.5 : 15.0,
            fontStyle: FontStyle.italic,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.2,
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.viewPaddingOf(context).bottom;

    return Scaffold(
      backgroundColor: const Color(0xFF4B050C),
      body: ResponsiveCenter(
        maxWidth: AppResponsive.maxFormWidth,
        child: LayoutBuilder(
          builder: (context, constraints) {
            final screenHeight = constraints.maxHeight;
            final isCompact = screenHeight < 720 || constraints.maxWidth < 380;
            final maxAllowedHeader = math.max(180.0, screenHeight * 0.49);
            final minAllowedHeader =
                math.min(isCompact ? 210.0 : 255.0, maxAllowedHeader);
            final headerHeight = (screenHeight * 0.46).clamp(
              minAllowedHeader,
              maxAllowedHeader,
            );
            const waveOverlap = 36.0;
            final cardMinHeight =
                math.max(0.0, screenHeight - (headerHeight - waveOverlap));

            return Stack(
              children: [
                // Top Hero Emblem Banner (Maroon backdrop + Circular Bhatura & Co Emblem)
                Positioned(
                  top: 0,
                  left: 0,
                  right: 0,
                  child: WelcomeFoodHeader(height: headerHeight),
                ),

                // Scrollable Content with Overlapping Wavy Cream Card
                Positioned.fill(
                  child: SingleChildScrollView(
                    physics: const ClampingScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        SizedBox(height: headerHeight - waveOverlap),

                        // Curved Cream Container Card with Golden Wave Trim
                        Stack(
                          children: [
                            ClipPath(
                              clipper: const WelcomeCardClipper(),
                              child: Container(
                                width: double.infinity,
                                constraints: BoxConstraints(
                                  minHeight: cardMinHeight,
                                ),
                                color: const Color(0xFFFAF4E8),
                                child: Center(
                                  child: Padding(
                                    padding: EdgeInsets.fromLTRB(
                                      isCompact ? 18.0 : 24.0,
                                      isCompact ? 38.0 : 46.0,
                                      isCompact ? 18.0 : 24.0,
                                      math.max(20.0, bottomInset + 16.0),
                                    ),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.min,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.center,
                                      children: [
                                        // Headline: "Welcome to\nBhatura & Co"
                                        Text(
                                          'Welcome to\nBhatura & Co',
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.playfairDisplay(
                                            color: const Color(0xFF6B0A14),
                                            fontSize: isCompact ? 28 : 33,
                                            fontWeight: FontWeight.w800,
                                            letterSpacing: -0.3,
                                            height: 1.12,
                                          ),
                                        ),
                                        SizedBox(height: isCompact ? 8 : 12),

                                        // Subtitle
                                        Text(
                                          'Authentic flavours. Freshly prepared.\nDelivered to your doorstep.',
                                          textAlign: TextAlign.center,
                                          style: GoogleFonts.poppins(
                                            color: const Color(0xFF3E3028),
                                            fontSize: isCompact ? 12.5 : 14.0,
                                            fontWeight: FontWeight.w500,
                                            height: 1.38,
                                          ),
                                        ),
                                        SizedBox(height: isCompact ? 18 : 24),

                                        // 3 Action Buttons matching Image 1
                                        ConstrainedBox(
                                          constraints: BoxConstraints(
                                            maxWidth: math.max(
                                              200.0,
                                              math.min(
                                                constraints.maxWidth -
                                                    (isCompact ? 28.0 : 36.0),
                                                345.0,
                                              ),
                                            ),
                                          ),
                                          child: Column(
                                            children: [
                                              // 1. ORDER ONLINE (Solid Maroon, White text)
                                              WelcomeActionButton(
                                                title: 'ORDER ONLINE',
                                                isUppercase: true,
                                                height: isCompact ? 48.0 : 54.0,
                                                icon: ClochePlatterIcon(
                                                  color: Colors.white,
                                                  size: isCompact ? 22 : 26,
                                                ),
                                                backgroundColor:
                                                    const Color(0xFF720A15),
                                                textColor: Colors.white,
                                                arrowColor: Colors.white,
                                                isLoading: _isOrderLoading,
                                                onTap: _onOrderOnline,
                                              ),
                                              SizedBox(
                                                  height: isCompact ? 11 : 14),

                                              // 2. EXPLORE OUR MENU (Golden Amber, Maroon text)
                                              WelcomeActionButton(
                                                title: 'EXPLORE OUR MENU',
                                                isUppercase: true,
                                                height: isCompact ? 48.0 : 54.0,
                                                icon: MenuDocumentIcon(
                                                  color:
                                                      const Color(0xFF5C0710),
                                                  size: isCompact ? 22 : 26,
                                                ),
                                                backgroundColor:
                                                    const Color(0xFFF2BD65),
                                                textColor:
                                                    const Color(0xFF5C0710),
                                                arrowColor:
                                                    const Color(0xFF5C0710),
                                                isLoading: _isExploreLoading,
                                                onTap: _onExploreMenu,
                                              ),
                                              SizedBox(
                                                  height: isCompact ? 11 : 14),

                                              // 3. RESERVE A TABLE (Cream with Maroon Border & text)
                                              WelcomeActionButton(
                                                title: 'RESERVE A TABLE',
                                                isUppercase: true,
                                                height: isCompact ? 48.0 : 54.0,
                                                icon: DiningTableIcon(
                                                  color:
                                                      const Color(0xFF6B0A14),
                                                  size: isCompact ? 22 : 26,
                                                ),
                                                backgroundColor:
                                                    const Color(0xFFFCF8F0),
                                                borderColor:
                                                    const Color(0xFF72141C),
                                                textColor:
                                                    const Color(0xFF6B0A14),
                                                arrowColor:
                                                    const Color(0xFF6B0A14),
                                                isLoading: _isReserveLoading,
                                                onTap: _onReserveTable,
                                              ),
                                            ],
                                          ),
                                        ),

                                        SizedBox(height: isCompact ? 18 : 24),
                                        _buildFloralFooter(isCompact),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            // Golden Wave Trim Overlay
                            Positioned(
                              top: 0,
                              left: 0,
                              right: 0,
                              height: 45,
                              child: IgnorePointer(
                                child: CustomPaint(
                                  painter: const WelcomeWaveBorderPainter(),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}
