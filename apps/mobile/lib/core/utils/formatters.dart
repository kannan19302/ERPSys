import 'package:intl/intl.dart';

/// Locale-aware display formatting.
///
/// Currency and number formatting exist only for presentation — the domain and
/// wire layers always carry raw numbers, so no rounding ever reaches the API.
class Formatters {
  const Formatters._();

  /// Tenant currency is a server-side setting; until the mobile settings screen
  /// reads it, this is the display default.
  static String defaultCurrencyCode = 'USD';

  static String currency(double value, {String? currencyCode}) {
    final NumberFormat format = NumberFormat.simpleCurrency(
      name: currencyCode ?? defaultCurrencyCode,
    );
    return format.format(value);
  }

  static String number(num value, {int decimals = 0}) =>
      NumberFormat.decimalPatternDigits(decimalDigits: decimals).format(value);

  static String compact(num value) => NumberFormat.compact().format(value);

  static String percent(double value, {int decimals = 1}) =>
      '${value.toStringAsFixed(decimals)}%';

  static String date(DateTime value) =>
      DateFormat.yMMMd().format(value.toLocal());

  static String dateTime(DateTime value) =>
      DateFormat.yMMMd().add_jm().format(value.toLocal());

  /// Relative age, e.g. "3 min ago" — used in feeds and stale-data banners.
  static String relative(DateTime value) {
    final Duration delta = DateTime.now().difference(value.toLocal());
    if (delta.inSeconds < 60) return 'just now';
    if (delta.inMinutes < 60) return '${delta.inMinutes} min ago';
    if (delta.inHours < 24) return '${delta.inHours} h ago';
    if (delta.inDays < 7) return '${delta.inDays} d ago';
    return date(value);
  }
}
