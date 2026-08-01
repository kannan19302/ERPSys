import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/crm.dart';
import '../providers/crm_providers.dart';

class LeadFormPage extends ConsumerStatefulWidget {
  const LeadFormPage({this.leadId, super.key});

  static const String routeName = 'lead-new';
  static const String routeEditName = 'lead-edit';
  static const String routePath = '/crm/leads/new';
  static const String routeEditPath = '/crm/leads/:id/edit';

  final String? leadId;

  @override
  ConsumerState<LeadFormPage> createState() => _LeadFormPageState();
}

class _LeadFormPageState extends ConsumerState<LeadFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _firstNameCtrl = TextEditingController();
  final TextEditingController _lastNameCtrl = TextEditingController();
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _phoneCtrl = TextEditingController();
  final TextEditingController _companyCtrl = TextEditingController();
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _industryCtrl = TextEditingController();
  final TextEditingController _estimatedRevenueCtrl = TextEditingController();
  final TextEditingController _notesCtrl = TextEditingController();
  final TextEditingController _assignedToCtrl = TextEditingController();

  String _salutation = '';
  String _source = '';
  String _status = 'NEW';
  bool _saving = false;

  bool get _isEditing => widget.leadId != null;

  static const List<String> _salutations = <String>[
    'Mr.', 'Ms.', 'Mrs.', 'Dr.', 'Prof.',
  ];

  static const List<String> _statuses = <String>[
    'NEW', 'CONTACTED', 'QUALIFIED', 'DISQUALIFIED',
  ];

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadLead();
    }
  }

  Future<void> _loadLead() async {
    final Lead? lead = ref
        .read(leadDetailProvider(widget.leadId!))
        .valueOrNull;
    if (lead != null) {
      _salutation = lead.salutation ?? '';
      _firstNameCtrl.text = lead.firstName ?? '';
      _lastNameCtrl.text = lead.lastName ?? '';
      _emailCtrl.text = lead.email ?? '';
      _phoneCtrl.text = lead.phone ?? '';
      _companyCtrl.text = lead.company ?? '';
      _titleCtrl.text = lead.title ?? '';
      _source = lead.source ?? '';
      _status = lead.status;
      _industryCtrl.text = lead.industry ?? '';
      _estimatedRevenueCtrl.text = lead.estimatedRevenue?.toString() ?? '';
      _notesCtrl.text = lead.notes ?? '';
      _assignedToCtrl.text = lead.assignedTo ?? '';
    }
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _companyCtrl.dispose();
    _titleCtrl.dispose();
    _industryCtrl.dispose();
    _estimatedRevenueCtrl.dispose();
    _notesCtrl.dispose();
    _assignedToCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      if (_salutation.isNotEmpty) 'salutation': _salutation,
      'firstName': _firstNameCtrl.text.trim(),
      'lastName': _lastNameCtrl.text.trim(),
      'email': _emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
      'company': _companyCtrl.text.trim().isEmpty ? null : _companyCtrl.text.trim(),
      'title': _titleCtrl.text.trim().isEmpty ? null : _titleCtrl.text.trim(),
      if (_source.isNotEmpty) 'source': _source,
      'status': _status,
      'industry': _industryCtrl.text.trim().isEmpty ? null : _industryCtrl.text.trim(),
      'estimatedRevenue': double.tryParse(_estimatedRevenueCtrl.text),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      'assignedTo': _assignedToCtrl.text.trim().isEmpty ? null : _assignedToCtrl.text.trim(),
    };

    final Result<Lead> result = await ref
        .read(leadsProvider.notifier)
        .save(payload, id: widget.leadId);

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
        title: Text(_isEditing ? 'Edit Lead' : 'New Lead'),
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
            DropdownButtonFormField<String>(
              initialValue: _salutation.isEmpty ? null : _salutation,
              decoration: const InputDecoration(labelText: 'Salutation'),
              items: _salutations
                  .map(
                    (String s) => DropdownMenuItem<String>(
                      value: s,
                      child: Text(s),
                    ),
                  )
                  .toList(),
              onChanged: (String? v) {
                if (v != null) setState(() => _salutation = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _firstNameCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'First Name *'),
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
              controller: _companyCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Company'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _titleCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Title'),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: _statuses
                  .map(
                    (String s) => DropdownMenuItem<String>(
                      value: s,
                      child: Text(s),
                    ),
                  )
                  .toList(),
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _industryCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Industry'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _estimatedRevenueCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Estimated Revenue',
                helperText: 'Optional',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _assignedToCtrl,
              decoration: const InputDecoration(labelText: 'Assigned To'),
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
