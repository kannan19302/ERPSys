import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/form_fields.dart';
import '../providers/healthcare_providers.dart';

class AppointmentFormPage extends ConsumerStatefulWidget {
  const AppointmentFormPage({super.key, this.id});

  final String? id;

  @override
  ConsumerState<AppointmentFormPage> createState() => _AppointmentFormPageState();
}

class _AppointmentFormPageState extends ConsumerState<AppointmentFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _patientIdController = TextEditingController();
  final _patientNameController = TextEditingController();
  final _doctorNameController = TextEditingController();
  final _specialtyController = TextEditingController();
  final _reasonController = TextEditingController();
  final _notesController = TextEditingController();
  String _status = 'SCHEDULED';
  DateTime? _appointmentDate;
  bool _isLoading = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.id != null) _loadExisting();
  }

  Future<void> _loadExisting() async {
    final apt = await ref.read(appointmentDetailProvider(widget.id!).future);
    if (!mounted) return;
    _patientIdController.text = apt.patientId;
    _patientNameController.text = apt.patientName;
    _doctorNameController.text = apt.doctorName ?? '';
    _specialtyController.text = apt.specialty ?? '';
    _reasonController.text = apt.reason ?? '';
    _notesController.text = apt.notes ?? '';
    _status = apt.status;
    _appointmentDate = apt.appointmentDate;
    setState(() => _isInitialized = true);
  }

  @override
  void dispose() {
    _patientIdController.dispose();
    _patientNameController.dispose();
    _doctorNameController.dispose();
    _specialtyController.dispose();
    _reasonController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final payload = <String, dynamic>{
      'patientId': _patientIdController.text.trim(),
      'patientName': _patientNameController.text.trim(),
      'doctorName': _doctorNameController.text.trim(),
      'specialty': _specialtyController.text.trim(),
      'reason': _reasonController.text.trim(),
      'notes': _notesController.text.trim(),
      'status': _status,
      if (_appointmentDate != null) 'appointmentDate': _appointmentDate!.toIso8601String(),
    };
    final result = await ref.read(appointmentListControllerProvider.notifier).save(payload, id: widget.id);
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
        appBar: AppBar(title: const Text('Edit Appointment')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.id != null ? 'Edit Appointment' : 'New Appointment')),
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
            UiTextField(label: 'Specialty', controller: _specialtyController),
            UiDropdownField(
              label: 'Status',
              itemLabel: (v) => v.toString(),
              selectedItem: _status,
              items: const ['SCHEDULED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'],
              onChanged: (v) => setState(() => _status = v!),
            ),
            UiDatePickerField(
              label: 'Appointment Date',
              selectedDate: _appointmentDate,
              onChanged: (v) => setState(() => _appointmentDate = v),
            ),
            UiTextField(label: 'Reason', controller: _reasonController, maxLines: 3),
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