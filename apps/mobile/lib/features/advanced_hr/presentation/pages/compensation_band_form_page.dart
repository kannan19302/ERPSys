import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/advanced_hr.dart';
import '../providers/advanced_hr_providers.dart';

class CompensationBandFormPage extends ConsumerStatefulWidget {
  const CompensationBandFormPage({this.bandId, super.key});

  static const String routeName = 'compensation-band-new';
  static const String routeEditName = 'compensation-band-edit';
  static const String routePath = '/advanced-hr/compensation-bands/new';
  static const String routeEditPath = '/advanced-hr/compensation-bands/:id/edit';

  final String? bandId;

  @override
  ConsumerState<CompensationBandFormPage> createState() => _CompensationBandFormPageState();
}

class _CompensationBandFormPageState extends ConsumerState<CompensationBandFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _minSalaryCtrl = TextEditingController();
  final TextEditingController _maxSalaryCtrl = TextEditingController();
  final TextEditingController _currencyCtrl = TextEditingController();
  final TextEditingController _gradeCtrl = TextEditingController();
  final TextEditingController _notesCtrl = TextEditingController();

  String _status = 'ACTIVE';
  bool _saving = false;

  bool get _isEditing => widget.bandId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadBand();
    }
  }

  Future<void> _loadBand() async {
    final CompensationBand? band = ref
        .read(compensationBandDetailProvider(widget.bandId!))
        .valueOrNull;
    if (band != null) {
      _nameCtrl.text = band.name;
      _minSalaryCtrl.text = band.minSalary.toString();
      _maxSalaryCtrl.text = band.maxSalary.toString();
      _currencyCtrl.text = band.currency;
      _gradeCtrl.text = band.grade ?? '';
      _notesCtrl.text = band.notes ?? '';
      _status = band.status;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _minSalaryCtrl.dispose();
    _maxSalaryCtrl.dispose();
    _currencyCtrl.dispose();
    _gradeCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'minSalary': double.tryParse(_minSalaryCtrl.text) ?? 0,
      'maxSalary': double.tryParse(_maxSalaryCtrl.text) ?? 0,
      'currency': _currencyCtrl.text.trim().isEmpty ? 'USD' : _currencyCtrl.text.trim().toUpperCase(),
      'grade': _gradeCtrl.text.trim().isEmpty ? null : _gradeCtrl.text.trim(),
      'status': _status,
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    };

    final Result<CompensationBand> result = await ref
        .read(compensationBandListControllerProvider.notifier)
        .save(payload, id: widget.bandId);

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
        title: Text(_isEditing ? 'Edit Compensation Band' : 'New Compensation Band'),
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
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Name *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _minSalaryCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Min Salary *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _maxSalaryCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Max Salary *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _currencyCtrl,
              decoration: const InputDecoration(
                labelText: 'Currency',
                helperText: 'Default: USD',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _gradeCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Grade'),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem<String>(value: 'INACTIVE', child: Text('Inactive')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Notes',
                alignLabelWithHint: true,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
