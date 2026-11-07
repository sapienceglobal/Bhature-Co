import 'package:flutter/material.dart';

/// Top hero banner for Bhatura & Co Welcome Screen.
/// Features a rich royal maroon radial backdrop with the circular
/// Bhatura & Co emblem centered prominently.
class WelcomeFoodHeader extends StatelessWidget {
  final double height;

  const WelcomeFoodHeader({
    super.key,
    required this.height,
  });

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.paddingOf(context).top;
    final availableHeight = (height - topPadding - 28.0).clamp(150.0, 380.0);
    final emblemSize = (availableHeight * 0.90).clamp(170.0, 320.0);

    return Container(
      height: height,
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: RadialGradient(
          center: Alignment(0.0, -0.1),
          radius: 0.95,
          colors: [
            Color(0xFF7A0D18),
            Color(0xFF590710),
            Color(0xFF3E040A),
          ],
          stops: [0.0, 0.65, 1.0],
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Center(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 18.0),
            child: Image.asset(
              'assets/images/branded/bhatura-and-co/logo-full.png',
              width: emblemSize,
              height: emblemSize,
              fit: BoxFit.contain,
              filterQuality: FilterQuality.high,
            ),
          ),
        ),
      ),
    );
  }
}
