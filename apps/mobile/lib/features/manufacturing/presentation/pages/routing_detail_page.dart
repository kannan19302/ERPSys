
import 'package:flutter/material.dart';

class RoutingDetailPage extends StatelessWidget {
  const RoutingDetailPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'routing-detail';
  static const String routePath = '/manufacturing/routings/:id';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
