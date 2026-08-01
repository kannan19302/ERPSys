import 'package:flutter/material.dart';

import '../../app/theme/design_tokens.dart';

// ── Results ────────────────────────────────────────────────────────────────

class ConfirmActionResult {
  const ConfirmActionResult({required this.confirmed, this.reason});

  final bool confirmed;
  final String? reason;
}

class WorkflowActionResult {
  const WorkflowActionResult({
    required this.approved,
    required this.comment,
  });

  final bool approved;
  final String comment;
}

class BatchActionResult {
  const BatchActionResult({
    required this.action,
    this.confirmed = true,
  });

  final String action;
  final bool confirmed;
}

class StatusTransitionResult {
  const StatusTransitionResult({
    required this.targetStatus,
    this.reason,
  });

  final String targetStatus;
  final String? reason;
}

// ── Confirm action dialog ──────────────────────────────────────────────────

class ConfirmActionDialog extends StatefulWidget {
  const ConfirmActionDialog({
    required this.title,
    required this.message,
    this.confirmLabel = 'Confirm',
    this.cancelLabel = 'Cancel',
    this.isDestructive = false,
    this.showReasonField = false,
    this.reasonHint = 'Reason (optional)',
    this.reasonRequired = false,
    this.icon,
    super.key,
  });

  final String title;
  final String message;
  final String confirmLabel;
  final String cancelLabel;
  final bool isDestructive;
  final bool showReasonField;
  final String reasonHint;
  final bool reasonRequired;
  final IconData? icon;

  @override
  State<ConfirmActionDialog> createState() => _ConfirmActionDialogState();

  /// Convenience show method.
  static Future<ConfirmActionResult> show({
    required BuildContext context,
    required String title,
    required String message,
    String confirmLabel = 'Confirm',
    String cancelLabel = 'Cancel',
    bool isDestructive = false,
    bool showReasonField = false,
    String reasonHint = 'Reason (optional)',
    bool reasonRequired = false,
  }) =>
      showDialog<ConfirmActionResult>(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext dialogContext) => ConfirmActionDialog(
          title: title,
          message: message,
          confirmLabel: confirmLabel,
          cancelLabel: cancelLabel,
          isDestructive: isDestructive,
          showReasonField: showReasonField,
          reasonHint: reasonHint,
          reasonRequired: reasonRequired,
        ),
      ).then((ConfirmActionResult? result) =>
          result ?? const ConfirmActionResult(confirmed: false),);
}

class _ConfirmActionDialogState extends State<ConfirmActionDialog> {
  final TextEditingController _reasonController = TextEditingController();

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return AlertDialog(
      title: Row(
        children: <Widget>[
          if (widget.icon != null) ...<Widget>[
            Icon(
              widget.icon,
              color: widget.isDestructive ? t.danger : t.primary,
              size: TypeScale.xl,
            ),
            const SizedBox(width: Spacing.x2),
          ],
          Expanded(child: Text(widget.title)),
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          Text(widget.message),
          if (widget.showReasonField) ...<Widget>[
            const SizedBox(height: Spacing.x4),
            TextField(
              controller: _reasonController,
              maxLines: 3,
              minLines: 1,
              decoration: InputDecoration(
                hintText: widget.reasonHint,
                isDense: true,
              ),
            ),
          ],
        ],
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(context).pop(
                const ConfirmActionResult(confirmed: false),
              ),
          child: Text(widget.cancelLabel),
        ),
        FilledButton(
          onPressed: () {
            final String reason = _reasonController.text.trim();
            if (widget.reasonRequired && reason.isEmpty) return;
            Navigator.of(context).pop(
              ConfirmActionResult(confirmed: true, reason: reason.isEmpty ? null : reason),
            );
          },
          style: widget.isDestructive
              ? FilledButton.styleFrom(backgroundColor: t.danger)
              : null,
          child: Text(widget.confirmLabel),
        ),
      ],
    );
  }
}

// ── Workflow action dialog (approve / reject) ──────────────────────────────

class WorkflowActionDialog extends StatefulWidget {
  const WorkflowActionDialog({
    required this.title,
    this.approveLabel = 'Approve',
    this.rejectLabel = 'Reject',
    this.commentHint = 'Comment (optional)',
    super.key,
  });

  final String title;
  final String approveLabel;
  final String rejectLabel;
  final String commentHint;

  @override
  State<WorkflowActionDialog> createState() => _WorkflowActionDialogState();

  static Future<WorkflowActionResult> show({
    required BuildContext context,
    String title = 'Review',
    String approveLabel = 'Approve',
    String rejectLabel = 'Reject',
    String commentHint = 'Comment (optional)',
  }) =>
      showDialog<WorkflowActionResult>(
        context: context,
        barrierDismissible: false,
        builder: (BuildContext dialogContext) => WorkflowActionDialog(
          title: title,
          approveLabel: approveLabel,
          rejectLabel: rejectLabel,
          commentHint: commentHint,
        ),
      ).then((WorkflowActionResult? result) =>
          result ?? const WorkflowActionResult(approved: false, comment: ''),);
}

