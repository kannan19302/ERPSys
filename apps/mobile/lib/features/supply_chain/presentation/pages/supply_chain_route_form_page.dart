import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../providers/supply_chain_providers.dart';

class SupplyChainRouteFormPage extends ConsumerStatefulWidget {
  const SupplyChainRouteFormPage({this.routeId, super.key});
  static const String routeName = 'supply-chain-route-new';
  static const String routeEditName = 'supply-chain-route-edit';
  static const String routePath = '/supply-chain/routes/new';
  static const String routeEditPath = '/supply-chain/routes/:id/edit';
  final String? routeId;
  @override
  ConsumerState<SupplyChainRouteFormPage> createState() => _SupplyChainRouteFormPageState();
}

class _SupplyChainRouteFormPageState extends ConsumerState<SupplyChainRouteFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _originCtrl = TextEditingController();
  final _destinationCtrl = TextEditingController();
  final _carrierIdCtrl = TextEditingController();
  final _carrierNameCtrl = TextEditingController();
  final _transitTimeCtrl = TextEditingController();
  final _costCtrl = TextEditingController();
  bool _isActive = true;
  bool _saving = false;

  bool get _isEditing => widget.routeId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _loadRoute();
  }

  Future<void> _loadRoute() async {
    final route = ref.read(routeDetailProvider(widget.routeId!)).valueOrNull;
    if (route != null) {
      _nameCtrl.text = route.name;
      _originCtrl.text = route.origin;
      _destinationCtrl.text = route.destination;
      _carrierIdCtrl.text = route.carrierId ?? '';
      _carrierNameCtrl.text = route.carrierName ?? '';
      _transitTimeCtrl.text = route.transitTime?.toString() ?? '';
      _costCtrl.text = route.cost.toString();
      _isActive = route.isActive;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _originCtrl.dispose();
    _destinationCtrl.dispose();
    _carrierIdCtrl.dispose();
    _carrierNameCtrl.dispose();
    _transitTimeCtrl.dispose();
    _costCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'origin': _originCtrl.text.trim(),
      'destination': _destinationCtrl.text.trim(),
      'carrierId': _carrierIdCtrl.text.trim().isEmpty ? null : _carrierIdCtrl.text.trim(),
      'carrierName': _carrierNameCtrl.text.trim().isEmpty ? null : _carrierNameCtrl.text.trim(),
      'transitTime': int.tryParse(_transitTimeCtrl.text),
      'cost': double.tryParse(_costCtrl.text) ?? 0,
      'isActive': _isActive,
    };

    final result = await ref.read(routeListControllerProvider.notifier)
        .save(payload, id: widget.routeId);

    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold(
      (Failure f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Route' : 'New Route'),
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
              controller: _originCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Origin *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _destinationCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Destination *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _carrierIdCtrl,
              decoration: const InputDecoration(labelText: 'Carrier ID', helperText: 'Internal reference'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _carrierNameCtrl,
              decoration: const InputDecoration(labelText: 'Carrier Name'),
            ),
            const SizedBox(height: Spacing.x4),
            Row(children: [
              Expanded(
                child: TextFormField(
                  controller: _transitTimeCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Transit Time (days)'),
                ),
              ),
              const SizedBox(width: Spacing.x4),
              Expanded(
                child: TextFormField(
                  controller: _costCtrl,
                  keyboardType: TextInputType.number,
                  decoration: const InputDecoration(labelText: 'Cost'),
                ),
              ),
            ],),
            const SizedBox(height: Spacing.x4),
            SwitchListTile(
              title: const Text('Active'),
              value: _isActive,
              onChanged: (v) => setState(() => _isActive = v),
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }
}