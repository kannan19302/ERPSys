import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/usecase/result.dart';
import '../providers/storage_providers.dart';

class BucketFormPage extends ConsumerStatefulWidget {
  const BucketFormPage({this.bucketId, super.key});
  static const String routeName = 'bucket-new';
  static const String routeEditName = 'bucket-edit';
  static const String routePath = '/storage/buckets/new';
  static const String routeEditPath = '/storage/buckets/:id/edit';
  final String? bucketId;

  @override
  ConsumerState<BucketFormPage> createState() => _BucketFormPageState();
}

class _BucketFormPageState extends ConsumerState<BucketFormPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _regionCtrl = TextEditingController();
  final _quotaCtrl = TextEditingController();
  String _provider = 'S3';
  bool _isPublic = false;
  bool _versioning = true;
  bool _saving = false;

  bool get _isEditing => widget.bucketId != null;

  @override
  void initState() { super.initState(); if (_isEditing) _load(); }

  Future<void> _load() async {
    final b = ref.read(storageBucketDetailProvider(widget.bucketId!)).valueOrNull;
    if (b != null) { _nameCtrl.text = b.bucketName; _regionCtrl.text = b.region; _quotaCtrl.text = b.maxQuotaGb.toString(); _provider = b.provider; _isPublic = b.isPublic; _versioning = b.versioning; }
  }

  @override
  void dispose() { _nameCtrl.dispose(); _regionCtrl.dispose(); _quotaCtrl.dispose(); super.dispose(); }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'bucketName': _nameCtrl.text.trim(), 'provider': _provider, 'region': _regionCtrl.text.trim(),
      'maxQuotaGb': int.tryParse(_quotaCtrl.text) ?? 100, 'isPublic': _isPublic, 'versioning': _versioning,
    };
    final result = await ref.read(bucketListControllerProvider.notifier).save(payload, id: widget.bucketId);
    if (!context.mounted) return;
    setState(() => _saving = false);
    result.fold((f) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(f.message))), (_) => Navigator.of(context).pop());
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isEditing ? 'Edit Bucket' : 'New Bucket'), actions: [
        TextButton(onPressed: _saving ? null : _save, child: _saving ? const SizedBox(height: Spacing.x5, width: Spacing.x5, child: CircularProgressIndicator(strokeWidth: 2)) : const Text('Save')),
      ]),
      body: Form(key: _formKey, child: ListView(padding: const EdgeInsets.all(Spacing.x4), children: [
        TextFormField(controller: _nameCtrl, decoration: const InputDecoration(labelText: 'Bucket Name *'), validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null),
        const SizedBox(height: Spacing.x4),
        DropdownButtonFormField<String>(value: _provider, decoration: const InputDecoration(labelText: 'Provider'), items: const [
          DropdownMenuItem(value: 'S3', child: Text('AWS S3')), DropdownMenuItem(value: 'GCS', child: Text('Google Cloud')),
          DropdownMenuItem(value: 'MinIO', child: Text('MinIO')), DropdownMenuItem(value: 'Azure', child: Text('Azure Blob')),
        ], onChanged: (v) { if (v != null) setState(() => _provider = v); }),
        const SizedBox(height: Spacing.x4), TextFormField(controller: _regionCtrl, decoration: const InputDecoration(labelText: 'Region')),
        const SizedBox(height: Spacing.x4), TextFormField(controller: _quotaCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Max Quota (GB)')),
        const SizedBox(height: Spacing.x4), SwitchListTile(title: const Text('Public Access'), value: _isPublic, onChanged: (v) => setState(() => _isPublic = v), contentPadding: EdgeInsets.zero),
        SwitchListTile(title: const Text('Enable Versioning'), value: _versioning, onChanged: (v) => setState(() => _versioning = v), contentPadding: EdgeInsets.zero),
      ])),
    );
  }
}
