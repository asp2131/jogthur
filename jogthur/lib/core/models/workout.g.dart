// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'workout.dart';

// **************************************************************************
// TypeAdapterGenerator
// **************************************************************************

class WorkoutAdapter extends TypeAdapter<Workout> {
  @override
  final int typeId = 1;

  @override
  Workout read(BinaryReader reader) {
    final numOfFields = reader.readByte();
    final fields = <int, dynamic>{
      for (int i = 0; i < numOfFields; i++) reader.readByte(): reader.read(),
    };
    return Workout(
      id: fields[0] as String?,
      type: fields[1] as ActivityType,
      startTime: fields[2] as DateTime,
      endTime: fields[3] as DateTime?,
      distance: fields[4] as double,
      duration: fields[5] as int,
      averagePace: fields[6] as double,
      maxSpeed: fields[7] as double,
      route: (fields[8] as List).cast<LocationPoint>(),
      calories: fields[9] as double?,
    );
  }

  @override
  void write(BinaryWriter writer, Workout obj) {
    writer
      ..writeByte(10)
      ..writeByte(0)
      ..write(obj.id)
      ..writeByte(1)
      ..write(obj.type)
      ..writeByte(2)
      ..write(obj.startTime)
      ..writeByte(3)
      ..write(obj.endTime)
      ..writeByte(4)
      ..write(obj.distance)
      ..writeByte(5)
      ..write(obj.duration)
      ..writeByte(6)
      ..write(obj.averagePace)
      ..writeByte(7)
      ..write(obj.maxSpeed)
      ..writeByte(8)
      ..write(obj.route)
      ..writeByte(9)
      ..write(obj.calories);
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is WorkoutAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}

class ActivityTypeAdapter extends TypeAdapter<ActivityType> {
  @override
  final int typeId = 0;

  @override
  ActivityType read(BinaryReader reader) {
    switch (reader.readByte()) {
      case 0:
        return ActivityType.walk;
      case 1:
        return ActivityType.run;
      case 2:
        return ActivityType.bike;
      default:
        return ActivityType.walk;
    }
  }

  @override
  void write(BinaryWriter writer, ActivityType obj) {
    switch (obj) {
      case ActivityType.walk:
        writer.writeByte(0);
        break;
      case ActivityType.run:
        writer.writeByte(1);
        break;
      case ActivityType.bike:
        writer.writeByte(2);
        break;
    }
  }

  @override
  int get hashCode => typeId.hashCode;

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is ActivityTypeAdapter &&
          runtimeType == other.runtimeType &&
          typeId == other.typeId;
}
