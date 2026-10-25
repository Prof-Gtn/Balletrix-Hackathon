import { MentorChat } from "@/components/mentor-chat";
import { PageTitle } from "@/components/page-title";
import { loadMember } from "@/lib/entrepreneur";

export default async function MentorPage() {
  const { firstName } = await loadMember();

  return (
    <div className="mx-auto max-w-4xl space-y-4 p-4 md:p-8">
      <PageTitle title="AI Mentor" subtitle="Ask questions about your business or about using MulaStream. Not legal or financial advice." />
      <MentorChat firstName={firstName} />
    </div>
  );
}
