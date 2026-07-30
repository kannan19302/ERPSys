import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../providers/supply_chain_providers.dart';

class DockAppointmentFormPage extends ConsumerStatefulWidget {
  const DockAppointmentFormPage({super.key});
  static const String routeName = 'dock-appointment-new';
  static const String routePath = '/supply-chain/dock-appointments/new';
  @override
  ConsumerState<DockAppointmentFormPage> createState() => _DockAppointmentFormPageState();
}

class _DockAppointmentFormPageState extends ConsumerState<DockAppointmentFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _warehouseIdCtrl = TextEditingController();
  final _warehouseNameCtrl = TextEditingController();
  final _carrierIdCtrl = TextEditingController();
  final _carrierNameCtrl = TextEditingController();
  final _referenceCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _warehouseIdCtrl.dispose();
    _warehouseNameCtrl.dispose();
    _carrierIdCtrl.dispose();
    _carrierNameCtrl.dispose();
    _referenceCtrl.dispose();
    _notesCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final payload = <String, dynamic>{
      'warehouseId': _warehouseIdCtrl.text.trim().isEmpty ? null : _warehouseIdCtrl.text.trim(),
      'warehouseName': _warehouseNameCtrl.text.trim().isEmpty ? null : _warehouseNameCtrl.text.trim(),
      'carrierId': _carrierIdCtrl.text.trim().isEmpty ? null : _carrierIdCtrl.text.trim(),
      'carrierName': _carrierNameCtrl.text.trim().isEmpty ? null : _carrierNameCtrl.text.trim(),
      'scheduledAt': DateTime.now().toIso8601String(),
      'reference': _referenceCtrl.text.trim().isEmpty ? null : _referenceCtrl.text.trim(),
      'notes': _notesCtrl.text.trim().isEmpty ? null : _notesCtrl.text.trim(),
      'status': 'SCHEDULED',
    };

    final result = await ref.read(dockAppointmentListControllerProvider.notifier).save(payload);
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
        title: const Text('New Dock Appointment'),
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
              controller: _warehouseIdCtrl,
              decoration: const InputDecoration(labelText: 'Warehouse ID'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _warehouseNameCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Warehouse Name'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _carrierIdCtrl,
              decoration: const InputDecoration(labelText: 'Carrier ID'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _carrierNameCtrl,
              decoration: const InputDecoration(labelText: 'Carrier Name'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _referenceCtrl,
              decoration: const InputDecoration(labelText: 'Reference'),
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