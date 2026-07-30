import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/analytics.dart';
import '../providers/analytics_providers.dart';

class DashboardFormPage extends ConsumerStatefulWidget {
  const DashboardFormPage({this.dashboardId, super.key});

  static const String routeName = 'dashboard-new';
  static const String routeEditName = 'dashboard-edit';
  static const String routePath = '/analytics/dashboards/new';
  static const String routeEditPath = '/analytics/dashboards/:id/edit';

  final String? dashboardId;

  @override
  ConsumerState<DashboardFormPage> createState() => _DashboardFormPageState();
}

class _DashboardFormPageState extends ConsumerState<DashboardFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _descriptionCtrl = TextEditingController();

  String _status = 'ACTIVE';
  bool _saving = false;

  bool get _isEditing => widget.dashboardId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadDashboard();
    }
  }

  Future<void> _loadDashboard() async {
    final AnalyticsDashboard? dashboard = ref
        .read(analyticsDashboardDetailProvider(widget.dashboardId!))
        .valueOrNull;
    if (dashboard != null) {
      _titleCtrl.text = dashboard.title;
      _descriptionCtrl.text = dashboard.description ?? '';
      _status = dashboard.status;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descriptionCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'title': _titleCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'status': _status,
    };

    final Result<AnalyticsDashboard> result = await ref
        .read(dashboardListControllerProvider.notifier)
        .save(payload, id: widget.dashboardId);

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
        title: Text(_isEditing ? 'Edit Dashboard' : 'New Dashboard'),
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
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'ACTIVE', child: Text('Active')),
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
