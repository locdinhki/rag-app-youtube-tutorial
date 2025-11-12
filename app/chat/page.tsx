import ChatInterface from '@/components/chat-interface';

export default function ChatPage() {
  return (
    <div className="fixed inset-0 top-16 flex flex-col">
      <div className="border-b bg-white p-6">
        <h1 className="text-3xl font-bold text-gray-900">Ask Questions</h1>
        <p className="text-gray-600 mt-2">
          Ask anything about tax lien redemption in Colorado counties
        </p>
      </div>
      <div className="flex-1 overflow-hidden">
        <ChatInterface />
      </div>
    </div>
  );
}
