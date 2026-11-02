import 'dart:convert';

import 'package:collection/collection.dart';
import 'package:dio/dio.dart';
import 'package:drift/drift.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:spotube/models/database/database.dart';
import 'package:spotube/models/metadata/metadata.dart';
import 'package:spotube/models/playback/track_sources.dart';
import 'package:spotube/provider/database/database.dart';
import 'package:spotube/provider/metadata_plugin/audio_source/quality_presets.dart';
import 'package:spotube/provider/metadata_plugin/metadata_plugin_provider.dart';
import 'package:spotube/services/dio/dio.dart';
import 'package:spotube/services/logger/logger.dart';
import 'package:spotube/services/metadata/errors/exceptions.dart';
import 'package:spotube/services/haze/haze_resolver.dart';

import 'package:spotube/services/sourced_track/exceptions.dart';
import 'package:spotube/utils/service_utils.dart';

final officialMusicRegex = RegExp(
  r"official\s(video|audio|music\svideo|lyric\svideo|visualizer)",
  caseSensitive: false,
);

class SourcedTrack extends BasicSourcedTrack {
  final Ref ref;

  SourcedTrack({
    required this.ref,
    required super.info,
    required super.query,
    required super.source,
    required super.siblings,
    required super.sources,
  });

  static Future<SourcedTrack> fetchFromTrack({
    required SpotubeFullTrackObject query,
    required Ref ref,
  }) async {
    final audioSource = await ref.read(audioSourcePluginProvider.future);
    final audioSourceConfig = await ref.read(metadataPluginsProvider
        .selectAsync((data) => data.defaultAudioSourcePluginConfig));
    if (audioSource == null || audioSourceConfig == null) {
      throw MetadataPluginException.noDefaultAudioSourcePlugin();
    }

    // Resolve direct Studio Master 320k / FLAC from HAZE engine
    HazeResolvedResult? hazeResult;
    try {
      hazeResult = await HazeResolver.resolve(query);
    } catch (e, stack) {
      AppLogger.log.w("HAZE resolver error: $e", error: e, stackTrace: stack);
    }

    final database = ref.read(databaseProvider);
    final cachedSource = await (database.select(database.sourceMatchTable)
          ..where((s) =>
              s.trackId.equals(query.id) &
              s.sourceType.equals(audioSourceConfig.slug))
          ..limit(1)
          ..orderBy([
            (s) =>
                OrderingTerm(expression: s.createdAt, mode: OrderingMode.desc),
          ]))
        .get()
        .then((s) => s.firstOrNull);

    if (cachedSource == null) {
      final siblings = await fetchSiblings(ref: ref, query: query);
      if (siblings.isEmpty && hazeResult == null) {
        throw TrackNotFoundError(query);
      }

      final defaultSibling = siblings.firstOrNull ?? hazeResult!.match;

      await database.into(database.sourceMatchTable).insert(
            SourceMatchTableCompanion.insert(
              trackId: query.id,
              sourceInfo: Value(jsonEncode(defaultSibling)),
              sourceType: audioSourceConfig.slug,
            ),
          );

      final manifest = siblings.isNotEmpty
          ? await audioSource.audioSource.streams(siblings.first)
          : <SpotubeAudioSourceStreamObject>[];

      final combinedSources = [
        if (hazeResult != null) hazeResult.stream,
        ...manifest,
      ];

      return SourcedTrack(
        ref: ref,
        siblings: siblings.isNotEmpty ? siblings.skip(1).toList() : [],
        info: hazeResult != null ? hazeResult.match : defaultSibling,
        source: hazeResult != null ? "haze" : audioSourceConfig.slug,
        sources: combinedSources,
        query: query,
      );
    }
    final item = SpotubeAudioSourceMatchObject.fromJson(
      jsonDecode(cachedSource.sourceInfo),
    );
    final manifest = await audioSource.audioSource.streams(item);

    final combinedSources = [
      if (hazeResult != null) hazeResult.stream,
      ...manifest,
    ];

    final sourcedTrack = SourcedTrack(
      ref: ref,
      siblings: [],
      sources: combinedSources,
      info: hazeResult != null ? hazeResult.match : item,
      query: query,
      source: hazeResult != null ? "haze" : audioSourceConfig.slug,
    );

    AppLogger.log.i("${query.name}: ${sourcedTrack.url}");

    return sourcedTrack;
  }

