import 'package:flutter/material.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../domain/entities/localization.dart';
import '../providers/localization_providers.dart';

class LanguageDetailPage extends ConsumerWidget {
  const LanguageDetailPage({required this.languageId, super.key});

  static const String routeName = 'language-detail';
  static const String routePath = '/localization/languages/:id';

  final String languageId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<LocalizationLanguage> languageAsync =
        ref.watch(languageDetailProvider(languageId));

    return Scaffold(
      appBar: AppBar(title: const Text('Language')),
      body: languageAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load language.'),
          onRetry: () => ref.invalidate(languageDetailProvider(languageId)),
        ),
        data: (LocalizationLanguage lang) => _LanguageDetail(language: lang),
      ),
    );
  }
}

class _LanguageDetail extends StatelessWidget {
  const _LanguageDetail({required this.language});

  final LocalizationLanguage language;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Row(
                children: <Widget>[
                  Expanded(
                    child: Text(language.name, style: Theme.of(context).textTheme.titleLarge),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: Spacing.x2_5, vertical: Spacing.x1),
                    decoration: BoxDecoration(
                      color: language.isActive ? t.successLight : t.bgSunken,
                      borderRadius: Radii.pill,
                    ),
                    child: Text(
                      language.isActive ? 'Active' : 'Inactive',
                      style: TextStyle(
                        color: language.isActive ? t.success : t.textSecondary,
                        fontSize: TypeScale.xs, fontWeight: TypeScale.medium,
                      ),
                    ),
                  ),
                ],
              ),
              if (language.isDefault)
                Padding(
                  padding: const EdgeInsets.only(top: Spacing.x2),
                  child: Text('Default language', style: TextStyle(color: t.info, fontSize: TypeScale.xs)),
                ),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Language Details'),
              _FieldRow('Code', language.code),
              _FieldRow('Direction', language.direction == 'rtl' ? 'Right-to-Left' : 'Left-to-Right'),
              _FieldRow('Sort Order', '${language.sortOrder}'),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Metadata'),
              _FieldRow('Created', language.createdAt != null ? Formatters.dateTime(language.createdAt!) : '—'),
              _FieldRow('Updated', language.updatedAt != null ? Formatters.dateTime(language.updatedAt!) : '—'),
            ],
          ),
        ),
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
        color: t.bgElevated, borderRadius: Radii.card, border: Border.all(color: t.border),
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
          Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
          Text(value, style: Theme.of(context).textTheme.labelLarge),
        ],
      ),
    );
  }
}