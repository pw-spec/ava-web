"use client";

interface TextInputProps {
  value: string;
  placeholder?: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  inputType?: "text" | "email";
  autoFocus?: boolean;
}

export function TextInput({
  value,
  placeholder,
  onChange,
  multiline = false,
  inputType = "text",
  autoFocus = false,
}: TextInputProps) {
  if (multiline) {
    return (
      <div className="intake-input-wrap" style={{ padding: 0 }}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          rows={3}
          className="intake-input"
          style={{ paddingTop: 14, paddingBottom: 14, resize: "vertical" }}
        />
      </div>
    );
  }
  return (
    <div className="intake-input-wrap">
      <input
        type={inputType}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={inputType === "email" ? "email" : "off"}
        spellCheck={false}
        className="intake-input"
      />
    </div>
  );
}
