function Results({ transcript, extracted, diagnosis }) {
  return (
    <section className="flex flex-col gap-4">
      {transcript && (
        <div className="border border-primary/20 rounded-2xl p-4 bg-primary/5">
          <h2 className="font-bold text-primary mb-2">Transcripción</h2>
          <p className="whitespace-pre-line text-textDark/80">{transcript}</p>
        </div>
      )}
      {extracted && (
        <div className="border border-primary/20 rounded-2xl p-4 bg-primary/5 overflow-x-auto">
          <h2 className="font-bold text-primary mb-2">Datos médicos extraídos</h2>
          <pre className="text-xs text-textDark/80">{JSON.stringify(extracted,null,2)}</pre>
        </div>
      )}
      {diagnosis && (
        <div className="border border-primary/20 rounded-2xl p-4 bg-primary/5">
          <h2 className="font-bold text-primary mb-2">Diagnóstico y plan</h2>
          <p className="mb-1"><strong>Diagnóstico:</strong> {diagnosis.diagnosis}</p>
          <p className="mb-1"><strong>Plan:</strong> {diagnosis.treatmentPlan}</p>
          <ul className="list-disc pl-5 text-textDark/80">
            {diagnosis.recommendations?.map((r,i)=><li key={i}>{r}</li>)}
          </ul>
        </div>
      )}
    </section>
  );
}

export default Results; 