import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/procurement.dart';
import '../providers/procurement_providers.dart';

class VendorFormPage extends ConsumerStatefulWidget {
  const VendorFormPage({this.vendorId, super.key});
  static const String routeName = 'vendor-new';
  static const String routeEditName = 'vendor-edit';
  static const String routePath = '/procurement/vendors/new';
  static const String routeEditPath = '/procurement/vendors/:id/edit';
  final String? vendorId;

  @override
  ConsumerState<VendorFormPage> createState() => _VendorFormPageState();
}

class _VendorFormPageState extends ConsumerState<VendorFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _taxIdCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  final _paymentTermsCtrl = TextEditingController();
  final _currencyCtrl = TextEditingController();
  final _bankDetailsCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  String _status = 'ACTIVE';
  bool _saving = false;

  bool get _isEditing => widget.vendorId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
  }

  void _load() {
    final v = ref.read(vendorDetailProvider(widget.vendorId!)).valueOrNull;
    if (v != null) {
      _nameCtrl.text = v.name;
      _emailCtrl.text = v.email ?? '';
      _phoneCtrl.text = v.phone ?? '';
      _taxIdCtrl.text = v.taxId ?? '';
      _addressCtrl.text = v.address ?? '';
      _paymentTermsCtrl.text = v.paymentTerms ?? '';
      _currencyCtrl.text = v.currency;
      _bankDetailsCtrl.text = v.bankDetails ?? '';
      _notesCtrl.text = v.notes ?? '';
      _status = v.status;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _taxIdCtrl.dispose();
    _addressCtrl.dispose();
    _paymentTermsCtrl.dispose();
    _currencyCtrl.dispose();
    _bankDetailsCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'email': _emailCtrl.text.trim().isEmpty ? null : _emailCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim().isEmpty ? null : _phoneCtrl.text.trim(),
      'taxId': _taxIdCtrl.text.trim().isEmpty ? null : _taxIdCtrl.text.trim(),
      'address': _addressCtrl.text.trim().isEmpty ? null : _addressCtrl.text.trim(),
      'status': _status,
      'paymentTerms': _paymentTermsCtrl.text.trim().isEmpty ? null : _paymentTermsCtrl.text.trim(),
      'currency': _currencyCtrl.text.trim().isEmpty ? 'USD' : _currencyCtrl.text.trim(),
      'bankDetails': _bankDetailsCtrl.text.trim().isEmpty ? null : _bankDetailsCtrl.text.trim(),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
    };

    final result = await ref.read(vendorListControllerProvider.notifier)
        .save(payload, id: widget.vendorId);

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
        title: Text(_isEditing ? 'Edit Vendor' : 'New Vendor'),
        actions: [
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
          children: [
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Name *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
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
            TextFormField(
              controller: _addressCtrl,
              maxLines: 2,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(labelText: 'Address', alignLabelWithHint: true),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const [
                DropdownMenuItem(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem(value: 'INACTIVE', child: Text('Inactive')),
                DropdownMenuItem(value: 'BLACKLISTED', child: Text('Blacklisted')),
              ],
              onChanged: (v) { if (v != null) setState(() => _status = v); },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _paymentTermsCtrl,
              decoration: const InputDecoration(labelText: 'Payment Terms'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _currencyCtrl,
              decoration: const InputDecoration(labelText: 'Currency'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _bankDetailsCtrl,
              decoration: const InputDecoration(labelText: 'Bank Details'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _notesCtrl,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(labelText: 'Notes', alignLabelWithHint: true),
            ),
          ],
        ),
      ),
    );
  }
}