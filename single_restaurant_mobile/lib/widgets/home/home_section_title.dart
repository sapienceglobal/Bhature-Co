import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class HomeSectionTitle extends StatelessWidget {
  final String title;
  final VoidCallback onViewAll;

  const HomeSectionTitle({
    super.key,
    required this.title,
    required this.onViewAll,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Flexible(
            child: Text(
              title,
              style: GoogleFonts.playfairDisplay(
                fontSize: 20.5,
                fontWeight: FontWeight.w800,
                color: const Color(0xFF23140E),
                height: 1.15,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          InkWell(
            onTap: onViewAll,
            borderRadius: BorderRadius.circular(6),
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'View all',
                    style: GoogleFonts.poppins(
                      color: const Color(0xFF720A15),
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(width: 2),
                  const Icon(
                    Icons.chevron_right_rounded,
                    size: 18,
                    color: Color(0xFF720A15),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
