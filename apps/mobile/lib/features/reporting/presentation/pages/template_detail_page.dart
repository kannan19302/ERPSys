
import 'package:flutter/material.dart';

class TemplateDetailPage extends StatelessWidget {
  const TemplateDetailPage({super.key, this.id});
  final String? id;
  
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
