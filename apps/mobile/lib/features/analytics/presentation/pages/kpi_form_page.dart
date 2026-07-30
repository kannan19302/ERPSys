import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/analytics.dart';
import '../providers/analytics_providers.dart';

class KpiFormPage extends ConsumerStatefulWidget {
  const KpiFormPage({this.kpiId, super.key});

  static const String routeName = 'kpi-new';
  static const String routeEditName = 'kpi-edit';
  static const String routePath = '/analytics/kpis/new';
  static const String routeEditPath = '/analytics/kpis/:id/edit';

  final String? kpiId;

  @override
  ConsumerState<KpiFormPage> createState() => _KpiFormPageState();
}

class _KpiFormPageState extends ConsumerState<KpiFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _valueCtrl = TextEditingController();
  final TextEditingController _targetCtrl = TextEditingController();
  final TextEditingController _unitCtrl = TextEditingController();
  final TextEditingController _periodCtrl = TextEditingController();
  final TextEditingController _trendCtrl = TextEditingController();

  String _status = 'ACTIVE';
  bool _saving = false;

  bool get _isEditing => widget.kpiId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadKpi();
    }
  }

  Future<void> _loadKpi() async {
    final AnalyticsKpi? kpi = ref
        .read(analyticsKpiDetailProvider(widget.kpiId!))
        .valueOrNull;
    if (kpi != null) {
      _nameCtrl.text = kpi.name;
      _valueCtrl.text = kpi.value.toString();
      _targetCtrl.text = kpi.target?.toString() ?? '';
      _unitCtrl.text = kpi.unit ?? '';
      _periodCtrl.text = kpi.period ?? '';
      _trendCtrl.text = kpi.trend ?? '';
      _status = kpi.status;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _valueCtrl.dispose();
    _targetCtrl.dispose();
    _unitCtrl.dispose();
    _periodCtrl.dispose();
    _trendCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'value': double.tryParse(_valueCtrl.text) ?? 0,
      'target': double.tryParse(_targetCtrl.text),
      'unit': _unitCtrl.text.trim().isEmpty ? null : _unitCtrl.text.trim(),
      'period': _periodCtrl.text.trim().isEmpty ? null : _periodCtrl.text.trim(),
      'trend': _trendCtrl.text.trim().isEmpty ? null : _trendCtrl.text.trim(),
      'status': _status,
    };

    final Result<AnalyticsKpi> result = await ref
        .read(kpiListControllerProvider.notifier)
        .save(payload, id: widget.kpiId);

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
        title: Text(_isEditing ? 'Edit KPI' : 'New KPI'),
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
              controller: _valueCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Value'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _targetCtrl,
              keyboardType: const TextInputType.numberWithOptions(decimal: true),
              decoration: const InputDecoration(labelText: 'Target'),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _unitCtrl,
              decoration: const InputDecoration(
                labelText: 'Unit',
                helperText: 'e.g. %, USD, count',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _periodCtrl,
              decoration: const InputDecoration(
                labelText: 'Period',
                helperText: 'e.g. 2026-07, Q3 2026',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _trendCtrl,
              decoration: const InputDecoration(
                labelText: 'Trend',
                helperText: 'e.g. up, down, stable',
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              value: _status,
              decoration: const InputDecoration(labelText: 'Status'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'ACTIVE', child: Text('Active')),
                DropdownMenuItem<String>(value: 'INACTIVE', child: Text('Inactive')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _status = v);
              },
            ),
          ],
        ),
      ),
    );
  }
}
