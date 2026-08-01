import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../../../core/widgets/form_fields.dart';
import '../../domain/entities/hr.dart';
import '../providers/hr_providers.dart';

class PayrollRunFormPage extends ConsumerStatefulWidget {
  const PayrollRunFormPage({super.key});

  static const String routeName = 'payroll-run-new';
  static const String routePath = '/hr/payroll/new';

  @override
  ConsumerState<PayrollRunFormPage> createState() => _PayrollRunFormPageState();
}

class _PayrollRunFormPageState extends ConsumerState<PayrollRunFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _employeeCountCtrl = TextEditingController(text: '0');

  DateTime _periodStart = DateTime.now();
  DateTime _periodEnd = DateTime.now().add(const Duration(days: 30));
  bool _saving = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _employeeCountCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'periodStart': _periodStart.toIso8601String(),
      'periodEnd': _periodEnd.toIso8601String(),
      'totalEmployees': int.tryParse(_employeeCountCtrl.text) ?? 0,
      'status': PayrollRunStatus.draft,
    };

    final Result<PayrollRun> result = await ref
        .read(payrollRunListControllerProvider.notifier)
        .save(payload);

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
        title: const Text('New Payroll Run'),
        actions: <Widget>[
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(
                    height: Spacing.x5,
                    width: Spacing.x5,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : const Text('Create'),
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
              decoration: const InputDecoration(
                labelText: 'Run Name *',
                hintText: 'e.g. July 2026 Salary',
              ),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            UiDatePickerField(
              label: 'Period Start',
              selectedDate: _periodStart,
              onChanged: (DateTime? d) {
                if (d != null) setState(() => _periodStart = d);
              },
            ),
            const SizedBox(height: Spacing.x4),
            UiDatePickerField(
              label: 'Period End',
              selectedDate: _periodEnd,
              firstDate: _periodStart,
              onChanged: (DateTime? d) {
                if (d != null) setState(() => _periodEnd = d);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _employeeCountCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Employee Count',
              ),
            ),
          ],
        ),
      ),
    );
  }
}