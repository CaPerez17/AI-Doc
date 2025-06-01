function Results({ transcript, extracted, diagnosis }) {
  return (
    <div className="w-full max-w-xl space-y-4">
      {transcript && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Transcripción</h2>
          <p className="text-gray-700">{transcript}</p>
        </div>
      )}
      {extracted && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Información Extraída</h2>
          <p className="text-gray-700">{extracted}</p>
        </div>
      )}
      {diagnosis && (
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="font-semibold mb-2">Diagnóstico</h2>
          <p className="text-gray-700">{diagnosis}</p>
        </div>
      )}
    </div>
  );
}

export default Results; 