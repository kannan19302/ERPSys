import 'package:flutter/material.dart';

class ServiceRequestListPage extends StatelessWidget {
  const ServiceRequestListPage({super.key});
  static const String routeName = 'service-request-list';
  static const String routePath = 'service-requests';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Service Requests')),
      body: const Center(child: Text('Service Request List Page')),
    );
  }
}
