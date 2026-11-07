import 'package:flutter/material.dart';
import 'package:single_restaurant_mobile/screens/menu_screen.dart';
import 'package:single_restaurant_mobile/utils/image_helper.dart';
import 'package:single_restaurant_mobile/widgets/common/pop_out_capsule_image.dart';

class HomeCategoriesCarousel extends StatelessWidget {
  final List<dynamic> categories;
  final ValueChanged<String>? onCategoryTap;

  const HomeCategoriesCarousel({
    super.key,
    required this.categories,
    this.onCategoryTap,
  });

  @override
  Widget build(BuildContext context) {
    final textScaler = MediaQuery.textScalerOf(context);
    final carouselHeight =
        (118.0 + (textScaler.scale(13.0) - 13.0) * 3.0).clamp(116.0, 146.0);

    return SizedBox(
      height: carouselHeight,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        physics: const BouncingScrollPhysics(),
        itemBuilder: (context, index) {
          final category = categories[index];
          final name = (category['name'] ?? 'Category').toString();
          final imageUrl = ImageHelper.getCategoryImageUrl(category);

          return Padding(
            padding: const EdgeInsets.only(right: 12.0),
            child: PopOutCapsuleImage(
              width: 74.0,
              imageUrl: imageUrl,
              label: name,
              onTap: () {
                if (onCategoryTap != null) {
                  onCategoryTap!(category['_id']);
                } else {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => MenuScreen(
                        initialCategoryId: category['_id'],
                      ),
                    ),
                  );
                }
              },
            ),
          );
        },
      ),
    );
  }
}
