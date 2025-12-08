import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchLoanDetails } from '../../api/loanApi';
import Loader from '../../components/common/Loader';
import { CURRENCY_FORMATTER } from '../../utils/constants';

const LoanDetails = () => {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [status, setStatus] = useState('LOADING');

  useEffect(() => {
    const loadLoan = async () => {
      try {
        const response = await fetchLoanDetails(id);
        setLoan(response);
        setStatus('SUCCESS');
      } catch (error) {
        console.error(error);
        setStatus('ERROR');
      }
    };
    loadLoan();
  }, [id]);

  if (status === 'LOADING') {
    return (
      <div className="page-center">
        <Loader />
      </div>
    );
  }

  if (status === 'ERROR') {
    return (
      <div className="card error-card">
        <p>Unable to load loan details.</p>
      </div>
    );
  }

  if (!loan) {
    return null;
  }

  return (
    <section className="card">
      <h2>Loan #{loan.id}</h2>
      <div className="details-grid">
        <div>
          <p className="muted">Amount</p>
          <h3>{CURRENCY_FORMATTER.format(loan.amount)}</h3>
        </div>
        <div>
          <p className="muted">Tenure</p>
          <h3>{loan.tenureMonths} months</h3>
        </div>
        <div>
          <p className="muted">Status</p>
          <span className={`status-chip status-${loan.status}`}>
            {loan.status}
          </span>
        </div>
        <div>
          <p className="muted">Purpose</p>
          <p>{loan.purpose}</p>
        </div>
        <div>
          <p className="muted">Created</p>
          <p>
            {loan.createdAt
              ? new Date(loan.createdAt).toLocaleString()
              : 'Not available'}
          </p>
        </div>
      </div>
    </section>
  );
};

export default LoanDetails;
