import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/utils/formatters.dart';

class CartBottomBar extends StatelessWidget {
  final double total;
  final String? currency;
  final bool canProceed;
  final String errorReason;
  final VoidCallback? onProceed;

  const CartBottomBar({
    super.key,
    required this.total,
    this.currency,
    this.canProceed = true,
    this.errorReason = '',
    this.onProceed,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF4A090B),
        border: Border(top: BorderSide(color: Color(0x35D4AF37), width: 1.5)),
        boxShadow: [
          BoxShadow(
            color: Colors.black26,
            blurRadius: 10,
            offset: Offset(0, -3),
          ),
        ],
      ),
      child: SafeArea(
        bottom: true,
        top: false,
        child: ResponsiveCenter(
          maxWidth: 600,
          heightFactor: 1.0,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                // Left Price
                Expanded(
                  flex: 4,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      FittedBox(
                        fit: BoxFit.scaleDown,
                        alignment: Alignment.centerLeft,
                        child: Text(
                          Formatters.formatCurrency(total, currency),
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontWeight: FontWeight.w900,
                            fontSize: 22,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  width: 1,
                  height: 32,
                  color: Colors.white24,
                  margin: const EdgeInsets.symmetric(horizontal: 12),
                ),
                // Right Action Button
                Expanded(
                  flex: 6,
                  child: GestureDetector(
                    onTap: canProceed ? onProceed : null,
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      decoration: BoxDecoration(
                        gradient: canProceed
                            ? const LinearGradient(
                                colors: [Color(0xFF8B1E1E), Color(0xFFA61922), Color(0xFF5C0612)],
                              )
                            : null,
                        color: canProceed ? null : const Color(0xFF8E8E93),
                        borderRadius: BorderRadius.circular(12),
                        border: canProceed
                            ? Border.all(color: const Color(0x60D4AF37), width: 1)
                            : null,
                        boxShadow: canProceed
                            ? [
                                BoxShadow(
                                  color: const Color(0xFF8B1E1E).withValues(alpha: 0.35),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                )
                              ]
                            : null,
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          if (!canProceed) ...[
                            const Icon(
                              Icons.lock,
                              color: Colors.white,
                              size: 16,
                            ),
                            const SizedBox(width: 8),
                          ],
                          Flexible(
                            child: Text(
                              canProceed
                                  ? 'Proceed to Checkout'
                                  : (errorReason.isNotEmpty ? errorReason : 'Delivery Unavailable'),
                              style: GoogleFonts.poppins(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 13,
                              ),
                              overflow: TextOverflow.ellipsis,
                              textAlign: TextAlign.center,
                            ),
                          ),
                          if (canProceed) ...[
                            const SizedBox(width: 6),
                            const Text(
                              '→',
                              style: TextStyle(
                                color: Color(0xFFF5B53D),
                                fontSize: 16,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
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
