import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/analytics.dart';
import '../providers/analytics_providers.dart';

class ReportFormPage extends ConsumerStatefulWidget {
  const ReportFormPage({this.reportId, super.key});

  static const String routeName = 'report-new';
  static const String routeEditName = 'report-edit';
  static const String routePath = '/analytics/reports/new';
  static const String routeEditPath = '/analytics/reports/:id/edit';

  final String? reportId;

  @override
  ConsumerState<ReportFormPage> createState() => _ReportFormPageState();
}

class _ReportFormPageState extends ConsumerState<ReportFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _descriptionCtrl = TextEditingController();
  final TextEditingController _reportTypeCtrl = TextEditingController();

  String _status = 'DRAFT';
  bool _saving = false;

  bool get _isEditing => widget.reportId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadReport();
    }
  }

  Future<void> _loadReport() async {
    final AnalyticsReport? report = ref
        .read(analyticsReportDetailProvider(widget.reportId!))
        .valueOrNull;
    if (report != null) {
      _titleCtrl.text = report.title;
      _descriptionCtrl.text = report.description ?? '';
      _reportTypeCtrl.text = report.reportType ?? '';
      _status = report.status;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descriptionCtrl.dispose();
    _reportTypeCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'title': _titleCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'reportType': _reportTypeCtrl.text.trim().isEmpty ? null : _reportTypeCtrl.text.trim(),
      'status': _status,
    };

    final Result<AnalyticsReport> result = await ref
        .read(reportListControllerProvider.notifier)
        .save(payload, id: widget.reportId);

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
        title: Text(_isEditing ? 'Edit Report' : 'New Report'),
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
              controller: _titleCtrl,
              decoration: const InputDecoration(labelText: 'Title *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _descriptionCtrl,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Description',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _reportTypeCtrl,
              decoration: const InputDecoration(
                labelText: 'Report Type',
                helperText: 'e.g. sales_summary, financial, custom',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'DRAFT', child: Text('Draft')),
                DropdownMenuItem<String>(value: 'PUBLISHED', child: Text('Published')),
                DropdownMenuItem<String>(value: 'ARCHIVED', child: Text('Archived')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
          ],
        ),
      ),
    );
  }
}
