import 'package:flutter/material.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/form_fields.dart';
import '../providers/healthcare_providers.dart';

class LabOrderFormPage extends ConsumerStatefulWidget {
  const LabOrderFormPage({super.key, this.id});
  static const String routeName = 'lab-order-form';
  static const String routePath = '/lab-order-form';

  final String? id;

  @override
  ConsumerState<LabOrderFormPage> createState() => _LabOrderFormPageState();
}

class _LabOrderFormPageState extends ConsumerState<LabOrderFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _patientIdController = TextEditingController();
  final _patientNameController = TextEditingController();
  final _doctorNameController = TextEditingController();
  final _medicationsController = TextEditingController();
  final _diagnosisController = TextEditingController();
  final _notesController = TextEditingController();
  final _refillCountController = TextEditingController();
  String _status = 'ACTIVE';
  DateTime? _prescriptionDate;
  bool _isLoading = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.id != null) _loadExisting();
  }

  Future<void> _loadExisting() async {
    final rx = await ref.read(prescriptionDetailProvider(widget.id!).future);
    if (!mounted) return;
    _patientIdController.text = rx.patientId;
    _patientNameController.text = rx.patientName;
    _doctorNameController.text = rx.doctorName ?? '';
    _medicationsController.text = rx.medications ?? '';
    _diagnosisController.text = rx.diagnosis ?? '';
    _notesController.text = rx.notes ?? '';
    _refillCountController.text = rx.refillCount.toString();
    _status = rx.status;
    _prescriptionDate = rx.prescriptionDate;
    setState(() => _isInitialized = true);
  }

  @override
  void dispose() {
    _patientIdController.dispose();
    _patientNameController.dispose();
    _doctorNameController.dispose();
    _medicationsController.dispose();
    _diagnosisController.dispose();
    _notesController.dispose();
    _refillCountController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final payload = <String, dynamic>{
      'patientId': _patientIdController.text.trim(),
      'patientName': _patientNameController.text.trim(),
      'doctorName': _doctorNameController.text.trim(),
      'medications': _medicationsController.text.trim(),
      'diagnosis': _diagnosisController.text.trim(),
      'notes': _notesController.text.trim(),
      'refillCount': int.tryParse(_refillCountController.text.trim()) ?? 0,
      'status': _status,
      if (_prescriptionDate != null) 'prescriptionDate': _prescriptionDate!.toIso8601String(),
    };
    final result = await ref.read(prescriptionListControllerProvider.notifier).save(payload, id: widget.id);
    if (!mounted) return;
    setState(() => _isLoading = false);
    result.fold(
      (f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(true),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.id != null && !_isInitialized) {
      return Scaffold(
        appBar: AppBar(title: const Text('Edit Prescription')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.id != null ? 'Edit Prescription' : 'New Prescription')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            UiTextField(
              label: 'Patient ID',
              controller: _patientIdController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiTextField(
              label: 'Patient Name',
              controller: _patientNameController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiTextField(label: 'Doctor Name', controller: _doctorNameController),
            UiDropdownField(
              label: 'Status',
              itemLabel: (v) => v.toString(),
              selectedItem: _status,
              items: const ['ACTIVE', 'DISCONTINUED', 'EXPIRED'],
              onChanged: (v) => setState(() => _status = v!),
            ),
            UiDatePickerField(
              label: 'Prescription Date',
              selectedDate: _prescriptionDate,
              onChanged: (v) => setState(() => _prescriptionDate = v),
            ),
            UiTextField(label: 'Medications', controller: _medicationsController, maxLines: 4),
            UiTextField(label: 'Diagnosis', controller: _diagnosisController, maxLines: 3),
            UiTextField(
              label: 'Refill Count',
              controller: _refillCountController,
              keyboardType: TextInputType.number,
            ),
            UiTextField(label: 'Notes', controller: _notesController, maxLines: 3),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              child: _isLoading
                  ? const SizedBox(height: 20, width: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}