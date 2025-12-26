import ChatClient from "../ChatClient";

type ChatDetailPageProps = {
  params: { id: string };
};

export default function ChatDetailPage({ params }: ChatDetailPageProps) {
  return (
    <div className="h-full min-h-0">
      <ChatClient initialConversationId={params.id} />
    </div>
  );
}
