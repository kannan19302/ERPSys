
import 'package:flutter/material.dart';

class WorkstationFormPage extends StatelessWidget {
  const WorkstationFormPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'workstation-form';
  static const String routePath = '/manufacturing/workstations/new';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