  static List<SpotubeAudioSourceMatchObject> rankResults(
    List<SpotubeAudioSourceMatchObject> results,
    SpotubeFullTrackObject track,
  ) {
    return results
        .map((sibling) {
          int score = 0;

          for (final artist in track.artists) {
            final isSameChannelArtist =
                sibling.artists.any((a) => a.toLowerCase() == artist.name);

            if (isSameChannelArtist) {
              score += 1;
            }

            final titleContainsArtist =
                sibling.title.toLowerCase().contains(artist.name.toLowerCase());

            if (titleContainsArtist) {
              score += 1;
            }
          }

          final titleContainsTrackName =
              sibling.title.toLowerCase().contains(track.name.toLowerCase());

          final hasOfficialFlag =
              officialMusicRegex.hasMatch(sibling.title.toLowerCase());

          if (titleContainsTrackName) {
            score += 3;
          }

          if (hasOfficialFlag) {
            score += 1;
          }

          if (hasOfficialFlag && titleContainsTrackName) {
            score += 2;
          }

          return (sibling: sibling, score: score);
        })
        .sorted((a, b) => b.score.compareTo(a.score))
        .map((e) => e.sibling)
        .toList();
  }

  static Future<List<SpotubeAudioSourceMatchObject>> fetchSiblings({
    required SpotubeFullTrackObject query,
    required Ref ref,
  }) async {
    final audioSource = await ref.read(audioSourcePluginProvider.future);

    if (audioSource == null) {
      throw MetadataPluginException.noDefaultAudioSourcePlugin();
    }

    final videoResults = <SpotubeAudioSourceMatchObject>[];

    final searchResults = await audioSource.audioSource.matches(query);

    if (ServiceUtils.onlyContainsEnglish(query.name)) {
      videoResults.addAll(searchResults);
    } else {
      videoResults.addAll(rankResults(searchResults, query));
    }

    return videoResults.toSet().toList();
  }

  Future<SourcedTrack> copyWithSibling() async {
    if (siblings.isNotEmpty) {
      return this;
    }
    final fetchedSiblings = await fetchSiblings(ref: ref, query: query);

    return SourcedTrack(
      ref: ref,
      siblings: fetchedSiblings.where((s) => s.id != info.id).toList(),
      source: source,
      sources: sources,
      info: info,
      query: query,
    );
  }

  Future<SourcedTrack?> swapWithSibling(
    SpotubeAudioSourceMatchObject sibling,
  ) async {
    if (sibling.id == info.id) {
      return null;
    }

    final audioSource = await ref.read(audioSourcePluginProvider.future);
    final audioSourceConfig = await ref.read(metadataPluginsProvider
        .selectAsync((data) => data.defaultAudioSourcePluginConfig));
    if (audioSource == null || audioSourceConfig == null) {
      throw MetadataPluginException.noDefaultAudioSourcePlugin();
    }

    // a sibling source that was fetched from the search results
    final isStepSibling = siblings.none((s) => s.id == sibling.id);

    final newSourceInfo = isStepSibling
        ? sibling
        : siblings.firstWhere((s) => s.id == sibling.id);

    final newSiblings = siblings.where((s) => s.id != sibling.id).toList()
      ..insert(0, info);

    final manifest = await audioSource.audioSource.streams(newSourceInfo);

    final database = ref.read(databaseProvider);

    // Delete the old Entry
    await (database.sourceMatchTable.delete()
          ..where(
            (table) =>
                table.trackId.equals(query.id) &
                table.sourceType.equals(audioSourceConfig.slug),
          ))
        .go();

    await database.into(database.sourceMatchTable).insert(
          SourceMatchTableCompanion.insert(
            trackId: query.id,
            sourceInfo: Value(jsonEncode(sibling)),
            sourceType: audioSourceConfig.slug,
            createdAt: Value(DateTime.now()),
          ),
          mode: InsertMode.replace,
        );

    return SourcedTrack(
      ref: ref,
      source: source,
      siblings: newSiblings,
      sources: manifest,
      info: newSourceInfo,
      query: query,
    );
  }

  Future<SourcedTrack?> swapWithSiblingOfIndex(int index) {
    return swapWithSibling(siblings[index]);
  }

