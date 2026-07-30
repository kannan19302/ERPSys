
import 'package:flutter/material.dart';

class WorkOrderDetailPage extends StatelessWidget {
  const WorkOrderDetailPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'work-order-detail';
  static const String routePath = '/manufacturing/work-orders/:id';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
