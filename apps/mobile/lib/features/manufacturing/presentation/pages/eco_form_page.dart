
import 'package:flutter/material.dart';

class EcoFormPage extends StatelessWidget {
  const EcoFormPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'eco-form';
  static const String routePath = '/manufacturing/ecos/new';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
