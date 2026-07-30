import 'package:flutter/material.dart';

class ServiceRequestDetailPage extends StatelessWidget {
  const ServiceRequestDetailPage({super.key, required this.requestId});
  static const String routeName = 'service-request-detail';
  static const String routePath = ':id';
  final String requestId;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Service Request Detail')),
      body: const Center(child: Text('Service Request Detail Page')),
    );
  }
}
