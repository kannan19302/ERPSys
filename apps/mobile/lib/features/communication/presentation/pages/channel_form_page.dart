import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../../domain/entities/communication.dart';
import '../providers/communication_providers.dart';

class ChannelFormPage extends ConsumerStatefulWidget {
  const ChannelFormPage({this.channelId, super.key});

  static const String routeName = 'channel-new';
  static const String routeEditName = 'channel-edit';
  static const String routePath = '/communication/channels/new';
  static const String routeEditPath = '/communication/channels/:id/edit';

  final String? channelId;

  @override
  ConsumerState<ChannelFormPage> createState() => _ChannelFormPageState();
}

class _ChannelFormPageState extends ConsumerState<ChannelFormPage> {
  final GlobalKey<FormState> _formKey = GlobalKey<FormState>();
  final TextEditingController _nameCtrl = TextEditingController();
  final TextEditingController _descriptionCtrl = TextEditingController();

  String _type = 'PUBLIC';
  bool _saving = false;

  bool get _isEditing => widget.channelId != null;

  @override
  void initState() {
    super.initState();
    if (_isEditing) {
      _loadChannel();
    }
  }

  Future<void> _loadChannel() async {
    final Channel? channel = ref
        .read(channelDetailProvider(widget.channelId!))
        .valueOrNull;
    if (channel != null) {
      _nameCtrl.text = channel.name;
      _descriptionCtrl.text = channel.description ?? '';
      _type = channel.type;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descriptionCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);

    final Map<String, dynamic> payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim().isEmpty ? null : _descriptionCtrl.text.trim(),
      'type': _type,
    };

    final Result<Channel> result = await ref
        .read(channelListControllerProvider.notifier)
        .saveChannel(payload, id: widget.channelId);

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
        title: Text(_isEditing ? 'Edit Channel' : 'New Channel'),
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
              controller: _descriptionCtrl,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Description',
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: Spacing.x4),
            DropdownButtonFormField<String>(
              initialValue: _type,
              decoration: const InputDecoration(labelText: 'Type'),
              items: const <DropdownMenuItem<String>>[
                DropdownMenuItem<String>(value: 'PUBLIC', child: Text('Public')),
                DropdownMenuItem<String>(value: 'PRIVATE', child: Text('Private')),
              ],
              onChanged: (String? v) {
                if (v != null) setState(() => _type = v);
              },
            ),
          ],
        ),
      ),
    );
  }
}