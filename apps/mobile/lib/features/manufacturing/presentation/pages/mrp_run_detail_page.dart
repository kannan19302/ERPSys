
import 'package:flutter/material.dart';

class MrpRunDetailPage extends StatelessWidget {
  const MrpRunDetailPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'mrp-run-detail';
  static const String routePath = '/manufacturing/mrp-runs/:id';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
