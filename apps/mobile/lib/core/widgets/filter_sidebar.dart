import 'package:flutter/material.dart';

import '../../app/theme/design_tokens.dart';

// ── Filter configuration ───────────────────────────────────────────────────

enum FilterType { checkbox, dateRange, text }

class FilterConfig {
  const FilterConfig({
    required this.key,
    required this.label,
    required this.type,
    this.options,
    this.hintText,
  });

  final String key;
  final String label;
  final FilterType type;

  /// Options for [FilterType.checkbox].
  final List<String>? options;

  /// Placeholder for [FilterType.text].
  final String? hintText;
}

// ── Filter state ───────────────────────────────────────────────────────────

class FilterState {
  const FilterState({
    this.checkboxValues = const <String, Set<String>>{},
    this.dateRange = const <String, DateTimeRange?>{},
    this.textValues = const <String, String>{},
  });

  final Map<String, Set<String>> checkboxValues;
  final Map<String, DateTimeRange?> dateRange;
  final Map<String, String> textValues;

  bool get isEmpty =>
      checkboxValues.values.every((Set<String> s) => s.isEmpty) &&
      dateRange.values.every((DateTimeRange? r) => r == null) &&
      textValues.values.every((String v) => v.isEmpty);

  bool get isNotEmpty => !isEmpty;

  Map<String, String> toQueryParameters() {
    final Map<String, String> params = <String, String>{};

    for (final MapEntry<String, Set<String>> entry in checkboxValues.entries) {
      if (entry.value.isNotEmpty) {
        params[entry.key] = entry.value.join(',');
      }
    }

    for (final MapEntry<String, DateTimeRange?> entry in dateRange.entries) {
      final DateTimeRange? range = entry.value;
      if (range != null) {
        params['${entry.key}_from'] = range.start.toIso8601String();
        params['${entry.key}_to'] = range.end.toIso8601String();
      }
    }

    for (final MapEntry<String, String> entry in textValues.entries) {
      if (entry.value.isNotEmpty) {
        params[entry.key] = entry.value;
      }
    }

    return params;
  }

  FilterState copyWith({
    Map<String, Set<String>>? checkboxValues,
    Map<String, DateTimeRange?>? dateRange,
    Map<String, String>? textValues,
  }) =>
      FilterState(
        checkboxValues: checkboxValues ?? this.checkboxValues,
        dateRange: dateRange ?? this.dateRange,
        textValues: textValues ?? this.textValues,
      );

  FilterState cleared() => const FilterState();

  @override
  bool operator ==(Object other) =>
      other is FilterState &&
      other.checkboxValues == checkboxValues &&
      other.dateRange == dateRange &&
      other.textValues == textValues;

  @override
  int get hashCode =>
      Object.hash(checkboxValues, dateRange, textValues);
}

// ── Filter sidebar ─────────────────────────────────────────────────────────

class FilterSidebar extends StatefulWidget {
  const FilterSidebar({
    required this.configs,
    required this.onApply,
    this.initialState,
    this.onClear,
    this.width = 320,
    super.key,
  });

  final List<FilterConfig> configs;
  final ValueChanged<FilterState> onApply;
  final FilterState? initialState;
  final VoidCallback? onClear;
  final double width;

  @override
  State<FilterSidebar> createState() => _FilterSidebarState();
}

