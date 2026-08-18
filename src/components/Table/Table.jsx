import './Table.css';

export default function Table({ 
  columns, 
  data, 
  emptyText = 'Tidak ada data.', 
  renderActions, 
  keyField = 'id',
  customHeader 
}) {
  const colSpan = columns ? columns.length + (renderActions ? 1 : 0) : 1;

  return (
    <div className="table-responsive">
      <table className="table-modern">
        <thead>
          {customHeader ? customHeader : (
            <tr>
              {columns?.map((col) => (
                <th key={col.key} style={col.headerStyle}>{col.label}</th>
              ))}
              {renderActions && <th style={{ textAlign: 'center', width: 90 }}>Aksi</th>}
            </tr>
          )}
        </thead>
        <tbody>
          {!data || data.length === 0 ? (
            <tr>
              <td colSpan={colSpan} style={{ textAlign: 'center', padding: '20px' }}>
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => (
              <tr key={row[keyField] || idx}>
                {columns?.map((col) => (
                  <td key={col.key} style={col.cellStyle}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
                {renderActions && (
                  <td style={{ textAlign: 'center' }}>{renderActions(row)}</td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}