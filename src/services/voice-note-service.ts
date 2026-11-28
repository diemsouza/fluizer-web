import { ulid } from "ulid";
import { uploadFile } from "../vendors/storage.vendor";
import { transcribeAudio } from "../vendors/whisper.vendor";
import { createMedia } from "../repo/media.repo";
import { findLastActiveActivityByUser } from "../repo/activities.repo";
import { findPendingQuestion } from "../repo/questions.repo";
import { readAudioDuration } from "./feedback-audio-service";
import { handleIncomingMessage } from "./message-service";
import { resolveChannel } from "../lib/channels/resolve-channel";
import {
  ANSWER_AUDIO_FOLDER,
  MEDIA_PARENT_TYPE,
  MEDIA_SOURCE,
  MEDIA_TYPE,
} from "../lib/constants";
import { buildMediaPath } from "../lib/utils";
import {
  audioExtensionForMime,
  baseMimeType,
  isVoiceNoteTooShort,
} from "../core/voice-note";
import {
  getExpectedAnswerLanguage,
  needsForcedVoicePass,
  resolveVoiceLanguage,
  type AnswerLanguage,
  type DetectedLanguage,
  type VoicePass,
} from "../core/answer-language";
import type { IncomingMessage } from "../types/domain";

export type StoredVoiceNote = {
  mediaId: string;
  mediaPath: string;
  contentType: string;
  buffer: Buffer;
};

type LanguageCheck = {
  autoLanguage: DetectedLanguage | null;
  autoLogprob: number | null;
  forcedLogprob: number | null;
};

type TranscribedVoiceNote = {
  text: string;
  duration: number | null;
  language: DetectedLanguage | null;
  isLanguageMismatch: boolean;
  languageCheck: LanguageCheck | null;
};

export async function storeVoiceNote(
  buffer: Buffer,
  mimeType: string,
): Promise<StoredVoiceNote> {
  const contentType = baseMimeType(mimeType);
  const mediaId = ulid();
  const mediaPath = buildMediaPath(
    ANSWER_AUDIO_FOLDER,
    mediaId,
    audioExtensionForMime(contentType),
  );
  await uploadFile({
    filePath: mediaPath,
    file: new Blob([new Uint8Array(buffer)], { type: contentType }),
  });
  return { mediaId, mediaPath, contentType, buffer };
}

// A segunda passada so roda quando o idioma detectado diverge do esperado.
// Falha nela vale como duvida: segue com a primeira, sem bloquear.
async function transcribeForcedPass(
  voiceNote: StoredVoiceNote,
  language: AnswerLanguage,
): Promise<VoicePass | null> {
  try {
    return await transcribeAudio(voiceNote.buffer, voiceNote.contentType, {
      language,
    });
  } catch (err) {
    console.error("[transcribeForcedPass] failed:", voiceNote.mediaId, err);
    return null;
  }
}

function untranscribedVoiceNote(duration: number | null): TranscribedVoiceNote {
  return {
    text: "",
    duration,
    language: null,
    isLanguageMismatch: false,
    languageCheck: null,
  };
}

// Falha do Whisper e audio curto demais seguem com transcricao vazia: o fluxo
// responde pedindo para gravar de novo em vez de deixar o usuario sem retorno.
async function transcribeVoiceNote(
  voiceNote: StoredVoiceNote,
  expectedLanguage: AnswerLanguage | null,
): Promise<TranscribedVoiceNote> {
  const fileDuration = await readAudioDuration(
    voiceNote.buffer,
    voiceNote.contentType,
  );
  if (isVoiceNoteTooShort(fileDuration)) {
    return untranscribedVoiceNote(fileDuration);
  }
  try {
    const auto = await transcribeAudio(voiceNote.buffer, voiceNote.contentType);
    const duration = auto.duration ?? fileDuration;
    if (!expectedLanguage || !needsForcedVoicePass(auto.language, expectedLanguage)) {
      return {
        text: auto.text.trim(),
        duration,
        language: auto.language,
        isLanguageMismatch: false,
        languageCheck: null,
      };
    }
    const forced = await transcribeForcedPass(voiceNote, expectedLanguage);
    const resolved = resolveVoiceLanguage(auto, forced, expectedLanguage);
    return {
      text: resolved.text.trim(),
      duration,
      language: resolved.language,
      isLanguageMismatch: resolved.isMismatch,
      languageCheck: {
        autoLanguage: auto.language,
        autoLogprob: auto.avgLogprob,
        forcedLogprob: forced?.avgLogprob ?? null,
      },
    };
  } catch (err) {
    console.error("[transcribeVoiceNote] failed:", voiceNote.mediaId, err);
    return untranscribedVoiceNote(fileDuration);
  }
}

// Plano vencido nao gasta Whisper: o fluxo responde o aviso de plano de qualquer
// jeito, entao a transcricao nao teria uso.
async function resolveVoiceTranscription(
  voiceNote: StoredVoiceNote,
  userId: string,
  canTranscribe: boolean,
): Promise<TranscribedVoiceNote> {
  if (!canTranscribe) return untranscribedVoiceNote(null);
  const expectedLanguage = await findExpectedAnswerLanguage(userId);
  return transcribeVoiceNote(voiceNote, expectedLanguage);
}

async function findExpectedAnswerLanguage(
  userId: string,
): Promise<AnswerLanguage | null> {
  const activity = await findLastActiveActivityByUser(userId);
  if (!activity) return null;
  const pendingQuestion = await findPendingQuestion(activity.id);
  return getExpectedAnswerLanguage(pendingQuestion?.questionFormat ?? null);
}

function buildVoiceMediaMetadata(
  transcribed: TranscribedVoiceNote,
): Record<string, unknown> | undefined {
  const metadata = {
    ...(transcribed.duration !== null ? { duration: transcribed.duration } : {}),
    ...(transcribed.language ? { language: transcribed.language } : {}),
    ...(transcribed.languageCheck
      ? { languageCheck: transcribed.languageCheck }
      : {}),
  };
  return Object.keys(metadata).length > 0 ? metadata : undefined;
}

export async function processVoiceNote(
  voiceNote: StoredVoiceNote,
  userId: string,
  input: IncomingMessage,
  options: { canTranscribe: boolean },
): Promise<void> {
  const transcribed = await resolveVoiceTranscription(
    voiceNote,
    userId,
    options.canTranscribe,
  );
  const messageId = ulid();
  await createMedia({
    id: voiceNote.mediaId,
    userId,
    source: MEDIA_SOURCE.USER,
    parentId: messageId,
    parentType: MEDIA_PARENT_TYPE.MESSAGE,
    mediaType: MEDIA_TYPE.AUDIO,
    contentType: voiceNote.contentType,
    mediaPath: voiceNote.mediaPath,
    mediaSize: voiceNote.buffer.length,
    mediaTranscription: transcribed.text,
    metadata: buildVoiceMediaMetadata(transcribed),
  });
  await handleIncomingMessage(
    {
      ...input,
      text: transcribed.text,
      isVoiceNote: true,
      isVoiceLanguageMismatch: transcribed.isLanguageMismatch,
      messageId,
      mediaType: MEDIA_TYPE.AUDIO,
      mediaId: voiceNote.mediaId,
    },
    resolveChannel(),
  );
}
