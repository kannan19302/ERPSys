
import 'package:flutter/material.dart';

class MrpRunFormPage extends StatelessWidget {
  const MrpRunFormPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'mrp-run-form';
  static const String routePath = '/manufacturing/mrp-runs/new';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
