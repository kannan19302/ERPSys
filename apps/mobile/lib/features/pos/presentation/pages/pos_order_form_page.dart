
import 'package:flutter/material.dart';

class PosOrderFormPage extends StatelessWidget {
  const PosOrderFormPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'pos-order-form';
  static const String routePath = '/pos/orders/new';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
