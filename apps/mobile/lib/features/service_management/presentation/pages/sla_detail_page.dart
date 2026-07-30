import 'package:flutter/material.dart';

class SlaDetailPage extends StatelessWidget {
  const SlaDetailPage({super.key, required this.slaId});
  static const String routeName = 'sla-detail';
  static const String routePath = 'slas/:slaId';
  final String slaId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('SLA Detail')),
      body: const Center(child: Text('SLA Detail Page')),
    );
  }
}
