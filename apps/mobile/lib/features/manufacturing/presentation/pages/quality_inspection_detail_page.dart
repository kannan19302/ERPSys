
import 'package:flutter/material.dart';

class QualityInspectionDetailPage extends StatelessWidget {
  const QualityInspectionDetailPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'quality-inspection-detail';
  static const String routePath = '/manufacturing/quality-inspections/:id';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
