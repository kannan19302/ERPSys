
import 'package:flutter/material.dart';

class PosDiscountFormPage extends StatelessWidget {
  const PosDiscountFormPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'pos-discount-form';
  static const String routePath = '/pos/discounts/new';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