  Future<SourcedTrack> refreshStream() async {
    final audioSource = await ref.read(audioSourcePluginProvider.future);
    final audioSourceConfig = await ref.read(metadataPluginsProvider
        .selectAsync((data) => data.defaultAudioSourcePluginConfig));
    if (audioSource == null || audioSourceConfig == null) {
      throw MetadataPluginException.noDefaultAudioSourcePlugin();
    }

    List<SpotubeAudioSourceStreamObject> validStreams = [];

    final stringBuffer = StringBuffer();
    for (final source in sources) {
      final res = await globalDio.head(
        source.url,
        options:
            Options(validateStatus: (status) => status != null && status < 500),
      );

      stringBuffer.writeln(
        "[${query.id}] ${res.statusCode} ${source.container} ${source.codec} ${source.bitrate}",
      );

      if (res.statusCode! < 400) {
        validStreams.add(source);
      }
    }

    AppLogger.log.d(stringBuffer.toString());

    if (validStreams.isEmpty) {
      validStreams = await audioSource.audioSource.streams(info);
    }

    final sourcedTrack = SourcedTrack(
      ref: ref,
      siblings: siblings,
      source: source,
      sources: validStreams,
      info: info,
      query: query,
    );

    AppLogger.log.i("Refreshing ${query.name}: ${sourcedTrack.url}");

    return sourcedTrack;
  }

  String? get url {
    final preferences = ref.read(audioSourcePresetsProvider);

    return getUrlOfQuality(
      preferences.presets[preferences.selectedStreamingContainerIndex],
      preferences.selectedStreamingQualityIndex,
    );
  }

  /// Returns the URL of the track based on the codec and quality preferences.
  /// If an exact match is not found, it will return the closest match based on
  /// the user's audio quality preference.
  ///
  /// If no sources match the codec, it will return the first or last source
  /// based on the user's audio quality preference.
  SpotubeAudioSourceStreamObject? getStreamOfQuality(
    SpotubeAudioSourceContainerPreset preset,
    int qualityIndex,
  ) {
    if (sources.isEmpty) return null;

    // Prioritize HAZE Studio Master / Lossless stream if available
    final hazeHighStream = sources.firstWhereOrNull(
      (s) => s.bitrate != null && s.bitrate! >= 320000,
    );
    if (hazeHighStream != null) {
      return hazeHighStream;
    }

    final quality = preset.qualities[qualityIndex];

    final exactMatch = sources.firstWhereOrNull(
      (source) {
        if (source.container != preset.name) return false;

        if (quality case SpotubeAudioLosslessContainerQuality()) {
          return source.sampleRate == quality.sampleRate &&
              source.bitDepth == quality.bitDepth;
        } else {
          return source.bitrate ==
              (quality as SpotubeAudioLossyContainerQuality).bitrate;
        }
      },
    );

    if (exactMatch != null) {
      return exactMatch;
    }

    // Find the preset with closest quality to the supplied quality
    final sameContainer = sources.where((source) {
      return source.container == preset.name;
    }).toList();

    if (sameContainer.isNotEmpty) {
      return sameContainer.reduce((prev, curr) {
        if (quality is SpotubeAudioLosslessContainerQuality) {
          final prevDiff = ((prev.sampleRate ?? 0) - quality.sampleRate).abs() +
              ((prev.bitDepth ?? 0) - quality.bitDepth).abs();
          final currDiff = ((curr.sampleRate ?? 0) - quality.sampleRate).abs() +
              ((curr.bitDepth ?? 0) - quality.bitDepth).abs();
          return currDiff < prevDiff ? curr : prev;
        } else {
          final prevDiff = ((prev.bitrate ?? 0) -
                  (quality as SpotubeAudioLossyContainerQuality).bitrate)
              .abs();
          final currDiff = ((curr.bitrate ?? 0) - quality.bitrate).abs();
          return currDiff < prevDiff ? curr : prev;
        }
      });
    }

    return sources.first;
  }

  String? getUrlOfQuality(
    SpotubeAudioSourceContainerPreset preset,
    int qualityIndex,
  ) {
    return getStreamOfQuality(preset, qualityIndex)?.url;
  }

  SpotubeAudioSourceContainerPreset? get qualityPreset {
    final presetState = ref.read(audioSourcePresetsProvider);
    return presetState.presets
        .elementAtOrNull(presetState.selectedStreamingContainerIndex);
  }
}
