// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'user_preferences.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class UserPreferencesAdapter extends TypeAdapter<UserPreferences> {
  @override
  final int typeId = 4;

  @override
  UserPreferences read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return UserPreferences(
      units: fields[0] as Units,
      defaultActivity: fields[1] as ActivityType,
      characterTheme: fields[2] as String,
      soundEnabled: fields[3] as bool,
      hapticEnabled: fields[4] as bool,
      animationsEnabled: fields[5] as bool,
      gpsUpdateInterval: fields[6] as double,
      backgroundTrackingEnabled: fields[7] as bool,
      autoSaveEnabled: fields[8] as bool,
    );
  }

  @override
  void write(BinaryWriter writer, UserPreferences obj) {
    writer
      ..writeByte(9)
      ..writeByte(0)
      ..write(obj.units)
      ..writeByte(1)
      ..write(obj.defaultActivity)
      ..writeByte(2)
      ..write(obj.characterTheme)
      ..writeByte(3)
      ..write(obj.soundEnabled)
      ..writeByte(4)
      ..write(obj.hapticEnabled)
      ..writeByte(5)
      ..write(obj.animationsEnabled)
      ..writeByte(6)
      ..write(obj.gpsUpdateInterval)
      ..writeByte(7)
      ..write(obj.backgroundTrackingEnabled)
      ..writeByte(8)
      ..write(obj.autoSaveEnabled);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UserPreferencesAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class UnitsAdapter extends TypeAdapter<Units> {
  @override
  final int typeId = 3;

  @override
  Units read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return Units.metric;
      case 1:
        return Units.imperial;
      default:
        return Units.metric;
    }
  }

  @override
  void write(BinaryWriter writer, Units obj) {
    switch (obj) {
      case Units.metric:
        writer.writeByte(0);
        break;
      case Units.imperial:
        writer.writeByte(1);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is UnitsAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
