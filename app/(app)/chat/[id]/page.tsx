import ChatClient from "../ChatClient";

type ChatDetailPageProps = {
  params: { id: string };
};

export default function ChatDetailPage({ params }: ChatDetailPageProps) {
  return <ChatClient initialConversationId={params.id} />;
}
