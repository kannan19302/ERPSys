import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/education.dart';
import '../providers/education_providers.dart';

class StudentFormPage extends ConsumerStatefulWidget {
  const StudentFormPage({this.studentId, super.key});

  static const String routeName = 'student-new';
  static const String routeEditName = 'student-edit';
  static const String routePath = '/education/students/new';
  static const String routeEditPath = '/education/students/:id/edit';

  final String? studentId;

  @override
  ConsumerState<StudentFormPage> createState() => _StudentFormPageState();
}

class _StudentFormPageState extends ConsumerState<StudentFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _firstNameCtrl = TextEditingController();
  final TextEditingController _lastNameCtrl = TextEditingController();
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _phoneCtrl = TextEditingController();
  final TextEditingController _addressCtrl = TextEditingController();
  final TextEditingController _enrollmentNumberCtrl = TextEditingController();
  final TextEditingController _guardianNameCtrl = TextEditingController();
  final TextEditingController _guardianPhoneCtrl = TextEditingController();

  String _status = 'ACTIVE';
  String _gender = 'NOT_SPECIFIED';
  DateTime? _dateOfBirth;
  bool _saving = false;

  bool get _isEditing => widget.studentId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _loadStudent();
  }

  Future<void> _loadStudent() async {
    final Student? s = ref.read(studentDetailProvider(widget.studentId!)).valueOrNull;
    if (s != null) {
      _firstNameCtrl.text = s.firstName; _lastNameCtrl.text = s.lastName;
      _emailCtrl.text = s.email ?? ''; _phoneCtrl.text = s.phone ?? '';
      _addressCtrl.text = s.address ?? ''; _enrollmentNumberCtrl.text = s.enrollmentNumber ?? '';
      _guardianNameCtrl.text = s.guardianName ?? ''; _guardianPhoneCtrl.text = s.guardianPhone ?? '';
      _status = s.status; _gender = s.gender ?? 'NOT_SPECIFIED'; _dateOfBirth = s.dateOfBirth;
    }
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose(); _lastNameCtrl.dispose(); _emailCtrl.dispose();
    _phoneCtrl.dispose(); _addressCtrl.dispose(); _enrollmentNumberCtrl.dispose();
    _guardianNameCtrl.dispose(); _guardianPhoneCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'firstName': _firstNameCtrl.text.trim(), 'lastName': _lastNameCtrl.text.trim(),
      'email': _emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
      'address': _addressCtrl.text.trim().isEmpty ? null : _addressCtrl.text.trim(),
      'enrollmentNumber': _enrollmentNumberCtrl.text.trim().isEmpty ? null : _enrollmentNumberCtrl.text.trim(),
      'guardianName': _guardianNameCtrl.text.trim().isEmpty ? null : _guardianNameCtrl.text.trim(),
      'guardianPhone': _guardianPhoneCtrl.text.trim().isEmpty ? null : _guardianPhoneCtrl.text.trim(),
      'status': _status, 'gender': _gender,
      'dateOfBirth': _dateOfBirth?.toIso8601String(),
    };
    final result = await ref.read(studentListControllerProvider.notifier).save(payload, id: widget.studentId);
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
        title: Text(_isEditing ? 'Edit Student' : 'New Student'),
        actions: <Widget>[
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
          children: <Widget>[
            Row(children: <Widget>[
              Expanded(child: TextFormField(controller: _firstNameCtrl, decoration: const InputDecoration(labelText: 'First Name *'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null)),
              const SizedBox(width: Spacing.x4),
              Expanded(child: TextFormField(controller: _lastNameCtrl, decoration: const InputDecoration(labelText: 'Last Name *'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null)),
            ]),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _emailCtrl, keyboardType: TextInputType.emailAddress, decoration: const InputDecoration(labelText: 'Email')),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _phoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Phone')),
            const SizedBox(height: Spacing.x4),
            Row(children: <Widget>[
              Expanded(child: DropdownButtonFormField<String>(
                value: _gender, decoration: const InputDecoration(labelText: 'Gender'),
                items: const [
                  DropdownMenuItem(value: 'MALE', child: Text('Male')),
                  DropdownMenuItem(value: 'FEMALE', child: Text('Female')),
                  DropdownMenuItem(value: 'NOT_SPECIFIED', child: Text('Not Specified')),
                ],
                onChanged: (v) { if (v != null) setState(() => _gender = v); },
              )),
              const SizedBox(width: Spacing.x4),
              Expanded(child: TextFormField(
                readOnly: true,
                decoration: InputDecoration(
                  labelText: 'Date of Birth',
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.calendar_today),
                    onPressed: () async {
                      final picked = await showDatePicker(
                        context: context, initialDate: _dateOfBirth ?? DateTime(2000),
                        firstDate: DateTime(1950), lastDate: DateTime.now(),
                      );
                      if (picked != null) setState(() => _dateOfBirth = picked);
                    },
                  ),
                ),
                controller: TextEditingController(
                  text: _dateOfBirth != null ? '${_dateOfBirth!.toLocal()}'.substring(0, 10) : '',
                ),
              )),
            ]),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _addressCtrl, maxLines: 2, decoration: const InputDecoration(labelText: 'Address', alignLabelWithHint: true)),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _enrollmentNumberCtrl, decoration: const InputDecoration(labelText: 'Enrollment #')),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _guardianNameCtrl, textCapitalization: TextCapitalization.words, decoration: const InputDecoration(labelText: 'Guardian Name')),
            const SizedBox(height: Spacing.x4),
            TextFormField(controller: _guardianPhoneCtrl, keyboardType: TextInputType.phone, decoration: const InputDecoration(labelText: 'Guardian Phone')),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status, decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem(value: 'INACTIVE', child: Text('Inactive')),
              ],
              onChanged: (v) { if (v != null) setState(() => _status = v); },
            ),
          ],
        ),
      ),
    );
  }
}