import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../app/theme/design_tokens.dart';
import '../utils/formatters.dart';
import 'ui_card.dart';

// ── Bar chart ──────────────────────────────────────────────────────────────

class SimpleBarChart extends StatelessWidget {
  const SimpleBarChart({
    required this.data,
    this.barWidth = 24,
    this.barSpacing = 8,
    this.barRadius = 4,
    this.showLabels = true,
    this.showValues = true,
    this.height = 200,
    this.color,
    super.key,
  });

  final List<BarChartItem> data;
  final double barWidth;
  final double barSpacing;
  final double barRadius;
  final bool showLabels;
  final bool showValues;
  final double height;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    if (data.isEmpty) {
      return SizedBox(
        height: height,
        child: Center(
          child: Text(
            'No data',
            style: TextStyle(color: t.textTertiary),
          ),
        ),
      );
    }

    final double maxValue =
        data.map((BarChartItem d) => d.value).reduce(math.max);
    final double adjustedMax = maxValue == 0 ? 1 : maxValue * 1.15;

    return SizedBox(
      height: height,
      child: CustomPaint(
        size: Size.infinite,
        painter: _BarChartPainter(
          data: data,
          barWidth: barWidth,
          barSpacing: barSpacing,
          barRadius: barRadius,
          showLabels: showLabels,
          showValues: showValues,
          maxValue: adjustedMax,
          color: color ?? t.primary,
          textColor: t.textSecondary,
          gridColor: t.border,
        ),
      ),
    );
  }
}

class BarChartItem {
  const BarChartItem({required this.label, required this.value, this.color});

  final String label;
  final double value;
  final Color? color;
}

class _BarChartPainter extends CustomPainter {
  _BarChartPainter({
    required this.data,
    required this.barWidth,
    required this.barSpacing,
    required this.barRadius,
    required this.showLabels,
    required this.showValues,
    required this.maxValue,
    required this.color,
    required this.textColor,
    required this.gridColor,
  });

  final List<BarChartItem> data;
  final double barWidth;
  final double barSpacing;
  final double barRadius;
  final bool showLabels;
  final bool showValues;
  final double maxValue;
  final Color color;
  final Color textColor;
  final Color gridColor;

  @override
  void paint(Canvas canvas, Size size) {
    final double bottom = size.height - (showLabels ? 24 : 8);
    final double topPadding = showValues ? 20 : 8;
    final double top = topPadding;
    final double chartHeight = bottom - top;

    if (chartHeight <= 0) return;

    final double totalBarWidth = data.length * barWidth +
        (data.length - 1) * barSpacing;
    final double startX = (size.width - totalBarWidth) / 2;

    // Grid line
    final Paint gridPaint = Paint()
      ..color = gridColor
      ..strokeWidth = 0.5;

    canvas.drawLine(
      Offset(0, bottom),
      Offset(size.width, bottom),
      gridPaint,
    );

    for (int i = 0; i < data.length; i++) {
      final BarChartItem item = data[i];
      final double barHeight =
          (item.value / maxValue) * chartHeight;
      final double x = startX + i * (barWidth + barSpacing);
      final double y = bottom - barHeight;
      final Color barColor = item.color ?? color;

      final RRect bar = RRect.fromRectAndRadius(Rect.fromLTWH(x, y, barWidth, barHeight), const Radius.circular(4));

      final Paint barPaint = Paint()..color = barColor;
      canvas.drawRRect(bar, barPaint);

      // Value label
      if (showValues) {
        final TextPainter tp = TextPainter(
          text: TextSpan(
            text: Formatters.compact(item.value),
            style: TextStyle(
              color: textColor,
              fontSize: 10,
            ),
          ),
          textDirection: TextDirection.ltr,
        )..layout(maxWidth: barWidth + barSpacing);

        tp.paint(
          canvas,
          Offset(
            x + (barWidth - tp.width) / 2,
            y - tp.height - 2,
          ),
        );
      }

      // Axis label
      if (showLabels) {
        final TextPainter tp = TextPainter(
          text: TextSpan(
            text: item.label,
            style: TextStyle(
              color: textColor,
              fontSize: 10,
            ),
          ),
          textDirection: TextDirection.ltr,
        )..layout(maxWidth: barWidth + barSpacing);

        tp.paint(
          canvas,
          Offset(
            x + (barWidth - tp.width) / 2,
            bottom + 4,
          ),
        );
      }
    }
  }

  @override
  bool shouldRepaint(_BarChartPainter old) =>
      old.data != data ||
      old.maxValue != maxValue ||
      old.color != color;
}

// ── Pie chart ──────────────────────────────────────────────────────────────

