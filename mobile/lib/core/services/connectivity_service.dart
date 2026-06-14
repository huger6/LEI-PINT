import 'dart:async';
import 'dart:io';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';

class ConnectivityService extends ChangeNotifier {
  ConnectivityService() {
    _subscription = Connectivity().onConnectivityChanged.listen(_onChanged);
    _checkConnectivity();
  }

  StreamSubscription<List<ConnectivityResult>>? _subscription;
  bool _isOnline = true;

  bool get isOnline => _isOnline;

  final _controller = StreamController<bool>.broadcast();
  Stream<bool> get onConnectivityChanged => _controller.stream;

  Future<void> _checkConnectivity() async {
    final results = await Connectivity().checkConnectivity();
    await _onChanged(results);
  }

  Future<void> _onChanged(List<ConnectivityResult> results) async {
    final hasNetwork = results.any((r) => r != ConnectivityResult.none);

    if (!hasNetwork) {
      _setOnline(false);
      return;
    }

    try {
      final result = await InternetAddress.lookup('google.com')
          .timeout(const Duration(seconds: 3));
      _setOnline(result.isNotEmpty && result[0].rawAddress.isNotEmpty);
    } on SocketException {
      _setOnline(false);
    } on TimeoutException {
      _setOnline(false);
    }
  }

  void _setOnline(bool value) {
    if (_isOnline == value) return;
    _isOnline = value;
    if (!_controller.isClosed) _controller.add(value);
    notifyListeners();
    debugPrint('ConnectivityService: ${value ? "ONLINE" : "OFFLINE"}');
  }

  Future<void> recheckNow() async => _checkConnectivity();

  @override
  void dispose() {
    _subscription?.cancel();
    _controller.close();
    super.dispose();
  }
}
