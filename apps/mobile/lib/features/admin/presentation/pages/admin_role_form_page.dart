import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/admin.dart';
import '../providers/admin_providers.dart';

const List<String> _moduleGroups = <String>[
  'dashboard', 'inventory', 'sales', 'procurement', 'crm', 'hr',
  'finance', 'projects', 'manufacturing', 'communication', 'analytics',
  'admin', 'settings', 'reports',
];

const List<String> _actions = <String>['read', 'create', 'update', 'delete'];

List<String> _allPermissions() {
  final List<String> perms = <String>[];
  for (final String module in _moduleGroups) {
    for (final String action in _actions) {
      perms.add('$module.$action');
    }
  }
  return perms;
}

class AdminRoleFormPage extends ConsumerStatefulWidget {
  const AdminRoleFormPage({this.roleId, super.key});
  static const String routeName = 'admin-role-new';
  static const String routeEditName = 'admin-role-edit';
  static const String routePath = '/admin/roles/new';
  static const String routeEditPath = '/admin/roles/:id/edit';
  final String? roleId;

  @override
  ConsumerState<AdminRoleFormPage> createState() => _AdminRoleFormPageState();
}

class _AdminRoleFormPageState extends ConsumerState<AdminRoleFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _descCtrl = TextEditingController();
  final Set<String> _selectedPermissions = <String>{};
  bool _saving = false;
  bool _isSystem = false;

  bool get _isEditing => widget.roleId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _loadRole();
  }

  Future<void> _loadRole() async {
    final AdminRole? role = ref.read(adminRoleDetailProvider(widget.roleId!)).valueOrNull;
    if (role != null) {
      _nameCtrl.text = role.name;
      _descCtrl.text = role.description ?? '';
      _selectedPermissions.addAll(role.permissions);
      _isSystem = role.isSystem;
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
      'permissions': _selectedPermissions.toList(),
    };

    final Result<AdminRole> result = await ref
        .read(adminRoleListControllerProvider.notifier)
        .save(payload, id: widget.roleId);

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
    final Palette t = context.tokens;
    final List<String> allPerms = _allPermissions();
    final Map<String, List<String>> grouped = <String, List<String>>{};
    for (final String perm in allPerms) {
      final String module = perm.split('.').first;
      grouped.putIfAbsent(module, () => <String>[]).add(perm);
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Role' : 'New Role'),
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
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Name *'),
              validator: (String? v) => v == null || v.trim().isEmpty ? 'Required' : null,
              enabled: !_isSystem,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _descCtrl,
              maxLines: 3,
              decoration: const InputDecoration(labelText: 'Description', alignLabelWithHint: true),
              enabled: !_isSystem,
            ),
            const SizedBox(height: Spacing.x4),
            Text('Permissions', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: Spacing.x2),
            if (_isSystem)
              Text('System role permissions cannot be modified.',
                  style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs),)
            else
              ...grouped.entries.map((MapEntry<String, List<String>> entry) {
                final String module = entry.key;
                final bool allSelected = entry.value.every((String p) => _selectedPermissions.contains(p));
                return Padding(
                  padding: const EdgeInsets.only(bottom: Spacing.x3),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: <Widget>[
                      InkWell(
                        onTap: () {
                          setState(() {
                            if (allSelected) {
                              _selectedPermissions.removeAll(entry.value);
                            } else {
                              _selectedPermissions.addAll(entry.value);
                            }
                          });
                        },
                        child: Row(
                          children: <Widget>[
                            Icon(allSelected ? Icons.check_box : Icons.check_box_outline_blank,
                                size: TypeScale.xl, color: allSelected ? t.primary : t.textTertiary,),
                            const SizedBox(width: Spacing.x2),
                            Text(module[0].toUpperCase() + module.substring(1),
                                style: Theme.of(context).textTheme.labelLarge,),
                          ],
                        ),
                      ),
                      const SizedBox(height: Spacing.x1),
                      Padding(
                        padding: const EdgeInsets.only(left: Spacing.x8),
                        child: Wrap(
                          spacing: Spacing.x2,
                          runSpacing: Spacing.x1,
                          children: entry.value.map((String perm) {
                            final bool sel = _selectedPermissions.contains(perm);
                            return FilterChip(
                              label: Text(perm.split('.').last,
                                  style: TextStyle(fontSize: TypeScale.xs,
                                      color: sel ? t.primary : t.textSecondary,),),
                              selected: sel,
                              onSelected: (bool v) => setState(() {
                                if (v) { _selectedPermissions.add(perm); } else { _selectedPermissions.remove(perm); }
                              }),
                              visualDensity: VisualDensity.compact,
                              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}