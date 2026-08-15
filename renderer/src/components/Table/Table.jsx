import './Table.css';

/**
 * columns: [{ key, label, headerStyle?, cellStyle?, render?(row) }]
 * renderActions?(row) -> JSX untuk kolom Aksi (opsional)
 */
export default function Table({ columns, data, emptyText = 'Tidak ada data.', renderActions, keyField = 'id' }) {
  const colSpan = columns.length + (renderActions ? 1 : 0);

  return (
    <div className="table-responsive">
      <table className="table-modern">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key} style={col.headerStyle}>{col.label}</th>
            ))}
            {renderActions && <th style={{ textAlign: 'center', width: 90 }}>Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr><td colSpan={colSpan} style={{ textAlign: 'center' }}>{emptyText}</td></tr>
          ) : (
            data.map((row) => (
              <tr key={row[keyField]}>
                {columns.map((col) => (
                  <td key={col.key} style={col.cellStyle}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {renderActions && <td style={{ textAlign: 'center' }}>{renderActions(row)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
