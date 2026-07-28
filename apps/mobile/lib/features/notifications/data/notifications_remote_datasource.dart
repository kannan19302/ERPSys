import '../../../core/network/api_client.dart';
import '../../../core/network/api_paths.dart';
import '../domain/entities/notification.dart';

/// `apps/api/src/modules/communication/communication.controller.ts`
/// (`/communication/notifications`) — the endpoint returns a bare array, not
/// the paginated contract, so this reads it as one page.
abstract class NotificationsRemoteDataSource {
  Future<List<AppNotification>> list();

  Future<void> markStatus(String id, {required bool read});
}

class NotificationsRemoteDataSourceImpl implements NotificationsRemoteDataSource {
  const NotificationsRemoteDataSourceImpl(this._client);

  final ApiClient _client;

  @override
  Future<List<AppNotification>> list() async {
    final List<Map<String, dynamic>> rows =
        await _client.getList(ApiPaths.notifications);
    return rows.map(AppNotification.fromJson).toList(growable: false);
  }

  @override
  Future<void> markStatus(String id, {required bool read}) async {
    await _client.put(
      ApiPaths.notificationStatus(id),
      body: <String, dynamic>{'status': read ? 'READ' : 'ARCHIVED'},
    );
  }
}
