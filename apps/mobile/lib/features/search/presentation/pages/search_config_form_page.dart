import 'package:flutter/material.dart';

class SearchConfigFormPage extends StatelessWidget {
  const SearchConfigFormPage({super.key});
  static const String routeName = 'search-config-form';
  static const String routePath = 'new';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Search Config Form')),
      body: const Center(child: Text('Search Config Form Page')),
    );
  }
}
