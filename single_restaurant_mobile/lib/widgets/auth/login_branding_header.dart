import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';

/// Branding header specifically matching the authentic Bhatura & Co identity.
class LoginBrandingHeader extends StatelessWidget {
  final bool isSignIn;

  const LoginBrandingHeader({
    super.key,
    this.isSignIn = true,
  });

  Widget _buildLogo(bool isCompact) {
    return Image.asset(
      'assets/images/branded/lassi-lounge/Lassi-Lounge-logo.png',
      height: isCompact ? (isSignIn ? 64.0 : 52.0) : 92.0,
      fit: BoxFit.contain,
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isCompact = size.height < 720 || size.width < 380;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        _buildLogo(isCompact),
        const SizedBox(height: 4),
        AnimatedSize(
          duration: const Duration(milliseconds: 260),
          curve: Curves.easeInOutCubic,
          alignment: Alignment.topCenter,
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 220),
            child: KeyedSubtree(
              key: ValueKey<bool>(isSignIn),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  FittedBox(
                    fit: BoxFit.scaleDown,
                    child: Text.rich(
                      TextSpan(
                        text: isSignIn ? 'Welcome ' : 'Create ',
                        style: GoogleFonts.playfairDisplay(
                          fontSize: isCompact ? (isSignIn ? 26 : 24) : 28,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textDark,
                          letterSpacing: -0.3,
                        ),
                        children: [
                          TextSpan(
                            text: isSignIn ? 'Back!' : 'Account',
                            style: const TextStyle(
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  SizedBox(height: isCompact ? 3 : 5),
                  Text(
                    isSignIn
                        ? 'Sign in to your Bhatura & Co account\nand enjoy hot, fluffy bhature & delicacies.'
                        : 'Join Bhatura & Co and enjoy\nauthentic delicacies & royal rewards.',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      color: AppColors.textLight,
                      fontSize: isCompact ? 11.5 : 12.5,
                      height: 1.35,
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ],
    );
  }
}
