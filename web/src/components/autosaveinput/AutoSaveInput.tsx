import { FC, useEffect, useState } from "react";
import useDebounce from "../../hooks/useDebounce";
import { CheckCircle2, Loader } from "lucide-react";

interface Props {
    value: string
    placeholder: string
    onSave: (text: string) => void
}

const AutoSaveInput: FC<Props> = ({ value: initialValue, placeholder, onSave }) => {
    const [value, setValue] = useState(initialValue);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const save = async (text: string) => {
        setSaving(true);
        setSaved(false);
        try {
            await onSave(text);
            setSaved(true);
        } finally {
            setSaving(false);
        }
    };

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const debouncedSave = useDebounce(save, 500);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setValue(newValue);
        debouncedSave(newValue);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        const pastedText = e.clipboardData.getData("text");
        const newValue =
            value.slice(0, e.currentTarget.selectionStart ?? 0) +
            pastedText +
            value.slice(e.currentTarget.selectionEnd ?? 0);

        setValue(newValue);
        save(newValue);
        e.preventDefault();
    };

    return (
        <div className="flex items-center px-3 py-2 rounded-xl border dark:bg-black w-full">
            <input
                type="text"
                value={value}
                onChange={handleChange}
                onPaste={handlePaste}
                placeholder={placeholder}
                className="w-full"
            />
            {saving ? <Loader size={20} className="animate-spin" /> : <></>}
            {saved ? <CheckCircle2 size={20} className="text-green-600" /> : <></>}
        </div>
    );
}

export default AutoSaveInput
