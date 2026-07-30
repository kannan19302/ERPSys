
import 'package:flutter/material.dart';

class PosDiscountDetailPage extends StatelessWidget {
  const PosDiscountDetailPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'pos-discount-detail';
  static const String routePath = '/pos/discounts/:id';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
