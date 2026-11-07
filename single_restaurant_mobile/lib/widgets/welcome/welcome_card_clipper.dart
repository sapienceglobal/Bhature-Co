import 'package:flutter/material.dart';

/// Custom clipper generating the signature wave curve along the top
/// boundary of the Bhatura & Co welcome screen cream card.
class WelcomeCardClipper extends CustomClipper<Path> {
  const WelcomeCardClipper();

  static Path buildWaveTopPath(double w) {
    final path = Path();
    path.moveTo(0, 38);
    path.cubicTo(w * 0.12, 8, w * 0.25, 6, w * 0.38, 16);
    path.cubicTo(w * 0.52, 27, w * 0.66, 34, w * 0.80, 22);
    path.cubicTo(w * 0.90, 14, w * 0.96, 8, w, 4);
    return path;
  }

  @override
  Path getClip(Size size) {
    final w = size.width;
    final h = size.height;
    final path = buildWaveTopPath(w);
    path.lineTo(w, h);
    path.lineTo(0, h);
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant CustomClipper<Path> oldClipper) => false;
}

/// Draws the warm golden trim line along the top wave of the welcome card.
class WelcomeWaveBorderPainter extends CustomPainter {
  const WelcomeWaveBorderPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final wavePath = WelcomeCardClipper.buildWaveTopPath(size.width);
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round
      ..shader = const LinearGradient(
        colors: [
          Color(0xFFD59B3E),
          Color(0xFFF3C66F),
          Color(0xFFD89E42),
          Color(0xFFF5CA76),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, 45));

    canvas.drawPath(wavePath, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
