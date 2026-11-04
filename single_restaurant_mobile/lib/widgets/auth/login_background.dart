import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

/// Background decorator providing warm royal ivory/cream backdrop
/// and authentic Qutub Minar Delhi/North Indian heritage monuments footer.
class LoginBackground extends StatelessWidget {
  final Widget child;

  const LoginBackground({
    super.key,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.background,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Bottom Indian Heritage Minar Skyline Footer
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: IgnorePointer(
              child: Image.asset(
                'assets/images/branded/lassi-lounge/login_monuments_footer.png',
                width: double.infinity,
                fit: BoxFit.fitWidth,
                alignment: Alignment.bottomCenter,
              ),
            ),
          ),
          // Foreground Content
          child,
        ],
      ),
    );
  }
}
