import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../domain/entities/inventory.dart';
import '../../domain/usecases/inventory_usecases.dart';
import '../providers/inventory_providers.dart';

class ProductCategoryFormPage extends ConsumerStatefulWidget {
  const ProductCategoryFormPage({this.category, super.key});

  static const String routeName = 'product-category-new';
  static const String routeEditName = 'product-category-edit';
  static const String routePath = '/inventory/categories/new';
  static const String routeEditPath = '/inventory/categories/:id/edit';

  final ProductCategory? category;

  @override
  ConsumerState<ProductCategoryFormPage> createState() =>
      _ProductCategoryFormPageState();
}

class _ProductCategoryFormPageState
    extends ConsumerState<ProductCategoryFormPage> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameCtrl;
  late final TextEditingController _descriptionCtrl;
  late final TextEditingController _parentIdCtrl;
  bool _isActive = true;
  bool _submitting = false;

  bool get _isEditing => widget.category != null;

  @override
  void initState() {
    super.initState();
    final c = widget.category;
    _nameCtrl = TextEditingController(text: c?.name ?? '');
    _descriptionCtrl = TextEditingController(text: c?.description ?? '');
    _parentIdCtrl = TextEditingController(text: c?.parentId ?? '');
    _isActive = c?.isActive ?? true;
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descriptionCtrl.dispose();
    _parentIdCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_isEditing ? 'Edit Category' : 'New Category'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(Spacing.x4),
          children: <Widget>[
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(labelText: 'Name *'),
              validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _descriptionCtrl,
              decoration: const InputDecoration(labelText: 'Description'),
              maxLines: 3,
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            TextFormField(
              controller: _parentIdCtrl,
              decoration: const InputDecoration(
                labelText: 'Parent Category ID',
                helperText: 'Leave empty for top-level category',
              ),
              textInputAction: TextInputAction.next,
            ),
            const SizedBox(height: Spacing.x4),
            SwitchListTile(
              title: const Text('Active'),
              value: _isActive,
              contentPadding: EdgeInsets.zero,
              onChanged: (v) => setState(() => _isActive = v),
            ),
            const SizedBox(height: Spacing.x6),
            FilledButton(
              onPressed: _submitting ? null : _submit,
              child: _submitting
                  ? const SizedBox(
                      height: Spacing.x5,
                      width: Spacing.x5,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Text(_isEditing ? 'Save Changes' : 'Create Category'),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _submitting = true);

    final payload = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'description': _descriptionCtrl.text.trim(),
      'parentId': _parentIdCtrl.text.trim().isEmpty
          ? null
          : _parentIdCtrl.text.trim(),
      'isActive': _isActive,
    };

    final result = await SaveProductCategoryUseCase(
      ref.read(inventoryRepositoryProvider),
    )(
      SaveProductCategoryParams(
        payload: payload,
        id: _isEditing ? widget.category!.id : null,
      ),
    );

    if (!context.mounted) return;
    setState(() => _submitting = false);

    result.fold(
      (Failure failure) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(failure.message)));
      },
      (_) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_isEditing
                ? 'Category updated'
                : 'Category created'),
          ),
        );
        Navigator.of(context).pop();
      },
    );
  }
}