class SimplePieChart extends StatelessWidget {
  const SimplePieChart({
    required this.data,
    this.size = 160,
    this.innerRadiusRatio = 0.55,
    this.showLegend = true,
    this.showValues = true,
    this.legendPosition = PieLegendPosition.right,
    super.key,
  });

  final List<PieChartItem> data;
  final double size;
  final double innerRadiusRatio;
  final bool showLegend;
  final bool showValues;
  final PieLegendPosition legendPosition;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    if (data.isEmpty) {
      return SizedBox(
        height: size,
        child: Center(
          child: Text(
            'No data',
            style: TextStyle(color: t.textTertiary),
          ),
        ),
      );
    }

    final double total = data.fold<double>(
      0,
      (double sum, PieChartItem item) => sum + item.value,
    );

    if (total == 0) {
      return SizedBox(
        height: size,
        child: Center(
          child: Text(
            'No data',
            style: TextStyle(color: t.textTertiary),
          ),
        ),
      );
    }

    final bool useColumn = legendPosition == PieLegendPosition.bottom;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: <Widget>[
        if (!useColumn) ...<Widget>[
          SizedBox(
            width: size,
            height: size,
            child: CustomPaint(
              size: Size.infinite,
              painter: _PieChartPainter(
                data: data,
                total: total,
                innerRadiusRatio: innerRadiusRatio,
              ),
            ),
          ),
          const SizedBox(width: Spacing.x4),
        ],
        Expanded(
          child: useColumn
              ? Column(
                  mainAxisSize: MainAxisSize.min,
                  children: <Widget>[
                    SizedBox(
                      width: size,
                      height: size,
                      child: CustomPaint(
                        size: Size.infinite,
                        painter: _PieChartPainter(
                          data: data,
                          total: total,
                          innerRadiusRatio: innerRadiusRatio,
                        ),
                      ),
                    ),
                    const SizedBox(height: Spacing.x3),
                    ..._buildLegendItems(total, t),
                  ],
                )
              : Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: _buildLegendItems(total, t),
                ),
        ),
      ],
    );
  }

  List<Widget> _buildLegendItems(double total, Palette t) {
    return data.map(
      (PieChartItem item) {
        final double percent = (item.value / total) * 100;
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: Spacing.x1),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: <Widget>[
              Container(
                width: 10,
                height: 10,
                decoration: BoxDecoration(
                  color: item.color,
                  borderRadius: Radii.pill,
                ),
              ),
              const SizedBox(width: Spacing.x1_5),
              Text(
                item.label,
                style: TextStyle(
                  fontSize: TypeScale.xs,
                  color: t.textSecondary,
                ),
              ),
              if (showValues) ...<Widget>[
                const SizedBox(width: Spacing.x1),
                Text(
                  '${percent.toStringAsFixed(1)}%',
                  style: TextStyle(
                    fontSize: TypeScale.xs,
                    fontWeight: TypeScale.medium,
                    color: t.text,
                  ),
                ),
              ],
            ],
          ),
        );
      },
    ).toList();
  }
}

class PieChartItem {
  const PieChartItem({
    required this.label,
    required this.value,
    required this.color,
  });

  final String label;
  final double value;
  final Color color;
}

enum PieLegendPosition { right, bottom }

class _PieChartPainter extends CustomPainter {
  _PieChartPainter({
    required this.data,
    required this.total,
    required this.innerRadiusRatio,
  });

  final List<PieChartItem> data;
  final double total;
  final double innerRadiusRatio;

  @override
  void paint(Canvas canvas, Size size) {
    final double radius = size.width < size.height ? size.width / 2 : size.height / 2;
    final Offset center = Offset(size.width / 2, size.height / 2);
    final double innerRadius = radius * innerRadiusRatio;

    double startAngle = -math.pi / 2;

    for (final PieChartItem item in data) {
      final double sweepAngle = (item.value / total) * 2 * math.pi;

      final Paint arcPaint = Paint()
        ..color = item.color
        ..style = PaintingStyle.fill;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        true,
        arcPaint,
      );

      if (innerRadius > 0) {
        final Paint holePaint = Paint()
          ..color = Colors.transparent
          ..blendMode = BlendMode.clear;
        canvas.drawArc(
          Rect.fromCircle(center: center, radius: innerRadius),
          0,
          2 * math.pi,
          true,
          holePaint,
        );
      }

      startAngle += sweepAngle;
    }
  }

  @override
  bool shouldRepaint(_PieChartPainter old) =>
      old.data != data || old.total != total;
}

// ── Line chart ─────────────────────────────────────────────────────────────

