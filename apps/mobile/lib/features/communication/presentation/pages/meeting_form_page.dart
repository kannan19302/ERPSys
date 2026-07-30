import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/communication.dart';
import '../providers/communication_providers.dart';

class MeetingFormPage extends ConsumerStatefulWidget {
  const MeetingFormPage({super.key});

  static const String routeName = 'meeting-new';
  static const String routePath = '/communication/meetings/new';

  @override
  ConsumerState<MeetingFormPage> createState() => _MeetingFormPageState();
}

class _MeetingFormPageState extends ConsumerState<MeetingFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _titleCtrl = TextEditingController();
  final TextEditingController _hostNameCtrl = TextEditingController();

  DateTime _startTime = DateTime.now().add(const Duration(hours: 1));
  DateTime? _endTime;
  bool _saving = false;

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'title': _titleCtrl.text.trim(),
      'hostName': _hostNameCtrl.text.trim().isEmpty ? null : _hostNameCtrl.text.trim(),
      'startTime': _startTime.toIso8601String(),
      'endTime': _endTime?.toIso8601String(),
    };

    final Result<Meeting> result = await ref
        .read(meetingListControllerProvider.notifier)
        .saveMeeting(payload);

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
  void dispose() {
    _titleCtrl.dispose();
    _hostNameCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickStartTime() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _startTime,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null && context.mounted) {
      final TimeOfDay? time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_startTime),
      );
      if (time != null) {
        setState(() => _startTime = DateTime(picked.year, picked.month, picked.day, time.hour, time.minute));
      }
    }
  }

  Future<void> _pickEndTime() async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _endTime ?? _startTime.add(const Duration(hours: 1)),
      firstDate: _startTime,
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null && context.mounted) {
      final TimeOfDay? time = await showTimePicker(
        context: context,
        initialTime: TimeOfDay.fromDateTime(_endTime ?? _startTime.add(const Duration(hours: 1))),
      );
      if (time != null) {
        setState(() => _endTime = DateTime(picked.year, picked.month, picked.day, time.hour, time.minute));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return Scaffold(
      appBar: AppBar(
        title: const Text('New Meeting'),
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
              controller: _titleCtrl,
              decoration: const InputDecoration(labelText: 'Title *'),
              validator: (String? v) =>
                  v == null || v.trim().isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _hostNameCtrl,
              decoration: const InputDecoration(labelText: 'Host Name'),
            ),
            const SizedBox(height: Spacing.x4),
            InkWell(
              onTap: _pickStartTime,
              child: InputDecorator(
                decoration: const InputDecoration(labelText: 'Start Time *'),
                child: Text(
                  '${_startTime.toLocal()}'.substring(0, 16),
                  style: TextStyle(color: t.text),
                ),
              ),
            ),
            const SizedBox(height: Spacing.x4),
            InkWell(
              onTap: _pickEndTime,
              child: InputDecorator(
                decoration: const InputDecoration(
                  labelText: 'End Time',
                  helperText: 'Optional',
                ),
                child: Text(
                  _endTime != null
                      ? '${_endTime!.toLocal()}'.substring(0, 16)
                      : 'Not set',
                  style: TextStyle(color: _endTime != null ? t.text : t.textTertiary),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}