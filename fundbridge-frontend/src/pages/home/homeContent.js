const homeContent = {
  hero: {
    eyebrow: 'Digital Lending Infrastructure',
    title: 'Bridge the gap between visionary ideas and the funds to build them.',
    lede: 'FundBridge powers community lenders with embedded wallets, realtime compliance, and a borrower-first experience in one modern dashboard.',
    metrics: [
      { label: 'Active credit lines', value: 'BDT 8.5Cr' },
      { label: 'Yearly growth', value: '+128%' },
      { label: 'Human support', value: '24/7' },
    ],
    pipeline: [
      {
        title: 'Renewable energy hub',
        meta: 'BDT 3.5Cr - Awaiting approval',
        status: 'KYC',
        statusStyle: 'warning',
      },
      {
        title: 'Agritech working capital',
        meta: 'BDT 1.25Cr - Funded',
        status: 'Paid',
        statusStyle: 'success',
      },
      {
        title: 'Women in retail expansion',
        meta: 'BDT 80L - Disbursing',
        status: 'In flight',
        statusStyle: 'info',
      },
    ],
    walletBalance: 'BDT 21,45,000.22',
    cardTitle: 'Pipeline overview',
    cardStatus: 'Live',
  },
  features: [
    {
      title: 'Embedded Wallets',
      description:
        'Securely store disbursements, repay loans, and view cash flow inside a single treasury-grade wallet.',
      badge: 'Security-first',
    },
    {
      title: 'Smart Loan Matching',
      description:
        'We pair every borrower request with the best-fit lender criteria to keep approvals fast and fair.',
      badge: 'AI enhanced',
    },
    {
      title: 'Realtime Compliance',
      description:
        'Automated AML, KYC, and credit rules run in the background so your team can focus on growth.',
      badge: 'Audit ready',
    },
  ],
  steps: [
    {
      title: 'Create your account',
      copy:
        'Tell us about your organisation and funding goals so we can personalise your dashboard experience.',
    },
    {
      title: 'Connect your wallet',
      copy:
        'Verify banking channels or mobile money rails, then top up to unlock instant disbursement workflows.',
    },
    {
      title: 'Apply and track',
      copy:
        'Submit loan requests, monitor approvals, and automate repayments with clear milestone alerts.',
    },
  ],
  stats: [
    { label: 'Disbursed on FundBridge', value: 'BDT 480Cr+', accent: 'primary' },
    { label: 'Average approval time', value: '36 hrs', accent: 'secondary' },
    { label: 'Borrower satisfaction', value: '4.9 / 5', accent: 'tertiary' },
  ],
  testimonials: [
    {
      quote:
        'FundBridge helped us go from idea to disbursing capital in less than two weeks. The transparency and tooling are unmatched.',
      author: 'Diane Mensah',
      role: 'COO, Northstar Microfinance',
    },
    {
      quote:
        'Every loan cycle is documented, reconciled, and payable right from the dashboard. Our borrowers finally get the clarity they deserve.',
      author: 'Victor Adewale',
      role: 'Head of Lending, Brightwave Capital',
    },
  ],
  partners: ['UnityTrust', 'NovaBank', 'AfriPay', 'Coastal MFB', 'ZenithPay'],
  cta: {
    eyebrow: 'Ready to build?',
    heading: 'Spin up your borrower workspace today.',
    copy:
      'Create an account and invite your team for a guided onboarding session tailored to your lending thesis.',
  },
  faqs: [
    {
      question: 'How long does onboarding take?',
      answer:
        'Most teams are ready within a day. Add your organisation details, complete KYC, and connect a funding source.',
    },
    {
      question: 'Do borrowers and lenders use the same dashboard?',
      answer:
        'Each role has a tailored workspace, but everything lives under one secure FundBridge account.',
    },
    {
      question: 'Which currencies are supported?',
      answer:
        'BDT is supported by default. Additional currencies can be enabled once your treasury setup is verified.',
    },
    {
      question: 'How do in-app notifications work?',
      answer:
        'Activity alerts appear in the dashboard bell, and your team can configure email or in-app delivery.',
    },
    {
      question: 'What happens if a borrower misses a payment?',
      answer:
        'We trigger overdue workflows, notify stakeholders, and keep repayment timelines visible to your team.',
    },
    {
      question: 'Is FundBridge compliant-ready?',
      answer:
        'Yes. Automated KYC and audit trails are built in, and reports can be exported for regulators.',
    },
  ],
}

export default homeContent
