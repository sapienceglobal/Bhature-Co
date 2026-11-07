import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:single_restaurant_mobile/constants/colors.dart';
import 'package:single_restaurant_mobile/providers/restaurant_provider.dart';
import 'package:single_restaurant_mobile/providers/cart_provider.dart';
import 'package:single_restaurant_mobile/widgets/menu_item_card.dart';
import 'package:single_restaurant_mobile/widgets/shimmer_loading.dart';
import 'package:single_restaurant_mobile/utils/cart_helper.dart';
import 'package:single_restaurant_mobile/screens/search_screen.dart';
import 'package:single_restaurant_mobile/screens/cart_screen.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/menu/menu_categories_popup.dart';
import 'package:single_restaurant_mobile/widgets/menu/menu_category_strip.dart';
import 'package:single_restaurant_mobile/widgets/menu/menu_filter_bar.dart';
import 'package:single_restaurant_mobile/widgets/menu/menu_loyalty_banner.dart';
import 'package:single_restaurant_mobile/utils/category_helper.dart';
import 'package:single_restaurant_mobile/utils/spice_helper.dart';
import 'package:single_restaurant_mobile/widgets/menu/menu_empty_filter_state.dart';

class MenuScreen extends StatefulWidget {
  final String? initialCategoryId;
  final VoidCallback? onBack;
  const MenuScreen({super.key, this.initialCategoryId, this.onBack});

  @override
  State<MenuScreen> createState() => _MenuScreenState();
}

class _MenuScreenState extends State<MenuScreen> {
  String? _selectedCategoryId;
  String _sortOrder = 'Popularity';
  String _vegFilter = 'All';
  String _spiceFilter = 'All';

  @override
  void initState() {
    super.initState();
    _selectedCategoryId = widget.initialCategoryId;
  }

