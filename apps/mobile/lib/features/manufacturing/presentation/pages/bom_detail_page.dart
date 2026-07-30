
import 'package:flutter/material.dart';

class BomDetailPage extends StatelessWidget {
  const BomDetailPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'bom-detail';
  static const String routePath = '/manufacturing/boms/:id';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
