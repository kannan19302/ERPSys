import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/crm.dart';
import '../providers/crm_providers.dart';

class ContactFormPage extends ConsumerStatefulWidget {
  const ContactFormPage({this.contactId, super.key});

  static const String routeName = 'contact-new';
  static const String routeEditName = 'contact-edit';
  static const String routePath = '/crm/contacts/new';
  static const String routeEditPath = '/crm/contacts/:id/edit';

  final String? contactId;

  @override
  ConsumerState<ContactFormPage> createState() => _ContactFormPageState();
}

class _ContactFormPageState extends ConsumerState<ContactFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _firstNameCtrl = TextEditingController();
  final TextEditingController _lastNameCtrl = TextEditingController();
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _phoneCtrl = TextEditingController();
  final TextEditingController _mobileCtrl = TextEditingController();
  final TextEditingController _positionCtrl = TextEditingController();
  final TextEditingController _departmentCtrl = TextEditingController();
  final TextEditingController _notesCtrl = TextEditingController();

  String _customerId = '';
  bool _isPrimary = false;
  bool _saving = false;

  String? _customerIdError;

  bool get _isEditing => widget.contactId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadContact();
    }
  }

  Future<void> _loadContact() async {
    final Contact? contact = ref
        .read(contactDetailProvider(widget.contactId!))
        .valueOrNull;
    if (contact != null) {
      _firstNameCtrl.text = contact.firstName ?? '';
      _lastNameCtrl.text = contact.lastName ?? '';
      _emailCtrl.text = contact.email ?? '';
      _phoneCtrl.text = contact.phone ?? '';
      _mobileCtrl.text = contact.mobile ?? '';
      _positionCtrl.text = contact.position ?? '';
      _departmentCtrl.text = contact.department ?? '';
      _notesCtrl.text = contact.notes ?? '';
      _customerId = contact.customerId;
      _isPrimary = contact.isPrimary;
    }
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _mobileCtrl.dispose();
    _positionCtrl.dispose();
    _departmentCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    if (_customerId.isEmpty) {
      setState(() => _customerIdError = 'Customer is required');
      return;
    }
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'customerId': _customerId,
      'firstName': _firstNameCtrl.text.trim(),
      'lastName': _lastNameCtrl.text.trim(),
      'email': _emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
      'mobile': _mobileCtrl.text.trim().isEmpty ? null : _mobileCtrl.text.trim(),
      'position': _positionCtrl.text.trim().isEmpty ? null : _positionCtrl.text.trim(),
      'department': _departmentCtrl.text.trim().isEmpty ? null : _departmentCtrl.text.trim(),
      'isPrimary': _isPrimary,
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    };

    final Result<Contact> result = await ref
        .read(contactsProvider.notifier)
        .save(payload, id: widget.contactId);

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
        title: Text(_isEditing ? 'Edit Contact' : 'New Contact'),
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
              controller: _firstNameCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'First Name'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _lastNameCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Last Name'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
              validator: (String? v) {
                if (v == null || v.trim().isEmpty) return null;
                if (!v.contains('@')) return 'Invalid email';
                return null;
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Phone'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _mobileCtrl,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(labelText: 'Mobile'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _positionCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Position'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _departmentCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Department'),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _customerId.isEmpty ? null : _customerId,
              decoration: InputDecoration(
                labelText: 'Customer',
                errorText: _customerIdError,
              ),
              items: const <DropdownMenuItem<String>>[],
              onChanged: (String? v) {
                setState(() {
                  _customerId = v ?? '';
                  _customerIdError = null;
                });
              },
            ),
            const SizedBox(height: Spacing.x4),
            SwitchListTile(
              title: const Text('Primary contact'),
              value: _isPrimary,
              onChanged: (bool v) => setState(() => _isPrimary = v),
              contentPadding: EdgeInsets.zero,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 4,
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