class _WorkflowActionDialogState extends State<WorkflowActionDialog> {
  final TextEditingController _commentController = TextEditingController();

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return AlertDialog(
      title: Text(widget.title),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          TextField(
            controller: _commentController,
            maxLines: 4,
            minLines: 2,
            decoration: InputDecoration(
              hintText: widget.commentHint,
              alignLabelWithHint: true,
            ),
          ),
        ],
      ),
      actions: <Widget>[
        OutlinedButton(
          onPressed: () {
            Navigator.of(context).pop(
              WorkflowActionResult(
                approved: false,
                comment: _commentController.text.trim(),
              ),
            );
          },
          style: OutlinedButton.styleFrom(
            foregroundColor: t.danger,
            side: BorderSide(color: t.danger),
          ),
          child: Text(widget.rejectLabel),
        ),
        FilledButton(
          onPressed: () {
            Navigator.of(context).pop(
              WorkflowActionResult(
                approved: true,
                comment: _commentController.text.trim(),
              ),
            );
          },
          style: FilledButton.styleFrom(backgroundColor: t.success),
          child: Text(widget.approveLabel),
        ),
      ],
    );
  }
}

// ── Batch action dialog ────────────────────────────────────────────────────

class BatchActionDialog extends StatelessWidget {
  const BatchActionDialog({
    required this.actions,
    this.title = 'Choose action',
    this.selectedCount,
    super.key,
  });

  final List<BatchActionItem> actions;
  final String title;
  final int? selectedCount;

  static Future<BatchActionResult?> show({
    required BuildContext context,
    required List<BatchActionItem> actions,
    String title = 'Choose action',
    int? selectedCount,
  }) =>
      showDialog<BatchActionResult>(
        context: context,
        builder: (BuildContext dialogContext) => BatchActionDialog(
          actions: actions,
          title: title,
          selectedCount: selectedCount,
        ),
      );

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return AlertDialog(
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: <Widget>[
          Text(title),
          if (selectedCount != null) ...<Widget>[
            const SizedBox(height: Spacing.x1),
            Text(
              '$selectedCount item${selectedCount == 1 ? '' : 's'} selected',
              style: TextStyle(
                fontSize: TypeScale.sm,
                color: t.textSecondary,
              ),
            ),
          ],
        ],
      ),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: actions.map(
          (BatchActionItem item) => ListTile(
            leading: item.icon != null
                ? Icon(
                    item.icon,
                    color: item.isDestructive ? t.danger : t.primary,
                  )
                : null,
            title: Text(
              item.label,
              style: TextStyle(
                color: item.isDestructive ? t.danger : t.text,
              ),
            ),
            onTap: () => Navigator.of(context).pop(
              BatchActionResult(action: item.key),
            ),
          ),
        ).toList(),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(context).pop(null),
          child: const Text('Cancel'),
        ),
      ],
    );
  }
}

class BatchActionItem {
  const BatchActionItem({
    required this.key,
    required this.label,
    this.icon,
    this.isDestructive = false,
  });

  final String key;
  final String label;
  final IconData? icon;
  final bool isDestructive;
}

// ── Status transition dialog ───────────────────────────────────────────────

class StatusTransitionDialog extends StatefulWidget {
  const StatusTransitionDialog({
    required this.currentStatus,
    required this.availableStatuses,
    this.title = 'Change status',
    this.reasonHint = 'Reason (optional)',
    this.reasonRequired = false,
    super.key,
  });

  final String currentStatus;
  final List<String> availableStatuses;
  final String title;
  final String reasonHint;
  final bool reasonRequired;

  @override
  State<StatusTransitionDialog> createState() => _StatusTransitionDialogState();

  static Future<StatusTransitionResult?> show({
    required BuildContext context,
    required String currentStatus,
    required List<String> availableStatuses,
    String title = 'Change status',
    String reasonHint = 'Reason (optional)',
    bool reasonRequired = false,
  }) =>
      showDialog<StatusTransitionResult>(
        context: context,
        builder: (BuildContext dialogContext) => StatusTransitionDialog(
          currentStatus: currentStatus,
          availableStatuses: availableStatuses,
          title: title,
          reasonHint: reasonHint,
          reasonRequired: reasonRequired,
        ),
      );
}

class _StatusTransitionDialogState extends State<StatusTransitionDialog> {
  final TextEditingController _reasonController = TextEditingController();
  String? _selectedStatus;

  @override
  void dispose() {
    _reasonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    final bool valid = _selectedStatus != null &&
        _selectedStatus != widget.currentStatus &&
        (!widget.reasonRequired || _reasonController.text.trim().isNotEmpty);

    return AlertDialog(
      title: Text(widget.title),
      content: RadioGroup<String>(
        groupValue: _selectedStatus,
        onChanged: (String? value) {
          setState(() {
            _selectedStatus = value;
          });
        },
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: <Widget>[
            Text(
              'Current: ${widget.currentStatus}',
              style: TextStyle(
                fontSize: TypeScale.sm,
                color: t.textSecondary,
              ),
            ),
            const SizedBox(height: Spacing.x3),
            ...widget.availableStatuses
                .where((String s) => s != widget.currentStatus)
                .map(
                  (String status) => RadioListTile<String>(
                    title: Text(status),
                    value: status,
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                  ),
                ),
            const SizedBox(height: Spacing.x2),
            TextField(
              controller: _reasonController,
              maxLines: 3,
              minLines: 1,
              onChanged: (_) => setState(() {}),
              decoration: InputDecoration(
                hintText: widget.reasonHint,
                isDense: true,
              ),
            ),
          ],
        ),
      ),
      actions: <Widget>[
        TextButton(
          onPressed: () => Navigator.of(context).pop(null),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: valid
              ? () => Navigator.of(context).pop(
                    StatusTransitionResult(
                      targetStatus: _selectedStatus!,
                      reason: _reasonController.text.trim().isEmpty
                          ? null
                          : _reasonController.text.trim(),
                    ),
                  )
              : null,
          child: const Text('Change'),
        ),
      ],
    );
  }
}
