
import 'package:flutter/material.dart';

class SaasPlanDetailPage extends StatelessWidget {
  static const String routeName = 'saas-plan-detail';
  static const String routePath = '/saas/plans/:id';
  const SaasPlanDetailPage({super.key, this.id});
  final String? id;
  
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
