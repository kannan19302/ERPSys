
import 'package:flutter/material.dart';

class BomFormPage extends StatelessWidget {
  const BomFormPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'bom-form';
  static const String routePath = '/manufacturing/boms/new';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
