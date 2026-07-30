import 'package:flutter/material.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/form_fields.dart';
import '../providers/healthcare_providers.dart';

class PatientFormPage extends ConsumerStatefulWidget {
  const PatientFormPage({super.key, this.id});
  static const String routeName = 'patient-form';
  static const String routePath = '/patient-form';

  final String? id;

  @override
  ConsumerState<PatientFormPage> createState() => _PatientFormPageState();
}

class _PatientFormPageState extends ConsumerState<PatientFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _emailController = TextEditingController();
  final _addressController = TextEditingController();
  final _bloodGroupController = TextEditingController();
  final _allergiesController = TextEditingController();
  final _medicalHistoryController = TextEditingController();
  final _emergencyContactNameController = TextEditingController();
  final _emergencyContactPhoneController = TextEditingController();
  String _status = 'ACTIVE';
  String? _gender;
  DateTime? _dateOfBirth;
  bool _isLoading = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.id != null) _loadExisting();
  }

  Future<void> _loadExisting() async {
    final patient = await ref.read(patientDetailProvider(widget.id!).future);
    if (!mounted) return;
    _nameController.text = patient.name;
    _phoneController.text = patient.phone ?? '';
    _emailController.text = patient.email ?? '';
    _addressController.text = patient.address ?? '';
    _bloodGroupController.text = patient.bloodGroup ?? '';
    _allergiesController.text = patient.allergies ?? '';
    _medicalHistoryController.text = patient.medicalHistory ?? '';
    _emergencyContactNameController.text = patient.emergencyContactName ?? '';
    _emergencyContactPhoneController.text = patient.emergencyContactPhone ?? '';
    _status = patient.status;
    _gender = patient.gender;
    _dateOfBirth = patient.dateOfBirth;
    setState(() => _isInitialized = true);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _emailController.dispose();
    _addressController.dispose();
    _bloodGroupController.dispose();
    _allergiesController.dispose();
    _medicalHistoryController.dispose();
    _emergencyContactNameController.dispose();
    _emergencyContactPhoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final payload = <String, dynamic>{
      'name': _nameController.text.trim(),
      'phone': _phoneController.text.trim(),
      'email': _emailController.text.trim(),
      'address': _addressController.text.trim(),
      'bloodGroup': _bloodGroupController.text.trim(),
      'allergies': _allergiesController.text.trim(),
      'medicalHistory': _medicalHistoryController.text.trim(),
      'emergencyContactName': _emergencyContactNameController.text.trim(),
      'emergencyContactPhone': _emergencyContactPhoneController.text.trim(),
      'status': _status,
      'gender': _gender,
      if (_dateOfBirth != null) 'dateOfBirth': _dateOfBirth!.toIso8601String(),
    };
    final result = await ref.read(patientListControllerProvider.notifier).save(payload, id: widget.id);
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
        appBar: AppBar(title: const Text('Edit Patient')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.id != null ? 'Edit Patient' : 'New Patient')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            UiTextField(
              label: 'Name',
              controller: _nameController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiDropdownField(
              label: 'Gender',
              itemLabel: (v) => v.toString(),
              selectedItem: _gender,
              items: const ['MALE', 'FEMALE', 'OTHER'],
              onChanged: (v) => setState(() => _gender = v),
            ),
            UiDatePickerField(
              label: 'Date of Birth',
              selectedDate: _dateOfBirth,
              onChanged: (v) => setState(() => _dateOfBirth = v),
            ),
            UiTextField(label: 'Phone', controller: _phoneController, keyboardType: TextInputType.phone),
            UiTextField(label: 'Email', controller: _emailController, keyboardType: TextInputType.emailAddress),
            UiTextField(label: 'Address', controller: _addressController, maxLines: 2),
            UiTextField(label: 'Blood Group', controller: _bloodGroupController),
            UiTextField(label: 'Allergies', controller: _allergiesController, maxLines: 2),
            UiTextField(label: 'Medical History', controller: _medicalHistoryController, maxLines: 3),
            const Divider(height: 32),
            const Text('Emergency Contact', style: TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            UiTextField(label: 'Contact Name', controller: _emergencyContactNameController),
            UiTextField(label: 'Contact Phone', controller: _emergencyContactPhoneController, keyboardType: TextInputType.phone),
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