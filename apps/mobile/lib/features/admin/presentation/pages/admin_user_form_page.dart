import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/admin.dart';
import '../providers/admin_providers.dart';

class AdminUserFormPage extends ConsumerStatefulWidget {
  const AdminUserFormPage({this.userId, super.key});
  static const String routeName = 'admin-user-new';
  static const String routeEditName = 'admin-user-edit';
  static const String routePath = '/admin/users/new';
  static const String routeEditPath = '/admin/users/:id/edit';
  final String? userId;

  @override
  ConsumerState<AdminUserFormPage> createState() => _AdminUserFormPageState();
}

class _AdminUserFormPageState extends ConsumerState<AdminUserFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _firstNameCtrl = TextEditingController();
  final TextEditingController _lastNameCtrl = TextEditingController();
  final TextEditingController _emailCtrl = TextEditingController();
  final TextEditingController _deptCtrl = TextEditingController();
  String _status = 'ACTIVE';
  String? _selectedRole;
  bool _saving = false;

  bool get _isEditing => widget.userId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _loadUser();
  }

  Future<void> _loadUser() async {
    final AdminUserListState state = ref.read(adminUserListControllerProvider);
    final AdminUser? user = state.items.where((AdminUser u) => u.id == widget.userId).firstOrNull;
    if (user != null) {
      _firstNameCtrl.text = user.firstName;
      _lastNameCtrl.text = user.lastName;
      _emailCtrl.text = user.email;
      _status = user.status;
      _selectedRole = user.roles.isNotEmpty ? user.roles.first : null;
    }
  }

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _deptCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'firstName': _firstNameCtrl.text.trim(),
      'lastName': _lastNameCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'status': _status,
      if (_selectedRole != null) 'roles': <String>[_selectedRole!],
      if (_deptCtrl.text.trim().isNotEmpty) 'department': _deptCtrl.text.trim(),
    };

    final Result<AdminUser> result = await ref
        .read(adminUserListControllerProvider.notifier)
        .save(payload, id: widget.userId);

    if (!context.mounted) return;
    setState(() => _saving = false);

    result.fold(
      (Failure failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final AdminRoleListState roleState = ref.watch(adminRoleListControllerProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit User' : 'New User'),
        actions: <Widget>[
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
          children: <Widget>[
            TextFormField(
              controller: _firstNameCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'First Name *'),
              validator: (String? v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _lastNameCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Last Name *'),
              validator: (String? v) => v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _emailCtrl,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email *'),
              validator: (String? v) {
                if (v == null || v.trim().isEmpty) return 'Required';
                if (!v.contains('@')) return 'Invalid email';
                return null;
              },
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _deptCtrl,
              textCapitalization: TextCapitalization.words,
              decoration: const InputDecoration(labelText: 'Department'),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _selectedRole,
              decoration: const InputDecoration(labelText: 'Role'),
              items: roleState.items.map((AdminRole r) =>
                DropdownMenuItem<String>(value: r.name, child: Text(r.name)),
              ).toList(growable: false),
              onChanged: (String? v) => setState(() => _selectedRole = v),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem<String>(value: 'INACTIVE', child: Text('Inactive')),
                DropdownMenuItem<String>(value: 'SUSPENDED', child: Text('Suspended')),
              ],
              onChanged: (String? v) { if (v != null) setState(() => _status = v); },
            ),
          ],
        ),
      ),
    );
  }
}