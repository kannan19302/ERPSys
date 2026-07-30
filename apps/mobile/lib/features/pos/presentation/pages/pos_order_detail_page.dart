
import 'package:flutter/material.dart';

class PosOrderDetailPage extends StatelessWidget {
  const PosOrderDetailPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'pos-order-detail';
  static const String routePath = '/pos/orders/:id';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
