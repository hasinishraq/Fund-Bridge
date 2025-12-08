package com.fundbridge.apigateway.web;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
public class HomeContentController {

    @GetMapping("/home")
    public HomeContentResponse home() {
        return new HomeContentResponse(
                heroSection(),
                featureCards(),
                stepCards(),
                statCards(),
                testimonials(),
                partners(),
                ctaBlock()
        );
    }

    private HeroSection heroSection() {
        return new HeroSection(
                "Digital Lending Infrastructure",
                "Bridge the gap between visionary ideas and the funds to build them.",
                "FundBridge powers community lenders with embedded wallets, realtime compliance, and a borrower-first experience in one modern dashboard.",
                List.of(
                        new Metric("Active credit lines", "$8.5M"),
                        new Metric("Yearly growth", "+128%"),
                        new Metric("Human support", "24/7")
                ),
                List.of(
                        new PipelineItem("Renewable energy hub", "USD 350,000 - Awaiting approval", "KYC", "warning"),
                        new PipelineItem("Agritech working capital", "USD 125,000 - Funded", "Paid", "success"),
                        new PipelineItem("Women in retail expansion", "USD 80,000 - Disbursing", "In flight", "info")
                ),
                "$214,500.22",
                "Pipeline overview",
                "Live"
        );
    }

    private List<FeatureCard> featureCards() {
        return List.of(
                new FeatureCard("Embedded Wallets",
                        "Securely store disbursements, repay loans, and view cash flow inside a single treasury-grade wallet.",
                        "Security-first"),
                new FeatureCard("Smart Loan Matching",
                        "We pair every borrower request with the best-fit lender criteria to keep approvals fast and fair.",
                        "AI enhanced"),
                new FeatureCard("Realtime Compliance",
                        "Automated AML, KYC, and credit rules run in the background so your team can focus on growth.",
                        "Audit ready")
        );
    }

    private List<StepCard> stepCards() {
        return List.of(
                new StepCard("Create your account",
                        "Tell us about your organisation and funding goals so we can personalise your dashboard experience."),
                new StepCard("Connect your wallet",
                        "Verify banking channels or mobile money rails, then top up to unlock instant disbursement workflows."),
                new StepCard("Apply and track",
                        "Submit loan requests, monitor approvals, and automate repayments with clear milestone alerts.")
        );
    }

    private List<StatCard> statCards() {
        return List.of(
                new StatCard("Disbursed on FundBridge", "$48M+", "primary"),
                new StatCard("Average approval time", "36 hrs", "secondary"),
                new StatCard("Borrower satisfaction", "4.9 / 5", "tertiary")
        );
    }

    private List<Testimonial> testimonials() {
        return List.of(
                new Testimonial(
                        "FundBridge helped us go from idea to disbursing capital in less than two weeks. The transparency and tooling are unmatched.",
                        "Diane Mensah",
                        "COO, Northstar Microfinance"
                ),
                new Testimonial(
                        "Every loan cycle is documented, reconciled, and payable right from the dashboard. Our borrowers finally get the clarity they deserve.",
                        "Victor Adewale",
                        "Head of Lending, Brightwave Capital"
                )
        );
    }

    private List<String> partners() {
        return List.of("UnityTrust", "NovaBank", "AfriPay", "Coastal MFB", "ZenithPay");
    }

    private CtaBlock ctaBlock() {
        return new CtaBlock(
                "Ready to build?",
                "Spin up your borrower workspace today.",
                "Create an account and invite your team for a guided onboarding session tailored to your lending thesis."
        );
    }

    public record HomeContentResponse(
            HeroSection hero,
            List<FeatureCard> features,
            List<StepCard> steps,
            List<StatCard> stats,
            List<Testimonial> testimonials,
            List<String> partners,
            CtaBlock cta
    ) {
    }

    public record HeroSection(
            String eyebrow,
            String title,
            String lede,
            List<Metric> metrics,
            List<PipelineItem> pipeline,
            String walletBalance,
            String cardTitle,
            String cardStatus
    ) {
    }

    public record Metric(String label, String value) {
    }

    public record PipelineItem(String title, String meta, String status, String statusStyle) {
    }

    public record FeatureCard(String title, String description, String badge) {
    }

    public record StepCard(String title, String copy) {
    }

    public record StatCard(String label, String value, String accent) {
    }

    public record Testimonial(String quote, String author, String role) {
    }

    public record CtaBlock(String eyebrow, String heading, String copy) {
    }
}
