import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class PerformanceReviewFormPage extends ConsumerStatefulWidget {
  const PerformanceReviewFormPage({this.reviewId, super.key});

  static const String routeName = 'performance-review-new';
  static const String routeEditName = 'performance-review-edit';
  static const String routePath = '/hr/performance-reviews/new';
  static const String routeEditPath = '/hr/performance-reviews/:id/edit';

  final String? reviewId;

  @override
  ConsumerState<PerformanceReviewFormPage> createState() =>
      _PerformanceReviewFormPageState();
}

class _PerformanceReviewFormPageState
    extends ConsumerState<PerformanceReviewFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _employeeCtrl = TextEditingController();
  final TextEditingController _reviewerCtrl = TextEditingController();
  final TextEditingController _periodCtrl = TextEditingController();
  final TextEditingController _goalsCtrl = TextEditingController();
  final TextEditingController _feedbackCtrl = TextEditingController();

  double _rating = 3;
  bool _saving = false;

  bool get _isEditing => widget.reviewId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
  }

  void _load() {
    final PerformanceReviewListState state =
        ref.read(performanceReviewListControllerProvider);
    final PerformanceReview? pr = state.items.where(
      (PerformanceReview r) => r.id == widget.reviewId,
    ).firstOrNull;
    if (pr != null) {
      _employeeCtrl.text = pr.employeeName;
      _reviewerCtrl.text = pr.reviewerName ?? '';
      _periodCtrl.text = pr.reviewPeriod;
      _goalsCtrl.text = pr.goals ?? '';
      _feedbackCtrl.text = pr.feedback ?? '';
      _rating = pr.rating ?? 3;
    }
  }

  @override
  void dispose() {
    _employeeCtrl.dispose();
    _reviewerCtrl.dispose();
    _periodCtrl.dispose();
    _goalsCtrl.dispose();
    _feedbackCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'employeeId': _employeeCtrl.text.trim(),
      'employeeName': _employeeCtrl.text.trim(),
      'reviewerName': _reviewerCtrl.text.trim().isEmpty
          ? null
          : _reviewerCtrl.text.trim(),
      'reviewPeriod': _periodCtrl.text.trim(),
      'goals': _goalsCtrl.text.trim().isEmpty ? null : _goalsCtrl.text.trim(),
      'feedback': _feedbackCtrl.text.trim().isEmpty
          ? null
          : _feedbackCtrl.text.trim(),
      'rating': _rating,
      'status': PerformanceReviewStatus.draft,
    };

    final Result<PerformanceReview> result = await ref
        .read(performanceReviewListControllerProvider.notifier)
        .save(payload, id: widget.reviewId);

    if (!context.mounted) return;
    setState(() => _saving = false);

    result.fold(
      (Failure failure) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(failure.message)));
      },
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Review' : 'New Review'),
        actions: <Widget>[
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    height: Spacing.x5,
                    width: Spacing.x5,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: <Widget>[
            TextFormField(
              controller: _employeeCtrl,
              decoration: const InputDecoration(labelText: 'Employee *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _reviewerCtrl,
              decoration: const InputDecoration(labelText: 'Reviewer'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _periodCtrl,
              decoration: const InputDecoration(
                labelText: 'Review Period *',
                hintText: 'e.g. Q1 2026',
              ),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _goalsCtrl,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Goals',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _feedbackCtrl,
              maxLines: 4,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Feedback',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            Text(
              'Rating: ${_rating.toStringAsFixed(1)} / 5',
              style: Theme.of(context).textTheme.labelLarge,
            ),
            const SizedBox(height: Spacing.x1),
            Slider(
              value: _rating,
              min: 1,
              max: 5,
              divisions: 8,
              label: _rating.toStringAsFixed(1),
              onChanged: (double v) => setState(() => _rating = v),
            ),
          ],
        ),
      ),
    );
  }
}