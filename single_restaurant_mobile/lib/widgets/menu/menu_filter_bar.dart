import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class MenuFilterBar extends StatelessWidget {
  final String vegFilter;
  final List<String> availableVegFilters;
  final String spiceFilter;
  final String sortOrder;
  final ValueChanged<String> onVegFilterChanged;
  final ValueChanged<String>? onSpiceFilterChanged;
  final ValueChanged<String> onSortOrderChanged;

  const MenuFilterBar({
    super.key,
    required this.vegFilter,
    this.availableVegFilters = const ['All', 'Veg', 'Non-Veg'],
    this.spiceFilter = 'All',
    required this.sortOrder,
    required this.onVegFilterChanged,
    this.onSpiceFilterChanged,
    required this.onSortOrderChanged,
  });

  static Widget _buildVegSymbol({required bool isVeg, double size = 12}) {
    final color = isVeg ? const Color(0xFF1B8A3D) : const Color(0xFFC62828);
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: color, width: 1.3),
        borderRadius: BorderRadius.circular(3),
      ),
      alignment: Alignment.center,
      child: Container(
        width: size * 0.46,
        height: size * 0.46,
        decoration: BoxDecoration(
          color: color,
          shape: BoxShape.circle,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final effectiveVeg = availableVegFilters.contains(vegFilter)
        ? vegFilter
        : availableVegFilters.first;

    final String shortSort = sortOrder == 'Popularity'
        ? 'Popular'
        : sortOrder == 'Price: Low to High'
            ? 'Low-High'
            : 'High-Low';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
      child: Row(
        children: [
          // 1. Filters Chip (Veg / Non-Veg / All)
          Expanded(
            flex: 28,
            child: PopupMenuButton<String>(
              onSelected: onVegFilterChanged,
              color: const Color(0xFFFDF9F2),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: Color(0xFFE4D4C0)),
              ),
              itemBuilder: (context) => availableVegFilters.map((val) {
                return PopupMenuItem<String>(
                  value: val,
                  child: Row(
                    children: [
                      if (val == 'Veg') ...[
                        _buildVegSymbol(isVeg: true, size: 13),
                        const SizedBox(width: 8),
                      ] else if (val == 'Non-Veg') ...[
                        _buildVegSymbol(isVeg: false, size: 13),
                        const SizedBox(width: 8),
                      ] else ...[
                        const Icon(
                          Icons.filter_alt_outlined,
                          size: 15,
                          color: Color(0xFF3E2E28),
                        ),
                        const SizedBox(width: 8),
                      ],
                      Text(
                        val == 'All' ? 'All Items' : val,
                        style: GoogleFonts.poppins(
                          fontSize: 13,
                          fontWeight: effectiveVeg == val
                              ? FontWeight.w700
                              : FontWeight.w500,
                          color: const Color(0xFF23140E),
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
              child: Container(
                height: 36,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFDF9F2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: effectiveVeg != 'All'
                        ? const Color(0xFF720A15)
                        : const Color(0xFFE4D4C0),
                    width: 1.0,
                  ),
                ),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      if (effectiveVeg == 'Veg') ...[
                        _buildVegSymbol(isVeg: true, size: 12),
                        const SizedBox(width: 5),
                      ] else if (effectiveVeg == 'Non-Veg') ...[
                        _buildVegSymbol(isVeg: false, size: 12),
                        const SizedBox(width: 5),
                      ] else ...[
                        const Icon(
                          Icons.filter_alt_outlined,
                          size: 16,
                          color: Color(0xFF23140E),
                        ),
                        const SizedBox(width: 4),
                      ],
                      Text(
                        effectiveVeg == 'All' ? 'Filters' : effectiveVeg,
                        style: GoogleFonts.poppins(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF23140E),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(width: 8),

          // 2. Spice level Chip
          Expanded(
            flex: 36,
            child: PopupMenuButton<String>(
              onSelected: (val) {
                if (onSpiceFilterChanged != null) {
                  onSpiceFilterChanged!(val);
                }
              },
              color: const Color(0xFFFDF9F2),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: Color(0xFFE4D4C0)),
              ),
              itemBuilder: (context) => const [
                PopupMenuItem(value: 'All', child: Text('All Spice Levels')),
                PopupMenuItem(value: 'Mild', child: Text('Mild')),
                PopupMenuItem(value: 'Medium', child: Text('Medium / Spicy')),
              ],
              child: Container(
                height: 36,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFDF9F2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: spiceFilter != 'All'
                        ? const Color(0xFF720A15)
                        : const Color(0xFFE4D4C0),
                    width: 1.0,
                  ),
                ),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        spiceFilter == 'All'
                            ? 'Spice level'
                            : 'Spice: $spiceFilter',
                        style: GoogleFonts.poppins(
                          fontSize: 12.5,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF23140E),
                        ),
                      ),
                      const SizedBox(width: 4),
                      const Icon(
                        Icons.keyboard_arrow_down_rounded,
                        size: 17,
                        color: Color(0xFF23140E),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          const SizedBox(width: 8),

          // 3. Sort Chip
          Expanded(
            flex: 36,
            child: PopupMenuButton<String>(
              onSelected: onSortOrderChanged,
              color: const Color(0xFFFDF9F2),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: Color(0xFFE4D4C0)),
              ),
              itemBuilder: (context) => [
                'Popularity',
                'Price: Low to High',
                'Price: High to Low',
              ].map((val) {
                return PopupMenuItem<String>(
                  value: val,
                  child: Text(
                    val,
                    style: GoogleFonts.poppins(
                      fontSize: 13,
                      fontWeight: sortOrder == val
                          ? FontWeight.w700
                          : FontWeight.w500,
                      color: sortOrder == val
                          ? const Color(0xFF720A15)
                          : const Color(0xFF23140E),
                    ),
                  ),
                );
              }).toList(),
              child: Container(
                height: 36,
                padding: const EdgeInsets.symmetric(horizontal: 10),
                decoration: BoxDecoration(
                  color: const Color(0xFFFDF9F2),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFFE4D4C0),
                    width: 1.0,
                  ),
                ),
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      RichText(
                        text: TextSpan(
                          style: GoogleFonts.poppins(fontSize: 12.5),
                          children: [
                            const TextSpan(
                              text: 'Sort: ',
                              style: TextStyle(
                                color: Color(0xFF4A3A32),
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                            TextSpan(
                              text: shortSort,
                              style: const TextStyle(
                                color: Color(0xFF720A15),
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 3),
                      const Icon(
                        Icons.keyboard_arrow_down_rounded,
                        size: 17,
                        color: Color(0xFF23140E),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
