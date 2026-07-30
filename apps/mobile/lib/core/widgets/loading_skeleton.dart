import 'dart:math' show Random;

import 'package:flutter/material.dart';

import '../../app/theme/design_tokens.dart';

// ── Shimmer effect ─────────────────────────────────────────────────────────

class _ShimmerGradient extends StatelessWidget {
  const _ShimmerGradient({required this.child});

  final Widget child;

  static const List<Color> _lightShimmer = <Color>[
    Color(0xFFF1F3F5),
    Color(0xFFE8ECF0),
    Color(0xFFF1F3F5),
  ];

  static const List<Color> _darkShimmer = <Color>[
    Color(0xFF1E2030),
    Color(0xFF2A2D42),
    Color(0xFF1E2030),
  ];

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final bool isDark = t.bg == Palette.dark.bg;
    final List<Color> colors = isDark ? _darkShimmer : _lightShimmer;

    return ShaderMask(
      blendMode: BlendMode.srcATop,
      shaderCallback: (Rect bounds) {
        return LinearGradient(
          colors: colors,
          stops: const <double>[0.0, 0.5, 1.0],
          begin: Alignment.centerLeft,
          end: Alignment.centerRight,
          transform: _SlidingGradientTransform(),
        ).createShader(bounds);
      },
      child: child,
    );
  }
}

class _SlidingGradientTransform extends GradientTransform {
  @override
  Matrix4? transform(Rect bounds, {TextDirection? textDirection}) {
    return Matrix4.translationValues(-bounds.width * 0.5, 0, 0);
  }
}

// ── Shimmer animated builder ───────────────────────────────────────────────

class _ShimmerWidget extends StatefulWidget {
  const _ShimmerWidget({required this.builder});

  final Widget Function(BuildContext) builder;

  @override
  State<_ShimmerWidget> createState() => _ShimmerWidgetState();
}

class _ShimmerWidgetState extends State<_ShimmerWidget>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (BuildContext context, Widget? child) {
        return _ShimmerGradient(child: widget.builder(context));
      },
    );
  }
}

/// Helper to produce random but stable widths for skeleton lines.
class _LineWidth {
  _LineWidth._();

  static final Random _random = Random(42);

  static double get narrow => 0.3 + _random.nextDouble() * 0.2;
  static double get medium => 0.5 + _random.nextDouble() * 0.3;
  static double get wide => 0.8 + _random.nextDouble() * 0.15;
}

// ── Base skeleton building blocks ──────────────────────────────────────────

class SkeletonLine extends StatelessWidget {
  const SkeletonLine({
    this.width,
    this.height = 12,
    this.borderRadius,
    this.margin,
    super.key,
  });

  final double? width;
  final double height;
  final double? borderRadius;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final bool isDark = t.bg == Palette.dark.bg;

    return Container(
      width: width,
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2030) : const Color(0xFFF1F3F5),
        borderRadius: BorderRadius.all(
          Radius.circular(borderRadius ?? height * 0.25),
        ),
      ),
    );
  }
}

class SkeletonBlock extends StatelessWidget {
  const SkeletonBlock({
    this.height = 100,
    this.borderRadius = Radii.card,
    this.margin,
    super.key,
  });

  final double height;
  final BorderRadiusGeometry borderRadius;
  final EdgeInsetsGeometry? margin;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final bool isDark = t.bg == Palette.dark.bg;

    return Container(
      height: height,
      margin: margin,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF1E2030) : const Color(0xFFF1F3F5),
        borderRadius: borderRadius,
      ),
    );
  }
}

// ── List skeleton ──────────────────────────────────────────────────────────

class ListSkeleton extends StatelessWidget {
  const ListSkeleton({
    this.itemCount = 5,
    this.linesPerItem = 3,
    this.itemHeight = 72,
    this.separator = true,
    super.key,
  });

  final int itemCount;
  final int linesPerItem;
  final double itemHeight;
  final bool separator;

