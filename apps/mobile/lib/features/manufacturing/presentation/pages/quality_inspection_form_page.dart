
import 'package:flutter/material.dart';

class QualityInspectionFormPage extends StatelessWidget {
  const QualityInspectionFormPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'quality-inspection-form';
  static const String routePath = '/manufacturing/quality-inspections/new';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
