import { useState } from 'react'
import { applyForLoan } from '../../api/loanApi'
import Button from '../../components/common/Button'
import { useAuth } from '../../context/AuthContext'
import { validateLoanPayload } from '../../utils/validators'

const initialState = {
  amount: '',
  tenureMonths: '',
  purpose: '',
}

const ApplyLoan = () => {
  const { user } = useAuth()
  const [values, setValues] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('IDLE')
  const [message, setMessage] = useState('')

  const handleChange = (event) => {
    const { name, value } = event.target
    setValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const validationErrors = validateLoanPayload(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length) {
      return
    }
    setStatus('LOADING')
    try {
      const payload = {
        amount: Number(values.amount),
        tenureMonths: Number(values.tenureMonths),
        purpose: values.purpose,
        borrowerId: user?.id,
      }
      const response = await applyForLoan(payload)
      setMessage(
        `Loan request submitted (id: ${response?.id ?? 'pending'}) with status ${response?.status ?? 'PENDING'}`,
      )
      setValues(initialState)
      setStatus('SUCCESS')
    } catch (error) {
      setMessage(error?.response?.data?.message || 'Unable to submit')
      setStatus('ERROR')
    }
  }

  return (
    <section className="card">
      <h2>Apply for a Loan</h2>
      {message && (
        <p className={`form-message ${status === 'ERROR' ? 'error' : 'success'}`}>
          {message}
        </p>
      )}
      <form className="grid-form" onSubmit={handleSubmit}>
        <label htmlFor="amount">
          Amount
          <input
            id="amount"
            name="amount"
            type="number"
            min="1000"
            value={values.amount}
            onChange={handleChange}
            placeholder="1000"
          />
          {errors.amount && <span className="field-error">{errors.amount}</span>}
        </label>

        <label htmlFor="tenureMonths">
          Tenure (months)
          <input
            id="tenureMonths"
            name="tenureMonths"
            type="number"
            min="1"
            value={values.tenureMonths}
            onChange={handleChange}
            placeholder="12"
          />
          {errors.tenureMonths && (
            <span className="field-error">{errors.tenureMonths}</span>
          )}
        </label>

        <label htmlFor="purpose" className="full-width">
          Purpose
          <textarea
            id="purpose"
            name="purpose"
            rows="3"
            value={values.purpose}
            onChange={handleChange}
            placeholder="Working capital, tuition, etc."
          />
          {errors.purpose && (
            <span className="field-error">{errors.purpose}</span>
          )}
        </label>

        <div className="form-actions full-width">
          <Button type="submit" disabled={status === 'LOADING'}>
            {status === 'LOADING' ? 'Submitting...' : 'Submit Application'}
          </Button>
        </div>
      </form>
    </section>
  )
}

export default ApplyLoan
