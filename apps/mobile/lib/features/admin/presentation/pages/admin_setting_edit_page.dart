import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/admin.dart';
import '../providers/admin_providers.dart';

class AdminSettingEditPage extends ConsumerStatefulWidget {
  const AdminSettingEditPage({required this.settingKey, super.key});
  static const String routeName = 'admin-setting-edit';
  static const String routePath = '/admin/settings/:key/edit';
  final String settingKey;

  @override
  ConsumerState<AdminSettingEditPage> createState() => _AdminSettingEditPageState();
}

class _AdminSettingEditPageState extends ConsumerState<AdminSettingEditPage> {
  final TextEditingController _valueCtrl = TextEditingController();
  bool _saving = false;
  bool _boolValue = false;
  String? _settingType;

  @override
  void initState() {
    super.initState();
    final AdminSettingListState state = ref.read(adminSettingListControllerProvider);
    final AdminSetting? setting = state.items.where((AdminSetting s) => s.key == widget.settingKey).firstOrNull;
    if (setting != null) {
      _settingType = setting.type;
      if (setting.type == 'boolean') {
        _boolValue = setting.value == true || '${setting.value}' == 'true';
        _valueCtrl.text = _boolValue ? 'true' : 'false';
      } else {
        _valueCtrl.text = '${setting.value ?? ''}';
      }
    }
  }

  @override
  void dispose() {
    _valueCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final Object value;
    switch (_settingType) {
      case 'number':
        value = double.tryParse(_valueCtrl.text.trim()) ?? 0;
      case 'boolean':
        value = _boolValue;
      case 'json':
        value = _valueCtrl.text.trim();
      default:
        value = _valueCtrl.text.trim();
    }

    final Result<AdminSetting> result = await ref
        .read(adminSettingListControllerProvider.notifier)
        .updateValue(widget.settingKey, value);

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

    return Scaffold(
      appBar: AppBar(
        title: const Text('Edit Setting'),
        actions: <Widget>[
          TextButton(
            onPressed: _saving ? null : _save,
            child: _saving
                ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Save'),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.all(Spacing.x4),
        children: <Widget>[
          Text(widget.settingKey, style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: Spacing.x4),
          if (_settingType == 'boolean')
            SwitchListTile(
              title: const Text('Value'),
              value: _boolValue,
              onChanged: (bool v) => setState(() => _boolValue = v),
              contentPadding: EdgeInsets.zero,
            )
          else if (_settingType == 'number')
            TextFormField(
              controller: _valueCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(labelText: 'Value'),
            )
          else if (_settingType == 'json')
            TextFormField(
              controller: _valueCtrl,
              maxLines: 6,
              decoration: const InputDecoration(labelText: 'Value (JSON)', alignLabelWithHint: true),
            )
          else
            TextFormField(
              controller: _valueCtrl,
              maxLines: _settingType == 'text' ? 4 : 1,
              decoration: const InputDecoration(labelText: 'Value'),
            ),
          const SizedBox(height: Spacing.x2),
          Text('Type: ${_settingType ?? 'string'}',
              style: TextStyle(color: t.textTertiary, fontSize: TypeScale.xs)),
        ],
      ),
    );
  }
}