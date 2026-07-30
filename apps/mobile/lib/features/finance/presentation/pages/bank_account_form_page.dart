import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/widgets/ui_card.dart';
import '../providers/finance_providers.dart';

class BankAccountFormPage extends ConsumerStatefulWidget {
  const BankAccountFormPage({this.bankAccountId, super.key});

  static const String routeName = 'bank-account-form';
  static const String routePath = '/finance/bank-accounts/new';

  final String? bankAccountId;

  @override
  ConsumerState<BankAccountFormPage> createState() => _BankAccountFormPageState();
}

class _BankAccountFormPageState extends ConsumerState<BankAccountFormPage> {
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Add Bank Account')),
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
                    const UiSectionHeader(title: 'Account Details'),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Account Name'),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: Spacing.x3),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Account Number'),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: Spacing.x3),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Bank Name'),
                      validator: (v) => v == null || v.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: Spacing.x3),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Branch'),
                    ),
                    const SizedBox(height: Spacing.x3),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Currency'),
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
                        child: const Text('Save Account'),
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
