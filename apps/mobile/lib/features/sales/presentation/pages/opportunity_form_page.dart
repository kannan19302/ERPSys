import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/sales.dart';
import '../providers/sales_providers.dart';

class OpportunityFormPage extends ConsumerStatefulWidget {
  const OpportunityFormPage({this.opportunityId, super.key});

  static const String routeName = 'opportunity-new';
  static const String routeEditName = 'opportunity-edit';
  static const String routePath = '/sales/opportunities/new';
  static const String routeEditPath = '/sales/opportunities/:id/edit';

  final String? opportunityId;

  @override
  ConsumerState<OpportunityFormPage> createState() => _OpportunityFormPageState();
}

class _OpportunityFormPageState extends ConsumerState<OpportunityFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _customerCtrl = TextEditingController();
  final TextEditingController _companyCtrl = TextEditingController();
  final TextEditingController _contactCtrl = TextEditingController();
  final TextEditingController _amountCtrl = TextEditingController();
  final TextEditingController _currencyCtrl = TextEditingController(text: 'USD');
  final TextEditingController _notesCtrl = TextEditingController();
  final TextEditingController _assignedCtrl = TextEditingController();

  String _stage = 'PROSPECTING';
  String _pipeline = '';
  double _probability = 50;
  DateTime? _closeDate;
  bool _saving = false;

  bool get _isEditing => widget.opportunityId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadOpportunity();
    }
  }

  Future<void> _loadOpportunity() async {
    final Opportunity? opp = ref
        .read(opportunityDetailProvider(widget.opportunityId!))
        .valueOrNull;
    if (opp != null) {
      _titleCtrl.text = opp.title;
      _customerCtrl.text = opp.customerName;
      _companyCtrl.text = opp.company ?? '';
      _contactCtrl.text = opp.contactName ?? '';
      _amountCtrl.text = opp.expectedRevenue?.toString() ?? '';
      _currencyCtrl.text = opp.currency ?? 'USD';
      _notesCtrl.text = opp.notes ?? '';
      _assignedCtrl.text = opp.assignedTo ?? '';
      _stage = opp.stage;
      _pipeline = opp.pipelineName ?? '';
      _probability = opp.probability ?? 50;
      _closeDate = opp.closeDate;
    }
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _customerCtrl.dispose();
    _companyCtrl.dispose();
    _contactCtrl.dispose();
    _amountCtrl.dispose();
    _currencyCtrl.dispose();
    _notesCtrl.dispose();
    _assignedCtrl.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _closeDate ?? DateTime.now().add(const Duration(days: 30)),
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365 * 2)),
    );
    if (picked != null) {
      setState(() => _closeDate = picked);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'title': _titleCtrl.text.trim(),
      'customerName': _customerCtrl.text.trim(),
      'company': _companyCtrl.text.trim().isEmpty ? null : _companyCtrl.text.trim(),
      'contactName': _contactCtrl.text.trim().isEmpty ? null : _contactCtrl.text.trim(),
      'expectedRevenue': double.tryParse(_amountCtrl.text),
      'currency': _currencyCtrl.text.trim().isEmpty ? null : _currencyCtrl.text.trim(),
      'stage': _stage,
      'probability': _probability,
      'closeDate': _closeDate?.toIso8601String(),
      'pipelineName': _pipeline.isEmpty ? null : _pipeline,
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      'assignedTo': _assignedCtrl.text.trim().isEmpty ? null : _assignedCtrl.text.trim(),
    };

    final Result<Opportunity> result = await ref
        .read(opportunitiesProvider.notifier)
        .save(payload, id: widget.opportunityId);

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
        title: Text(_isEditing ? 'Edit Opportunity' : 'New Opportunity'),
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
              controller: _titleCtrl,
              decoration: const InputDecoration(labelText: 'Opportunity Name *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _customerCtrl,
              decoration: const InputDecoration(labelText: 'Customer *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _companyCtrl,
              decoration: const InputDecoration(labelText: 'Company'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _contactCtrl,
              decoration: const InputDecoration(labelText: 'Contact'),
            ),
            const SizedBox(height: Spacing.x4),
            Row(
              children: <Widget>[
                Expanded(
                  child: TextFormField(
                    controller: _amountCtrl,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(labelText: 'Amount'),
                  ),
                ),
                const SizedBox(width: Spacing.x3),
                Expanded(
                  child: TextFormField(
                    controller: _currencyCtrl,
                    decoration: const InputDecoration(labelText: 'Currency'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: Spacing.x4),
            InkWell(
              onTap: _selectDate,
              child: InputDecorator(
                decoration: InputDecoration(
                  labelText: 'Expected Close Date',
                  suffixIcon: const Icon(Icons.calendar_today_outlined),
                ),
                child: Text(
                  _closeDate != null
                      ? '${_closeDate!.toLocal()}'.split(' ')[0]
                      : 'Select date',
                ),
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _stage,
              decoration: const InputDecoration(labelText: 'Stage'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'PROSPECTING', child: Text('Prospecting')),
                DropdownMenuItem<String>(value: 'QUALIFICATION', child: Text('Qualification')),
                DropdownMenuItem<String>(value: 'NEGOTIATION', child: Text('Negotiation')),
                DropdownMenuItem<String>(value: 'CLOSED_WON', child: Text('Closed Won')),
                DropdownMenuItem<String>(value: 'CLOSED_LOST', child: Text('Closed Lost')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _stage = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _assignedCtrl,
              decoration: const InputDecoration(labelText: 'Assigned To'),
            ),
            const SizedBox(height: Spacing.x4),
            Text('Probability: ${_probability.round()}%',
                style: Theme.of(context).textTheme.bodySmall),
            Slider(
              value: _probability,
              min: 0,
              max: 100,
              divisions: 20,
              label: '${_probability.round()}%',
              onChanged: (double v) => setState(() => _probability = v),
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
