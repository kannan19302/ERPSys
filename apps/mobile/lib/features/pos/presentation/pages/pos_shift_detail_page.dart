
import 'package:flutter/material.dart';

class PosShiftDetailPage extends StatelessWidget {
  const PosShiftDetailPage({super.key, this.id});
  final String? id;
  
  static const String routeName = 'pos-shift-detail';
  static const String routePath = '/pos/shifts/:id';
  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: Text('Placeholder')),
    );
  }
}
