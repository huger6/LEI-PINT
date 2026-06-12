import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/sync_manager.dart';
import '../../../presentation/state/auth_store.dart';
import '../../widgets/profile/edit_profile_widgets.dart';

class EditProfileScreen extends StatelessWidget {
  const EditProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final tr = LanguageScope.of(context);
    final user = context.read<AuthStore>().currentUser;

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        backgroundColor: Colors.grey[100],
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        leading: IconButton(
          onPressed: () => Navigator.pop(context),
          icon: const Icon(
            Icons.arrow_back,
            color: Color(0xFF20252B),
            size: 26,
          ),
        ),
        title: Text(
          tr.tr('editProfile'),
          style: const TextStyle(
            color: Color(0xFF20252B),
            fontSize: 22,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
      body: SafeArea(
        child: EditProfileForm(
          initialUsername: user?.username ?? '',
          initialFullName: user?.fullName ?? '',
          initialBiography: user?.biography ?? '',
          initialLocationId: user?.locationId,
        ),
      ),
    );
  }
}
