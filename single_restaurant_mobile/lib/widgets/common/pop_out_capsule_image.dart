import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// ---------------------------------------------------------------------------
/// TUNE-ABLE CONSTANTS FOR PHYSICAL DEVICE ADJUSTMENTS
/// ---------------------------------------------------------------------------
/// Circular aspect ratio: Height = Width * kOvalAspectRatio (1.0 = perfect circle)
const double kOvalAspectRatio = 1.0;

/// Dish scale relative to circle width
const double kDishScale = 1.02;

/// Dish vertical offset percentage
const double kDishYOffsetPercent = 0.0;

/// Toggle contact shadow directly under the dish
const bool kEnableContactShadow = false;

/// Contact shadow opacity
const double kContactShadowAlpha = 0.12;

/// Contact shadow width factor relative to oval width
const double kContactShadowWidthFactor = 0.56;

/// Contact shadow blur radius
const double kContactShadowBlur = 6.0;

/// Category Tile Widget featuring a circular warm-cream medallion with
/// golden/maroon ring and bold serif label matching the Bhatura & Co identity.
class PopOutCapsuleImage extends StatelessWidget {
  final String? imageUrl;
  final IconData? icon;
  final String? label;
  final double width;
  final bool isSelected;
  final VoidCallback? onTap;
  final bool? forceClipOval;

  const PopOutCapsuleImage({
    super.key,
    this.imageUrl,
    this.icon,
    this.label,
    this.width = 74.0,
    this.isSelected = false,
    this.onTap,
    this.forceClipOval,
  });

  bool get _isOpaquePhoto {
    if (forceClipOval != null) return forceClipOval!;
    if (imageUrl == null) return false;
    final lower = imageUrl!.toLowerCase();
    return lower.endsWith('.jpg') || lower.endsWith('.jpeg');
  }

  String _formatTitleCase(String text) {
    final trimmed = text.trim();
    if (trimmed.isEmpty) return trimmed;
    return trimmed
        .split(RegExp(r'\s+'))
        .map((word) {
          if (word.isEmpty) return word;
          if (word.toLowerCase() == '&') return '&';
          return '${word[0].toUpperCase()}${word.substring(1).toLowerCase()}';
        })
        .join(' ');
  }

  @override
  Widget build(BuildContext context) {
    final ovalHeight = width * kOvalAspectRatio;
    final dishSize = width * kDishScale;
    final dishYOffset = ovalHeight * kDishYOffsetPercent;
    final dishTop = ((ovalHeight - dishSize) / 2) + dishYOffset;

    Widget capsuleContent = SizedBox(
      width: width,
      height: ovalHeight,
      child: Stack(
        alignment: Alignment.center,
        clipBehavior: Clip.none,
        children: [
          // 1. Circular Medallion Backdrop with Ring
          _buildBackdrop(width, ovalHeight),

          // 2. Contact Shadow (if enabled)
          if (kEnableContactShadow && icon == null)
            Positioned(
              top: dishTop + (dishSize * 0.86),
              child: _buildContactShadow(width),
            ),

          // 3. Dish image clipped neatly inside medallion or slightly popping
          Positioned(
            top: dishTop,
            child: SizedBox(
              width: dishSize - 5,
              height: dishSize - 5,
              child: ClipOval(
                child: _buildDish(dishSize - 5),
              ),
            ),
          ),
        ],
      ),
    );

    if (label == null || label!.isEmpty) {
      if (onTap != null) {
        return GestureDetector(
          onTap: onTap,
          behavior: HitTestBehavior.opaque,
          child: capsuleContent,
        );
      }
      return capsuleContent;
    }

    final tileWidth = (width + 10.0);
    Widget tile = SizedBox(
      width: tileWidth,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          capsuleContent,
          const SizedBox(height: 6),
          Text(
            _formatTitleCase(label!),
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.playfairDisplay(
              fontSize: 13.0,
              fontWeight: isSelected ? FontWeight.w800 : FontWeight.w700,
              color: isSelected
                  ? const Color(0xFF720A15)
                  : const Color(0xFF23140E),
              height: 1.12,
            ),
          ),
          if (isSelected) ...[
            const SizedBox(height: 4),
            Container(
              width: 34,
              height: 2.8,
              decoration: BoxDecoration(
                color: const Color(0xFF720A15),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ],
        ],
      ),
    );

    if (onTap != null) {
      return GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: tile,
      );
    }
    return tile;
  }

  Widget _buildBackdrop(double w, double h) {
    return Container(
      width: w,
      height: h,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: const RadialGradient(
          center: Alignment.center,
          radius: 0.78,
          colors: [
            Color(0xFFFDF7EC),
            Color(0xFFF3E4CE),
          ],
        ),
        border: Border.all(
          color: isSelected
              ? const Color(0xFF720A15)
              : const Color(0xFFDDC8AD),
          width: isSelected ? 2.6 : 1.6,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4A0810).withValues(alpha: 0.08),
            blurRadius: 8,
            offset: const Offset(0, 3),
          ),
        ],
      ),
    );
  }

  Widget _buildContactShadow(double w) {
    final shadowWidth = w * kContactShadowWidthFactor;
    return Container(
      width: shadowWidth,
      height: 5.0,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.all(
          Radius.elliptical(shadowWidth / 2, 2.5),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: kContactShadowAlpha),
            blurRadius: kContactShadowBlur,
            spreadRadius: 1.0,
            offset: const Offset(0, 1),
          ),
        ],
      ),
    );
  }

  Widget _buildDish(double size) {
    if (icon != null) {
      return Center(
        child: Icon(
          icon,
          size: size * 0.48,
          color: isSelected
              ? const Color(0xFF720A15)
              : const Color(0xFF6B0A14),
        ),
      );
    }

    if (imageUrl == null || imageUrl!.isEmpty) {
      return Center(
        child: Icon(
          Icons.restaurant,
          size: size * 0.45,
          color: const Color(0xFF9C846C),
        ),
      );
    }

    Widget imageWidget;
    if (imageUrl!.startsWith('http')) {
      imageWidget = CachedNetworkImage(
        imageUrl: imageUrl!,
        fit: _isOpaquePhoto ? BoxFit.cover : BoxFit.contain,
        placeholder: (context, url) => const SizedBox(),
        errorWidget: (context, url, error) => Center(
          child: Icon(Icons.restaurant, size: size * 0.4, color: Colors.grey),
        ),
      );
    } else {
      final assetPath =
          imageUrl!.startsWith('/') ? imageUrl!.substring(1) : imageUrl!;
      imageWidget = Image.asset(
        assetPath,
        fit: _isOpaquePhoto ? BoxFit.cover : BoxFit.contain,
        filterQuality: FilterQuality.high,
        errorBuilder: (context, error, stackTrace) => Center(
          child: Icon(Icons.restaurant, size: size * 0.4, color: Colors.grey),
        ),
      );
    }

    return imageWidget;
  }
}
