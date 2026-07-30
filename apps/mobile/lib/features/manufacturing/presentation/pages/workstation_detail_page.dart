
import 'package:flutter/material.dart';

class WorkstationDetailPage extends StatelessWidget {
  const WorkstationDetailPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'workstation-detail';
  static const String routePath = '/manufacturing/workstations/:id';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
