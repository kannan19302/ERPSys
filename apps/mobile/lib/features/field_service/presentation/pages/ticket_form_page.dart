import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/form_fields.dart';
import '../../../../core/widgets/state_views.dart';
import '../providers/field_service_providers.dart';

class TicketFormPage extends ConsumerStatefulWidget {
  const TicketFormPage({super.key, this.id});
  static const String routeName = 'ticket-form';
  static const String routePath = '/ticket-form';

  final String? id;

  @override
  ConsumerState<TicketFormPage> createState() => _TicketFormPageState();
}

class _TicketFormPageState extends ConsumerState<TicketFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _customerNameController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _resolutionController = TextEditingController();
  String _status = 'OPEN';
  String _priority = 'MEDIUM';
  DateTime? _scheduledDate;
  bool _isLoading = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.id != null) _loadExisting();
  }

  Future<void> _loadExisting() async {
    final ticket = await ref.read(serviceTicketDetailProvider(widget.id!).future);
    if (!mounted) return;
    _titleController.text = ticket.title;
    _customerNameController.text = ticket.customerName ?? '';
    _descriptionController.text = ticket.description ?? '';
    _resolutionController.text = ticket.resolution ?? '';
    _status = ticket.status;
    _priority = ticket.priority;
    _scheduledDate = ticket.scheduledDate;
    setState(() => _isInitialized = true);
  }

  @override
  void dispose() {
    _titleController.dispose();
    _customerNameController.dispose();
    _descriptionController.dispose();
    _resolutionController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final payload = <String, dynamic>{
      'title': _titleController.text.trim(),
      'customerName': _customerNameController.text.trim(),
      'description': _descriptionController.text.trim(),
      'resolution': _resolutionController.text.trim(),
      'status': _status,
      'priority': _priority,
      if (_scheduledDate != null) 'scheduledDate': _scheduledDate!.toIso8601String(),
    };
    final result = await ref.read(serviceTicketListControllerProvider.notifier).save(payload, id: widget.id);
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
        appBar: AppBar(title: const Text('Edit Ticket')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.id != null ? 'Edit Ticket' : 'New Ticket')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            UiTextField(
              label: 'Title',
              controller: _titleController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiTextField(
              label: 'Customer Name',
              controller: _customerNameController,
            ),
            UiDropdownField(
              label: 'Status',
              itemLabel: (v) => v.toString(),
              selectedItem: _status,
              items: const ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
              onChanged: (v) => setState(() => _status = v!),
            ),
            UiDropdownField(
              label: 'Priority',
              itemLabel: (v) => v.toString(),
              selectedItem: _priority,
              items: const ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
              onChanged: (v) => setState(() => _priority = v!),
            ),
            UiDatePickerField(
              label: 'Scheduled Date',
              selectedDate: _scheduledDate,
              onChanged: (v) => setState(() => _scheduledDate = v),
            ),
            UiTextField(
              label: 'Description',
              controller: _descriptionController,
              maxLines: 3,
            ),
            UiTextField(
              label: 'Resolution',
              controller: _resolutionController,
              maxLines: 3,
            ),
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