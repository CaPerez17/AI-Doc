import { useState, useRef } from 'react';
import InputForm from './components/InputForm';
import Results from './components/Results';

function App() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [freeText, setFreeText] = useState('');
  const [transcript, setTranscript] = useState('');
  const [extracted, setExtracted] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const resultsRef = useRef(null);

  const handleProcess = async () => {
    setLoading(true);
    setError(null);
    try {
      // Aquí va la lógica de procesamiento
      const dJson = await processData(); // Implementa esta función según tus necesidades
      setDiagnosis(dJson);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior:'smooth' }), 100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">AI Doctor Assistant</h1>
        <div className="flex flex-col items-center gap-8">
          <InputForm
            audioUrl={audioUrl}
            setAudioUrl={setAudioUrl}
            freeText={freeText}
            setFreeText={setFreeText}
            onProcess={handleProcess}
            loading={loading}
          />
          <div ref={resultsRef}>
            {!loading && !error && (transcript || extracted || diagnosis) && (
              <Results
                transcript={transcript}
                extracted={extracted}
                diagnosis={diagnosis}
              />
            )}
          </div>
          {error && (
            <div className="text-red-600 text-center">{error}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App; 