'use client';

import { useState, useRef, useEffect } from 'react';
import ChatInput from './chat-input';
import { sendChatMessage, parseChatStream, ChatMetadata, APIError, NetworkError } from '@/lib/api-client';
import { COLORADO_COUNTIES, type ColoradoCounty } from '@/lib/types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface Source {
  county: string;
  documentTitle: string;
  sectionHeader?: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  sources?: Source[];
  isStreaming?: boolean;
}

const exampleQuestions = [
  "What's the redemption period in Boulder County?",
  'How much interest do tax liens earn?',
  'What documents are required for redemption?',
  'How do I calculate the total redemption amount?',
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countyFilter, setCountyFilter] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isInitialMount = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Only auto-scroll if it's not the initial mount
    if (!isInitialMount.current) {
      scrollToBottom();
    } else {
      isInitialMount.current = false;
    }
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    // Create assistant message placeholder
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      // Call API and get stream
      const stream = await sendChatMessage(content, {
        county: countyFilter || undefined,
      });

      // Parse streaming response
      await parseChatStream(stream, {
        onToken: (token) => {
          // Update assistant message with new token
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, content: msg.content + token, isStreaming: true }
                : msg
            )
          );
        },
        onMetadata: (metadata: ChatMetadata) => {
          // Add sources to assistant message
          const sources: Source[] = metadata.sources.map((s) => ({
            county: s.county,
            documentTitle: s.documentTitle,
            sectionHeader: s.section,
          }));

          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId
                ? { ...msg, sources, isStreaming: false }
                : msg
            )
          );
        },
        onError: (err) => {
          console.error('Streaming error:', err);
          setError(err.message || 'Failed to receive response');

          // Remove the empty assistant message
          setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
        },
        onComplete: () => {
          // Mark streaming as complete
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === assistantMessageId ? { ...msg, isStreaming: false } : msg
            )
          );
        },
      });
    } catch (err) {
      console.error('Chat error:', err);

      let errorMessage = 'An unexpected error occurred. Please try again.';

      if (err instanceof APIError) {
        if (err.status === 400) {
          errorMessage = 'Invalid message. Please try rephrasing your question.';
        } else if (err.status === 500) {
          errorMessage = err.message || 'Server error. Please try again later.';
        } else {
          errorMessage = err.message;
        }
      } else if (err instanceof NetworkError) {
        errorMessage = 'Failed to connect. Please check your internet connection.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }

      setError(errorMessage);

      // Remove the empty assistant message
      setMessages((prev) => prev.filter((msg) => msg.id !== assistantMessageId));
    } finally {
      setIsLoading(false);
    }
  };

  const handleExampleClick = (question: string) => {
    handleSendMessage(question);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const handleRetry = () => {
    setError(null);
    // Find the last user message and retry
    const lastUserMessage = [...messages].reverse().find((msg) => msg.role === 'user');
    if (lastUserMessage) {
      handleSendMessage(lastUserMessage.content);
    }
  };

  const handleClearFilter = () => {
    setCountyFilter(null);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <h2 className="text-2xl font-semibold text-gray-700 mb-4">
              Start by asking a question about tax lien redemption in Colorado
            </h2>
            <p className="text-gray-500 mb-6">Try one of these examples:</p>
            <div className="flex flex-wrap gap-3 justify-center max-w-2xl">
              {exampleQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleExampleClick(question)}
                  disabled={isLoading}
                  className="px-4 py-2 bg-white border border-gray-300 rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in`}
                style={{
                  animation: `fadeIn 0.3s ease-in ${index * 0.1}s backwards`,
                }}
              >
                <div
                  className={`max-w-[80%] ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                      : 'bg-white text-gray-900 rounded-2xl rounded-tl-sm shadow-md'
                  } px-5 py-3`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span
                      className={`text-xs ${
                        message.role === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}
                    >
                      {formatTime(message.timestamp)}
                    </span>
                  </div>

                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2">
                        Sources:
                      </p>
                      {message.sources.map((source, idx) => (
                        <div
                          key={idx}
                          className="text-xs text-gray-600 mb-1 flex flex-wrap items-center gap-2"
                        >
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 rounded-md font-medium">
                            {source.county} County
                          </span>
                          <span>{source.documentTitle}</span>
                          {source.sectionHeader && (
                            <>
                              <span className="text-gray-400">•</span>
                              <span className="italic">{source.sectionHeader}</span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Error Banner */}
            {error && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button variant="outline" size="sm" onClick={handleRetry} className="ml-4">
                    Retry
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="border-t bg-white p-4">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* County Filter */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-gray-700">Filter by County:</label>
            <Select value={countyFilter || 'all'} onValueChange={(value) => setCountyFilter(value === 'all' ? null : value)}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Counties</SelectItem>
                {COLORADO_COUNTIES.map((county) => (
                  <SelectItem key={county} value={county}>
                    {county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {countyFilter && (
              <Badge variant="secondary" className="gap-1">
                {countyFilter}
                <button onClick={handleClearFilter} className="ml-1 hover:bg-gray-300 rounded-full p-0.5">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>

          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
