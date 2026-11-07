import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class HomeHeroBanner extends StatefulWidget {
  final dynamic restaurant;
  final VoidCallback onOrderNow;
  final void Function(int slideIndex)? onSlideTap;

  const HomeHeroBanner({
    super.key,
    required this.restaurant,
    required this.onOrderNow,
    this.onSlideTap,
  });

  @override
  State<HomeHeroBanner> createState() => _HomeHeroBannerState();
}

class _HomeHeroBannerState extends State<HomeHeroBanner> {
  late final PageController _pageController;
  int _currentPage = 0;
  Timer? _autoSlideTimer;

  static const List<Map<String, String>> _slides = [
    {
      'title': 'Big Bhature.\nBigger Cravings.',
      'subtitle': 'Freshly made. Full of flavour.',
      'cta': 'Order Now',
      'image': 'assets/images/branded/bhatura-and-co/bhature_3d_platter_perfect.png',
      'isCutout': 'true',
    },
    {
      'title': 'Royal Dum\nBiryani & Combos.',
      'subtitle': 'Slow-cooked fragrant basmati rice.',
      'cta': 'Order Now',
      'image': 'assets/images/branded/lassi-lounge/hero-biryani.jpg',
      'isCutout': 'false',
    },
    {
      'title': 'Hand-Churned\nRoyal Lassi.',
      'subtitle': 'Rich, creamy & refreshing sips.',
      'cta': 'Order Now',
      'image': 'assets/images/branded/lassi-lounge/hero-lassi.jpg',
      'isCutout': 'false',
    },
  ];

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startAutoSlide();
  }

  void _startAutoSlide() {
    _autoSlideTimer?.cancel();
    _autoSlideTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (!mounted || !_pageController.hasClients) return;
      final next = (_currentPage + 1) % _slides.length;
      _pageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 600),
        curve: Curves.easeInOutCubic,
      );
    });
  }

  @override
  void dispose() {
    _autoSlideTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final textScaler = MediaQuery.textScalerOf(context);
    final minHeroHeight =
        (188.0 * (textScaler.scale(14.0) / 14.0)).clamp(184.0, 226.0);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Container(
        height: minHeroHeight,
        width: double.infinity,
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF6B0A14),
              Color(0xFF42040A),
            ],
          ),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF42040A).withValues(alpha: 0.22),
              blurRadius: 12,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(18),
          child: Stack(
            children: [
              // Swipeable Carousel Pages
              PageView.builder(
                controller: _pageController,
                itemCount: _slides.length,
                onPageChanged: (index) {
                  setState(() {
                    _currentPage = index;
                  });
                  _startAutoSlide();
                },
                itemBuilder: (context, index) {
                  final slide = _slides[index];
                  final isCutout = slide['isCutout'] == 'true';

                  return Stack(
                    children: [
                      if (!isCutout) ...[
                        Positioned.fill(
                          child: Image.asset(
                            slide['image']!,
                            fit: BoxFit.cover,
                            alignment: Alignment.centerRight,
                            errorBuilder: (c, e, s) => const SizedBox(),
                          ),
                        ),
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: [
                                  const Color(0xFF5D0711).withValues(alpha: 0.96),
                                  const Color(0xFF5D0711).withValues(alpha: 0.85),
                                  const Color(0xFF42040A).withValues(alpha: 0.35),
                                ],
                                stops: const [0.0, 0.52, 1.0],
                              ),
                            ),
                          ),
                        ),
                      ] else ...[
                        // Radial warm glow on right behind 3D platter
                        Positioned(
                          right: -20,
                          top: -10,
                          bottom: -10,
                          width: 210,
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: RadialGradient(
                                center: Alignment.center,
                                radius: 0.65,
                                colors: [
                                  const Color(0xFFA81D2B).withValues(alpha: 0.45),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),
                        ),
                        // 3D Bhature Platter on Right
                        Positioned(
                          right: -6,
                          bottom: 8,
                          top: 12,
                          width: MediaQuery.sizeOf(context).width * 0.48,
                          child: Image.asset(
                            slide['image']!,
                            fit: BoxFit.contain,
                            alignment: Alignment.centerRight,
                            errorBuilder: (c, e, s) => Image.asset(
                              'assets/images/branded/lassi-lounge/hero-curry.jpg',
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      ],

                      // Left Text & Golden Pill CTA
                      Padding(
                        padding: const EdgeInsets.fromLTRB(18.0, 18.0, 16.0, 18.0),
                        child: FractionallySizedBox(
                          widthFactor: 0.62,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              FittedBox(
                                fit: BoxFit.scaleDown,
                                alignment: Alignment.centerLeft,
                                child: Text(
                                  slide['title']!,
                                  style: GoogleFonts.playfairDisplay(
                                    color: const Color(0xFFFAF3E6),
                                    fontSize: 25,
                                    fontWeight: FontWeight.w800,
                                    height: 1.10,
                                  ),
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                slide['subtitle']!,
                                style: GoogleFonts.poppins(
                                  color: const Color(0xFFF3E5D0),
                                  fontSize: 11.5,
                                  height: 1.25,
                                  fontWeight: FontWeight.w400,
                                ),
                                maxLines: 2,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 14),
                              GestureDetector(
                                onTap: () {
                                  if (widget.onSlideTap != null) {
                                    widget.onSlideTap!(index);
                                  } else {
                                    widget.onOrderNow();
                                  }
                                },
                                child: Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 18,
                                    vertical: 8.5,
                                  ),
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [
                                        Color(0xFFF2C26B),
                                        Color(0xFFE0A84B),
                                      ],
                                    ),
                                    borderRadius: BorderRadius.circular(24),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.2),
                                        blurRadius: 6,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  child: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(
                                        slide['cta']!,
                                        style: GoogleFonts.poppins(
                                          color: const Color(0xFF3A060B),
                                          fontWeight: FontWeight.w700,
                                          fontSize: 12.5,
                                        ),
                                      ),
                                      const SizedBox(width: 4),
                                      const Icon(
                                        Icons.chevron_right_rounded,
                                        size: 18,
                                        color: Color(0xFF3A060B),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),

              // Interactive 3 Dots Indicator at bottom center
              Positioned(
                bottom: 9,
                left: 0,
                right: 0,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: List.generate(_slides.length, (i) {
                    final isActive = i == _currentPage;
                    return GestureDetector(
                      onTap: () {
                        _pageController.animateToPage(
                          i,
                          duration: const Duration(milliseconds: 400),
                          curve: Curves.easeInOut,
                        );
                      },
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        margin: const EdgeInsets.symmetric(horizontal: 3),
                        width: isActive ? 7.5 : 5.5,
                        height: isActive ? 7.5 : 5.5,
                        decoration: BoxDecoration(
                          color: isActive
                              ? const Color(0xFFFAF3E6)
                              : const Color(0xFFFAF3E6).withValues(alpha: 0.45),
                          shape: BoxShape.circle,
                        ),
                      ),
                    );
                  }),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
