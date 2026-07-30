
import 'package:flutter/material.dart';

class WorkOrderFormPage extends StatelessWidget {
  const WorkOrderFormPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'work-order-form';
  static const String routePath = '/manufacturing/work-orders/new';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
