type SearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  'aria-label'?: string;
};

export function SearchInput({
  value,
  onChange,
  placeholder = 'بحث...',
  'aria-label': ariaLabel = 'بحث',
}: SearchInputProps) {
  return (
    <div className="search-input">
      <input
        type="search"
        className="input search-input__field"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
    </div>
  );
}
