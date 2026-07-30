import '../../../../core/error/exceptions.dart';
import 'dart:convert';
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

class AiPredictionDetailPage extends ConsumerWidget {
  const AiPredictionDetailPage({required this.predictionId, super.key});

  static const String routeName = 'ai-prediction-detail';
  static const String routePath = '/ai/predictions/:id';

  final String predictionId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final AsyncValue<AiPrediction> predictionAsync =
        ref.watch(aiPredictionDetailProvider(predictionId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Prediction'),
      ),
      body: predictionAsync.when(
        loading: () => const LoadingView(),
        error: (Object error, StackTrace _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load prediction.'),
          onRetry: () => ref.invalidate(aiPredictionDetailProvider(predictionId)),
        ),
        data: (AiPrediction prediction) => _AiPredictionDetail(prediction: prediction),
      ),
    );
  }
}

class _AiPredictionDetail extends StatelessWidget {
  const _AiPredictionDetail({required this.prediction});

  final AiPrediction prediction;

  @override
  Widget build(BuildContext context) {
    final Palette t = context.tokens;

    final String confidenceLabel = prediction.confidence != null
        ? Formatters.percent(prediction.confidence!, decimals: 1)
        : '—';

    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: <Widget>[
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              Text(
                'Prediction',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: Spacing.x2),
              if (prediction.modelName != null)
                Text(prediction.modelName!, style: TextStyle(color: t.textSecondary)),
              const SizedBox(height: Spacing.x2),
              Row(
                children: <Widget>[
                  if (prediction.confidence != null) ...<Widget>[
                    _pill(confidenceLabel, t.success, t.successLight),
                    const SizedBox(width: Spacing.x2),
                  ],
                  if (prediction.processingTime != null)
                    _pill(
                      '${prediction.processingTime!.toStringAsFixed(1)}ms',
                      t.info, t.infoLight,
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
              const _SectionTitle(title: 'Input'),
              Text(
                _prettyJson(prediction.input),
                style: const TextStyle(fontFamily: 'monospace', fontSize: TypeScale.xs),
              ),
            ],
          ),
        ),
        if (prediction.output != null) ...<Widget>[
          const SizedBox(height: Spacing.x4),
          _SectionCard(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: <Widget>[
                const _SectionTitle(title: 'Output'),
                Text(
                  _prettyJson(prediction.output!),
                  style: const TextStyle(fontFamily: 'monospace', fontSize: TypeScale.xs),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: Spacing.x4),
        _SectionCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: <Widget>[
              const _SectionTitle(title: 'Details'),
              _FieldRow('Model ID', prediction.modelId ?? '—'),
              _FieldRow('Model Name', prediction.modelName ?? '—'),
              _FieldRow('Confidence', confidenceLabel),
              _FieldRow('Processing Time', prediction.processingTime != null ? '${prediction.processingTime!.toStringAsFixed(1)}ms' : '—'),
              _FieldRow('Created', prediction.createdAt != null ? Formatters.dateTime(prediction.createdAt!) : '—'),
            ],
          ),
        ),
      ],
    );
  }

  Widget _pill(String label, Color fg, Color bg) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: Spacing.x2_5,
        vertical: Spacing.x1,
      ),
      decoration: BoxDecoration(color: bg, borderRadius: Radii.pill),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: TypeScale.xs,
          fontWeight: TypeScale.medium,
        ),
      ),
    );
  }

  String _prettyJson(Map<String, dynamic> map) {
    try {
      return const JsonEncoder.withIndent('  ').convert(map);
    } catch (_) {
      return map.toString();
    }
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
