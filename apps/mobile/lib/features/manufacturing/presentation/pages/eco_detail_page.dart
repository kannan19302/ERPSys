
import 'package:flutter/material.dart';

class EcoDetailPage extends StatelessWidget {
  const EcoDetailPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'eco-detail';
  static const String routePath = '/manufacturing/ecos/:id';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
