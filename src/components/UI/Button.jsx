import { forwardRef } from 'react';
import '../../styles/UI.css';

const Button = forwardRef(({
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  fullWidth = false,
  className = "",
  ...props
}, ref) => {
  // Map variant to CSS class
  const variantClass = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    success: 'btn-success',
    danger: 'btn-danger',
    outline: 'btn-outline',
    ghost: 'btn-ghost',
  }[variant] || 'btn-primary';
  
  // Map size to CSS class
  const sizeClass = {
    xs: 'btn-xs',
    sm: 'btn-sm',
    md: 'btn-md',
    lg: 'btn-lg',
  }[size] || 'btn-md';
  
  return (
    <button
      ref={ref}
      disabled={disabled}
      className={`
        btn
        ${variantClass}
        ${sizeClass}
        ${fullWidth ? 'btn-full-width' : ''}
        ${disabled ? 'btn-disabled' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = "Button";

export default Button;
