type Props = {
  missingDocuments: string[];
  appealDocket: string;
  onGenerate: () => void;
};

export function AppealDocketSidebar({ missingDocuments, appealDocket, onGenerate }: Props) {
  return (
    <aside className="card docket">
      <h2>Appeal Docket/Form</h2>

      <h3>Missing Evidence Checklist</h3>
      {missingDocuments.length === 0 ? (
        <p className="success">All required evidence is included.</p>
      ) : (
        <ul>
          {missingDocuments.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      )}

      <button type="button" onClick={onGenerate}>
        Forward Evidence to Appeal Form
      </button>

      {appealDocket ? (
        <pre>{appealDocket}</pre>
      ) : (
        <p className="muted">
          Complete the forms, then click the button to generate the appeal docket.
        </p>
      )}
    </aside>
  );
}
