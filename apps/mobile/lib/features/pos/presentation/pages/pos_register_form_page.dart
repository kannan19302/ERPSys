
import 'package:flutter/material.dart';

class PosRegisterFormPage extends StatelessWidget {
  const PosRegisterFormPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'pos-register-form';
  static const String routePath = '/pos/registers/new';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
