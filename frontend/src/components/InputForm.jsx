function InputForm({ audioUrl, setAudioUrl, freeText, setFreeText, file, setFile, onProcess, loading }) {
  return (
    <form className="flex flex-col gap-6">
      {/* Link de audio */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-textDark">Link de audio</label>
        <input
          type="url"
          placeholder="https://…"
          className="border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/40"
          value={audioUrl}
          onChange={e => setAudioUrl(e.target.value)}
          disabled={loading}
        />
      </div>

      <div className="text-center text-sm text-textDark/50">— o —</div>

      {/* Archivo de audio */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-textDark">Subir archivo de audio</label>
        <input
          type="file"
          accept="audio/*"
          onChange={e => setFile(e.target.files[0])}
          disabled={loading}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0
                     file:bg-accent file:text-white hover:file:bg-accentHover
                     text-textDark/80"
        />
      </div>

      {/* Texto libre */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-textDark">Texto libre</label>
        <textarea
          rows="4"
          placeholder="Escribe el texto aquí…"
          className="border rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-primary/40"
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          disabled={loading}
        />
      </div>

      {/* Botón */}
      <button
        type="button"
        onClick={onProcess}
        disabled={loading || (!audioUrl && !freeText && !file)}
        className={`w-full py-3 rounded-xl text-lg font-semibold transition-colors
          ${loading || (!audioUrl && !freeText && !file)
            ? 'bg-primary/30 cursor-not-allowed text-white'
            : 'bg-primary hover:bg-primaryHover text-white'}`}
      >
        {loading ? 'Procesando…' : 'Procesar'}
      </button>
    </form>
  );
}

export default InputForm; 