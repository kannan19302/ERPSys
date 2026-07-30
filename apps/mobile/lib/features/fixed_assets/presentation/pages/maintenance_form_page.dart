import 'package:flutter/material.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/form_fields.dart';
import '../providers/fixed_assets_providers.dart';

class MaintenanceFormPage extends ConsumerStatefulWidget {
  const MaintenanceFormPage({super.key, this.id});
  static const String routeName = 'maintenance-form';
  static const String routePath = '/maintenance-form';

  final String? id;

  @override
  ConsumerState<MaintenanceFormPage> createState() => _MaintenanceFormPageState();
}

class _MaintenanceFormPageState extends ConsumerState<MaintenanceFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _assetIdController = TextEditingController();
  final _assetNameController = TextEditingController();
  final _maintenanceTypeController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _assignedToController = TextEditingController();
  final _estimatedCostController = TextEditingController();
  final _actualCostController = TextEditingController();
  final _notesController = TextEditingController();
  String _priority = 'MEDIUM';
  String _status = 'SCHEDULED';
  DateTime? _scheduledDate;
  DateTime? _completedDate;
  bool _isLoading = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.id != null) _loadExisting();
  }

  Future<void> _loadExisting() async {
    final schedule = await ref.read(maintenanceScheduleDetailProvider(widget.id!).future);
    if (!mounted) return;
    _assetIdController.text = schedule.assetId;
    _assetNameController.text = schedule.assetName ?? '';
    _maintenanceTypeController.text = schedule.maintenanceType;
    _descriptionController.text = schedule.description ?? '';
    _assignedToController.text = schedule.assignedTo ?? '';
    _estimatedCostController.text = schedule.estimatedCost?.toString() ?? '';
    _actualCostController.text = schedule.actualCost?.toString() ?? '';
    _notesController.text = schedule.notes ?? '';
    _priority = schedule.priority;
    _status = schedule.status;
    _scheduledDate = schedule.scheduledDate;
    _completedDate = schedule.completedDate;
    setState(() => _isInitialized = true);
  }

  @override
  void dispose() {
    _assetIdController.dispose();
    _assetNameController.dispose();
    _maintenanceTypeController.dispose();
    _descriptionController.dispose();
    _assignedToController.dispose();
    _estimatedCostController.dispose();
    _actualCostController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final payload = <String, dynamic>{
      'assetId': _assetIdController.text.trim(),
      'assetName': _assetNameController.text.trim(),
      'maintenanceType': _maintenanceTypeController.text.trim(),
      'description': _descriptionController.text.trim(),
      'assignedTo': _assignedToController.text.trim(),
      'estimatedCost': double.tryParse(_estimatedCostController.text.trim()),
      'actualCost': double.tryParse(_actualCostController.text.trim()),
      'notes': _notesController.text.trim(),
      'priority': _priority,
      'status': _status,
      if (_scheduledDate != null) 'scheduledDate': _scheduledDate!.toIso8601String(),
      if (_completedDate != null) 'completedDate': _completedDate!.toIso8601String(),
    };
    final result = await ref.read(maintenanceScheduleListControllerProvider.notifier).save(payload, id: widget.id);
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
        appBar: AppBar(title: const Text('Edit Maintenance')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.id != null ? 'Edit Maintenance' : 'New Maintenance')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            UiTextField(
              label: 'Asset ID',
              controller: _assetIdController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiTextField(label: 'Asset Name', controller: _assetNameController),
            UiTextField(
              label: 'Maintenance Type',
              controller: _maintenanceTypeController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiTextField(label: 'Description', controller: _descriptionController, maxLines: 3),
            UiDropdownField(
              label: 'Priority',
              itemLabel: (v) => v.toString(),
              selectedItem: _priority,
              items: const ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
              onChanged: (v) => setState(() => _priority = v!),
            ),
            UiDropdownField(
              label: 'Status',
              itemLabel: (v) => v.toString(),
              selectedItem: _status,
              items: const ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
              onChanged: (v) => setState(() => _status = v!),
            ),
            UiDatePickerField(
              label: 'Scheduled Date',
              selectedDate: _scheduledDate,
              onChanged: (v) => setState(() => _scheduledDate = v),
            ),
            UiDatePickerField(
              label: 'Completed Date',
              selectedDate: _completedDate,
              onChanged: (v) => setState(() => _completedDate = v),
            ),
            UiTextField(label: 'Assigned To', controller: _assignedToController),
            UiTextField(label: 'Estimated Cost', controller: _estimatedCostController, keyboardType: TextInputType.number),
            UiTextField(label: 'Actual Cost', controller: _actualCostController, keyboardType: TextInputType.number),
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