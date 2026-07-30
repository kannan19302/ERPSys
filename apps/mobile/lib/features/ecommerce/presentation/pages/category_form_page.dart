
import 'package:flutter/material.dart';

class EcommerceCategoryFormPage extends StatelessWidget {
  static const String routeName = 'ecommerce-category-form';
  static const String routePath = 'categories/new';
  const EcommerceCategoryFormPage({super.key, this.id});
  final String? id;
  
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
