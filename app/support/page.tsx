import { ChevronDown, LifeBuoy, Mail, MessageCircleQuestion } from "lucide-react";
import { MentorChat } from "@/components/mentor-chat";
import { loadMember } from "@/lib/entrepreneur";

const SUPPORT_EMAIL = "support@mulastream.com";

const QUICK_REPLIES = ["How do I pass Month 1?", "What is an Investor Trust Pack?", "How do I upload evidence?"];

const FAQS: { question: string; answer: React.ReactNode }[] = [
  {
    question: "What is the difference between Debt and Equity funding?",
    answer: (
      <>
        <p>
          <b>Debt</b> is a loan. You borrow money and pay it back with interest over an agreed time, and you keep full ownership of
          your business. It suits businesses with steady cash flow that can make regular repayments.
        </p>
        <p>
          <b>Equity</b> means an investor gives you money in exchange for a share of your business. You don&apos;t repay a loan, but
          you give up part of the ownership and future profits. It suits businesses that want to grow fast and benefit from an
          experienced partner.
        </p>
        <p>The right choice depends on your cash flow and how much control you want to keep, so talk to an adviser about your situation.</p>
      </>
    ),
  },
  {
    question: "How does the AI assess my business?",
    answer: (
      <>
        <p>
          First, we check that what you shared is really a business plan or description. Then the AI scores your business out of 10
          in 10 areas, including market, scalability, revenue, profitability and customer validation. Your Investment Readiness Score
          is the total, out of 100.
        </p>
        <p>
          The AI keeps facts proven by your checked documents separate from things you tell us. Claims without proof can only score up
          to 6 in an area, so uploading documents raises your score. You also get an action plan and a &quot;Tough Love&quot; list of
          what an investor will worry about.
        </p>
      </>
    ),
  },
  {
    question: "What documents do I need to upload for verification?",
    answer: (
      <>
        <p>Upload documents that prove your business is real and earning money:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Signed contracts with customers or suppliers</li>
          <li>Invoices you have issued</li>
          <li>Bank statements, as a PDF downloaded from your bank (not a photo); our AI accountant checks the deposits</li>
          <li>Your BIPA business registration certificate</li>
          <li>A NamRA certificate of good standing</li>
        </ul>
        <p>Files can be PDF, Word, Excel, CSV or a photo, up to 10 MB. Upload them in the Evidence Centre.</p>
      </>
    ),
  },
  {
    question: "How long does the incubation programme take?",
    answer: (
      <p>
        The programme has three months, each with a gate to pass: Month 1 (market validation), Month 2 (profitability) and Month 3
        (investment readiness). You move to the next month as soon as you pass its gate, so you can go faster by following your action
        plan and uploading proof. Most businesses take about three months.
      </p>
    ),
  },
  {
    question: "Can I edit my business profile after submitting an assessment?",
    answer: (
      <p>
        Yes. You can update your business name, sector, target market and description at any time on the Business Profile page. Your
        score doesn&apos;t change on its own: run the assessment again from the Assessment page when your business has changed, and
        your score and action plan will be updated.
      </p>
    ),
  },
];

export default async function SupportPage() {
  const { firstName, role } = await loadMember();

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      {/* Hero */}
      <section className="investment-bg rounded-2xl px-6 py-10 text-white md:px-10">
        <div className="relative z-10 flex items-start gap-4">
          <span className="hidden h-14 w-14 shrink-0 place-items-center rounded-2xl bg-orange-500/20 text-orange-300 sm:grid">
            <LifeBuoy className="h-7 w-7" />
          </span>
          <div>
            <h1 className="text-3xl font-bold">Help &amp; Support</h1>
            <p className="mt-2 max-w-xl text-slate-300">Get instant answers from our AI assistant, or browse our guides.</p>
          </div>
        </div>
      </section>

      {/* AI assistant */}
      <section aria-labelledby="assistant-heading">
        <h2 id="assistant-heading" className="mb-1 flex items-center gap-2 text-xl font-bold text-slate-800">
          <MessageCircleQuestion className="h-5 w-5 text-orange-500" /> Ask the AI Assistant
        </h2>
        <p className="mb-4 text-sm text-gray-500">
          {role === "entrepreneur"
            ? "It knows your business details and score, so its answers are about you."
            : "Ask anything about how MulaStream works."}
        </p>
        <MentorChat
          mode="member"
          variant="embedded"
          firstName={firstName}
          title="MulaStream Help Assistant"
          greeting={`Hi ${firstName}! 👋 How can I help? Ask me anything about MulaStream or your business, or tap a question below.`}
          quickReplies={QUICK_REPLIES}
        />
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading">
        <h2 id="faq-heading" className="mb-4 text-xl font-bold text-slate-800">
          Frequently Asked Questions
        </h2>
        <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 font-medium text-slate-800 transition hover:bg-gray-50 [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition group-open:rotate-180 group-open:text-orange-500" />
              </summary>
              <div className="space-y-3 px-6 pb-6 text-sm leading-relaxed text-gray-600">{faq.answer}</div>
            </details>
          ))}
        </div>
      </section>

      {/* Contact */}
      <section className="flex flex-col items-start justify-between gap-4 rounded-xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Need human help?</h2>
          <p className="mt-1 text-sm text-gray-500">Email our support team and a person will get back to you.</p>
        </div>
        <a
          href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("MulaStream support request")}`}
          className="inline-flex items-center gap-2 rounded-lg bg-orange-500 px-5 py-3 text-sm font-medium text-white transition hover:bg-orange-600"
        >
          <Mail className="h-4 w-4" /> Email {SUPPORT_EMAIL}
        </a>
      </section>
    </div>
  );
}
