import { useState, useEffect } from 'react';
import InputForm from './components/InputForm';
import Results from './components/Results';
import Loader from './components/Loader';
import ErrorBox from './components/ErrorBox';
import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

function App() {
  const [audioUrl, setAudioUrl] = useState('');
  const [freeText, setFreeText] = useState('');
  const [file, setFile] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [extracted, setExtracted] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // URL base para las funciones de Firebase
  const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:5001/gressusapp/us-central1';

  useEffect(() => {
    setTranscript('');
    setExtracted(null);
    setDiagnosis(null);
    setError('');
  }, [audioUrl, freeText, file]);

  const handleProcess = async () => {
    setLoading(true);
    setError('');
    setTranscript('');
    setExtracted(null);
    setDiagnosis(null);

    let currentAudioUrl = audioUrl;

    try {
      if (file) {
        const fileRef = ref(storage, `audio/${file.name}_${Date.now()}`);
        const snapshot = await uploadBytes(fileRef, file);
        currentAudioUrl = await getDownloadURL(snapshot.ref);
        setAudioUrl(currentAudioUrl);
      }

      if (!currentAudioUrl && !freeText) {
        setError('Por favor, proporciona un link de audio, sube un archivo o escribe un texto.');
        setLoading(false);
        return;
      }

      let transcriptText = freeText;
      if (currentAudioUrl) {
        console.log('📞 Llamando a transcribeAudio con URL:', currentAudioUrl);
        const transcriptResponse = await fetch(`${API_URL}/transcribeAudio`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: currentAudioUrl }),
        });
        if (!transcriptResponse.ok) throw new Error(`Error transcribiendo: ${transcriptResponse.statusText}`);
        const transcriptData = await transcriptResponse.json();
        setTranscript(transcriptData.transcript);
        transcriptText = transcriptData.transcript;
      }

      console.log('📞 Llamando a extractMedicalData');
      const extractResponse = await fetch(`${API_URL}/extractMedicalData`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: transcriptText }),
      });
      if (!extractResponse.ok) throw new Error(`Error extrayendo datos: ${extractResponse.statusText}`);
      const extractData = await extractResponse.json();
      setExtracted(extractData.extracted_info);

      console.log('📞 Llamando a generateDiagnosis');
      const diagnoseResponse = await fetch(`${API_URL}/generateDiagnosis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medical_info: extractData.extracted_info }),
      });
      if (!diagnoseResponse.ok) throw new Error(`Error en el diagnóstico: ${diagnoseResponse.statusText}`);
      const diagnoseData = await diagnoseResponse.json();
      setDiagnosis(diagnoseData);

    } catch (err) {
      console.error('❌ Error en handleProcess:', err);
      setError(err.message || 'Ocurrió un error procesando la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bgLight px-4">
      <main className="w-full max-w-xl bg-white rounded-3xl shadow-2xl p-8 flex flex-col gap-8">
        <header className="text-center">
          <h1 className="text-4xl font-extrabold text-primary">AI Doctor Assistant</h1>
          <p className="text-sm text-textDark/70 mt-2">
            Diagnósticos asistidos por IA a partir de audio o texto
          </p>
        </header>

        <InputForm
          audioUrl={audioUrl}
          setAudioUrl={setAudioUrl}
          freeText={freeText}
          setFreeText={setFreeText}
          file={file}
          setFile={setFile}
          onProcess={handleProcess}
          loading={loading}
        />

        {loading && <Loader />}
        {error && <ErrorBox message={error} />}

        {(transcript || extracted || diagnosis) && !loading && !error && (
          <Results
            transcript={transcript}
            extracted={extracted}
            diagnosis={diagnosis}
          />
        )}

        <footer className="text-xs text-center text-textDark/60">
          Desarrollado con <span className="text-red-500">❤️</span> por el equipo de AI Doctor
        </footer>
      </main>
    </div>
  );
}

export default App;