class SimpleLineChart extends StatelessWidget {
  const SimpleLineChart({
    required this.data,
    this.lineColor,
    this.fillColor,
    this.dotSize = 3,
    this.showDots = true,
    this.showGrid = true,
    this.showLabels = true,
    this.height = 200,
    super.key,
  });

  final List<LineChartPoint> data;
  final Color? lineColor;
  final Color? fillColor;
  final double dotSize;
  final bool showDots;
  final bool showGrid;
  final bool showLabels;
  final double height;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    if (data.isEmpty) {
      return SizedBox(
        height: height,
        child: Center(
          child: Text(
            'No data',
            style: TextStyle(color: t.textTertiary),
          ),
        ),
      );
    }

    final double maxValue =
        data.map((LineChartPoint d) => d.value).reduce(math.max);
    final double minValue =
        data.map((LineChartPoint d) => d.value).reduce(math.min);
    final double adjustedMax = maxValue == minValue
        ? maxValue + 10
        : maxValue + (maxValue - minValue) * 0.1;
    final double adjustedMin =
        minValue - (maxValue - minValue) * 0.1;

    return SizedBox(
      height: height,
      child: CustomPaint(
        size: Size.infinite,
        painter: _LineChartPainter(
          data: data,
          lineColor: lineColor ?? t.primary,
          fillColor: fillColor ?? t.primaryLight,
          dotSize: dotSize,
          showDots: showDots,
          showGrid: showGrid,
          showLabels: showLabels,
          minValue: adjustedMin,
          maxValue: adjustedMax,
          textColor: t.textTertiary,
          gridColor: t.border,
        ),
      ),
    );
  }
}

class LineChartPoint {
  const LineChartPoint({required this.label, required this.value});

  final String label;
  final double value;
}

class _LineChartPainter extends CustomPainter {
  _LineChartPainter({
    required this.data,
    required this.lineColor,
    required this.fillColor,
    required this.dotSize,
    required this.showDots,
    required this.showGrid,
    required this.showLabels,
    required this.minValue,
    required this.maxValue,
    required this.textColor,
    required this.gridColor,
  });

  final List<LineChartPoint> data;
  final Color lineColor;
  final Color fillColor;
  final double dotSize;
  final bool showDots;
  final bool showGrid;
  final bool showLabels;
  final double minValue;
  final double maxValue;
  final Color textColor;
  final Color gridColor;

  @override
  void paint(Canvas canvas, Size size) {
    final double range = maxValue - minValue;
    if (range == 0) return;

    const double leftPadding = 8;
    const double rightPadding = 8;
    final double bottomPadding = showLabels ? 24 : 8;
    const double topPadding = 8;
    final double chartWidth = size.width - leftPadding - rightPadding;
    final double chartHeight = size.height - topPadding - bottomPadding;

    if (chartWidth <= 0 || chartHeight <= 0) return;

    if (data.length < 2) return;

    // Grid lines
    if (showGrid) {
      final Paint gridPaint = Paint()
        ..color = gridColor
        ..strokeWidth = 0.5;

      canvas.drawLine(
        Offset(leftPadding, size.height - bottomPadding),
        Offset(size.width - rightPadding, size.height - bottomPadding),
        gridPaint,
      );
    }

    // Build points
    final List<Offset> points = <Offset>[];
    for (int i = 0; i < data.length; i++) {
      final double x = leftPadding +
          (i / (data.length - 1)) * chartWidth;
      final double y = topPadding +
          chartHeight -
          ((data[i].value - minValue) / range) * chartHeight;
      points.add(Offset(x, y));
    }

    // Fill area under line
    final Paint fillPaint = Paint()
      ..color = fillColor.withAlpha(80)
      ..style = PaintingStyle.fill;

    final Path fillPath = Path()
      ..moveTo(points.first.dx, size.height - bottomPadding)
      ..lineTo(points.first.dx, points.first.dy);
    for (int i = 1; i < points.length; i++) {
      fillPath.lineTo(points[i].dx, points[i].dy);
    }
    fillPath
      ..lineTo(points.last.dx, size.height - bottomPadding)
      ..close();
    canvas.drawPath(fillPath, fillPaint);

    // Draw line
    final Paint linePaint = Paint()
      ..color = lineColor
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final Path linePath = Path()
      ..moveTo(points.first.dx, points.first.dy);
    for (int i = 1; i < points.length; i++) {
      linePath.lineTo(points[i].dx, points[i].dy);
    }
    canvas.drawPath(linePath, linePaint);

    // Dots
    if (showDots) {
      final Paint dotPaint = Paint()
        ..color = lineColor
        ..style = PaintingStyle.fill;

      for (final Offset point in points) {
        canvas.drawCircle(point, dotSize, dotPaint);
        // White inner dot
        canvas.drawCircle(
          point,
          dotSize * 0.6,
          Paint()..color = Colors.white,
        );
      }
    }

    // Labels
    if (showLabels && data.length <= 12) {
      for (int i = 0; i < data.length; i++) {
        final TextPainter tp = TextPainter(
          text: TextSpan(
            text: data[i].label,
            style: TextStyle(color: textColor, fontSize: 9),
          ),
          textDirection: TextDirection.ltr,
        )..layout(maxWidth: chartWidth / data.length);

        tp.paint(
          canvas,
          Offset(
            points[i].dx - tp.width / 2,
            size.height - bottomPadding + 4,
          ),
        );
      }
    }
  }

