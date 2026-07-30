import '../../../../core/error/exceptions.dart';
import 'package:flutter/material.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/permission_gate.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/widgets/state_views.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../domain/entities/ai.dart';
import '../providers/ai_providers.dart';

class AiModelDetailPage extends ConsumerWidget {
  const AiModelDetailPage({required this.modelId, super.key});

  static const String routeName = 'ai-model-detail';
  static const String routePath = '/ai/models/:id';

  final String modelId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<AiModel> modelAsync =
        ref.watch(aiModelDetailProvider(modelId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('AI Model'),
      ),
      body: modelAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load model.'),
          onRetry: () => ref.invalidate(aiModelDetailProvider(modelId)),
        ),
        data: (AiModel model) => _AiModelDetail(model: model),
      ),
    );
  }
}

class _AiModelDetail extends StatelessWidget {
  const _AiModelDetail({required this.model});

  final AiModel model;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final (String statusLabel, Color statusColor, Color statusBg) =
        switch (model.status) {
      'ACTIVE' => ('Active', t.success, t.successLight),
      'INACTIVE' => ('Inactive', t.textSecondary, t.bgSunken),
      'DEPRECATED' => ('Deprecated', t.danger, t.dangerLight),
      _ => ('Active', t.success, t.successLight),
    };

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
                    child: Text(
                      model.name,
                      style: Theme.of(context).textTheme.titleLarge,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: Spacing.x2_5,
                      vertical: Spacing.x1,
                    ),
                    decoration: BoxDecoration(
                      color: statusBg,
                      borderRadius: Radii.pill,
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: TypeScale.xs,
                        fontWeight: TypeScale.medium,
                      ),
                    ),
                  ),
                ],
              ),
              if (model.provider != null || model.version != null) ...<Widget>[
                const SizedBox(height: Spacing.x2),
                if (model.provider != null)
                  Text(model.provider!, style: TextStyle(color: t.textSecondary)),
                if (model.version != null)
                  Text('v${model.version!}', style: TextStyle(color: t.textSecondary)),
              ],
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Model Details'),
              _FieldRow('Provider', model.provider ?? '—'),
              _FieldRow('Version', model.version ?? '—'),
              _FieldRow('Status', statusLabel),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Capabilities'),
              if (model.capabilities.isEmpty)
                Text('None', style: TextStyle(color: t.textSecondary))
              else
                ...model.capabilities.map((String c) => Padding(
                      padding: const EdgeInsets.only(bottom: Spacing.x1),
                      child: Row(
                        children: <Widget>[
                          Icon(Icons.check_circle_outline, size: TypeScale.base, color: t.success),
                          const SizedBox(width: Spacing.x2),
                          Text(c),
                        ],
                      ),
                    )),
            ],
          ),
        ),
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Timeline'),
              _FieldRow('Created', model.createdAt != null ? Formatters.dateTime(model.createdAt!) : '—'),
              _FieldRow('Updated', model.updatedAt != null ? Formatters.dateTime(model.updatedAt!) : '—'),
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
