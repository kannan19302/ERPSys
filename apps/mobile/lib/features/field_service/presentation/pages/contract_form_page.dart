import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/form_fields.dart';
import '../providers/field_service_providers.dart';

class ContractFormPage extends ConsumerStatefulWidget {
  const ContractFormPage({super.key, this.id});

  final String? id;

  @override
  ConsumerState<ContractFormPage> createState() => _ContractFormPageState();
}

class _ContractFormPageState extends ConsumerState<ContractFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _contractNumberController = TextEditingController();
  final _customerNameController = TextEditingController();
  final _serviceTypeController = TextEditingController();
  final _contractValueController = TextEditingController();
  final _billingCycleController = TextEditingController();
  final _termsController = TextEditingController();
  final _notesController = TextEditingController();
  String _status = 'DRAFT';
  DateTime? _startDate;
  DateTime? _endDate;
  bool _isLoading = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.id != null) _loadExisting();
  }

  Future<void> _loadExisting() async {
    final contract = await ref.read(serviceContractDetailProvider(widget.id!).future);
    if (!mounted) return;
    _contractNumberController.text = contract.contractNumber;
    _customerNameController.text = contract.customerName;
    _serviceTypeController.text = contract.serviceType ?? '';
    _contractValueController.text = contract.contractValue.toString();
    _billingCycleController.text = contract.billingCycle ?? '';
    _termsController.text = contract.terms ?? '';
    _notesController.text = contract.notes ?? '';
    _status = contract.status;
    _startDate = contract.startDate;
    _endDate = contract.endDate;
    setState(() => _isInitialized = true);
  }

  @override
  void dispose() {
    _contractNumberController.dispose();
    _customerNameController.dispose();
    _serviceTypeController.dispose();
    _contractValueController.dispose();
    _billingCycleController.dispose();
    _termsController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final payload = <String, dynamic>{
      'contractNumber': _contractNumberController.text.trim(),
      'customerName': _customerNameController.text.trim(),
      'serviceType': _serviceTypeController.text.trim(),
      'contractValue': double.tryParse(_contractValueController.text.trim()) ?? 0,
      'billingCycle': _billingCycleController.text.trim(),
      'terms': _termsController.text.trim(),
      'notes': _notesController.text.trim(),
      'status': _status,
      if (_startDate != null) 'startDate': _startDate!.toIso8601String(),
      if (_endDate != null) 'endDate': _endDate!.toIso8601String(),
    };
    final result = await ref.read(serviceContractListControllerProvider.notifier).save(payload, id: widget.id);
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
        appBar: AppBar(title: const Text('Edit Contract')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.id != null ? 'Edit Contract' : 'New Contract')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            UiTextField(
              label: 'Contract Number',
              controller: _contractNumberController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiTextField(
              label: 'Customer Name',
              controller: _customerNameController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiTextField(label: 'Service Type', controller: _serviceTypeController),
            UiDropdownField(
              label: 'Status',
              itemLabel: (v) => v.toString(),
              selectedItem: _status,
              items: const ['DRAFT', 'ACTIVE', 'SUSPENDED', 'EXPIRED'],
              onChanged: (v) => setState(() => _status = v!),
            ),
            UiDatePickerField(
              label: 'Start Date',
              selectedDate: _startDate,
              onChanged: (v) => setState(() => _startDate = v),
            ),
            UiDatePickerField(
              label: 'End Date',
              selectedDate: _endDate,
              onChanged: (v) => setState(() => _endDate = v),
            ),
            UiTextField(
              label: 'Contract Value',
              controller: _contractValueController,
              keyboardType: TextInputType.number,
            ),
            UiTextField(label: 'Billing Cycle', controller: _billingCycleController),
            UiTextField(label: 'Terms', controller: _termsController, maxLines: 3),
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