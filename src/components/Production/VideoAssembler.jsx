// ═══════════════════════════════════════════════════
// VideoAssembler — Upload de assets + montagem de vídeo
// ═══════════════════════════════════════════════════

import { useState, useRef } from 'react';
import { assembleVideo } from '../../services/videoAssembler.js';
import './Production.css';

export default function VideoAssembler({ cenas, visuais, estrategia }) {
  const [audioFile, setAudioFile] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [imageFiles, setImageFiles] = useState({});      // { cenaNumero: File }
  const [imagePreviews, setImagePreviews] = useState({}); // { cenaNumero: objectURL }

  const [isLoading, setIsLoading] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logMsg, setLogMsg] = useState('');
  const [outputUrl, setOutputUrl] = useState(null);
  const [error, setError] = useState(null);

  const audioInputRef = useRef();

  const cenasOrdenadas = [...(cenas || [])].sort((a, b) => a.numero - b.numero);
  const totalImagens = cenasOrdenadas.length;
  const uploadedImagens = Object.keys(imageFiles).length;
  const pronto = audioFile && uploadedImagens === totalImagens;

  // ─── Handlers de upload ───

  const handleAudioChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(file);
    setAudioUrl(URL.createObjectURL(file));
    setOutputUrl(null);
  };

  const handleImageChange = (cenaNumero, e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imagePreviews[cenaNumero]) URL.revokeObjectURL(imagePreviews[cenaNumero]);
    setImageFiles(prev => ({ ...prev, [cenaNumero]: file }));
    setImagePreviews(prev => ({ ...prev, [cenaNumero]: URL.createObjectURL(file) }));
    setOutputUrl(null);
  };

  const limparAudio = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioFile(null);
    setAudioUrl(null);
    setOutputUrl(null);
    if (audioInputRef.current) audioInputRef.current.value = '';
  };

  const limparImagem = (cenaNumero) => {
    if (imagePreviews[cenaNumero]) URL.revokeObjectURL(imagePreviews[cenaNumero]);
    setImageFiles(prev => { const n = { ...prev }; delete n[cenaNumero]; return n; });
    setImagePreviews(prev => { const n = { ...prev }; delete n[cenaNumero]; return n; });
    setOutputUrl(null);
  };

  // ─── Montagem ───

  const handleMontar = async () => {
    if (!pronto) return;
    setError(null);
    setOutputUrl(null);
    setIsLoading(true);
    setProgress(0);
    setLogMsg('Carregando FFmpeg.wasm (primeira vez ~30MB)...');

    try {
      const url = await assembleVideo({
        audioFile,
        imageFiles,
        cenas: cenasOrdenadas,
        onProgress: (p) => {
          setProgress(p);
          if (p >= 55) {
            setIsLoading(false);
            setIsRendering(true);
            setLogMsg('Montando vídeo...');
          }
        },
        onLog: (msg) => setLogMsg(msg),
      });
      setOutputUrl(url);
    } catch (err) {
      console.error('Erro na montagem:', err);
      setError(err.message || 'Erro desconhecido durante a montagem.');
    } finally {
      setIsLoading(false);
      setIsRendering(false);
    }
  };

  const handleDownload = () => {
    if (!outputUrl) return;
    const tema = estrategia?.tema?.replace(/\s+/g, '-').toLowerCase() || 'video';
    const a = document.createElement('a');
    a.href = outputUrl;
    a.download = `atlas-${tema}.mp4`;
    a.click();
  };

  const progressoLabel = () => {
    if (isLoading) return logMsg || 'Carregando FFmpeg...';
    if (isRendering) return logMsg || 'Renderizando...';
    return '';
  };

  return (
    <div className="video-assembler">
      <h3 className="assembler-title">🎬 Montar Vídeo</h3>
      <p className="assembler-subtitle">
        Suba o áudio gerado no ElevenLabs e as imagens geradas no ChatGPT/Gemini. O sistema monta o vídeo automaticamente.
      </p>

      {/* Status geral */}
      <div className="assembler-status">
        <span className={`assembler-status-item ${audioFile ? 'ok' : ''}`}>
          {audioFile ? '✓' : '○'} Áudio
        </span>
        <span className="assembler-status-sep">·</span>
        <span className={`assembler-status-item ${uploadedImagens === totalImagens && totalImagens > 0 ? 'ok' : ''}`}>
          {uploadedImagens === totalImagens && totalImagens > 0 ? '✓' : `${uploadedImagens}/${totalImagens}`} Imagens
        </span>
      </div>

      {/* Upload de áudio */}
      <div className="assembler-section">
        <h4 className="assembler-section-label">🎤 Áudio (MP3 do ElevenLabs)</h4>
        {!audioFile ? (
          <label className="upload-drop-zone">
            <input
              ref={audioInputRef}
              type="file"
              accept=".mp3,.wav,.m4a"
              onChange={handleAudioChange}
              style={{ display: 'none' }}
            />
            <span className="upload-drop-icon">🎵</span>
            <span className="upload-drop-text">Clique para selecionar o MP3</span>
            <span className="upload-drop-hint">.mp3 · .wav · .m4a</span>
          </label>
        ) : (
          <div className="audio-preview">
            <audio controls src={audioUrl} className="audio-player" />
            <div className="audio-preview-info">
              <span className="audio-preview-name">{audioFile.name}</span>
              <button className="upload-clear-btn" onClick={limparAudio} title="Remover áudio">✕</button>
            </div>
          </div>
        )}
      </div>

      {/* Upload de imagens por cena */}
      <div className="assembler-section">
        <h4 className="assembler-section-label">🖼️ Imagens por Cena</h4>
        <p className="assembler-hint">Uma imagem por cena, na ordem do roteiro. Formato 9:16 recomendado.</p>
        <div className="assembler-cenas-grid">
          {cenasOrdenadas.map((cena) => {
            const img = imageFiles[cena.numero];
            const preview = imagePreviews[cena.numero];
            const visual = visuais?.find(v => v.numero === cena.numero);

            return (
              <div key={cena.numero} className={`assembler-cena-card ${img ? 'has-image' : ''}`}>
                <div className="assembler-cena-header">
                  <span className="assembler-cena-num">
                    {String(cena.numero).padStart(2, '0')}
                  </span>
                  <span className="assembler-cena-nome">{cena.nome || `Cena ${cena.numero}`}</span>
                  <span className="assembler-cena-dur">{cena.duracao || '?'}s</span>
                  {img && (
                    <button
                      className="upload-clear-btn small"
                      onClick={() => limparImagem(cena.numero)}
                      title="Remover imagem"
                    >✕</button>
                  )}
                </div>

                {preview ? (
                  <img
                    src={preview}
                    alt={`Cena ${cena.numero}`}
                    className="assembler-cena-preview"
                  />
                ) : (
                  <label className="assembler-cena-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageChange(cena.numero, e)}
                      style={{ display: 'none' }}
                    />
                    {visual?.opcaoA ? (
                      <span className="assembler-cena-prompt-hint" title={visual.opcaoA}>
                        📋 {visual.opcaoA.slice(0, 60)}…
                      </span>
                    ) : null}
                    <span className="assembler-cena-upload-btn">+ Selecionar imagem</span>
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="assembler-error">
          ❌ {error}
        </div>
      )}

      {/* Progresso */}
      {(isLoading || isRendering) && (
        <div className="assembler-progress">
          <div className="assembler-progress-bar">
            <div
              className="assembler-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="assembler-progress-label">{progressoLabel()}</span>
        </div>
      )}

      {/* Ações */}
      <div className="assembler-actions">
        {outputUrl ? (
          <button className="assembler-btn-download" onClick={handleDownload}>
            ⬇️ Baixar vídeo (.mp4)
          </button>
        ) : (
          <button
            className="assembler-btn-montar"
            onClick={handleMontar}
            disabled={!pronto || isLoading || isRendering}
          >
            {isLoading || isRendering ? '⏳ Montando...' : '🎬 Montar Vídeo'}
          </button>
        )}
      </div>

      {outputUrl && (
        <div className="assembler-success">
          ✓ Vídeo gerado! Pronto para postar no TikTok / Reels / Shorts.
        </div>
      )}
    </div>
  );
}