  @override
  Widget build(BuildContext context) {
    return _ShimmerWidget(
      builder: (BuildContext context) {
        return ListView.separated(
          physics: const NeverScrollableScrollPhysics(),
          shrinkWrap: true,
          padding: const EdgeInsets.all(Spacing.x4),
          itemCount: itemCount,
          separatorBuilder: (_, int __) =>
              separator ? const SizedBox(height: Spacing.x3) : const SizedBox.shrink(),
          itemBuilder: (BuildContext context, int index) {
            return SizedBox(
              height: itemHeight,
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  // Leading circle
                  const Padding(
                    padding: EdgeInsets.only(right: Spacing.x3, top: Spacing.x1),
                    child: SkeletonLine(width: 40, height: 40, borderRadius: 20),
                  ),
                  // Lines
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: List<Widget>.generate(linesPerItem, (int lineIndex) {
                        return Padding(
                          padding: EdgeInsets.only(
                            top: lineIndex == 0 ? Spacing.x1 : Spacing.x2,
                          ),
                          child: SkeletonLine(
                            width: _lineWidth(lineIndex, linesPerItem),
                            height: 12,
                          ),
                        );
                      }),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  static double _lineWidth(int index, int total) {
    if (total == 1) return _LineWidth.medium;
    if (index == 0) return _LineWidth.wide;
    if (index == total - 1) return _LineWidth.narrow;
    return _LineWidth.medium;
  }
}

// ── Detail skeleton ────────────────────────────────────────────────────────

class DetailSkeleton extends StatelessWidget {
  const DetailSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return _ShimmerWidget(
      builder: (BuildContext context) {
        return ListView(
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.all(Spacing.x4),
          children: <Widget>[
            // Header section
            const SkeletonLine(width: 200, height: 24),
            const SizedBox(height: Spacing.x2),
            const SkeletonLine(width: 140, height: 14),
            const SizedBox(height: Spacing.x6),

            // Card 1
            const SkeletonBlock(height: 120),
            const SizedBox(height: Spacing.x4),

            // Card 2
            const SkeletonBlock(height: 160),
            const SizedBox(height: Spacing.x4),

            // Card 3
            const SkeletonBlock(height: 100),
          ],
        );
      },
    );
  }
}

// ── Form skeleton ──────────────────────────────────────────────────────────

class FormSkeleton extends StatelessWidget {
  const FormSkeleton({this.fieldCount = 6, super.key});

  final int fieldCount;

  @override
  Widget build(BuildContext context) {
    return _ShimmerWidget(
      builder: (BuildContext context) {
        return ListView(
          physics: const NeverScrollableScrollPhysics(),
          padding: const EdgeInsets.all(Spacing.x4),
          children: List<Widget>.generate(fieldCount, (int index) {
            return Padding(
              padding: const EdgeInsets.only(bottom: Spacing.x5),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  // Label
                  const SkeletonLine(width: 80, height: 12),
                  const SizedBox(height: Spacing.x2),
                  // Field
                  const SkeletonBlock(height: 48, borderRadius: BorderRadius.all(Radius.circular(Radii.lg))),
                ],
              ),
            );
          }),
        );
      },
    );
  }
}

// ── Card skeleton ──────────────────────────────────────────────────────────

class CardSkeleton extends StatelessWidget {
  const CardSkeleton({
    this.height = 120,
    this.showAvatar = false,
    super.key,
  });

  final double height;
  final bool showAvatar;

  @override
  Widget build(BuildContext context) {
    return _ShimmerWidget(
      builder: (BuildContext context) {
        return Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: Spacing.x4,
            vertical: Spacing.x2,
          ),
          child: Container(
            height: height,
child: Padding(
              padding: const EdgeInsets.all(Spacing.x4),
              child: Row(
                children: <Widget>[
                  if (showAvatar)
                    const Padding(
                      padding: EdgeInsets.only(right: Spacing.x3),
                      child: SkeletonLine(width: 48, height: 48, borderRadius: 24),
                    ),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: const <Widget>[
                        SkeletonLine(width: 160, height: 16),
                        SizedBox(height: Spacing.x2),
                        SkeletonLine(width: 100, height: 12),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