  @override
  bool shouldRepaint(_LineChartPainter old) =>
      old.data != data || old.minValue != minValue || old.maxValue != maxValue;
}

// ── KPI card ───────────────────────────────────────────────────────────────

class KpiCard extends StatelessWidget {
  const KpiCard({
    required this.label,
    required this.value,
    this.previousValue,
    this.format = KpiFormat.number,
    this.sparklineData,
    this.sparklineColor,
    this.icon,
    this.onTap,
    super.key,
  });

  final String label;
  final double value;
  final double? previousValue;
  final KpiFormat format;
  final List<double>? sparklineData;
  final Color? sparklineColor;
  final IconData? icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final String displayValue = switch (format) {
      KpiFormat.number => Formatters.compact(value),
      KpiFormat.currency => Formatters.currency(value),
      KpiFormat.percent => Formatters.percent(value / 100),
      KpiFormat.decimal => value.toStringAsFixed(2),
    };

    final double? trend = previousValue != null && previousValue != 0
        ? ((value - previousValue!) / previousValue!) * 100
        : null;

    final bool isUp = trend != null && trend >= 0;

    return UiCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          // Header
          Row(
            children: <Widget>[
              if (icon != null) ...<Widget>[
                Icon(icon, size: TypeScale.lg, color: t.textTertiary),
                const SizedBox(width: Spacing.x1_5),
              ],
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: TypeScale.xs,
                    color: t.textSecondary,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: Spacing.x2),

          // Value
          Text(
            displayValue,
            style: TextStyle(
              fontSize: TypeScale.x2l,
              fontWeight: TypeScale.bold,
              color: t.text,
            ),
          ),

          // Trend
          if (trend != null) ...<Widget>[
            const SizedBox(height: Spacing.x1),
            Row(
              children: <Widget>[
                Icon(
                  isUp ? Icons.trending_up : Icons.trending_down,
                  size: TypeScale.base,
                  color: isUp ? t.success : t.danger,
                ),
                const SizedBox(width: Spacing.x0_5),
                Text(
                  '${isUp ? '+' : ''}${trend.toStringAsFixed(1)}%',
                  style: TextStyle(
                    fontSize: TypeScale.xs,
                    fontWeight: TypeScale.medium,
                    color: isUp ? t.success : t.danger,
                  ),
                ),
              ],
            ),
          ],

          // Sparkline
          if (sparklineData != null && sparklineData!.length >= 2) ...<Widget>[
            const SizedBox(height: Spacing.x2),
            SizedBox(
              height: 32,
              child: _Sparkline(
                data: sparklineData!,
                color: sparklineColor ?? t.primary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

enum KpiFormat { number, currency, percent, decimal }

// ── Sparkline ──────────────────────────────────────────────────────────────

class _Sparkline extends StatelessWidget {
  const _Sparkline({
    required this.data,
    required this.color,
  });

  final List<double> data;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      size: Size.infinite,
      painter: _SparklinePainter(data: data, color: color),
    );
  }
}

class _SparklinePainter extends CustomPainter {
  _SparklinePainter({required this.data, required this.color});

  final List<double> data;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    if (data.length < 2) return;

    final double max = data.reduce(math.max);
    final double min = data.reduce(math.min);
    final double range = (max - min) == 0 ? 1 : max - min;
    final double stepX = size.width / (data.length - 1);

    final Paint linePaint = Paint()
      ..color = color
      ..strokeWidth = 1.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final Path path = Path();
    for (int i = 0; i < data.length; i++) {
      final double x = i * stepX;
      final double y = size.height -
          ((data[i] - min) / range) * (size.height - 2) -
          1;
      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    canvas.drawPath(path, linePaint);
  }

  @override
  bool shouldRepaint(_SparklinePainter old) => old.data != data;
}
