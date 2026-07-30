import 'package:flutter/material.dart';

class MarketplaceSubmissionListPage extends StatelessWidget {
  const MarketplaceSubmissionListPage({super.key});
  static const String routeName = 'marketplace-submission-list';
  static const String routePath = 'submissions';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Marketplace Submissions')),
      body: const Center(child: Text('Marketplace Submission List Page')),
    );
  }
}
