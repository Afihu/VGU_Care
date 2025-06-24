import React from 'react';
import '../css/AdminDataTable.css';

/**
 * AdminDataTable - Reusable data table component for admin interface
 * Consistent with existing frontend architecture
 */
const AdminDataTable = ({ 
  data = [], 
  columns = [], 
  title = '', 
  onRowClick = null,
  onEditClick = null,
  onDeleteClick = null,
  loading = false,
  emptyMessage = 'No data available'
}) => {
  
  if (loading) {
    return (
      <div className="admin-table-container">
        <div className="table-header">
          <h3>{title}</h3>
        </div>
        <div className="loading-container">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="admin-table-container">
        <div className="table-header">
          <h3>{title}</h3>
        </div>
        <div className="empty-container">
          <p>{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-table-container">
      <div className="table-header">
        <h3>{title}</h3>
        <div className="table-count">
          Total: {data.length}
        </div>
      </div>
      
      <div className="table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              {columns.map((column, index) => (
                <th key={index} className={column.className || ''}>
                  {column.header}
                </th>
              ))}
              {(onEditClick || onDeleteClick) && (
                <th className="actions-column">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr 
                key={row.id || rowIndex} 
                className={onRowClick ? 'clickable-row' : ''}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((column, colIndex) => (
                  <td key={colIndex} className={column.className || ''}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
                {(onEditClick || onDeleteClick) && (
                  <td className="actions-column">
                    <div className="action-buttons">
                      {onEditClick && (
                        <button 
                          className="edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditClick(row);
                          }}
                          title="Edit"
                        >
                          ✏️
                        </button>
                      )}
                      {onDeleteClick && (
                        <button 
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteClick(row);
                          }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDataTable;
