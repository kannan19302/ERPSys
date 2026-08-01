
import 'package:flutter/material.dart';

class SaasPlanDetailPage extends StatelessWidget {
  const SaasPlanDetailPage({super.key, this.id});
  static const String routeName = 'saas-plan-detail';
  static const String routePath = '/saas/plans/:id';
  final String? id;
  
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
