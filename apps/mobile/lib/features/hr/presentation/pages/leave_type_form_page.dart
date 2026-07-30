import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/di/providers.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../data/repositories/hr_repository_impl.dart';
import '../../domain/entities/hr.dart';
import '../../domain/repositories/hr_repository.dart';
import '../../domain/usecases/hr_usecases.dart';
import '../providers/hr_providers.dart';

class LeaveTypeFormPage extends ConsumerStatefulWidget {
  const LeaveTypeFormPage({this.leaveTypeId, super.key});

  static const String routeName = 'leave-type-new';
  static const String routeEditName = 'leave-type-edit';
  static const String routePath = '/hr/leave-types/new';
  static const String routeEditPath = '/hr/leave-types/:id/edit';

  final String? leaveTypeId;

  @override
  ConsumerState<LeaveTypeFormPage> createState() => _LeaveTypeFormPageState();
}

class _LeaveTypeFormPageState extends ConsumerState<LeaveTypeFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _daysCtrl = TextEditingController(text: '10');

  bool _isPaid = true;
  bool _requiresApproval = true;
  Color _selectedColor = const Color(0xFF6366F1);
  bool _saving = false;

  bool get _isEditing => widget.leaveTypeId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) _load();
  }

  void _load() {
    final List<LeaveType>? types =
        ref.read(leaveTypesProvider).valueOrNull;
    final LeaveType? lt = types?.where(
      (LeaveType t) => t.id == widget.leaveTypeId,
    ).firstOrNull;
    if (lt != null) {
      _nameCtrl.text = lt.name;
      _daysCtrl.text = lt.daysAllowed.toInt().toString();
      _isPaid = lt.isPaid;
      _requiresApproval = lt.requiresApproval;
      if (lt.color != null) {
        final String hex = lt.color!.replaceFirst('#', '');
        if (hex.length == 6) {
          _selectedColor = Color(int.parse('FF$hex', radix: 16));
        }
      }
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _daysCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final String hex =
        '#${_selectedColor.value.toRadixString(16).substring(2).toUpperCase()}';

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'daysAllowed': double.tryParse(_daysCtrl.text) ?? 10,
      'isPaid': _isPaid,
      'requiresApproval': _requiresApproval,
      'color': hex,
    };

    final HrRepository repo = ref.read(hrRepositoryProvider);
    final Result<LeaveType> result =
        await SaveLeaveTypeUseCase(repo)(
      SaveLeaveTypeParams(id: widget.leaveTypeId, payload: payload),
    );

    if (result.isOk) {
      ref.invalidate(leaveTypesProvider);
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
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Leave Type' : 'New Leave Type'),
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
            TextFormField(
              controller: _daysCtrl,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Max Days',
                suffixText: 'days',
              ),
              validator: (String? v) {
                if (v == null || v.trim().isEmpty) return 'Required';
                if (int.tryParse(v) == null) return 'Enter a valid number';
                return null;
              },
            ),
            const SizedBox(height: Spacing.x4),
            InkWell(
              onTap: () => _pickColor(context),
              borderRadius: Radii.control,
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Color'),
                child: Row(
                  children: <Widget>[
                    Container(
                      width: Spacing.x6,
                      height: Spacing.x6,
                      decoration: BoxDecoration(
                        color: _selectedColor,
                        borderRadius: BorderRadius.all(Radius.circular(Radii.sm)),
                      ),
                    ),
                    const SizedBox(width: Spacing.x2),
                    Text(
                      '#${_selectedColor.value.toRadixString(16).substring(2).toUpperCase()}',
                      style: const TextStyle(fontSize: TypeScale.sm),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: Spacing.x2),
            SwitchListTile(
              title: const Text('Paid Leave'),
              value: _isPaid,
              onChanged: (bool v) => setState(() => _isPaid = v),
              contentPadding: EdgeInsets.zero,
            ),
            SwitchListTile(
              title: const Text('Requires Approval'),
              value: _requiresApproval,
              onChanged: (bool v) => setState(() => _requiresApproval = v),
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickColor(BuildContext context) async {
    final Color? picked = await showDialog<Color>(
      context: context,
      builder: (BuildContext ctx) => SimpleDialog(
        title: const Text('Pick a color'),
        children: <Widget>[
          Wrap(
            spacing: Spacing.x2,
            runSpacing: Spacing.x2,
//             padding: const EdgeInsets.all(Spacing.x4),
            children: <Color>[
              const Color(0xFF6366F1),
              const Color(0xFFEF4444),
              const Color(0xFFF59E0B),
              const Color(0xFF10B981),
              const Color(0xFF3B82F6),
              const Color(0xFF8B5CF6),
              const Color(0xFFEC4899),
              const Color(0xFF14B8A6),
              const Color(0xFFF97316),
              const Color(0xFF84CC16),
            ].map((Color color) {
              return GestureDetector(
                onTap: () => Navigator.of(ctx).pop(color),
                child: Container(
                  width: Spacing.x8,
                  height: Spacing.x8,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: BorderRadius.all(Radius.circular(Radii.sm)),
                    border: color == _selectedColor
                        ? Border.all(color: Colors.white, width: 3)
                        : null,
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
    if (picked != null && context.mounted) {
      setState(() => _selectedColor = picked);
    }
  }
}