  @override
  void didUpdateWidget(covariant MenuScreen oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialCategoryId != oldWidget.initialCategoryId &&
        widget.initialCategoryId != null) {
      setState(() => _selectedCategoryId = widget.initialCategoryId);
    }
  }

  Widget _buildCartIcon() {
    return Consumer<CartProvider>(
      builder: (context, cart, child) {
        final itemCount =
            cart.items.fold(0, (sum, i) => sum + ((i['quantity'] ?? i['qty'] ?? 1) as int));
        return Padding(
          padding: const EdgeInsets.only(right: 12.0),
          child: Stack(
            alignment: Alignment.center,
            clipBehavior: Clip.none,
            children: [
              IconButton(
                icon: const Icon(
                  Icons.shopping_bag_outlined,
                  color: Color(0xFF42080E),
                  size: 25,
                ),
                onPressed: () => Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const CartScreen()),
                ),
              ),
              if (itemCount > 0)
                Positioned(
                  right: 5,
                  top: 6,
                  child: Container(
                    padding: const EdgeInsets.all(4.5),
                    decoration: BoxDecoration(
                      color: const Color(0xFF720A15),
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: const Color(0xFFFAF3E8),
                        width: 1.5,
                      ),
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 18,
                      minHeight: 18,
                    ),
                    child: Center(
                      child: Text(
                        '$itemCount',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          height: 1,
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildFloatingViewCartBar() {
    return Consumer<CartProvider>(
      builder: (context, cart, _) {
        final itemCount =
            cart.items.fold(0, (sum, i) => sum + ((i['quantity'] ?? i['qty'] ?? 1) as int));
        if (itemCount <= 0) return const SizedBox.shrink();

        return Container(
          color: const Color(0xFFFAF3E8),
          padding: const EdgeInsets.fromLTRB(16, 4, 16, 10),
          child: GestureDetector(
            onTap: () => Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const CartScreen()),
            ),
            child: Container(
              height: 48,
              padding: const EdgeInsets.symmetric(horizontal: 18),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [
                    Color(0xFF730B17),
                    Color(0xFF590710),
                  ],
                ),
                borderRadius: BorderRadius.circular(26),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF4A0810).withValues(alpha: 0.25),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  const Icon(
                    Icons.shopping_bag_outlined,
                    color: Colors.white,
                    size: 20,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      '$itemCount ${itemCount == 1 ? 'item' : 'items'} added',
                      style: GoogleFonts.poppins(
                        color: Colors.white,
                        fontSize: 13.5,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Container(
                    height: 20,
                    width: 1.0,
                    margin: const EdgeInsets.symmetric(horizontal: 14),
                    color: Colors.white.withValues(alpha: 0.35),
                  ),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        'View Cart',
                        style: GoogleFonts.poppins(
                          color: Colors.white,
                          fontSize: 13.5,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 6),
                      const Icon(
                        Icons.arrow_forward_rounded,
                        color: Colors.white,
                        size: 18,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final restaurantProvider = Provider.of<RestaurantProvider>(context);
    final categories = restaurantProvider.menu;

    if (categories.isEmpty) {
      if (restaurantProvider.isLoading) {
        return const MenuShimmer();
      }
      return const Center(child: Text('No menu available.'));
    }

    if (_selectedCategoryId == null && categories.isNotEmpty) {
      _selectedCategoryId = 'all';
    }

    final displayCategories = [
      {'_id': 'all', 'name': 'All'},
      ...categories
    ];

    List<dynamic> rawCategoryItems = [];
    if (_selectedCategoryId == 'all') {
      for (var cat in categories) {
        rawCategoryItems.addAll(cat['items'] ?? []);
      }
    } else {
      final selectedCategory = categories.firstWhere(
        (c) => c['_id'] == _selectedCategoryId,
        orElse: () => categories[0],
      );
      rawCategoryItems = List.from(selectedCategory['items'] ?? []);
    }

    final hasVeg = rawCategoryItems.any((i) => i['isVeg'] == true);
    final hasNonVeg = rawCategoryItems.any((i) => i['isVeg'] == false);
    final availableVegFilters = (hasVeg && !hasNonVeg)
        ? const ['Veg']
        : (!hasVeg && hasNonVeg)
            ? const ['Non-Veg']
            : const ['All', 'Veg', 'Non-Veg'];

    final effectiveVegFilter = availableVegFilters.contains(_vegFilter)
        ? _vegFilter
        : availableVegFilters.first;

    List<dynamic> items = List.from(rawCategoryItems);
    if (effectiveVegFilter == 'Veg') {
      items = items.where((i) => i['isVeg'] == true).toList();
    } else if (effectiveVegFilter == 'Non-Veg') {
      items = items.where((i) => i['isVeg'] == false).toList();
    }

    if (_spiceFilter == 'Mild') {
      items = items
          .where((i) =>
              i is Map<String, dynamic> &&
              SpiceHelper.canCustomizeSpice(i) &&
              i['isSpicy'] != true)
          .toList();
    } else if (_spiceFilter == 'Medium') {
      items = items
          .where((i) =>
              i is Map<String, dynamic> &&
              SpiceHelper.canCustomizeSpice(i) &&
              i['isSpicy'] == true)
          .toList();
    }

    if (_sortOrder == 'Price: Low to High') {
      items.sort((a, b) => (a['price'] ?? 0).compareTo(b['price'] ?? 0));
    } else if (_sortOrder == 'Price: High to Low') {
      items.sort((a, b) => (b['price'] ?? 0).compareTo(a['price'] ?? 0));
    }

    final currentCategory = displayCategories.firstWhere(
      (c) => c['_id'] == _selectedCategoryId,
      orElse: () => displayCategories[0],
    );

    final isAllCategory = _selectedCategoryId == 'all';
    final sectionTitle = isAllCategory
        ? 'All Favourites'
        : (currentCategory['name'] ?? '').toString();
    final sectionSubtitle = isAllCategory
        ? 'Made fresh. Served with love.'
        : CategoryHelper.getCategoryDescription(currentCategory);

    return Scaffold(
      backgroundColor: const Color(0xFFFAF3E8),
      appBar: AppBar(
        backgroundColor: const Color(0xFFFAF3E8),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(
            Icons.arrow_back_rounded,
            color: Color(0xFF720A15),
            size: 25,
          ),
          onPressed: () {
            if (widget.onBack != null) {
              widget.onBack!();
            } else if (Navigator.canPop(context)) {
              Navigator.pop(context);
            }
          },
        ),
        title: Image.asset(
          'assets/images/branded/bhatura-and-co/logo-emblem.png',
          height: 48,
          fit: BoxFit.contain,
          errorBuilder: (c, e, s) => Text(
            'Bhatura & Co',
            style: GoogleFonts.playfairDisplay(
              color: AppColors.primary,
              fontWeight: FontWeight.bold,
              fontSize: 20,
            ),
          ),
        ),
        actions: [
          _buildCartIcon(),
        ],
      ),
      body: ResponsiveCenter(
        maxWidth: AppResponsive.maxContentWidth,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top "Our Menu" Heading + Search Pill
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 2, 16, 10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Our Menu',
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 26,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF6B0A14),
                      height: 1.1,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'Your favourites, freshly prepared.',
                    style: GoogleFonts.poppins(
                      fontSize: 12.5,
                      color: const Color(0xFF4A3A32),
                      fontWeight: FontWeight.w400,
                    ),
                  ),
                  const SizedBox(height: 10),
                  GestureDetector(
                    onTap: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const SearchScreen(),
                      ),
                    ),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 14,
                        vertical: 9.5,
                      ),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFDF9F2),
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: const Color(0xFFE4D4C0),
                          width: 1.0,
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(
                            Icons.search_rounded,
                            color: Color(0xFF3D271D),
                            size: 20,
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'Search for your favourite food',
                              style: GoogleFonts.poppins(
                                fontSize: 13.0,
                                fontWeight: FontWeight.w400,
                                color: const Color(0xFF6B5A50),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // Circular Medallion Category Strip
            MenuCategoryStrip(
              displayCategories: displayCategories,
              selectedCategoryId: _selectedCategoryId,
              onSelectCategory: (id) => setState(() {
                _selectedCategoryId = id;
                _vegFilter = 'All';
              }),
              onMoreTap: () => MenuCategoriesPopup.show(
                context: context,
                categories: displayCategories,
                selectedCategoryId: _selectedCategoryId,
                onSelectCategory: (id) => setState(() {
                  _selectedCategoryId = id;
                  _vegFilter = 'All';
                }),
              ),
            ),

            // 3-Pill Filter Bar (Filters, Spice level, Sort)
            MenuFilterBar(
              vegFilter: effectiveVegFilter,
              availableVegFilters: availableVegFilters,
              spiceFilter: _spiceFilter,
              sortOrder: _sortOrder,
              onVegFilterChanged: (v) => setState(() => _vegFilter = v),
              onSpiceFilterChanged: (sp) => setState(() => _spiceFilter = sp),
              onSortOrderChanged: (s) => setState(() => _sortOrder = s),
            ),

            // Items List
            Expanded(
              child: ListView(
                padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
                children: [
                  Text(
                    sectionTitle,
                    style: GoogleFonts.playfairDisplay(
                      fontSize: 23,
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF6B0A14),
                      height: 1.15,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    sectionSubtitle,
                    style: GoogleFonts.poppins(
                      color: const Color(0xFF4A3A32),
                      fontSize: 12.5,
                    ),
                  ),
                  const SizedBox(height: 14),

                  if (items.isEmpty)
                    MenuEmptyFilterState(
                      vegFilter: effectiveVegFilter,
                      categoryName: currentCategory['name'] ?? '',
                      onResetFilter: () => setState(() {
                        _vegFilter = 'All';
                        _spiceFilter = 'All';
                      }),
                      onShowAllCategories: () =>
                          setState(() => _selectedCategoryId = 'all'),
                    )
                  else
                    Consumer<CartProvider>(
                      builder: (context, cart, child) {
                        return Column(
                          children: items.map((item) {
                            final dishId = item['_id'] ?? item['id'];
                            int totalQty = 0;
                            int lastMatchIndex = -1;
                            for (int i = 0; i < cart.items.length; i++) {
                              final c = cart.items[i];
                              if ((c['menuItemId'] ?? c['_id'] ?? c['id']) ==
                                  dishId) {
                                totalQty +=
                                    (c['quantity'] ?? c['qty'] ?? 1) as int;
                                lastMatchIndex = i;
                              }
                            }
                            return MenuItemCard(
                              item: item,
                              cartQty: totalQty,
                              onAdd: () => AddToCartHelper.handleAddToCart(
                                context,
                                item,
                                cart,
                                restaurantProvider,
                              ),
                              onIncrement: () =>
                                  AddToCartHelper.handleAddToCart(
                                context,
                                item,
                                cart,
                                restaurantProvider,
                              ),
                              onDecrement: () {
                                if (lastMatchIndex != -1) {
                                  final lastQty = (cart.items[lastMatchIndex]
                                          ['quantity'] ??
                                      cart.items[lastMatchIndex]['qty'] ??
                                      1) as int;
                                  cart.updateQuantity(
                                    lastMatchIndex,
                                    lastQty - 1,
                                  );
                                }
                              },
                            );
                          }).toList(),
                        );
                      },
                    ),

                  const SizedBox(height: 16),
                  const MenuLoyaltyBanner(),
                  const SizedBox(height: 20),
                ],
              ),
            ),

            // Floating View Cart Pill Bar above Bottom Navbar
            _buildFloatingViewCartBar(),
          ],
        ),
      ),
    );
  }
}
