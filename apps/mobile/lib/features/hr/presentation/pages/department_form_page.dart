import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/hr.dart';
import '../../domain/repositories/hr_repository.dart';
import '../../domain/usecases/hr_usecases.dart';
import '../providers/hr_providers.dart';

class DepartmentFormPage extends ConsumerStatefulWidget {
  const DepartmentFormPage({this.departmentId, super.key});

  static const String routeName = 'department-new';
  static const String routeEditName = 'department-edit';
  static const String routePath = '/hr/departments/new';
  static const String routeEditPath = '/hr/departments/:id/edit';

  final String? departmentId;

  @override
  ConsumerState<DepartmentFormPage> createState() => _DepartmentFormPageState();
}

class _DepartmentFormPageState extends ConsumerState<DepartmentFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _descCtrl = TextEditingController();

  String? _parentDeptId;
  String? _headEmployeeId;
  bool _saving = false;

  bool get _isEditing => widget.departmentId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _loadDepartment();
  }

  void _loadDepartment() {
    final List<Department>? depts =
        ref.read(departmentsProvider).valueOrNull;
    final Department? dept = depts?.where(
      (Department d) => d.id == widget.departmentId,
    ).firstOrNull;
    if (dept != null) {
      _nameCtrl.text = dept.name;
      _descCtrl.text = dept.description ?? '';
      _parentDeptId = dept.parentDepartmentId;
      _headEmployeeId = dept.headEmployeeId;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'description': _descCtrl.text.trim().isEmpty ? null : _descCtrl.text.trim(),
      if (_parentDeptId != null) 'parentDepartmentId': _parentDeptId,
      if (_headEmployeeId != null) 'headEmployeeId': _headEmployeeId,
    };

    final HrRepository repo = ref.read(hrRepositoryProvider);
    final Result<Department> result =
        await SaveDepartmentUseCase(repo)(
      SaveDepartmentParams(id: widget.departmentId, payload: payload),
    );

    if (result.isOk) {
      ref.invalidate(departmentsProvider);
    }

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
    final AsyncValue<List<Department>> asyncDepts = ref.watch(departmentsProvider);
    final List<Department> allDepts = asyncDepts.valueOrNull ?? const <Department>[];

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Department' : 'New Department'),
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
            DropdownButtonFormField<String>(
              initialValue: _parentDeptId,
              decoration: const InputDecoration(labelText: 'Parent Department'),
              isExpanded: true,
              items: <String?>[
                null,
                ...allDepts
                    .where((Department d) => d.id != widget.departmentId)
                    .map((Department d) => d.id),
              ].map(
                (String? v) => DropdownMenuItem<String>(
                  value: v,
                  child: Text(
                    v == null
                        ? 'None'
                        : allDepts
                                .where((Department d) => d.id == v)
                                .firstOrNull
                                ?.name ??
                            v,
                  ),
                ),
              ).toList(),
              onChanged: (String? v) => setState(() => _parentDeptId = v),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _headEmployeeId,
              decoration: const InputDecoration(labelText: 'Head of Department'),
              isExpanded: true,
              items: <String?>[null].map(
                (String? v) => DropdownMenuItem<String>(
                  value: v,
                  child: Text(v ?? 'Not assigned'),
                ),
              ).toList(),
              onChanged: (String? v) => setState(() => _headEmployeeId = v),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _descCtrl,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                labelText: 'Description',
                alignLabelWithHint: true,
              ),
            ),
          ],
        ),
      ),
    );
  }
}