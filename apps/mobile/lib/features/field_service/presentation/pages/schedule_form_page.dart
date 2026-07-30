import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/form_fields.dart';
import '../providers/field_service_providers.dart';

class ScheduleFormPage extends ConsumerStatefulWidget {
  const ScheduleFormPage({super.key, this.id});
  static const String routeName = 'schedule-form';
  static const String routePath = '/schedule-form';

  final String? id;

  @override
  ConsumerState<ScheduleFormPage> createState() => _ScheduleFormPageState();
}

class _ScheduleFormPageState extends ConsumerState<ScheduleFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _ticketIdController = TextEditingController();
  final _ticketNumberController = TextEditingController();
  final _technicianIdController = TextEditingController();
  final _technicianNameController = TextEditingController();
  final _customerNameController = TextEditingController();
  final _timeSlotController = TextEditingController();
  final _locationController = TextEditingController();
  final _notesController = TextEditingController();
  String _status = 'SCHEDULED';
  DateTime? _scheduledDate;
  bool _isLoading = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.id != null) _loadExisting();
  }

  Future<void> _loadExisting() async {
    final schedule = await ref.read(serviceScheduleDetailProvider(widget.id!).future);
    if (!mounted) return;
    _ticketIdController.text = schedule.ticketId;
    _ticketNumberController.text = schedule.ticketNumber;
    _technicianIdController.text = schedule.technicianId;
    _technicianNameController.text = schedule.technicianName;
    _customerNameController.text = schedule.customerName ?? '';
    _timeSlotController.text = schedule.timeSlot ?? '';
    _locationController.text = schedule.location ?? '';
    _notesController.text = schedule.notes ?? '';
    _status = schedule.status;
    _scheduledDate = schedule.scheduledDate;
    setState(() => _isInitialized = true);
  }

  @override
  void dispose() {
    _ticketIdController.dispose();
    _ticketNumberController.dispose();
    _technicianIdController.dispose();
    _technicianNameController.dispose();
    _customerNameController.dispose();
    _timeSlotController.dispose();
    _locationController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final payload = <String, dynamic>{
      'ticketId': _ticketIdController.text.trim(),
      'ticketNumber': _ticketNumberController.text.trim(),
      'technicianId': _technicianIdController.text.trim(),
      'technicianName': _technicianNameController.text.trim(),
      'customerName': _customerNameController.text.trim(),
      'timeSlot': _timeSlotController.text.trim(),
      'location': _locationController.text.trim(),
      'notes': _notesController.text.trim(),
      'status': _status,
      if (_scheduledDate != null) 'scheduledDate': _scheduledDate!.toIso8601String(),
    };
    final result = await ref.read(serviceScheduleListControllerProvider.notifier).save(payload, id: widget.id);
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
        appBar: AppBar(title: const Text('Edit Schedule')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.id != null ? 'Edit Schedule' : 'New Schedule')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            UiTextField(
              label: 'Ticket ID',
              controller: _ticketIdController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiTextField(label: 'Ticket Number', controller: _ticketNumberController),
            UiTextField(
              label: 'Technician ID',
              controller: _technicianIdController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiTextField(label: 'Technician Name', controller: _technicianNameController),
            UiTextField(label: 'Customer Name', controller: _customerNameController),
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
            UiTextField(label: 'Time Slot', controller: _timeSlotController),
            UiTextField(label: 'Location', controller: _locationController),
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