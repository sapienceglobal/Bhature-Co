import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/loyalty_provider.dart';
import 'package:single_restaurant_mobile/screens/loyalty_rewards_screen.dart';
import 'package:single_restaurant_mobile/widgets/home/home_fast_delivery_card.dart';
import 'package:single_restaurant_mobile/widgets/home/home_welcome_offer_card.dart';

class HomePromoCardsCarousel extends StatelessWidget {
  final Map<String, dynamic>? activeCoupon;
  final VoidCallback? onOffersTap;

  const HomePromoCardsCarousel({
    super.key,
    this.activeCoupon,
    this.onOffersTap,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    // Size each card so 2 cards fit side-by-side cleanly on screen
    final cardWidth = ((screenWidth - 42.0) / 2.0).clamp(158.0, 215.0);
    const cardHeight = 140.0;

    final effectiveCoupon = activeCoupon ??
        const <String, dynamic>{
          'code': 'WELCOME20',
          'type': 'percentage',
          'value': 20,
          'promoType': 'FIRST ORDER SPECIAL',
        };

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.only(bottom: 4),
      physics: const BouncingScrollPhysics(),
      child: Row(
        children: [
          WelcomeOfferCard(
            coupon: effectiveCoupon,
            onTap: onOffersTap,
            width: cardWidth,
            height: cardHeight,
            margin: const EdgeInsets.only(left: 16, right: 10),
          ),
          LoyaltyPromoCard(
            isFirst: false,
            width: cardWidth,
            height: cardHeight,
          ),
          const FastDeliveryCard(),
        ],
      ),
    );
  }
}

class LoyaltyPromoCard extends StatelessWidget {
  final bool isFirst;
  final double? width;
  final double? height;

  const LoyaltyPromoCard({
    super.key,
    this.isFirst = false,
    this.width,
    this.height,
  });

  @override
  Widget build(BuildContext context) {
    return Consumer<LoyaltyProvider>(
      builder: (context, loyalty, _) {
        final isMember = loyalty.isLoyaltyMember;
        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const LoyaltyRewardsScreen(),
              ),
            );
          },
          child: Container(
            width: width ?? 182,
            height: height ?? 140,
            margin: EdgeInsets.only(left: isFirst ? 16 : 0, right: 10),
            padding: const EdgeInsets.fromLTRB(12, 12, 8, 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFDF9F2),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: const Color(0xFFE4D4C0),
                width: 1.1,
              ),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF4A0810).withValues(alpha: 0.05),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Flexible(
                        child: FittedBox(
                          fit: BoxFit.scaleDown,
                          alignment: Alignment.centerLeft,
                          child: Text(
                            isMember
                                ? '${loyalty.currentBalance} Loyalty\nPoints Ready.'
                                : 'A little loyalty.\nA lot to love.',
                            style: GoogleFonts.playfairDisplay(
                              color: const Color(0xFF23140E),
                              fontSize: 16.5,
                              fontWeight: FontWeight.w800,
                              height: 1.18,
                            ),
                            maxLines: 2,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 11,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [
                                Color(0xFFF0C068),
                                Color(0xFFDDA548),
                              ],
                            ),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                'Explore Rewards',
                                style: GoogleFonts.poppins(
                                  color: const Color(0xFF3A060B),
                                  fontWeight: FontWeight.w700,
                                  fontSize: 10.5,
                                ),
                              ),
                              const SizedBox(width: 2),
                              const Icon(
                                Icons.chevron_right_rounded,
                                color: Color(0xFF3A060B),
                                size: 15,
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 4),
                SizedBox(
                  width: 58,
                  height: 68,
                  child: Image.asset(
                    'assets/images/branded/lassi-lounge/loyalty_gift_clean.png',
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => Image.asset(
                      'assets/images/branded/lassi-lounge/loyalty-gift.png',
                      fit: BoxFit.contain,
                      errorBuilder: (context, error, stackTrace) => const Icon(
                        Icons.card_giftcard,
                        size: 46,
                        color: Color(0xFFC78A22),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