class _FilterSidebarState extends State<FilterSidebar>
    with SingleTickerProviderStateMixin {
  late FilterState _state;
  late AnimationController _animationController;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _state = widget.initialState ?? const FilterState();
    _animationController = AnimationController(
      vsync: this,
      duration: Motion.normal,
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(1, 0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Motion.easeDefault,
    ));

    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(
        parent: _animationController,
        curve: Motion.easeDefault,
      ),
    );

    _animationController.forward();
  }

  @override
  void didUpdateWidget(FilterSidebar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialState != null && widget.initialState != oldWidget.initialState) {
      _state = widget.initialState!;
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return Stack(
      children: <Widget>[
        FadeTransition(
          opacity: _fadeAnimation,
          child: GestureDetector(
            onTap: () => Navigator.of(context).pop(),
            child: Container(color: Colors.black26),
          ),
        ),
        Align(
          alignment: Alignment.centerRight,
          child: SlideTransition(
            position: _slideAnimation,
            child: SizedBox(
              width: widget.width,
              child: Material(
                elevation: 0,
                color: t.bgElevated,
                child: Column(
                  children: <Widget>[
                    _Header(
                      onClose: () => Navigator.of(context).pop(),
                      onClear: () {
                        setState(() {
                          _state = _state.cleared();
                        });
                        widget.onClear?.call();
                      },
                    ),
                    const Divider(height: 1),
                    Expanded(
                      child: ListView(
                        padding: const EdgeInsets.all(Spacing.x4),
                        children: widget.configs.map(
                          (FilterConfig config) => Padding(
                            padding: const EdgeInsets.only(bottom: Spacing.x5),
                            child: _buildFilter(config),
                          ),
                        ).toList(),
                      ),
                    ),
                    const Divider(height: 1),
                    _Footer(
                      onApply: () {
                        widget.onApply(_state);
                        Navigator.of(context).pop();
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFilter(FilterConfig config) {
    switch (config.type) {
      case FilterType.checkbox:
        return _CheckboxFilter(
          config: config,
          selected: _state.checkboxValues[config.key] ?? <String>{},
          onChanged: (Set<String> values) {
            setState(() {
              _state = _state.copyWith(
                checkboxValues: <String, Set<String>>{
                  ..._state.checkboxValues,
                  config.key: values,
                },
              );
            });
          },
        );
      case FilterType.dateRange:
        return _DateRangeFilter(
          config: config,
          value: _state.dateRange[config.key],
          onChanged: (DateTimeRange? range) {
            setState(() {
              _state = _state.copyWith(
                dateRange: <String, DateTimeRange?>{
                  ..._state.dateRange,
                  config.key: range,
                },
              );
            });
          },
        );
      case FilterType.text:
        return _TextFilter(
          config: config,
          value: _state.textValues[config.key] ?? '',
          onChanged: (String value) {
            setState(() {
              _state = _state.copyWith(
                textValues: <String, String>{
                  ..._state.textValues,
                  config.key: value,
                },
              );
            });
          },
        );
    }
  }
}

// ── Header ─────────────────────────────────────────────────────────────────

class _Header extends StatelessWidget {
  const _Header({
    required this.onClose,
    required this.onClear,
  });

  final VoidCallback onClose;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return Padding(
      padding: const EdgeInsets.fromLTRB(
        Spacing.x4,
        Spacing.x3,
        Spacing.x2,
        Spacing.x3,
      ),
      child: Row(
        children: <Widget>[
          Icon(Icons.filter_list, size: TypeScale.xl, color: t.text),
          const SizedBox(width: Spacing.x2),
          Expanded(
            child: Text(
              'Filters',
              style: TextStyle(
                fontSize: TypeScale.lg,
                fontWeight: TypeScale.semibold,
                color: t.text,
              ),
            ),
          ),
          TextButton(
            onPressed: onClear,
            child: const Text('Clear'),
          ),
          IconButton(
            icon: const Icon(Icons.close),
            tooltip: 'Close filters',
            onPressed: onClose,
          ),
        ],
      ),
    );
  }
}

// ── Footer ─────────────────────────────────────────────────────────────────

class _Footer extends StatelessWidget {
  const _Footer({required this.onApply});

  final VoidCallback onApply;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return Padding(
      padding: const EdgeInsets.all(Spacing.x4),
      child: SizedBox(
        width: double.infinity,
        child: FilledButton(
          onPressed: onApply,
          style: FilledButton.styleFrom(backgroundColor: t.primary),
          child: const Text('Apply filters'),
        ),
      ),
    );
  }
}

// ── Checkbox filter ────────────────────────────────────────────────────────

class _CheckboxFilter extends StatelessWidget {
  const _CheckboxFilter({
    required this.config,
    required this.selected,
    required this.onChanged,
  });

  final FilterConfig config;
  final Set<String> selected;
  final ValueChanged<Set<String>> onChanged;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final List<String>? options = config.options;

    if (options == null || options.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Text(
          config.label,
          style: TextStyle(
            fontSize: TypeScale.sm,
            fontWeight: TypeScale.medium,
            color: t.textSecondary,
          ),
        ),
        const SizedBox(height: Spacing.x2),
        ...options.map(
          (String option) => CheckboxListTile(
            title: Text(option, style: TextStyle(fontSize: TypeScale.sm, color: t.text)),
            value: selected.contains(option),
            dense: true,
            contentPadding: EdgeInsets.zero,
            controlAffinity: ListTileControlAffinity.leading,
            onChanged: (bool? checked) {
              final Set<String> next = <String>{...selected};
              if (checked == true) {
                next.add(option);
              } else {
                next.remove(option);
              }
              onChanged(next);
            },
          ),
        ),
      ],
    );
  }
}

// ── Date range filter ──────────────────────────────────────────────────────

class _DateRangeFilter extends StatelessWidget {
  const _DateRangeFilter({
    required this.config,
    required this.value,
    required this.onChanged,
  });

  final FilterConfig config;
  final DateTimeRange? value;
  final ValueChanged<DateTimeRange?> onChanged;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Text(
          config.label,
          style: TextStyle(
            fontSize: TypeScale.sm,
            fontWeight: TypeScale.medium,
            color: t.textSecondary,
          ),
        ),
        const SizedBox(height: Spacing.x2),
        InkWell(
          onTap: () => _pickDateRange(context),
          borderRadius: Radii.control,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(
              horizontal: Spacing.x3,
              vertical: Spacing.x2_5,
            ),
            decoration: BoxDecoration(
              color: t.bgElevated,
              borderRadius: Radii.control,
              border: Border.all(color: t.border),
            ),
            child: Row(
              children: <Widget>[
                Icon(Icons.date_range, size: TypeScale.lg, color: t.textTertiary),
                const SizedBox(width: Spacing.x2),
                Expanded(
                  child: Text(
                    value != null
                        ? '${_formatDate(value!.start)} - ${_formatDate(value!.end)}'
                        : 'Select range',
                    style: TextStyle(
                      fontSize: TypeScale.base,
                      color: value != null ? t.text : t.textTertiary,
                    ),
                  ),
                ),
                if (value != null)
                  GestureDetector(
                    onTap: () => onChanged(null),
                    child: Icon(Icons.close, size: TypeScale.lg, color: t.textTertiary),
                  ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _pickDateRange(BuildContext context) async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime(2030),
      initialDateRange: value,
    );
    if (picked != null && context.mounted) {
      onChanged(picked);
    }
  }

  String _formatDate(DateTime d) =>
      '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
}

// ── Text filter ────────────────────────────────────────────────────────────

class _TextFilter extends StatelessWidget {
  const _TextFilter({
    required this.config,
    required this.value,
    required this.onChanged,
  });

  final FilterConfig config;
  final String value;
  final ValueChanged<String> onChanged;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: <Widget>[
        Text(
          config.label,
          style: TextStyle(
            fontSize: TypeScale.sm,
            fontWeight: TypeScale.medium,
            color: t.textSecondary,
          ),
        ),
        const SizedBox(height: Spacing.x2),
        TextField(
          onChanged: onChanged,
          controller: TextEditingController.fromValue(
            TextEditingValue(text: value),
          ),
          textInputAction: TextInputAction.done,
          decoration: InputDecoration(
            hintText: config.hintText,
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(
              horizontal: Spacing.x3,
              vertical: Spacing.x2,
            ),
          ),
        ),
      ],
    );
  }
}

/// Shows the [FilterSidebar] as a modal bottom sheet or right-side overlay.
Future<void> showFilterSidebar({
  required BuildContext context,
  required List<FilterConfig> configs,
  required ValueChanged<FilterState> onApply,
  FilterState? initialState,
}) async {
  await showGeneralDialog(
    context: context,
    barrierDismissible: true,
    barrierLabel: 'Filters',
    pageBuilder: (
      BuildContext context,
      Animation<double> animation,
      Animation<double> secondaryAnimation,
    ) =>
        FilterSidebar(
      configs: configs,
      initialState: initialState,
      onApply: onApply,
    ),
    transitionDuration: Motion.normal,
//     reverseTransitionDuration: Motion.fast,
  );
}
