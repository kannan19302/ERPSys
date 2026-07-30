import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../providers/reporting_providers.dart';

class ExportFormPage extends ConsumerStatefulWidget {
  const ExportFormPage({this.exportId, super.key});
  static const String routeName = 'export-new';
  static const String routeEditName = 'export-edit';
  static const String routePath = '/reporting/exports/new';
  static const String routeEditPath = '/reporting/exports/:id/edit';
  final String? exportId;

  @override
  ConsumerState<ExportFormPage> createState() => _ExportFormPageState();
}

class _ExportFormPageState extends ConsumerState<ExportFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _reportIdCtrl = TextEditingController();
  final _startDateCtrl = TextEditingController();
  final _endDateCtrl = TextEditingController();
  final _filtersCtrl = TextEditingController();
  String _format = 'PDF';
  String _type = 'STANDARD';
  bool _saving = false;

  @override
  void dispose() {
    _reportIdCtrl.dispose();
    _startDateCtrl.dispose();
    _endDateCtrl.dispose();
    _filtersCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'reportId': _reportIdCtrl.text.trim().isEmpty ? null : _reportIdCtrl.text.trim(),
      'format': _format,
      'status': 'PENDING',
      'filters': _filtersCtrl.text.trim(),
    };
    final result = await ref.read(reportExportListControllerProvider.notifier).save(payload, id: widget.exportId);
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
        title: const Text('Export Report'),
        actions: [
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Export'),
          ),
        ],
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: [
            DropdownButtonFormField<String>(
              value: _type,
              decoration: const InputDecoration(labelText: 'Export Type'),
              items: const [
                DropdownMenuItem(value: 'STANDARD', child: Text('Standard')),
                DropdownMenuItem(value: 'SCHEDULED', child: Text('Scheduled')),
                DropdownMenuItem(value: 'ON_DEMAND', child: Text('On Demand')),
              ],
              onChanged: (v) { if (v != null) setState(() => _type = v); },
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _format,
              decoration: const InputDecoration(labelText: 'Format'),
              items: const [
                DropdownMenuItem(value: 'PDF', child: Text('PDF')),
                DropdownMenuItem(value: 'CSV', child: Text('CSV')),
                DropdownMenuItem(value: 'XLSX', child: Text('Excel')),
                DropdownMenuItem(value: 'HTML', child: Text('HTML')),
              ],
              onChanged: (v) { if (v != null) setState(() => _format = v); },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _reportIdCtrl,
              decoration: const InputDecoration(labelText: 'Report ID'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _filtersCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Filters', helperText: 'JSON filters', alignLabelWithHint: true),
            ),
          ],
        ),
      ),
    );
  }
}
