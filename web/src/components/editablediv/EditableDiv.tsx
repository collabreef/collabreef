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
      onChange?.("");
      return;
    }

    onChange(text);
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
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={className}
      {...props}
    />
  );
};

export default EditableDiv;
