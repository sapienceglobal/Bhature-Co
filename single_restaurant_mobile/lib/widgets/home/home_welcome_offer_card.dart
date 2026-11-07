import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:single_restaurant_mobile/screens/offers_screen.dart';
import 'package:single_restaurant_mobile/utils/toast_utils.dart';

class WelcomeOfferCard extends StatefulWidget {
  final Map<String, dynamic> coupon;
  final VoidCallback? onTap;
  final double? width;
  final double? height;
  final EdgeInsetsGeometry? margin;

  const WelcomeOfferCard({
    super.key,
    required this.coupon,
    this.onTap,
    this.width,
    this.height,
    this.margin,
  });

  @override
  State<WelcomeOfferCard> createState() => _WelcomeOfferCardState();
}

class _WelcomeOfferCardState extends State<WelcomeOfferCard>
    with SingleTickerProviderStateMixin {
  bool _isCopied = false;
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );
    _scaleAnimation =
        Tween<double>(begin: 1.0, end: 1.08).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.elasticOut,
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _copyCode() {
    if (_isCopied) return;
    final codeStr = (widget.coupon['code'] ?? 'WELCOME20').toString();
    Clipboard.setData(ClipboardData(text: codeStr));
    ToastUtils.showSuccess(context, 'Coupon code copied!');
    setState(() {
      _isCopied = true;
    });
    _animationController.forward().then((_) => _animationController.reverse());

    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() {
          _isCopied = false;
        });
      }
    });
  }

  void _navigateToOffers() {
    if (widget.onTap != null) {
      widget.onTap!();
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => OffersScreen(onBack: () => Navigator.pop(context)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final coupon = widget.coupon;
    final isPercentage =
        coupon['type'] == 'percentage' || coupon['discountType'] == 'percentage';
    final val = coupon['value'] ?? coupon['discountValue'] ?? 20;
    final discountStr = isPercentage ? '$val% OFF' : '\$$val OFF';
    final rawTitle = coupon['promoType']?.toString().trim();
    final titleStr = (rawTitle != null && rawTitle.isNotEmpty)
        ? rawTitle.toUpperCase()
        : 'FIRST ORDER SPECIAL';
    final code = (coupon['code'] ?? 'WELCOME20').toString().toUpperCase();

    return GestureDetector(
      onTap: _navigateToOffers,
      behavior: HitTestBehavior.opaque,
      child: Container(
        width: widget.width ?? 182,
        height: widget.height ?? 142,
        margin: widget.margin ?? const EdgeInsets.only(left: 16, right: 10),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF6B0A14),
              Color(0xFF4B050C),
            ],
          ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF4B050C).withValues(alpha: 0.22),
              blurRadius: 8,
              offset: const Offset(0, 3),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 11, 12, 9),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Top Header: Gift Icon + FIRST ORDER SPECIAL
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(
                        Icons.card_giftcard_rounded,
                        color: Color(0xFFF2C26B),
                        size: 16,
                      ),
                      const SizedBox(width: 5),
                      Text(
                        titleStr,
                        style: GoogleFonts.poppins(
                          color: const Color(0xFFF2C26B),
                          fontWeight: FontWeight.w700,
                          fontSize: 10.5,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ],
                  ),
                ),

                // Center Big Serif Discount: 20% OFF
                FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    discountStr,
                    style: GoogleFonts.playfairDisplay(
                      color: const Color(0xFFFAF3E6),
                      fontSize: 31,
                      fontWeight: FontWeight.w900,
                      height: 1.0,
                    ),
                  ),
                ),

                // Code Pill Button: Use code WELCOME20
                GestureDetector(
                  onTap: _copyCode,
                  child: ScaleTransition(
                    scale: _scaleAnimation,
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 10,
                        vertical: 5.5,
                      ),
                      decoration: BoxDecoration(
                        color: _isCopied
                            ? const Color(0xFFF2C26B)
                            : const Color(0xFF3E040A).withValues(alpha: 0.45),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: const Color(0xFFE5B55F),
                          width: 1.1,
                        ),
                      ),
                      child: FittedBox(
                        fit: BoxFit.scaleDown,
                        child: RichText(
                          textAlign: TextAlign.center,
                          text: TextSpan(
                            style: GoogleFonts.poppins(
                              fontSize: 11.0,
                              color: _isCopied
                                  ? const Color(0xFF4B050C)
                                  : const Color(0xFFF3E2C7),
                            ),
                            children: _isCopied
                                ? [
                                    TextSpan(
                                      text: 'COPIED: $code ✓',
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                      ),
                                    ),
                                  ]
                                : [
                                    const TextSpan(
                                      text: 'Use code ',
                                      style: TextStyle(
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                    TextSpan(
                                      text: code,
                                      style: const TextStyle(
                                        fontWeight: FontWeight.w800,
                                        color: Color(0xFFFFD88A),
                                      ),
                                    ),
                                  ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                // Bottom T&C apply
                Text(
                  'T&C apply',
                  style: GoogleFonts.poppins(
                    color: const Color(0xFFEBD7B9).withValues(alpha: 0.78),
                    fontSize: 9.0,
                    fontWeight: FontWeight.w400,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
