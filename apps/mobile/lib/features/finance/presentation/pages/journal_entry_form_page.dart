import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/ui_card.dart';

class JournalEntryFormPage extends ConsumerStatefulWidget {
  const JournalEntryFormPage({this.journalEntryId, super.key});

  static const String routeName = 'journal-entry-form';
  static const String routePath = '/finance/journal-entries/new';

  final String? journalEntryId;

  @override
  ConsumerState<JournalEntryFormPage> createState() => _JournalEntryFormPageState();
}

class _JournalEntryFormPageState extends ConsumerState<JournalEntryFormPage> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create Journal Entry')),
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
                    const UiSectionHeader(title: 'Entry Details'),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Description'),
                      maxLines: 3,
                    ),
                    const SizedBox(height: Spacing.x3),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Reference'),
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
                        child: const Text('Save Entry'),
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
