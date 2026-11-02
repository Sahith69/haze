import 'package:dio/dio.dart';
import 'package:spotube/models/metadata/metadata.dart';
import 'package:spotube/services/dio/dio.dart';
import 'package:spotube/services/logger/logger.dart';
import 'des.dart';

class HazeResolvedResult {
  final SpotubeAudioSourceStreamObject stream;
  final SpotubeAudioSourceMatchObject match;
  final bool isFlac;

  HazeResolvedResult({
    required this.stream,
    required this.match,
    this.isFlac = false,
  });
}

class HazeResolver {
  static const String _jioSaavnKey = '38346591';

  static String _cleanString(String s) {
    return s
        .toLowerCase()
        .replaceAll(RegExp(r'\(feat\.[^\)]*\)', caseSensitive: false), '')
        .replaceAll(RegExp(r'\(with[^\)]*\)', caseSensitive: false), '')
        .replaceAll(RegExp(r'\[official[^\]]*\]', caseSensitive: false), '')
        .replaceAll(RegExp(r'\(official[^\)]*\)', caseSensitive: false), '')
        .replaceAll(RegExp(r'[^\w\s]'), ' ')
        .replaceAll(RegExp(r'\s+'), ' ')
        .trim();
  }

  static int _calculateMatchScore({
    required String trackTitle,
    required String trackArtist,
    required int expectedDurationSec,
    required String candidateTitle,
    required String candidateArtist,
    required int candidateDurationSec,
  }) {
    int score = 0;
    final cleanT = _cleanString(trackTitle);
    final cleanA = _cleanString(trackArtist);
    final cleanCandT = _cleanString(candidateTitle);
    final cleanCandA = _cleanString(candidateArtist);

    // Exact title match
    if (cleanCandT == cleanT) {
      score += 45;
    } else if (cleanCandT.contains(cleanT) || cleanT.contains(cleanCandT)) {
      score += 30;
    }

    // Artist match
    if (cleanCandA.contains(cleanA) || cleanA.contains(cleanCandA)) {
      score += 35;
    }

    // Duration match (within +/- 5 seconds)
    if (expectedDurationSec > 0 && candidateDurationSec > 0) {
      final diff = (expectedDurationSec - candidateDurationSec).abs();
      if (diff <= 3) {
        score += 20;
      } else if (diff <= 6) {
        score += 10;
      }
    }

    return score;
  }

  /// Attempts to resolve a 320kbps Studio Master stream from JioSaavn CDN
  static Future<HazeResolvedResult?> resolveJioSaavn(
    SpotubeFullTrackObject track,
  ) async {
    try {
      final artistName =
          track.artists.isNotEmpty ? track.artists.first.name : '';
      final query = "${track.name} $artistName".trim();
      final expectedDurationSec = (track.durationMs / 1000).round();

      final url =
          "https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&api_version=4&ctx=web6dot0&n=8&p=1&q=${Uri.encodeComponent(query)}";

      final res = await globalDio.get(
        url,
        options: Options(
          headers: {
            'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
          },
          sendTimeout: const Duration(milliseconds: 3500),
          receiveTimeout: const Duration(milliseconds: 3500),
        ),
      );

      if (res.data == null || res.data is! Map) return null;
      final results = res.data["results"] as List?;
      if (results == null || results.isEmpty) return null;

      Map<String, dynamic>? bestCandidate;
      int bestScore = -1;

      for (final item in results) {
        if (item is! Map) continue;
        final moreInfo = item["more_info"];
        if (moreInfo == null || moreInfo["encrypted_media_url"] == null) {
          continue;
        }

        final candTitle = item["title"]?.toString() ?? "";
        final candArtist = item["subtitle"]?.toString() ??
            moreInfo["music"]?.toString() ??
            "";
        final candDurationSec =
            int.tryParse(moreInfo["duration"]?.toString() ?? "0") ?? 0;

        final score = _calculateMatchScore(
          trackTitle: track.name,
          trackArtist: artistName,
          expectedDurationSec: expectedDurationSec,
          candidateTitle: candTitle,
          candidateArtist: candArtist,
          candidateDurationSec: candDurationSec,
        );

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = Map<String, dynamic>.from(item);
        }
      }

      if (bestCandidate == null || bestScore < 35) {
        AppLogger.log.d(
          "HAZE: No high-confidence JioSaavn match for '${track.name}' (Best Score: $bestScore)",
        );
        return null;
      }

      final encUrl =
          bestCandidate["more_info"]?["encrypted_media_url"]?.toString();
      if (encUrl == null || encUrl.isEmpty) return null;

      final decrypted = DesEcb.decryptBase64(encUrl, _jioSaavnKey);
      if (!decrypted.startsWith("http")) return null;

      // Swap to direct 320kbps Studio Master audio
      final stream320 = decrypted.replaceAll(RegExp(r'_[0-9]+\.mp4$'), '_320.mp4');

      final candId = bestCandidate["id"]?.toString() ?? track.id;
      final candTitle = bestCandidate["title"]?.toString() ?? track.name;
      final candArtist = bestCandidate["subtitle"]?.toString() ?? artistName;
      final candDuration = Duration(
        seconds: int.tryParse(
              bestCandidate["more_info"]?["duration"]?.toString() ?? "0",
            ) ??
            expectedDurationSec,
      );

      final matchObj = SpotubeAudioSourceMatchObject(
        id: "haze_saavn_$candId",
        title: candTitle,
        artists: [candArtist],
        duration: candDuration,
        thumbnail: bestCandidate["image"]?.toString(),
        externalUri: stream320,
      );

      final streamObj = SpotubeAudioSourceStreamObject(
        url: stream320,
        container: "mp4",
        type: SpotubeMediaCompressionType.lossy,
        codec: "aac",
        bitrate: 320000,
        sampleRate: 44100,
      );

      AppLogger.log.i(
        "HAZE: Matched direct 320kbps Studio Master for '${track.name}' ($stream320)",
      );

      return HazeResolvedResult(
        stream: streamObj,
        match: matchObj,
        isFlac: false,
      );
    } catch (e, stack) {
      AppLogger.log.w("HAZE JioSaavn resolver error: $e", error: e, stackTrace: stack);
      return null;
    }
  }

  /// Master resolver: checks JioSaavn 320k Studio Master CDN
  static Future<HazeResolvedResult?> resolve(
    SpotubeFullTrackObject track,
  ) async {
    return await resolveJioSaavn(track);
  }
}
