import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../domain/entities/real_estate.dart';
import '../providers/real_estate_providers.dart';

class LeaseFormPage extends ConsumerStatefulWidget {
  const LeaseFormPage({this.leaseId, this.propertyId, super.key});
  static const String routeName = 'lease-new';
  static const String routeEditName = 'lease-edit';
  static const String routePath = '/real-estate/leases/new';
  static const String routeEditPath = '/real-estate/leases/:id/edit';
  final String? leaseId;
  final String? propertyId;

  @override
  ConsumerState<LeaseFormPage> createState() => _LeaseFormPageState();
}

class _LeaseFormPageState extends ConsumerState<LeaseFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _leaseNumberCtrl = TextEditingController();
  final _monthlyRentCtrl = TextEditingController();
  final _depositCtrl = TextEditingController();
  final _paymentDayCtrl = TextEditingController();
  final _renewalTermsCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  DateTime? _startDate;
  DateTime? _endDate;
  String _status = 'ACTIVE';
  String _currency = 'USD';
  bool _saving = false;
  bool get _isEditing => widget.leaseId != null;

  @override
  void dispose() { _leaseNumberCtrl.dispose(); _monthlyRentCtrl.dispose(); _depositCtrl.dispose(); _paymentDayCtrl.dispose(); _renewalTermsCtrl.dispose(); _notesCtrl.dispose(); super.dispose(); }

  Future<void> _pickDate(bool isStart) async {
    final picked = await showDatePicker(context: context, initialDate: DateTime.now(), firstDate: DateTime(2020), lastDate: DateTime(2035));
    if (picked != null) setState(() { if (isStart) _startDate = picked; else _endDate = picked; });
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'leaseNumber': _leaseNumberCtrl.text.trim(), 'propertyId': widget.propertyId,
      'monthlyRent': double.tryParse(_monthlyRentCtrl.text) ?? 0, 'securityDeposit': double.tryParse(_depositCtrl.text) ?? 0,
      'currency': _currency, 'paymentDay': int.tryParse(_paymentDayCtrl.text) ?? 1, 'status': _status,
      'startDate': _startDate?.toIso8601String(), 'endDate': _endDate?.toIso8601String(),
      'renewalTerms': _renewalTermsCtrl.text.trim().isEmpty ? null : _renewalTermsCtrl.text.trim(),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    };
    final result = await ref.read(propertyListControllerProvider.notifier).saveLease(payload, id: widget.leaseId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit Lease' : 'New Lease'), actions: [TextButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save'))]),
      body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        TextFormField(controller: _leaseNumberCtrl, decoration: const InputDecoration(labelText: 'Lease Number *'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _monthlyRentCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Monthly Rent *'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _depositCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Security Deposit')),
        const SizedBox(height: Spacing.x4),
        Row(children: [
          Expanded(child: TextFormField(controller: _paymentDayCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Payment Day'))),
          const SizedBox(width: Spacing.x3),
          Expanded(child: DropdownButtonFormField<String>(value: _currency, decoration: const InputDecoration(labelText: 'Currency'), items: const [
            DropdownMenuItem(value: 'USD', child: Text('USD')), DropdownMenuItem(value: 'EUR', child: Text('EUR')),
            DropdownMenuItem(value: 'GBP', child: Text('GBP')), DropdownMenuItem(value: 'INR', child: Text('INR')),
          ], onChanged: (v) { if (v != null) setState(() => _currency = v); })),
        ]),
        const SizedBox(height: Spacing.x4),
        DropdownButtonFormField<String>(value: _status, decoration: const InputDecoration(labelText: 'Status'), items: const [
          DropdownMenuItem(value: 'ACTIVE', child: Text('Active')), DropdownMenuItem(value: 'PENDING', child: Text('Pending')),
          DropdownMenuItem(value: 'EXPIRED', child: Text('Expired')), DropdownMenuItem(value: 'TERMINATED', child: Text('Terminated')),
        ], onChanged: (v) { if (v != null) setState(() => _status = v); }),
        const SizedBox(height: Spacing.x4),
        Row(children: [
          Expanded(child: InkWell(onTap: () => _pickDate(true), child: InputDecorator(decoration: const InputDecoration(labelText: 'Start Date'), child: Text(_startDate != null ? Formatters.date(_startDate!) : 'Tap to select')))),
          const SizedBox(width: Spacing.x3),
          Expanded(child: InkWell(onTap: () => _pickDate(false), child: InputDecorator(decoration: const InputDecoration(labelText: 'End Date'), child: Text(_endDate != null ? Formatters.date(_endDate!) : 'Tap to select')))),
        ]),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _renewalTermsCtrl, maxLines: 2, decoration: const InputDecoration(labelText: 'Renewal Terms')),
        const SizedBox(height: Spacing.x4),
        TextFormField(controller: _notesCtrl, maxLines: 3, decoration: const InputDecoration(labelText: 'Notes', alignLabelWithHint: true)),
      ])),
    );
  }
}