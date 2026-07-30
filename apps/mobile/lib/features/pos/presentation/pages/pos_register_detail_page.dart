
import 'package:flutter/material.dart';

class PosRegisterDetailPage extends StatelessWidget {
  const PosRegisterDetailPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'pos-register-detail';
  static const String routePath = '/pos/registers/:id';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
