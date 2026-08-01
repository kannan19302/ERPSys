import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/ui_card.dart';

class CreditNoteFormPage extends ConsumerStatefulWidget {
  const CreditNoteFormPage({this.creditNoteId, super.key});

  static const String routeName = 'credit-note-form';
  static const String routePath = '/finance/credit-notes/new';

  final String? creditNoteId;

  @override
  ConsumerState<CreditNoteFormPage> createState() => _CreditNoteFormPageState();
}

class _CreditNoteFormPageState extends ConsumerState<CreditNoteFormPage> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Credit Note')),
      body: Padding(
        padding: const EdgeInsets.all(Spacing.x4),
        child: Form(
          key: _formKey,
          child: ListView(
            children: <Widget>[
              _SectionCard(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: <Widget>[
                    const UiSectionHeader(title: 'Credit Note Details'),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Customer ID'),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: Spacing.x3),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Invoice ID'),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: Spacing.x3),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Reason'),
                      maxLines: 3,
                    ),
                    const SizedBox(height: Spacing.x3),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Total Amount'),
                      keyboardType: TextInputType.number,
                    ),
                    const SizedBox(height: Spacing.x4),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: () {
                          if (_formKey.currentState!.validate()) {
                            Navigator.of(context).pop();
                          }
                        },
                        child: const Text('Save Credit Note'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SectionCard extends StatelessWidget {
  const _SectionCard({required this.child});
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(Spacing.x4),
      decoration: BoxDecoration(
        color: t.bgElevated,
        borderRadius: Radii.card,
        border: Border.all(color: t.border),
      ),
      child: child,
    );
  }
}
