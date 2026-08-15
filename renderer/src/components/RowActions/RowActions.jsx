import IconButton from '../IconButton/IconButton';
import './RowActions.css';

export default function RowActions({ onEdit, onDelete }) {
  return (
    <div className="row-actions">
      {onEdit && <IconButton icon="fas fa-edit" variant="primary" onClick={onEdit} title="Edit" />}
      {onDelete && <IconButton icon="fas fa-trash" variant="danger" onClick={onDelete} title="Hapus" />}
    </div>
  );
}
