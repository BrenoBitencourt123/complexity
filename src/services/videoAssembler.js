// ═══════════════════════════════════════════════════
// videoAssembler — Montagem de vídeo via FFmpeg.wasm
// Roda 100% no browser, zero custo de servidor
// ═══════════════════════════════════════════════════

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

// Arquivos copiados para /public — servidos pelo mesmo origin, sem CORS/COEP issues
const BASE_URL = window.location.origin;

let ffmpegInstance = null;

/**
 * Carrega o FFmpeg.wasm (lazy — só na primeira chamada, ~30MB)
 * @param {function} onLog - callback para mensagens de progresso
 */
export async function loadFFmpeg(onLog) {
  if (ffmpegInstance) return ffmpegInstance;

  const ffmpeg = new FFmpeg();

  if (onLog) {
    ffmpeg.on('log', ({ message }) => onLog(message));
  }

  await ffmpeg.load({
    coreURL: `${BASE_URL}/ffmpeg-core.js`,
    wasmURL: `${BASE_URL}/ffmpeg-core.wasm`,
  });

  ffmpegInstance = ffmpeg;
  return ffmpeg;
}

/**
 * Detecta a duração de um arquivo de áudio via Web Audio API
 * @param {File} audioFile
 * @returns {Promise<number>} duração em segundos
 */
export async function getAudioDuration(audioFile) {
  const arrayBuffer = await audioFile.arrayBuffer();
  const audioCtx = new AudioContext();
  const buffer = await audioCtx.decodeAudioData(arrayBuffer);
  audioCtx.close();
  return buffer.duration;
}

/**
 * Monta o vídeo final combinando imagens + áudio
 * @param {object} params
 * @param {File} params.audioFile - MP3/WAV gerado no ElevenLabs
 * @param {Object.<number, File>} params.imageFiles - mapa { cenaNumero: File }
 * @param {Array} params.cenas - array de { numero, nome, duracao } do parser
 * @param {function} params.onProgress - callback(0-100)
 * @param {function} params.onLog - callback(string)
 * @returns {Promise<string>} blob URL do .mp4 final
 */
export async function assembleVideo({ audioFile, imageFiles, cenas, onProgress, onLog }) {
  const ffmpeg = await loadFFmpeg(onLog);

  onProgress?.(5);

  // Detecta duração real do áudio para escalar as cenas proporcionalmente
  const audioDuracao = await getAudioDuration(audioFile);
  const totalEstimado = cenas.reduce((sum, c) => sum + (c.duracao || 5), 0);
  const escala = audioDuracao / (totalEstimado || audioDuracao);

  onProgress?.(10);

  // Escreve o áudio no FS virtual do FFmpeg
  await ffmpeg.writeFile('audio.mp3', await fetchFile(audioFile));

  onProgress?.(20);

  // Escreve cada imagem no FS virtual
  const cenasOrdenadas = [...cenas].sort((a, b) => a.numero - b.numero);
  for (let i = 0; i < cenasOrdenadas.length; i++) {
    const cena = cenasOrdenadas[i];
    const img = imageFiles[cena.numero];
    if (!img) throw new Error(`Imagem da cena ${cena.numero} não encontrada`);
    await ffmpeg.writeFile(`img${i}.png`, await fetchFile(img));
    onProgress?.(20 + Math.round((i / cenasOrdenadas.length) * 30));
  }

  // Cria o arquivo de concatenação com durations proporcionais
  const linhas = cenasOrdenadas.map((cena, i) => {
    const dur = Math.max(1, Math.round(cena.duracao * escala));
    return `file 'img${i}.png'\nduration ${dur}`;
  });
  // Última imagem sem duration evita corte abrupto
  linhas.push(`file 'img${cenasOrdenadas.length - 1}.png'`);
  const concatTxt = linhas.join('\n');
  await ffmpeg.writeFile('concat.txt', concatTxt);

  onProgress?.(55);

  // Executa a montagem
  await ffmpeg.exec([
    '-f', 'concat',
    '-safe', '0',
    '-i', 'concat.txt',
    '-i', 'audio.mp3',
    '-vf', 'scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,setsar=1',
    '-c:v', 'libx264',
    '-c:a', 'aac',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-shortest',
    'output.mp4',
  ]);

  onProgress?.(90);

  // Lê o arquivo de saída e cria URL para download
  const data = await ffmpeg.readFile('output.mp4');
  const blob = new Blob([data.buffer], { type: 'video/mp4' });
  const url = URL.createObjectURL(blob);

  // Limpa o FS virtual para a próxima execução
  await ffmpeg.deleteFile('audio.mp3');
  await ffmpeg.deleteFile('concat.txt');
  await ffmpeg.deleteFile('output.mp4');
  for (let i = 0; i < cenasOrdenadas.length; i++) {
    await ffmpeg.deleteFile(`img${i}.png`);
  }

  onProgress?.(100);
  return url;
}
