import '../contracts/error_envelope.dart';

/// Data-layer exception carrying the API's error envelope verbatim.
/// Repositories translate these into [Failure]s; nothing above the data layer
/// should catch them.
class ApiException implements Exception {
  const ApiException(this.envelope);

  final ErrorEnvelope envelope;

  int get statusCode => envelope.statusCode;
  String get message => envelope.message;

  @override
  String toString() => 'ApiException(${envelope.statusCode}: ${envelope.message})';
}

/// Connectivity/timeout/socket-level problem — no HTTP response was received.
class NetworkException implements Exception {
  const NetworkException(this.message);

  final String message;

  @override
  String toString() => 'NetworkException($message)';
}

/// The response body did not match the expected contract.
class ParseException implements Exception {
  const ParseException(this.message);

  final String message;

  @override
  String toString() => 'ParseException($message)';
}

/// Local storage (secure storage, preferences, filesystem) failed.
class CacheException implements Exception {
  const CacheException(this.message);

  final String message;

  @override
  String toString() => 'CacheException($message)';
}
