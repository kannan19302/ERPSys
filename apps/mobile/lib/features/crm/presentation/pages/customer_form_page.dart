import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/crm.dart';
import '../providers/crm_providers.dart';

class CustomerFormPage extends ConsumerStatefulWidget {
  const CustomerFormPage({this.customerId, super.key});

  static const String routeName = 'customer-new';
  static const String routeEditName = 'customer-edit';
  static const String routePath = '/crm/customers/new';
  static const String routeEditPath = '/crm/customers/:id/edit';

  final String? customerId;

  @override
  ConsumerState<CustomerFormPage> createState() => _CustomerFormPageState();
}

class _CustomerFormPageState extends ConsumerState<CustomerFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _phoneCtrl = TextEditingController();
  final TextEditingController _taxIdCtrl = TextEditingController();
  final TextEditingController _billingCtrl = TextEditingController();
  final TextEditingController _shippingCtrl = TextEditingController();
  final TextEditingController _industryCtrl = TextEditingController();
  final TextEditingController _websiteCtrl = TextEditingController();
  final TextEditingController _notesCtrl = TextEditingController();
  final TextEditingController _currencyCtrl = TextEditingController();
  final TextEditingController _creditLimitCtrl = TextEditingController();
  final TextEditingController _tagsCtrl = TextEditingController();

  String _status = 'ACTIVE';
  String _customerType = 'COMPANY';
  bool _portalAccess = false;
  bool _saving = false;

  bool get _isEditing => widget.customerId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadCustomer();
    }
  }

  Future<void> _loadCustomer() async {
    final Customer? customer = ref
        .read(customerDetailProvider(widget.customerId!))
        .valueOrNull;
    if (customer != null) {
      _nameCtrl.text = customer.name;
      _emailCtrl.text = customer.email ?? '';
      _phoneCtrl.text = customer.phone ?? '';
      _taxIdCtrl.text = customer.taxId ?? '';
      _billingCtrl.text = customer.billingAddress ?? '';
      _shippingCtrl.text = customer.shippingAddress ?? '';
      _industryCtrl.text = customer.industry ?? '';
      _websiteCtrl.text = customer.website ?? '';
      _notesCtrl.text = customer.notes ?? '';
      _currencyCtrl.text = customer.currency ?? '';
      _creditLimitCtrl.text = customer.creditLimit.toString();
      _tagsCtrl.text = customer.tags.join(', ');
      _status = customer.status;
      _customerType = customer.customerType;
      _portalAccess = customer.portalAccess;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _taxIdCtrl.dispose();
    _billingCtrl.dispose();
    _shippingCtrl.dispose();
    _industryCtrl.dispose();
    _websiteCtrl.dispose();
    _notesCtrl.dispose();
    _currencyCtrl.dispose();
    _creditLimitCtrl.dispose();
    _tagsCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'email': _emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
      'taxId': _taxIdCtrl.text.trim().isEmpty ? null : _taxIdCtrl.text.trim(),
      'billingAddress': _billingCtrl.text.trim().isEmpty ? null : _billingCtrl.text.trim(),
      'shippingAddress': _shippingCtrl.text.trim().isEmpty ? null : _shippingCtrl.text.trim(),
      'status': _status,
      'customerType': _customerType,
      'industry': _industryCtrl.text.trim().isEmpty ? null : _industryCtrl.text.trim(),
      'website': _websiteCtrl.text.trim().isEmpty ? null : _websiteCtrl.text.trim(),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      'currency': _currencyCtrl.text.trim().isEmpty ? null : _currencyCtrl.text.trim(),
      'creditLimit': double.tryParse(_creditLimitCtrl.text) ?? 0,
      'portalAccess': _portalAccess,
      'tags': _tagsCtrl.text.trim().isEmpty
          ? <String>[]
          : _tagsCtrl.text.split(',').map((String s) => s.trim()).where((String s) => s.isNotEmpty).toList(),
    };

    final Result<Customer> result = await ref
        .read(customersProvider.notifier)
        .save(payload, id: widget.customerId);

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
        title: Text(_isEditing ? 'Edit Customer' : 'New Customer'),
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
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Name *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
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
              controller: _taxIdCtrl,
              decoration: const InputDecoration(labelText: 'Tax ID'),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem<String>(value: 'INACTIVE', child: Text('Inactive')),
                DropdownMenuItem<String>(value: 'LEAD', child: Text('Lead')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _customerType,
              decoration: const InputDecoration(labelText: 'Customer Type'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'COMPANY', child: Text('Company')),
                DropdownMenuItem<String>(value: 'INDIVIDUAL', child: Text('Individual')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _customerType = v);
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
              controller: _websiteCtrl,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(labelText: 'Website'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _currencyCtrl,
              decoration: const InputDecoration(labelText: 'Currency'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _creditLimitCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Credit Limit'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _billingCtrl,
              maxLines: 2,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Billing Address',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _shippingCtrl,
              maxLines: 2,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Shipping Address',
                alignLabelWithHint: true,
              ),
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
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _tagsCtrl,
              decoration: const InputDecoration(
                labelText: 'Tags',
                helperText: 'Comma-separated',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            SwitchListTile(
              title: const Text('Portal Access'),
              value: _portalAccess,
              onChanged: (bool v) => setState(() => _portalAccess = v),
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }
}
