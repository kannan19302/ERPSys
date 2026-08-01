import 'package:flutter/material.dart';

import '../../app/theme/design_tokens.dart';
import '../../core/widgets/permission_gate.dart';

/// Bottom bar that appears when items are selected in a list.
///
/// Animated slide-up appearance. Integrates with [PermissionGate] so that
/// action buttons respect RBAC (AGENTS.md Rule 23).
class BatchOperationsBar extends StatefulWidget {
  const BatchOperationsBar({
    required this.selectedCount,
    required this.totalCount,
    required this.onSelectAll,
    required this.onDeselectAll,
    required this.actions,
    this.onClear,
    super.key,
  });

  final int selectedCount;
  final int totalCount;
  final VoidCallback onSelectAll;
  final VoidCallback onDeselectAll;
  final List<BatchOperationAction> actions;
  final VoidCallback? onClear;

  @override
  State<BatchOperationsBar> createState() => _BatchOperationsBarState();
}

class BatchOperationAction {
  const BatchOperationAction({
    required this.label,
    required this.icon,
    required this.onTap,
    this.permission,
    this.isDestructive = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final String? permission;
  final bool isDestructive;
}

class _BatchOperationsBarState extends State<BatchOperationsBar>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: Motion.normal,
    );

    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, 1),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Motion.easeOut,
    ),);

    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _controller, curve: Motion.easeOut),
    );

    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return SlideTransition(
      position: _slideAnimation,
      child: FadeTransition(
        opacity: _fadeAnimation,
        child: Container(
          decoration: BoxDecoration(
            color: t.bgElevated,
            border: Border(top: BorderSide(color: t.border)),
          ),
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(
                Spacing.x4,
                Spacing.x2,
                Spacing.x4,
                Spacing.x2,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: <Widget>[
                  // Selection controls row
                  Row(
                    children: <Widget>[
                      Text(
                        '${widget.selectedCount} selected',
                        style: TextStyle(
                          fontSize: TypeScale.sm,
                          fontWeight: TypeScale.medium,
                          color: t.text,
                        ),
                      ),
                      const SizedBox(width: Spacing.x3),
                      TextButton(
                        onPressed: widget.selectedCount < widget.totalCount
                            ? widget.onSelectAll
                            : widget.onDeselectAll,
                        child: Text(
                          widget.selectedCount < widget.totalCount
                              ? 'Select all'
                              : 'Deselect all',
                        ),
                      ),
                      if (widget.onClear != null) ...<Widget>[
                        const SizedBox(width: Spacing.x1),
                        TextButton(
                          onPressed: widget.onClear,
                          child: const Text('Clear'),
                        ),
                      ],
                    ],
                  ),

                  const SizedBox(height: Spacing.x2),

                  // Action buttons row
                  Row(
                    children: widget.actions.map(
                      (BatchOperationAction action) {
                        final Widget button = _ActionButton(
                          label: action.label,
                          icon: action.icon,
                          isDestructive: action.isDestructive,
                          onTap: action.onTap,
                        );

                        final String? permission = action.permission;
                        if (permission != null) {
                          return Padding(
                            padding: const EdgeInsets.only(right: Spacing.x2),
                            child: PermissionGate(
                              permission: permission,
                              child: button,
                            ),
                          );
                        }

                        return Padding(
                          padding: const EdgeInsets.only(right: Spacing.x2),
                          child: button,
                        );
                      },
                    ).toList(),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  const _ActionButton({
    required this.label,
    required this.icon,
    required this.onTap,
    this.isDestructive = false,
  });

  final String label;
  final IconData icon;
  final VoidCallback onTap;
  final bool isDestructive;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return OutlinedButton.icon(
      onPressed: onTap,
      icon: Icon(
        icon,
        size: TypeScale.lg,
        color: isDestructive ? t.danger : t.textSecondary,
      ),
      label: Text(
        label,
        style: TextStyle(
          fontSize: TypeScale.xs,
          color: isDestructive ? t.danger : t.text,
        ),
      ),
      style: OutlinedButton.styleFrom(
        side: BorderSide(
          color: isDestructive ? t.dangerLight : t.border,
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: Spacing.x2,
          vertical: Spacing.x1_5,
        ),
        minimumSize: Size.zero,
        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
        shape: const RoundedRectangleBorder(
          borderRadius: Radii.control,
        ),
      ),
    );
  }
}
