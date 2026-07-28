import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/platform/breakpoints.dart';
import '../../features/notifications/presentation/providers/notifications_providers.dart';

/// Shell wrapping every authenticated route. Same [navigationShell] and
/// destination set on every platform — only the chrome changes: bottom nav
/// on phone width, a persistent sidebar (`NavigationRail`) from tablet width
/// up. See .ai/MULTI_CLIENT_MASTER_PLAN.md § 1 — one Flutter codebase, one
/// route table, adaptive presentation, not separate mobile/desktop apps.
///
/// Kept to 3 destinations (Hick's Law — AGENTS.md Rule 5): more than that on a
/// phone-width nav bar hurts recognition speed, so anything beyond
/// Home/Products/Notifications lives behind Home's quick actions instead.
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
      icon: Icons.notifications_outlined,
      selectedIcon: Icons.notifications,
      label: 'Alerts',
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
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: onSelect,
        destinations: <Widget>[
          for (final _Destination d in destinations)
            NavigationDestination(
              icon: d.withUnreadBadge(unread),
              selectedIcon: Icon(d.selectedIcon),
              label: d.label,
            ),
        ],
      ),
    );
  }
}

/// Persistent sidebar for tablet/desktop window widths — the extra width
/// benefits list-heavy modules with a resizable multi-pane (list + detail)
/// layout in future Tier 1 features; this shell just supplies the sidebar
/// chrome those feature pages render inside.
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

  /// Alerts destination shows the unread count; other destinations ignore it.
  Widget withUnreadBadge(int unread) {
    if (label != 'Alerts') return Icon(icon);
    return Badge(
      isLabelVisible: unread > 0,
      label: Text('$unread'),
      child: Icon(icon),
    );
  }
}
