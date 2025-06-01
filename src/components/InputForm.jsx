function InputForm({ audioUrl, setAudioUrl, freeText, setFreeText, onProcess, loading }) {
  return (
    <div className="w-full max-w-xl flex flex-col gap-3">
      <input
        className="border p-2 rounded focus:outline-none focus:ring"
        placeholder="Pega el link de audio (opcional)"
        value={audioUrl}
        onChange={e => setAudioUrl(e.target.value)}
        disabled={loading}
      />
      <textarea
        className="border p-2 rounded h-32 focus:outline-none focus:ring"
        placeholder="O escribe el texto aquí"
        value={freeText}
        onChange={e => setFreeText(e.target.value)}
        disabled={loading}
      />
      <button
        className={`p-2 rounded text-white ${loading ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
        onClick={onProcess}
        disabled={loading || (!audioUrl && !freeText)}
      >
        {loading ? 'Procesando…' : 'Procesar'}
      </button>
    </div>
  );
}

export default InputForm; 