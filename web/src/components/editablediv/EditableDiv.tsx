import { FC, useRef, useEffect } from "react";

interface EditableDivProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  className?: string;
  editable?: boolean;
}

const EditableDiv: FC<EditableDivProps> = ({
  value = "",
  placeholder = "",
  onChange = () => {},
  className = "",
  editable = true,
  ...props
}) => {
  const divRef = useRef<HTMLDivElement>(null);
  const isUserEditing = useRef(false);
  const isComposing = useRef(false);
  const pendingValue = useRef<string | null>(null);

  useEffect(() => {
    // Update the content when value changes, but only if user is not currently editing
    if (divRef.current && !isUserEditing.current && divRef.current.innerText !== value) {
      divRef.current.innerText = value;
    }
  }, [value]);

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    isUserEditing.current = true;
    const text = e.currentTarget.innerText;

    if (text === "<br>" || text === "<br/>" || text.trim() === "") {
      e.currentTarget.innerText = "";
      if (!isComposing.current) {
        onChange?.("");
      } else {
        pendingValue.current = "";
      }
      return;
    }

    // Only trigger onChange when not composing (for IME input)
    if (!isComposing.current) {
      onChange(text);
    } else {
      // Store the pending value to send after composition ends
      pendingValue.current = text;
    }
  };

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLDivElement>) => {
    isComposing.current = false;
    // Send the final composed value
    const text = e.currentTarget.innerText;
    if (text === "<br>" || text === "<br/>" || text.trim() === "") {
      onChange?.("");
    } else {
      onChange(text);
    }
    pendingValue.current = null;
  };

  const handleFocus = () => {
    isUserEditing.current = true;
  };

  const handleBlur = () => {
    // Reset editing flag after a short delay to allow onChange to complete
    setTimeout(() => {
      isUserEditing.current = false;
    }, 100);
  };

  return (
    <div
      ref={divRef}
      contentEditable={editable}
      onInput={handleInput}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={className}
      {...props}
    />
  );
};

export default EditableDiv;
