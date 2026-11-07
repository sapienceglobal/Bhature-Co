import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class FastDeliveryCard extends StatelessWidget {
  const FastDeliveryCard({super.key});

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.sizeOf(context).width;
    final cardWidth = ((screenWidth - 42.0) / 2.0).clamp(158.0, 215.0);

    return Container(
      width: cardWidth,
      height: 140,
      margin: const EdgeInsets.only(right: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF2B1316),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(
          color: const Color(0xFF720A15).withValues(alpha: 0.4),
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Row(
              children: [
                const Icon(Icons.two_wheeler, color: Color(0xFFF2C26B), size: 15),
                const SizedBox(width: 6),
                Text(
                  'FAST DELIVERY',
                  style: GoogleFonts.poppins(
                    color: const Color(0xFFF2C26B),
                    fontWeight: FontWeight.w700,
                    fontSize: 10,
                    letterSpacing: 0.7,
                  ),
                ),
              ],
            ),
          ),
          FittedBox(
            fit: BoxFit.scaleDown,
            alignment: Alignment.centerLeft,
            child: Row(
              children: [
                const Icon(
                  Icons.delivery_dining,
                  color: Color(0xFFF2C26B),
                  size: 34,
                ),
                const SizedBox(width: 8),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '30-40',
                      style: GoogleFonts.playfairDisplay(
                        color: const Color(0xFFFAF3E6),
                        fontSize: 21,
                        fontWeight: FontWeight.w900,
                        height: 1.0,
                      ),
                    ),
                    Text(
                      'mins',
                      style: GoogleFonts.poppins(
                        color: const Color(0xFFFAF3E6),
                        fontSize: 13,
                        height: 1.1,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Text(
            'Hot & Fresh to Doorstep',
            style: GoogleFonts.poppins(
              color: const Color(0xFFEBD7B9),
              fontSize: 10.5,
              fontWeight: FontWeight.w500,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}
