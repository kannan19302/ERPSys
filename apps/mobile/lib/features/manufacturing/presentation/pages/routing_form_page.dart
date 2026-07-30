
import 'package:flutter/material.dart';

class RoutingFormPage extends StatelessWidget {
  const RoutingFormPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'routing-form';
  static const String routePath = '/manufacturing/routings/new';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
