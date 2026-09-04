'use client';

import React, { useState, useRef, useEffect, memo } from 'react';
import styles from '../upload.module.css';
import { EditIcon } from './UploadIcons';

export const EditableCell = memo(function EditableCell({ value, placeholder, onChange, onSave }) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleFinishEditing = () => {
    setIsEditing(false);
    if (onSave) onSave(value);
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={handleFinishEditing}
        onKeyDown={(e) => e.key === 'Enter' && handleFinishEditing()}
        placeholder={placeholder}
      />
    );
  }

  return (
    <div className={styles.readonlyCell}>
      <span className={!value ? styles.placeholderText : ''} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value || placeholder}
      </span>
      <button className={styles.editIconBtn} onClick={() => setIsEditing(true)} title="Edit" aria-label="Edit value">
        <EditIcon />
      </button>
    </div>
  );
});

export default EditableCell;
