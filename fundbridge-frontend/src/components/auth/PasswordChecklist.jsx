import PropTypes from 'prop-types'
import { MIN_PASSWORD_LENGTH } from '../../utils/constants'
import { getPasswordChecks } from '../../utils/validators'

const PasswordChecklist = ({ password, className }) => {
  const checks = getPasswordChecks(password)
  const items = [
    {
      key: 'length',
      label: `At least ${MIN_PASSWORD_LENGTH} characters`,
      met: checks.minLength,
    },
    {
      key: 'letter',
      label: 'Contains at least one letter (A-Z or a-z)',
      met: checks.hasLetter,
    },
    {
      key: 'number',
      label: 'Contains at least one number (0-9)',
      met: checks.hasNumber,
    },
    {
      key: 'special',
      label: 'Contains at least one special character (e.g., !@#$%)',
      met: checks.hasSpecial,
    },
  ]

  return (
    <ul className={`grid gap-1 text-xs ${className || ''}`}>
      {items.map((item) => (
        <li
          key={item.key}
          className={`flex items-center gap-2 ${
            item.met ? 'text-emerald-600' : 'text-slate-500'
          }`}
        >
          <span
            className={`inline-flex h-4 w-4 items-center justify-center rounded-full border ${
              item.met ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-white'
            }`}
          >
            {item.met && (
              <svg
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
                className="h-3 w-3"
              >
                <path
                  d="M5 10.5l3 3 7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            )}
          </span>
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  )
}

PasswordChecklist.propTypes = {
  password: PropTypes.string,
  className: PropTypes.string,
}

PasswordChecklist.defaultProps = {
  password: '',
  className: '',
}

export default PasswordChecklist
