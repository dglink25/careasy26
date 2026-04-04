const AI_BASE = import.meta.env.VITE_AI_URL || 'https://careasyaiservice.onrender.com';

export const aiApi = {

  // Vérification statut serveur - CORRIGÉ
  checkStatus: async () => {
    try {
      // Utiliser la bonne route /api/v1/status au lieu de /health
      const r = await fetch(`${AI_BASE}/status`, { 
        method: 'GET',
        signal: AbortSignal.timeout(300)
      });
      
      if (r.ok) {
        const data = await r.json();
        // Vérifier que Ollama est aussi opérationnel
        return data.ollama?.ok === true;
      }
      return false;
    } 
    catch (error) {
      console.error('Erreur vérification statut AI:', error);
      return false;
    }
  },

  // Transcription audio uniquement
  transcribe: async (audioBlob) => {
    const fd = new FormData();
    fd.append('file', new File([audioBlob], 'audio.webm', { type:'audio/webm' }));
    const r = await fetch(`${AI_BASE}/audio/transcribe`, { method:'POST', body:fd });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return r.json();
  },

  // Upload vidéo
  uploadVideo: async (videoFile, message = '', history = []) => {
    const fd = new FormData();
    fd.append('file', videoFile);
    fd.append('message', message);
    fd.append('history', JSON.stringify(history));
    fd.append('media_type', 'video');
    
    const response = await fetch(`${AI_BASE}/chat`, {
      method: 'POST',
      body: fd,
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  },

  // Méthode chat améliorée avec meilleure gestion des médias
  chat: async ({ 
    message, 
    history = [], 
    lat = 0, 
    lng = 0, 
    imageFile = null,
    audioFile = null,
    videoFile = null,
    returnAudio = false,
    mediaType = null
  }) => {
    let response;

    if (imageFile || audioFile || videoFile) {
      const fd = new FormData();
      if (message) fd.append('message', message);
      if (lat) fd.append('lat', String(lat));
      if (lng) fd.append('lng', String(lng));
      if (returnAudio) fd.append('return_audio', 'true');
      if (history.length) fd.append('history', JSON.stringify(history));
      
      if (imageFile) {
        fd.append('file', imageFile);
        fd.append('media_type', 'image');
      }
      if (audioFile) {
        const audioF = new File([audioFile], `audio_${Date.now()}.webm`, { type: 'audio/webm' });
        fd.append('file', audioF);
        fd.append('media_type', 'audio');
      }
      if (videoFile) {
        fd.append('file', videoFile);
        fd.append('media_type', 'video');
      }
      
      response = await fetch(`${AI_BASE}/chat`, { 
        method: 'POST', 
        body: fd
      });
    } else {
      response = await fetch(`${AI_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          history,
          lat: lat || 0,
          lng: lng || 0,
          return_audio: returnAudio,
        }),
      });
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();

    return {
      answer: data.answer_fr || data.answer || '',
      urgency: data.urgency || 'unknown',
      services_proches: data.services_proches || [],
      intent: data.intent || '',
      audio_url: data.audio_url || null,
      video_url: data.video_url || null,
      image_url: data.image_url || null,
      file_url: data.file_url || null,
      file_name: data.file_name || null,
      file_size: data.file_size || null,
      lang: data.lang || 'fr',
      media_analysis: data.media_analysis || null,
    };
  },
};