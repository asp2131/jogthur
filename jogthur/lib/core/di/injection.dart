import 'package:get_it/get_it.dart';
import 'package:injectable/injectable.dart';

import 'injection.config.dart';

final GetIt getIt = GetIt.instance;

@InjectableInit()
Future<void> configureDependencies() async {
  await getIt.init();
}

// Manual registration for services that need special setup
void registerManualDependencies() {
  // Add any manual registrations here if needed
}
