import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../app/theme/design_tokens.dart';
import '../../../../core/error/failures.dart';
import '../../../../core/utils/formatters.dart';
import '../../../../core/widgets/state_views.dart';
import '../../../../core/widgets/ui_card.dart';
import '../../domain/entities/projects.dart';
import '../providers/projects_providers.dart';

class ProjectPortfolioDetailPage extends ConsumerWidget {
  const ProjectPortfolioDetailPage({required this.portfolioId, super.key});
  static const String routeName = 'project-portfolio-detail';
  static const String routePath = '/projects/portfolios/:id';
  final String portfolioId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final pAsync = ref.watch(projectPortfolioDetailProvider(portfolioId));

    return Scaffold(
      appBar: AppBar(title: const Text('Portfolio')),
      body: pAsync.when(
        loading: () => const LoadingView(),
        error: (error, _) => FailureView(
          failure: error is Failure ? error : const ServerFailure('Could not load portfolio.'),
          onRetry: () => ref.invalidate(projectPortfolioDetailProvider(portfolioId)),
        ),
        data: (p) => _PortfolioDetail(portfolio: p),
      ),
    );
  }
}

class _PortfolioDetail extends StatelessWidget {
  const _PortfolioDetail({required this.portfolio});
  final ProjectPortfolio portfolio;

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(Spacing.x4),
      children: [
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(portfolio.name, style: Theme.of(context).textTheme.titleLarge),
            if (portfolio.description != null && portfolio.description!.isNotEmpty) ...[
              const SizedBox(height: Spacing.x1),
              Text(portfolio.description!),
            ],
          ],
        ),),
        const SizedBox(height: Spacing.x4),
        UiCard(child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const UiSectionHeader(title: 'Summary'),
            _Row('Projects', '${portfolio.projectCount}'),
            _Row('Total Budget', Formatters.currency(portfolio.totalBudget)),
          ],
        ),),
      ],
    );
  }
}

class _Row extends StatelessWidget {
  const _Row(this.label, this.value);
  final String label;
  final String value;
  @override
  Widget build(BuildContext context) {
    final t = context.tokens;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: Spacing.x1_5),
      child: Row(children: [
        Expanded(child: Text(label, style: TextStyle(color: t.textSecondary))),
        Text(value, style: Theme.of(context).textTheme.labelLarge),
      ],),
    );
  }
}