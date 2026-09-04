import React, { useRef, useEffect } from 'react';

export default function AutoResizeTextarea({ value, onChange, style, ...props }) {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      style={{ overflow: 'hidden', resize: 'none', ...style }}
      {...props}
    />
  );
}
