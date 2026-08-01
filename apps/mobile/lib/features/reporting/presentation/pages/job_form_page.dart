import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../providers/reporting_providers.dart';

class ReportJobFormPage extends ConsumerStatefulWidget {
  const ReportJobFormPage({this.jobId, this.templateId, super.key});
  static const String routeName = 'job-new';
  static const String routeEditName = 'job-edit';
  static const String routePath = '/reporting/jobs/new';
  static const String routeEditPath = '/reporting/jobs/:id/edit';
  final String? jobId;
  final String? templateId;

  @override
  ConsumerState<ReportJobFormPage> createState() => _ReportJobFormPageState();
}

class _ReportJobFormPageState extends ConsumerState<ReportJobFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _templateIdCtrl = TextEditingController();
  final _scheduleCtrl = TextEditingController();
  String _format = 'PDF';
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _templateIdCtrl.text = widget.templateId ?? '';
  }

  @override
  void dispose() {
    _templateIdCtrl.dispose();
    _scheduleCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'templateId': _templateIdCtrl.text.trim(),
      'schedule': _scheduleCtrl.text.trim().isEmpty ? null : _scheduleCtrl.text.trim(),
      'format': _format,
      'status': 'PENDING',
    };
    final result = await ref.read(reportJobListControllerProvider.notifier).save(payload, id: widget.jobId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Schedule Report Job'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: [
            TextFormField(
              controller: _templateIdCtrl,
              decoration: const InputDecoration(labelText: 'Template ID *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _scheduleCtrl,
              decoration: const InputDecoration(
                labelText: 'Schedule (cron)',
                helperText: 'e.g. 0 0 * * * for daily at midnight',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _format,
              decoration: const InputDecoration(labelText: 'Output Format'),
              items: const [
                DropdownMenuItem(value: 'PDF', child: Text('PDF')),
                DropdownMenuItem(value: 'CSV', child: Text('CSV')),
                DropdownMenuItem(value: 'XLSX', child: Text('Excel')),
                DropdownMenuItem(value: 'HTML', child: Text('HTML')),
              ],
              onChanged: (v) { if (v != null) setState(() => _format = v); },
            ),
          ],
        ),
      ),
    );
  }
}
