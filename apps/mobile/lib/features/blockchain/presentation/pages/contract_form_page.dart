import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/blockchain.dart';
import '../providers/blockchain_providers.dart';

class BlockchainContractFormPage extends ConsumerStatefulWidget {
  const BlockchainContractFormPage({this.contractId, super.key});

  static const String routeName = 'contract-new';
  static const String routeEditName = 'contract-edit';
  static const String routePath = '/blockchain/contracts/new';
  static const String routeEditPath = '/blockchain/contracts/:id/edit';

  final String? contractId;

  @override
  ConsumerState<BlockchainContractFormPage> createState() => _BlockchainContractFormPageState();
}

class _BlockchainContractFormPageState extends ConsumerState<BlockchainContractFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _addressCtrl = TextEditingController();
  final TextEditingController _networkCtrl = TextEditingController();
  final TextEditingController _abiCtrl = TextEditingController();
  final TextEditingController _ownerCtrl = TextEditingController();

  String _status = 'PENDING';
  bool _saving = false;

  bool get _isEditing => widget.contractId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadContract();
    }
  }

  Future<void> _loadContract() async {
    final BlockchainContract? contract = ref
        .read(blockchainContractDetailProvider(widget.contractId!))
        .valueOrNull;
    if (contract != null) {
      _nameCtrl.text = contract.name;
      _addressCtrl.text = contract.address;
      _networkCtrl.text = contract.network;
      _abiCtrl.text = contract.abi ?? '';
      _ownerCtrl.text = contract.owner ?? '';
      _status = contract.status;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _addressCtrl.dispose();
    _networkCtrl.dispose();
    _abiCtrl.dispose();
    _ownerCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'address': _addressCtrl.text.trim(),
      'network': _networkCtrl.text.trim(),
      'status': _status,
      'abi': _abiCtrl.text.trim().isEmpty ? null : _abiCtrl.text.trim(),
      'owner': _ownerCtrl.text.trim().isEmpty ? null : _ownerCtrl.text.trim(),
    };

    final Result<BlockchainContract> result = await ref
        .read(blockchainContractListControllerProvider.notifier)
        .save(payload, id: widget.contractId);

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
        title: Text(_isEditing ? 'Edit Contract' : 'New Contract'),
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
              controller: _addressCtrl,
              decoration: const InputDecoration(labelText: 'Contract Address *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _networkCtrl,
              decoration: const InputDecoration(
                labelText: 'Network *',
                helperText: 'e.g. Ethereum, Polygon, BSC',
              ),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'PENDING', child: Text('Pending')),
                DropdownMenuItem<String>(value: 'DEPLOYED', child: Text('Deployed')),
                DropdownMenuItem<String>(value: 'FAILED', child: Text('Failed')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _abiCtrl,
              maxLines: 5,
              decoration: const InputDecoration(
                labelText: 'ABI (JSON)',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _ownerCtrl,
              decoration: const InputDecoration(labelText: 'Owner Address'),
            ),
          ],
        ),
      ),
    );
  }
}
