function TextInput({ label, type = "text", name, value, onChange, placeholder, required = false, }) {
    
    return (
        <div className="text-input">
            <label htmlFor={name}>{label}</label>

            <input
                id={name}
                name={name}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
            />
        </div>
    );
}

export default TextInput;