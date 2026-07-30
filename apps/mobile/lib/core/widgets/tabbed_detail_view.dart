import 'package:flutter/material.dart';

import '../../app/theme/design_tokens.dart';

/// Tab configuration for [TabbedDetailView].
class DetailTab {
  const DetailTab({
    required this.id,
    required this.label,
    required this.builder,
    this.icon,
    this.badge,
  });

  final String id;
  final String label;
  final Widget Function(BuildContext) builder;
  final IconData? icon;
  final String? badge;
}

/// Tabbed dashboard for detail pages.
///
/// Provides a scrollable tab bar and a content area for each tab.
/// Supports nested scrolling inside tab content via [NestedScrollView].
class TabbedDetailView extends StatefulWidget {
  const TabbedDetailView({
    required this.tabs,
    this.header,
    this.tabBarHeight = 48,
    this.contentPadding = const EdgeInsets.all(Spacing.x4),
    this.physics,
    super.key,
  });

  final List<DetailTab> tabs;
  final Widget? header;
  final double tabBarHeight;
  final EdgeInsetsGeometry contentPadding;
  final ScrollPhysics? physics;

  @override
  State<TabbedDetailView> createState() => _TabbedDetailViewState();
}

class _TabbedDetailViewState extends State<TabbedDetailView>
    with TickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(
      length: widget.tabs.length,
      vsync: this,
    );
    _tabController.addListener(_onTabChanged);
  }

  @override
  void didUpdateWidget(TabbedDetailView oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.tabs.length != oldWidget.tabs.length) {
      _tabController
        ..removeListener(_onTabChanged)
        ..dispose();
      _tabController = TabController(
        length: widget.tabs.length,
        vsync: this,
      );
      _tabController.addListener(_onTabChanged);
    }
  }

  @override
  void dispose() {
    _tabController
      ..removeListener(_onTabChanged)
      ..dispose();
    super.dispose();
  }

  void _onTabChanged() {
    if (!_tabController.indexIsChanging) {
      setState(() {});
    }
  }

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return Column(
      children: <Widget>[
        if (widget.header != null) widget.header!,

        // Custom tab bar
        Container(
          height: widget.tabBarHeight,
          decoration: BoxDecoration(
            color: t.bgElevated,
            border: Border(
              bottom: BorderSide(color: t.border, width: 1),
            ),
          ),
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: Spacing.x2),
            children: List<Widget>.generate(widget.tabs.length, (int index) {
              final DetailTab tab = widget.tabs[index];
              final bool isSelected = _tabController.index == index;

              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: Spacing.x1),
                child: _TabButton(
                  label: tab.label,
                  icon: tab.icon,
                  badge: tab.badge,
                  isSelected: isSelected,
                  onTap: () => _tabController.animateTo(index),
                ),
              );
            }),
          ),
        ),

        // Content area
        Expanded(
          child: TabBarView(
            controller: _tabController,
            physics: widget.physics,
            children: widget.tabs.map(
              (DetailTab tab) => SingleChildScrollView(
                padding: widget.contentPadding,
                child: tab.builder(context),
              ),
            ).toList(),
          ),
        ),
      ],
    );
  }
}

class _TabButton extends StatelessWidget {
  const _TabButton({
    required this.label,
    this.icon,
    this.badge,
    required this.isSelected,
    required this.onTap,
  });

  final String label;
  final IconData? icon;
  final String? badge;
  final bool isSelected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return InkWell(
      onTap: onTap,
      borderRadius: Radii.control,
      child: AnimatedContainer(
        duration: Motion.fast,
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.x3,
          vertical: Spacing.x1_5,
        ),
        decoration: BoxDecoration(
          color: isSelected ? t.primaryLight : Colors.transparent,
          borderRadius: Radii.control,
          border: isSelected
              ? Border(
                  bottom: BorderSide(color: t.primary, width: 2),
                )
              : null,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: <Widget>[
            if (icon != null) ...<Widget>[
              Icon(
                icon,
                size: TypeScale.lg,
                color: isSelected ? t.primary : t.textSecondary,
              ),
              const SizedBox(width: Spacing.x1),
            ],
            Text(
              label,
              style: TextStyle(
                fontSize: TypeScale.sm,
                fontWeight: isSelected ? TypeScale.semibold : TypeScale.normal,
                color: isSelected ? t.primary : t.textSecondary,
              ),
            ),
            if (badge != null) ...<Widget>[
              const SizedBox(width: Spacing.x1),
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: Spacing.x1_5,
                  vertical: Spacing.x0_5,
                ),
                decoration: BoxDecoration(
                  color: isSelected ? t.primary : t.bgSunken,
                  borderRadius: Radii.pill,
                ),
                child: Text(
                  badge!,
                  style: TextStyle(
                    fontSize: TypeScale.xs - 2,
                    fontWeight: TypeScale.medium,
                    color: isSelected ? t.onPrimary : t.textSecondary,
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
