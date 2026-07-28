import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/platform/breakpoints.dart';
import '../../features/notifications/presentation/providers/notifications_providers.dart';

/// Shell wrapping every authenticated route. Same [navigationShell] and
/// destination set on every platform — only the chrome changes: bottom nav
/// on phone width, a persistent sidebar (`NavigationRail`) from tablet width
/// up.
///
/// On phone the bottom nav scrolls horizontally for the extra destinations;
/// on tablet/desktop the sidebar shows all modules vertically.
class AppShell extends ConsumerWidget {
  const AppShell({required this.navigationShell, super.key});

  final StatefulNavigationShell navigationShell;

  static const List<_Destination> _destinations = <_Destination>[
    _Destination(
      icon: Icons.home_outlined,
      selectedIcon: Icons.home,
      label: 'Home',
    ),
    _Destination(
      icon: Icons.inventory_2_outlined,
      selectedIcon: Icons.inventory_2,
      label: 'Products',
    ),
    _Destination(
      icon: Icons.point_of_sale_outlined,
      selectedIcon: Icons.point_of_sale,
      label: 'Sales',
    ),
    _Destination(
      icon: Icons.account_balance_outlined,
      selectedIcon: Icons.account_balance,
      label: 'Finance',
    ),
    _Destination(
      icon: Icons.people_outline,
      selectedIcon: Icons.people,
      label: 'People',
    ),
    _Destination(
      icon: Icons.notifications_outlined,
      selectedIcon: Icons.notifications,
      label: 'Alerts',
    ),
    _Destination(
      icon: Icons.local_shipping_outlined,
      selectedIcon: Icons.local_shipping,
      label: 'Supply Chain',
    ),
    _Destination(
      icon: Icons.shopping_cart_outlined,
      selectedIcon: Icons.shopping_cart,
      label: 'POS',
    ),
    _Destination(
      icon: Icons.precision_manufacturing_outlined,
      selectedIcon: Icons.precision_manufacturing,
      label: 'Manufacturing',
    ),
    _Destination(
      icon: Icons.work_outline,
      selectedIcon: Icons.work,
      label: 'Projects',
    ),
    _Destination(
      icon: Icons.description_outlined,
      selectedIcon: Icons.description,
      label: 'Documents',
    ),
    _Destination(
      icon: Icons.alt_route_outlined,
      selectedIcon: Icons.alt_route,
      label: 'Workflow',
    ),
  ];

  void _onSelect(int index) => navigationShell.goBranch(
    index,
    initialLocation: index == navigationShell.currentIndex,
  );

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final int unread = ref.watch(unreadNotificationCountProvider);

    return isDesktopShell(context)
        ? _DesktopShell(
            navigationShell: navigationShell,
            unread: unread,
            onSelect: _onSelect,
            destinations: _destinations,
          )
        : _MobileShell(
            navigationShell: navigationShell,
            unread: unread,
            onSelect: _onSelect,
            destinations: _destinations,
          );
  }
}

class _MobileShell extends StatelessWidget {
  const _MobileShell({
    required this.navigationShell,
    required this.unread,
    required this.onSelect,
    required this.destinations,
  });

  final StatefulNavigationShell navigationShell;
  final int unread;
  final ValueChanged<int> onSelect;
  final List<_Destination> destinations;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: NavigationBar(
          selectedIndex: navigationShell.currentIndex,
          onDestinationSelected: onSelect,
          height: 64,
          destinations: <Widget>[
            for (final _Destination d in destinations)
              NavigationDestination(
                icon: d.withUnreadBadge(unread),
                selectedIcon: Icon(d.selectedIcon),
                label: d.label,
              ),
          ],
        ),
      ),
    );
  }
}

class _DesktopShell extends StatelessWidget {
  const _DesktopShell({
    required this.navigationShell,
    required this.unread,
    required this.onSelect,
    required this.destinations,
  });

  final StatefulNavigationShell navigationShell;
  final int unread;
  final ValueChanged<int> onSelect;
  final List<_Destination> destinations;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Row(
        children: <Widget>[
          NavigationRail(
            selectedIndex: navigationShell.currentIndex,
            onDestinationSelected: onSelect,
            labelType: NavigationRailLabelType.all,
            minExtendedWidth: 80,
            destinations: <NavigationRailDestination>[
              for (final _Destination d in destinations)
                NavigationRailDestination(
                  icon: d.withUnreadBadge(unread),
                  selectedIcon: Icon(d.selectedIcon),
                  label: Text(d.label),
                ),
            ],
          ),
          const VerticalDivider(width: 1),
          Expanded(child: navigationShell),
        ],
      ),
    );
  }
}

class _Destination {
  const _Destination({
    required this.icon,
    required this.selectedIcon,
    required this.label,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;

  Widget withUnreadBadge(int unread) {
    if (label != 'Alerts') return Icon(icon);
    return Badge(
      isLabelVisible: unread > 0,
      label: Text('$unread'),
      child: Icon(icon),
    );
  }
}
