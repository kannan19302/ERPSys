import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/widgets/form_fields.dart';
import '../providers/field_service_providers.dart';

class TechnicianFormPage extends ConsumerStatefulWidget {
  const TechnicianFormPage({super.key, this.id});
  static const String routeName = 'technician-form';
  static const String routePath = '/technician-form';

  final String? id;

  @override
  ConsumerState<TechnicianFormPage> createState() => _TechnicianFormPageState();
}

class _TechnicianFormPageState extends ConsumerState<TechnicianFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _specializationController = TextEditingController();
  final _skillLevelController = TextEditingController();
  final _vehicleInfoController = TextEditingController();
  final _serviceAreaController = TextEditingController();
  String _status = 'AVAILABLE';
  bool _isLoading = false;
  bool _isInitialized = false;

  @override
  void initState() {
    super.initState();
    if (widget.id != null) _loadExisting();
  }

  Future<void> _loadExisting() async {
    final tech = await ref.read(technicianDetailProvider(widget.id!).future);
    if (!mounted) return;
    _nameController.text = tech.name;
    _emailController.text = tech.email ?? '';
    _phoneController.text = tech.phone ?? '';
    _specializationController.text = tech.specialization ?? '';
    _skillLevelController.text = tech.skillLevel ?? '';
    _vehicleInfoController.text = tech.vehicleInfo ?? '';
    _serviceAreaController.text = tech.serviceArea ?? '';
    _status = tech.status;
    setState(() => _isInitialized = true);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _specializationController.dispose();
    _skillLevelController.dispose();
    _vehicleInfoController.dispose();
    _serviceAreaController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);
    final payload = <String, dynamic>{
      'name': _nameController.text.trim(),
      'email': _emailController.text.trim(),
      'phone': _phoneController.text.trim(),
      'specialization': _specializationController.text.trim(),
      'skillLevel': _skillLevelController.text.trim(),
      'vehicleInfo': _vehicleInfoController.text.trim(),
      'serviceArea': _serviceAreaController.text.trim(),
      'status': _status,
    };
    final result = await ref.read(technicianListControllerProvider.notifier).save(payload, id: widget.id);
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
        appBar: AppBar(title: const Text('Edit Technician')),
        body: const Center(child: CircularProgressIndicator()),
      );
    }
    return Scaffold(
      appBar: AppBar(title: Text(widget.id != null ? 'Edit Technician' : 'New Technician')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            UiTextField(
              label: 'Name',
              controller: _nameController,
              validator: (v) => (v == null || v.trim().isEmpty) ? 'Required' : null,
            ),
            UiTextField(label: 'Email', controller: _emailController, keyboardType: TextInputType.emailAddress),
            UiTextField(label: 'Phone', controller: _phoneController, keyboardType: TextInputType.phone),
            UiTextField(label: 'Specialization', controller: _specializationController),
            UiDropdownField(
              label: 'Status',
              itemLabel: (v) => v.toString(),
              selectedItem: _status,
              items: const ['AVAILABLE', 'BUSY', 'OFFLINE'],
              onChanged: (v) => setState(() => _status = v!),
            ),
            UiTextField(label: 'Skill Level', controller: _skillLevelController),
            UiTextField(label: 'Vehicle Info', controller: _vehicleInfoController),
            UiTextField(label: 'Service Area', controller: _serviceAreaController),
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