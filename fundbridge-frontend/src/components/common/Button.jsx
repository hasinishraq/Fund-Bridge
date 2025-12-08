import PropTypes from 'prop-types'

const variantClassMap = {
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  ghost: 'btn-ghost',
  danger: 'btn-danger',
}

const Button = ({
  variant = 'primary',
  type = 'button',
  children,
  className = '',
  ...props
}) => {
  const variantClass = variantClassMap[variant] || variantClassMap.primary
  return (
    <button
      type={type}
      className={`btn ${variantClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'ghost', 'danger']),
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
}

export default Button
