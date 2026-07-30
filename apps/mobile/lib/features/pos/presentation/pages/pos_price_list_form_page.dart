
import 'package:flutter/material.dart';

class PosPriceListFormPage extends StatelessWidget {
  const PosPriceListFormPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'pos-price-list-form';
  static const String routePath = '/pos/price-lists/new';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
