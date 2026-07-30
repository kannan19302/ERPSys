import 'package:flutter/material.dart';

class SavedViewFormPage extends StatelessWidget {
  const SavedViewFormPage({super.key});
  static const String routeName = 'saved-view-form';
  static const String routePath = 'new';

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Saved View Form')),
      body: const Center(child: Text('Saved View Form Page')),
    );
  }
}
