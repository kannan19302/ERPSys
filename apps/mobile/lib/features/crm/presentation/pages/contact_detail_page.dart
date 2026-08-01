import 'package:flutter/material.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/rbac/permissions.dart';
import '../../domain/entities/crm.dart';
import '../providers/crm_providers.dart';

class ContactDetailPage extends ConsumerWidget {
  const ContactDetailPage({required this.contactId, super.key});

  static const String routeName = 'contact-detail';
  static const String routePath = '/crm/contacts/:id';

  final String contactId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<Contact> contactAsync =
        ref.watch(contactDetailProvider(contactId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Contact'),
        actions: <Widget>[
          PermissionGate(
            permission: Permissions.crmContactUpdate,
            child: IconButton(
              icon: const Icon(Icons.edit_outlined),
              tooltip: 'Edit contact',
              onPressed: () => context.pushNamed(
                'contact-edit',
                pathParameters: <String, String>{'id': contactId},
              ),
            ),
          ),
          PermissionGate(
            permission: Permissions.crmContactDelete,
            child: IconButton(
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Delete contact',
              onPressed: () => _confirmDelete(context, ref),
            ),
          ),
        ],
      ),
      body: contactAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load contact.'),
          onRetry: () => ref.invalidate(contactDetailProvider(contactId)),
        ),
        data: (Contact contact) => _ContactDetail(contact: contact),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final bool? confirmed = await showDialog<bool>(
      context: context,
      builder: (BuildContext dialogContext) => AlertDialog(
        title: const Text('Delete contact?'),
        content: const Text('This cannot be undone.'),
        actions: <Widget>[
          TextButton(
            onPressed: () => Navigator.of(dialogContext).pop(false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(dialogContext).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final result = await ref
        .read(contactsProvider.notifier)
        .delete(contactId);

    if (!context.mounted) return;
    result.fold(
      (failure) => ScaffoldMessenger.of(context)
          .showSnackBar(SnackBar(content: Text(failure.message))),
      (_) => Navigator.of(context).pop(),
    );
  }
}

class _ContactDetail extends StatelessWidget {
  const _ContactDetail({required this.contact});

  final Contact contact;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final String displayName =
        '${contact.firstName ?? ''} ${contact.lastName ?? ''}'.trim();

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  CircleAvatar(
                    radius: Spacing.x6,
                    backgroundColor: t.primaryLight,
                    child: Icon(Icons.person_outline, color: t.primary, size: TypeScale.x2l),
                  ),
                  const SizedBox(width: Spacing.x4),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: <Widget>[
                        Text(
                          displayName.isNotEmpty ? displayName : 'Unnamed',
                          style: Theme.of(context).textTheme.titleLarge,
                        ),
                        if (contact.isPrimary)
                          Padding(
                            padding: const EdgeInsets.only(top: Spacing.x1),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: Spacing.x2_5,
                                vertical: Spacing.x1,
                              ),
                              decoration: BoxDecoration(
                                color: t.infoLight,
                                borderRadius: Radii.pill,
                              ),
                              child: Text(
                                'Primary contact',
                                style: TextStyle(
                                  color: t.info,
                                  fontSize: TypeScale.xs,
                                  fontWeight: TypeScale.medium,
                                ),
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Contact Info'),
              _FieldRow('Email', contact.email ?? '—'),
              _FieldRow('Phone', contact.phone ?? '—'),
              _FieldRow('Mobile', contact.mobile ?? '—'),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Organization'),
              _FieldRow('Position', contact.position ?? '—'),
              _FieldRow('Department', contact.department ?? '—'),
            ],
          ),
        ),
        if (contact.notes != null && contact.notes!.isNotEmpty) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          _SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const _SectionTitle(title: 'Notes'),
                Text(contact.notes!),
              ],
            ),
          ),
        ],
      ],
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

class _SectionTitle extends StatelessWidget {
  const _SectionTitle({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: Spacing.x3),
      child: Text(title, style: Theme.of(context).textTheme.titleMedium),
    );
  }
}

class _FieldRow extends StatelessWidget {
  const _FieldRow(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(
        children: <Widget>[
          Expanded(
            child: Text(label, style: TextStyle(color: t.textSecondary)),
          ),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}
